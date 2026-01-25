'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { requestNicepayPayment, openNicepayWindow, processNaverPayPayment, processKakaoPayPayment } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileStepIndicator from '@/components/mobiletravel/StepIndicator';
import MobileTravelInfoStep from '@/components/mobiletravel/TravelInfoStep';
import MobilePlanSelection from '@/components/mobiletravel/PlanSelection';
import FixedBottomButtons from '@/components/mobiletravel/FixedBottomButtons';
import ParticipantInfoStep from '@/components/travel/ParticipantInfoStep';
import RiskActivityStep from '@/components/travel/RiskActivityStep';
import ContractInfoStep from '@/components/travel/ContractInfoStep';
import PaymentStep from '@/components/travel/PaymentStep';
import CompletionStep from '@/components/travel/CompletionStep';
import ExcelUploadModal from '@/components/travel/ExcelUploadModal';
import DangerousActivityModal from '@/components/travel/DangerousActivityModal';
import ConsentModal from '@/components/travel/ConsentModal';
import { PlanType, PlanInfo, Participant, CalculatedPremiums, PaymentMethod, PaymentSubMethod } from '@/components/travel/types';
import './page.css';

function MobileDomesticStep1Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { member, isLoggedIn } = useAuth();

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  
  // Get current hour + 2 hours (default time)
  const currentHour = today.getHours();
  const calculatedHour = currentHour + 2;
  const defaultHour = calculatedHour === 24 ? 24 : (calculatedHour > 24 ? calculatedHour % 24 || 24 : calculatedHour);

  const [departureDate, setDepartureDate] = useState(formattedDate);
  const [departureTime, setDepartureTime] = useState(String(defaultHour).padStart(2, '0'));
  const [arrivalDate, setArrivalDate] = useState(formattedDate);
  const [arrivalTime, setArrivalTime] = useState(String(defaultHour).padStart(2, '0'));
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'W'>('M');
  
  // 보험료 계산 관련 상태
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [planInfo, setPlanInfo] = useState<Record<string, PlanInfo> | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [hasMedicalExpense, setHasMedicalExpense] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // 가입자 정보 입력 화면 관련 상태
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [participantCount, setParticipantCount] = useState<1 | 2>(1);
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
  const [calculatedPremiums, setCalculatedPremiums] = useState<CalculatedPremiums | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  
  // STEP2-1 관련 상태
  const [showStep2_1, setShowStep2_1] = useState(false);
  const [hasDangerousActivity, setHasDangerousActivity] = useState<boolean | null>(null);
  const [travelPurpose, setTravelPurpose] = useState<string>('');
  const [showDangerousActivityModal, setShowDangerousActivityModal] = useState(false);
  
  // 동의서 모달 관련 상태
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  // STEP 3 관련 상태
  const [showStep3, setShowStep3] = useState(false);
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [receiptPremium, setReceiptPremium] = useState<number>(0);
  const [normalPremium, setNormalPremium] = useState<number>(0);
  const [useAccidentFreeCash, setUseAccidentFreeCash] = useState(0);
  const [accidentFreeCash, setAccidentFreeCash] = useState(0);
  
  // 결제 관련 상태
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentSubMethod, setPaymentSubMethod] = useState<PaymentSubMethod | null>(null);
  const [depositBank, setDepositBank] = useState<string>('우리은행');
  const [depositorName, setDepositorName] = useState<string>('');
  const [expectedDepositYear, setExpectedDepositYear] = useState<number>(0);
  const [expectedDepositMonth, setExpectedDepositMonth] = useState<number>(0);
  const [expectedDepositDay, setExpectedDepositDay] = useState<number>(0);
  const [cardType, setCardType] = useState<'본인카드' | '기타카드'>('본인카드');
  const [cardCategory, setCardCategory] = useState<string>('개인');
  const [cardNumber1, setCardNumber1] = useState<string>('');
  const [cardNumber2, setCardNumber2] = useState<string>('');
  const [cardNumber3, setCardNumber3] = useState<string>('');
  const [cardNumber4, setCardNumber4] = useState<string>('');
  const [cardExpiryMonth, setCardExpiryMonth] = useState<string>('');
  const [cardExpiryYear, setCardExpiryYear] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>('');
  const [cardholderResidentNumber, setCardholderResidentNumber] = useState<string>('');
  const [approvalYear, setApprovalYear] = useState<number>(0);
  const [approvalMonth, setApprovalMonth] = useState<number>(0);
  const [approvalDay, setApprovalDay] = useState<number>(0);
  const [isSamePremium, setIsSamePremium] = useState<boolean>(false);
  
  const planSelectionRef = useRef<HTMLDivElement>(null);

  // 성별에 따른 주민등록번호 성별코드 계산
  const getGenderFromBirthDate = (birthDateStr: string, selectedGender: 'M' | 'W'): string => {
    if (birthDateStr.length < 8) return selectedGender === 'M' ? '남자' : '여자';
    
    const year = parseInt(birthDateStr.substring(0, 4));
    const isBefore2000 = year < 2000;
    
    if (selectedGender === 'M') {
      return isBefore2000 ? '남자' : '남자';
    } else {
      return isBefore2000 ? '여자' : '여자';
    }
  };

  // 생년월일로부터 보험나이 계산 (만나이에서 6개월 경과 시 +1)
  const calculateAgeFromBirthDate = (birthDateStr: string): number | null => {
    if (birthDateStr.length !== 8) return null;
    
    try {
      const year = parseInt(birthDateStr.substring(0, 4));
      const month = parseInt(birthDateStr.substring(4, 6));
      const day = parseInt(birthDateStr.substring(6, 8));
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      
      const today = new Date();
      const birthDate = new Date(year, month - 1, day);
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // 만나이 계산
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // 보험나이 계산: 만나이에서 6개월이 경과하면 +1
      // 생일로부터 6개월 후 날짜 계산
      const sixMonthsLater = new Date(birthDate);
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

  // 이메일 전체 주소 가져오기
  const getFullEmail = (participant: Participant): string => {
    if (!participant.email1 || !participant.email2) return '';
    return `${participant.email1}@${participant.email2}`;
  };

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

  // 보험료 계산 함수 (재사용 가능)
  const calculatePremiums = async () => {
    if (!planInfo || !selectedPlan) return;

    // 나이 계산
    const age = calculateAgeFromBirthDate(birthDate);
    if (age === null) return;

    // 사용 가능한 플랜 (국내여행보험은 실속플랜, 표준플랜만)
    const availablePlans: PlanType[] = ['실속플랜', '표준플랜'];

    // 기본 보장 항목 정의
    const baseCoverages = [
      { label: '상해사망/후유장해', amount: '3,000만원' },
      { label: '상해의료비', amount: '100만원' },
      { label: '질병사망', amount: '100만원' },
      { label: '배상책임', amount: '1,000만원' },
    ];

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

      // 각 플랜별 보험료 계산 (모든 availablePlans를 계산)
      const plans: Record<string, PlanInfo> = {};

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
              gender: genderValue,
              plan_type: planType,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: '원화',
              travel_country: null,
            }),
          });

          const data = await response.json();
          if (data.success) {
            plans[planType] = {
              type: planType,
              premium: data.premium,
              coverages: baseCoverages, // baseCoverages 사용
            };
          }
        } catch (error) {
          console.error(`보험료 계산 오류 (${planType}):`, error);
        }
      }

      setPlanInfo(plans);
    } catch (error) {
      console.error('보험료 재계산 오류:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // hasMedicalExpense 변경 시 보험료 재계산
  useEffect(() => {
    if (showPlanSelection && planInfo && selectedPlan) {
      calculatePremiums();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMedicalExpense]);

  // 페이지 마운트 시 저장된 상태 복원 (coverage-detail에서 돌아올 때)
  useEffect(() => {
    const restoreState = () => {
      try {
        const savedState = localStorage.getItem('domestic_m_state');
        if (savedState) {
          const state = JSON.parse(savedState);
          // showPlanSelection이 true이고 planInfo가 있으면 상태 복원
          // 단, 이미 상태가 복원되어 있으면 복원하지 않음 (중복 복원 방지)
          if (state.showPlanSelection && state.planInfo && (!showPlanSelection || !planInfo)) {
            setShowPlanSelection(state.showPlanSelection);
            setPlanInfo(state.planInfo);
            setSelectedPlan(state.selectedPlan);
            setHasMedicalExpense(state.hasMedicalExpense || true);
            // 다른 상태들도 복원 (필요한 경우)
            if (state.departureDate) setDepartureDate(state.departureDate);
            if (state.departureTime) setDepartureTime(state.departureTime);
            if (state.arrivalDate) setArrivalDate(state.arrivalDate);
            if (state.arrivalTime) setArrivalTime(state.arrivalTime);
            if (state.birthDate) setBirthDate(state.birthDate);
            if (state.gender) setGender(state.gender);
          }
          // 상태 복원 여부와 관계없이 localStorage는 유지 (다음 coverage-detail 방문 시에도 사용)
        }
      } catch (error) {
        console.error('상태 복원 오류:', error);
        localStorage.removeItem('domestic_m_state');
      }
    };

    // URL에 returnUrl 파라미터가 있으면 (coverage-detail에서 돌아온 경우) 상태 복원
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl === '/domestic/m' || window.location.pathname === '/domestic/m') {
      restoreState();
    }
  }, [searchParams, showPlanSelection, planInfo]);

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

    // 국내여행보험 플랜 (실속플랜, 표준플랜만)
    const availablePlans: PlanType[] = ['실속플랜', '표준플랜'];

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

      // 보험 타입
      const insuranceType = '국내여행보험';

      // 기본 보장 항목 정의
      const baseCoverages = [
        { label: '상해사망/후유장해', amount: '3,000만원' },
        { label: '상해의료비', amount: '100만원' },
        { label: '질병사망', amount: '100만원' },
        { label: '배상책임', amount: '1,000만원' },
      ];

      const plans: Record<string, PlanInfo> = {};

      for (const planType of availablePlans) {
        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: insuranceType,
              age: age,
              gender: genderValue,
              plan_type: planType,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: '원화',
              travel_country: null,
            }),
          });

          const data = await response.json();

          if (data.success) {
            plans[planType] = {
              type: planType,
              premium: data.premium,
              coverages: baseCoverages,
            };
          }
        } catch (error) {
          console.error(`보험료 계산 오류 (${planType}):`, error);
        }
      }

      if (Object.keys(plans).length === 0) {
        alert('보험료 계산에 실패했습니다.');
        setIsCalculating(false);
        return;
      }

      setPlanInfo(plans);
      setSelectedPlan(availablePlans[0]);
      setShowPlanSelection(true);
      
      // 상태를 localStorage에 저장 (coverage-detail 페이지에서 돌아올 때 복원용)
      try {
        localStorage.setItem('domestic_m_state', JSON.stringify({
          showPlanSelection: true,
          planInfo: plans,
          selectedPlan: availablePlans[0],
          hasMedicalExpense,
          departureDate,
          departureTime,
          arrivalDate,
          arrivalTime,
          birthDate,
          gender,
        }));
      } catch (error) {
        console.error('상태 저장 오류:', error);
      }

      // 스크롤 이동
      setTimeout(() => {
        if (planSelectionRef.current) {
          const elementPosition = planSelectionRef.current.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - 80;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (error) {
      console.error('보험료 계산 오류:', error);
      alert('보험료 계산에 실패했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  // 가입자 정보 입력 화면으로 이동
  const handleProceedToParticipantInfo = () => {
    if (!selectedPlan) {
      alert('플랜을 선택해주세요.');
      return;
    }
    setShowPlanSelection(false);
    setShowParticipantForm(true);
    setParticipants([
      {
        id: 1,
        name: '',
        nationality: '내국인',
        birthDate: birthDate || '',
        gender: gender === 'M' ? '남자' : '여자',
        email1: '',
        email2: '',
        phone: '',
        isVerified: false,
      },
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        // 플랜 타입 결정 (STEP1에서 선택한 플랜 사용)
        const planType = selectedPlan === '실속플랜' ? '실속플랜' : '표준플랜';

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

        const response = await fetch('/api/travel/calculate-premium', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: '국내여행보험',
            age: age,
            gender: participant.gender,
            plan_type: planType,
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

      // 십원단위 절삭
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

  // STEP 2-1 화면으로 이동
  const handleProceedToStep2_1 = () => {
    if (!calculatedPremiums || calculatedPremiums.totalPremium <= 0) {
      alert('보험료를 먼저 계산해주세요.');
      return;
    }
    setShowParticipantForm(false);
    setShowStep2_1(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 위험활동 답변 핸들러
  const handleDangerousActivityResponse = (value: boolean) => {
    if (value) {
      setShowDangerousActivityModal(true);
    } else {
      setHasDangerousActivity(value);
    }
  };

  // 위험활동 모달 닫기 및 동의서 모달 열기
  const handleDangerousActivityModalConfirm = () => {
    setShowDangerousActivityModal(false);
    setHasDangerousActivity(false);
    setShowConsentModal(true);
  };

  // STEP 3로 이동
  const handleProceedToStep3 = () => {
    if (hasDangerousActivity === null) {
      alert('위험활동 여부를 선택해주세요.');
      return;
    }

    if (!travelPurpose) {
      alert('여행목적을 선택해주세요.');
      return;
    }

    if (hasDangerousActivity) {
      setShowDangerousActivityModal(true);
      return;
    }

    setShowConsentModal(true);
  };

  // 결제 처리
  const handlePaymentSubmit = async () => {
    // 결제 방법 검증
    if (!paymentMethod) {
      alert('결제 방법을 선택해주세요.');
      return;
    }

    if (paymentMethod === '기타결제') {
      if (!paymentSubMethod) {
        alert('결제 세부 방법을 선택해주세요.');
        return;
      }

      if (paymentSubMethod === '무통장입금') {
        if (!depositBank || !depositorName || expectedDepositYear === 0 || expectedDepositMonth === 0 || expectedDepositDay === 0) {
          alert('입금 정보를 모두 입력해주세요.');
          return;
        }
      } else if (paymentSubMethod === '가상계좌') {
        if (!depositBank) {
          alert('입금은행을 선택해주세요.');
          return;
        }
      } else if (paymentSubMethod === '수기카드') {
        if (!cardNumber1 || !cardNumber2 || !cardNumber3 || !cardNumber4 ||
            !cardExpiryMonth || !cardExpiryYear || !cardholderName || !cardholderResidentNumber ||
            approvalYear === 0 || approvalMonth === 0 || approvalDay === 0) {
          alert('카드 정보를 모두 입력해주세요.');
          return;
        }
      }
    }

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

      // 기간 계산
      const departure = new Date(departureDateTime);
      const arrival = new Date(arrivalDateTime);
      const diffTime = arrival.getTime() - departure.getTime();
      const periodDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // 나이스페이먼츠, 네이버페이, 카카오페이는 먼저 계약 등록 후 결제
      if (paymentMethod === '나이스페이먼츠' || paymentMethod === '네이버페이' || paymentMethod === '카카오페이') {
        // 1. 계약 등록 (결제 대기 상태)
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
            device: '모바일',
            access_path: '투어밸리 모바일 사이트',
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${participants[0].gender === '남자' ? '1' : '2'}******` : '',
            mobile_phone: participants[0]?.phone || '',
            email: getFullEmail(participants[0]),
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${p.gender === '남자' ? '1' : '2'}******`,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
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
            goodsName: '국내여행자보험',
            buyerName: participants[0]?.name || '',
            buyerEmail: getFullEmail(participants[0]),
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
          try {
            await processNaverPayPayment({
              contractId: contract_id,
              amount: receiptPremium,
              productName: '국내여행자보험',
              productCount: participants.length,
              customerName: participants[0]?.name || '',
              customerEmail: getFullEmail(participants[0]),
              customerPhone: participants[0]?.phone || '',
              checkOutDate: arrivalDate,
            });
          } catch (error) {
            console.error('네이버 페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '네이버 페이 결제 중 오류가 발생했습니다.');
          }
        } else if (paymentMethod === '카카오페이') {
          try {
            await processKakaoPayPayment({
              contractId: contract_id,
              amount: receiptPremium,
              itemName: '국내여행자보험',
              quantity: participants.length,
              customerName: participants[0]?.name || '',
              customerEmail: getFullEmail(participants[0]),
              customerPhone: participants[0]?.phone || '',
            });
          } catch (error) {
            console.error('카카오페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '카카오페이 결제 중 오류가 발생했습니다.');
          }
        }
      } else if (paymentMethod === '기타결제' && paymentSubMethod !== '가상계좌') {
        // 기타결제 (무통장입금, 수기카드)는 바로 계약 등록
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
            device: '모바일',
            access_path: '투어밸리 모바일 사이트',
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${participants[0].gender === '남자' ? '1' : '2'}******` : '',
            mobile_phone: participants[0]?.phone || '',
            email: getFullEmail(participants[0]),
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${p.gender === '남자' ? '1' : '2'}******`,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
            };
          }),
          companions: [],
          payment: {
            payment_method: paymentMethod || '기타결제',
            payment_sub_method: paymentSubMethod || null,
            amount: receiptPremium,
            status: (paymentSubMethod === '무통장입금' || paymentSubMethod === '수기카드') ? '대기' : '완료',
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

        const response = await fetch('/api/travel/register-contract', {
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
      } else if (paymentMethod === '기타결제' && paymentSubMethod === '가상계좌') {
        // 가상계좌 결제 처리 (결제창 Server 승인 모델)
        // 1. 계약 등록 (결제 대기 상태)
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
            device: '모바일',
            access_path: '투어밸리 모바일 사이트',
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            phone: participants[0]?.phone || '',
            email: getFullEmail(participants[0]) || null,
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${p.gender === '남자' ? '1' : '2'}******`,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
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

        const contractResponse = await fetch('/api/travel/register-contract', {
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
          buyerEmail: getFullEmail(participants[0]) || '',
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

  // 2인 이상 가입 클릭 핸들러
  const handleTwoOrMoreClick = () => {
    setParticipantCount(2);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1인 가입 클릭 핸들러
  const handleSingleClick = () => {
    setParticipantCount(1);
    setShowPlanSelection(false);
    setShowParticipantForm(true);
    setParticipants([
      {
        id: 1,
        name: '',
        nationality: '내국인',
        birthDate: birthDate || '',
        gender: gender === 'M' ? '남자' : '여자',
        email1: '',
        email2: '',
        phone: '',
        isVerified: false,
      },
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTitle = () => {
    return '국내여행자보험';
  };

  // 현재 단계 계산
  const getCurrentStep = () => {
    if (showStep3) return 3;
    if (showStep2_1) return 2;
    if (showParticipantForm) return 2;
    return 1;
  };

  return (
    <div className="domestic-step1-mobile">
      <Header isMobile={true} />
      
      {/* STEP 1: 여행정보 입력 화면 */}
      {!showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          {/* 상단 타이틀 가입단계 */}
          <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
            <p className="tour2023_title01">{getTitle()}</p>
            {/* 가입 단계 */}
            <MobileStepIndicator currentStep={getCurrentStep()} />
          </div>

          {/* input 정보입력 */}
          <MobileTravelInfoStep
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            birthDate={birthDate}
            gender={gender}
            travelCountry=""
            travelPurpose=""
            onDepartureDateChange={setDepartureDate}
            onDepartureTimeChange={setDepartureTime}
            onArrivalDateChange={setArrivalDate}
            onArrivalTimeChange={setArrivalTime}
            onBirthDateChange={setBirthDate}
            onGenderChange={setGender}
            onTravelCountryChange={() => {}}
            onTravelPurposeChange={() => {}}
            travelCountries={[]}
            type="short"
          />

          {/* 버튼 */}
          <div className="tourG_mat04 tourG_mab02">
            <a
              href="javascript:void(0);"
              onClick={(e) => {
                e.preventDefault();
                handleCalculate();
              }}
              className="tourGuard_btn_b tour2023_btn01"
              style={{ opacity: isCalculating ? 0.6 : 1, pointerEvents: isCalculating ? 'none' : 'auto' }}
            >
              {isCalculating ? '계산 중...' : '보험료 계산하기'}
            </a>
          </div>

          {/* 플랜 선택 영역 */}
          <div ref={planSelectionRef}>
            {showPlanSelection && planInfo && (
              <MobilePlanSelection
                planInfo={planInfo}
                selectedPlan={selectedPlan}
                onPlanSelect={setSelectedPlan}
                hasMedicalExpense={hasMedicalExpense}
                onMedicalExpenseChange={setHasMedicalExpense}
                insuranceType={getTitle()}
                onContractDetailClick={(planType) => {
                  // coverage-detail로 이동하기 전에 현재 상태를 다시 저장 (최신 상태 유지)
                  if (showPlanSelection && planInfo) {
                    try {
                      localStorage.setItem('domestic_m_state', JSON.stringify({
                        showPlanSelection: true,
                        planInfo: planInfo,
                        selectedPlan: selectedPlan,
                        hasMedicalExpense,
                        departureDate,
                        departureTime,
                        arrivalDate,
                        arrivalTime,
                        birthDate,
                        gender,
                      }));
                    } catch (error) {
                      console.error('상태 저장 오류:', error);
                    }
                  }
                  
                  const returnUrl = encodeURIComponent('/domestic/m');
                  // insuranceType 매핑: '국내여행자보험' -> '국내여행보험'
                  const insuranceType = getTitle() === '국내여행자보험' ? '국내여행보험' : getTitle();
                  // 국내여행보험은 실손/비실손 구분이 있음
                  const isMedicalExpenseParam = hasMedicalExpense ? 'true' : 'false';
                  router.push(`/coverage-detail/m?planType=${planType}&insuranceType=${encodeURIComponent(insuranceType)}&isMedicalExpense=${isMedicalExpenseParam}&returnUrl=${returnUrl}`);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* STEP 2: 가입자 정보 입력 화면 */}
      {showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          {/* 상단 타이틀 가입단계 */}
          <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
            <p className="tour2023_title01">{getTitle()}</p>
            {/* 가입 단계 */}
            <MobileStepIndicator currentStep={getCurrentStep()} />
          </div>

          <ParticipantInfoStep
            insuranceType={getTitle()}
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            participants={participants}
            calculatedPremiums={calculatedPremiums}
            hasMedicalExpense={hasMedicalExpense}
            isCalculating={isCalculating}
            participantCount={participantCount}
            selectedPlan={selectedPlan}
            calculateAgeFromBirthDate={calculateAgeFromBirthDate}
            onParticipantsChange={setParticipants}
            onCalculatedPremiumsChange={setCalculatedPremiums}
            onCalculate={handleCalculateParticipants}
            onApply={() => {
              if (!calculatedPremiums || calculatedPremiums.totalPremium <= 0) {
                alert('보험료를 먼저 계산해주세요.');
                return;
              }
              setShowParticipantForm(false);
              setShowStep2_1(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExcelUpload={() => {}}
          />

        </div>
      )}

      {/* STEP 2-1: 위험활동 확인 화면 */}
      {showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          {/* 상단 타이틀 가입단계 */}
          <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
            <p className="tour2023_title01">{getTitle()}</p>
            {/* 가입 단계 */}
            <MobileStepIndicator currentStep={getCurrentStep()} />
          </div>

          <RiskActivityStep
            insuranceType={getTitle()}
            travelPurpose={travelPurpose}
            hasDangerousActivity={hasDangerousActivity}
            isCurrentlyAbroad={null}
            hasRestrictedCountry={null}
            onDangerousActivityChange={(value) => {
              if (value) {
                setShowDangerousActivityModal(true);
              } else {
                setHasDangerousActivity(value);
              }
            }}
            onCurrentlyAbroadChange={() => {}}
            onRestrictedCountryChange={() => {}}
            onTravelPurposeChange={setTravelPurpose}
            onShowDangerousActivityModal={() => setShowDangerousActivityModal(true)}
            onNext={handleProceedToStep3}
          />

          {/* 버튼 영역 */}
          <div className="tourG_mat04 tourG_mab02">
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="javascript:void(0);"
                onClick={(e) => {
                  e.preventDefault();
                  setShowStep2_1(false);
                  setShowParticipantForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="tourGuard_btn_b tour2023_btn03"
                style={{ width: '50%' }}
              >
                이전
              </a>
              <a
                href="javascript:void(0);"
                onClick={(e) => {
                  e.preventDefault();
                  handleProceedToStep3();
                }}
                className="tourGuard_btn_b tour2023_btn01"
                style={{ width: '50%', opacity: hasDangerousActivity === null ? 0.6 : 1, pointerEvents: hasDangerousActivity === null ? 'none' : 'auto' }}
              >
                다음
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 위험활동 모달 */}
      <DangerousActivityModal
        isOpen={showDangerousActivityModal}
        onClose={handleDangerousActivityModalConfirm}
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
        insuranceType={getTitle()}
      />

      {/* STEP 3: 계약정보 및 결제 화면 */}
      {showStep3 && !showCompletionScreen && (
        <>
          {/* 상단 타이틀 가입단계 */}
          <div className="prow_01">
            <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
              <p className="tour2023_title01">{getTitle()}</p>
              {/* 가입 단계 */}
              <MobileStepIndicator currentStep={getCurrentStep()} />
            </div>
          </div>
          
          <ContractInfoStep
            insuranceType={getTitle()}
            insuranceCompany="메리츠화재"
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            travelPurpose={travelPurpose}
            travelCountry=""
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
          
          {/* 결제 화면 */}
          {showPaymentScreen && (
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
                setCardExpiryMonth(String(month));
                setCardExpiryYear(String(year));
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
        </>
      )}

      {/* 결제 완료 화면 */}
      {showCompletionScreen && (
        <CompletionStep
          participantName={participants[0]?.name || ''}
          onViewDetails={() => {
            router.push('/contracts');
          }}
          onGoHome={() => {
            router.push('/');
          }}
        />
      )}

      {/* Excel 업로드 모달 */}
      <ExcelUploadModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onUpload={(data) => {
          console.log('Excel data:', data);
          setShowExcelModal(false);
        }}
      />

      {/* 하단 고정버튼 (STEP 2-1, STEP 3, 완료 화면에서는 숨김) */}
      {!showStep2_1 && !showStep3 && !showCompletionScreen && (
        <FixedBottomButtons 
          canProceed={showPlanSelection && selectedPlan !== null}
          onTwoOrMoreClick={handleTwoOrMoreClick}
          onSingleClick={handleSingleClick}
        />
      )}

      {/* 심의번호 */}
      <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
        <span className="tour2023_txt02 tour2023_grey">
          <span>
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
            준법감시필 제2025-광고T-002(2025.04.07-2026-04.06)
          </span>
        </span>
      </div>

      <Footer isMobile={true} />
    </div>
  );
}

export default function MobileDomesticStep1Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileDomesticStep1Content />
    </Suspense>
  );
}
