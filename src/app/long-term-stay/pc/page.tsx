'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getImagePath } from '@/utils/path';
import { requestNicepayPayment, openNicepayWindow } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { sendVerificationCode, verifyCode } from '@/services/smsService';
import TravelInfoStep from '@/components/travel/TravelInfoStep';
import ParticipantInfoStep from '@/components/travel/ParticipantInfoStep';
import RiskActivityStep from '@/components/travel/RiskActivityStep';
import ContractInfoStep from '@/components/travel/ContractInfoStep';
import PaymentStep from '@/components/travel/PaymentStep';
import CompletionStep from '@/components/travel/CompletionStep';
import DangerousActivityModal from '@/components/travel/DangerousActivityModal';
import RestrictedCountryModal from '@/components/travel/RestrictedCountryModal';
import ConsentModal from '@/components/travel/ConsentModal';
import ExcelUploadModal from '@/components/travel/ExcelUploadModal';
import { PlanType, PlanInfo, Participant, CalculatedPremiums, PaymentMethod, PaymentSubMethod, Gender } from '@/components/travel/types';
import './page.css';

export default function PCLongTermStayPage() {
  // 회원 정보 가져오기
  const { member, isLoggedIn } = useAuth();
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  
  // Get current hour + 2 hours (default time)
  // 예: 오후 10시 5분이면 +2시간 = 24시, 오후 11시 3분이면 +2시간 = 01시
  const currentHour = today.getHours();
  const calculatedHour = currentHour + 2;
  // 24시가 되면 24로 유지, 25시 이상이면 1시부터 시작 (0시는 없음)
  const defaultHour = calculatedHour === 24 ? 24 : (calculatedHour > 24 ? calculatedHour % 24 || 24 : calculatedHour);

  const [departureDate, setDepartureDate] = useState(formattedDate);
  const [departureTime, setDepartureTime] = useState(String(defaultHour).padStart(2, '0'));
  const [arrivalDate, setArrivalDate] = useState(formattedDate);
  const [arrivalTime, setArrivalTime] = useState(String(defaultHour).padStart(2, '0'));
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [travelCountry, setTravelCountry] = useState<string>(''); // 해외여행보험용 여행국가
  const [travelPurpose, setTravelPurpose] = useState<string>(''); // 해외장기체류보험용 여행목적 (STEP 1에서 선택)
  
  // 해외장기체류보험 여행목적 옵션
  const longTermPurposeOptions = [
    { value: '유학/어학연수', label: '유학/어학연수' },
    { value: '해외출장/주재원/교환교수', label: '해외출장/주재원/교환교수' },
    { value: '워킹홀리데이', label: '워킹홀리데이' },
  ];

  // 보험료 계산 결과
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [hasMedicalExpense, setHasMedicalExpense] = useState(true); // 실손의료비 포함 여부
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [planInfo, setPlanInfo] = useState<Record<string, PlanInfo> | null>(null);
  const [participantCount, setParticipantCount] = useState<1 | 2>(1); // 1인 가입 또는 2인 이상 가입
  const [isCalculating, setIsCalculating] = useState(false);
  const [currencyPlan, setCurrencyPlan] = useState<'원화' | '외화'>('원화'); // 해외장기체류보험용 통화 플랜

  // 가입자 정보 입력 화면
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [showStep2_1, setShowStep2_1] = useState(false); // STEP2-1 화면 (위험활동 확인, 여행목적)
  const [showStep3, setShowStep3] = useState(false); // STEP3 화면 (계약정보, 결제)
  const [showPaymentScreen, setShowPaymentScreen] = useState(false); // 결제 화면
  const [showCompletionScreen, setShowCompletionScreen] = useState(false); // 완료 화면
  const [showExcelModal, setShowExcelModal] = useState(false);
  
  // STEP2-1 관련 상태
  const [hasDangerousActivity, setHasDangerousActivity] = useState<boolean | null>(null);
  const [showDangerousActivityModal, setShowDangerousActivityModal] = useState(false);
  const [isCurrentlyAbroad, setIsCurrentlyAbroad] = useState<boolean | null>(null); // 현재 출국/해외 체류 중
  const [hasRestrictedCountry, setHasRestrictedCountry] = useState<boolean | null>(null); // 제한국가 포함 여부
  const [showRestrictedCountryModal, setShowRestrictedCountryModal] = useState(false);
  
  // 동의서 모달 관련 상태
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentAll, setConsentAll] = useState(false);
  const [consentItems, setConsentItems] = useState({
    siteUse: false,
    personalInfo: false,
    sensitiveInfo: false,
    terms: false,
  });
  
  // STEP3 관련 상태
  const [contractConfirmed, setContractConfirmed] = useState(false);
  
  // 결제 관련 상태
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentSubMethod, setPaymentSubMethod] = useState<PaymentSubMethod | null>(null);
  const [accidentFreeCash, setAccidentFreeCash] = useState(0);
  const [useAccidentFreeCash, setUseAccidentFreeCash] = useState(0);
  
  // 무통장입금 관련 상태
  const [depositBank, setDepositBank] = useState<string>('');
  const [depositorName, setDepositorName] = useState<string>('');
  const [expectedDepositYear, setExpectedDepositYear] = useState<number>(new Date().getFullYear());
  const [expectedDepositMonth, setExpectedDepositMonth] = useState<number>(new Date().getMonth() + 1);
  const [expectedDepositDay, setExpectedDepositDay] = useState<number>(new Date().getDate());
  
  // 수기카드 관련 상태
  const [cardType, setCardType] = useState<'본인카드' | '기타카드'>('본인카드');
  const [cardCategory, setCardCategory] = useState<string>('');
  const [cardNumber1, setCardNumber1] = useState<string>('');
  const [cardNumber2, setCardNumber2] = useState<string>('');
  const [cardNumber3, setCardNumber3] = useState<string>('');
  const [cardNumber4, setCardNumber4] = useState<string>('');
  const [cardExpiryMonth, setCardExpiryMonth] = useState<string>('');
  const [cardExpiryYear, setCardExpiryYear] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>('');
  const [cardholderResidentNumber, setCardholderResidentNumber] = useState<string>('');
  const [approvalYear, setApprovalYear] = useState<number>(new Date().getFullYear());
  const [approvalMonth, setApprovalMonth] = useState<number>(new Date().getMonth() + 1);
  const [approvalDay, setApprovalDay] = useState<number>(new Date().getDate());
  const [normalPremium, setNormalPremium] = useState<number>(0);
  const [receiptPremium, setReceiptPremium] = useState<number>(0);
  const [isSamePremium, setIsSamePremium] = useState(false);

  // 인증번호 관련 상태
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);

  // 보험료 계산 결과
  const [calculatedPremiums, setCalculatedPremiums] = useState<CalculatedPremiums | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 1,
      name: '',
      englishName: '',
      nationality: '내국인',
      birthDate: '',
      gender: '남자',
      email1: '',
      email2: '',
      phone: '',
      isVerified: false,
    },
  ]);

  // 시간 옵션: 1시부터 24시까지 (0시 제외, 24시 포함)
  const timeOptions = Array.from({ length: 24 }, (_, i) => i + 1);

  // 주민번호에서 나이 계산
  const calculateAgeFromBirthDate = (birthDateStr: string): number | null => {
    if (!birthDateStr || birthDateStr.length !== 8) return null;
    
    try {
      const year = parseInt(birthDateStr.substring(0, 4));
      const month = parseInt(birthDateStr.substring(4, 6));
      const day = parseInt(birthDateStr.substring(6, 8));
      
      const today = new Date();
      const birthDate = new Date(year, month - 1, day);
      let age = today.getFullYear() - year;
      
      // 생일이 지나지 않았으면 나이 -1
      if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
        age--;
      }
      
      return age;
    } catch (error) {
      return null;
    }
  };

  // 주민번호에서 성별 추출
  const getGenderFromBirthDate = (birthDateStr: string, genderInput: 'male' | 'female'): Gender => {
    return genderInput === 'male' ? '남자' : '여자';
  };

  // STEP2로 이동 시 화면 상단으로 스크롤
  useEffect(() => {
    if (showParticipantForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showParticipantForm]);

  // 워킹홀리데이인 경우 자동으로 외화 플랜으로 설정
  useEffect(() => {
    if (travelPurpose === '워킹홀리데이' && currencyPlan !== '외화') {
      setCurrencyPlan('외화');
    }
  }, [travelPurpose, currencyPlan]);

  // 인증번호 타이머
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  // 기간 검증 (해외장기체류보험 최소 3개월 초과, 최대 1년)
  const validateDuration = (): { valid: boolean; message?: string } => {
    const departure = new Date(`${departureDate}T${departureTime}:00:00`);
    const arrival = new Date(`${arrivalDate}T${arrivalTime}:00:00`);
    
    if (arrival <= departure) {
      return { valid: false, message: '도착일시는 출발일시보다 이후여야 합니다.' };
    }
    
    const diffTime = arrival.getTime() - departure.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 해외장기체류보험은 최소 3개월 초과(91일 이상), 최대 1년(365일) 이하
    if (diffDays <= 90) {
      return { valid: false, message: '해외장기체류보험은 3개월 초과시 가능합니다.' };
    }
    if (diffDays > 365) {
      return { valid: false, message: '해외장기체류보험은 최대 1년(365일)까지 가능합니다.' };
    }
    
    return { valid: true };
  };

  // 보험료 재계산 (실손의료비 옵션 변경 시)
  const recalculatePremium = useCallback(async (medicalExpenseValue?: boolean) => {
    if (!planInfo || !selectedPlan || !birthDate || birthDate.length !== 8) return;

    setIsCalculating(true);

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const genderValue = getGenderFromBirthDate(birthDate, gender);
      const age = calculateAgeFromBirthDate(birthDate);

      if (age === null) return;

      if (!planInfo) return;
      
      const updatedPlans = { ...planInfo };
      const medicalExpense = medicalExpenseValue !== undefined ? medicalExpenseValue : hasMedicalExpense;

      // 각 플랜별 보험료 재계산 (planInfo에 있는 모든 플랜)
      for (const planType of Object.keys(planInfo)) {
        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: travelPurpose || '유학/어학연수', // 여행목적이 insurance_type으로 사용됨
              age: age,
              gender: genderValue,
              plan_type: planType,
              has_medical_expense: medicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: String(travelPurpose === '워킹홀리데이' ? '외화' : (currencyPlan || '원화')),
              travel_country: travelCountry,
            }),
          });

          const data = await response.json();
          if (data.success && updatedPlans[planType]) {
            updatedPlans[planType].premium = data.premium;
          }
        } catch (error) {
          console.error(`보험료 재계산 오류 (${planType}):`, error);
        }
      }

      setPlanInfo(updatedPlans);
    } catch (error) {
      console.error('보험료 재계산 오류:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [planInfo, selectedPlan, birthDate, gender, departureDate, departureTime, arrivalDate, arrivalTime, hasMedicalExpense]);

  // 실손의료비 옵션 변경 핸들러
  const handleMedicalExpenseChange = async (value: boolean) => {
    setHasMedicalExpense(value);
    // 옵션 변경 후 보험료 재계산
    if (showPlanSelection && planInfo) {
      await recalculatePremium(value);
    }
  };

  // 가입자 보험료 계산 함수
  const handleCalculateParticipants = async () => {
    // 가입자 정보 검증
    if (participants.length === 0) {
      alert('가입자 정보를 입력해주세요.');
      return;
    }

    // 필수 정보 검증
    for (const participant of participants) {
      if (!participant.name || !participant.birthDate || participant.birthDate.length !== 8) {
        alert('모든 가입자의 이름과 생년월일을 입력해주세요.');
        return;
      }
    }

    // 대표 가입자 인증 확인
    if (!participants[0].isVerified) {
      alert('대표 가입자의 휴대폰 인증을 완료해주세요.');
      return;
    }

    setIsCalculating(true);

    try {
      const calculatedParticipants: CalculatedPremiums['participants'] = [];
      let totalPremium = 0;

      for (const participant of participants) {
        // 나이 계산
        const age = calculateAgeFromBirthDate(participant.birthDate);
        if (age === null) {
          alert(`${participant.name}의 생년월일을 올바르게 입력해주세요.`);
          setIsCalculating(false);
          return;
        }

        // 워킹홀리데이인 경우 15-35세만 가능
        if (travelPurpose === '워킹홀리데이') {
          if (age < 15 || age > 35) {
            alert(`${participant.name}님은 워킹홀리데이 보험 가입 대상이 아닙니다. (15세 이상 35세 이하만 가능)`);
            setIsCalculating(false);
            return;
          }
        }

        // 플랜 타입 결정 (STEP1에서 선택한 플랜 사용)
        const planType = selectedPlan || '실속플랜';

        // 보험료 계산 API 호출
        const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
        const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-premium`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: travelPurpose || '유학/어학연수',
            age: age,
            gender: participant.gender,
            plan_type: planType,
            has_medical_expense: hasMedicalExpense ? 1 : 0,
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            currency_plan: String(travelPurpose === '워킹홀리데이' ? '외화' : (currencyPlan || '원화')),
            travel_country: travelCountry,
          }),
        });

        const data = await response.json();

        if (data.success) {
          calculatedParticipants.push({
            id: participant.id,
            name: participant.name,
            gender: participant.gender,
            birthDate: participant.birthDate,
            planType: planType,
            premium: data.premium,
          });
          totalPremium += data.premium;
        } else {
          alert(`${participant.name}의 보험료 계산에 실패했습니다: ${data.message}`);
          setIsCalculating(false);
          return;
        }
      }

      // 십원단위 절삭 (예: 317852 → 317850)
      const roundedTotalPremium = Math.floor(totalPremium / 10) * 10;

      setCalculatedPremiums({
        participants: calculatedParticipants,
        totalPremium: roundedTotalPremium,
      });
    } catch (error) {
      console.error('보험료 계산 오류:', error);
      alert('보험료 계산에 실패했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  // 보험료 계산
  const handleCalculate = async (overrideCurrencyPlan?: '원화' | '외화') => {
    // 입력 검증
    if (!departureDate || !arrivalDate || !birthDate || birthDate.length !== 8) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    // 해외장기체류보험은 여행목적 필수
    if (!travelPurpose) {
      alert('여행목적을 선택해주세요.');
      return;
    }

    // 해외장기체류보험은 여행국가 필수
    if (!travelCountry) {
      alert('여행국가를 선택해주세요.');
      return;
    }

    // 기간 검증
    const durationValidation = validateDuration();
    if (!durationValidation.valid) {
      alert(durationValidation.message);
      return;
    }

    // 나이 계산
    const age = calculateAgeFromBirthDate(birthDate);
    if (age === null) {
      alert('생년월일을 올바르게 입력해주세요.');
      return;
    }

    // 워킹홀리데이인 경우 15-35세만 가능
    if (travelPurpose === '워킹홀리데이') {
      if (age < 15 || age > 35) {
        alert('워킹홀리데이 보험은 15세 이상 35세 이하만 가입 가능합니다.');
        return;
      }
    }

    // 해외여행보험의 모든 플랜 목록
    const allPlans: PlanType[] = ['실속플랜', '표준플랜', '고급플랜', '어린이플랜', '어르신플랜1', '어르신플랜2'];
    
    setIsCalculating(true);

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const genderValue = getGenderFromBirthDate(birthDate, gender);

      // 각 플랜별 보험료 계산 (동적으로 생성)
      const plans: Record<string, PlanInfo> = {};

      // 워킹홀리데이인 경우: 원화(실속, 표준) + 외화(고급) 플랜 계산
      if (travelPurpose === '워킹홀리데이') {
        // 원화 플랜: 실속, 표준
        const wonPlans: PlanType[] = ['실속플랜', '표준플랜'];
        for (const planType of wonPlans) {
          try {
            const requestBody = {
              insurance_type: String(travelPurpose || ''),
              age: Number(age),
              gender: String(genderValue || ''),
              plan_type: String(planType),
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: String(departureDateTime),
              arrival_date: String(arrivalDateTime),
              currency_plan: '원화',
              travel_country: String(travelCountry || ''),
            };
            
            const response = await fetch('/api/travel/calculate-premium', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            
            if (data.success) {
              plans[planType] = {
                type: planType,
                premium: data.premium,
                coverages: [
                  { label: '상해사망후유장해', amount: '1억원' },
                  { label: '상해입원의료비', amount: '1,000만원' },
                  { label: '상해통원의료비', amount: '10만원' },
                ],
              };
            } else {
              console.error(`보험료 계산 실패 (${planType}):`, data.message);
            }
          } catch (error) {
            console.error(`보험료 계산 오류 (${planType}):`, error);
          }
        }

        // 외화 플랜: 고급
        try {
          const requestBody = {
            insurance_type: String(travelPurpose || ''),
            age: Number(age),
            gender: String(genderValue || ''),
            plan_type: '고급플랜',
            has_medical_expense: hasMedicalExpense ? 1 : 0,
            departure_date: String(departureDateTime),
            arrival_date: String(arrivalDateTime),
            currency_plan: '외화',
            travel_country: String(travelCountry || ''),
          };
          
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          
          if (data.success) {
            plans['고급플랜'] = {
              type: '고급플랜',
              premium: data.premium,
              coverages: [
                { label: '상해사망후유장해', amount: '1억원' },
                { label: '상해입원의료비', amount: '1,000만원' },
                { label: '상해통원의료비', amount: '10만원' },
              ],
            };
          } else {
            console.error(`보험료 계산 실패 (고급플랜):`, data.message);
          }
        } catch (error) {
          console.error(`보험료 계산 오류 (고급플랜):`, error);
        }
      } else {
        // 일반적인 경우: 나이에 따라 사용 가능한 플랜 필터링
        let availablePlans: PlanType[] = [];
        if (age >= 0 && age < 15) {
          // 15세 미만: 어린이플랜만 가능
          availablePlans = ['어린이플랜'];
        } else if (age >= 15 && age <= 70) {
          // 15세 이상 70세 이하: 실속플랜, 표준플랜, 고급플랜
          availablePlans = ['실속플랜', '표준플랜', '고급플랜'];
        } else if (age >= 71 && age <= 90) {
          // 71세 이상 90세 이하: 어르신플랜1, 어르신플랜2
          availablePlans = ['어르신플랜1', '어르신플랜2'];
        } else {
          alert('가입 가능한 나이 범위를 벗어났습니다.');
          setIsCalculating(false);
          return;
        }

        if (availablePlans.length === 0) {
          alert('가입 가능한 플랜이 없습니다.');
          setIsCalculating(false);
          return;
        }

        // API 호출하여 각 플랜의 보험료 계산
        for (const planType of availablePlans) {
          try {
            const requestBody = {
              insurance_type: String(travelPurpose || ''),
              age: Number(age),
              gender: String(genderValue || ''),
              plan_type: String(planType),
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: String(departureDateTime),
              arrival_date: String(arrivalDateTime),
              currency_plan: String(overrideCurrencyPlan || currencyPlan || '원화'),
              travel_country: String(travelCountry || ''),
            };
            
            const response = await fetch('/api/travel/calculate-premium', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            
            if (data.success) {
              // 플랜 정보 초기화 (보장내용은 기본값으로 설정, 추후 백엔드에서 받아올 수 있음)
              plans[planType] = {
                type: planType,
                premium: data.premium,
                coverages: [
                  { label: '상해사망후유장해', amount: '1억원' },
                  { label: '상해입원의료비', amount: '1,000만원' },
                  { label: '상해통원의료비', amount: '10만원' },
                  ...(planType !== '실속플랜' ? [
                    { label: '질병입원의료비', amount: '1,000만원' },
                    { label: '질병통원의료비', amount: '10만원' },
                  ] : []),
                  { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
                ],
              };
            } else {
              console.error(`보험료 계산 실패 (${planType}):`, data.message);
            }
          } catch (error) {
            console.error(`보험료 계산 오류 (${planType}):`, error);
          }
        }
      }

      setPlanInfo(plans);
      // 기본값은 실속플랜, 없으면 첫 번째 플랜
      const planKeys = Object.keys(plans);
      const defaultPlan = planKeys.includes('실속플랜') ? '실속플랜' : (planKeys[0] || null);
      setSelectedPlan(defaultPlan as PlanType | null);
      setShowPlanSelection(true);
    } catch (error) {
      console.error('보험료 계산 오류:', error);
      alert('보험료 계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  // 결제 처리 함수
  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      alert('결제 방법을 선택해주세요.');
      return;
    }
    if (paymentMethod === '기타결제' && !paymentSubMethod) {
      alert('결제 세부 방법을 선택해주세요.');
      return;
    }
    if (paymentMethod === '기타결제' && paymentSubMethod === '무통장입금') {
      if (!depositBank) {
        alert('입금은행을 선택해주세요.');
        return;
      }
      if (!depositorName) {
        alert('입금자명을 입력해주세요.');
        return;
      }
    }
    if (paymentMethod === '기타결제' && paymentSubMethod === '수기카드') {
      if (!cardCategory) {
        alert('카드종류를 선택해주세요.');
        return;
      }
      if (!cardNumber1 || !cardNumber2 || !cardNumber3 || !cardNumber4) {
        alert('카드번호를 모두 입력해주세요.');
        return;
      }
      if (!cardExpiryMonth || !cardExpiryYear) {
        alert('유효기간을 선택해주세요.');
        return;
      }
      if (!cardholderName) {
        alert('카드소유자명을 입력해주세요.');
        return;
      }
      if (!cardholderResidentNumber || cardholderResidentNumber.length < 14) {
        alert('카드소유자 주민번호를 입력해주세요.');
        return;
      }
    }

    // 결제 방법별 처리
    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const periodDays = Math.ceil((new Date(`${arrivalDate}T${arrivalTime}:00:00`).getTime() - new Date(`${departureDate}T${departureTime}:00:00`).getTime()) / (1000 * 60 * 60 * 24));

      // 나이스페이먼츠, 네이버페이, 카카오페이는 먼저 계약 등록 후 결제 처리
      if (paymentMethod === '나이스페이먼츠' || paymentMethod === '네이버페이' || paymentMethod === '카카오페이') {
        // 1. 계약 등록 (결제 대기 상태)
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: travelPurpose || '유학/어학연수',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: null,
            travel_country: travelCountry,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
          },
          contractor: {
            contractor_type: '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate.substring(0, 6)}-${participants[0].birthDate.substring(6, 7)}${participants[0].gender === '남자' ? '1' : '2'}******` : '',
            mobile_phone: participants[0]?.phone || '',
            email: participants[0]?.email1 && participants[0]?.email2 ? `${participants[0].email1}@${participants[0].email2}` : '',
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate.substring(0, 6)}-${p.birthDate.substring(6, 7)}${p.gender === '남자' ? '1' : '2'}******`,
              gender: p.gender,
              age: age || 0,
              plan_type: selectedPlan || '실속플랜',
              premium: calculatedPremiums?.participants.find(cp => cp.id === p.id)?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
            };
          }),
          companions: [],
          payment: {
            payment_method: paymentMethod,
            payment_sub_method: null,
            amount: receiptPremium,
            status: '대기',
          },
        };

        const contractResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/register-contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData),
        });

        const contractData_result = await contractResponse.json();

        if (!contractData_result.success) {
          alert(contractData_result.message || '계약 등록에 실패했습니다.');
          return;
        }

        const contract_id = contractData_result.contract_id;

        // 2. 결제 처리
        if (paymentMethod === '나이스페이먼츠') {
          const paymentRequest = await requestNicepayPayment({
            contract_id,
            amount: receiptPremium,
            orderId: contractData_result.contract_number,
            goodsName: '해외장기체류보험',
            buyerName: participants[0]?.name || '',
            buyerEmail: participants[0]?.email1 && participants[0]?.email2 ? `${participants[0].email1}@${participants[0].email2}` : '',
            buyerTel: participants[0]?.phone || '',
            returnUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/nicepay/callback`,
            closeUrl: `${window.location.origin}/payment/close`,
          });

          if (paymentRequest.success) {
            localStorage.setItem('pendingPayment', JSON.stringify({
              contract_id,
              payment_method: paymentMethod,
              amount: receiptPremium,
            }));
            try {
              await openNicepayWindow(paymentRequest);
            } catch (error) {
              console.error('결제창 열기 오류:', error);
              alert(error instanceof Error ? error.message : '결제창을 여는 중 오류가 발생했습니다.');
            }
          } else {
            alert(paymentRequest.message || '결제 요청에 실패했습니다.');
          }
        } else if (paymentMethod === '네이버페이') {
          alert('네이버페이 연동 준비 중입니다.');
        } else if (paymentMethod === '카카오페이') {
          alert('카카오페이 연동 준비 중입니다.');
        }
      } else {
        // 기타결제 (무통장입금, 수기카드)는 바로 계약 등록
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: travelPurpose || '유학/어학연수',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: null,
            travel_country: travelCountry,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
          },
          contractor: {
            contractor_type: '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate.substring(0, 6)}-${participants[0].birthDate.substring(6, 7)}${participants[0].gender === '남자' ? '1' : '2'}******` : '',
            mobile_phone: participants[0]?.phone || '',
            email: participants[0]?.email1 && participants[0]?.email2 ? `${participants[0].email1}@${participants[0].email2}` : '',
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate.substring(0, 6)}-${p.birthDate.substring(6, 7)}${p.gender === '남자' ? '1' : '2'}******`,
              gender: p.gender,
              age: age || 0,
              plan_type: selectedPlan || '실속플랜',
              premium: calculatedPremiums?.participants.find(cp => cp.id === p.id)?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
            };
          }),
          companions: [],
          payment: {
            payment_method: paymentMethod || '기타결제',
            payment_sub_method: paymentSubMethod || null,
            amount: receiptPremium,
            status: paymentSubMethod === '무통장입금' ? '대기' : '완료',
            depositor_name: paymentSubMethod === '무통장입금' ? depositorName : null,
            bank_name: paymentSubMethod === '무통장입금' ? depositBank : null,
            account_number: paymentSubMethod === '무통장입금' ? (depositBank === '우리은행' ? '1005-604-481542' : '301-0337-8596-01') : null,
            card_type: paymentSubMethod === '수기카드' ? cardType : null,
            card_category: paymentSubMethod === '수기카드' ? cardCategory : null,
            card_number: paymentSubMethod === '수기카드' ? `${cardNumber1}-${cardNumber2}-${cardNumber3}-${cardNumber4}` : null,
            card_expiry_month: paymentSubMethod === '수기카드' ? cardExpiryMonth : null,
            card_expiry_year: paymentSubMethod === '수기카드' ? cardExpiryYear : null,
            cardholder_name: paymentSubMethod === '수기카드' ? cardholderName : null,
            cardholder_resident_number: paymentSubMethod === '수기카드' ? cardholderResidentNumber : null,
            approval_date: paymentSubMethod === '수기카드' ? `${approvalYear}-${String(approvalMonth).padStart(2, '0')}-${String(approvalDay).padStart(2, '0')}` : null,
            normal_premium: normalPremium,
            receipt_premium: receiptPremium,
          },
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/register-contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData),
        });

        const data = await response.json();

        if (data.success) {
          setShowPaymentScreen(false);
          setShowCompletionScreen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert(data.message || '계약 등록에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('계약 등록 오류:', error);
      alert('계약 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="long-term-stay-page-pc">
      <Header isMobile={false} />
      
      <main 
        className="long-term-stay-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* STEP 1: 여행정보 입력 화면 */}
        {!showParticipantForm && !showStep2_1 && !showStep3 && !showPaymentScreen && !showCompletionScreen && (
          <TravelInfoStep
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            birthDate={birthDate}
            gender={gender}
            hasMedicalExpense={hasMedicalExpense}
            selectedPlan={selectedPlan}
            planInfo={planInfo}
            participantCount={participantCount}
            isCalculating={isCalculating}
            showPlanSelection={showPlanSelection}
            onDepartureDateChange={setDepartureDate}
            onDepartureTimeChange={setDepartureTime}
            onArrivalDateChange={setArrivalDate}
            onArrivalTimeChange={setArrivalTime}
            onBirthDateChange={setBirthDate}
            onGenderChange={setGender}
            onMedicalExpenseChange={handleMedicalExpenseChange}
            onPlanSelect={setSelectedPlan}
            onParticipantCountChange={(count) => {
              setParticipantCount(count);
              if (count === 2) {
                setShowPlanSelection(false);
                setShowParticipantForm(true);
                if (participants.length === 1) {
                  setParticipants([
                    ...participants,
                    {
                      id: 2,
                      name: '',
                      englishName: '',
                      nationality: '내국인',
                      birthDate: '',
                      gender: '남자',
                      email1: '',
                      email2: '',
                      phone: '',
                      isVerified: false,
                    },
                  ]);
                }
              } else if (count === 1) {
                setShowPlanSelection(false);
                setShowParticipantForm(true);
                setParticipants([
                  {
                    id: 1,
                    name: '',
                    englishName: '',
                    nationality: '내국인',
                    birthDate: '',
                    gender: '남자',
                    email1: '',
                    email2: '',
                    phone: '',
                    isVerified: false,
                  },
                ]);
              }
            }}
            onCalculate={handleCalculate}
            onAddParticipant={() => {
              setShowPlanSelection(false);
              setShowParticipantForm(true);
            }}
            insuranceType="해외장기체류보험"
            timeOptions={timeOptions}
            travelCountry={travelCountry}
            onTravelCountryChange={setTravelCountry}
            travelPurpose={travelPurpose}
            onTravelPurposeChange={setTravelPurpose}
            longTermPurposeOptions={longTermPurposeOptions}
            currencyPlan={currencyPlan}
            onCurrencyPlanChange={async (newCurrencyPlan) => {
              // 워킹홀리데이인 경우 통화 플랜 변경 불가
              if (travelPurpose === '워킹홀리데이') {
                return;
              }
              setCurrencyPlan(newCurrencyPlan);
              // 통화 플랜 변경 시 보험료 재계산 (최신 currencyPlan 값 전달)
              if (showPlanSelection && planInfo && birthDate && birthDate.length === 8) {
                await handleCalculate(newCurrencyPlan);
              }
            }}
          />
        )}

        {/* STEP 2: 가입정보 입력 화면 */}
        {showParticipantForm && !showStep2_1 && !showStep3 && !showPaymentScreen && !showCompletionScreen && (
          <ParticipantInfoStep
            insuranceType="해외장기체류보험"
            participants={participants}
            calculatedPremiums={calculatedPremiums}
            hasMedicalExpense={hasMedicalExpense}
            isCalculating={isCalculating}
            participantCount={participantCount}
            onParticipantsChange={setParticipants}
            onCalculatedPremiumsChange={setCalculatedPremiums}
            onCalculate={handleCalculateParticipants}
            onApply={() => {
              setShowParticipantForm(false);
              setShowStep2_1(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExcelUpload={() => setShowExcelModal(true)}
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            selectedPlan={selectedPlan}
            calculateAgeFromBirthDate={calculateAgeFromBirthDate}
            birthDate={birthDate}
            gender={gender}
          />
        )}

        {/* STEP 2-1: 위험활동 확인 및 여행목적 선택 화면 */}
        {showStep2_1 && !showStep3 && !showPaymentScreen && !showCompletionScreen && (
          <RiskActivityStep
            insuranceType="해외장기체류보험"
            hasDangerousActivity={hasDangerousActivity}
            travelPurpose={travelPurpose}
            onDangerousActivityChange={setHasDangerousActivity}
            onTravelPurposeChange={setTravelPurpose}
            onShowDangerousActivityModal={() => setShowDangerousActivityModal(true)}
            isOverseas={true}
            isLongTermStay={true}
            isCurrentlyAbroad={isCurrentlyAbroad}
            hasRestrictedCountry={hasRestrictedCountry}
            onCurrentlyAbroadChange={setIsCurrentlyAbroad}
            onRestrictedCountryChange={setHasRestrictedCountry}
            onShowRestrictedCountryModal={() => setShowRestrictedCountryModal(true)}
            travelPurposeOptions={longTermPurposeOptions.map(opt => opt.value)}
            onNext={() => {
              if (isCurrentlyAbroad === null) {
                alert('현재 출국/해외 체류 중 여부를 선택해주세요.');
                return;
              }
              if (isCurrentlyAbroad === true) {
                alert('죄송합니다. 고객님\n현재 출국하였거나 해외 체류 중인 경우 여행보험에 가입할 수 없습니다.');
                return;
              }
              if (hasDangerousActivity === null) {
                alert('위험한 활동 포함 여부를 선택해주세요.');
                return;
              }
              if (hasDangerousActivity === true) {
                alert('죄송합니다. 고객님\n여행기간중 위험한 활동이 포함된 경우 여행보험에 가입할 수 없습니다.');
                return;
              }
              if (hasRestrictedCountry === null) {
                alert('제한국가 포함 여부를 선택해주세요.');
                return;
              }
              if (hasRestrictedCountry === true) {
                alert('죄송합니다. 고객님\n여행목적지 및 경유지에 인수제한 국가가 포함된 경우 여행보험에 가입할 수 없습니다.');
                return;
              }
              if (!travelPurpose) {
                alert('여행목적을 선택해주세요.');
                return;
              }
              setShowConsentModal(true);
            }}
          />
        )}

        {/* 위험활동 확인 모달 */}
        <DangerousActivityModal
          isOpen={showDangerousActivityModal}
          onClose={() => setShowDangerousActivityModal(false)}
        />

        {/* 제한국가 확인 모달 */}
        <RestrictedCountryModal
          isOpen={showRestrictedCountryModal}
          onClose={() => setShowRestrictedCountryModal(false)}
        />

        {/* 동의서 모달 */}
        <ConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onConfirm={() => {
            setShowConsentModal(false);
            setShowStep2_1(false);
            setShowStep3(true);
            setNormalPremium(calculatedPremiums?.totalPremium || 0);
            setReceiptPremium(calculatedPremiums?.totalPremium || 0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          insuranceType="해외장기체류보험"
        />

        {/* STEP 3: 계약정보 및 결제 화면 */}
        {showStep3 && !showCompletionScreen && (
          <ContractInfoStep
            insuranceType="해외장기체류보험"
            insuranceCompany="메리츠화재"
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            travelPurpose={travelPurpose}
            travelCountry={travelCountry}
            participants={participants}
            calculatedPremiums={calculatedPremiums}
            hasMedicalExpense={hasMedicalExpense}
            receiptPremium={receiptPremium}
            useAccidentFreeCash={useAccidentFreeCash}
            accidentFreeCash={accidentFreeCash}
            contractConfirmed={contractConfirmed}
            onUseAccidentFreeCashChange={setUseAccidentFreeCash}
            onReceiptPremiumChange={setReceiptPremium}
            onContractConfirmedChange={(confirmed) => {
              setContractConfirmed(confirmed);
              if (confirmed) {
                setTimeout(() => {
                  setShowPaymentScreen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }
            }}
            onShowPayment={() => setShowPaymentScreen(true)}
          />
        )}

        {/* 결제 화면 */}
        {showPaymentScreen && !showCompletionScreen && (
          <PaymentStep
            className="payment-step-connected"
            paymentMethod={paymentMethod}
            paymentSubMethod={paymentSubMethod}
            depositBank={depositBank}
            depositorName={depositorName}
            expectedDepositYear={expectedDepositYear}
            expectedDepositMonth={expectedDepositMonth}
            expectedDepositDay={expectedDepositDay}
            cardType={cardType}
            cardCategory={cardCategory}
            cardNumber1={cardNumber1}
            cardNumber2={cardNumber2}
            cardNumber3={cardNumber3}
            cardNumber4={cardNumber4}
            cardExpiryMonth={cardExpiryMonth}
            cardExpiryYear={cardExpiryYear}
            cardholderName={cardholderName}
            cardholderResidentNumber={cardholderResidentNumber}
            approvalYear={approvalYear}
            approvalMonth={approvalMonth}
            approvalDay={approvalDay}
            normalPremium={normalPremium}
            receiptPremium={receiptPremium}
            isSamePremium={isSamePremium}
            onPaymentMethodChange={setPaymentMethod}
            onPaymentSubMethodChange={setPaymentSubMethod}
            onDepositBankChange={setDepositBank}
            onDepositorNameChange={setDepositorName}
            onExpectedDepositDateChange={(year, month, day) => {
              setExpectedDepositYear(year);
              setExpectedDepositMonth(month);
              setExpectedDepositDay(day);
            }}
            onCardTypeChange={setCardType}
            onCardCategoryChange={setCardCategory}
            onCardNumberChange={(part, value) => {
              if (part === 1) setCardNumber1(value);
              else if (part === 2) setCardNumber2(value);
              else if (part === 3) setCardNumber3(value);
              else setCardNumber4(value);
            }}
            onCardExpiryChange={(month, year) => {
              setCardExpiryMonth(month);
              setCardExpiryYear(year);
            }}
            onCardholderNameChange={setCardholderName}
            onCardholderResidentNumberChange={setCardholderResidentNumber}
            onApprovalDateChange={(year, month, day) => {
              setApprovalYear(year);
              setApprovalMonth(month);
              setApprovalDay(day);
            }}
            onNormalPremiumChange={setNormalPremium}
            onReceiptPremiumChange={setReceiptPremium}
            onIsSamePremiumChange={setIsSamePremium}
            onSubmit={handlePaymentSubmit}
          />
        )}

        {/* 결제 완료 화면 */}
        {showCompletionScreen && (
          <CompletionStep
            participantName={participants[0]?.name || ''}
            onViewDetails={() => {
              alert('가입내역 확인 기능은 추후 구현 예정입니다.');
            }}
            onGoHome={() => {
              window.location.href = '/';
            }}
          />
        )}

        {/* 엑셀 등록 모달 */}
        <ExcelUploadModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          onUpload={(newParticipants, startId) => {
            // 기존 참가자 목록에 새로 파싱된 참가자들 추가
            // 대표 가입자(첫 번째)는 제외하고 추가
            const updatedParticipants = [...participants];
            
            // 새 참가자들의 ID를 올바르게 설정
            const participantsWithCorrectIds = newParticipants.map((p, index) => ({
              ...p,
              id: startId + index,
            }));
            
            // 기존 참가자 목록에 추가 (대표 가입자는 유지)
            updatedParticipants.push(...participantsWithCorrectIds);
            
            setParticipants(updatedParticipants);
            setShowExcelModal(false);
          }}
          currentParticipants={participants}
        />

        {/* Floating Buttons */}
        <div className="floating-buttons">
          <button className="floating-btn cash-btn">
            <img src={getImagePath('/icons/icon_cash.png')} alt="무사고캐시" className="floating-icon-img" />
            <span className="floating-text">무사고캐시란?</span>
          </button>
          <button className="floating-btn service-btn">
            <img src={getImagePath('/icons/icon_menu.png')} alt="서비스 전체보기" className="floating-icon-img" />
            <span className="floating-text">서비스<br/>전체보기</span>
          </button>
        </div>
      </main>

      <Footer isMobile={false} />
    </div>
  );
}

