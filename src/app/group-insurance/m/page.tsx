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
import './page.css';

function MobileGroupInsuranceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { member, isLoggedIn } = useAuth();

  // 탭 상태 (DS: 국내여행, FS: 해외여행, FL: 해외장기체류)
  const [activeTab, setActiveTab] = useState<'DS' | 'FS' | 'FL'>('DS');

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
  const [travelCountry, setTravelCountry] = useState('');
  const [travelPurpose, setTravelPurpose] = useState('');
  const [travelPurposeLong, setTravelPurposeLong] = useState('N010001');
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

  // 여행국가 목록 불러오기
  useEffect(() => {
    if (activeTab === 'DS') {
      setTravelCountries([]);
      setTravelCountry('');
    } else {
      setTravelCountries([
        { code: 'JP', name: '일본' },
        { code: 'VN', name: '베트남' },
        { code: 'TH', name: '태국' },
        { code: 'TW', name: '대만' },
        { code: 'PH', name: '필리핀' },
        { code: 'GU', name: '괌' },
        { code: 'SG', name: '싱가포르' },
        { code: 'US', name: '미국' },
        { code: 'MY', name: '말레이시아' },
        { code: 'CN', name: '중국' },
        { code: 'HK', name: '홍콩' },
        { code: 'MO', name: '마카오' },
      ]);
    }
  }, [activeTab]);

  // 탭 변경 핸들러
  const handleTabChange = (tab: 'DS' | 'FS' | 'FL') => {
    setActiveTab(tab);
    // 탭 변경 시 상태 초기화
    setShowPlanSelection(false);
    setPlanInfo(null);
    setSelectedPlan(null);
    setTravelCountry('');
  };

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

  // 생년월일로부터 나이 계산
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
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
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

  // 기간 검증
  const validateDuration = (): { valid: boolean; message?: string } => {
    const departure = new Date(`${departureDate}T${departureTime}:00:00`);
    const arrival = new Date(`${arrivalDate}T${arrivalTime}:00:00`);
    
    if (arrival <= departure) {
      return { valid: false, message: '도착일시는 출발일시보다 이후여야 합니다.' };
    }
    
    const diffTime = arrival.getTime() - departure.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (activeTab === 'DS' && diffDays > 30) {
      return { valid: false, message: '국내여행보험은 최대 1개월(30일)까지 가능합니다.' };
    }
    if (activeTab === 'FS' && diffDays > 90) {
      return { valid: false, message: '해외여행보험은 최대 3개월(90일)까지 가능합니다.' };
    }
    if (activeTab === 'FL' && diffDays < 90) {
      return { valid: false, message: '해외장기체류보험은 최소 3개월 이상부터 가능합니다.' };
    }
    
    return { valid: true };
  };

  // 보험료 계산 함수
  const calculatePremiums = async () => {
    if (!planInfo || !selectedPlan) return;

    const age = calculateAgeFromBirthDate(birthDate);
    if (age === null) return;

    let availablePlans: PlanType[] = [];
    if (activeTab === 'DS') {
      availablePlans = ['실속플랜', '표준플랜'];
    } else if (age >= 0 && age < 15) {
      availablePlans = ['어린이플랜'];
    } else if (age >= 15 && age <= 70) {
      availablePlans = ['실속플랜', '표준플랜', '고급플랜'];
    } else if (age >= 71 && age <= 90) {
      availablePlans = ['어르신플랜1', '어르신플랜2'];
    }

    setIsCalculating(true);

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const genderValue = getGenderFromBirthDate(birthDate, gender);

      const plans: Record<string, PlanInfo> = {};

      for (const planType of availablePlans.filter(p => planInfo && planInfo[p])) {
        if (!planInfo[planType]) continue;
        
        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: getInsuranceType(),
              age: age,
              gender: genderValue,
              plan_type: planType,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: activeTab === 'FL' ? currencyPlan : '원화',
              travel_country: activeTab !== 'DS' ? travelCountry : null,
            }),
          });

          const data = await response.json();
          if (data.success) {
            plans[planType] = {
              type: planType,
              premium: data.premium,
              coverages: planInfo[planType].coverages,
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

  useEffect(() => {
    if (showPlanSelection && planInfo && selectedPlan) {
      calculatePremiums();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMedicalExpense, currencyPlan]);

  const handleCalculate = async () => {
    // 입력 검증
    if (!departureDate || !arrivalDate || !birthDate || birthDate.length !== 8) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    // 해외여행은 여행국가 필수
    if (activeTab !== 'DS' && !travelCountry) {
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

    // 플랜 결정
    let availablePlans: PlanType[] = [];
    if (activeTab === 'DS') {
      availablePlans = ['실속플랜', '표준플랜'];
    } else if (age >= 0 && age < 15) {
      availablePlans = ['어린이플랜'];
    } else if (age >= 15 && age <= 70) {
      availablePlans = ['실속플랜', '표준플랜', '고급플랜'];
    } else if (age >= 71 && age <= 90) {
      availablePlans = ['어르신플랜1', '어르신플랜2'];
    } else {
      alert('가입 가능한 나이 범위를 벗어났습니다.');
      return;
    }

    setIsCalculating(true);

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const genderValue = getGenderFromBirthDate(birthDate, gender);

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
              insurance_type: getInsuranceType(),
              age: age,
              gender: genderValue,
              plan_type: planType,
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: activeTab === 'FL' ? currencyPlan : '원화',
              travel_country: activeTab !== 'DS' ? travelCountry : null,
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

  // 가입자 보험료 계산 함수
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

      for (const participant of participants) {
        const age = calculateAgeFromBirthDate(participant.birthDate);
        if (age === null) {
          alert(`${participant.name}의 생년월일을 올바르게 입력해주세요.`);
          setIsCalculating(false);
          return;
        }

        const planType = selectedPlan || '실속플랜';
        const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
        const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;

        const response = await fetch('/api/travel/calculate-premium', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: getInsuranceType(),
            age: age,
            gender: participant.gender,
            plan_type: planType,
            has_medical_expense: hasMedicalExpense ? 1 : 0,
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            currency_plan: activeTab === 'FL' ? currencyPlan : '원화',
            travel_country: activeTab !== 'DS' ? travelCountry : null,
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

  const handleProceedToStep2_1 = () => {
    if (!calculatedPremiums || calculatedPremiums.totalPremium <= 0) {
      alert('보험료를 먼저 계산해주세요.');
      return;
    }
    setShowParticipantForm(false);
    setShowStep2_1(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToStep3 = () => {
    if (hasDangerousActivity === null) {
      alert('위험활동 여부를 선택해주세요.');
      return;
    }

    if (activeTab !== 'DS' && !travelPurpose) {
      alert('여행목적을 선택해주세요.');
      return;
    }

    if (hasDangerousActivity) {
      setShowDangerousActivityModal(true);
      return;
    }

    setShowConsentModal(true);
  };

  const handlePaymentSubmit = async () => {
    // 결제 처리 로직 (domestic/m/page.tsx와 동일)
    // ... (생략)
    alert('결제 기능은 추후 구현될 예정입니다.');
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
    switch (activeTab) {
      case 'DS':
        return '단체여행자보험 - 국내여행';
      case 'FS':
        return '단체여행자보험 - 해외여행';
      case 'FL':
        return '단체여행자보험 - 해외장기체류';
      default:
        return '단체여행자보험';
    }
  };

  const getInsuranceType = () => {
    switch (activeTab) {
      case 'DS':
        return '국내여행자보험';
      case 'FS':
        return '해외여행자보험';
      case 'FL':
        return '해외장기체류보험';
      default:
        return '국내여행자보험';
    }
  };

  const getCurrentStep = () => {
    if (showStep3) return 3;
    if (showStep2_1) return 2;
    if (showParticipantForm) return 2;
    return 1;
  };

  const getTypeForComponents = (): 'short' | 'long' => {
    if (activeTab === 'FL') return 'long';
    return 'short';
  };

  return (
    <div className="group-insurance-mobile">
      <Header isMobile={true} />
      
      {/* STEP 1: 여행정보 입력 화면 */}
      {!showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          {/* 상단 타이틀 가입단계 */}
          <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
            <p className="tour2023_title01">
              단체여행자보험<br />
              <span className="tour2023_title09">(사업자/법인)</span>
            </p>
            <MobileStepIndicator currentStep={getCurrentStep()} />
          </div>

          {/* 탭 메뉴 */}
          <div className="menu_wrap_tab tourG_mat10 tourG_mab05">
            <span className={`menu_tab ${activeTab === 'DS' ? 'on' : ''}`}>
              <a 
                href="javascript:void(0);" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  handleTabChange('DS'); 
                }}
              >
                국내여행
              </a>
            </span>
            <span className={`menu_tab ${activeTab === 'FS' ? 'on' : ''}`}>
              <a 
                href="javascript:void(0);" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  handleTabChange('FS'); 
                }}
              >
                해외여행
              </a>
            </span>
            <span className={`menu_tab ${activeTab === 'FL' ? 'on' : ''}`}>
              <a 
                href="javascript:void(0);" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  handleTabChange('FL'); 
                }}
              >
                해외장기체류
              </a>
            </span>
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
            travelPurpose={activeTab === 'FL' ? travelPurposeLong : ''}
            onDepartureDateChange={setDepartureDate}
            onDepartureTimeChange={setDepartureTime}
            onArrivalDateChange={setArrivalDate}
            onArrivalTimeChange={setArrivalTime}
            onBirthDateChange={setBirthDate}
            onGenderChange={setGender}
            onTravelCountryChange={setTravelCountry}
            onTravelPurposeChange={activeTab === 'FL' ? setTravelPurposeLong : () => {}}
            travelCountries={travelCountries}
            type={getTypeForComponents()}
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
                travelCountry={activeTab !== 'DS' ? travelCountry : undefined}
                travelPurpose={activeTab === 'FL' ? travelPurposeLong : undefined}
              />
            )}
          </div>
        </div>
      )}

      {/* STEP 2: 가입자 정보 입력 화면 */}
      {showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
          <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
            <p className="tour2023_title01">{getTitle()}</p>
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
            onExcelUpload={() => setShowExcelModal(true)}
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
        <RiskActivityStep
          insuranceType={getTitle()}
          hasDangerousActivity={hasDangerousActivity}
          travelPurpose={travelPurpose}
          onDangerousActivityChange={setHasDangerousActivity}
          onTravelPurposeChange={setTravelPurpose}
          onShowDangerousActivityModal={() => setShowDangerousActivityModal(true)}
          isOverseas={activeTab !== 'DS'}
          isCurrentlyAbroad={isCurrentlyAbroad}
          hasRestrictedCountry={hasRestrictedCountry}
          onCurrentlyAbroadChange={setIsCurrentlyAbroad}
          onRestrictedCountryChange={setHasRestrictedCountry}
          onShowRestrictedCountryModal={() => setShowRestrictedCountryModal(true)}
          isLongTermStay={activeTab === 'FL'}
          onNext={handleProceedToStep3}
        />
      )}

      {/* 위험활동 확인 모달 */}
      <DangerousActivityModal
        isOpen={showDangerousActivityModal}
        onClose={() => setShowDangerousActivityModal(false)}
      />

      {/* 제한국가 확인 모달 */}
      {activeTab !== 'DS' && (
        <RestrictedCountryModal
          isOpen={showRestrictedCountryModal}
          onClose={() => setShowRestrictedCountryModal(false)}
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
        insuranceType={getTitle()}
      />

      {/* Excel 업로드 모달 */}
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

export default function MobileGroupInsurancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileGroupInsuranceContent />
    </Suspense>
  );
}
