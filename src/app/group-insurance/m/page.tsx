'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { requestNicepayPayment, openNicepayWindow, processNaverPayPayment, processKakaoPayPayment } from '@/services/paymentService';
import { getTrackingInfo } from '@/utils/tracking';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo, CorporateInfo, ContactInfo } from '@/services/authService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileStepIndicator from '@/components/mobiletravel/StepIndicator';
import MobileGroupTravelInfoStep from '@/components/mobiletravel/GroupTravelInfoStep';
import GroupPlanSelection from '@/components/mobiletravel/GroupPlanSelection';
import ParticipantInfoStep from '@/components/travel/ParticipantInfoStep';
import GroupParticipantInfoStep, { GroupInfo } from '@/components/mobiletravel/GroupParticipantInfoStep';
import RiskActivityStep from '@/components/travel/RiskActivityStep';
import ContractInfoStep from '@/components/travel/ContractInfoStep';
import PaymentStep from '@/components/travel/PaymentStep';
import CompletionStep from '@/components/travel/CompletionStep';
import ExcelUploadModal from '@/components/travel/ExcelUploadModal';
import DangerousActivityModal from '@/components/travel/DangerousActivityModal';
import RestrictedCountryModal from '@/components/travel/RestrictedCountryModal';
import ConsentModalMobile from '@/components/mobiletravel/ConsentModalMobile';
import { PlanType, PlanInfo, Participant, CalculatedPremiums, PaymentMethod, PaymentSubMethod } from '@/components/travel/types';
import { frequentCountries, allCountries } from '@/components/travel/utils/countries';
import './page.css';

// 워킹홀리데이 DB plan_type (화면에 그대로 표시)
const WORKING_HOLIDAY_DB_PLANS = ['워킹홀리데이실속플랜', '워킹홀리데이표준플랜', '워킹홀리데이(유로화플랜)'] as const;
const GROUP_PLAN_TIER_LABELS: PlanType[] = ['실속플랜', '표준플랜', '고급플랜'];

