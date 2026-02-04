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
import RestrictedCountryModal from '@/components/travel/RestrictedCountryModal';
import ConsentModal from '@/components/travel/ConsentModal';
import { PlanType, PlanInfo, Participant, CalculatedPremiums, PaymentMethod, PaymentSubMethod } from '@/components/travel/types';
import { allCountries, frequentCountries } from '@/components/travel/utils/countries';
import './page.css';

const WORKING_HOLIDAY_PLAN_MAPPING: Record<string, string> = {
  '실속플랜': '워킹홀리데이실속플랜',
  '표준플랜': '워킹홀리데이표준플랜',
  '고급플랜': '워킹홀리데이(유로화플랜)',
};

function MobileLongTermStayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { member, isLoggedIn } = useAuth();
  
  // 장기체류보험은 항상 'long' 타입
  const type = 'long' as const;

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
  const [gender, setGender] = useState<'M' | 'W'>('M');
  const [travelCountry, setTravelCountry] = useState('');
  const [travelPurpose, setTravelPurpose] = useState(''); // 여행목적 (STEP2-1에서 사용)
  const [travelPurposeLong, setTravelPurposeLong] = useState('N010001'); // 장기여행 목적 코드 (STEP1에서 사용)
  const [travelCountries, setTravelCountries] = useState<Array<{ code: string; name: string }>>([]);
  
  // 보험료 계산 관련 상태
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [planInfo, setPlanInfo] = useState<Record<string, PlanInfo> | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [hasMedicalExpense, setHasMedicalExpense] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currencyPlan, setCurrencyPlan] = useState<'원화' | '외화'>('원화');
  
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
  const [showDangerousActivityModal, setShowDangerousActivityModal] = useState(false);
  const [isCurrentlyAbroad, setIsCurrentlyAbroad] = useState<boolean | null>(null);
  const [hasRestrictedCountry, setHasRestrictedCountry] = useState<boolean | null>(null);
  const [showRestrictedCountryModal, setShowRestrictedCountryModal] = useState(false);
  
  // 동의서 모달 관련 상태
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  // STEP 3 관련 상태
  const [showStep3, setShowStep3] = useState(false);
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [receiptPremium, setReceiptPremium] = useState<number>(0);
  const [normalPremium, setNormalPremium] = useState<number>(0);
  const [useAccidentFreeCash, setUseAccidentFreeCash] = useState(0);
  const [accidentFreeCash, setAccidentFreeCash] = useState(0);

  // 로그인 회원의 무사고캐시 보유액 반영 (계약정보 단계에서 표시)
  useEffect(() => {
    if (member && typeof member.accident_free_cash === 'number') {
      setAccidentFreeCash(member.accident_free_cash);
    }
  }, [member]);

  // 결제 관련 상태
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentSubMethod, setPaymentSubMethod] = useState<PaymentSubMethod | null>(null);
  
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
  const [isSamePremium, setIsSamePremium] = useState(false);

  // 플랜 선택 영역 ref
  const planSelectionRef = useRef<HTMLDivElement>(null);

  // 여행목적 코드를 문자열로 변환
  const getTravelPurposeText = (code: string): string => {
    switch (code) {
      case 'N010001':
        return '유학/어학연수';
      case 'N010002':
        return '해외출장/주재원/교환교수';
      case 'N010003':
        return '워킹홀리데이';
      default:
        return '유학/어학연수';
    }
  };

  // 여행국가 목록 불러오기
  useEffect(() => {
    setTravelCountries(allCountries);
  }, []);

  // STEP 2 진입 시 스크롤 최상단으로 이동
  useEffect(() => {
    if (showParticipantForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showParticipantForm]);

  // 워킹홀리데이인 경우 자동으로 외화 플랜으로 설정
  useEffect(() => {
    if (travelPurposeLong === 'N010003' && currencyPlan !== '외화') {
      setCurrencyPlan('외화');
    }
  }, [travelPurposeLong, currencyPlan]);

  // 페이지 마운트 시 저장된 상태 복원 (coverage-detail에서 돌아올 때)
  useEffect(() => {
    const restoreState = () => {
      try {
        const savedState = localStorage.getItem('long_term_stay_m_state');
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
            if (state.travelCountry) setTravelCountry(state.travelCountry);
            if (state.travelPurposeLong) setTravelPurposeLong(state.travelPurposeLong);
            if (state.currencyPlan) setCurrencyPlan(state.currencyPlan);
          }
          // 상태 복원 여부와 관계없이 localStorage는 유지 (다음 coverage-detail 방문 시에도 사용)
        }
      } catch (error) {
        console.error('상태 복원 오류:', error);
        localStorage.removeItem('long_term_stay_m_state');
      }
    };

    // URL에 returnUrl 파라미터가 있을 때만 복원 (coverage-detail에서 돌아온 경우)
    // 그 외 진입에서는 오래된 저장값을 제거해 초기 상태로 유지
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl === '/long-term-stay/m') {
      restoreState();
    } else {
      localStorage.removeItem('long_term_stay_m_state');
    }
  }, [searchParams, showPlanSelection, planInfo]);

  // 보험나이 계산 함수 (만나이에서 6개월 경과 시 +1)
  const calculateAgeFromBirthDate = (birthDateStr: string): number | null => {
    if (!birthDateStr || birthDateStr.length !== 8) return null;
    
    const birthYear = parseInt(birthDateStr.substring(0, 4));
    const birthMonth = parseInt(birthDateStr.substring(4, 6)) - 1;
    const birthDay = parseInt(birthDateStr.substring(6, 8));
    
    if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;
    
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() - birthMonth;
    
    // 만나이 계산
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
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
  };

  // 성별 변환 함수
  const getGenderFromBirthDate = (birthDateStr: string, gender: 'M' | 'W'): string => {
    return gender === 'M' ? '남자' : '여자';
  };

  const getResidentGenderCode = (birthDateStr: string, genderValue: '남자' | '여자'): string => {
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

  // 이메일 생성 함수
  const getFullEmail = (participant: Participant): string => {
    if (!participant.email1) return '';
    const domain = participant.email2 === '직접입력' ? participant.customEmail : participant.email2;
    return domain ? `${participant.email1}@${domain}` : '';
  };

  // 기간 검증 함수
  const validateDuration = () => {
    const departure = new Date(`${departureDate}T${departureTime}:00:00`);
    const arrival = new Date(`${arrivalDate}T${arrivalTime}:00:00`);
    
    if (arrival <= departure) {
      return { valid: false, message: '도착일시는 출발일시보다 이후여야 합니다.' };
    }
    
    const diffTime = arrival.getTime() - departure.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 해외장기체류보험은 3개월(90일) 초과
    if (diffDays <= 90) {
      return { valid: false, message: '해외장기체류보험은 3개월(90일) 이상이어야 합니다.' };
    }
    
    return { valid: true };
  };

  // 보장 내용 설정 헬퍼 함수
  const getCoveragesForPlan = (planType: string, insuranceType: string, currentCurrencyPlan: string): { label: string; amount: string }[] => {
    // 유학/어학연수 또는 해외출장/주재원/교환교수인 경우 플랜별 보장 내용
    if (insuranceType === '유학/어학연수' || insuranceType === '해외출장/주재원/교환교수') {
      if (currentCurrencyPlan === '원화') {
        // 원화 플랜
        if (planType === '실속플랜') {
          return [
            { label: '상해사망후유장해', amount: '1억원' },
            { label: '해외의료비(상해)', amount: '2,000만원' },
            { label: '해외의료비(질병)', amount: '2,000만원' },
            { label: '중대사고구조송환비용', amount: '2,000만원' },
          ];
        } else if (planType === '표준플랜') {
          return [
            { label: '상해사망후유장해', amount: '1억원' },
            { label: '해외의료비(상해)', amount: '5,000만원' },
            { label: '해외의료비(질병)', amount: '5,000만원' },
            { label: '중대사고구조송환비용', amount: '2,000만원' },
          ];
        } else if (planType === '고급플랜') {
          return [
            { label: '상해사망후유장해', amount: '2억원' },
            { label: '해외의료비(상해)', amount: '1억원' },
            { label: '해외의료비(질병)', amount: '1억원' },
            { label: '중대사고구조송환비용', amount: '5,000만원' },
          ];
        } else {
          // 기타 플랜 기존 구조 유지
          return [
            { label: '상해사망후유장해', amount: '1억원' },
            { label: '상해입원의료비', amount: '1,000만원' },
            { label: '상해통원의료비', amount: '10만원' },
            { label: '질병입원의료비', amount: '1,000만원' },
            { label: '질병통원의료비', amount: '10만원' },
            { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
          ];
        }
      } else if (currentCurrencyPlan === '외화') {
        // 외화 플랜
        if (planType === '실속플랜') {
          return [
            { label: '상해사망후유장해', amount: '1억원' },
            { label: '해외의료비(상해)', amount: '20,000USD' },
            { label: '해외의료비(질병)', amount: '20,000USD' },
            { label: '중대사고구조송환비용', amount: '20,000USD' },
          ];
        } else if (planType === '표준플랜') {
          return [
            { label: '상해사망후유장해', amount: '1억원' },
            { label: '해외의료비(상해)', amount: '50,000USD' },
            { label: '해외의료비(질병)', amount: '50,000USD' },
            { label: '중대사고구조송환비용', amount: '75,000USD' },
          ];
        } else if (planType === '고급플랜') {
          return [
            { label: '상해사망후유장해', amount: '2억원' },
            { label: '해외의료비(상해)', amount: '100,000USD' },
            { label: '해외의료비(질병)', amount: '100,000USD' },
            { label: '중대사고구조송환비용', amount: '75,000USD' },
          ];
        } else {
          // 기타 플랜 기존 구조 유지
          return [
            { label: '상해사망후유장해', amount: '1억원' },
            { label: '상해입원의료비', amount: '1,000만원' },
            { label: '상해통원의료비', amount: '10만원' },
            { label: '질병입원의료비', amount: '1,000만원' },
            { label: '질병통원의료비', amount: '10만원' },
            { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
          ];
        }
      } else {
        // 기존 구조 유지
        return [
          { label: '상해사망후유장해', amount: '1억원' },
          { label: '상해입원의료비', amount: '1,000만원' },
          { label: '상해통원의료비', amount: '10만원' },
          ...(planType !== '실속플랜' ? [
            { label: '질병입원의료비', amount: '1,000만원' },
            { label: '질병통원의료비', amount: '10만원' },
          ] : []),
          { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
        ];
      }
    } else if (insuranceType === '워킹홀리데이') {
      // 워킹홀리데이인 경우
      if (planType === '실속플랜') {
        // 실속 플랜: 원화 플랜
        return [
          { label: '상해사망후유장해', amount: '2,000만원' },
          { label: '해외의료비(상해)', amount: '2,000만원' },
          { label: '해외의료비(질병)', amount: '2,000만원' },
          { label: '중대사고구조송환비용', amount: '1,000만원' },
        ];
      } else if (planType === '표준플랜') {
        // 표준 플랜: 원화 플랜
        return [
          { label: '상해사망후유장해', amount: '5,000만원' },
          { label: '해외의료비(상해)', amount: '5,000만원' },
          { label: '해외의료비(질병)', amount: '5,000만원' },
          { label: '중대사고구조송환비용', amount: '5,000만원' },
        ];
      } else if (planType === '고급플랜') {
        // 고급 플랜: 외화 플랜 (EUR)
        return [
          { label: '상해사망후유장해', amount: '30,000EUR' },
          { label: '해외의료비(상해)', amount: '30,000EUR' },
          { label: '해외의료비(질병)', amount: '30,000EUR' },
          { label: '중대사고구조송환비용', amount: '30,000EUR' },
        ];
      } else {
        // 기타 플랜 기존 구조 유지
        return [
          { label: '상해사망후유장해', amount: '1억원' },
          { label: '상해입원의료비', amount: '1,000만원' },
          { label: '상해통원의료비', amount: '10만원' },
          { label: '질병입원의료비', amount: '1,000만원' },
          { label: '질병통원의료비', amount: '10만원' },
          { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
        ];
      }
    } else {
      // 기존 구조 유지
      return [
        { label: '상해사망후유장해', amount: '1억원' },
        { label: '상해입원의료비', amount: '1,000만원' },
        { label: '상해통원의료비', amount: '10만원' },
        ...(planType !== '실속플랜' ? [
          { label: '질병입원의료비', amount: '1,000만원' },
          { label: '질병통원의료비', amount: '10만원' },
        ] : []),
        { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
      ];
    }
  };

  const handleCalculate = async (overrideCurrencyPlan?: '원화' | '외화') => {
    // 입력 검증
    if (!departureDate || !arrivalDate || !birthDate || birthDate.length !== 8) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

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
    const isWorkingHoliday = travelPurposeLong === 'N010003';
    if (isWorkingHoliday && (age < 15 || age > 35)) {
      alert('워킹홀리데이 보험은 15세 이상 35세 이하만 가입 가능합니다.');
      return;
    }

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
      const insuranceType = getTravelPurposeText(travelPurposeLong);

      const plans: Record<string, PlanInfo> = {};

      // 워킹홀리데이인 경우: 원화(실속, 표준) + 외화(고급) 플랜 계산
      if (isWorkingHoliday) {
        // 워킹홀리데이 플랜명 매핑: 프론트엔드 표시명 -> DB 저장명
        // 원화 플랜: 실속, 표준
        const wonPlans: PlanType[] = ['실속플랜', '표준플랜'];
        for (const displayPlanType of wonPlans) {
          try {
            const dbPlanType = WORKING_HOLIDAY_PLAN_MAPPING[displayPlanType] || displayPlanType;
            const response = await fetch('/api/travel/calculate-premium', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                insurance_type: insuranceType,
                age: age,
                gender: genderValue,
                plan_type: dbPlanType,
                plan_variant: 'B',
                has_medical_expense: hasMedicalExpense ? 1 : 0,
                departure_date: departureDateTime,
                arrival_date: arrivalDateTime,
                currency_plan: '원화',
                travel_country: travelCountry,
              }),
            });

            const data = await response.json();
            if (data.success) {
              const coverages = getCoveragesForPlan(displayPlanType, insuranceType, '원화');
              plans[displayPlanType] = {
                type: displayPlanType,
                premium: data.premium,
                coverages: coverages,
              };
            }
          } catch (error) {
            console.error(`보험료 계산 오류 (${displayPlanType}):`, error);
          }
        }

        // 외화 플랜: 고급
        try {
          const dbPlanType = WORKING_HOLIDAY_PLAN_MAPPING['고급플랜'] || '고급플랜';
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: insuranceType,
              age: age,
              gender: genderValue,
              plan_type: dbPlanType,
              plan_variant: 'B',
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: '외화',
              travel_country: travelCountry,
            }),
          });

          const data = await response.json();
          if (data.success) {
            const coverages = getCoveragesForPlan('고급플랜', insuranceType, '외화');
            plans['고급플랜'] = {
              type: '고급플랜',
              premium: data.premium,
              coverages: coverages,
            };
          }
        } catch (error) {
          console.error(`보험료 계산 오류 (고급플랜):`, error);
        }
      } else {
        // 일반적인 경우: 나이에 따라 사용 가능한 플랜 필터링
        let availablePlans: PlanType[] = [];
        if (age >= 0 && age < 15) {
          availablePlans = ['어린이플랜'];
        } else if (age >= 15 && age <= 70) {
          availablePlans = ['실속플랜', '표준플랜', '고급플랜'];
        } else if (age >= 71 && age <= 90) {
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
                plan_variant: 'B',
                has_medical_expense: hasMedicalExpense ? 1 : 0,
                departure_date: departureDateTime,
                arrival_date: arrivalDateTime,
                currency_plan: overrideCurrencyPlan || currencyPlan,
                travel_country: travelCountry,
              }),
            });

            const data = await response.json();
            if (data.success) {
              // 플랜별 보장 내용 설정
              const currentCurrencyPlan = overrideCurrencyPlan || currencyPlan;
              const coverages = getCoveragesForPlan(planType, insuranceType, currentCurrencyPlan);
              
              plans[planType] = {
                type: planType,
                premium: data.premium,
                coverages: coverages,
              };
            }
          } catch (error) {
            console.error(`보험료 계산 오류 (${planType}):`, error);
          }
        }
      }

      setPlanInfo(plans);
      const planKeys = Object.keys(plans);
      const defaultPlan = planKeys.includes('실속플랜') ? '실속플랜' : (planKeys[0] || null);
      setSelectedPlan(defaultPlan as PlanType | null);
      setShowPlanSelection(true);
      
      setTimeout(() => {
        planSelectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error) {
      console.error('보험료 계산 오류:', error);
      alert('보험료 계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  // 가입자 보험료 계산
  const handleCalculateParticipants = async () => {
    if (participants.length === 0) {
      alert('가입자 정보를 입력해주세요.');
      return;
    }

    for (const participant of participants) {
      if (!participant.name || !participant.birthDate || participant.birthDate.length !== 8) {
        alert('모든 가입자의 이름과 생년월일을 입력해주세요.');
        return;
      }
    }

    if (!participants[0].isVerified) {
      alert('대표 가입자의 휴대폰 인증을 완료해주세요.');
      return;
    }

    setIsCalculating(true);

    try {
      const calculatedParticipants: CalculatedPremiums['participants'] = [];
      let totalPremium = 0;
      const isWorkingHoliday = travelPurposeLong === 'N010003';

      for (const participant of participants) {
        const age = calculateAgeFromBirthDate(participant.birthDate);
        if (age === null) {
          alert(`${participant.name}의 생년월일을 올바르게 입력해주세요.`);
          setIsCalculating(false);
          return;
        }

        // 워킹홀리데이인 경우 15-35세만 가능
        if (isWorkingHoliday && (age < 15 || age > 35)) {
          alert(`${participant.name}님은 워킹홀리데이 보험 가입 대상이 아닙니다. (15세 이상 35세 이하만 가능)`);
          setIsCalculating(false);
          return;
        }

        const displayPlanType = selectedPlan || '실속플랜';
        let dbPlanType: string = displayPlanType;
        let currencyPlanValue = currencyPlan;

        if (isWorkingHoliday) {
          dbPlanType = WORKING_HOLIDAY_PLAN_MAPPING[displayPlanType] || displayPlanType;
          currencyPlanValue = displayPlanType === '고급플랜' ? '외화' : '원화';
        }
        
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-premium`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: getTravelPurposeText(travelPurposeLong),
            age: age,
            gender: participant.gender,
            plan_type: dbPlanType,
            plan_variant: 'B',
            has_medical_expense: hasMedicalExpense ? 1 : 0,
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            currency_plan: currencyPlanValue,
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
            planType: displayPlanType,
            premium: data.premium,
          });
          totalPremium += data.premium;
        } else {
          alert(`${participant.name}의 보험료 계산에 실패했습니다: ${data.message}`);
          setIsCalculating(false);
          return;
        }
      }

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

  // 결제 처리
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
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: getTravelPurposeText(travelPurposeLong),
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: null,
            travel_country: travelCountry,
            travel_purpose: getTravelPurposeText(travelPurposeLong),
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: '모바일',
            access_path: '투어밸리 모바일 사이트',
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${getResidentGenderCode(participants[0].birthDate, participants[0].gender)}******` : '',
            mobile_phone: participants[0]?.phone || '',
            email: getFullEmail(participants[0]),
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}******`,
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
            goodsName: getTitle(),
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
              productName: getTitle(),
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
            await processKakaoPayPayment({
              contractId: contract_id,
              amount: receiptPremium,
              itemName: getTitle(),
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
        // 기타결제 (무통장입금, 수기카드)는 바로 계약 등록 (가상계좌는 아래 별도 블록에서 처리)
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: getTravelPurposeText(travelPurposeLong),
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: null,
            travel_country: travelCountry,
            travel_purpose: getTravelPurposeText(travelPurposeLong),
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: '모바일',
            access_path: '투어밸리 모바일 사이트',
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${getResidentGenderCode(participants[0].birthDate, participants[0].gender)}******` : '',
            mobile_phone: participants[0]?.phone || '',
            email: getFullEmail(participants[0]),
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}******`,
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
          setShowPaymentScreen(false);
          setShowCompletionScreen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert(data.message || '계약 등록에 실패했습니다.');
        }
      }

      // 가상계좌 결제 처리 (결제창 Server 승인 모델)
      if (paymentMethod === '기타결제' && paymentSubMethod === '가상계좌') {
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
            device: '모바일',
            access_path: '투어밸리 사이트',
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            phone: participants[0]?.phone || '',
            email: participants[0]?.email1 && participants[0]?.email2 
              ? `${participants[0].email1}@${participants[0].email2 === '직접입력' ? participants[0].customEmail : participants[0].email2}`
              : null,
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            return {
              sequence_number: idx + 1,
              name: p.name,
              english_name: p.englishName || null,
              resident_number: `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}******`,
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
          goodsName: travelPurpose || '유학/어학연수',
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
    return '해외장기체류보험';
  };

  const getCurrentStep = () => {
    if (showStep3) return 3;
    if (showStep2_1) return 2;
    if (showParticipantForm) return 2;
    return 1;
  };

  return (
    <div className="long-term-stay-mobile">
      <Header isMobile={true} />
      
      {/* STEP 1: 여행정보 입력 화면 */}
      {!showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          <div className="longstay-mobile-step-header">
            <div className="longstay-mobile-step-header__row tourG_mat13 tourG_mab05">
              <p className="longstay-mobile-step-header__title">{getTitle()}</p>
              <div className="longstay-mobile-step-indicator-wrap">
                <MobileStepIndicator currentStep={getCurrentStep()} />
              </div>
            </div>
          </div>

          <MobileTravelInfoStep
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            birthDate={birthDate}
            gender={gender}
            travelCountry={travelCountry}
            travelPurpose={travelPurposeLong}
            onDepartureDateChange={setDepartureDate}
            onDepartureTimeChange={setDepartureTime}
            onArrivalDateChange={setArrivalDate}
            onArrivalTimeChange={setArrivalTime}
            onBirthDateChange={setBirthDate}
            onGenderChange={setGender}
            onTravelCountryChange={setTravelCountry}
            onTravelPurposeChange={setTravelPurposeLong}
            travelCountries={travelCountries}
            frequentCountries={frequentCountries}
            travelPurposeOptions={[
              { value: 'N010001', label: '유학/어학연수' },
              { value: 'N010002', label: '해외출장/주재원/교환교수' },
              { value: 'N010003', label: '워킹홀리데이' },
            ]}
            type={type}
          />

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

          <div ref={planSelectionRef}>
            {showPlanSelection && planInfo && (
              <MobilePlanSelection
                planInfo={planInfo}
                selectedPlan={selectedPlan}
                onPlanSelect={setSelectedPlan}
                hasMedicalExpense={hasMedicalExpense}
                onMedicalExpenseChange={setHasMedicalExpense}
                insuranceType={getTitle()}
                travelCountry={travelCountry}
                travelPurpose={getTravelPurposeText(travelPurposeLong)}
                currencyPlan={currencyPlan}
                onCurrencyPlanChange={async (newCurrencyPlan) => {
                  // 워킹홀리데이인 경우 통화 플랜 변경 불가
                  if (travelPurposeLong === 'N010003') {
                    return;
                  }
                  setCurrencyPlan(newCurrencyPlan);
                  // 통화 플랜 변경 시 보험료 재계산
                  if (showPlanSelection && planInfo && birthDate && birthDate.length === 8) {
                    await handleCalculate(newCurrencyPlan);
                  }
                }}
                onContractDetailClick={(planType) => {
                  // coverage-detail로 이동하기 전에 현재 상태를 다시 저장 (최신 상태 유지)
                  if (showPlanSelection && planInfo) {
                    try {
                      localStorage.setItem('long_term_stay_m_state', JSON.stringify({
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
                        travelCountry,
                        travelPurposeLong,
                        currencyPlan,
                      }));
                    } catch (error) {
                      console.error('상태 저장 오류:', error);
                    }
                  }
                  
                  const returnUrl = encodeURIComponent('/long-term-stay/m');
                  // insuranceType은 travelPurposeLong에 따라 결정
                  const insuranceType = getTravelPurposeText(travelPurposeLong);
                  // 워킹홀리데이는 currencyPlan이 없음
                  const currencyPlanParam = travelPurposeLong === 'N010003' ? null : (currencyPlan === '원화' ? '원화플랜' : '외화플랜');
                  
                  let url = `/coverage-detail/m?planType=${planType}&insuranceType=${encodeURIComponent(insuranceType)}&returnUrl=${returnUrl}`;
                  if (currencyPlanParam) {
                    url += `&currencyPlan=${encodeURIComponent(currencyPlanParam)}`;
                  }
                  router.push(url);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* STEP 2: 가입정보 입력 */}
      {showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          <div className="longstay-mobile-step-header">
            <div className="longstay-mobile-step-header__row tourG_mat13 tourG_mab05">
              <p className="longstay-mobile-step-header__title">{getTitle()}</p>
              <div className="longstay-mobile-step-indicator-wrap">
                <MobileStepIndicator currentStep={getCurrentStep()} />
              </div>
            </div>
          </div>

          <ParticipantInfoStep
            insuranceType={getTitle()}
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
            gender={gender === 'M' ? 'male' : 'female'}
            hideFormHeader
          />
        </div>
      )}

      {!showStep2_1 && !showStep3 && !showCompletionScreen && (
        <FixedBottomButtons 
          canProceed={showPlanSelection && selectedPlan !== null}
          onTwoOrMoreClick={handleTwoOrMoreClick}
          onSingleClick={handleSingleClick}
        />
      )}

      {/* STEP 2-1: 위험활동 확인 */}
      {showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          <div className="longstay-mobile-step-header">
            <div className="longstay-mobile-step-header__row tourG_mat13 tourG_mab05">
              <p className="longstay-mobile-step-header__title">{getTitle()}</p>
              <div className="longstay-mobile-step-indicator-wrap">
                <MobileStepIndicator currentStep={getCurrentStep()} />
              </div>
            </div>
          </div>

          <RiskActivityStep
            insuranceType={getTitle()}
            hasDangerousActivity={hasDangerousActivity}
            travelPurpose={getTravelPurposeText(travelPurposeLong)}
            onDangerousActivityChange={setHasDangerousActivity}
            hideFormHeader
            onTravelPurposeChange={(value) => {
              // 텍스트를 코드로 변환
              const codeMap: Record<string, string> = {
                '유학/어학연수': 'N010001',
                '해외출장/주재원/교환교수': 'N010002',
                '워킹홀리데이': 'N010003',
              };
              setTravelPurposeLong(codeMap[value] || 'N010001');
            }}
            onShowDangerousActivityModal={() => setShowDangerousActivityModal(true)}
            isOverseas={true}
            isCurrentlyAbroad={isCurrentlyAbroad}
            hasRestrictedCountry={hasRestrictedCountry}
            onCurrentlyAbroadChange={setIsCurrentlyAbroad}
            onRestrictedCountryChange={setHasRestrictedCountry}
            onShowRestrictedCountryModal={() => setShowRestrictedCountryModal(true)}
            isLongTermStay={true}
            onNext={() => {
              if (hasDangerousActivity === null) {
                alert('위험한 활동 참여 여부를 선택해주세요.');
                return;
              }
              if (!travelPurposeLong) {
                alert('여행목적을 선택해주세요.');
                return;
              }
              setShowConsentModal(true);
            }}
          />
        </div>
      )}

      <DangerousActivityModal
        isOpen={showDangerousActivityModal}
        onClose={() => setShowDangerousActivityModal(false)}
      />

      <RestrictedCountryModal
        isOpen={showRestrictedCountryModal}
        onClose={() => setShowRestrictedCountryModal(false)}
      />

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
          <div className="prow_01">
            <div className="longstay-mobile-step-header">
              <div className="longstay-mobile-step-header__row tourG_mat13 tourG_mab05">
                <p className="longstay-mobile-step-header__title">{getTitle()}</p>
                <div className="longstay-mobile-step-indicator-wrap">
                  <MobileStepIndicator currentStep={getCurrentStep()} />
                </div>
              </div>
            </div>
          </div>

          <ContractInfoStep
            insuranceType={getTitle()}
            insuranceCompany="메리츠화재"
            hideFormHeader
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            travelPurpose={getTravelPurposeText(travelPurposeLong)}
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

      {/* 엑셀 등록 모달 */}
      <ExcelUploadModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onUpload={(newParticipants, startId) => {
          const updatedParticipants = [...participants];
          const participantsWithCorrectIds = newParticipants.map((p, index) => ({
            ...p,
            id: startId + index,
          }));
          updatedParticipants.push(...participantsWithCorrectIds);
          setParticipants(updatedParticipants);
          setShowExcelModal(false);
        }}
        currentParticipants={participants}
      />

      {/* 심의번호 */}
      <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
        <span className="tour2023_txt02 tour2023_grey">
          <span style={{ whiteSpace: 'nowrap' }}>
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
          </span>
          <br />
          준법감시필 제2025-광고T-002(2025.04.07-2026-04.06)
        </span>
      </div>

      <Footer isMobile={true} />
    </div>
  );
}

export default function MobileLongTermStayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileLongTermStayContent />
    </Suspense>
  );
}
