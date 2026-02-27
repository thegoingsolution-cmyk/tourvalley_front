'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import { getImagePath } from '@/utils/path';
import { getTrackingInfo } from '@/utils/tracking';
import { requestNicepayPayment, openNicepayWindow, processNaverPayPayment, processKakaoPayPayment } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { sendVerificationCode, verifyCode } from '@/services/smsService';
import TravelInfoStep from '@/components/travel/TravelInfoStep';
import ParticipantInfoStep from '@/components/travel/ParticipantInfoStep';
import RiskActivityStep from '@/components/travel/RiskActivityStep';
import ContractInfoStep from '@/components/travel/ContractInfoStep';
import PaymentStep from '@/components/travel/PaymentStep';
import CompletionStep from '@/components/travel/CompletionStep';
import DangerousActivityModal from '@/components/travel/DangerousActivityModal';
import ConsentModal from '@/components/travel/ConsentModal';
import ExcelUploadModal from '@/components/travel/ExcelUploadModal';
import CoverageDetailModal from '@/components/travel/CoverageDetailModal';
import { PlanType, PlanInfo, Participant, CalculatedPremiums, PaymentMethod, PaymentSubMethod, Gender } from '@/components/travel/types';
import './page.css';

export default function PCDomesticPage() {
  const router = useRouter();
  // 회원 정보 가져오기
  const { member, isLoggedIn } = useAuth();
  
  // Get today's date in YYYY-MM-DD format (Korea timezone)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
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

  // 보험료 계산 결과
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [hasMedicalExpense, setHasMedicalExpense] = useState(true); // 실손의료비 포함 여부
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [planInfo, setPlanInfo] = useState<Record<string, PlanInfo> | null>(null);
  const [participantCount, setParticipantCount] = useState<1 | 2>(1); // 1인 가입 또는 2인 이상 가입
  const [isCalculating, setIsCalculating] = useState(false);

  // 가입자 정보 입력 화면
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [showStep2_1, setShowStep2_1] = useState(false); // STEP2-1 화면 (위험활동 확인, 여행목적)
  const [showStep3, setShowStep3] = useState(false); // STEP3 화면 (계약정보, 결제)
  const [showPaymentScreen, setShowPaymentScreen] = useState(false); // 결제 화면
  const [showCompletionScreen, setShowCompletionScreen] = useState(false); // 완료 화면
  const [completedContractorName, setCompletedContractorName] = useState<string>(''); // 완료 화면에 표시할 계약자 이름
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  
  // STEP2-1 관련 상태
  const [hasDangerousActivity, setHasDangerousActivity] = useState<boolean | null>(null);
  const [travelPurpose, setTravelPurpose] = useState<string>('');
  const [showDangerousActivityModal, setShowDangerousActivityModal] = useState(false);
  const [showCoverageDetailModal, setShowCoverageDetailModal] = useState(false);
  const [selectedCoveragePlanType, setSelectedCoveragePlanType] = useState<PlanType | null>(null);
  
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

  // 로그인 회원의 무사고캐시 보유액 반영 (계약정보 단계에서 표시)
  useEffect(() => {
    if (member && typeof member.accident_free_cash === 'number') {
      setAccidentFreeCash(member.accident_free_cash);
    }
  }, [member]);

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
      nationality: '내국인',
      birthDate: '',
      gender: '남자',
      email1: '',
      email2: '',
      phone: '',
      isVerified: false,
    },
  ]);

  // 이메일 주소 조합 헬퍼 함수
  const getFullEmail = (participant: Participant): string => {
    if (!participant.email1) return '';
    const domain = participant.email2 === '직접입력' ? participant.customEmail : participant.email2;
    return domain ? `${participant.email1}@${domain}` : '';
  };

  // 시간 옵션: 1시부터 24시까지 (0시 제외, 24시 포함)
  const timeOptions = Array.from({ length: 24 }, (_, i) => i + 1);

  // 주민번호에서 보험나이 계산 (만나이에서 6개월 경과 시 +1)
  const calculateAgeFromBirthDate = (birthDateStr: string): number | null => {
    if (!birthDateStr || birthDateStr.length !== 8) return null;
    
    try {
      const year = parseInt(birthDateStr.substring(0, 4));
      const month = parseInt(birthDateStr.substring(4, 6));
      const day = parseInt(birthDateStr.substring(6, 8));
      
      const today = new Date();
      const birthDate = new Date(year, month - 1, day);
      if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return null;
      let age = today.getFullYear() - year;
      
      // 생일이 지나지 않았으면 나이 -1 (만나이 계산)
      if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
        age--;
      }
      
      // 보험나이 계산: 만나이에서 6개월이 경과하면 +1
      // 마지막 생일 기준으로 6개월 경과 여부 계산
      const lastBirthday = new Date(today.getFullYear(), month - 1, day);
      if (today < lastBirthday) {
        lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
      }
      const sixMonthsLater = new Date(lastBirthday);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      
      // 오늘이 생일로부터 6개월 후 날짜보다 이후이면 보험나이 +1
      if (today >= sixMonthsLater) {
        age++;
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

  const getResidentGenderCode = (birthDateStr: string, genderValue: Gender): string => {
    if (!birthDateStr || birthDateStr.length < 4) {
      return genderValue === '남자' ? '1' : '2';
    }
    const year = parseInt(birthDateStr.substring(0, 4), 10);
    const is2000OrLater = !isNaN(year) && year >= 2000;
    if (is2000OrLater) {
      return genderValue === '남자' ? '3' : '4';
    }
    return genderValue === '남자' ? '1' : '2';
  };

  // STEP2로 이동 시 화면 상단으로 스크롤
  useEffect(() => {
    if (showParticipantForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showParticipantForm]);

  // 결제 완료 후 localStorage에서 계약자 이름 복원
  useEffect(() => {
    if (showCompletionScreen && !completedContractorName) {
      const pendingPayment = localStorage.getItem('pendingPayment');
      if (pendingPayment) {
        try {
          const paymentData = JSON.parse(pendingPayment);
          if (paymentData.contractor_name) {
            setCompletedContractorName(paymentData.contractor_name);
          }
        } catch (error) {
          console.error('localStorage 읽기 오류:', error);
        }
      }
    }
  }, [showCompletionScreen, completedContractorName]);

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

  // 기간 검증 (국내여행보험 최대 1개월)
  const validateDuration = (): { valid: boolean; message?: string } => {
    const departure = new Date(`${departureDate}T${departureTime}:00:00`);
    const arrival = new Date(`${arrivalDate}T${arrivalTime}:00:00`);
    
    if (arrival <= departure) {
      return { valid: false, message: '도착일시는 출발일시보다 이후여야 합니다.' };
    }
    
    const diffTime = arrival.getTime() - departure.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 국내여행보험은 최대 1개월(30일) 이하
    if (diffDays > 30) {
      return { valid: false, message: '국내여행보험은 최대 1개월(30일)까지 가능합니다.' };
    }
    
    return { valid: true };
  };

  const fetchAvailablePlans = useCallback(async (age: number, genderValue: Gender, medicalExpenseValue: boolean = hasMedicalExpense) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiBase}/api/travel/available-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_type: '국내여행보험',
          age,
          gender: genderValue,
          plan_variant: 'B',
          has_medical_expense: medicalExpenseValue ? 1 : 0,
        }),
      });
      const data = await response.json();
      if (data?.success && Array.isArray(data.plan_types)) {
        return data.plan_types as PlanType[];
      }
    } catch (error) {
      console.error('플랜 목록 조회 실패:', error);
    }
    return [];
  }, [hasMedicalExpense]);

  // 보험료 재계산 (실손의료비 옵션 변경 시)
  const recalculatePremium = useCallback(async (medicalExpenseValue?: boolean) => {
    if (!planInfo || !selectedPlan || !birthDate || birthDate.length !== 8) return;

    setIsCalculating(true);

    try {
      // 24시는 다음날 00시로 변환
      let departureDateFormatted = departureDate;
      let departureHour = parseInt(departureTime);
      if (departureHour === 24) {
        const date = new Date(departureDate);
        date.setDate(date.getDate() + 1);
        departureDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        departureHour = 0;
      }
      
      let arrivalDateFormatted = arrivalDate;
      let arrivalHour = parseInt(arrivalTime);
      if (arrivalHour === 24) {
        const date = new Date(arrivalDate);
        date.setDate(date.getDate() + 1);
        arrivalDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        arrivalHour = 0;
      }
      
      const departureDateTime = `${departureDateFormatted} ${String(departureHour).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDateFormatted} ${String(arrivalHour).padStart(2, '0')}:00:00`;
      const genderValue = getGenderFromBirthDate(birthDate, gender);
      const age = calculateAgeFromBirthDate(birthDate);

      if (age === null) return;
      if (!planInfo) return;

      const medicalExpense = medicalExpenseValue !== undefined ? medicalExpenseValue : hasMedicalExpense;

      // 빈 객체로 시작하여 성공한 플랜만 추가
      const updatedPlans: Record<string, PlanInfo> = {};
      let planTypesToRecalc = Object.keys(planInfo) as PlanType[];

      // 실손 포함/제외 변경 시에는 현재 플랜이 아니라 신규 가능한 플랜 목록으로 재계산
      if (medicalExpenseValue !== undefined) {
        const availablePlans = await fetchAvailablePlans(age, genderValue, medicalExpense);
        if (availablePlans.length === 0) {
          setPlanInfo({});
          return;
        }
        planTypesToRecalc = availablePlans;
      } else if (planTypesToRecalc.length === 0) {
        const availablePlans = await fetchAvailablePlans(age, genderValue, medicalExpense);
        if (availablePlans.length === 0) {
          setPlanInfo({});
          return;
        }
        planTypesToRecalc = availablePlans;
      }

      const coveragesMap = await fetchPlanCoverages(planTypesToRecalc, medicalExpense);

      for (const planType of planTypesToRecalc) {
        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: '국내여행보험',
              age: age,
              birth_date: birthDate,
              gender: genderValue,
              plan_type: planType,
              plan_variant: 'B',
              has_medical_expense: medicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: '원화',
              travel_country: null,
            }),
          });

          const data = await response.json();
          if (data.success) {
            const hasDiseaseCoverage = planType !== '실속플랜';
            if (planInfo[planType]) {
              updatedPlans[planType] = {
                ...planInfo[planType],
                premium: data.premium,
                coverages: coveragesMap[planType] || planInfo[planType].coverages,
              };
            } else {
              updatedPlans[planType] = {
                type: planType as PlanType,
                premium: data.premium,
                coverages: coveragesMap[planType] || [
                  { label: '상해사망후유장해', amount: '1억원' },
                  { label: '상해입원의료비', amount: '1,000만원' },
                  { label: '상해통원의료비', amount: '10만원' },
                  ...(hasDiseaseCoverage ? [
                    { label: '질병입원의료비', amount: '1,000만원' },
                    { label: '질병통원의료비', amount: '10만원' },
                  ] : []),
                  { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
                ],
              };
            }
          }
        } catch (error) {
          console.error(`보험료 재계산 오류 (${planType}):`, error);
        }
      }

      // 현재 선택된 플랜이 더 이상 유효하지 않으면 첫 번째 사용 가능한 플랜으로 변경
      if (selectedPlan && !updatedPlans[selectedPlan]) {
        const availablePlans = Object.keys(updatedPlans);
        if (availablePlans.length > 0) {
          setSelectedPlan(availablePlans[0] as PlanType);
        }
      }

      setPlanInfo(updatedPlans);
    } catch (error) {
      console.error('보험료 재계산 오류:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [planInfo, selectedPlan, birthDate, gender, departureDate, departureTime, arrivalDate, arrivalTime, hasMedicalExpense, fetchAvailablePlans]);

  // 실손의료비 옵션 변경 핸들러
  const handleMedicalExpenseChange = async (value: boolean) => {
    setHasMedicalExpense(value);
    // 옵션 변경 후 보험료 재계산
    if (showPlanSelection && planInfo) {
      await recalculatePremium(value);
    }
  };

  const fetchPlanCoverages = async (planTypes: PlanType[], medicalExpenseValue: boolean = hasMedicalExpense) => {
    try {
      const response = await fetch('/api/travel/plan-coverages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_type: '국내여행보험',
          plan_types: planTypes,
          has_medical_expense: medicalExpenseValue ? 1 : 0,
        }),
      });
      const data = await response.json();
      if (data?.success && data.coverages) {
        return data.coverages as Record<string, { label: string; amount: string }[]>;
      }
    } catch (error) {
      console.error('보장내용 조회 실패:', error);
    }
    return {};
  };

  // 보장 상세보기 클릭 핸들러 (PC는 모달)
  const handleContractDetailClick = (clickedPlanType: PlanType) => {
    setSelectedCoveragePlanType(clickedPlanType);
    setShowCoverageDetailModal(true);
  };

  // 가입자 보험료 계산 함수
  const handleCalculateParticipants = async () => {
    // 가입자 정보 검증
    if (participants.length === 0) {
      alert('가입자 정보를 입력해주세요.');
      return;
    }

    // 필수 정보 검증 (내국인/외국인별)
    for (const participant of participants) {
      if (!participant.name) {
        alert('모든 가입자의 이름을 입력해주세요.');
        return;
      }
      
      if (participant.nationality === '내국인') {
        // 내국인: 생년월일 8자리 필수
        if (!participant.birthDate || participant.birthDate.length !== 8) {
          alert('내국인 가입자의 생년월일 8자리를 입력해주세요.');
          return;
        }
      } else if (participant.nationality === '외국인') {
        // 외국인: 외국인등록번호 13자리 필수
        if (!participant.residentNumber || participant.residentNumber.length !== 13) {
          alert('외국인 가입자의 외국인등록번호 13자리를 입력해주세요.');
          return;
        }
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
        // 나이 계산 (내국인: 생년월일, 외국인: 외국인등록번호에서 추출)
        let birthDateForAge = participant.birthDate;
        if (participant.nationality === '외국인' && participant.residentNumber) {
          // 외국인등록번호 앞 6자리(YYMMDD)에서 생년월일 추출
          const residentNum = participant.residentNumber;
          if (residentNum.length >= 6) {
            const yy = parseInt(residentNum.substring(0, 2));
            const mm = residentNum.substring(2, 4);
            const dd = residentNum.substring(4, 6);
            // 50 이상이면 1900년대, 미만이면 2000년대
            const year = yy >= 50 ? 1900 + yy : 2000 + yy;
            birthDateForAge = `${year}${mm}${dd}`;
          }
        }
        
        const age = calculateAgeFromBirthDate(birthDateForAge);
        if (age === null) {
          const errorMsg = participant.nationality === '외국인' 
            ? `${participant.name}의 외국인등록번호를 올바르게 입력해주세요.`
            : `${participant.name}의 생년월일을 올바르게 입력해주세요.`;
          alert(errorMsg);
          setIsCalculating(false);
          return;
        }

        // 플랜 타입 결정: 나이에 따라 백엔드에 보내는 플랜명 사용 (STEP1 선택 플랜 또는 나이별 자동)
        let planType: string;
        if (age <= 14) {
          planType = '어린이플랜';
        } else if (age >= 71) {
          planType = selectedPlan === '어르신플랜2' ? '어르신플랜2' : '어르신플랜1';
        } else {
          const basePlan =
            selectedPlan && !['어린이플랜', '어르신플랜1', '어르신플랜2'].includes(selectedPlan)
              ? selectedPlan
              : '실속플랜';
          planType = basePlan;
        }

        // 보험료 계산 API 호출
        // 24시는 다음날 00시로 변환
        let departureDateFormatted = departureDate;
        let departureHour = parseInt(departureTime);
        if (departureHour === 24) {
          const date = new Date(departureDate);
          date.setDate(date.getDate() + 1);
          departureDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          departureHour = 0;
        }
        
        let arrivalDateFormatted = arrivalDate;
        let arrivalHour = parseInt(arrivalTime);
        if (arrivalHour === 24) {
          const date = new Date(arrivalDate);
          date.setDate(date.getDate() + 1);
          arrivalDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          arrivalHour = 0;
        }
        
        const departureDateTime = `${departureDateFormatted} ${String(departureHour).padStart(2, '0')}:00:00`;
        const arrivalDateTime = `${arrivalDateFormatted} ${String(arrivalHour).padStart(2, '0')}:00:00`;

        // 외국인일 경우 외국인등록번호에서 생년월일 추출
        let birthDateForApi = participant.birthDate;
        if (participant.nationality === '외국인' && participant.residentNumber) {
          const residentNum = participant.residentNumber;
          if (residentNum.length >= 6) {
            const yy = parseInt(residentNum.substring(0, 2));
            const mm = residentNum.substring(2, 4);
            const dd = residentNum.substring(4, 6);
            const year = yy >= 50 ? 1900 + yy : 2000 + yy;
            birthDateForApi = `${year}${mm}${dd}`;
          }
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-premium`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: '국내여행보험',
            age: age,
            birth_date: birthDateForApi,
            gender: participant.gender,
            plan_type: planType,
            plan_variant: 'B',
            has_medical_expense: hasMedicalExpense ? 1 : 0,
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            currency_plan: '원화',
            travel_country: null,
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
  const handleCalculate = async () => {
    // 입력 검증
    if (!departureDate || !arrivalDate || !birthDate || birthDate.length !== 8) {
      alert('모든 정보를 입력해주세요.');
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

    const genderValue = getGenderFromBirthDate(birthDate, gender);
    const availablePlans = await fetchAvailablePlans(age, genderValue);
    if (availablePlans.length === 0) {
      alert('가입 가능한 플랜이 없습니다.');
      return;
    }
    const coveragesMap = await fetchPlanCoverages(availablePlans);

    setIsCalculating(true);

    try {
      // 24시는 다음날 00시로 변환
      let departureDateFormatted = departureDate;
      let departureHour = parseInt(departureTime);
      if (departureHour === 24) {
        const date = new Date(departureDate);
        date.setDate(date.getDate() + 1);
        departureDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        departureHour = 0;
      }
      
      let arrivalDateFormatted = arrivalDate;
      let arrivalHour = parseInt(arrivalTime);
      if (arrivalHour === 24) {
        const date = new Date(arrivalDate);
        date.setDate(date.getDate() + 1);
        arrivalDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        arrivalHour = 0;
      }
      
      const departureDateTime = `${departureDateFormatted} ${String(departureHour).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDateFormatted} ${String(arrivalHour).padStart(2, '0')}:00:00`;
      // 각 플랜별 보험료 계산 (동적으로 생성)
      const plans: Record<string, PlanInfo> = {};

      // API 호출하여 각 플랜의 보험료 계산
      for (const planType of availablePlans) {
        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: '국내여행보험',
              age: age,
              birth_date: birthDate,
              gender: genderValue,
              plan_type: planType,
              plan_variant: 'B',
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: '원화',
              travel_country: null,
            }),
          });

          const data = await response.json();
          if (data.success) {
            // 플랜 정보 초기화 (보장내용은 기본값으로 설정, 추후 백엔드에서 받아올 수 있음)
            plans[planType] = {
              type: planType as PlanType,
              premium: data.premium,
              coverages: coveragesMap[planType] || [],
            };
          } else {
            console.error(`보험료 계산 실패 (${planType}):`, data.message);
          }
        } catch (error) {
          console.error(`보험료 계산 오류 (${planType}):`, error);
        }
      }

      setPlanInfo(plans);
      // 기본값: 실속플랜이 있으면 실속플랜, 없으면 첫 번째 플랜(어린이플랜/어르신플랜1 등)
      const defaultPlan = (availablePlans.includes('실속플랜') ? '실속플랜' : availablePlans[0]) as PlanType;
      setSelectedPlan(defaultPlan);
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
    if (paymentMethod === '기타결제' && paymentSubMethod === '가상계좌') {
      if (!depositBank) {
        alert('입금은행을 선택해주세요.');
        return;
      }
      if (!/^\d{3}$/.test(depositBank)) {
        alert('가상계좌 은행코드를 다시 선택해주세요.');
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
      // 24시는 다음날 00시로 변환
      let departureDateFormatted = departureDate;
      let departureHour = parseInt(departureTime);
      if (departureHour === 24) {
        const date = new Date(departureDate);
        date.setDate(date.getDate() + 1);
        departureDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        departureHour = 0;
      }
      
      let arrivalDateFormatted = arrivalDate;
      let arrivalHour = parseInt(arrivalTime);
      if (arrivalHour === 24) {
        const date = new Date(arrivalDate);
        date.setDate(date.getDate() + 1);
        arrivalDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        arrivalHour = 0;
      }
      
      const departureDateTime = `${departureDateFormatted} ${String(departureHour).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDateFormatted} ${String(arrivalHour).padStart(2, '0')}:00:00`;
      const periodDays = Math.ceil((new Date(`${arrivalDateFormatted}T${String(arrivalHour).padStart(2, '0')}:00:00`).getTime() - new Date(`${departureDateFormatted}T${String(departureHour).padStart(2, '0')}:00:00`).getTime()) / (1000 * 60 * 60 * 24));

      // 나이스페이먼츠, 네이버페이, 카카오페이는 먼저 계약 등록 후 결제 처리
      if (paymentMethod === '나이스페이먼츠' || paymentMethod === '네이버페이' || paymentMethod === '카카오페이') {
        // 1. 계약 등록 (결제 대기 상태)
        const trackingInfo = getTrackingInfo('PC');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: '국내여행보험',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: null,
            travel_country: null,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: 'PC',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${getResidentGenderCode(participants[0].birthDate, participants[0].gender)}000000` : '',
            mobile_phone: participants[0]?.phone || '',
            email: participants[0]?.email1 && participants[0]?.email2 ? `${participants[0].email1}@${participants[0].email2}` : '',
          },
          insured_persons: participants.map((p, idx) => {
            // 외국인일 경우 외국인등록번호에서 생년월일 추출
            let birthDateForAge = p.birthDate;
            if (p.nationality === '외국인' && p.residentNumber) {
              const residentNum = p.residentNumber;
              if (residentNum.length >= 6) {
                const yy = parseInt(residentNum.substring(0, 2));
                const mm = residentNum.substring(2, 4);
                const dd = residentNum.substring(4, 6);
                const year = yy >= 50 ? 1900 + yy : 2000 + yy;
                birthDateForAge = `${year}${mm}${dd}`;
              }
            }
            
            const age = calculateAgeFromBirthDate(birthDateForAge);
            // 국적 정보 변환
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            
            // resident_number 설정 (내국인: 주민번호, 외국인: 외국인등록번호)
            let residentNumber = '';
            if (p.nationality === '외국인') {
              // 외국인등록번호: 앞 6자리(YYMMDD)를 YYYYMMDD로 변환하고 하이픈 포함
              if (p.residentNumber && p.residentNumber.length === 13) {
                const yy = parseInt(p.residentNumber.substring(0, 2));
                const mm = p.residentNumber.substring(2, 4);
                const dd = p.residentNumber.substring(4, 6);
                const year = yy >= 50 ? 1900 + yy : 2000 + yy;
                const backPart = p.residentNumber.substring(6, 13);
                residentNumber = `${year}${mm}${dd}-${backPart}`;
              } else {
                residentNumber = p.residentNumber || '';
              }
            } else {
              residentNumber = p.birthDate ? `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}000000` : '';
            }
            
            return {
              sequence_number: idx + 1,
              name: p.name,
              english_name: (p as any).englishName || null,
              resident_number: residentNumber,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              nationality_type: nationalityType,
              nationality_continent: null, // 일반 경로에서는 외국인 대륙 정보를 수집하지 않음
              nationality_country: null, // 일반 경로에서는 외국인 국가 정보를 수집하지 않음
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
            goodsName: '국내여행보험',
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
              contractor_name: participants[0]?.name || '',
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
          try {
            localStorage.setItem('pendingPayment', JSON.stringify({
              contract_id,
              payment_method: paymentMethod,
              amount: receiptPremium,
              contractor_name: participants[0]?.name || '',
            }));
            await processNaverPayPayment({
              contractId: contract_id,
              amount: receiptPremium,
              productName: '국내여행보험',
              productCount: participants.length,
              customerName: participants[0]?.name || '',
              customerEmail: getFullEmail(participants[0]),
              customerPhone: participants[0]?.phone || '',
              checkOutDate: arrivalDate,
            });
            // 네이버 페이 결제창이 열리면, 콜백으로 결과가 처리됩니다
          } catch (error) {
            console.error('네이버 페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '네이버 페이 결제 중 오류가 발생했습니다.');
          }
        } else if (paymentMethod === '카카오페이') {
          try {
            localStorage.setItem('pendingPayment', JSON.stringify({
              contract_id,
              payment_method: paymentMethod,
              amount: receiptPremium,
              contractor_name: participants[0]?.name || '',
            }));
            await processKakaoPayPayment({
              contractId: contract_id,
              amount: receiptPremium,
              itemName: '국내여행보험',
              quantity: participants.length,
              customerName: participants[0]?.name || '',
              customerEmail: getFullEmail(participants[0]),
              customerPhone: participants[0]?.phone || '',
            });
            // 카카오페이 결제 페이지로 리다이렉트됨
          } catch (error) {
            console.error('카카오페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '카카오페이 결제 중 오류가 발생했습니다.');
          }
        }
      } else if (paymentMethod === '기타결제' && paymentSubMethod !== '가상계좌') {
        // 기타결제 (무통장입금, 수기카드)는 바로 계약 등록
        const trackingInfo = getTrackingInfo('PC');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: '국내여행보험',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: null,
            travel_country: null,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: 'PC',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${getResidentGenderCode(participants[0].birthDate, participants[0].gender)}000000` : '',
            mobile_phone: participants[0]?.phone || '',
            email: participants[0]?.email1 && participants[0]?.email2 ? `${participants[0].email1}@${participants[0].email2}` : '',
          },
          insured_persons: participants.map((p, idx) => {
            // 외국인일 경우 외국인등록번호에서 생년월일 추출
            let birthDateForAge = p.birthDate;
            if (p.nationality === '외국인' && p.residentNumber) {
              const residentNum = p.residentNumber;
              if (residentNum.length >= 6) {
                const yy = parseInt(residentNum.substring(0, 2));
                const mm = residentNum.substring(2, 4);
                const dd = residentNum.substring(4, 6);
                const year = yy >= 50 ? 1900 + yy : 2000 + yy;
                birthDateForAge = `${year}${mm}${dd}`;
              }
            }
            
            const age = calculateAgeFromBirthDate(birthDateForAge);
            // 국적 정보 변환
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            
            // resident_number 설정 (내국인: 주민번호, 외국인: 외국인등록번호)
            let residentNumber = '';
            if (p.nationality === '외국인') {
              // 외국인등록번호: 앞 6자리(YYMMDD)를 YYYYMMDD로 변환하고 하이픈 포함
              if (p.residentNumber && p.residentNumber.length === 13) {
                const yy = parseInt(p.residentNumber.substring(0, 2));
                const mm = p.residentNumber.substring(2, 4);
                const dd = p.residentNumber.substring(4, 6);
                const year = yy >= 50 ? 1900 + yy : 2000 + yy;
                const backPart = p.residentNumber.substring(6, 13);
                residentNumber = `${year}${mm}${dd}-${backPart}`;
              } else {
                residentNumber = p.residentNumber || '';
              }
            } else {
              residentNumber = p.birthDate ? `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}000000` : '';
            }
            
            return {
              sequence_number: idx + 1,
              name: p.name,
              english_name: (p as any).englishName || null,
              resident_number: residentNumber,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              nationality_type: nationalityType,
              nationality_continent: null, // 일반 경로에서는 외국인 대륙 정보를 수집하지 않음
              nationality_country: null, // 일반 경로에서는 외국인 국가 정보를 수집하지 않음
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
            expected_deposit_date: paymentSubMethod === '무통장입금' && expectedDepositYear && expectedDepositMonth && expectedDepositDay 
              ? `${expectedDepositYear}-${String(expectedDepositMonth).padStart(2, '0')}-${String(expectedDepositDay).padStart(2, '0')}` 
              : null,
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
          setCompletedContractorName(participants[0]?.name || '');
          setShowPaymentScreen(false);
          setShowCompletionScreen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert(data.message || '계약 등록에 실패했습니다.');
        }
      } else if (paymentMethod === '기타결제' && paymentSubMethod === '가상계좌') {
        // 가상계좌 결제 처리 (결제창 Server 승인 모델)
        // 1. 계약 등록 (결제 대기 상태)
        const trackingInfo = getTrackingInfo('PC');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: '국내여행보험',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: null,
            travel_country: null,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: 'PC',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${getResidentGenderCode(participants[0].birthDate, participants[0].gender)}000000` : '',
            mobile_phone: participants[0]?.phone || '',
            email: participants[0]?.email1 && participants[0]?.email2 
              ? `${participants[0].email1}@${participants[0].email2 === '직접입력' ? participants[0].customEmail : participants[0].email2}`
              : '',
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            return {
              sequence_number: idx + 1,
              name: p.name,
              english_name: (p as any).englishName || null,
              resident_number: `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}000000`,
              gender: p.gender,
              age: age || 0,
              plan_type: selectedPlan || '실속플랜',
              premium: calculatedPremiums?.participants.find(cp => cp.id === p.id)?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              nationality_type: nationalityType,
              nationality_continent: null,
              nationality_country: null,
            };
          }),
          companions: [],
          payment: {
            payment_method: '기타결제',
            payment_sub_method: '가상계좌',
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

        // 2. 결제창 호출 (AUTHNICE Server 승인 모델)
        const paymentRequest = await requestNicepayPayment({
          contract_id,
          amount: receiptPremium,
          orderId: contractData_result.contract_number,
          goodsName: '국내여행보험',
          buyerName: participants[0]?.name || '',
          buyerEmail: participants[0]?.email1 && participants[0]?.email2 
            ? `${participants[0].email1}@${participants[0].email2 === '직접입력' ? participants[0].customEmail : participants[0].email2}`
            : '',
          buyerTel: participants[0]?.phone || '',
          returnUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/nicepay/callback`,
          closeUrl: `${window.location.origin}/payment/close`,
        });

        if (paymentRequest.success) {
          localStorage.setItem('pendingPayment', JSON.stringify({
            contract_id,
            payment_method: '기타결제',
            payment_sub_method: '가상계좌',
            amount: receiptPremium,
            contractor_name: participants[0]?.name || '',
          }));
          try {
            await openNicepayWindow({
              ...paymentRequest,
              method: 'vbank',
              bankCode: depositBank,
              vbankHolder: participants[0]?.name || '',
            });
          } catch (error) {
            console.error('가상계좌 결제창 열기 오류:', error);
            alert(error instanceof Error ? error.message : '가상계좌 결제창을 여는 중 오류가 발생했습니다.');
          }
        } else {
          alert(paymentRequest.message || '가상계좌 결제 요청에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('계약 등록 오류:', error);
      alert('계약 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="domestic-page-pc">
      <Header isMobile={false} />
      
      <main 
        className="domestic-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* 오른쪽 고정 버튼 */}
        <div className="container_box_w">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCashModal(true); }}>
            <div className="fixedRight_b01">
              <p className="icon_cash"><span className="icon_cash01"></span></p>
              <p className="fixedRight_txt01">무사고캐시란?</p>
            </div>
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); setShowServiceModal(true); }}>
            <div className="fixedRight_b02" style={{}}>
              <p className="icon_menu"><span className="icon_menu01"></span></p>
              <p className="fixedRight_txt02">서비스<br/>전체보기</p>
            </div>
          </a>
        </div>

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
            insuranceType="국내여행자보험"
            timeOptions={timeOptions}
            onContractDetailClick={handleContractDetailClick}
          />
        )}

        {/* STEP 2: 가입정보 입력 화면 */}
        {showParticipantForm && !showStep2_1 && !showStep3 && !showPaymentScreen && !showCompletionScreen && (
          <ParticipantInfoStep
            insuranceType="국내여행자보험"
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
            insuranceType="국내여행자보험"
            hasDangerousActivity={hasDangerousActivity}
            travelPurpose={travelPurpose}
            onDangerousActivityChange={setHasDangerousActivity}
            onTravelPurposeChange={setTravelPurpose}
            onShowDangerousActivityModal={() => setShowDangerousActivityModal(true)}
            onNext={() => {
              if (hasDangerousActivity === null) {
                alert('위험한 활동 포함 여부를 선택해주세요.');
                return;
              }
              if (hasDangerousActivity === true) {
                alert('죄송합니다. 고객님\n여행기간 중 위험한 활동이 포함된 경우 여행보험에 가입할 수 없습니다.');
                return;
              }
              if (!travelPurpose) {
                alert('여행목적을 선택해주세요.');
                return;
              }
              if (['래프팅', '스키/스노보드'].includes(travelPurpose)) {
                alert(
                  '죄송합니다 고객님\n래프팅, 스키/스노보드를 목적으로 국내여행을 가는 경우에는 여행보험에 가입하실 수 없습니다.'
                );
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

        {/* 보장 상세보기 모달 */}
        {selectedCoveragePlanType && (
          <CoverageDetailModal
            isOpen={showCoverageDetailModal}
            onClose={() => {
              setShowCoverageDetailModal(false);
              setSelectedCoveragePlanType(null);
            }}
            planType={selectedCoveragePlanType}
            insuranceType="국내여행보험"
            isMedicalExpense={hasMedicalExpense}
          />
        )}

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
        />

        {/* STEP 3: 계약정보 및 결제 화면 */}
        {showStep3 && !showCompletionScreen && (
          <ContractInfoStep
            insuranceType="국내여행자보험"
            insuranceCompany="라이나손해"
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            travelPurpose={travelPurpose}
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
            participantName={completedContractorName}
            onViewDetails={() => {
              router.push('/contracts');
            }}
            onGoHome={() => {
              router.push('/');
            }}
          />
        )}

        {/* 엑셀 등록 모달 */}
        <ExcelUploadModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          onUpload={(newParticipants, startId) => {
            // 엑셀 데이터로 기존 참가자 목록을 완전히 교체
            const participantsWithCorrectIds = newParticipants.map((p, index) => ({
              ...p,
              id: index + 1, // ID를 1부터 시작하도록 설정
            }));
            
            setParticipants(participantsWithCorrectIds);
            setShowExcelModal(false);
          }}
          currentParticipants={participants}
        />

      </main>

      <Footer isMobile={false} />
      
      {/* 서비스 전체보기 모달 */}
      <ServiceModal 
        isOpen={showServiceModal} 
        onClose={() => setShowServiceModal(false)} 
      />
      
      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />
    </div>
  );
}