const getDomesticCoverages = (planType: PlanType): { label: string; amount: string }[] => [
  { label: '상해사망후유장해', amount: '1억원' },
  { label: '상해입원의료비', amount: '1,000만원' },
  { label: '상해통원의료비', amount: '10만원' },
  ...(planType !== '실속플랜' ? [
    { label: '질병입원의료비', amount: '1,000만원' },
    { label: '질병통원의료비', amount: '10만원' },
  ] : []),
  { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
];

const getOverseasCoverages = (planType: PlanType): { label: string; amount: string }[] => {
  if (planType === '표준플랜') {
    return [
      { label: '상해사망후유장해', amount: '2억원' },
      { label: '해외의료비(상해)', amount: '5,000만원' },
      { label: '해외의료비(질병)', amount: '5,000만원' },
      { label: '휴대품손해(휴대폰은 보상제외)', amount: '100만원' },
    ];
  }

  if (planType === '실속플랜') {
    return [
      { label: '상해사망후유장해', amount: '1억원' },
      { label: '해외의료비(상해)', amount: '2,000만원' },
      { label: '해외의료비(질병)', amount: '2,000만원' },
      { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
    ];
  }

  if (planType === '고급플랜') {
    return [
      { label: '상해사망후유장해', amount: '3억원' },
      { label: '해외의료비(상해)', amount: '1억원' },
      { label: '해외의료비(질병)', amount: '1억원' },
      { label: '휴대품손해(휴대폰은 보상제외)', amount: '150만원' },
    ];
  }

  return [
    { label: '상해사망후유장해', amount: '1억원' },
    { label: '상해입원의료비', amount: '1,000만원' },
    { label: '상해통원의료비', amount: '10만원' },
    { label: '질병입원의료비', amount: '1,000만원' },
    { label: '질병통원의료비', amount: '10만원' },
    { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
  ];
};

const getLongTermStayCoverages = (
  planType: PlanType,
  insuranceType: string,
  currentCurrencyPlan: '원화' | '외화'
): { label: string; amount: string }[] => {
  if (insuranceType === '유학/어학연수' || insuranceType === '해외출장/주재원/교환교수') {
    if (currentCurrencyPlan === '원화') {
      if (planType === '실속플랜') {
        return [
          { label: '상해사망후유장해', amount: '1억원' },
          { label: '해외의료비(상해)', amount: '2,000만원' },
          { label: '해외의료비(질병)', amount: '2,000만원' },
          { label: '중대사고구조송환비용', amount: '2,000만원' },
        ];
      }
      if (planType === '표준플랜') {
        return [
          { label: '상해사망후유장해', amount: '1억원' },
          { label: '해외의료비(상해)', amount: '5,000만원' },
          { label: '해외의료비(질병)', amount: '5,000만원' },
          { label: '중대사고구조송환비용', amount: '2,000만원' },
        ];
      }
      if (planType === '고급플랜') {
        return [
          { label: '상해사망후유장해', amount: '2억원' },
          { label: '해외의료비(상해)', amount: '1억원' },
          { label: '해외의료비(질병)', amount: '1억원' },
          { label: '중대사고구조송환비용', amount: '5,000만원' },
        ];
      }
    } else if (currentCurrencyPlan === '외화') {
      if (planType === '실속플랜') {
        return [
          { label: '상해사망후유장해', amount: '1억원' },
          { label: '해외의료비(상해)', amount: '20,000USD' },
          { label: '해외의료비(질병)', amount: '20,000USD' },
          { label: '중대사고구조송환비용', amount: '20,000USD' },
        ];
      }
      if (planType === '표준플랜') {
        return [
          { label: '상해사망후유장해', amount: '1억원' },
          { label: '해외의료비(상해)', amount: '50,000USD' },
          { label: '해외의료비(질병)', amount: '50,000USD' },
          { label: '중대사고구조송환비용', amount: '75,000USD' },
        ];
      }
      if (planType === '고급플랜') {
        return [
          { label: '상해사망후유장해', amount: '2억원' },
          { label: '해외의료비(상해)', amount: '100,000USD' },
          { label: '해외의료비(질병)', amount: '100,000USD' },
          { label: '중대사고구조송환비용', amount: '75,000USD' },
        ];
      }
    }
  } else if (insuranceType === '워킹홀리데이') {
    const whCoverageType = planType === '워킹홀리데이실속플랜' ? '실속플랜' : planType === '워킹홀리데이표준플랜' ? '표준플랜' : planType === '워킹홀리데이(유로화플랜)' ? '고급플랜' : planType;
    if (whCoverageType === '실속플랜') {
      return [
        { label: '상해사망후유장해', amount: '2,000만원' },
        { label: '해외의료비(상해)', amount: '2,000만원' },
        { label: '해외의료비(질병)', amount: '2,000만원' },
        { label: '중대사고구조송환비용', amount: '1,000만원' },
      ];
    }
    if (whCoverageType === '표준플랜') {
      return [
        { label: '상해사망후유장해', amount: '5,000만원' },
        { label: '해외의료비(상해)', amount: '5,000만원' },
        { label: '해외의료비(질병)', amount: '5,000만원' },
        { label: '중대사고구조송환비용', amount: '5,000만원' },
      ];
    }
    if (whCoverageType === '고급플랜') {
      return [
        { label: '상해사망후유장해', amount: '30,000EUR' },
        { label: '해외의료비(상해)', amount: '30,000EUR' },
        { label: '해외의료비(질병)', amount: '30,000EUR' },
        { label: '중대사고구조송환비용', amount: '30,000EUR' },
      ];
    }
  }

  return [
    { label: '상해사망후유장해', amount: '1억원' },
    { label: '상해입원의료비', amount: '1,000만원' },
    { label: '상해통원의료비', amount: '10만원' },
    { label: '질병입원의료비', amount: '1,000만원' },
    { label: '질병통원의료비', amount: '10만원' },
    { label: '휴대품손해(휴대폰은 보상제외)', amount: '50만원' },
  ];
};

function MobileGroupInsuranceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { member, isLoggedIn, login: authLogin } = useAuth();
  const [isGuestApply, setIsGuestApply] = useState(false);
  const isCorporateMember = (isLoggedIn && member && member.member_type !== '개인') || isGuestApply;

  // 탭 상태 (DS: 국내여행, FS: 해외여행, FL: 해외장기체류)
  const [activeTab, setActiveTab] = useState<'DS' | 'FS' | 'FL'>('DS');

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
  const [travelPurpose, setTravelPurpose] = useState('');
  const [travelPurposeLong, setTravelPurposeLong] = useState('N010001');
  const [travelCountries, setTravelCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [groupParticipantCount, setGroupParticipantCount] = useState('');
  const [hasGroupParticipants, setHasGroupParticipants] = useState(false);
  const [groupParticipantsData, setGroupParticipantsData] = useState<Participant[]>([]);
  const [groupInsuredData, setGroupInsuredData] = useState<any[]>([]); // InsuredData 형식으로 저장
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null); // 그룹 정보 (사업자정보, 담당자 등)
  const [corporateInfo, setCorporateInfo] = useState<CorporateInfo | null>(null); // 법인 정보
  const [corporateContacts, setCorporateContacts] = useState<ContactInfo[]>([]); // 법인 담당자 목록
  const [participantPremiumsByPlan, setParticipantPremiumsByPlan] = useState<Record<string, Array<{ id: number; name: string; gender: string; birthDate: string; planType: string; premium: number }>>>({});
  
  // 보험료 계산 관련 상태
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [planInfo, setPlanInfo] = useState<Record<string, PlanInfo> | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [hasMedicalExpense, setHasMedicalExpense] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currencyPlan, setCurrencyPlan] = useState<'원화' | '외화'>('원화');
  const [isNoticeExpanded, setIsNoticeExpanded] = useState(false);

  const fetchPlanCoverages = async (
    insuranceType: string,
    planTypes: PlanType[],
    currencyPlanValue?: '원화' | '외화'
  ) => {
    try {
      const response = await fetch('/api/travel/plan-coverages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_type: insuranceType,
          plan_types: planTypes,
          currency_plan: currencyPlanValue,
          ...(activeTab !== 'FL' ? { has_medical_expense: hasMedicalExpense ? 1 : 0 } : {}),
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

  const expandedNoticeExtraItemsByType: Record<'DS' | 'FS' | 'FL', React.ReactNode[]> = {
    DS: [
      <>
        라이나손해보험의 국내여행보험 상품입니다.
      </>,
      <>
        보험기간은 최대 1개월 이고 여행, 체험학습, 연수,<br />
        출장, 교육 등으로 대한민국 국내에서 여행을 떠나실<br />
        때 가입하는 보험입니다
      </>,
      <>
        <span className="tourG_know_red">스키(스노보드), 래프팅</span>, 스쿠버다이빙, 행글라이딩,<br />
        패러글라이딩, 스카이다이빙, 수상스키, 자동차, 오<br />
        토바이 경주, 번지점프, 빙벽, 암벽등반, 제트스키를<br />
        목적으로 하는 여행은 국내 여행보험에 가입하실 수<br />
        없습니다.
      </>,
      <>
        휴대품손해 약관 변경 안내 (2020년 5월)<br />
        휴대품손해에서 이동동신단말기<span className="tourG_know_red">(휴대폰 등 공단말기<br />
        포함)</span>은 보상하지 않습니다.
      </>,
      <>
        국내여행보험의 주계약은 상해사망 및 후유장해이며<br />
        그외에는 선택특약입니다. 선택특약은 해당특약 가입<br />
        시에만 보상받으실 수 있습니다.
      </>,
      <>
        국내여행보험은 보험나이? 100세까지 가입하실 수 있<br />
        습니다.
      </>,
      <>
        상법 제732조에 따라 15세 미만의 경우 사망에 대해<br />
        서는 보장하지 않습니다.(후유장해 보상).
      </>,
      <>
        <span className="tourG_know_red">(비례보상)실손의료비,  배상책임, 휴대품손해</span>를 보<br />
        상하는 상품은 <span className="tourG_know_red">2개 이상의 보험에 가입</span>하더라도<br />
        <span className="tourG_know_red">중복  보상되지 않고 비례보상</span> 됩니다.
      </>,
      <>
        가입 전 알아두실 사항 및 보장내용에 관한 자세한 사<br />
        항은 해당약관을 참조하시기 바랍니다.
      </>,
    ],
    FS: [
      <>
        라이나손해보험의 해외여행보험 상품입니다
      </>,
      <>
        출장, 연수, 주재원, 답사, 여행 등의 목적으로 최대 3개월<br />
        까지 해외로 나가는 경우 가입하는 보험입니다. (3개월이<br />
        넘는 경우 해외장기체류보험)
      </>,
      <>
        이미 출국하셨거나 해외에 거주하는 경우에는 여행보험에<br />
        가입하실 수 없습니다.
      </>,
      <>
        휴대품손해에서 <span className="tourG_know_red">휴대품 1개(1조 또는 1쌍)의 보상한도는<br />
        20만원</span>입니다. 단, <span className="tourG_know_red">이동통신단말기(휴대폰 등)의 보상한<br />
        도는 10만원</span>입니다. (2020년 1월 약관 개정)
      </>,
      <>
        해외여행보험의 주계약은 상해사망 및 후유장해이며 그<br />
        외에는 선택특약입니다. 선택특약은 해당특약 가입시에만<br />
        보상받으실 수 있습니다.
      </>,
      <>
        해외여행보험은 보험나이? 100세까지 가입하실 수 있습<br />
        니다.
      </>,
      <>
        배상책임, 휴대품손해는 자기부담금 각 1만원입니다.
      </>,
      <>
        상법 제732조에 따라 15세 미만의 경우 사망에 대해서는<br />
        보장하지 않습니다.(후유장해 보상)
      </>,
      <>
        <span className="tourG_know_red">(비례보상)실손의료비, 중대사고 구조송환비용, 배상책임, 휴대품손해</span>를 보상하는 상품은<br />
        <span className="tourG_know_red">2개 이상의 보험에 가입</span>하더라도 <span className="tourG_know_red">중복 보상되지 않고 비례보상</span> 됩니다.
      </>,
      <>
        코로나 치료비는 질병의료비 담보에서 보상이 가능합니다.
      </>,
      <>
        가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은<br />
        해당약관을 참조하시기 바랍니다
      </>,
    ],
    FL: [
      <>
        메리츠화재의 해외장기체류보험 상품입니다
      </>,
      <>
        출장, 연수, 주재원, 답사, 여행 등의 목적으로 3개월을<br />
        초과하여 해외로 나가는 경우 가입하는 보험입니다. (3<br />
        개월 이하는 해외여행보험)
      </>,
      <>
        보험기간은 최대 1년이며 만기시 갱신가능합니다.
      </>,
      <>
        이미 출국하셨거나 해외에 거주하는 경우에는 해외장기<br />
        체류보험에 가입하실 수 없습니다.
      </>,
      <>
        해외장기체류보험의 주계약은 상해사망 및 후유장해이며<br />
        그외에는 선택특약입니다. 선택특약은 해당특약 가입시<br />
        에만 보상받으실 수 있습니다.
      </>,
      <>
        상법 제732조에 따라 15세 미만의 경우 사망에 대해서는<br />
        보장하지 않습니다.(후유장해 보상)
      </>,
      <>
        <span className="tourG_know_red">(비례보상)실손의료비, 중대사고 구조송환비용, 배상책임</span>을 보상하는 상품은<br />
        <span className="tourG_know_red">2개 이상의 보험에 가입</span>하더라도 <span className="tourG_know_red">중복 보상되지 않고 비례보상</span> 됩니다.
      </>,
      <>
        코로나 치료비는 질병의료비 담보에서 보상이 가능합니다.
      </>,
      <>
        가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은<br />
        해당약관을 참조하시기 바랍니다
      </>,
    ],
  };

  const collapsedNoticeItemsByType: Record<'DS' | 'FS' | 'FL', React.ReactNode[]> = {
    DS: [
      <>
        보험기간은 최대 1개월 이고 여행, 체험학습, 연수,<br />
        출장, 교육 등으로 대한민국 국내에서 여행(행사진행)을 떠나실 때 가입하는 보험입니다.
      </>,
      <>
        휴대품손해 약관 변경 안내 (2020년 5월)<br />
        휴대품손해에서 이동동신단말기
        <span style={{ color: '#ff0000' }}>(휴대폰 등 공단말기 포함)</span>
        은 보상하지 않습니다.
      </>,
      <>라이나손해보험의 국내여행보험 상품입니다.</>,
    ],
    FS: [
      <>
        출장, 연수, 주재원, 답사, 여행 등의 목적으로 최대 3개월까지 해외로 나가는 경우 가입하는 보험입니다. (3개월이 넘는 경우 해외장기체류보험)
      </>,
      <>
        이미 출국하셨거나 해외에 거주하는 경우에는 해외여행보험에 가입하실 수 없습니다.
      </>,
      <>
        휴대품손해에서 휴대품 1개(1조 또는 1쌍)의 보상한도는 20만원입니다. 단, 이동통신단말기(휴대폰 등)의 보상한도는 10만원입니다. (2020년 1월 약관 개정).
      </>,
      <>라이나손해보험의 해외여행보험 상품입니다</>,
    ],
    FL: [
      <>
        출장, 연수, 주재원, 답사, 여행 등의 목적으로 3개월을 초과하여 해외로 나가는 경우 가입하는 보험입니다. (3개월 이하는 해외여행보험)
      </>,
      <>보험기간은 최대 1년이며 만기시 갱신가능합니다.</>,
      <>이미 출국하셨거나 해외에 거주하는 경우에는 해외장기체류보험에 가입하실 수 없습니다.</>,
      <>메리츠화재의 해외장기체류보험 상품입니다</>,
    ],
  };
  
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
  const fetchAvailablePlans = async (
    age: number,
    genderValue: string,
    options?: { birth_date?: string; departure_date?: string }
  ) => {
    try {
      const body: Record<string, unknown> = {
        insurance_type: getInsuranceType(),
        age,
        gender: genderValue,
        plan_variant: 'B',
        has_medical_expense: hasMedicalExpense ? 1 : 0,
        include_foreign_currency: activeTab === 'FL',
      };
      if (options?.birth_date) body.birth_date = options.birth_date;
      if (options?.departure_date) body.departure_date = options.departure_date;

      const response = await fetch('/api/travel/available-plans', {
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

  const createEmptyParticipant = (id: number): Participant => ({
    id,
    name: '',
    nationality: '내국인',
    birthDate: '',
    gender: '남자',
    email1: '',
    email2: '',
    phone: '',
    isVerified: false,
  });

  // 여행국가 목록 불러오기
  useEffect(() => {
    if (activeTab === 'DS') {
      setTravelCountries([]);
      setTravelCountry('');
    } else {
      setTravelCountries(allCountries);
    }
  }, [activeTab]);

  // 새 창에서 가입자 입력 데이터 받기
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안을 위해 origin 확인
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data && event.data.type === 'PARTICIPANT_INPUT_CONFIRM') {
        const { participants: newParticipants, participantCount: newCount, insuredData } = event.data;
        
        const hasInsuredData = Array.isArray(insuredData) && insuredData.length > 0;

        if (hasInsuredData) {
          // 그룹 가입자 데이터 저장 (피보험자 정보는 별도 저장)
          setGroupParticipantsData(newParticipants);
          setGroupParticipantCount(String(newCount));
          setHasGroupParticipants(true);
          setGroupInsuredData(insuredData);
          
          // sessionStorage에도 저장하여 페이지 리다이렉트 시에도 유지
          sessionStorage.setItem('groupParticipantsData', JSON.stringify(newParticipants));
          sessionStorage.setItem('groupParticipantCount', String(newCount));
          sessionStorage.setItem('groupInsuredData', JSON.stringify(insuredData));
          sessionStorage.setItem('hasGroupParticipants', '1');
          
          console.log('피보험자 데이터 저장:', {
            participantsCount: newParticipants.length,
            insuredDataCount: insuredData.length,
            participantCount: newCount
          });
          return;
        }

        // insuredData가 없을 때만 participants에 반영
        setParticipants((prevParticipants) => {
          const startId = prevParticipants.length > 0
            ? Math.max(...prevParticipants.map(p => p.id)) + 1
            : 1;
          
          const participantsWithCorrectIds = newParticipants.map((p: Participant, index: number) => ({
            ...p,
            id: startId + index,
          }));

          return [...prevParticipants, ...participantsWithCorrectIds];
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    const storedDraft = sessionStorage.getItem('groupInsuranceDraft');
    if (!storedDraft) return;

    try {
      const parsed = JSON.parse(storedDraft);
      if (parsed.activeTab && (parsed.activeTab === 'DS' || parsed.activeTab === 'FS' || parsed.activeTab === 'FL')) {
        setActiveTab(parsed.activeTab);
      }
      if (parsed.departureDate) setDepartureDate(parsed.departureDate);
      if (parsed.departureTime) setDepartureTime(parsed.departureTime);
      if (parsed.arrivalDate) setArrivalDate(parsed.arrivalDate);
      if (parsed.arrivalTime) setArrivalTime(parsed.arrivalTime);
      if (parsed.travelCountry !== undefined) setTravelCountry(parsed.travelCountry);
      if (parsed.travelPurpose !== undefined) setTravelPurpose(parsed.travelPurpose);
      if (parsed.travelPurposeLong !== undefined) setTravelPurposeLong(parsed.travelPurposeLong);
      if (parsed.birthDate !== undefined) setBirthDate(parsed.birthDate);
      if (parsed.gender !== undefined) setGender(parsed.gender);
      if (parsed.groupParticipantCount !== undefined) setGroupParticipantCount(parsed.groupParticipantCount);
    } catch (error) {
      console.error('임시 저장 데이터 복원 오류:', error);
    } finally {
      sessionStorage.removeItem('groupInsuranceDraft');
    }
  }, []);

  useEffect(() => {
    if (!showParticipantForm || isCorporateMember || hasGroupParticipants) return;

    const desiredCount = parseInt(groupParticipantCount, 10);
    if (!Number.isFinite(desiredCount) || desiredCount < 1) return;

    setParticipantCount(desiredCount > 1 ? 2 : 1);
    setParticipants((prev) => {
      const next = [...prev];
      if (next.length < desiredCount) {
        let nextId = Math.max(0, ...next.map((p) => p.id)) + 1;
        for (let i = next.length; i < desiredCount; i++) {
          next.push(createEmptyParticipant(nextId));
          nextId += 1;
        }
        return next;
      }
      if (next.length > desiredCount) {
        return next.slice(0, desiredCount);
      }
      return next;
    });
  }, [showParticipantForm, isCorporateMember, groupParticipantCount, hasGroupParticipants]);

  useEffect(() => {
    if (!hasGroupParticipants) return;
    setParticipantCount(1);
    setParticipants((prev) => (prev.length > 1 ? [prev[0]] : prev));
  }, [hasGroupParticipants]);

  // 로그인/비회원 가입신청 완료 신호 받기
  useEffect(() => {
    const handleJoinContinue = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data && event.data.type === 'GROUP_INSURANCE_JOIN_CONTINUE') {
        if (event.data.member) {
          authLogin(event.data.member);
        }
        setShowParticipantForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('message', handleJoinContinue);
    return () => {
      window.removeEventListener('message', handleJoinContinue);
    };
  }, [authLogin]);

  // 페이지를 떠날 때 플래그 설정 (브라우저를 닫거나 다른 도메인으로 이동할 때)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 로그인 플로우가 아닌 경우에만 플래그 설정
      const shouldContinue = sessionStorage.getItem('groupInsuranceJoinContinue');
      const isGuestApplyFlag = sessionStorage.getItem('groupInsuranceGuestApply');
      const isLoginFlow = shouldContinue === '1' || isGuestApplyFlag === '1';
      
      if (!isLoginFlow) {
        sessionStorage.setItem('groupInsurancePageLeft', '1');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 컴포넌트가 unmount될 때 플래그 설정 (같은 사이트 내 다른 페이지로 이동할 때)
  useEffect(() => {
    return () => {
      // 로그인 플로우가 아닌 경우에만 플래그 설정
      const shouldContinue = sessionStorage.getItem('groupInsuranceJoinContinue');
      const isGuestApplyFlag = sessionStorage.getItem('groupInsuranceGuestApply');
      const isLoginFlow = shouldContinue === '1' || isGuestApplyFlag === '1';
      
      if (!isLoginFlow) {
        sessionStorage.setItem('groupInsurancePageLeft', '1');
      }
    };
  }, []);

  // coverage-detail에서 돌아온 경우 상태 복원
  useEffect(() => {
    const restoreState = () => {
      try {
        const savedState = localStorage.getItem('group_insurance_m_state');
        if (savedState) {
          const state = JSON.parse(savedState);
          
          // showPlanSelection이 true이고 planInfo가 있으면 상태 복원
          // 단, 이미 상태가 복원되어 있으면 복원하지 않음 (중복 복원 방지)
          if (state.showPlanSelection && state.planInfo && (!showPlanSelection || !planInfo)) {
            setShowPlanSelection(state.showPlanSelection);
            setPlanInfo(state.planInfo);
            if (state.selectedPlan) setSelectedPlan(state.selectedPlan);
            if (state.hasMedicalExpense !== undefined) setHasMedicalExpense(state.hasMedicalExpense);
            if (state.departureDate) setDepartureDate(state.departureDate);
            if (state.departureTime) setDepartureTime(state.departureTime);
            if (state.arrivalDate) setArrivalDate(state.arrivalDate);
            if (state.arrivalTime) setArrivalTime(state.arrivalTime);
            if (state.birthDate) setBirthDate(state.birthDate);
            if (state.gender) setGender(state.gender);
            if (state.travelCountry !== undefined) setTravelCountry(state.travelCountry);
            if (state.activeTab) setActiveTab(state.activeTab);
            if (state.groupParticipantCount) setGroupParticipantCount(state.groupParticipantCount);
            if (state.groupParticipantsData) setGroupParticipantsData(state.groupParticipantsData);
            if (state.groupInsuredData) setGroupInsuredData(state.groupInsuredData);
            if (state.groupParticipantsData || state.groupInsuredData) {
              setHasGroupParticipants(true);
            }
            if (state.participantPremiumsByPlan) setParticipantPremiumsByPlan(state.participantPremiumsByPlan);
            if (state.currencyPlan !== undefined) {
              setCurrencyPlan(state.currencyPlan === '원화플랜' ? '원화' : state.currencyPlan === '외화플랜' ? '외화' : state.currencyPlan);
            }
            if (state.travelPurposeLong) setTravelPurposeLong(state.travelPurposeLong);
            if (state.calculatedPremiums) setCalculatedPremiums(state.calculatedPremiums);
            
            console.log('상태 복원 완료:', {
              showPlanSelection: state.showPlanSelection,
              planInfoKeys: Object.keys(state.planInfo || {}),
              selectedPlan: state.selectedPlan,
              calculatedPremiums: state.calculatedPremiums ? '있음' : '없음'
            });
          }
          // 상태 복원 여부와 관계없이 localStorage는 유지 (다음 coverage-detail 방문 시에도 사용)
        }
      } catch (error) {
        console.error('상태 복원 오류:', error);
        localStorage.removeItem('group_insurance_m_state');
      }
    };

    // URL에 returnUrl 파라미터가 있으면 (coverage-detail에서 돌아온 경우) 상태 복원
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl && decodeURIComponent(returnUrl) === '/group-insurance/m') {
      restoreState();
    } else if (window.location.pathname === '/group-insurance/m') {
      // returnUrl이 없어도 경로가 맞으면 복원 시도 (직접 접근한 경우)
      restoreState();
    }
  }, [searchParams, showPlanSelection, planInfo]);

  useEffect(() => {
    // 페이지 진입 시 세션 스토리지 초기화 (로그인/비회원 가입신청 플로우 제외)
    const shouldContinue = sessionStorage.getItem('groupInsuranceJoinContinue');
    const isGuestApplyFlag = sessionStorage.getItem('groupInsuranceGuestApply');
    
    // 로그인/비회원 가입신청 플로우가 아닌 경우에만 세션 데이터 초기화
    const isLoginFlow = shouldContinue === '1' || isGuestApplyFlag === '1';
    
    // coverage-detail에서 돌아온 경우 확인
    const returnUrl = searchParams.get('returnUrl');
    const isReturningFromCoverageDetail = returnUrl && decodeURIComponent(returnUrl) === '/group-insurance/m';
    const isReturningFromPremiumDetail = sessionStorage.getItem('groupInsuranceReturn') === '1';
    
    // localStorage에 저장된 상태가 있는지 확인 (coverage-detail에서 돌아온 경우)
    const hasSavedState = localStorage.getItem('group_insurance_m_state') !== null;
    
    // 다른 페이지에서 돌아온 경우 확인
    const pageLeft = sessionStorage.getItem('groupInsurancePageLeft') === '1';
    
    // 복원된 데이터가 있는지 확인 (로그인 플로우에서 복원한 데이터 보호)
    const dataRestored = sessionStorage.getItem('groupInsuranceDataRestored') === '1';
    const hasRestoredData = sessionStorage.getItem('hasGroupParticipants') === '1' && 
                           sessionStorage.getItem('groupParticipantsData') &&
                           sessionStorage.getItem('groupInsuredData');
    
    console.log('페이지 진입 시 초기화 체크:', {
      shouldContinue,
      isGuestApplyFlag,
      isLoginFlow,
      pageLeft,
      dataRestored,
      hasRestoredData,
      isReturningFromCoverageDetail,
      hasSavedState,
      willClear: (!isLoginFlow && !dataRestored && !hasRestoredData && !isReturningFromCoverageDetail && !hasSavedState) || (pageLeft && !isReturningFromCoverageDetail && !hasSavedState)
    });
    
    // 새로 진입한 경우 로컬 상태 정리 (coverage-detail/premium-detail 복귀 제외)
    if (!isReturningFromCoverageDetail && !isReturningFromPremiumDetail) {
      localStorage.removeItem('group_insurance_m_state');
    }

    // coverage-detail/premium-detail에서 돌아온 경우 초기화하지 않음 (로그인 플로우는 계속 진행)
    if ((isReturningFromCoverageDetail || isReturningFromPremiumDetail) && !isLoginFlow) {
      return;
    }
    
    // 다른 페이지에서 돌아온 경우 무조건 초기화 (로그인 플로우 제외)
    if (pageLeft && !isLoginFlow) {
      // 페이지 이탈 플래그 제거
      sessionStorage.removeItem('groupInsurancePageLeft');
      
      // 최초 진입 또는 일반 진입 시 세션 스토리지 완전 초기화
      sessionStorage.removeItem('groupParticipantsData');
      sessionStorage.removeItem('groupParticipantCount');
      sessionStorage.removeItem('groupInsuredData');
      sessionStorage.removeItem('hasGroupParticipants');
      sessionStorage.removeItem('planInfo');
      sessionStorage.removeItem('participantPremiumsByPlan');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('calculatedPremiums');
      sessionStorage.removeItem('showPlanSelection');
      sessionStorage.removeItem('groupInsuranceDraft');
      sessionStorage.removeItem('groupInsuranceDataRestored');
      
      // 상태도 초기화
      setGroupParticipantsData([]);
      setGroupParticipantCount('');
      setGroupInsuredData([]);
      setHasGroupParticipants(false);
      setPlanInfo(null);
      setParticipantPremiumsByPlan({});
      setSelectedPlan(null);
      setCalculatedPremiums(null);
      setShowPlanSelection(false);
      
      console.log('세션 스토리지 초기화 완료 (다른 페이지에서 돌아옴)');
    } 
    // 로그인 플로우가 아니고 복원 플래그도 없고 복원된 데이터도 없고 coverage-detail에서 돌아온 경우도 아니고 저장된 상태도 없는 경우 초기화
    else if (!isLoginFlow && !dataRestored && !hasRestoredData && !isReturningFromCoverageDetail && !hasSavedState) {
      // 최초 진입 또는 일반 진입 시 세션 스토리지 완전 초기화
      sessionStorage.removeItem('groupParticipantsData');
      sessionStorage.removeItem('groupParticipantCount');
      sessionStorage.removeItem('groupInsuredData');
      sessionStorage.removeItem('hasGroupParticipants');
      sessionStorage.removeItem('planInfo');
      sessionStorage.removeItem('participantPremiumsByPlan');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('calculatedPremiums');
      sessionStorage.removeItem('showPlanSelection');
      sessionStorage.removeItem('groupInsuranceDraft');
      sessionStorage.removeItem('groupInsuranceDataRestored');
      
      // 상태도 초기화
      setGroupParticipantsData([]);
      setGroupParticipantCount('');
      setGroupInsuredData([]);
      setHasGroupParticipants(false);
      setPlanInfo(null);
      setParticipantPremiumsByPlan({});
      setSelectedPlan(null);
      setCalculatedPremiums(null);
      setShowPlanSelection(false);
      
      console.log('세션 스토리지 초기화 완료 (최초 진입)');
    } else {
      // 로그인/비회원 가입신청 플로우인 경우
      sessionStorage.removeItem('groupInsuranceJoinContinue');
      if (isGuestApplyFlag === '1') {
        sessionStorage.removeItem('groupInsuranceGuestApply');
        setIsGuestApply(true);
      }
      
      // 저장된 피보험자 데이터 복원
      const storedHasGroupParticipants = sessionStorage.getItem('hasGroupParticipants');
      let hasRestoredParticipants = false;
      
      const allRelevantKeys = Object.keys(sessionStorage).filter(key => 
        key.includes('group') || 
        key.includes('participant') || 
        key.includes('plan') || 
        key.includes('calculated') ||
        key.includes('Insurance')
      );
      
      console.log('로그인 후 데이터 복원 시도:', {
        storedHasGroupParticipants,
        allSessionKeys: allRelevantKeys,
        groupParticipantsData: sessionStorage.getItem('groupParticipantsData') ? '있음' : '없음',
        groupInsuredData: sessionStorage.getItem('groupInsuredData') ? '있음' : '없음',
        groupParticipantCount: sessionStorage.getItem('groupParticipantCount')
      });
      
      if (storedHasGroupParticipants === '1') {
        try {
          const storedParticipants = sessionStorage.getItem('groupParticipantsData');
          const storedCount = sessionStorage.getItem('groupParticipantCount');
          const storedInsuredData = sessionStorage.getItem('groupInsuredData');
          
          console.log('피보험자 데이터 확인:', {
            hasStoredParticipants: !!storedParticipants,
            hasStoredInsuredData: !!storedInsuredData,
            storedCount,
            storedParticipantsLength: storedParticipants ? JSON.parse(storedParticipants).length : 0,
            storedInsuredDataLength: storedInsuredData ? JSON.parse(storedInsuredData).length : 0
          });
          
          if (storedParticipants && storedInsuredData) {
            setGroupParticipantsData(JSON.parse(storedParticipants));
            if (storedCount) {
              setGroupParticipantCount(storedCount);
            }
            setGroupInsuredData(JSON.parse(storedInsuredData));
            setHasGroupParticipants(true);
            hasRestoredParticipants = true;
            
            // 복원 완료 플래그 설정 (초기화 방지)
            sessionStorage.setItem('groupInsuranceDataRestored', '1');
            
            console.log('피보험자 데이터 복원:', {
              participantsCount: JSON.parse(storedParticipants).length,
              insuredDataCount: JSON.parse(storedInsuredData).length,
              participantCount: storedCount
            });
          } else {
            console.warn('피보험자 데이터가 sessionStorage에 없습니다:', {
              storedParticipants: !!storedParticipants,
              storedInsuredData: !!storedInsuredData
            });
          }
          
          // 보험료 계산 데이터 복원
          const storedPlanInfo = sessionStorage.getItem('planInfo');
          const storedParticipantPremiumsByPlan = sessionStorage.getItem('participantPremiumsByPlan');
          const storedSelectedPlan = sessionStorage.getItem('selectedPlan');
          const storedCalculatedPremiums = sessionStorage.getItem('calculatedPremiums');
          const storedShowPlanSelection = sessionStorage.getItem('showPlanSelection');
          
          if (storedPlanInfo && storedParticipantPremiumsByPlan && storedCalculatedPremiums) {
            setPlanInfo(JSON.parse(storedPlanInfo));
            setParticipantPremiumsByPlan(JSON.parse(storedParticipantPremiumsByPlan));
            if (storedSelectedPlan) {
              setSelectedPlan(storedSelectedPlan as PlanType);
            }
            setCalculatedPremiums(JSON.parse(storedCalculatedPremiums));
            if (storedShowPlanSelection === '1') {
              setShowPlanSelection(true);
            }
            console.log('보험료 계산 데이터 복원:', {
              planInfo: Object.keys(JSON.parse(storedPlanInfo)).length,
              participantPremiumsByPlan: Object.keys(JSON.parse(storedParticipantPremiumsByPlan)).length,
              calculatedPremiums: JSON.parse(storedCalculatedPremiums).participants.length
            });
          }
        } catch (error) {
          console.error('피보험자 데이터 복원 오류:', error);
        }
      } else {
        console.warn('피보험자 데이터가 sessionStorage에 없습니다:', {
          storedHasGroupParticipants,
          hasGroupParticipantsData: !!sessionStorage.getItem('groupParticipantsData'),
          hasGroupInsuredData: !!sessionStorage.getItem('groupInsuredData')
        });
      }
      
      // 피보험자 데이터가 복원되었으면 GroupParticipantInfoStep으로 이동 (법인 회원인 경우)
      // 개인 회원이거나 데이터가 없으면 일반 가입자 정보 입력 화면으로 이동
      if (hasRestoredParticipants) {
        // 법인 회원이거나 비회원 가입신청인 경우 GroupParticipantInfoStep으로 이동
        // (isCorporateMember는 useEffect 이후에 업데이트되므로, 로그인 상태를 확인)
        setShowParticipantForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setShowParticipantForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const shouldRecalculate = sessionStorage.getItem('groupInsuranceReturn') === '1';
    if (!shouldRecalculate) return;

    if (!hasGroupParticipants || groupInsuredData.length === 0) {
      try {
        const storedDetail = localStorage.getItem('premiumDetailData');
        if (storedDetail) {
          const parsed = JSON.parse(storedDetail);
          if (Array.isArray(parsed.insuredData) && parsed.insuredData.length > 0) {
            setGroupInsuredData(parsed.insuredData);
          }
          if (Array.isArray(parsed.participants) && parsed.participants.length > 0) {
            setGroupParticipantsData(parsed.participants);
          }
          if (parsed.participantCount) {
            setGroupParticipantCount(String(parsed.participantCount));
          }
          setHasGroupParticipants(true);
        }
      } catch (error) {
        console.error('프리미엄 상세 데이터 복원 오류:', error);
      }
    }

    if (!hasGroupParticipants || groupInsuredData.length === 0) return;
    if (!departureDate || !arrivalDate) return;
    if (activeTab !== 'DS' && !travelCountry) return;
    const durationValidation = validateDuration();
    if (!durationValidation.valid) return;

    recalculateGroupPremiums().finally(() => {
      sessionStorage.removeItem('groupInsuranceReturn');
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
    });
  }, [hasGroupParticipants, groupInsuredData, departureDate, arrivalDate, activeTab, travelCountry]);

  // 법인 회원 정보 로드
  useEffect(() => {
    const loadCorporateInfo = async () => {
      if (isLoggedIn && member && member.member_type !== '개인') {
        try {
          const result = await getCorporateMemberInfo(member.id);
          if (result.success && result.corporate && result.contacts) {
            setCorporateInfo(result.corporate);
            setCorporateContacts(result.contacts);
          }
        } catch (error) {
          console.error('법인 정보 조회 오류:', error);
        }
      }
    };
    loadCorporateInfo();
  }, [isLoggedIn, member]);

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

  const contractBreakdownText = (() => {
    if (!hasGroupParticipants || groupInsuredData.length === 0) return '';
    const counts = { adult: 0, senior: 0, child: 0 };

    for (const insured of groupInsuredData) {
      const age = calculateAgeFromBirthDate(insured.birthDate);
      if (age === null) continue;
      if (age < 15) {
        counts.child += 1;
      } else if (age <= 70) {
        counts.adult += 1;
      } else {
        counts.senior += 1;
      }
    }

    const parts: string[] = [];
    if (counts.adult > 0) parts.push(`성인 ${counts.adult}명`);
    if (counts.senior > 0) parts.push(`어르신 ${counts.senior}명`);
    if (counts.child > 0) parts.push(`어린이 ${counts.child}명`);

    return parts.length > 0 ? parts.join(', ') : '';
  })();

  // 이메일 전체 주소 가져오기
  const getFullEmail = (participant: Participant): string => {
    if (!participant.email1 || !participant.email2) return '';
    const domain = participant.email2 === '직접입력' ? (participant.customEmail || '') : participant.email2;
    if (!domain) return '';
    return `${participant.email1}@${domain}`;
  };

  // 그룹 정보에서 이메일 전체 주소 가져오기
  const getGroupFullEmail = (info: GroupInfo | null): string => {
    if (!info || !info.email1 || !info.email2) return '';
    const domain = info.email2 === '직접입력' ? (info.customEmail || '') : info.email2;
    if (!domain) return '';
    return `${info.email1}@${domain}`;
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
    // 해외장기체류보험: 최소 3개월 초과(91일 이상), 최대 1년(365일) 이하 (long-term-stay/pc, group-insurance/longstay/popup과 동일)
    if (activeTab === 'FL' && diffDays <= 90) {
      return { valid: false, message: '해외장기체류보험은 3개월 초과시 가능합니다.' };
    }
    if (activeTab === 'FL' && diffDays > 365) {
      return { valid: false, message: '해외장기체류보험은 최대 1년(365일)까지 가능합니다.' };
    }
    
    return { valid: true };
  };

  // 보험료 계산 함수
  const calculatePremiums = async () => {
    if (!planInfo || !selectedPlan) return;

    const age = calculateAgeFromBirthDate(birthDate);
    if (age === null) return;

    const isWorkingHoliday = activeTab === 'FL' && travelPurposeLong === 'N010003';
    const getPlanRequestInfo = (planType: string) => {
      const dbPlanType = planType;
      const requestCurrencyPlan = activeTab !== 'FL'
        ? '원화'
        : (isWorkingHoliday ? (planType === '워킹홀리데이(유로화플랜)' ? '외화' : '원화') : currencyPlan);

      return { dbPlanType, requestCurrencyPlan };
    };

    const genderValue = getGenderFromBirthDate(birthDate, gender);
    let availablePlans: PlanType[] = planInfo ? (Object.keys(planInfo) as PlanType[]) : [];
    if (availablePlans.length === 0) {
      if (isWorkingHoliday) {
        availablePlans = [...WORKING_HOLIDAY_DB_PLANS];
      } else {
        availablePlans = await fetchAvailablePlans(age, genderValue);
      }
    }
    if (availablePlans.length === 0) {
      return;
    }

    setIsCalculating(true);

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const plans: Record<string, PlanInfo> = {};
      const isDomestic = activeTab === 'DS';
      const isLongTermStay = activeTab === 'FL';
      const insuranceType = getInsuranceType();
      const coveragesMap = await fetchPlanCoverages(
        insuranceType,
        availablePlans,
        activeTab === 'FL' && !isWorkingHoliday ? currencyPlan : undefined
      );

      for (const planType of availablePlans) {
        const { dbPlanType, requestCurrencyPlan } = getPlanRequestInfo(planType);

        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: getInsuranceType(),
              age: age,
              birth_date: birthDate,
              gender: genderValue,
              plan_type: dbPlanType,
              plan_variant: 'B',
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: requestCurrencyPlan,
              travel_country: activeTab !== 'DS' ? travelCountry : null,
            }),
          });

          const data = await response.json();
          if (data.success) {
            const fallbackCoverages = isLongTermStay
              ? getLongTermStayCoverages(planType, insuranceType, requestCurrencyPlan)
              : (isDomestic ? getDomesticCoverages(planType) : getOverseasCoverages(planType));
            plans[planType] = {
              type: planType,
              premium: data.premium,
              coverages: coveragesMap[planType] || planInfo?.[planType]?.coverages || fallbackCoverages,
            };
          }
        } catch (error) {
          console.error(`보험료 계산 오류 (${planType}):`, error);
        }
      }

      setPlanInfo(plans);
      if (!plans[selectedPlan]) {
        const nextPlan = Object.keys(plans)[0] as PlanType | undefined;
        if (nextPlan) {
          setSelectedPlan(nextPlan);
        }
      }
    } catch (error) {
      console.error('보험료 재계산 오류:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // 그룹 가입자용 보험료 재계산 함수
  const buildTieredGroupPlans = async (
    departureDateTime: string,
    arrivalDateTime: string
  ) => {
    const isWorkingHoliday = activeTab === 'FL' && travelPurposeLong === 'N010003';
    const getPlanRequestInfo = (planType: string) => {
      const dbPlanType = planType;
      const requestCurrencyPlan = activeTab !== 'FL'
        ? '원화'
        : (isWorkingHoliday ? (planType === '워킹홀리데이(유로화플랜)' ? '외화' : '원화') : currencyPlan);

      return { dbPlanType, requestCurrencyPlan };
    };

    const isDomestic = activeTab === 'DS';
    const isLongTermStay = activeTab === 'FL';
    const insuranceType = getInsuranceType();
    const plans: Record<string, PlanInfo> = {};
    const newParticipantPremiumsByPlan: Record<string, Array<{ id: number; name: string; gender: string; birthDate: string; planType: string; premium: number }>> = {};

    GROUP_PLAN_TIER_LABELS.forEach((label) => {
      newParticipantPremiumsByPlan[label] = [];
    });

    const firstPlanInfoByTier: Record<string, { planType: string; requestCurrencyPlan: '원화' | '외화' }> = {};

    for (let index = 0; index < groupInsuredData.length; index++) {
      const insured = groupInsuredData[index];
      const age = calculateAgeFromBirthDate(insured.birthDate);
      if (age === null) {
        return null;
      }

      const genderValue = insured.gender === 'W' ? '여자' : '남자';
      const availablePlans = isWorkingHoliday
        ? [...WORKING_HOLIDAY_DB_PLANS]
        : await fetchAvailablePlans(age, genderValue);

      if (availablePlans.length === 0) {
        return null;
      }

      const planPremiums: Array<{ planType: string; premium: number; requestCurrencyPlan: '원화' | '외화' }> = [];

      for (const planType of availablePlans) {
        const { dbPlanType, requestCurrencyPlan } = getPlanRequestInfo(planType);
        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: getInsuranceType(),
              age: age,
              birth_date: insured.birthDate,
              gender: genderValue,
              plan_type: dbPlanType,
              plan_variant: 'B',
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: requestCurrencyPlan,
              travel_country: activeTab !== 'DS' ? travelCountry : null,
            }),
          });

          const data = await response.json();
          if (data.success) {
            planPremiums.push({
              planType,
              premium: data.premium,
              requestCurrencyPlan,
            });
          }
        } catch (error) {
          console.error(`보험료 계산 오류 (${insured.name}, ${planType}):`, error);
        }
      }

      if (planPremiums.length === 0) {
        return null;
      }

      planPremiums.sort((a, b) => a.premium - b.premium);

      GROUP_PLAN_TIER_LABELS.forEach((tierLabel, tierIndex) => {
        const selectedPlan = planPremiums[Math.min(tierIndex, planPremiums.length - 1)];
        if (!selectedPlan) return;

        newParticipantPremiumsByPlan[tierLabel].push({
          id: index + 1,
          name: insured.name,
          gender: genderValue,
          birthDate: insured.birthDate,
          planType: selectedPlan.planType,
          premium: selectedPlan.premium,
        });

        if (!firstPlanInfoByTier[tierLabel]) {
          firstPlanInfoByTier[tierLabel] = {
            planType: selectedPlan.planType,
            requestCurrencyPlan: selectedPlan.requestCurrencyPlan,
          };
        }
      });
    }

    const uniquePlanTypes = Object.values(firstPlanInfoByTier).map((info) => info.planType as PlanType);
    const coveragesMap = uniquePlanTypes.length > 0
      ? await fetchPlanCoverages(
          insuranceType,
          uniquePlanTypes,
          activeTab === 'FL' && !isWorkingHoliday ? currencyPlan : undefined
        )
      : {};

    GROUP_PLAN_TIER_LABELS.forEach((tierLabel) => {
      const participants = newParticipantPremiumsByPlan[tierLabel];
      if (participants.length === 0) return;

      const totalPremium = participants.reduce((sum, participant) => sum + participant.premium, 0);
      const planSeed = firstPlanInfoByTier[tierLabel];
      const coverages = planSeed
        ? (coveragesMap[planSeed.planType] || (isLongTermStay
          ? getLongTermStayCoverages(planSeed.planType as PlanType, insuranceType, planSeed.requestCurrencyPlan)
          : (isDomestic ? getDomesticCoverages(planSeed.planType as PlanType) : getOverseasCoverages(planSeed.planType as PlanType))))
        : [];

      plans[tierLabel] = {
        type: tierLabel,
        premium: totalPremium,
        coverages: coverages,
      };
    });

    return { plans, newParticipantPremiumsByPlan };
  };

  const recalculateGroupPremiums = async () => {
    if (!hasGroupParticipants || groupInsuredData.length === 0 || !showPlanSelection) {
      return;
    }

    if (!departureDate || !arrivalDate) {
      return;
    }

    if (activeTab !== 'DS' && !travelCountry) {
      return;
    }

    const durationValidation = validateDuration();
    if (!durationValidation.valid) {
      return;
    }

    setIsCalculating(true);

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const result = await buildTieredGroupPlans(departureDateTime, arrivalDateTime);
      if (!result || Object.keys(result.plans).length === 0) {
        setIsCalculating(false);
        return;
      }

      setPlanInfo(result.plans);
      setParticipantPremiumsByPlan(result.newParticipantPremiumsByPlan);
      const currentPlan = selectedPlan && result.plans[selectedPlan]
        ? selectedPlan
        : (Object.keys(result.plans)[0] as PlanType);
      if (!selectedPlan || !result.plans[selectedPlan]) {
        setSelectedPlan(currentPlan);
      }

      if (result.plans[currentPlan] && result.newParticipantPremiumsByPlan[currentPlan]) {
        const roundedTotalPremium = Math.floor(result.plans[currentPlan].premium / 10) * 10;
        setCalculatedPremiums({
          participants: result.newParticipantPremiumsByPlan[currentPlan],
          totalPremium: roundedTotalPremium,
        });
      }
    } catch (error) {
      console.error('보험료 재계산 오류:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (showPlanSelection && planInfo && selectedPlan) {
      if (hasGroupParticipants && groupInsuredData.length > 0) {
        // 그룹 가입자용 재계산
        recalculateGroupPremiums();
      } else {
        // 개인 가입자용 재계산
        calculatePremiums();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMedicalExpense, currencyPlan]);

  const handleCalculate = async () => {
    // 그룹 가입자 데이터가 있는 경우
    if (hasGroupParticipants && groupParticipantsData.length > 0) {
      // groupInsuredData가 없으면 피보험자 정보를 먼저 입력하도록 안내
      if (groupInsuredData.length === 0) {
        alert('피보험자 정보를 먼저 입력해주세요.');
        return;
      }
      
      // 그룹 가입자용 검증
      if (!departureDate || !arrivalDate) {
        alert('출발일과 도착일을 입력해주세요.');
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

      // 그룹 가입자 데이터가 있으면 바로 플랜 선택 화면으로 이동
      setIsCalculating(true);
      
      try {
        const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
        const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;

        const result = await buildTieredGroupPlans(departureDateTime, arrivalDateTime);
        if (!result || Object.keys(result.plans).length === 0) {
          alert('가입 가능한 플랜이 없습니다.');
          setIsCalculating(false);
          return;
        }

        setPlanInfo(result.plans);
        setParticipantPremiumsByPlan(result.newParticipantPremiumsByPlan);
        const firstPlan = Object.keys(result.plans)[0] as PlanType;
        setSelectedPlan(firstPlan);
        
        if (result.plans[firstPlan] && result.newParticipantPremiumsByPlan[firstPlan]) {
          const roundedTotalPremium = Math.floor(result.plans[firstPlan].premium / 10) * 10;
          const calculatedPremiumsData = {
            participants: result.newParticipantPremiumsByPlan[firstPlan],
            totalPremium: roundedTotalPremium,
          };
          setCalculatedPremiums(calculatedPremiumsData);
          
          sessionStorage.setItem('planInfo', JSON.stringify(result.plans));
          sessionStorage.setItem('participantPremiumsByPlan', JSON.stringify(result.newParticipantPremiumsByPlan));
          sessionStorage.setItem('selectedPlan', firstPlan);
          sessionStorage.setItem('calculatedPremiums', JSON.stringify(calculatedPremiumsData));
          sessionStorage.setItem('showPlanSelection', '1');
        }
        
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
      return;
    }

    // 개인 가입자용 검증 (기존 로직)
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

    // 플랜 결정 (DB plan_type 기준으로 화면 표시)
    const isWorkingHoliday = activeTab === 'FL' && travelPurposeLong === 'N010003';
    let availablePlans: PlanType[] = [];
    if (isWorkingHoliday) {
      availablePlans = [...WORKING_HOLIDAY_DB_PLANS];
    } else {
      const genderValue = getGenderFromBirthDate(birthDate, gender);
      availablePlans = await fetchAvailablePlans(age, genderValue);
    }
    if (availablePlans.length === 0) {
      alert('가입 가능한 플랜이 없습니다.');
      return;
    }

    setIsCalculating(true);

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;
      const genderValue = getGenderFromBirthDate(birthDate, gender);
      const getPlanRequestInfo = (planType: string) => {
        const dbPlanType = planType;
        const requestCurrencyPlan = activeTab !== 'FL'
          ? '원화'
          : (isWorkingHoliday ? (planType === '워킹홀리데이(유로화플랜)' ? '외화' : '원화') : currencyPlan);

        return { dbPlanType, requestCurrencyPlan };
      };

      const isDomestic = activeTab === 'DS';
      const isLongTermStay = activeTab === 'FL';
      const insuranceType = getInsuranceType();

      const plans: Record<string, PlanInfo> = {};

      for (const planType of availablePlans) {
        const { dbPlanType, requestCurrencyPlan } = getPlanRequestInfo(planType);
        try {
          const response = await fetch('/api/travel/calculate-premium', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              insurance_type: getInsuranceType(),
              age: age,
              birth_date: birthDate,
              gender: genderValue,
              plan_type: dbPlanType,
              plan_variant: 'B',
              has_medical_expense: hasMedicalExpense ? 1 : 0,
              departure_date: departureDateTime,
              arrival_date: arrivalDateTime,
              currency_plan: requestCurrencyPlan,
              travel_country: activeTab !== 'DS' ? travelCountry : null,
            }),
          });

          const data = await response.json();

          if (data.success) {
            const coverages = isLongTermStay
              ? getLongTermStayCoverages(planType, insuranceType, requestCurrencyPlan)
              : (isDomestic ? getDomesticCoverages(planType) : getOverseasCoverages(planType));
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

    if (!participants[0].isVerified) {
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
      const isWorkingHoliday = activeTab === 'FL' && travelPurposeLong === 'N010003';
      const getPlanRequestInfo = (planType: string) => {
        const dbPlanType = planType;
        const requestCurrencyPlan = activeTab !== 'FL'
          ? '원화'
          : (isWorkingHoliday ? (planType === '워킹홀리데이(유로화플랜)' ? '외화' : '원화') : currencyPlan);

        return { dbPlanType, requestCurrencyPlan };
      };

      for (const participant of participants) {
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

        const age = calculateAgeFromBirthDate(birthDateForApi);
        if (age === null) {
          alert(`${participant.name}의 생년월일을 올바르게 입력해주세요.`);
          setIsCalculating(false);
          return;
        }

        // 가능 플랜 API로 해당 가입자 허용 플랜 조회 (보험나이 15세 시 만 나이 기준 적용)
        const availablePlans = await fetchAvailablePlans(age, participant.gender, {
          birth_date: birthDateForApi,
          departure_date: departureDateTime,
        });
        if (availablePlans.length === 0) {
          alert(`${participant.name}에 대해 가입 가능한 플랜이 없습니다.`);
          setIsCalculating(false);
          return;
        }
        const planType =
          selectedPlan && availablePlans.includes(selectedPlan) ? selectedPlan : availablePlans[0];
        const { dbPlanType, requestCurrencyPlan } = getPlanRequestInfo(planType);

        const response = await fetch('/api/travel/calculate-premium', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            insurance_type: getInsuranceType(),
            age: age,
            birth_date: birthDateForApi,
            gender: participant.gender,
            plan_type: dbPlanType,
            plan_variant: 'B',
            has_medical_expense: hasMedicalExpense ? 1 : 0,
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            currency_plan: requestCurrencyPlan,
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
          alert('가상계좌 은행을 선택해주세요.');
          return;
        }
        if (!/^\d{3}$/.test(depositBank)) {
          alert('가상계좌 은행코드를 다시 선택해주세요.');
          return;
        }
      } else if (paymentSubMethod === '수기카드') {
        if (!cardNumber1 || !cardNumber2 || !cardNumber3 || !cardNumber4 ||
            !cardExpiryMonth || !cardExpiryYear || !cardholderName || !cardholderResidentNumber) {
          alert('카드 정보를 모두 입력해주세요.');
          return;
        }
      }
    }

    try {
      const departureDateTime = `${departureDate} ${String(departureTime).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalTime).padStart(2, '0')}:00:00`;

      // 기간 계산
      const departure = new Date(departureDateTime);
      const arrival = new Date(arrivalDateTime);
      const diffTime = arrival.getTime() - departure.getTime();
      const periodDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // 가입자 정보 (그룹 또는 개인)
      const currentParticipants = hasGroupParticipants ? groupParticipantsData : participants;
      const currentCalculatedPremiums = calculatedPremiums;

      if (!currentCalculatedPremiums || currentCalculatedPremiums.totalPremium <= 0) {
        alert('보험료 정보가 없습니다.');
        return;
      }

      // 나이스페이먼츠, 네이버페이, 카카오페이는 먼저 계약 등록 후 결제
      if (paymentMethod === '나이스페이먼츠' || paymentMethod === '네이버페이' || paymentMethod === '카카오페이') {
        // 1. 계약 등록 (결제 대기 상태)
        const trackingInfo = getTrackingInfo('모바일');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: getInsuranceType(),
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: activeTab !== 'DS' ? (travelCountry ? '해외' : null) : '전국일원',
            travel_country: activeTab !== 'DS' ? travelCountry : null,
            travel_purpose: travelPurpose || '관광',
            travel_participants: currentParticipants.length,
            total_premium: currentCalculatedPremiums.totalPremium,
            device: '모바일',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: hasGroupParticipants && groupInfo ? {
            // 그룹 보험인 경우 - 회원 타입에 따라 결정
            contractor_type: (isLoggedIn && member && member.member_type !== '개인') ? '법인' : '개인',
            name: groupInfo.contactPerson || '', // 담당자명 → contractors.name
            resident_number: null,
            company_name: groupInfo.groupName || '', // 단체명 → contractors.company_name
            business_number: `${groupInfo.businessNumber1}-${groupInfo.businessNumber2}-${groupInfo.businessNumber3}`, // 사업자번호 → contractors.business_number
            contact_person: groupInfo.contactPerson || '', // 담당자명 → contractors.contact_person
            phone: groupInfo.phone || '', // 휴대폰 번호 → contractors.phone (법인)
            mobile_phone: groupInfo.phone || '', // 휴대폰 번호 → contractors.mobile_phone
            email: getGroupFullEmail(groupInfo), // 이메일 → contractors.email
          } : {
            // 개인 보험인 경우 기존 로직
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: currentParticipants[0]?.name || '',
            resident_number: currentParticipants[0]?.birthDate ? `${currentParticipants[0].birthDate}-${getResidentGenderCode(currentParticipants[0].birthDate, currentParticipants[0].gender)}000000` : '',
            mobile_phone: currentParticipants[0]?.phone || '',
            email: getFullEmail(currentParticipants[0]),
          },
          insured_persons: currentParticipants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const participantPremium = currentCalculatedPremiums.participants.find(cp => cp.id === p.id || cp.name === p.name);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}000000`,
              gender: p.gender,
              age: age || 0,
              plan_type: participantPremium?.planType || selectedPlan || '실속플랜',
              premium: participantPremium?.premium || 0,
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
        const insuranceTypeName = getInsuranceType();

        // 2. 결제 처리
        if (paymentMethod === '나이스페이먼츠') {
          // 결제 정보: 그룹 보험인 경우 그룹 정보 사용, 개인 보험인 경우 개인 정보 사용
          const buyerName = hasGroupParticipants && groupInfo 
            ? groupInfo.contactPerson || '' 
            : currentParticipants[0]?.name || '';
          const buyerEmail = hasGroupParticipants && groupInfo 
            ? getGroupFullEmail(groupInfo) 
            : getFullEmail(currentParticipants[0]);
          const buyerTel = hasGroupParticipants && groupInfo 
            ? groupInfo.phone || '' 
            : currentParticipants[0]?.phone || '';

          const paymentRequest = await requestNicepayPayment({
            contract_id,
            amount: receiptPremium,
            orderId: String(contractData_result.contract_id),
            goodsName: insuranceTypeName,
            buyerName,
            buyerEmail,
            buyerTel,
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
          // 결제 정보: 그룹 보험인 경우 그룹 정보 사용, 개인 보험인 경우 개인 정보 사용
          const customerName = hasGroupParticipants && groupInfo 
            ? groupInfo.contactPerson || '' 
            : currentParticipants[0]?.name || '';
          const customerEmail = hasGroupParticipants && groupInfo 
            ? getGroupFullEmail(groupInfo) 
            : getFullEmail(currentParticipants[0]);
          const customerPhone = hasGroupParticipants && groupInfo 
            ? groupInfo.phone || '' 
            : currentParticipants[0]?.phone || '';

          try {
            await processNaverPayPayment({
              contractId: contract_id,
              amount: receiptPremium,
              productName: insuranceTypeName,
              productCount: currentParticipants.length,
              customerName,
              customerEmail,
              customerPhone,
              checkOutDate: arrivalDate,
            });
          } catch (error) {
            console.error('네이버 페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '네이버 페이 결제 중 오류가 발생했습니다.');
          }
        } else if (paymentMethod === '카카오페이') {
          // 결제 정보: 그룹 보험인 경우 그룹 정보 사용, 개인 보험인 경우 개인 정보 사용
          const customerName = hasGroupParticipants && groupInfo 
            ? groupInfo.contactPerson || '' 
            : currentParticipants[0]?.name || '';
          const customerEmail = hasGroupParticipants && groupInfo 
            ? getGroupFullEmail(groupInfo) 
            : getFullEmail(currentParticipants[0]);
          const customerPhone = hasGroupParticipants && groupInfo 
            ? groupInfo.phone || '' 
            : currentParticipants[0]?.phone || '';

          try {
            await processKakaoPayPayment({
              contractId: contract_id,
              amount: receiptPremium,
              itemName: insuranceTypeName,
              quantity: currentParticipants.length,
              customerName,
              customerEmail,
              customerPhone,
            });
          } catch (error) {
            console.error('카카오페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '카카오페이 결제 중 오류가 발생했습니다.');
          }
        }
      } else if (paymentMethod === '기타결제' && paymentSubMethod === '가상계좌') {
        // 가상계좌: 계약 등록 후 나이스페이 결제창 호출
        const trackingInfo = getTrackingInfo('모바일');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: getInsuranceType(),
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: activeTab !== 'DS' ? (travelCountry ? '해외' : null) : '전국일원',
            travel_country: activeTab !== 'DS' ? travelCountry : null,
            travel_purpose: travelPurpose || '관광',
            travel_participants: currentParticipants.length,
            total_premium: currentCalculatedPremiums.totalPremium,
            device: '모바일',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: hasGroupParticipants && groupInfo ? {
            contractor_type: (isLoggedIn && member && member.member_type !== '개인') ? '법인' : '개인',
            name: groupInfo.contactPerson || '',
            resident_number: null,
            company_name: groupInfo.groupName || '',
            business_number: `${groupInfo.businessNumber1}-${groupInfo.businessNumber2}-${groupInfo.businessNumber3}`,
            contact_person: groupInfo.contactPerson || '',
            phone: groupInfo.phone || '',
            mobile_phone: groupInfo.phone || '',
            email: getGroupFullEmail(groupInfo),
          } : {
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: currentParticipants[0]?.name || '',
            resident_number: currentParticipants[0]?.birthDate ? `${currentParticipants[0].birthDate}-${getResidentGenderCode(currentParticipants[0].birthDate, currentParticipants[0].gender)}000000` : '',
            mobile_phone: currentParticipants[0]?.phone || '',
            email: getFullEmail(currentParticipants[0]),
          },
          insured_persons: currentParticipants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const participantPremium = currentCalculatedPremiums.participants.find(cp => cp.id === p.id || cp.name === p.name);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}000000`,
              gender: p.gender,
              age: age || 0,
              plan_type: participantPremium?.planType || selectedPlan || '실속플랜',
              premium: participantPremium?.premium || 0,
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
        const insuranceTypeName = getInsuranceType();

        const buyerName = hasGroupParticipants && groupInfo 
          ? groupInfo.contactPerson || '' 
          : currentParticipants[0]?.name || '';
        const buyerEmail = hasGroupParticipants && groupInfo 
          ? getGroupFullEmail(groupInfo) 
          : getFullEmail(currentParticipants[0]);
        const buyerTel = hasGroupParticipants && groupInfo 
          ? groupInfo.phone || '' 
          : currentParticipants[0]?.phone || '';

        const paymentRequest = await requestNicepayPayment({
          contract_id,
          amount: receiptPremium,
          orderId: String(contractData_result.contract_id),
          goodsName: insuranceTypeName,
          buyerName,
          buyerEmail,
          buyerTel,
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
            await openNicepayWindow({
              ...paymentRequest,
              method: 'vbank',
              bankCode: depositBank,
              vbankHolder: buyerName,
            });
          } catch (error) {
            console.error('가상계좌 결제창 열기 오류:', error);
            alert(error instanceof Error ? error.message : '가상계좌 결제창을 여는 중 오류가 발생했습니다.');
          }
        } else {
          alert(paymentRequest.message || '가상계좌 결제 요청에 실패했습니다.');
        }
      } else {
        // 기타결제 (무통장입금, 수기카드)는 바로 계약 등록
        const trackingInfo = getTrackingInfo('모바일');
        const contractData = {
          contract: {
            member_id: isLoggedIn && member ? member.id : null,
            insurance_type: getInsuranceType(),
            departure_date: departureDateTime,
            arrival_date: arrivalDateTime,
            duration_months: 0,
            duration_days: periodDays,
            travel_region: activeTab !== 'DS' ? (travelCountry ? '해외' : null) : '전국일원',
            travel_country: activeTab !== 'DS' ? travelCountry : null,
            travel_purpose: travelPurpose || '관광',
            travel_participants: currentParticipants.length,
            total_premium: currentCalculatedPremiums.totalPremium,
            device: '모바일',
            access_path: trackingInfo.access_path,
            affiliate: trackingInfo.affiliate,
          },
          contractor: hasGroupParticipants && groupInfo ? {
            // 그룹 보험인 경우 - 회원 타입에 따라 결정
            contractor_type: (isLoggedIn && member && member.member_type !== '개인') ? '법인' : '개인',
            name: groupInfo.contactPerson || '', // 담당자명 → contractors.name
            resident_number: null,
            company_name: groupInfo.groupName || '', // 단체명 → contractors.company_name
            business_number: `${groupInfo.businessNumber1}-${groupInfo.businessNumber2}-${groupInfo.businessNumber3}`, // 사업자번호 → contractors.business_number
            contact_person: groupInfo.contactPerson || '', // 담당자명 → contractors.contact_person
            phone: groupInfo.phone || '', // 휴대폰 번호 → contractors.phone (법인)
            mobile_phone: groupInfo.phone || '', // 휴대폰 번호 → contractors.mobile_phone
            email: getGroupFullEmail(groupInfo), // 이메일 → contractors.email
          } : {
            // 개인 보험인 경우 기존 로직
            contractor_type: (isLoggedIn && member) ? member.member_type : '개인',
            name: currentParticipants[0]?.name || '',
            resident_number: currentParticipants[0]?.birthDate ? `${currentParticipants[0].birthDate}-${getResidentGenderCode(currentParticipants[0].birthDate, currentParticipants[0].gender)}000000` : '',
            mobile_phone: currentParticipants[0]?.phone || '',
            email: getFullEmail(currentParticipants[0]),
          },
          insured_persons: currentParticipants.map((p, idx) => {
            const age = calculateAgeFromBirthDate(p.birthDate);
            const participantPremium = currentCalculatedPremiums.participants.find(cp => cp.id === p.id || cp.name === p.name);
            const nationalityType = p.nationality === '외국인' ? '외국인' : '내국인';
            return {
              sequence_number: idx + 1,
              name: p.name,
              resident_number: `${p.birthDate}-${getResidentGenderCode(p.birthDate, p.gender)}000000`,
              gender: p.gender,
              age: age || 0,
              plan_type: selectedPlan || '실속플랜',
              premium: participantPremium?.premium || 0,
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
            status: (paymentSubMethod === '무통장입금' || paymentSubMethod === '수기카드' || paymentSubMethod === '가상계좌') ? '대기' : '완료',
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
            approval_date: paymentSubMethod === '수기카드' ? (approvalYear && approvalMonth && approvalDay ? `${approvalYear}-${String(approvalMonth).padStart(2, '0')}-${String(approvalDay).padStart(2, '0')}` : null) : null,
            normal_premium: normalPremium,
            receipt_premium: receiptPremium,
          },
        };

        // 수기카드 데이터 확인용 로그
        if (paymentSubMethod === '수기카드') {
          console.log('수기카드 결제 데이터:', {
            payment_method: paymentMethod,
            payment_sub_method: paymentSubMethod,
            card_type: cardType,
            card_category: cardCategory,
            card_number: `${cardNumber1}-${cardNumber2}-${cardNumber3}-${cardNumber4}`,
            card_expiry_month: cardExpiryMonth,
            card_expiry_year: cardExpiryYear,
            cardholder_name: cardholderName,
            cardholder_resident_number: cardholderResidentNumber,
            normal_premium: normalPremium,
            receipt_premium: receiptPremium,
          });
        }

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

  const getInsuranceCompanyName = () => {
    switch (activeTab) {
      case 'FL':
        return '메리츠화재보험';
      case 'DS':
      case 'FS':
      default:
        return '라이나손해보험';
    }
  };

  const getInsuranceType = () => {
    switch (activeTab) {
      case 'DS':
        return '국내여행보험';
      case 'FS':
        return '해외여행보험';
      case 'FL':
        // 해외장기체류보험은 여행목적에 따라 결정
        switch (travelPurposeLong) {
          case 'N010001':
            return '유학/어학연수';
          case 'N010002':
            return '해외출장/주재원/교환교수';
          case 'N010003':
            return '워킹홀리데이';
          case 'N010003_1':
          case 'N010003_2':
            return '해외출장/주재원/교환교수';
          default:
            return '유학/어학연수';
        }
      default:
        return '국내여행보험';
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
              <span className="tour2023_title09">(법인/단체)</span>
            </p>
            {/* 가입 단계 */}
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
          <MobileGroupTravelInfoStep
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            birthDate={birthDate}
            gender={gender}
            travelCountry={travelCountry}
            travelPurpose={activeTab === 'FL' ? travelPurposeLong : ''}
            participantCount={groupParticipantCount}
            onDepartureDateChange={setDepartureDate}
            onDepartureTimeChange={setDepartureTime}
            onArrivalDateChange={setArrivalDate}
            onArrivalTimeChange={setArrivalTime}
            onBirthDateChange={setBirthDate}
            onGenderChange={setGender}
            onTravelCountryChange={setTravelCountry}
            onTravelPurposeChange={activeTab === 'FL' ? setTravelPurposeLong : () => {}}
            onParticipantCountChange={setGroupParticipantCount}
            hasGroupParticipants={hasGroupParticipants}
            onInputButtonClick={() => {
              const width = 500;
              const height = 700;
              const left = (window.screen.width - width) / 2;
              const top = (window.screen.height - height) / 2;

              if (hasGroupParticipants) {
                const detailParticipants = groupInsuredData.map((insured, index) => ({
                  id: index + 1,
                  name: insured.name,
                  gender: insured.gender === 'W' ? '여자' : '남자',
                  birthDate: insured.birthDate,
                }));
                const detailData = {
                  participants: detailParticipants,
                  insuredData: groupInsuredData,
                  participantCount: groupParticipantCount,
                  tab: activeTab,
                };
                localStorage.setItem('premiumDetailData', JSON.stringify(detailData));

                window.open(
                  '/premium-detail-simple',
                  'premiumDetailSimple',
                  `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                );
                return;
              }
              
              const popup = window.open(
                `/group-insurance/participant-input?tab=${activeTab}`,
                'participantInput',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
              );
              
              // 팝업이 준비되면 기존 데이터 전달
              if (popup && hasGroupParticipants && groupInsuredData.length > 0) {
                const sendData = () => {
                  popup.postMessage({
                    type: 'LOAD_INSURED_DATA',
                    insuredData: groupInsuredData,
                    participantCount: groupParticipantCount,
                  }, window.location.origin);
                };
                
                // 팝업에서 준비 완료 신호를 받으면 데이터 전달
                const handleReady = (event: MessageEvent) => {
                  if (event.origin !== window.location.origin) {
                    return;
                  }
                  
                  if (event.data && event.data.type === 'PARTICIPANT_INPUT_READY') {
                    window.removeEventListener('message', handleReady);
                    setTimeout(sendData, 100); // 약간의 지연을 두어 React가 마운트될 시간을 줌
                  }
                };
                
                window.addEventListener('message', handleReady);
                
                // 최대 5초 대기 후 리스너 제거
                setTimeout(() => {
                  window.removeEventListener('message', handleReady);
                }, 5000);
              }
            }}
            travelCountries={travelCountries}
            frequentCountries={frequentCountries}
            travelPurposeOptions={[
              { value: 'N010001', label: '유학/어학연수' },
              { value: 'N010002', label: '해외출장/주재원/교환교수' },
              { value: 'N010003', label: '워킹홀리데이' },
            ]}
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

          <section className="tourG_pat02" style={{ paddingBottom: '20px' }}>
            <div className={`tourG_box_know ${isNoticeExpanded ? 'is-expanded' : 'is-collapsed'}`}>
              {collapsedNoticeItemsByType[activeTab].map((item, index) => (
                <ul
                  key={`collapsed-${activeTab}-${index}`}
                  className={`tourG_know_s ${index === 0 ? 'tourG_mat08' : ''} tourG_mab09`}
                >
                  <li className="know_dot"></li>
                  <li className="tourG_know_txt">{item}</li>
                </ul>
              ))}
              {isNoticeExpanded && (
                <>
                  <p className="tourG_know_tit">※ 알아두세요</p>
                  {expandedNoticeExtraItemsByType[activeTab].map((item, index) => (
                    <ul
                      key={`expanded-${activeTab}-${index}`}
                      className="tourG_know_s tourG_mab09"
                    >
                      <li className="know_dot"></li>
                      <li className="tourG_know_txt">{item}</li>
                    </ul>
                  ))}
                </>
              )}
              <button
                type="button"
                className="tourG_know_more"
                onClick={() => setIsNoticeExpanded((prev) => !prev)}
              >
                {isNoticeExpanded ? '- 접기' : '+ 더보기'}
              </button>
            </div>
          </section>

          {/* 플랜 선택 영역 */}
          <div ref={planSelectionRef}>
            {showPlanSelection && planInfo && (
              <GroupPlanSelection
                planInfo={planInfo}
                selectedPlan={selectedPlan}
                onPlanSelect={(plan) => {
                  setSelectedPlan(plan);
                  // 플랜 변경 시 calculatedPremiums 업데이트
                  if (planInfo && planInfo[plan] && participantPremiumsByPlan[plan]) {
                    const roundedTotalPremium = Math.floor(planInfo[plan].premium / 10) * 10;
                    setCalculatedPremiums({
                      participants: participantPremiumsByPlan[plan],
                      totalPremium: roundedTotalPremium,
                    });
                  }
                }}
                hasMedicalExpense={hasMedicalExpense}
                onMedicalExpenseChange={setHasMedicalExpense}
                insuranceType={getTitle()}
                contractBreakdownText={contractBreakdownText}
                hideMedicalExpenseOption={true}
                onContractBreakdownClick={(planType) => {
                  if (showPlanSelection && planInfo) {
                    try {
                      localStorage.setItem('group_insurance_m_state', JSON.stringify({
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
                        travelCountry: activeTab !== 'DS' ? travelCountry : undefined,
                        activeTab,
                        groupParticipantCount,
                        groupParticipantsData: hasGroupParticipants ? groupParticipantsData : undefined,
                        groupInsuredData: hasGroupParticipants ? groupInsuredData : undefined,
                        participantPremiumsByPlan,
                        currencyPlan: activeTab === 'FL' ? (travelPurposeLong === 'N010003' ? undefined : (currencyPlan === '원화' ? '원화플랜' : '외화플랜')) : undefined,
                        travelPurposeLong: activeTab === 'FL' ? travelPurposeLong : undefined,
                        calculatedPremiums,
                      }));
                    } catch (error) {
                      console.error('상태 저장 오류:', error);
                    }
                  }

                  const detailParticipants = participantPremiumsByPlan[planType] || [];
                  if (detailParticipants.length === 0) {
                    alert('가입자 정보가 없습니다.');
                    return;
                  }

                  const totalPremium = planInfo?.[planType]?.premium
                    ?? detailParticipants.reduce((sum, participant) => {
                      const premiumValue = typeof participant.premium === 'number' ? participant.premium : Number(participant.premium) || 0;
                      return sum + premiumValue;
                    }, 0);

                  localStorage.setItem('premiumDetailData', JSON.stringify({
                    participants: detailParticipants,
                    totalPremium,
                    hasMedicalExpense,
                  }));

                  const returnUrl = encodeURIComponent('/group-insurance/m');
                  router.push(`/premium-detail?returnUrl=${returnUrl}`);
                }}
                onContractDetailClick={(planType) => {
                  // coverage-detail로 이동하기 전에 현재 상태를 다시 저장 (최신 상태 유지)
                  if (showPlanSelection && planInfo) {
                    try {
                      localStorage.setItem('group_insurance_m_state', JSON.stringify({
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
                        travelCountry: activeTab !== 'DS' ? travelCountry : undefined,
                        activeTab,
                        groupParticipantCount,
                        groupParticipantsData: hasGroupParticipants ? groupParticipantsData : undefined,
                        groupInsuredData: hasGroupParticipants ? groupInsuredData : undefined,
                        participantPremiumsByPlan,
                        currencyPlan: activeTab === 'FL' ? (travelPurposeLong === 'N010003' ? undefined : (currencyPlan === '원화' ? '원화플랜' : '외화플랜')) : undefined,
                        travelPurposeLong: activeTab === 'FL' ? travelPurposeLong : undefined,
                        calculatedPremiums,
                      }));
                    } catch (error) {
                      console.error('상태 저장 오류:', error);
                    }
                  }
                  
                  const returnUrl = encodeURIComponent('/group-insurance/m');
                  // insuranceType은 activeTab에 따라 결정
                  const insuranceType = getTitle();
                  // 단체보험은 실손/비실손 구분이 있음
                  const isMedicalExpenseParam = hasMedicalExpense ? 'true' : 'false';
                  router.push(`/coverage-detail/m?planType=${planType}&insuranceType=${encodeURIComponent(insuranceType)}&isMedicalExpense=${isMedicalExpenseParam}&returnUrl=${returnUrl}`);
                }}
                travelCountry={activeTab !== 'DS' ? travelCountry : undefined}
                travelPurpose={activeTab === 'FL' ? getInsuranceType() : undefined}
              />
            )}
          </div>

        </div>
      )}

      {/* STEP 2: 가입자 정보 입력 화면 - 그룹 보험용 (법인/개인 모두) */}
      {showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <GroupParticipantInfoStep
          insuranceType={getTitle()}
          member={isLoggedIn && member ? member : null}
          corporateInfo={corporateInfo}
          contacts={corporateContacts}
          onApply={(info: GroupInfo) => {
            // 그룹 정보 저장
            setGroupInfo(info);
            setShowParticipantForm(false);
            setShowStep2_1(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* STEP 2: 가입자 정보 입력 화면 - 개인 가입용 (사용 안 함) */}
      {false && showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && !isCorporateMember && (
        <div className="prow_01">
          <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
            {/* <p className="tour2023_title01">{getTitle()}</p> */}
            <p className="tour2023_title01"></p>
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


      {/* STEP 2-1: 위험활동 확인 및 여행목적 선택 화면 */}
      {showStep2_1 && !showStep3 && !showCompletionScreen && (
        <div className="prow_01">
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
        </div>
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

      {/* Excel 업로드 모달 */}
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

      {/* STEP 3: 계약정보 및 결제 화면 */}
      {showStep3 && !showCompletionScreen && (
        <>
          {/* 상단 타이틀 가입단계 */}
          <div className="prow_01">
            <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
              <p className="tour2023_title01">단체여행자보험</p>
              {/* 가입 단계 */}
              <MobileStepIndicator currentStep={getCurrentStep()} />
            </div>
          </div>
          
          {(() => {
            // ContractInfoStep 렌더링 전 상태 확인
            console.log('ContractInfoStep 렌더링 전 전체 상태:', {
              hasGroupParticipants,
              groupParticipantsDataLength: groupParticipantsData.length,
              groupInsuredDataLength: groupInsuredData.length,
              hasGroupInfo: !!groupInfo,
              participantsLength: participants.length,
              calculatedPremiums: calculatedPremiums ? {
                participantsCount: calculatedPremiums.participants.length,
                totalPremium: calculatedPremiums.totalPremium
              } : null,
              isCorporateMember,
              isLoggedIn
            });
            return null;
          })()}
          
          <ContractInfoStep
            insuranceType={getTitle()}
            insuranceCompany={getInsuranceCompanyName()}
            departureDate={departureDate}
            departureTime={departureTime}
            arrivalDate={arrivalDate}
            arrivalTime={arrivalTime}
            travelPurpose={travelPurpose}
            travelCountry={travelCountry}
            participants={(() => {
              console.log('ContractInfoStep - participants 결정 전 상태:', {
                hasGroupParticipants,
                groupParticipantsDataLength: groupParticipantsData.length,
                groupInsuredDataLength: groupInsuredData.length,
                hasGroupInfo: !!groupInfo,
                participantsLength: participants.length,
                isCorporateMember,
                isLoggedIn
              });
              
              // 피보험자 데이터가 있으면 우선 사용 (개인/법인 모두)
              if (hasGroupParticipants && groupParticipantsData.length > 0) {
                console.log('ContractInfoStep - 피보험자 데이터 사용:', {
                  hasGroupParticipants,
                  groupParticipantsDataLength: groupParticipantsData.length,
                  data: groupParticipantsData
                });
                return groupParticipantsData;
              }
              
              // groupInfo가 있고 피보험자 데이터가 없는 경우 (개인/법인 회원이 GroupParticipantInfoStep만 입력한 경우)
              if (groupInfo) {
                console.log('ContractInfoStep - groupInfo 사용:', {
                  contactPerson: groupInfo.contactPerson,
                  phone: groupInfo.phone,
                  email1: groupInfo.email1,
                  email2: groupInfo.email2,
                  groupParticipantsDataLength: groupParticipantsData.length
                });
                return [{
                  id: 1,
                  name: groupInfo.contactPerson || '',
                  nationality: '내국인',
                  birthDate: '',
                  gender: '남자',
                  email1: groupInfo.email1 || '',
                  email2: groupInfo.email2 || '',
                  customEmail: groupInfo.customEmail || '',
                  phone: groupInfo.phone || '',
                  isVerified: groupInfo.isVerified || false,
                }];
              }
              
              // 기본 participants 사용
              console.log('ContractInfoStep - 기본 participants 사용:', {
                participantsLength: participants.length,
                data: participants
              });
              return participants;
            })()}
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
            companyName={
              (hasGroupParticipants || (isCorporateMember && groupInfo)) 
                ? (groupInfo?.groupName || corporateInfo?.company_name) 
                : undefined
            }
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
          participantName={hasGroupParticipants 
            ? (groupParticipantsData[0]?.name || '') 
            : (participants[0]?.name || '')}
          onViewDetails={() => {
            router.push('/contracts');
          }}
          onGoHome={() => {
            router.push('/');
          }}
        />
      )}

      {/* 심의번호 */}
      <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
        <span className="tour2023_txt02 tour2023_grey">
          <span style={{ whiteSpace: 'nowrap' }}>
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
          </span>
          <br />
          준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
        </span>
      </div>

      <Footer isMobile={true} />

      {/* 가입하기 버튼 - 푸터 아래에 배치 */}
      {showPlanSelection && planInfo && selectedPlan !== null && !showParticipantForm && !showStep2_1 && !showStep3 && !showCompletionScreen && (
        <section className="join-button-section">
          <div className="tour2023_bottom_btn">
            <a
              href="javascript:void(0);"
              onClick={(e) => {
                e.preventDefault();
                if (isLoggedIn) {
                  setShowParticipantForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  return;
                }

                sessionStorage.setItem('groupInsuranceDraft', JSON.stringify({
                  activeTab,
                  departureDate,
                  departureTime,
                  arrivalDate,
                  arrivalTime,
                  travelCountry,
                  travelPurpose,
                  travelPurposeLong,
                  birthDate,
                  gender,
                  groupParticipantCount,
                }));
                
                // 피보험자 데이터가 있으면 sessionStorage에 저장 (로그인 후 복원을 위해)
                console.log('가입하기 버튼 클릭 - 데이터 저장 시도:', {
                  hasGroupParticipants,
                  groupParticipantsDataLength: groupParticipantsData.length,
                  groupInsuredDataLength: groupInsuredData.length,
                  groupParticipantCount,
                  hasPlanInfo: !!planInfo,
                  hasCalculatedPremiums: !!calculatedPremiums
                });
                
                if (hasGroupParticipants && groupParticipantsData.length > 0 && groupInsuredData.length > 0) {
                  sessionStorage.setItem('groupParticipantsData', JSON.stringify(groupParticipantsData));
                  sessionStorage.setItem('groupParticipantCount', String(groupParticipantCount));
                  sessionStorage.setItem('groupInsuredData', JSON.stringify(groupInsuredData));
                  sessionStorage.setItem('hasGroupParticipants', '1');
                  
                  // 보험료 계산 데이터도 저장
                  if (planInfo) {
                    sessionStorage.setItem('planInfo', JSON.stringify(planInfo));
                  }
                  if (Object.keys(participantPremiumsByPlan).length > 0) {
                    sessionStorage.setItem('participantPremiumsByPlan', JSON.stringify(participantPremiumsByPlan));
                  }
                  if (selectedPlan) {
                    sessionStorage.setItem('selectedPlan', selectedPlan);
                  }
                  if (calculatedPremiums) {
                    sessionStorage.setItem('calculatedPremiums', JSON.stringify(calculatedPremiums));
                  }
                  if (showPlanSelection) {
                    sessionStorage.setItem('showPlanSelection', '1');
                  }
                  
                  console.log('피보험자 데이터 저장 완료:', {
                    participantsCount: groupParticipantsData.length,
                    insuredDataCount: groupInsuredData.length,
                    participantCount: groupParticipantCount
                  });
                } else {
                  console.warn('피보험자 데이터가 없어서 저장하지 않음:', {
                    hasGroupParticipants,
                    groupParticipantsDataLength: groupParticipantsData.length,
                    groupInsuredDataLength: groupInsuredData.length
                  });
                }
                
                window.location.href = '/group-insurance/login';
              }}
              className="tour2023_btn_b tour2023_btn_join"
            >
              가입하기
            </a>
          </div>
        </section>
      )}
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
