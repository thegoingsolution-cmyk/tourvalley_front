'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
import { requestNicepayPayment, openNicepayWindow, processNaverPayPayment, processKakaoPayPayment } from '@/services/paymentService';
import '../../popup/page.css';

export default function LongStayInsuranceStep5Page() {
  const { isLoggedIn, member, isLoading } = useAuth();
  const [corporateName, setCorporateName] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState('C');
  const [allAgree, setAllAgree] = useState(false);
  const [step1Data, setStep1Data] = useState<any>(null);
  const [step2Data, setStep2Data] = useState<any>(null);
  const [step3Data, setStep3Data] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentContractId, setPaymentContractId] = useState('');
  const [paymentContractNumber, setPaymentContractNumber] = useState('');
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
  
  // 년도 옵션 생성 (현재 년도 + 5년)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const totalPremium = step3Data?.total_premium || 0;
  const isVirtualAccountAvailable = totalPremium >= 10000;
  const travelPurpose = step2Data?.travel_purpose || '유학/어학연수';
  const getPlanType = (planCode: string, purpose?: string): string => {
    const p = purpose ?? travelPurpose;
    if (p === '워킹홀리데이') {
      const map: Record<string, string> = { 'BAW': '워킹홀리데이실속플랜', 'HCW': '워킹홀리데이표준플랜', 'HAW': '워킹홀리데이(유로화플랜)' };
      return map[planCode] || '워킹홀리데이실속플랜';
    }
    const map: Record<string, string> = { 'BAW': '실속플랜', 'HCW': '표준플랜', 'BAS': '실속플랜', 'STD': '표준플랜', 'BAU': '실속플랜', 'STU': '표준플랜' };
    return map[planCode] || '실속플랜';
  };
  const getPlanDisplayName = (planCode: string) => getPlanType(planCode);

  const continentPlaceLabels: { [key: string]: { value: string; label: string }[] } = {
    EU: [
      { value: 'GR', label: '그리스' },
      { value: 'NL', label: '네덜란드' },
      { value: 'NO', label: '노르웨이' },
      { value: 'DK', label: '덴마크' },
      { value: 'DE', label: '독일' },
      { value: 'RU', label: '러시아' },
      { value: 'BE', label: '벨기에' },
      { value: 'SE', label: '스웨덴' },
      { value: 'ES', label: '스페인' },
      { value: 'CH', label: '스위스' },
      { value: 'GB', label: '영국' },
      { value: 'AT', label: '오스트리아' },
      { value: 'IT', label: '이탈리아' },
      { value: 'CZ', label: '체코' },
      { value: 'PT', label: '포르투갈' },
      { value: 'PL', label: '폴란드' },
      { value: 'FI', label: '핀란드' },
      { value: 'FR', label: '프랑스' },
      { value: 'HU', label: '헝가리' },
    ],
    AS: [
      { value: 'TW', label: '대만' },
      { value: 'MY', label: '말레이시아' },
      { value: 'MN', label: '몽골' },
      { value: 'VN', label: '베트남' },
      { value: 'SG', label: '싱가포르' },
      { value: 'IN', label: '인도' },
      { value: 'ID', label: '인도네시아' },
      { value: 'UZ', label: '우즈베키스탄' },
      { value: 'JP', label: '일본' },
      { value: 'CN', label: '중국' },
      { value: 'KZ', label: '카자흐스탄' },
      { value: 'TH', label: '태국' },
      { value: 'PH', label: '필리핀' },
      { value: 'HK', label: '홍콩' },
    ],
    AF: [
      { value: 'ZA', label: '남아프리카공화국' },
      { value: 'MA', label: '모로코' },
      { value: 'EG', label: '이집트' },
      { value: 'KE', label: '케냐' },
      { value: 'TZ', label: '탄자니아' },
    ],
    AU: [
      { value: 'NZ', label: '뉴질랜드' },
      { value: 'PG', label: '파푸아뉴기니' },
      { value: 'FJ', label: '피지' },
      { value: 'AU', label: '호주' },
    ],
    NA: [
      { value: 'MX', label: '멕시코' },
      { value: 'US', label: '미국' },
      { value: 'CU', label: '쿠바' },
      { value: 'CA', label: '캐나다' },
    ],
    SA: [
      { value: 'BR', label: '브라질' },
      { value: 'AR', label: '아르헨티나' },
      { value: 'CL', label: '칠레' },
      { value: 'CO', label: '콜롬비아' },
      { value: 'PE', label: '페루' },
    ],
  };

  const getTourPlaceLabel = (continentCode?: string, placeCode?: string) => {
    if (!continentCode || !placeCode) return '';
    const places = continentPlaceLabels[continentCode];
    const selected = places?.find((place) => place.value === placeCode);
    return selected?.label || '';
  };

  const [insuredList, setInsuredList] = useState<any[]>([]);

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

    const step1 = localStorage.getItem('longstayInsuranceStep1');
    const step2 = localStorage.getItem('longstayInsuranceStep2');
    const step3 = localStorage.getItem('longstayInsuranceStep3');

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
        const [contractResponse, companionsResponse] = await Promise.all([
          fetch(`${apiBase}/api/contracts/detail/${contractId}`),
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
            if (!paymentMethodParam && contract.paymentMethod) {
              setPaymentMethod(contract.paymentMethod);
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
      if ((!step1 || !step2 || !step3) && contractIdParam) {
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
    window.location.href = '/group-insurance/longstay/step4';
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
        if (!cardholderResidentNumber || cardholderResidentNumber.length < 6) {
          alert('카드소유자 생년월일 또는 사업자번호를 입력해주세요.');
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
        const engName = step2Data[`insured_engname_${i}`] || '';
        const birthDate = step2Data[`insured_birth_${i}`] || '';
        const gender = step2Data[`insured_gender_${i}`] || '남자';
        const countryType = step2Data[`insured_country_type_${i}`] || 'D'; // D: 내국인, F: 외국인
        const planCode = step3Data.selected_plans?.[i] || 'BAW';
        const premium = step3Data.premiums?.[i] || 0;

        // 생년월일에서 나이 계산
        let age = 0;
        let genderCode = '1'; // 기본값
        if (birthDate && birthDate.length >= 8) {
          const year = parseInt(birthDate.substring(0, 4));
          const month = parseInt(birthDate.substring(4, 6));
          const day = parseInt(birthDate.substring(6, 8));
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

        // 국적 정보 변환
        let nationalityType = countryType === 'D' ? '내국인' : '외국인';
        let nationalityContinent = null;
        let nationalityCountry = null;
        
        if (countryType === 'F') {
          // 외국인인 경우 대륙과 국가 정보 변환
          const country1Code = step2Data[`insured_country1_${i}`] || ''; // 대륙 코드 (EU, AS, AF, AU, NA, SA)
          const country2Code = step2Data[`insured_country2_${i}`] || ''; // 국가 코드 (DE, FR, JP 등)
          
          nationalityContinent = country1Code || null;
          
          // 국가 코드를 한글 국가명으로 변환
          if (country1Code && country2Code) {
            const continentPlacesForNationality: { [key: string]: { value: string; label: string }[] } = {
              EU: [
                { value: 'GR', label: '그리스' },
                { value: 'NL', label: '네덜란드' },
                { value: 'NO', label: '노르웨이' },
                { value: 'DK', label: '덴마크' },
                { value: 'DE', label: '독일' },
                { value: 'RU', label: '러시아' },
                { value: 'BE', label: '벨기에' },
                { value: 'SE', label: '스웨덴' },
                { value: 'ES', label: '스페인' },
                { value: 'CH', label: '스위스' },
                { value: 'GB', label: '영국' },
                { value: 'AT', label: '오스트리아' },
                { value: 'IT', label: '이탈리아' },
                { value: 'CZ', label: '체코' },
                { value: 'PT', label: '포르투갈' },
                { value: 'PL', label: '폴란드' },
                { value: 'FI', label: '핀란드' },
                { value: 'FR', label: '프랑스' },
                { value: 'HU', label: '헝가리' },
              ],
              AS: [
                { value: 'TW', label: '대만' },
                { value: 'MY', label: '말레이시아' },
                { value: 'MN', label: '몽골' },
                { value: 'VN', label: '베트남' },
                { value: 'SG', label: '싱가포르' },
                { value: 'IN', label: '인도' },
                { value: 'ID', label: '인도네시아' },
                { value: 'UZ', label: '우즈베키스탄' },
                { value: 'JP', label: '일본' },
                { value: 'CN', label: '중국' },
                { value: 'KZ', label: '카자흐스탄' },
                { value: 'TH', label: '태국' },
                { value: 'PH', label: '필리핀' },
                { value: 'HK', label: '홍콩' },
              ],
              AF: [
                { value: 'ZA', label: '남아프리카공화국' },
                { value: 'MA', label: '모로코' },
                { value: 'EG', label: '이집트' },
                { value: 'KE', label: '케냐' },
                { value: 'TZ', label: '탄자니아' },
              ],
              AU: [
                { value: 'NZ', label: '뉴질랜드' },
                { value: 'PG', label: '파푸아뉴기니' },
                { value: 'FJ', label: '피지' },
                { value: 'AU', label: '호주' },
              ],
              NA: [
                { value: 'MX', label: '멕시코' },
                { value: 'US', label: '미국' },
                { value: 'CU', label: '쿠바' },
                { value: 'CA', label: '캐나다' },
              ],
              SA: [
                { value: 'BR', label: '브라질' },
                { value: 'AR', label: '아르헨티나' },
                { value: 'CL', label: '칠레' },
                { value: 'CO', label: '콜롬비아' },
                { value: 'PE', label: '페루' },
              ],
            };
            
            const places = continentPlacesForNationality[country1Code];
            if (places) {
              const selectedPlace = places.find(p => p.value === country2Code);
              if (selectedPlace) {
                nationalityCountry = selectedPlace.label;
              }
            }
          }
        }

        insuredPersons.push({
          sequence_number: i,
          name: name,
          english_name: engName || null,
          resident_number: birthDate ? `${birthDate}-${genderCode}******` : '',
          gender: gender,
          age: age,
          plan_type: getPlanType(planCode),
          plan_variant: 'B',
          premium: premium,
          has_medical_expense: 1,
          nationality_type: nationalityType,
          nationality_continent: nationalityContinent,
          nationality_country: nationalityCountry,
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

      // 여행지 정보 변환 (대륙 코드 → 한글 대륙명, 국가 코드 → 한글 국가명)
      const continentMap: { [key: string]: string } = {
        'EU': '유럽',
        'AS': '아시아',
        'AF': '아프리카',
        'AU': '오세아니아',
        'NA': '북아메리카',
        'SA': '남아메리카',
      };

      const continentPlaces: { [key: string]: { value: string; label: string }[] } = {
        EU: [
          { value: 'GR', label: '그리스' },
          { value: 'NL', label: '네덜란드' },
          { value: 'NO', label: '노르웨이' },
          { value: 'DK', label: '덴마크' },
          { value: 'DE', label: '독일' },
          { value: 'RU', label: '러시아' },
          { value: 'BE', label: '벨기에' },
          { value: 'SE', label: '스웨덴' },
          { value: 'ES', label: '스페인' },
          { value: 'CH', label: '스위스' },
          { value: 'GB', label: '영국' },
          { value: 'AT', label: '오스트리아' },
          { value: 'IT', label: '이탈리아' },
          { value: 'CZ', label: '체코' },
          { value: 'PT', label: '포르투갈' },
          { value: 'PL', label: '폴란드' },
          { value: 'FI', label: '핀란드' },
          { value: 'FR', label: '프랑스' },
          { value: 'HU', label: '헝가리' },
        ],
        AS: [
          { value: 'TW', label: '대만' },
          { value: 'MY', label: '말레이시아' },
          { value: 'MN', label: '몽골' },
          { value: 'VN', label: '베트남' },
          { value: 'SG', label: '싱가포르' },
          { value: 'IN', label: '인도' },
          { value: 'ID', label: '인도네시아' },
          { value: 'UZ', label: '우즈베키스탄' },
          { value: 'JP', label: '일본' },
          { value: 'CN', label: '중국' },
          { value: 'KZ', label: '카자흐스탄' },
          { value: 'TH', label: '태국' },
          { value: 'PH', label: '필리핀' },
          { value: 'HK', label: '홍콩' },
        ],
        AF: [
          { value: 'ZA', label: '남아프리카공화국' },
          { value: 'MA', label: '모로코' },
          { value: 'EG', label: '이집트' },
          { value: 'KE', label: '케냐' },
          { value: 'TZ', label: '탄자니아' },
        ],
        AU: [
          { value: 'NZ', label: '뉴질랜드' },
          { value: 'PG', label: '파푸아뉴기니' },
          { value: 'FJ', label: '피지' },
          { value: 'AU', label: '호주' },
        ],
        NA: [
          { value: 'MX', label: '멕시코' },
          { value: 'US', label: '미국' },
          { value: 'CU', label: '쿠바' },
          { value: 'CA', label: '캐나다' },
        ],
        SA: [
          { value: 'BR', label: '브라질' },
          { value: 'AR', label: '아르헨티나' },
          { value: 'CL', label: '칠레' },
          { value: 'CO', label: '콜롬비아' },
          { value: 'PE', label: '페루' },
        ],
      };

      // 대륙명 변환
      const travelRegion = step1Data.tourContinent ? (continentMap[step1Data.tourContinent] || null) : null;
      
      // 국가명 변환
      let travelCountry = null;
      if (step1Data.tourContinent && step1Data.tourPlace) {
        const places = continentPlaces[step1Data.tourContinent];
        if (places) {
          const selectedPlace = places.find(p => p.value === step1Data.tourPlace);
          if (selectedPlace) {
            travelCountry = selectedPlace.label;
          }
        }
      }

      // 계약 데이터 구성
      const contractData = {
        contract: {
          member_id: isLoggedIn && member ? member.id : null,
          insurance_type: step2Data.travel_purpose || '유학/어학연수',
          departure_date: departureDateTime,
          arrival_date: arrivalDateTime,
          duration_months: 0,
          duration_days: periodDays,
          travel_region: travelRegion,
          travel_country: travelCountry,
          travel_purpose: step2Data.travel_purpose || '',
          travel_participants: step1Data.tourNum,
          total_premium: step3Data?.total_premium || 0,
          device: 'PC',
          access_path: '투어밸리 사이트',
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
            orderId: contractResult.contract_number,
            goodsName: '해외장기체류보험',
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
              insuranceType: 'longstay',
            }));
            try {
              const mallReserved = new URLSearchParams({
                contract_id: String(contract_id),
                insuranceType: 'longstay',
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
            insuranceType: 'longstay',
          }));
          try {
            await processNaverPayPayment({
              contractId: contract_id,
              amount: step3Data?.total_premium || 0,
              productName: '해외장기체류보험',
              productCount: step1Data.tourNum,
              customerName: step2Data.contractor_name || '',
              customerEmail: step2Data.contractor_email || '',
              customerPhone: step2Data.contractor_phone || '',
              checkOutDate: step1Data.endDate,
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
            insuranceType: 'longstay',
          }));
          try {
            await processKakaoPayPayment({
              contractId: contract_id,
              amount: step3Data?.total_premium || 0,
              itemName: '해외장기체류보험',
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
            orderId: contractResult.contract_number,
            goodsName: '해외장기체류보험',
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
              insuranceType: 'longstay',
            }));
            try {
              const mallReserved = new URLSearchParams({
                contract_id: String(contract_id),
                insuranceType: 'longstay',
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
              <span className="menu"><a href="/group-insurance/domestic/popup">국내여행자보험</a></span>
              <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
              <span className="menu on"><a href="/group-insurance/longstay/popup">해외장기체류보험</a></span>
            </div>

            <div className="join_end_img"></div>
            <p className="sub_title ag_center pt20 ls01">
              투어밸리 여행보험센터를 이용해 주셔서 감사드립니다.<br />
              지금 고객님의 <span className="font20 font_blue">안전여행이 Upgrade</span> 되었습니다.<br />
              <span className="font16">안전여행을 위한 가장 안전한 투자! 바로 여행보험입니다.</span>
            </p>
            <div className="bgcolor_white">
              <h2 className="sub_title ag_left pt30">여행보험 신청내역</h2>
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
                      <td className="ddT ag_left">해외장기체류보험</td>
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
                      <td colSpan={3} className="dd ag_left">{paymentMethod}</td>
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
              준법감시필 제2025-광고T-001(2025.01.30-2026-01.29)
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
            <span className="menu"><a href="/group-insurance/domestic/popup">국내여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
            <span className="menu on"><a href="/group-insurance/longstay/popup">해외장기체류보험</a></span>
          </div>
          
          <div className="bgcolor_white">
            <p className="sub_title_02 ag_left pt10">5단계 : 보험료 결제</p>
            <div className="pt30" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <h2 className="sub_title ag_left" style={{ margin: 0 }}>여행자보험 계약정보</h2>
              <button
                type="button"
                onClick={() => {
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
                  const draft = {
                    detail: {
                      id: 0,
                      insuranceType: step2Data.travel_purpose || '해외장기체류보험',
                      departureDate: departureDate || new Date().toISOString().slice(0, 10),
                      arrivalDate: arrivalDate || new Date().toISOString().slice(0, 10),
                      travelCountry: getTourPlaceLabel(step1Data.tourContinent, step1Data.tourPlace) || null,
                      travelRegion: null,
                      travelParticipants: step1Data.tourNum || participants.length,
                      totalPremium: step3Data?.total_premium ?? 0,
                      createdAt: new Date().toISOString(),
                      contractorType: '법인',
                      contractorCompanyName: step2Data.contractor_name || null,
                      memberName: step2Data.contractor_name ?? '',
                      memberBirthDate: '',
                      memberPhone: step2Data.contractor_phone ?? '',
                      memberEmail: step2Data.contractor_email ?? '',
                      paymentMethod: null,
                      paymentSubMethod: null,
                      paymentStatus: '미결제',
                      status: '가입신청',
                      businessNumber: step2Data.contractor_business_number ?? null,
                    },
                    participants: participants.map((p: { id?: number; name: string; gender?: string; birthDate?: string; planType?: string; premium?: number }, i: number) => ({
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
                }}
                className="tour2023_btn_b02 tour2023_btn08"
                style={{ font: 'unset', flexShrink: 0, backgroundColor: '#fff', padding: '6px 14px', border: '1px solid #000', color: '#000', fontSize: '13px' }}
              >
                <span style={{ color: '#000' }}>인쇄</span>
              </button>
            </div>
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
                    <td className="dd tb ag_left">해외장기체류보험</td>
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
                    <td className="dd ag_left">{getTourPlaceLabel(step1Data.tourContinent, step1Data.tourPlace) || step1Data.tourPlace || '-'}</td>
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
                          const popup = window.open(
                            '/premium-detail/pc',
                            'premiumDetailPopup',
                            'width=720,height=640,scrollbars=yes'
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

            {payMethod === 'N' && (
              <section id="paymentArea_N" className="tourG_pat02" style={{ paddingTop: '0px' }}>
                <div className="login_Btxt pb20">
                  <dd className="font_blue01">※ 네이버페이 안내</dd>
                  <dl style={{ border: '1px solid #d2d2d2', paddingLeft: '4px' }}>
                    <dd>네이버페이는 네이버ID로 신용카드 또는 은행계좌 정보를 등록하여 결제할 수 있는 간편결제 서비스입니다.</dd>
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
                                  <option key={year} value={String(year)}>{String(year).slice(-2)}</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {cardType === '기타카드' && (
                      <>
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
                                  maxLength={13}
                                  value={cardholderResidentNumber}
                                  onChange={(e) => setCardholderResidentNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

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
                          <select className="sel01" title="" id="expected_year" name="expected_year" defaultValue={String(currentYear)}>
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
                          <select className="sel01" title="" id="expected_month" name="expected_month" defaultValue={currentMonth}>
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
                          <select className="sel01" title="" id="expected_day" name="expected_day" defaultValue={currentDay}>
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

        <section className="ss_number_w">
          <div className="ss_number">
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
            <br />
            준법감시필 제2025-광고T-001(2025.01.30-2026-01.29)
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

