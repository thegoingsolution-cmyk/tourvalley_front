'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
import { getTrackingInfo } from '@/utils/tracking';
import { requestNicepayPayment, openNicepayWindow, processNaverPayPayment, processKakaoPayPayment } from '@/services/paymentService';
import { isDepartureAtLeastTwoHoursFromNow } from '@/utils/dateTime';
import '../../popup/page.css';

export default function DomesticInsuranceStep5Page() {
  const { member, isLoggedIn, isLoading } = useAuth();
  const [corporateName, setCorporateName] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState('C');
  const [allAgree, setAllAgree] = useState(false);
  const [step1Data, setStep1Data] = useState<any>(null);
  const [step2Data, setStep2Data] = useState<any>(null);
  const [step3Data, setStep3Data] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [insuredList, setInsuredList] = useState<any[]>([]);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentSubMethod, setPaymentSubMethod] = useState('');
  const [paymentContractId, setPaymentContractId] = useState('');
  const [paymentContractNumber, setPaymentContractNumber] = useState('');
  /** PG 결제 후 step5로 리다이렉트될 때만 true (무통장·수기 등은 false → DB와 같이 미결제) */
  const [paymentSettledByPgRedirect, setPaymentSettledByPgRedirect] = useState(false);
  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [virtualBankCode, setVirtualBankCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 수기카드 관련 state
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
  
  // 현재 날짜 정보
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentDay = String(today.getDate()).padStart(2, '0');

  // 무통장입금 입금예정일 (즉시 검증용 controlled state)
  const [expectedYearSelect, setExpectedYearSelect] = useState<string>(String(currentYear));
  const [expectedMonthSelect, setExpectedMonthSelect] = useState<string>(currentMonth);
  const [expectedDaySelect, setExpectedDaySelect] = useState<string>(currentDay);
  
  // 년도 옵션 생성 (현재 년도 + 5년)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const totalPremium = step3Data?.total_premium || 0;
  const isVirtualAccountAvailable = totalPremium >= 10000;
  const getPlanType = (planCode: string): string => {
    const map: Record<string, string> = {
      BAW: '실속플랜',
      HCW: '표준플랜',
      CHW: '어린이플랜',
      OLW: '어르신플랜1(실속)',
      O2W: '어르신플랜1(실속)',
    };
    return map[planCode] || planCode || '실속플랜';
  };
  const getPlanDisplayName = (planCode: string) => getPlanType(planCode);

  // 입금예정일 즉시 검증: 오늘 이전 불가, 보험 시작일(출발일) 당일·이후 불가
  const validateExpectedDepositDate = (year: number, month: number, day: number): boolean => {
    if (!year || !month || !day) return true;

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    if (
      year < todayYear ||
      (year === todayYear && month < todayMonth) ||
      (year === todayYear && month === todayMonth && day < todayDay)
    ) {
      const formattedToday = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      alert(`입금예정일은 오늘(${formattedToday}) 이후로 설정해야 합니다.`);
      return false;
    }

    // 보험 시작일(출발일) "날짜+시간" 기준으로 검증
    // - 시작 시간이 0시(00)면: 입금예정일은 전날까지만 허용
    // - 시작 시간이 0시가 아니면: 같은 날짜도 허용 (당일 입금 가능)
    // - 시작 시간이 24시면 다음날 00시로 간주
    const startDateStr = (step1Data?.startDate || '').replace(/\./g, '-');
    const rawStartHour = step1Data?.startHour;
    const startHourNum = typeof rawStartHour === 'string' || typeof rawStartHour === 'number' ? parseInt(String(rawStartHour), 10) : 0;
    if (startDateStr && /^\d{4}-\d{2}-\d{2}$/.test(startDateStr.trim())) {
      const base = new Date(`${startDateStr.trim()}T00:00:00`);
      if (!Number.isNaN(base.getTime())) {
        const effectiveStart = new Date(base);
        let effectiveStartHour = Number.isFinite(startHourNum) ? startHourNum : 0;
        if (effectiveStartHour === 24) {
          effectiveStart.setDate(effectiveStart.getDate() + 1);
          effectiveStartHour = 0;
        }

        const startY = effectiveStart.getFullYear();
        const startM = effectiveStart.getMonth() + 1;
        const startD = effectiveStart.getDate();

        const isAfterStartDate =
          year > startY ||
          (year === startY && month > startM) ||
          (year === startY && month === startM && day > startD);
        const isSameStartDate = year === startY && month === startM && day === startD;
        const isNotAllowedSameDay = isSameStartDate && effectiveStartHour === 0;

        if (isAfterStartDate || isNotAllowedSameDay) {
          const formattedStart = `${startY}-${String(startM).padStart(2, '0')}-${String(startD).padStart(2, '0')}`;
          alert(`입금예정일은 보험 시작일(${formattedStart}) 전으로만 설정 가능합니다.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleExpectedDepositSelectChange = (nextYear: string, nextMonth: string, nextDay: string) => {
    const y = parseInt(nextYear, 10);
    const m = parseInt(nextMonth, 10);
    const d = parseInt(nextDay, 10);
    if (!validateExpectedDepositDate(y, m, d)) {
      return;
    }
    setExpectedYearSelect(nextYear);
    setExpectedMonthSelect(nextMonth);
    setExpectedDaySelect(nextDay);
  };

  useEffect(() => {
    if (isLoggedIn && member?.member_type === '법인') {
      getCorporateMemberInfo(member.id)
        .then((result) => {
          if (result.success && result.corporate) setCorporateName(result.corporate.company_name);
        })
        .catch(() => setCorporateName(null));
    } else {
      setCorporateName(null);
    }
  }, [isLoggedIn, member]);

  useEffect(() => {
    // 결제 완료 후 리다이렉트 확인
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('paymentSuccess');
    const paymentMethodParam = urlParams.get('paymentMethod');
    const contractIdParam = urlParams.get('contractId');
    const contractNumberParam = urlParams.get('contractNumber');

    // Load data from localStorage
    const step1 = localStorage.getItem('domesticInsuranceStep1');
    const step2 = localStorage.getItem('domesticInsuranceStep2');
    const step3 = localStorage.getItem('domesticInsuranceStep3');

    if (step1) {
      const data1 = JSON.parse(step1);
      setStep1Data(data1);

      if (step2 && step3) {
        const data2 = JSON.parse(step2);
        const data3 = JSON.parse(step3);
        setStep2Data(data2);
        setStep3Data(data3);

        // 피보험자 목록 구성
        const insuredPersons = [];
        for (let i = 1; i <= data1.tourNum; i++) {
          const name = data2[`insured_name_${i}`] || `피보험자${i}`;
          const planCode = data3.selected_plans?.[i] || 'BAW';
          const planName = getPlanDisplayName(planCode);
          const premium = data3.premiums?.[i] || 0;

          insuredPersons.push({
            index: i,
            name,
            planCode,
            planName,
            premium,
          });
        }
        setInsuredList(insuredPersons);
      }
    }

    const loadFallbackContractData = async (contractId: string) => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        if (!member?.id) return;
        const [contractResponse, companionsResponse] = await Promise.all([
          fetch(
            `${apiBase}/api/contracts/detail/${contractId}?member_id=${encodeURIComponent(
              String(member.id)
            )}`,
            { credentials: 'include' }
          ),
          fetch(`${apiBase}/api/travel/group/contract/${contractId}/companions`),
        ]);

        if (contractResponse.ok) {
          const contractResult = await contractResponse.json();
          if (contractResult?.success && contractResult.contract) {
            const contract = contractResult.contract;
            const parseDateTime = (value?: string | null) => {
              if (!value) return { date: '', hour: '' };
              const date = new Date(value);
              if (isNaN(date.getTime())) return { date: '', hour: '' };
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hour = String(date.getHours()).padStart(2, '0');
              return { date: `${year}-${month}-${day}`, hour };
            };

            const departure = parseDateTime(contract.departureDate);
            const arrival = parseDateTime(contract.arrivalDate);

            setStep1Data({
              tourNum: contract.travelParticipants || 0,
              startDate: departure.date,
              startHour: departure.hour,
              endDate: arrival.date,
              endHour: arrival.hour,
            });
            setStep2Data({
              contractor_name: contract.contractorCompanyName || contract.memberName || '',
            });
            setStep3Data({
              total_premium: Number(contract.totalPremium || 0),
            });
            if (contract.paymentMethod) setPaymentMethod(contract.paymentMethod);
            if (contract.paymentSubMethod) setPaymentSubMethod(contract.paymentSubMethod);
            if (contract.bankName || contract.bank_name) setAccountBank(contract.bankName || contract.bank_name);
            if (contract.accountNumber || contract.account_number) setAccountNumber(contract.accountNumber || contract.account_number);
            if (contract.paymentStatus) {
              setPaymentSettledByPgRedirect(contract.paymentStatus === '결제완료');
            }
          }
        }

        if (companionsResponse.ok) {
          const companionsResult = await companionsResponse.json();
          const companions = companionsResult?.companions || [];
          if (companions.length) {
            setInsuredList(
              companions.map((companion: any, index: number) => ({
                index: companion.sequence_number || index + 1,
                name: companion.name || `피보험자${index + 1}`,
                planName: companion.plan_type || '-',
                premium: companion.premium || 0,
              }))
            );
          }
        }
      } catch (error) {
        console.error('계약 정보 조회 실패:', error);
      }
    };

    // 결제 완료 후 리다이렉트인 경우 상태 설정
    if (paymentSuccess === 'true') {
      setPaymentSettledByPgRedirect(true);
      // 결제 완료 상태로 설정
      setPaymentCompleted(true);
      if (paymentMethodParam) {
        setPaymentMethod(paymentMethodParam);
      }
      if (contractIdParam) {
        setPaymentContractId(contractIdParam);
      }
      if (contractNumberParam) {
        setPaymentContractNumber(contractNumberParam);
      }
      if (contractIdParam) {
        loadFallbackContractData(contractIdParam);
      }
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!isVirtualAccountAvailable && payMethod === 'V') {
      setPayMethod('C');
    }
  }, [isVirtualAccountAvailable, payMethod]);

  const handleBack = () => {
    window.location.href = '/group-insurance/domestic/step4';
  };

  const handlePayMethodChange = (method: string) => {
    setPayMethod(method);
  };

  const buildPremiumDetailData = () => {
    if (!step1Data || !step2Data || !step3Data) {
      return null;
    }

    const count = step1Data.tourNum || insuredList.length || 0;
    const participants = [];
    for (let i = 1; i <= count; i++) {
      const name = step2Data[`insured_name_${i}`] || `피보험자${i}`;
      const birthDate = step2Data[`insured_birth_${i}`] || '';
      const gender = step2Data[`insured_gender_${i}`] || '남자';
      const planCode = step3Data.selected_plans?.[i] || 'BAW';
      const premium = step3Data.premiums?.[i] || 0;

      participants.push({
        id: i,
        name,
        gender,
        birthDate,
        planType: getPlanDisplayName(planCode),
        premium,
      });
    }

    return {
      participants,
      totalPremium: step3Data?.total_premium || 0,
      hasMedicalExpense: true,
    };
  };

  /** 결제 완료 후에만 노출되는 인쇄용 확인서 (미결제 상태로 인쇄하면 고객 혼란 방지) */
  const openB2cConfirmationPrintAfterPayment = () => {
    if (!step1Data || !step2Data || !step3Data) {
      alert('계약 정보를 불러올 수 없습니다.');
      return;
    }
    const detailData = buildPremiumDetailData();
    if (!detailData) {
      alert('계약 정보를 불러올 수 없습니다.');
      return;
    }
    const { participants } = detailData;
    const departureDate = (step1Data.startDate || '').replace(/\./g, '-');
    const arrivalDate = (step1Data.endDate || '').replace(/\./g, '-');
    const contractIdNum = paymentContractId ? parseInt(paymentContractId, 10) : NaN;
    const draft = {
      detail: {
        id: Number.isFinite(contractIdNum) ? contractIdNum : 0,
        insuranceType: '국내여행자보험',
        departureDate: departureDate || new Date().toISOString().slice(0, 10),
        arrivalDate: arrivalDate || new Date().toISOString().slice(0, 10),
        travelCountry: null,
        travelRegion: '국내일원',
        travelParticipants: step1Data.tourNum || participants.length,
        totalPremium: step3Data?.total_premium ?? 0,
        createdAt: new Date().toISOString(),
        contractorType: '법인',
        contractorCompanyName: step2Data.contractor_name || null,
        memberName: step2Data.contractor_name ?? '',
        memberBirthDate: '',
        memberPhone: step2Data.contractor_phone ?? '',
        memberEmail: step2Data.contractor_email ?? '',
        paymentMethod: paymentMethod || null,
        paymentSubMethod: paymentSubMethod || ((accountBank || accountNumber) ? '가상계좌' : null),
        bankName: accountBank || null,
        accountNumber: accountNumber || null,
        paymentStatus: paymentSettledByPgRedirect ? '결제완료' : '미결제',
        status: '가입신청',
        businessNumber: step2Data.contractor_business_number ?? null,
      },
      participants: participants.map((p, i: number) => ({
        id: p.id ?? i + 1,
        name: p.name,
        gender: p.gender ?? '',
        birthDate: p.birthDate ?? '',
        planType: p.planType ?? '',
        premium: p.premium ?? 0,
      })),
    };
    try {
      sessionStorage.setItem('b2c_confirmation_draft', JSON.stringify(draft));
      window.open('/confirmation?draft=1', '_blank');
    } catch {
      alert('인쇄 화면을 열 수 없습니다.');
    }
  };

  const handlePayment = async () => {
    if (!allAgree) {
      alert('여행자보험 계약정보를 확인하고 체크해주세요.');
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      if (!step1Data?.startDate || step1Data?.startHour == null || String(step1Data.startHour).trim() === '') {
        alert('보험 기간 정보가 없습니다. 처음부터 다시 진행해 주세요.');
        setIsProcessing(false);
        return;
      }

      if (!isDepartureAtLeastTwoHoursFromNow(step1Data.startDate, String(step1Data.startHour))) {
        alert('출발시간은 가입시점 2시간 뒤부터 설정 가능합니다');
        setIsProcessing(false);
        return;
      }

      // 결제 방법 검증
      if (payMethod === 'W') {
        // 수기카드 검증
        if (!cardCategory) {
          alert('카드종류를 선택해주세요.');
          setIsProcessing(false);
          return;
        }
        if (!cardNumber1 || !cardNumber2 || !cardNumber3 || !cardNumber4) {
          alert('카드번호를 모두 입력해주세요.');
          setIsProcessing(false);
          return;
        }
        if (!cardExpiryMonth || !cardExpiryYear) {
          alert('유효기간을 선택해주세요.');
          setIsProcessing(false);
          return;
        }
        if (!cardholderName) {
          alert('카드소유자명을 입력해주세요.');
          setIsProcessing(false);
          return;
        }
        // 생년월일 6자리 또는 사업자번호(10자리) 또는 13자리 허용
        if (!cardholderResidentNumber) {
          alert('소유자 생년월일 또는 사업자번호를 입력해주세요.');
          setIsProcessing(false);
          return;
        }
        const residentNumberWithoutHyphen = cardholderResidentNumber.replace(/-/g, '');
        if (residentNumberWithoutHyphen.length !== 6 && residentNumberWithoutHyphen.length !== 10 && residentNumberWithoutHyphen.length !== 13) {
          alert('소유자 생년월일 6자리 또는 사업자번호(10자리) 또는 13자리를 입력해주세요.');
          setIsProcessing(false);
          return;
        }
      } else if (payMethod === 'V' && !isVirtualAccountAvailable) {
        alert('가상계좌는 보험료가 1만원 이상일 때만 이용할 수 있습니다.');
        setIsProcessing(false);
        return;
      } else if (payMethod === 'V') {
        if (!virtualBankCode) {
          alert('가상계좌 은행을 선택해주세요.');
          setIsProcessing(false);
          return;
        }
        if (!/^\d{3}$/.test(virtualBankCode)) {
          alert('가상계좌 은행코드를 다시 선택해주세요.');
          setIsProcessing(false);
          return;
        }
      } else if (payMethod === 'B') {
        // 무통장입금 검증
        const accountB = (document.querySelector('input[name="accountB"]:checked') as HTMLInputElement)?.value;
        const paymentName = (document.querySelector('input[name="payment_name"]') as HTMLInputElement)?.value;
        const expectedYear = (document.querySelector('select[name="expected_year"]') as HTMLSelectElement)?.value;
        const expectedMonth = (document.querySelector('select[name="expected_month"]') as HTMLSelectElement)?.value;
        const expectedDay = (document.querySelector('select[name="expected_day"]') as HTMLSelectElement)?.value;

        if (!paymentName || !expectedYear || !expectedMonth || !expectedDay) {
          alert('입금예정자명과 입금예정일을 입력해주세요.');
          setIsProcessing(false);
          return;
        }

        // 입금예정일이 오늘 이전인지 검증 (오늘 이후로만 설정 가능)
        const now = new Date();
        const todayYear = now.getFullYear();
        const todayMonth = now.getMonth() + 1;
        const todayDay = now.getDate();

        const expectedYearNum = parseInt(expectedYear);
        const expectedMonthNum = parseInt(expectedMonth);
        const expectedDayNum = parseInt(expectedDay);

        // 입금예정일 검증 (오늘 이전 불가 + 보험 시작일(출발일) 날짜/시간 기준)
        if (!validateExpectedDepositDate(expectedYearNum, expectedMonthNum, expectedDayNum)) {
          setIsProcessing(false);
          return;
        }
      }

      // 날짜/시간 계산
      // 24시는 다음날 00시로 변환
      let departureDate = step1Data.startDate;
      let departureHour = parseInt(step1Data.startHour);
      if (departureHour === 24) {
        // 다음날로 변경
        const date = new Date(step1Data.startDate);
        date.setDate(date.getDate() + 1);
        departureDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        departureHour = 0;
      }
      
      let arrivalDate = step1Data.endDate;
      let arrivalHour = parseInt(step1Data.endHour);
      if (arrivalHour === 24) {
        // 다음날로 변경
        const date = new Date(step1Data.endDate);
        date.setDate(date.getDate() + 1);
        arrivalDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        arrivalHour = 0;
      }
      
      const departureDateTime = `${departureDate} ${String(departureHour).padStart(2, '0')}:00:00`;
      const arrivalDateTime = `${arrivalDate} ${String(arrivalHour).padStart(2, '0')}:00:00`;
      const periodDays = Math.ceil((new Date(`${arrivalDate}T${String(arrivalHour).padStart(2, '0')}:00:00`).getTime() - new Date(`${departureDate}T${String(departureHour).padStart(2, '0')}:00:00`).getTime()) / (1000 * 60 * 60 * 24));

      // 피보험자 정보 구성
      const insuredPersons = [];
      for (let i = 1; i <= step1Data.tourNum; i++) {
        const name = step2Data[`insured_name_${i}`] || '';
        const birthDate = step2Data[`insured_birth_${i}`] || '';
        const gender = step2Data[`insured_gender_${i}`] || '남자';
        const planCode = step3Data.selected_plans?.[i] || 'BAW';
        const premium = step3Data.premiums?.[i] || 0;
        const countryType = step2Data[`insured_country_type_${i}`] || 'D'; // 'D' = 내국인, 'F' = 외국인
        const nationalityType = countryType === 'F' ? '외국인' : '내국인';

        // 생년월일에서 나이 계산
        let age = 0;
        let genderCode = '1'; // 기본값
        
        // 외국인일 경우 외국인등록번호에서 생년월일 추출
        let actualBirthDate = birthDate;
        if (countryType === 'F') {
          const ssn1 = step2Data[`insured_ssn1_${i}`] || '';
          // 외국인등록번호 앞 6자리가 생년월일 (YYMMDD)
          if (ssn1 && ssn1.length >= 6) {
            const yy = parseInt(ssn1.substring(0, 2));
            const mm = ssn1.substring(2, 4);
            const dd = ssn1.substring(4, 6);
            // 1900년대 또는 2000년대 판단 (일반적으로 50 이상이면 1900년대, 미만이면 2000년대)
            const year = yy >= 50 ? 1900 + yy : 2000 + yy;
            actualBirthDate = `${year}${mm}${dd}`;
          }
        }
        
        if (actualBirthDate && actualBirthDate.length >= 8) {
          const year = parseInt(actualBirthDate.substring(0, 4));
          const month = parseInt(actualBirthDate.substring(4, 6));
          const day = parseInt(actualBirthDate.substring(6, 8));
          const today = new Date();
          age = today.getFullYear() - year;
          if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
            age--;
          }
          
          // 생년에 따라 성별코드 결정 (주민번호 성별코드)
          // 1900년대생: 남자='1', 여자='2'
          // 2000년대생: 남자='3', 여자='4'
          if (year >= 2000) {
            genderCode = gender === '남자' ? '3' : '4';
          } else {
            genderCode = gender === '남자' ? '1' : '2';
          }
        }

        // 외국인일 경우 외국인등록번호 가져오기
        let residentNumber = '';
        if (countryType === 'F') {
          const ssn1 = step2Data[`insured_ssn1_${i}`] || '';
          const ssn2 = step2Data[`insured_ssn2_${i}`] || '';
          if (ssn1 && ssn2 && ssn1.length === 6 && ssn2.length === 7) {
            // 외국인등록번호: 앞 6자리(YYMMDD)를 YYYYMMDD로 변환하고 하이픈 포함
            const yy = parseInt(ssn1.substring(0, 2));
            const mm = ssn1.substring(2, 4);
            const dd = ssn1.substring(4, 6);
            const year = yy >= 50 ? 1900 + yy : 2000 + yy;
            residentNumber = `${year}${mm}${dd}-${ssn2}`;
          } else {
            residentNumber = ssn1 && ssn2 ? `${ssn1}${ssn2}` : '';
          }
        } else {
          residentNumber = birthDate ? `${birthDate}-${genderCode}000000` : '';
        }

        insuredPersons.push({
          sequence_number: i,
          name: name,
          resident_number: residentNumber,
          gender: gender,
          age: age,
          plan_type: getPlanType(planCode),
          plan_variant: 'B',
          premium: premium,
          has_medical_expense: 1,
          nationality_type: nationalityType,
          nationality_continent: null,
          nationality_country: null,
        });
      }

      // 결제 방법 매핑
      const paymentMethodMap: { [key: string]: string } = {
        'C': '나이스페이먼츠',
        'N': '네이버페이',
        'K': '카카오페이',
        'W': '수기카드',
        'B': '무통장입금',
        'V': '가상계좌'
      };
      const paymentMethodName = paymentMethodMap[payMethod] || '나이스페이먼츠';

      // 계약 데이터 구성
      const trackingInfo = getTrackingInfo('PC');
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
          travel_purpose: step2Data.travel_purpose || '',
          travel_participants: step1Data.tourNum,
          total_premium: step3Data?.total_premium || 0,
          device: 'PC',
          access_path: trackingInfo.access_path,
          affiliate: trackingInfo.affiliate,
        },
        contractor: {
          contractor_type: '법인',
          company_name: step2Data.contractor_name || '',
          business_number: step2Data.contractor_business_number || '',
          contact_person: step2Data.contractor_contact_person || '',
          position: step2Data.contractor_position || '',
          phone: step2Data.contractor_phone || '',
          mobile_phone: step2Data.contractor_mobile_phone || '',
          email: step2Data.contractor_email || '',
        },
        insured_persons: insuredPersons,
        companions: [],
        payment: {
          payment_method: paymentMethodName,
          payment_sub_method: payMethod === 'W' ? '수기카드' : (payMethod === 'B' ? '무통장입금' : (payMethod === 'V' ? '가상계좌' : null)),
          amount: step3Data?.total_premium || 0,
          status: (payMethod === 'C' || payMethod === 'N' || payMethod === 'K' || payMethod === 'W' || payMethod === 'B' || payMethod === 'V') ? '대기' : '완료',
          depositor_name: payMethod === 'B' ? (document.querySelector('input[name="payment_name"]') as HTMLInputElement)?.value : null,
          bank_name: payMethod === 'B' ? ((document.querySelector('input[name="accountB"]:checked') as HTMLInputElement)?.value === 'B1' ? '우리은행' : '농협') : null,
          account_number: payMethod === 'B' ? ((document.querySelector('input[name="accountB"]:checked') as HTMLInputElement)?.value === 'B1' ? '1005-604-481542' : '301-0337-8596-01') : null,
          expected_deposit_date: payMethod === 'B'
            ? `${(document.querySelector('select[name="expected_year"]') as HTMLSelectElement)?.value || ''}-${(document.querySelector('select[name="expected_month"]') as HTMLSelectElement)?.value || ''}-${(document.querySelector('select[name="expected_day"]') as HTMLSelectElement)?.value || ''}`.trim()
            : null,
          card_type: payMethod === 'W' ? cardType : null,
          card_category: payMethod === 'W' ? cardCategory : null,
          card_number: payMethod === 'W' ? `${cardNumber1}-${cardNumber2}-${cardNumber3}-${cardNumber4}` : null,
          card_expiry_month: payMethod === 'W' ? cardExpiryMonth : null,
          card_expiry_year: payMethod === 'W' ? cardExpiryYear : null,
          cardholder_name: payMethod === 'W' ? cardholderName : null,
          cardholder_resident_number: payMethod === 'W' ? cardholderResidentNumber : null,
          normal_premium: step3Data?.total_premium || 0,
          receipt_premium: step3Data?.total_premium || 0,
        },
      };

      // 나이스페이먼츠, 네이버페이, 카카오페이는 계약 등록 후 결제 처리
      if (payMethod === 'C' || payMethod === 'N' || payMethod === 'K' || payMethod === 'V') {
        // 1. 계약 등록
        const contractResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/register-contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData),
        });

        const contractResult = await contractResponse.json();

        if (!contractResult.success) {
          alert(contractResult.message || '계약 등록에 실패했습니다.');
          setIsProcessing(false);
          return;
        }

        const contract_id = contractResult.contract_id;

        // 2. 결제 처리
        if (payMethod === 'C') {
          // 나이스페이먼츠
          const paymentRequest = await requestNicepayPayment({
            contract_id,
            amount: step3Data?.total_premium || 0,
            orderId: String(contractResult.contract_id ?? contractResult.id),
            goodsName: '국내여행보험',
            buyerName: step2Data.contractor_name || '',
            buyerEmail: step2Data.contractor_email || '',
            buyerTel: step2Data.contractor_phone || '',
            returnUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/nicepay/callback`,
            closeUrl: `${window.location.origin}/payment/close`,
          });

          if (paymentRequest.success) {
            localStorage.setItem('pendingPayment', JSON.stringify({
              contract_id,
              payment_method: paymentMethodName,
              amount: step3Data?.total_premium || 0,
              insuranceType: 'domestic',
            }));
            try {
              const mallReserved = new URLSearchParams({
                contract_id: String(contract_id),
                insuranceType: 'domestic',
                paymentMethod: paymentMethodName,
              }).toString();
              await openNicepayWindow({
                ...paymentRequest,
                mallReserved,
              });
            } catch (error) {
              console.error('결제창 열기 오류:', error);
              alert(error instanceof Error ? error.message : '결제창을 여는 중 오류가 발생했습니다.');
              setIsProcessing(false);
            }
          } else {
            alert(paymentRequest.message || '결제 요청에 실패했습니다.');
            setIsProcessing(false);
          }
        } else if (payMethod === 'N') {
          // 네이버페이
          localStorage.setItem('pendingPayment', JSON.stringify({
            contract_id,
            payment_method: paymentMethodName,
            amount: step3Data?.total_premium || 0,
            insuranceType: 'domestic',
          }));
          try {
            await processNaverPayPayment({
              contractId: contract_id,
              amount: step3Data?.total_premium || 0,
              productName: '국내여행보험',
              productCount: step1Data.tourNum,
              customerName: step2Data.contractor_name || '',
              customerEmail: step2Data.contractor_email || '',
              customerPhone: step2Data.contractor_phone || '',
              checkOutDate: step1Data.endDate,
              // 네이버페이: 결제 시 사용할 네이버 계정 = 계약자/담당자 본인. 법인은 담당자명 전달 (본인 계정으로 결제 가능)
              purchaserName: step2Data.contractor_contact_person || step2Data.contractor_name || '',
              purchaserBirthday: step2Data?.insured_birth_1 ? String(step2Data.insured_birth_1).replace(/-/g, '').slice(0, 8) : undefined,
            });
          } catch (error) {
            console.error('네이버 페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '네이버 페이 결제 중 오류가 발생했습니다.');
            setIsProcessing(false);
          }
        } else if (payMethod === 'K') {
          // 카카오페이
          localStorage.setItem('pendingPayment', JSON.stringify({
            contract_id,
            payment_method: paymentMethodName,
            amount: step3Data?.total_premium || 0,
            insuranceType: 'domestic',
          }));
          try {
            await processKakaoPayPayment({
              contractId: contract_id,
              amount: step3Data?.total_premium || 0,
              itemName: '국내여행보험',
              quantity: step1Data.tourNum,
              customerName: step2Data.contractor_name || '',
              customerEmail: step2Data.contractor_email || '',
              customerPhone: step2Data.contractor_phone || '',
            });
          } catch (error) {
            console.error('카카오페이 결제 오류:', error);
            alert(error instanceof Error ? error.message : '카카오페이 결제 중 오류가 발생했습니다.');
            setIsProcessing(false);
          }
        } else if (payMethod === 'V') {
          // 가상계좌 (나이스페이 결제창)
          const paymentRequest = await requestNicepayPayment({
            contract_id,
            amount: step3Data?.total_premium || 0,
            orderId: String(contractResult.contract_id ?? contractResult.id),
            goodsName: '국내여행보험',
            buyerName: step2Data.contractor_name || '',
            buyerEmail: step2Data.contractor_email || '',
            buyerTel: step2Data.contractor_phone || '',
            returnUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/nicepay/callback`,
            closeUrl: `${window.location.origin}/payment/close`,
          });

          if (paymentRequest.success) {
            localStorage.setItem('pendingPayment', JSON.stringify({
              contract_id,
              payment_method: paymentMethodName,
              amount: step3Data?.total_premium || 0,
              insuranceType: 'domestic',
            }));
            try {
              const mallReserved = new URLSearchParams({
                contract_id: String(contract_id),
                insuranceType: 'domestic',
                paymentMethod: paymentMethodName,
              }).toString();
              await openNicepayWindow({
                ...paymentRequest,
                method: 'vbank',
                bankCode: virtualBankCode,
                vbankHolder: step2Data.contractor_name || '',
                mallReserved,
              });
            } catch (error) {
              console.error('가상계좌 결제창 열기 오류:', error);
              alert(error instanceof Error ? error.message : '가상계좌 결제창을 여는 중 오류가 발생했습니다.');
              setIsProcessing(false);
            }
          } else {
            alert(paymentRequest.message || '가상계좌 결제 요청에 실패했습니다.');
            setIsProcessing(false);
          }
        }
      } else {
        // 무통장입금, 수기카드는 바로 계약 등록
        const accountB = payMethod === 'B' ? (document.querySelector('input[name="accountB"]:checked') as HTMLInputElement)?.value : null;
        const paymentName = payMethod === 'B' ? (document.querySelector('input[name="payment_name"]') as HTMLInputElement)?.value : null;
        const expectedYear = payMethod === 'B' ? (document.querySelector('select[name="expected_year"]') as HTMLSelectElement)?.value : null;
        const expectedMonth = payMethod === 'B' ? (document.querySelector('select[name="expected_month"]') as HTMLSelectElement)?.value : null;
        const expectedDay = payMethod === 'B' ? (document.querySelector('select[name="expected_day"]') as HTMLSelectElement)?.value : null;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/register-contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData),
        });

        const data = await response.json();

        if (data.success) {
          // 결제 완료 페이지 표시를 위한 정보 저장
          if (payMethod === 'B') {
            setAccountBank(accountB === 'B1' ? '우리은행' : '농협');
            setAccountNumber(accountB === 'B1' ? '1005-604-481542' : '301-0337-8596-01');
            setExpectedDate(`${expectedYear}.${expectedMonth}.${expectedDay}`);
            setPaymentMethod('무통장입금');
          } else if (payMethod === 'W') {
            setPaymentMethod('수기카드');
          }
          setPaymentCompleted(true);

          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert(data.message || '계약 등록에 실패했습니다.');
        }
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('계약 등록 오류:', error);
      alert('계약 등록 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  if (paymentCompleted && (!step1Data || !step2Data)) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ marginBottom: '12px' }}>결제가 완료되었습니다.</h2>
          {paymentContractNumber && (
            <p style={{ marginBottom: '8px' }}>계약번호: {paymentContractNumber}</p>
          )}
          {paymentContractId && (
            <p style={{ marginBottom: '16px' }}>계약ID: {paymentContractId}</p>
          )}
          <p style={{ color: '#6b7280' }}>상세 정보는 해당 계약 조회 화면에서 확인할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!step1Data || !step2Data) {
    return <div>데이터를 불러오는 중...</div>;
  }

  // 결제 완료 페이지
  if (paymentCompleted) {
    const formatDate = (dateStr: string, hour: string) => {
      const [year, month, day] = dateStr.split('-');
      return `${year}.${month}.${day} ${hour}시`;
    };

    return (
      <div className="speed_Wrap" style={{ background: '#fff' }}>
        <section className="tour2023_pc_SpeedTop_w">
          <div className="tour2023_pc_SpeedTop">
            <p className="tour2023_pc_SpeedTop_icon"></p>
            <p className="tour2023_pc_SpeedTop01">
              <span
                className="tour2023_pc_SpeedTop_title"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}
              >
                <span>단체여행자보험<em className="tour2023_pc_SpeedTop_title01">(법인/단체)</em></span>
                {!isLoading && isLoggedIn && member && (
                  <span className="tour2023_pc_SpeedTop_loginUser" style={{ fontSize: 14, color: '#4d60d6', fontWeight: 500 }}>
                    {member.member_type === '법인' && corporateName ? corporateName : member.name}님
                  </span>
                )}
              </span>
              <span className="tour2023_pc_SpeedTop_title02">
                사업자등록증(고유번호증) 있는 법인/단체 포괄회원 가입으로 보다 편리하게 이용하실 수 있습니다.
              </span>
            </p>
            <a className="close" href="#" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ top: 8 }}>
              닫기
            </a>
          </div>
        </section>

        <div className="speed_content">
          <div className="con01">
            <div className="tour2023_pc_menu_wrap tourG_mat05 tourG_mab05">
              <span className="menu on"><a href="/group-insurance/domestic/popup">국내여행자보험</a></span>
              <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
              <span className="menu"><a href="/group-insurance/longstay/popup">해외장기체류보험</a></span>
            </div>

            <div className="join_end_img"></div>
            <p className="sub_title ag_center pt20 ls01">
              투어밸리 여행보험센터를 이용해 주셔서 감사드립니다.<br />
              지금 고객님의 <span className="font20 font_blue">안전여행이 Upgrade</span> 되었습니다.<br />
              <span className="font16">안전여행을 위한 가장 안전한 투자! 바로 여행보험입니다.</span>
            </p>
            <div className="bgcolor_white">
              <div
                className="pt30"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '16px',
                }}
              >
                <h2 className="sub_title ag_left" style={{ margin: 0 }}>
                  여행보험 신청내역
                </h2>
                <button
                  type="button"
                  onClick={openB2cConfirmationPrintAfterPayment}
                  className="tour2023_btn_b02 tour2023_btn08"
                  style={{
                    font: 'unset',
                    flexShrink: 0,
                    backgroundColor: '#fff',
                    padding: '6px 14px',
                    border: '1px solid #000',
                    color: '#000',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#000' }}>인쇄</span>
                </button>
              </div>
              <div className="detailView01 bgcolor_white">
                <table className="specialB" border={1} cellSpacing={0}>
                  <caption></caption>
                  <colgroup>
                    <col width="17%" />
                    <col width="33%" />
                    <col width="17%" />
                    <col width="33%" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="sName ag_left">보험상품</td>
                      <td className="ddT ag_left">국내여행보험</td>
                      <td className="sName ag_left">보험회사</td>
                      <td className="ddT ag_left">라이나손해보험</td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">가입자명</td>
                      <td className="dd ag_left">{step2Data.contractor_name || '-'}</td>
                      <td className="sName01 ag_left">가입인원</td>
                      <td className="dd ag_left">{step1Data.tourNum}명</td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">보험기간</td>
                      <td colSpan={3} className="dd ag_left">
                        {formatDate(step1Data.startDate, step1Data.startHour)} ~ {formatDate(step1Data.endDate, step1Data.endHour)}
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">보험료</td>
                      <td className="dd ag_left">{step3Data?.total_premium ? `${step3Data.total_premium.toLocaleString()}원` : '-'}</td>
                      <td colSpan={2} className="ag_right"></td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">결제방법</td>
                      <td colSpan={3} className="dd ag_left">{paymentMethod === '기타결제' ? (paymentSubMethod || paymentMethod) : paymentMethod}</td>
                    </tr>
                    {payMethod === 'B' && (
                      <>
                        <tr>
                          <td className="sName01 ag_left">입금은행</td>
                          <td className="dd ag_left">{accountBank}</td>
                          <td className="sName01 ag_left">계좌번호</td>
                          <td className="dd ag_left">{accountNumber}</td>
                        </tr>
                        <tr>
                          <td className="sName01 ag_left">입금예정일</td>
                          <td colSpan={3} className="dd ag_left">{expectedDate}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bgcolor_white">
                <h2 className="sub_title ag_left pt30">참고하세요!</h2>
                <ul className="je_Btxt mb40">
                  <li>보험료 결제가 완료되면 보험증서가 메일로 발송됩니다.<br />(간혹 스팸메일로 가는 경우가 있으니 스팸메일도 확인해 주시기 바랍니다.)</li>
                  <li>보험증서 발행 가능시간은 평일 오전 9시부터 오후 6시입니다. (토, 일, 공휴일 휴무)</li>
                  <li>
                    <span className="font_blue01">주말, 공휴일 등 고객센터 업무시간 이외에 여행보험을 신청하는 경우</span>
                    <div className="plan_guide mb10 mt10">
                      ▶ 보험료 결제가 완료된 경우에는 신청하신 보험기간으로 보험혜택을 받으실 수 있습니다. <br />
                      <span style={{ color: '#f2fbfa' }}>▶ </span>(단, 보험증서 및 영수증 등 청약관련 서류는 업무가 재개된 날 받아보실 수 있습니다.<br />
                      <span style={{ color: '#f2fbfa' }}>▶ </span>예 : 토요일 가입신청 → 월요일 오전 증서 발급)<br /><br />
                      ▶ 다만, 과거 보험회사에 보험금청구이력(다수/고액)으로 계약인수가 거절되는 경우 / 신청하신 보험기간이<br />
                      <span style={{ color: '#f2fbfa' }}>▶ </span>기존 가입된 보험기간과 중복되는 경우 에는 보험료가 결제된 경우라도 <span style={{ color: 'red' }}>보험계약이 거절</span>될 수 있으니<br />
                      <span style={{ color: '#f2fbfa' }}>▶ </span>가입 시 유의 바랍니다. 영업시간 내에 확인, 안내되며 결제된 보험료는 환불하여 드립니다.<br />
                    </div>
                  </li>
                  <li style={{ color: 'red' }}>※ 보험기간, 인원 등의 계약내용이 변경되는 경우 계약취소 신청 후 재가입하시기 바랍니다.</li>
                  <li>※ 계약취소 신청은 보험기간이 시작되는 시점의 2시간 전까지 가능합니다.</li>
                  <li>※ 계약취소 신청은 계약조회 후 계약상세보기에서 신청하거나 고객센터로 전화로 신청하실 수있습니다.</li>
                </ul>
              </div>
            </div>
          </div>

          <section className="ss_number_w">
            <div className="ss_number">
              ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
              <br />
              준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="speed_Wrap" style={{ background: '#fff' }}>
      <section className="tour2023_pc_SpeedTop_w">
        <div className="tour2023_pc_SpeedTop">
          <p className="tour2023_pc_SpeedTop_icon"></p>
          <p className="tour2023_pc_SpeedTop01">
            <span
              className="tour2023_pc_SpeedTop_title"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}
            >
              <span>단체여행자보험<em className="tour2023_pc_SpeedTop_title01">(법인/단체)</em></span>
              {!isLoading && isLoggedIn && member && (
                <span className="tour2023_pc_SpeedTop_loginUser" style={{ fontSize: 14, color: '#4d60d6', fontWeight: 500 }}>
                  {member.member_type === '법인' && corporateName ? corporateName : member.name}님
                </span>
              )}
            </span>
            <span className="tour2023_pc_SpeedTop_title02">
              사업자등록증(고유번호증) 있는 법인/단체 포괄회원 가입으로 보다 편리하게 이용하실 수 있습니다.
            </span>
          </p>
          <a className="close" href="#" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ top: 8 }}>
            닫기
          </a>
        </div>
      </section>

      <div className="speed_content">
        <div className="con01">
          <div className="tour2023_pc_menu_wrap tourG_mat05 tourG_mab05">
            <span className="menu on"><a href="/group-insurance/domestic/popup">국내여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/longstay/popup">해외장기체류보험</a></span>
          </div>
          
          <div className="bgcolor_white">
            <p className="sub_title_02 ag_left pt10">5단계 : 보험료 결제</p>
            <h2 className="sub_title ag_left pt30">여행자보험 계약정보</h2>
            <div className="detailView01 bgcolor_white">
              <table className="specialB" border={1} cellSpacing={0}>
                <caption></caption>
                <colgroup>
                  <col width="30%" />
                  <col width="70%" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="sName01">보험상품</td>
                    <td className="dd tb ag_left">국내여행보험</td>
                  </tr>
                  <tr>
                    <td className="sName01">보험회사</td>
                    <td className="dd ag_left">라이나손해</td>
                  </tr>
                  <tr>
                    <td className="sName01">계약자</td>
                    <td className="dd ag_left">{step2Data.contractor_name || '-'}</td>
                  </tr>
                  <tr>
                    <td className="sName01">보험기간</td>
                    <td className="dd ag_left">
                      {step1Data.startDate} {step1Data.startHour}시 ~ {step1Data.endDate} {step1Data.endHour}시
                    </td>
                  </tr>
                  <tr>
                    <td className="sName01">여행지</td>
                    <td className="dd ag_left">전국일원</td>
                  </tr>
                  <tr>
                    <td className="sName01">가입인원</td>
                    <td className="dd ag_left">
                      {step2Data.insured_name_1 || '-'}
                      {step1Data.tourNum > 1 && ` 외 ${step1Data.tourNum - 1}명`}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const detailData = buildPremiumDetailData();
                          if (detailData) {
                            localStorage.setItem('premiumDetailData', JSON.stringify(detailData));
                          }
                          const w = 620;
                          const h = 540;
                          const left = Math.max(0, (window.screen.width - w) / 2);
                          const top = Math.max(0, (window.screen.height - h) / 2);
                          const popup = window.open(
                            '/premium-detail/pc',
                            'premiumDetailPopup',
                            `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
                          );
                          if (popup) popup.focus();
                        }}
                        className="tour2023_btn_b02 tour2023_btn08"
                        style={{ font: 'unset', marginLeft: '6px' }}
                      >
                        자세히보기
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="sName01">보험료</td>
                    <td className="dd ag_left">{step3Data?.total_premium ? `${step3Data.total_premium.toLocaleString()}원` : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <section className="tourG_agree01 tourG_mat14" style={{ paddingBottom: '12px', textAlign: 'left' }}>
              <div className="tourG_cir01 tourG_chk">
                <input
                  type="checkbox"
                  name="all_agree"
                  id="all_a"
                  checked={allAgree}
                  onChange={(e) => setAllAgree(e.target.checked)}
                />
                <label htmlFor="all_a" id="agree">
                  <span className="tourGuard_txt20">위 내용을 확인하셨습니까?</span>
                </label>
              </div>
            </section>

            <h2 className="sub_title pt20 ag_left">보험료 결제</h2>
            <div className="payment_area_2303">
              <div className="btn_group_01">
                <input
                  type="radio"
                  id="paymethod_C"
                  name="paymethod"
                  value="C"
                  checked={payMethod === 'C'}
                  onChange={(e) => handlePayMethodChange(e.target.value)}
                />
                <label htmlFor="paymethod_C" className="credit_card">
                  <div className="subtxt_credit">신용카드</div>
                </label>

                <div>
                  <input
                    type="radio"
                    id="paymethod_N"
                    name="paymethod"
                    value="N"
                    checked={payMethod === 'N'}
                    onChange={(e) => handlePayMethodChange(e.target.value)}
                  />
                  <label htmlFor="paymethod_N" className="naver_pay">
                    <div className="naver_pay">네이버페이</div>
                  </label>
                </div>

                <input
                  type="radio"
                  id="paymethod_K"
                  name="paymethod"
                  value="K"
                  checked={payMethod === 'K'}
                  onChange={(e) => handlePayMethodChange(e.target.value)}
                  className="clear_b"
                />
                <label htmlFor="paymethod_K" className="kakao_pay">
                  <div className="kakao_pay">카카오페이</div>
                </label>

                <input
                  type="radio"
                  id="paymethod_W"
                  name="paymethod"
                  value="W"
                  checked={payMethod === 'W'}
                  onChange={(e) => handlePayMethodChange(e.target.value)}
                />
                <label htmlFor="paymethod_W" className="nomal_btn">
                  <div className="subtxt_04">
                    수기카드<br />
                    <span>(카드번호 입력결제)</span>
                  </div>
                </label>

                {isVirtualAccountAvailable && (
                  <>
                    <input
                      type="radio"
                      id="paymethod_V"
                      name="paymethod"
                      value="V"
                      checked={payMethod === 'V'}
                      onChange={(e) => handlePayMethodChange(e.target.value)}
                    />
                    <label htmlFor="paymethod_V" className="nomal_btn">
                      <div className="subtxt_03">가상계좌 발급</div>
                    </label>
                  </>
                )}

                <input
                  type="radio"
                  id="paymethod_B"
                  name="paymethod"
                  value="B"
                  checked={payMethod === 'B'}
                  onChange={(e) => handlePayMethodChange(e.target.value)}
                />
                <label htmlFor="paymethod_B" className="nomal_btn">
                  <div className="subtxt_04">
                    무통장입금<br />
                    <span>(보험료입금 전용계좌)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 카드결제 */}
            {payMethod === 'C' && (
              <div className="login_Btxt pb20" id="paymentArea_C">
                <dl style={{ border: '1px solid #d2d2d2', paddingLeft: '4px', background: 'aliceblue' }}>
                  <dd>
                    아래의 <span className="font_red">결제하기</span>를 클릭하면 실시간 온라인 카드결제가 진행됩니다. (법인카드/체크카드 가능)
                  </dd>
                  <dd>
                    신용카드 실시간 온라인 결제가 불가능하거나, 온라인 결제 이용이 불가능한 카드인 경우 <span className="font_red">수기카드를 선택</span>하여 결제를 진행하여 주시기 바랍니다.
                  </dd>
                </dl>
              </div>
            )}

            {/* 네이버페이 */}
            {payMethod === 'N' && (
              <section id="paymentArea_N" className="tourG_pat02" style={{ paddingTop: '0px' }}>
                <div className="login_Btxt pb20">
                  <dd className="font_blue01">※ 네이버페이 안내</dd>
                  <dl style={{ border: '1px solid #d2d2d2', paddingLeft: '4px' }}>
                    <dd>네이버페이는 네이버ID로 신용카드 또는 은행계좌 정보를 등록하여 결제할 수 있는 간편결제 서비스입니다.</dd>
                    <dd><strong>계약자(또는 결제 담당자) 본인 명의의 네이버 계정으로 로그인한 후 결제해 주세요.</strong> 타인 명의 계정으로는 결제가 제한됩니다.</dd>
                    <dd>주문 변경 시 카드사 혜택 및 할부 적용 여부는 해당 카드사 정책에 따라 변경될 수 있습니다.</dd>
                    <dd>지원 가능 결제수단 : 네이버페이 결제창 내 노출되는 모든 카드/계좌</dd>
                  </dl>
                </div>
              </section>
            )}

            {/* 수기카드 */}
            {payMethod === 'W' && (
              <div className="detailView01 bgcolor_white" id="paymentArea_W">
                <table className="specialB" border={1} cellSpacing={0}>
                  <caption>카드결제</caption>
                  <colgroup>
                    <col width="30%" />
                    <col width="70%" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="sName01">카드 구분</td>
                      <td className="dd tb ag_left">
                        <div className="in_wrap01">
                          <div className="input_cell_01 wd_50">
                            <span className="ps_box02 wd_100">
                              <span className="ccs_inp_rdo">
                                <input 
                                  type="radio" 
                                  name="card_type" 
                                  id="card_type_O" 
                                  value="O" 
                                  checked={cardType === '본인카드'}
                                  onChange={() => setCardType('본인카드')}
                                />
                              </span>
                              <label htmlFor="card_type_O">본인카드</label>
                              &nbsp;&nbsp;
                              <span className="ccs_inp_rdo">
                                <input 
                                  type="radio" 
                                  name="card_type" 
                                  id="card_type_P" 
                                  value="P"
                                  checked={cardType === '기타카드'}
                                  onChange={() => setCardType('기타카드')}
                                />
                              </span>
                              <label htmlFor="card_type_P">기타카드</label>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01">카드 종류</td>
                      <td className="dd tb ag_left">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_50">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                id="card_corp_cd" 
                                name="card_corp_cd"
                                value={cardCategory}
                                onChange={(e) => setCardCategory(e.target.value)}
                              >
                                <option value="">선택</option>
                                <option value="01">BC</option>
                                <option value="02">VISA</option>
                                <option value="03">LG</option>
                                <option value="04">국민</option>
                                <option value="05">다이너스</option>
                                <option value="06">삼성</option>
                                <option value="07">신한</option>
                                <option value="08">외환</option>
                                <option value="09">아멕스</option>
                                <option value="10">현대</option>
                                <option value="11">롯데</option>
                                <option value="12">한미</option>
                                <option value="13">씨티</option>
                                <option value="15">NH농협</option>
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01">카드 번호</td>
                      <td className="dd ag_left">
                        <div id="card_number" className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_30">
                            <input 
                              type="tel" 
                              maxLength={4} 
                              className="tf_g" 
                              name="card_no1"
                              value={cardNumber1}
                              onChange={(e) => setCardNumber1(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                          </div>
                          <span className="fff-bar"> - </span>
                          <div className="bg_join input_cell_01 wd_30">
                            <input 
                              type="tel" 
                              maxLength={4} 
                              className="tf_g" 
                              name="card_no2"
                              value={cardNumber2}
                              onChange={(e) => setCardNumber2(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                          </div>
                          <span className="fff-bar"> - </span>
                          <div className="bg_join input_cell_01 wd_30">
                            <input 
                              type="tel" 
                              maxLength={4} 
                              className="tf_g" 
                              name="card_no3"
                              value={cardNumber3}
                              onChange={(e) => setCardNumber3(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                          </div>
                          <span className="fff-bar"> - </span>
                          <div className="bg_join input_cell_01 wd_30">
                            <input 
                              type="tel" 
                              maxLength={4} 
                              className="tf_g" 
                              name="card_no4"
                              value={cardNumber4}
                              onChange={(e) => setCardNumber4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01">유효 기간</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap02">
                          <div className="bg_join input_cell_01 wd_30" style={{ float: 'left' }}>
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                title="" 
                                id="card_month" 
                                name="card_month"
                                value={cardExpiryMonth}
                                onChange={(e) => setCardExpiryMonth(e.target.value)}
                              >
                                <option value="">월</option>
                                <option value="01">01</option>
                                <option value="02">02</option>
                                <option value="03">03</option>
                                <option value="04">04</option>
                                <option value="05">05</option>
                                <option value="06">06</option>
                                <option value="07">07</option>
                                <option value="08">08</option>
                                <option value="09">09</option>
                                <option value="10">10</option>
                                <option value="11">11</option>
                                <option value="12">12</option>
                              </select>
                            </span>
                          </div>
                          &nbsp;
                          <div className="bg_join input_cell_01 wd_30 ml10" style={{ float: 'left', marginLeft: '14px' }}>
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                title="" 
                                id="card_year" 
                                name="card_year"
                                value={cardExpiryYear}
                                onChange={(e) => setCardExpiryYear(e.target.value)}
                              >
                                <option value="">년</option>
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                  <option key={year} value={String(year).slice(-2)}>{String(year).slice(-2)}</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01">소유자 이름</td>
                      <td className="dd ag_left">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_30" style={{ width: '55%' }}>
                            <input 
                              type="text" 
                              className="tf_g" 
                              name="card_owner_name" 
                              size={15} 
                              maxLength={15}
                              value={cardholderName}
                              onChange={(e) => setCardholderName(e.target.value)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01">소유자 생년월일 / 사업자번호</td>
                      <td className="dd ag_left">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_30" style={{ width: '55%' }}>
                            <input 
                              type="text" 
                              className="tf_g" 
                              name="card_owner_ssn" 
                              size={15} 
                              maxLength={15}
                              value={cardholderResidentNumber}
                              onChange={(e) => setCardholderResidentNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 가상계좌 */}
            {payMethod === 'V' && (
              <div className="in_wrap pb20" id="paymentArea_V">
                <div className="bg_join input_cell">
                  <div className="ccs_rdo_area" style={{ width: '100%' }}>
                    <span className="ccs_inp_rdo" style={{ width: '100%' }}>
                      <input type="radio" id="at1" value="V" name="accountV" checked readOnly />
                      <label htmlFor="at1">가상계좌발급</label>
                      <span className="ps_box" style={{ display: 'inline', marginLeft: '110px' }}>
                        <select
                          className="sel"
                          name="EP_vacct_bank"
                          style={{ width: '60%' }}
                          value={virtualBankCode}
                          onChange={(e) => setVirtualBankCode(e.target.value)}
                        >
                          <option value="">은행 선택</option>
                          <option value="003">기업은행</option>
                          <option value="004">국민은행</option>
                          <option value="011">농협중앙회</option>
                          <option value="020">우리은행</option>
                          <option value="023">SC제일은행</option>
                          <option value="026">신한은행</option>
                          <option value="032">부산은행</option>
                          <option value="071">우체국</option>
                          <option value="081">하나은행</option>
                        </select>
                      </span>
                    </span>
                  </div>
                </div>
                <div>
                  <div className="login_Btxt pb20">
                    <dl style={{ border: '1px solid #d2d2d2', paddingLeft: '4px', background: 'aliceblue' }}>
                      <dd>
                        가상계좌 발급은 먼저 <span className="font_red">입금은행을 선택</span>하시고{' '}
                        <span className="font_red">아래의 결제하기</span>를 클릭하시면 고객님 한분만을 위한 전용 가상계좌가 생성되고
                        입금계좌를 문자로 보내드립니다.(단, 보험료가 1만원이 넘는 경우에 한합니다)
                      </dd>
                      <dd>고객님 전용 가상계좌로 여행보험료가 입금되면 보험료결제가 완료됩니다.</dd>
                      <dd>가상계좌발급이 불가능한 경우에는 보험료입금 전용계좌 무통장입금을 선택하여 결제하시기 바랍니다.</dd>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* 무통장입금 */}
            {payMethod === 'B' && (
              <div className="in_wrap pb20" id="paymentArea_B">
                <div className="bg_join input_cell">
                  <div className="ccs_rdo_area">
                    <span className="ccs_inp_rdo">
                      <input type="radio" id="at2" value="B1" name="accountB" defaultChecked />
                      <label htmlFor="at2">보험료입금 전용계좌 무통장입금 (우리은행: 1005-604-481542, 예금주 빨주노초파남보)</label>
                    </span>
                  </div>
                </div>
                <div className="bg_join input_cell">
                  <div className="ccs_rdo_area">
                    <span className="ccs_inp_rdo">
                      <input type="radio" id="at3" value="B2" name="accountB" />
                      <label htmlFor="at3">보험료입금 전용계좌 무통장입금 (농협: 301-0337-8596-01, 예금주 빨주노초파남보)</label>
                    </span>
                  </div>
                </div>
                <div>
                  <div className="login_Btxt pb20">
                    <dl style={{ border: '1px solid #d2d2d2', paddingLeft: '4px', background: 'aliceblue' }}>
                      <dd>
                        보험료입금 전용계좌 무통장입금은 <span className="font_red">입금예정자명</span>과 <span className="font_red">입금예정일</span>(5일 이내)을 입력하신 후 <span className="font_red">아래의 결제하기</span>를 클릭하시기 바랍니다.
                      </dd>
                      <dd>결제 확인은 고객센터 영업시간 내에만 가능합니다. 다만 영업시간 이외에 입금한 경우라도 보험료 입금이 확인되면 보험가입이 가능합니다.</dd>
                      <dd>무통장입금은 고객센터에서 입금이 확인된 경우에 입금확인증 발급이 가능합니다. 업무시간 이외에 실시간 이체확인증이 필요한 경우 가상계좌 발금을 선택하여 보험료를 결제하시기 바랍니다.</dd>
                    </dl>
                  </div>
                  <div>
                    <label className="sName01" htmlFor="payment_name">입금예정자명</label>
                    <div className="in_wrap02">
                      <div className="bg_join input_cell_01 wd_30">
                        <input type="text" maxLength={15} className="tf_g" name="payment_name" id="payment_name" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="sName01" htmlFor="expected_year">입금예정일</label>
                    <div className="in_wrap01">
                      <div className="bg_join input_cell_01 wd_30">
                        <span className="ps_box02 wd_100">
                          <select
                            className="sel01"
                            title=""
                            id="expected_year"
                            name="expected_year"
                            value={expectedYearSelect}
                            onChange={(e) => handleExpectedDepositSelectChange(e.target.value, expectedMonthSelect, expectedDaySelect)}
                          >
                            {yearOptions.map((year) => (
                              <option key={year} value={String(year)}>
                                {year}년
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                      <div className="bg_join input_cell_01 wd_30">
                        <span className="ps_box02 wd_100">
                          <select
                            className="sel01"
                            title=""
                            id="expected_month"
                            name="expected_month"
                            value={expectedMonthSelect}
                            onChange={(e) => handleExpectedDepositSelectChange(expectedYearSelect, e.target.value, expectedDaySelect)}
                          >
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((month) => (
                              <option key={month} value={month}>
                                {parseInt(month)}월
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                      <div className="bg_join input_cell_01 wd_30">
                        <span className="ps_box02 wd_100">
                          <select
                            className="sel01"
                            title=""
                            id="expected_day"
                            name="expected_day"
                            value={expectedDaySelect}
                            onChange={(e) => handleExpectedDepositSelectChange(expectedYearSelect, expectedMonthSelect, e.target.value)}
                          >
                            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((day) => (
                              <option key={day} value={day}>
                                {parseInt(day)}일
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="login_Btxt pb20">
              <dd className="font_blue01">※ 참고하세요.</dd>
              <dl style={{ border: '1px solid #d2d2d2', paddingLeft: '4px' }}>
                <dd>
                  <span className="font_red">여행보험료는</span> 세법관련 규정에 따라 <span className="font_red">현금영수증 발급 대상이 아닙니다.</span>
                </dd>
                <dd>계좌입금(가상계좌)은 먼저 입금은행을 선택하시고 결제하기를 선택하시면 고객전용 가상계좌가 생성되고 입금계좌를 문자로 보내드립니다. (단, 보험료가 1만원이 넘는 경우에 한합니다)</dd>
                <dd>
                  고객전용 가상계좌가 생성되지 않는 경우에는 <span className="font_blue01">보험료 입금 전용계좌</span>
                  <span className="font_red">(우리은행:1005-604-481542 또는 농협:301-0337-8596-01)</span>로 입금해주시기 바랍니다.<br />
                  &nbsp;[ 예금주 ㈜빨주노초파남보 ]
                </dd>
                <dd>입금전용계좌 이용 시 고객센터 영업시간 내에만 입금확인이 가능합니다. 회계처리 관련 회사의 계좌사본 및 사업자등록증은 필요한 경우 고객센터로 요청하면 발송하여 드립니다.</dd>
              </dl>
            </div>

            <div className="con_btnWrap mt30 mb40">
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (!isProcessing) {
                    handlePayment(); 
                  }
                }}
                style={{ 
                  opacity: isProcessing ? 0.6 : 1, 
                  pointerEvents: isProcessing ? 'none' : 'auto',
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? '결제 처리 중...' : '결제하기'}
              </a>
            </div>
          </div>
        </div>

        {/* 심의번호 */}
        <section className="ss_number_w">
          <div className="ss_number">
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
            <br />
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </div>
        </section>
      </div>

      {/* 피보험자 상세 정보 모달 */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="tour2023_pc_layer tour2023_pcBox_plan" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="tour2023_pcBox_top01">
              <p className="tour2023_pcBox_tit01">피보험자 상세 정보</p>
              <a className="close" href="#" onClick={(e) => { e.preventDefault(); setShowDetailModal(false); }}>
                닫기
              </a>
            </div>
            <div className="tour2023_limit_state">
              <div className="tourG_mat06">
                <div className="detailView01 bgcolor_white">
                  <table className="specialB" border={1} cellSpacing={0}>
                    <caption>피보험자별 보험료 상세</caption>
                    <colgroup>
                      <col width="15%" />
                      <col width="30%" />
                      <col width="35%" />
                      <col width="20%" />
                    </colgroup>
                    <thead>
                      <tr>
                        <td className="sName">순번</td>
                        <td className="sName">성명</td>
                        <td className="sName">플랜</td>
                        <td className="sName">보험료</td>
                      </tr>
                    </thead>
                    <tbody>
                      {insuredList.map((insured) => (
                        <tr key={insured.index}>
                          <td className="dd ag_center">{insured.index}</td>
                          <td className="dd ag_center">{insured.name}</td>
                          <td className="dd ag_center">{insured.planName}</td>
                          <td className="dd ag_right">{insured.premium.toLocaleString()}원</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="sName ag_right" style={{ fontWeight: 'bold' }}>
                          합계
                        </td>
                        <td className="dd ag_right" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {step3Data?.total_premium ? `${step3Data.total_premium.toLocaleString()}원` : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="tourG_mat07 tourG_mab02">
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowDetailModal(false); }} className="tourGuard_btn_b tourGuard_btn01">
                    확인
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

