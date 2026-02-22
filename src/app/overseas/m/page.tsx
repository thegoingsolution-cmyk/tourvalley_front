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
import ConsentModalMobile from '@/components/mobiletravel/ConsentModalMobile';
import { PlanType, PlanInfo, Participant, CalculatedPremiums, PaymentMethod, PaymentSubMethod } from '@/components/travel/types';
import { allCountries, frequentCountries } from '@/components/travel/utils/countries';
import './page.css';

function MobileOverseasStep1Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { member, isLoggedIn } = useAuth();
  const typeParam = searchParams?.get('type') || 'short';
  const type = (typeParam === 'short' || typeParam === 'long' || typeParam === 'group') ? typeParam : 'short' as 'short' | 'long' | 'group';

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
  const [travelPurpose, setTravelPurpose] = useState(''); // 여행목적 (STEP2-1에서 사용: "일반관광", "출장/연수/교육" 등)
  const [travelPurposeLong, setTravelPurposeLong] = useState('N010001'); // 장기여행 목적 코드 (STEP1에서 사용: "N010001" 등)
  const [travelCountries, setTravelCountries] = useState<Array<{ code: string; name: string }>>([]);
  
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
  const [expectedDepositYear, setExpectedDepositYear] = useState<number>(0);
  const [expectedDepositMonth, setExpectedDepositMonth] = useState<number>(0);
  const [expectedDepositDay, setExpectedDepositDay] = useState<number>(0);
  
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

  // 여행국가 목록 불러오기
  useEffect(() => {
    setTravelCountries(allCountries);
  }, []);

  // STEP 2 (가입정보 입력) 진입 시 스크롤 최상단으로 이동
  useEffect(() => {
    if (showParticipantForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showParticipantForm]);

  // 보험나이 계산 함수 (만나이에서 6개월 경과 시 +1)
  const calculateAgeFromBirthDate = (birthDateStr: string): number | null => {
    if (!birthDateStr || birthDateStr.length !== 8) return null;
    
    const birthYear = parseInt(birthDateStr.substring(0, 4));
    const birthMonth = parseInt(birthDateStr.substring(4, 6)) - 1;
    const birthDay = parseInt(birthDateStr.substring(6, 8));
    
    if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;
    
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    if (birthDate.getMonth() !== birthMonth || birthDate.getDate() !== birthDay) return null;
    
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() - birthMonth;
    
    // 만나이 계산
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }
    
    // 보험나이 계산: 만나이에서 6개월이 경과하면 +1
    // 마지막 생일 기준으로 6개월 경과 여부 계산
    const lastBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
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
  };

  // 성별 변환 함수 (M/W -> 남자/여자)
  const getGenderFromBirthDate = (birthDateStr: string, gender: 'M' | 'W'): '남자' | '여자' => {
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
    
    // 해외여행보험은 최대 3개월(90일) 이하
    if (type === 'short' && diffDays > 90) {
      return { valid: false, message: '해외여행보험은 최대 3개월(90일)까지 가능합니다.' };
    }
    
    return { valid: true };
  };

  const fetchAvailablePlans = async (age: number, genderValue: '남자' | '여자', medicalExpenseValue: boolean = hasMedicalExpense) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiBase}/api/travel/available-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_type: '해외여행보험',
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
  };

  // 보험료 계산 함수 (재사용 가능)
  const calculatePremiums = async (medicalExpenseValue?: boolean) => {
    if (!planInfo || !selectedPlan) return;

    // 나이 계산
    const age = calculateAgeFromBirthDate(birthDate);
    if (age === null) return;

    const medicalExpense = medicalExpenseValue !== undefined ? medicalExpenseValue : hasMedicalExpense;
    let availablePlans: PlanType[] = planInfo ? (Object.keys(planInfo) as PlanType[]) : [];

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
      if (medicalExpenseValue !== undefined) {
        const refreshedPlans = await fetchAvailablePlans(age, genderValue, medicalExpense);
        if (refreshedPlans.length === 0) {
          setPlanInfo({});
          return;
        }
        availablePlans = refreshedPlans;
      } else if (availablePlans.length === 0) {
        const refreshedPlans = await fetchAvailablePlans(age, genderValue, medicalExpense);
        if (refreshedPlans.length === 0) {
          setPlanInfo({});
          return;
        }
        availablePlans = refreshedPlans;
      }
      const insuranceType = type === 'short' ? '해외여행보험' : type === 'long' ? '해외장기체류보험' : '단체여행자보험';

      // 각 플랜별 보험료 계산 (모든 availablePlans를 계산)
      const plans: Record<string, PlanInfo> = {};
      const fetchPlanCoverages = async (planTypes: PlanType[]) => {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiBase}/api/travel/plan-coverages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: insuranceType,
              plan_types: planTypes,
              has_medical_expense: medicalExpense ? 1 : 0,
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
      const coveragesMap = await fetchPlanCoverages(availablePlans);

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
              birth_date: birthDate,
              gender: genderValue,
              plan_type: planType,
              plan_variant: 'B',
              has_medical_expense: medicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: '원화',
              travel_country: travelCountry,
            }),
          });

          const data = await response.json();
          if (data.success) {
            plans[planType] = {
              type: planType,
              premium: data.premium,
              coverages: coveragesMap[planType] || [],
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
      calculatePremiums(hasMedicalExpense);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMedicalExpense]);

  // 페이지 마운트 시 저장된 상태 복원 (coverage-detail에서 돌아올 때)
  useEffect(() => {
    const restoreState = () => {
      try {
        const savedState = localStorage.getItem('overseas_m_state');
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
          }
          // 상태 복원 여부와 관계없이 localStorage는 유지 (다음 coverage-detail 방문 시에도 사용)
        }
      } catch (error) {
        console.error('상태 복원 오류:', error);
        localStorage.removeItem('overseas_m_state');
      }
    };

    // URL에 returnUrl 파라미터가 있을 때만 복원 (coverage-detail에서 돌아온 경우)
    // 그 외 진입에서는 오래된 저장값을 제거해 초기 상태로 유지
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl === '/overseas/m') {
      restoreState();
    } else {
      localStorage.removeItem('overseas_m_state');
    }
  }, [searchParams, showPlanSelection, planInfo]);

  const handleCalculate = async () => {
    // 입력 검증
    if (!departureDate || !arrivalDate || !birthDate || birthDate.length !== 8) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    // 해외여행보험은 여행국가 필수
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
    const insuranceType = type === 'short' ? '해외여행보험' : type === 'long' ? '해외장기체류보험' : '단체여행자보험';

    const genderValue = getGenderFromBirthDate(birthDate, gender);
    const availablePlans = await fetchAvailablePlans(age, genderValue);

    if (availablePlans.length === 0) {
      alert('가입 가능한 플랜이 없습니다.');
      return;
    }
    const fetchPlanCoverages = async (planTypes: PlanType[]) => {
      try {
        const response = await fetch('/api/travel/plan-coverages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: insuranceType,
            plan_types: planTypes,
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
              insurance_type: insuranceType,
              age: age,
              birth_date: birthDate,
              gender: genderValue,
              plan_type: planType,
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
            plans[planType] = {
              type: planType,
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
      // 기본값은 표준플랜, 없으면 첫 번째 플랜
      const defaultPlan = availablePlans.includes('표준플랜') ? '표준플랜' : availablePlans[0];
      setSelectedPlan(defaultPlan);
      setShowPlanSelection(true);
      
      // 플랜 선택 영역으로 스크롤
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

        // 플랜 타입: 나이에 따라 백엔드(DB) plan_type 결정
        let planType: string;
        if (age <= 14) {
          planType = '어린이플랜';
        } else if (age >= 71) {
          planType = selectedPlan === '어르신플랜2' ? '어르신플랜2' : '어르신플랜1';
        } else {
          const basePlan =
            selectedPlan && !['어린이플랜', '어르신플랜1', '어르신플랜2'].includes(selectedPlan)
              ? selectedPlan
              : '표준플랜';
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-premium`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: type === 'short' ? '해외여행보험' : type === 'long' ? '유학/어학연수' : '해외여행보험',
            age: age,
            birth_date: participant.birthDate,
            gender: participant.gender,
            plan_type: planType,
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
      if (expectedDepositYear === 0 || expectedDepositMonth === 0 || expectedDepositDay === 0) {
        alert('입금예정일을 선택해주세요.');
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
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: getTitle(),
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
            use_accident_free_cash: useAccidentFreeCash,
            normal_premium: normalPremium,
            receipt_premium: receiptPremium,
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
        // 기타결제 중 무통장입금, 수기카드만 여기서 계약 등록 후 완료 화면 (가상계좌는 아래 별도 블록에서 처리)
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: getTitle(),
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
            use_accident_free_cash: useAccidentFreeCash,
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
            insurance_type: '해외여행보험',
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
            email: getFullEmail(participants[0]) || null,
          },
          insured_persons: participants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            return {
              sequence_number: idx + 1,
              name: p.name,
              english_name: (p as any).englishName || null,
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
            use_accident_free_cash: useAccidentFreeCash,
            normal_premium: normalPremium,
            receipt_premium: receiptPremium,
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
          goodsName: '해외여행보험',
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
    switch (type) {
      case 'short':
        return '해외여행보험';
      case 'long':
        return '해외장기체류보험';
      case 'group':
        return '단체여행자보험';
      default:
        return '해외여행보험';
    }
  };

  // 현재 단계 계산
  const getCurrentStep = () => {
    if (showStep3) return 3;
    if (showStep2_1) return 2;
    if (showParticipantForm) return 2;
    return 1;
  };

  return (
    <div className="overseas-step1-mobile">
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
            type={type}
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
                travelCountry={travelCountry}
                travelPurpose={type === 'long' ? travelPurposeLong : undefined}
                onContractDetailClick={(planType) => {
                  // coverage-detail로 이동하기 전에 현재 상태를 다시 저장 (최신 상태 유지)
                  if (showPlanSelection && planInfo) {
                    try {
                      localStorage.setItem('overseas_m_state', JSON.stringify({
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
                        type,
                      }));
                    } catch (error) {
                      console.error('상태 저장 오류:', error);
                    }
                  }
                  
                  const returnUrl = encodeURIComponent('/overseas/m');
                  // insuranceType 매핑: '해외여행보험' -> '해외여행보험' (동일)
                  const insuranceType = getTitle() === '해외여행보험' ? '해외여행보험' : getTitle();
                  // 해외여행보험은 실손/비실손 구분이 있음
                  const isMedicalExpenseParam = hasMedicalExpense ? 'true' : 'false';
                  router.push(`/coverage-detail/m?planType=${planType}&insuranceType=${encodeURIComponent(insuranceType)}&isMedicalExpense=${isMedicalExpenseParam}&returnUrl=${returnUrl}`);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* STEP 2: 가입정보 입력 화면 */}
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
          />
        </div>
      )}

      {/* 하단 고정버튼 (STEP 2-1, STEP 3, 완료 화면에서는 숨김) */}
      {!showStep2_1 && !showStep3 && !showCompletionScreen && (
        <FixedBottomButtons 
          canProceed={showPlanSelection && selectedPlan !== null}
          onTwoOrMoreClick={handleTwoOrMoreClick}
          onSingleClick={handleSingleClick}
        />
      )}

      {/* STEP 2-1: 위험활동 확인 및 여행목적 선택 화면 */}
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
          hasDangerousActivity={hasDangerousActivity}
          travelPurpose={travelPurpose}
          onDangerousActivityChange={setHasDangerousActivity}
          onTravelPurposeChange={setTravelPurpose}
          onShowDangerousActivityModal={() => setShowDangerousActivityModal(true)}
          isOverseas={type === 'short' || type === 'long'}
          isCurrentlyAbroad={isCurrentlyAbroad}
          hasRestrictedCountry={hasRestrictedCountry}
          onCurrentlyAbroadChange={setIsCurrentlyAbroad}
          onRestrictedCountryChange={setHasRestrictedCountry}
          onShowRestrictedCountryModal={() => setShowRestrictedCountryModal(true)}
          isLongTermStay={type === 'long'}
          onNext={() => {
            // 입력 검증
            if (hasDangerousActivity === null) {
              alert('위험한 활동 참여 여부를 선택해주세요.');
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
            // 동의서 모달 표시
            setShowConsentModal(true);
          }}
          />
        </div>
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
      <ConsentModalMobile
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
            insuranceCompany="라이나손해"
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

export default function MobileOverseasStep1Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileOverseasStep1Content />
    </Suspense>
  );
}
