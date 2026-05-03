'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { requestNicepayPayment, openNicepayWindow, processNaverPayPayment, processKakaoPayPayment } from '@/services/paymentService';
import { getTrackingInfo } from '@/utils/tracking';
import {
  getDomesticInsuranceMaxArrivalFromPickedDate,
  parseInsuranceDateHourToInstant,
} from '@/utils/dateTime';
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
import ConsentModalMobile from '@/components/mobiletravel/ConsentModalMobile';
import {
  PlanType,
  PlanInfo,
  Participant,
  CalculatedPremiums,
  PaymentMethod,
  PaymentSubMethod,
  getParticipantEmail,
} from '@/components/travel/types';
import { pickDomesticPlanForTier, resolveDomesticPlanForParticipant } from '@/utils/domesticPlanTier';
import { getPremiumGenderFromParticipant } from '@/utils/age';
import './page.css';

function MobileDomesticStep1Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  // STEP3 진입 시 /api/cash/info로 최신 무사고캐시 조회 (비로그인 시 0)
  useEffect(() => {
    if (!showStep3) return;
    if (!member?.id) {
      setAccidentFreeCash(0);
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiBase}/api/cash/info?member_id=${member.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.totalCash === 'number') {
          setAccidentFreeCash(data.totalCash);
        } else {
          setAccidentFreeCash(typeof member.accident_free_cash === 'number' ? member.accident_free_cash : 0);
        }
      })
      .catch(() => {
        setAccidentFreeCash(typeof member.accident_free_cash === 'number' ? member.accident_free_cash : 0);
      });
  }, [showStep3, member?.id, member?.accident_free_cash]);

  // 결제 관련 상태
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentSubMethod, setPaymentSubMethod] = useState<PaymentSubMethod | null>(null);
  const [depositBank, setDepositBank] = useState<string>('우리은행');
  const [depositorName, setDepositorName] = useState<string>('');
  const [expectedDepositYear, setExpectedDepositYear] = useState<number>(new Date().getFullYear());
  const [expectedDepositMonth, setExpectedDepositMonth] = useState<number>(new Date().getMonth() + 1);
  const [expectedDepositDay, setExpectedDepositDay] = useState<number>(new Date().getDate());
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
  const getGenderFromBirthDate = (birthDateStr: string, selectedGender: 'M' | 'W'): '남자' | '여자' => {
    if (birthDateStr.length < 8) return selectedGender === 'M' ? '남자' : '여자';
    
    const year = parseInt(birthDateStr.substring(0, 4));
    const isBefore2000 = year < 2000;
    
    if (selectedGender === 'M') {
      return isBefore2000 ? '남자' : '남자';
    } else {
      return isBefore2000 ? '여자' : '여자';
    }
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
      if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return null;
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // 만나이 계산
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
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

  // 기간 검증 (국내여행보험 최대 1개월)
  const validateDuration = (): { valid: boolean; message?: string } => {
    const departure = parseInsuranceDateHourToInstant(departureDate, departureTime);
    const arrival = parseInsuranceDateHourToInstant(arrivalDate, arrivalTime);
    
    if (arrival <= departure) {
      return { valid: false, message: '도착일시는 출발일시보다 이후여야 합니다.' };
    }
    
    const maxArrival = getDomesticInsuranceMaxArrivalFromPickedDate(departureDate, departureTime);
    if (arrival > maxArrival) {
      return { valid: false, message: '국내여행보험은 최대 1개월까지 가능합니다.' };
    }
    
    return { valid: true };
  };

  const fetchAvailablePlans = async (
    age: number,
    genderValue: '남자' | '여자',
    medicalExpenseValue: boolean = hasMedicalExpense,
    options?: { birth_date?: string; departure_date?: string }
  ) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const body: Record<string, unknown> = {
        insurance_type: '국내여행보험',
        age,
        gender: genderValue,
        plan_variant: 'B',
        has_medical_expense: medicalExpenseValue ? 1 : 0,
      };
      if (options?.birth_date) body.birth_date = options.birth_date;
      if (options?.departure_date) body.departure_date = options.departure_date;

      const response = await fetch(`${apiBase}/api/travel/available-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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

  const fetchPlanCoverages = useCallback(async (planTypes: PlanType[], medicalExpenseValue: boolean = hasMedicalExpense) => {
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
  }, [hasMedicalExpense]);

  // 보험료 재계산 (실손 포함/제외 변경 등, PC recalculatePremium과 동일한 보장·플랜 목록 처리)
  const calculatePremiums = async (medicalExpenseValue?: boolean) => {
    if (!planInfo || !selectedPlan) return;
    if (!birthDate || birthDate.length !== 8) return;

    const age = calculateAgeFromBirthDate(birthDate);
    if (age === null) return;

    const medicalExpense = medicalExpenseValue !== undefined ? medicalExpenseValue : hasMedicalExpense;
    let availablePlans: PlanType[] = planInfo ? (Object.keys(planInfo) as PlanType[]) : ['실속플랜', '표준플랜'];

    setIsCalculating(true);

    try {
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

      const planOptions = birthDate && birthDate.length === 8
        ? { birth_date: birthDate, departure_date: departureDateTime }
        : undefined;
      if (medicalExpenseValue !== undefined) {
        const refreshedPlans = await fetchAvailablePlans(age, genderValue, medicalExpense, planOptions);
        if (refreshedPlans.length === 0) {
          setPlanInfo({});
          return;
        }
        availablePlans = refreshedPlans;
      } else if (availablePlans.length === 0) {
        const refreshedPlans = await fetchAvailablePlans(age, genderValue, medicalExpense, planOptions);
        if (refreshedPlans.length === 0) {
          setPlanInfo({});
          return;
        }
        availablePlans = refreshedPlans;
      }

      const coveragesMap = await fetchPlanCoverages(availablePlans, medicalExpense);

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
            const hasDiseaseCoverage = planType !== '실속플랜' && planType !== '어르신플랜1(실속)';
            if (planInfo[planType]) {
              plans[planType] = {
                ...planInfo[planType],
                premium: data.premium,
                coverages: coveragesMap[planType] || planInfo[planType].coverages,
              };
            } else {
              plans[planType] = {
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
          console.error(`보험료 계산 오류 (${planType}):`, error);
        }
      }

      const planKeys = Object.keys(plans);
      if (selectedPlan && !plans[selectedPlan]) {
        const resolved = resolveDomesticPlanForParticipant(selectedPlan, planKeys) as PlanType;
        if (plans[resolved]) {
          setSelectedPlan(resolved);
        } else if (planKeys.length > 0) {
          setSelectedPlan(planKeys[0] as PlanType);
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
    const restoreState = (): boolean => {
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
            return true;
          }
          // 상태 복원 여부와 관계없이 localStorage는 유지 (다음 coverage-detail 방문 시에도 사용)
        }
      } catch (error) {
        console.error('상태 복원 오류:', error);
        localStorage.removeItem('domestic_m_state');
      }
      return false;
    };

    // URL에 returnUrl 파라미터가 있을 때만 복원 (coverage-detail에서 돌아온 경우)
    // 그 외 진입에서는 오래된 저장값을 제거해 초기 상태로 유지
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl === '/domestic/m') {
      const didRestore = restoreState();
      if (didRestore) {
        // 복원 후 리렌더로 인해 effect가 다시 실행되면 cleanup이 타이머를 지워버리므로, cleanup 없이 실행
        setTimeout(() => {
          if (planSelectionRef.current) {
            const elementPosition = planSelectionRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - 80;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 250);
      }
    } else {
      localStorage.removeItem('domestic_m_state');
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

    const genderValue = getGenderFromBirthDate(birthDate, gender);

    // available-plans 호출용 출발일시(백엔드 보험나이15 분기는 KST 당일, 출발일과 무관)
    let depDateFormatted = departureDate;
    let depHour = parseInt(departureTime, 10) || 0;
    if (depHour === 24) {
      const d = new Date(departureDate);
      d.setDate(d.getDate() + 1);
      depDateFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      depHour = 0;
    }
    const departureDateTimeForPlans = `${depDateFormatted} ${String(depHour).padStart(2, '0')}:00:00`;

    const availablePlans = await fetchAvailablePlans(age, genderValue, undefined, {
      birth_date: birthDate,
      departure_date: departureDateTimeForPlans,
    });
    if (availablePlans.length === 0) {
      alert('가입 가능한 플랜이 없습니다.');
      return;
    }
    const coveragesMap = await fetchPlanCoverages(availablePlans, hasMedicalExpense);

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
      // 보험 타입
      const insuranceType = '국내여행보험';

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

      if (Object.keys(plans).length === 0) {
        alert('보험료 계산에 실패했습니다.');
        setIsCalculating(false);
        return;
      }

      setPlanInfo(plans);
      const defaultPlan = (pickDomesticPlanForTier(availablePlans, '실속') || availablePlans[0]) as PlanType;
      setSelectedPlan(defaultPlan);
      setShowPlanSelection(true);
      
      // 상태를 localStorage에 저장 (coverage-detail 페이지에서 돌아올 때 복원용)
      try {
        localStorage.setItem('domestic_m_state', JSON.stringify({
          showPlanSelection: true,
          planInfo: plans,
          selectedPlan: defaultPlan,
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
    if (!isLoggedIn && !participants[0].isVerified) {
      alert('대표 가입자의 휴대폰 인증을 완료해주세요.');
      return;
    }

    setIsCalculating(true);

    try {
      // 24시는 다음날 00시로 변환 (가입자 공통)
      let departureDateFormatted = departureDate;
      let departureHour = parseInt(departureTime, 10) || 0;
      if (departureHour === 24) {
        const date = new Date(departureDate);
        date.setDate(date.getDate() + 1);
        departureDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        departureHour = 0;
      }
      let arrivalDateFormatted = arrivalDate;
      let arrivalHour = parseInt(arrivalTime, 10) || 0;
      if (arrivalHour === 24) {
        const date = new Date(arrivalDate);
        date.setDate(date.getDate() + 1);
        arrivalDateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        arrivalHour = 0;
      }
      const departureDateTime = `${departureDateFormatted} ${String(departureHour).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDateFormatted} ${String(arrivalHour).padStart(2, '0')}:00:00`;

      const calculatedParticipants: CalculatedPremiums['participants'] = [];
      let totalPremium = 0;

      for (const participant of participants) {
        // 나이 계산 (내국인: 생년월일, 외국인: 외국인등록번호에서 추출)
        let birthDateForAge = participant.birthDate;
        if (participant.nationality === '외국인' && participant.residentNumber) {
          const residentNum = participant.residentNumber;
          if (residentNum.length >= 6) {
            const yy = parseInt(residentNum.substring(0, 2), 10);
            const mm = residentNum.substring(2, 4);
            const dd = residentNum.substring(4, 6);
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

        // 외국인일 경우 외국인등록번호에서 생년월일 추출
        let birthDateForApi = participant.birthDate;
        if (participant.nationality === '외국인' && participant.residentNumber) {
          const residentNum = participant.residentNumber;
          if (residentNum.length >= 6) {
            const yy = parseInt(residentNum.substring(0, 2), 10);
            const mm = residentNum.substring(2, 4);
            const dd = residentNum.substring(4, 6);
            const year = yy >= 50 ? 1900 + yy : 2000 + yy;
            birthDateForApi = `${year}${mm}${dd}`;
          }
        }

        const genderForPremium = getPremiumGenderFromParticipant(participant);

        // 가능 플랜 API (보험나이 15세일 때 성인/어린이는 백엔드에서 KST 당일 기준 만 나이)
        const availablePlans = await fetchAvailablePlans(age, genderForPremium, undefined, {
          birth_date: birthDateForApi,
          departure_date: departureDateTime,
        });
        if (availablePlans.length === 0) {
          alert(`${participant.name}에 대해 가입 가능한 플랜이 없습니다.`);
          setIsCalculating(false);
          return;
        }
        const planType = resolveDomesticPlanForParticipant(selectedPlan, availablePlans);

        const response = await fetch('/api/travel/calculate-premium', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: '국내여행보험',
            age: age,
            birth_date: birthDateForApi,
            gender: genderForPremium,
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
          // premium-detail 표시: 내국인/외국인 모두 생년월일 8자리(YYYYMMDD) 형식으로 통일
          const displayBirthDate =
            participant.nationality === '외국인' ? birthDateForApi : (participant.birthDate || birthDateForApi);
          calculatedParticipants.push({
            id: participant.id,
            name: participant.name,
            gender: genderForPremium,
            birthDate: displayBirthDate,
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
    if (['래프팅', '스키/스노보드'].includes(travelPurpose)) {
      alert(
        '죄송합니다 고객님\n래프팅, 스키/스노보드를 목적으로 국내여행을 가는 경우에는 여행보험에 가입하실 수 없습니다.'
      );
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
      } else if (paymentSubMethod === '가상계좌') {
        if (!depositBank) {
          alert('입금은행을 선택해주세요.');
          return;
        }
        if (!/^\d{3}$/.test(depositBank)) {
          alert('가상계좌 은행코드를 다시 선택해주세요.');
          return;
        }
      } else if (paymentSubMethod === '수기카드') {
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
        // 생년월일 6자리 또는 사업자번호(10자리) 또는 13자리 허용
        if (!cardholderResidentNumber) {
          alert('소유자 생년월일 또는 사업자번호를 입력해주세요.');
          return;
        }
        const residentNumberWithoutHyphen = cardholderResidentNumber.replace(/-/g, '');
        if (residentNumberWithoutHyphen.length !== 6 && residentNumberWithoutHyphen.length !== 10 && residentNumberWithoutHyphen.length !== 13) {
          alert('소유자 생년월일 6자리 또는 사업자번호(10자리) 또는 13자리를 입력해주세요.');
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
        const trackingInfo = getTrackingInfo('모바일');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: '국내여행보험',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: '전국일원',
            travel_country: null,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: '모바일',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${getResidentGenderCode(participants[0].birthDate, participants[0].gender)}000000` : '',
            mobile_phone: participants[0]?.phone || '',
            email: getParticipantEmail(participants[0]),
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
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            
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
              resident_number: residentNumber,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              nationality_type: nationalityType,
              nationality_continent: null,
              nationality_country: null,
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
            orderId: String(contractData_result.contract_id),
            goodsName: '국내여행자보험',
            buyerName: participants[0]?.name || '',
            buyerEmail: getParticipantEmail(participants[0]),
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
              customerEmail: getParticipantEmail(participants[0]),
              customerPhone: participants[0]?.phone || '',
              checkOutDate: arrivalDate,
              purchaserName: participants[0]?.name || '',
              purchaserBirthday: participants[0]?.birthDate ? String(participants[0].birthDate).replace(/-/g, '').slice(0, 8) : undefined,
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
              customerEmail: getParticipantEmail(participants[0]),
              customerPhone: participants[0]?.phone || '',
            });
          } catch (error) {
            console.error('카카오페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '카카오페이 결제 중 오류가 발생했습니다.');
          }
        }
      } else if (paymentMethod === '기타결제' && paymentSubMethod !== '가상계좌') {
        // 기타결제 (무통장입금, 수기카드)는 바로 계약 등록
        const trackingInfo = getTrackingInfo('모바일');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: '국내여행보험',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: '전국일원',
            travel_country: null,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: '모바일',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            resident_number: participants[0]?.birthDate ? `${participants[0].birthDate}-${getResidentGenderCode(participants[0].birthDate, participants[0].gender)}000000` : '',
            mobile_phone: participants[0]?.phone || '',
            email: getParticipantEmail(participants[0]),
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
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            
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
              resident_number: residentNumber,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              nationality_type: nationalityType,
              nationality_continent: null,
              nationality_country: null,
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
        const trackingInfo = getTrackingInfo('모바일');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: '국내여행보험',
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: '전국일원',
            travel_country: null,
            travel_purpose: travelPurpose,
            travel_participants: participants.length,
            total_premium: calculatedPremiums?.totalPremium || 0,
            device: '모바일',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: participants[0]?.name || '',
            phone: participants[0]?.phone || '',
            email: getParticipantEmail(participants[0]) || null,
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
            const calculatedParticipant = calculatedPremiums?.participants.find(cp => cp.id === p.id);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            
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
              resident_number: residentNumber,
              gender: p.gender,
              age: age || 0,
              plan_type: calculatedParticipant?.planType || selectedPlan || '실속플랜',
              premium: calculatedParticipant?.premium || 0,
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
          orderId: String(contractData_result.contract_id),
          goodsName: '국내여행보험',
          buyerName: participants[0]?.name || '',
          buyerEmail: getParticipantEmail(participants[0]) || '',
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
            isLoggedIn={isLoggedIn}
            memberPhone={member?.mobile_phone || ''}
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
        </div>
      )}

      {/* 위험활동 모달 */}
      <DangerousActivityModal
        isOpen={showDangerousActivityModal}
        onClose={handleDangerousActivityModalConfirm}
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
              departureDate={departureDate}
              departureTime={departureTime}
              arrivalDate={arrivalDate}
              arrivalTime={arrivalTime}
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
        onUpload={(newParticipants) => {
          const representative = participants[0];
          const restFromExcel = newParticipants.map((p, index) => ({ ...p, id: index + 2 }));
          const merged = representative
            ? [{ ...representative, id: 1 }, ...restFromExcel]
            : restFromExcel.map((p, i) => ({ ...p, id: i + 1 }));
          setParticipants(merged);
          setCalculatedPremiums(null);
          setShowExcelModal(false);
        }}
        currentParticipants={participants}
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
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
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
