'use client';

import React, { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
import { Participant } from '@/components/travel/types';
import { isValidBirthDateYYYYMMDD } from '@/utils/birthDate';
import '../../popup/page.css';

// 한국어 locale 등록
registerLocale('ko', ko);

// 날짜 포맷 함수
const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// 날짜 파싱 함수
const parseDate = (dateString: string): Date | null => {
  try {
    return parse(dateString, 'yyyy-MM-dd', new Date());
  } catch {
    return null;
  }
};

export default function LongStayInsuranceStep2Page() {
  const { isLoggedIn, member, isLoading } = useAuth();
  const [corporateName, setCorporateName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('01');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('01');
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [hasSelectedEndDate, setHasSelectedEndDate] = useState(false);
  const [tourContinent, setTourContinent] = useState('');
  const [tourPlace, setTourPlace] = useState('');
  const [tourGoal, setTourGoal] = useState('003');
  const [tourNum, setTourNum] = useState(1);
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  // 외국인 선택 상태 관리 (각 피보험자별)
  const [countryTypes, setCountryTypes] = useState<{ [key: number]: string }>({});
  // 외국인 가입 시 본국 여행 불가 동의 (외국인 1명이라도 있으면 체크 필수)
  const [foreignerNoticeAgreed, setForeignerNoticeAgreed] = useState(false);
  // 엑셀 업로드된 참가자 데이터 (입력 필드 채우기용)
  const [excelParticipants, setExcelParticipants] = useState<Participant[] | null>(null);
  // 대륙별 국가 목록 (각 피보험자별)
  const [countryLists, setCountryLists] = useState<{ [key: number]: any[] }>({});
  const resno1Ref = useRef<HTMLInputElement>(null);
  const resno2Ref = useRef<HTMLInputElement>(null);
  const resno3Ref = useRef<HTMLInputElement>(null);
  const telno1Ref = useRef<HTMLInputElement>(null);
  const telno2Ref = useRef<HTMLInputElement>(null);
  const telno3Ref = useRef<HTMLInputElement>(null);
  const ctelNo1Ref = useRef<HTMLSelectElement>(null);
  const ctelNo2Ref = useRef<HTMLInputElement>(null);
  const ctelNo3Ref = useRef<HTMLInputElement>(null);

  // 대륙별 국가 목록 (popup 페이지와 동일하게 통일, 가나다순)
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
      { value: 'TW', label: '대만(타이완)' },
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

  // 이메일 도메인 선택 핸들러
  const handleEmailDomainChange = (value: string) => {
    setEmail2(value);
  };

  // 국적 타입 변경 핸들러
  const handleCountryTypeChange = (index: number, value: string) => {
    setCountryTypes(prev => ({ ...prev, [index]: value }));
    if (value === 'F') {
      // 외국인 선택 시 국가 목록 초기화
      setCountryLists(prev => ({ ...prev, [index]: [] }));
    }
  };

  // 대륙 선택 시 국가 목록 업데이트
  const handleContinentChange = (index: number, continentCode: string) => {
    const countries = continentPlaces[continentCode] || [];
    setCountryLists(prev => ({ ...prev, [index]: countries }));
  };

  // step1에서 전달받은 데이터 로드
  useEffect(() => {
    const savedData = localStorage.getItem('longstayInsuranceStep1');
    let tourNumValue = 1;
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setStartDate(data.startDate || '');
        setStartHour(data.startHour || '01');
        setEndDate(data.endDate || '');
        setEndHour(data.endHour || '01');
        setTourContinent(data.tourContinent || '');
        setTourPlace(data.tourPlace || '');
        setTourGoal(data.tourGoal || '003');
        setTourNum(data.tourNum || 1);
        tourNumValue = data.tourNum || 1;
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
    
    // 초기 국적 타입 설정 (모두 내국인으로)
    const initialCountryTypes: { [key: number]: string } = {};
    for (let i = 1; i <= tourNumValue; i++) {
      initialCountryTypes[i] = 'D';
    }
    setCountryTypes(initialCountryTypes);
  }, []);

  useEffect(() => {
    const applyIfEmpty = (selector: string, value?: string | null) => {
      const element = document.querySelector(selector) as HTMLInputElement | null;
      if (element && value && !element.value) {
        element.value = value;
      }
    };

    const applySelectValue = (selector: string, value?: string | null) => {
      const element = document.querySelector(selector) as HTMLSelectElement | null;
      if (element && value) {
        element.value = value;
      }
    };

    const splitEmail = (email?: string | null) => {
      if (!email) return { id: '', domain: '' };
      const [id, domain] = email.split('@');
      return { id: id || '', domain: domain || '' };
    };

    const splitPhone = (phone?: string | null) => {
      if (!phone) return { part1: '', part2: '', part3: '' };
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 9) return { part1: '', part2: '', part3: '' };
      if (digits.length === 10) {
        return { part1: digits.slice(0, 3), part2: digits.slice(3, 6), part3: digits.slice(6, 10) };
      }
      return { part1: digits.slice(0, 3), part2: digits.slice(3, 7), part3: digits.slice(7, 11) };
    };

    const splitBusinessNumber = (businessNumber?: string | null) => {
      if (!businessNumber) return { part1: '', part2: '', part3: '' };
      const digits = businessNumber.replace(/\D/g, '');
      return {
        part1: digits.slice(0, 3),
        part2: digits.slice(3, 5),
        part3: digits.slice(5, 10),
      };
    };

    const loadCorporateInfo = async () => {
      if (!isLoggedIn || !member || member.member_type === '개인') return;

      try {
        const result = await getCorporateMemberInfo(member.id);
        if (!result.success || !result.corporate) return;

        const primaryContact = result.contacts?.find(contact => contact.is_primary) || result.contacts?.[0];
        const businessParts = splitBusinessNumber(result.corporate.business_number);
        const contactEmail = splitEmail(primaryContact?.email || member.email);
        const contactMobile = splitPhone(primaryContact?.mobile_phone || member.mobile_phone);

        applyIfEmpty('input[name="contract_company"]', result.corporate.company_name);
        applyIfEmpty('input[name="resno1"]', businessParts.part1);
        applyIfEmpty('input[name="resno2"]', businessParts.part2);
        applyIfEmpty('input[name="resno3"]', businessParts.part3);
        applyIfEmpty('input[name="charge"]', primaryContact?.contact_name);
        applyIfEmpty('input[name="position"]', primaryContact?.position);
        applySelectValue('select[name="contract_ctel_no1"]', contactMobile.part1);
        applyIfEmpty('input[name="contract_ctel_no2"]', contactMobile.part2);
        applyIfEmpty('input[name="contract_ctel_no3"]', contactMobile.part3);

        if (contactEmail.id || contactEmail.domain) {
          setEmail1(contactEmail.id);
          setEmail2(contactEmail.domain);
          applySelectValue('select[name="email2_sel"]', contactEmail.domain);
        }
      } catch (error) {
        console.error('법인 정보 조회 오류:', error);
      }
    };

    loadCorporateInfo();
  }, [isLoggedIn, member]);

  // 팝업창에서 엑셀 업로드 완료 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data && event.data.type === 'EXCEL_UPLOAD') {
        const newParticipants = event.data.participants as Participant[];
        
        // 엑셀 데이터로 피보험자 정보 입력 필드에 채우기
        const participantCount = newParticipants.length;
        
        // tourNum 업데이트 (엑셀 데이터 개수만큼)
        setTourNum(participantCount);
        
        // 국적 타입 초기화
        const updatedCountryTypes: { [key: number]: string } = {};
        newParticipants.forEach((participant, index) => {
          const fieldIndex = index + 1;
          updatedCountryTypes[fieldIndex] = participant.nationality === '외국인' ? 'F' : 'D';
        });
        setCountryTypes(updatedCountryTypes);
        
        // 엑셀 데이터를 상태에 저장 (useEffect에서 처리)
        setExcelParticipants(newParticipants);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 엑셀 업로드 후 입력 필드 채우기
  useEffect(() => {
    if (excelParticipants && excelParticipants.length > 0) {
      // DOM이 업데이트된 후 입력 필드에 값을 채우기 위해 약간의 지연
      setTimeout(() => {
        excelParticipants.forEach((participant, index) => {
          const fieldIndex = index + 1;
          
          // 이름 입력
          const nameInput = document.querySelector(`input[name="insured_name_${fieldIndex}"]`) as HTMLInputElement;
          if (nameInput) {
            nameInput.value = participant.name || '';
          }

          const engNameInput = document.querySelector(`input[name="insured_engname_${fieldIndex}"]`) as HTMLInputElement;
          if (engNameInput) {
            engNameInput.value = participant.englishName || '';
          }
          
          // 생년월일 입력 (내국인인 경우)
          if (participant.nationality === '내국인' && participant.birthDate) {
            const birthInput = document.querySelector(`input[name="birth_${fieldIndex}"]`) as HTMLInputElement;
            if (birthInput) {
              birthInput.value = participant.birthDate;
            }
            
            // 성별 라디오 버튼 선택
            const genderValue = participant.gender === '남자' ? '1' : '2';
            const genderRadio = document.querySelector(`input[name="gender_${fieldIndex}"][value="${genderValue}"]`) as HTMLInputElement;
            if (genderRadio) {
              genderRadio.checked = true;
            }
            
            // 국적을 내국인으로 설정
            const countryTypeSelect = document.querySelector(`select[name="country_type_${fieldIndex}"]`) as HTMLSelectElement;
            if (countryTypeSelect) {
              countryTypeSelect.value = 'D';
              handleCountryTypeChange(fieldIndex, 'D');
            }
          } else if (participant.nationality === '외국인' && participant.residentNumber) {
            // 외국인 등록번호 입력
            const ssn1Input = document.querySelector(`input[name="insured_ssn1_${fieldIndex}"]`) as HTMLInputElement;
            const ssn2Input = document.querySelector(`input[name="insured_ssn2_${fieldIndex}"]`) as HTMLInputElement;
            
            if (ssn1Input && ssn2Input) {
              const residentNumber = participant.residentNumber;
              ssn1Input.value = residentNumber.substring(0, 6);
              ssn2Input.value = residentNumber.substring(6, 13);
            }
            
            // 국적을 외국인으로 설정
            const countryTypeSelect = document.querySelector(`select[name="country_type_${fieldIndex}"]`) as HTMLSelectElement;
            if (countryTypeSelect) {
              countryTypeSelect.value = 'F';
              handleCountryTypeChange(fieldIndex, 'F');
            }
          }
        });
        
        // 처리 완료 후 초기화
        setExcelParticipants(null);
      }, 100);
    }
  }, [excelParticipants, tourNum]);

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

  const hasAnyForeigner = Array.from({ length: tourNum }, (_, i) => countryTypes[i + 1] || 'D').some((v) => v === 'F');

  const handleSubmit = async () => {
    if (hasAnyForeigner && !foreignerNoticeAgreed) {
      alert('외국인 가입 시 본국으로의 여행(경유포함)은 보험가입이 불가함을 확인하고 동의해 주세요.');
      return;
    }
    // 계약자(법인/단체) 정보 수집
    const contractCompanyInput = document.querySelector('input[name="contract_company"]') as HTMLInputElement;
    const resno1Input = document.querySelector('input[name="resno1"]') as HTMLInputElement;
    const resno2Input = document.querySelector('input[name="resno2"]') as HTMLInputElement;
    const resno3Input = document.querySelector('input[name="resno3"]') as HTMLInputElement;
    const chargeInput = document.querySelector('input[name="charge"]') as HTMLInputElement;
    const positionInput = document.querySelector('input[name="position"]') as HTMLInputElement;
    const telno1Input = document.querySelector('input[name="contract_telno1"]') as HTMLInputElement;
    const telno2Input = document.querySelector('input[name="contract_telno2"]') as HTMLInputElement;
    const telno3Input = document.querySelector('input[name="contract_telno3"]') as HTMLInputElement;
    const ctelNo1Select = document.querySelector('select[name="contract_ctel_no1"]') as HTMLSelectElement;
    const ctelNo2Input = document.querySelector('input[name="contract_ctel_no2"]') as HTMLInputElement;
    const ctelNo3Input = document.querySelector('input[name="contract_ctel_no3"]') as HTMLInputElement;
    const email2SelSelect = document.querySelector('select[name="email2_sel"]') as HTMLSelectElement;
    
    // ===== 계약자 정보 유효성 검사 =====
    // 법인(단체)명 검증
    if (!contractCompanyInput?.value || contractCompanyInput.value.trim() === '') {
      alert('법인(단체)명을 입력해주세요.');
      contractCompanyInput?.focus();
      return;
    }
    
    // 사업자번호 검증 (3-2-5 형식, 총 10자리)
    const resno1 = resno1Input?.value || '';
    const resno2 = resno2Input?.value || '';
    const resno3 = resno3Input?.value || '';
    if (resno1.length !== 3 || resno2.length !== 2 || resno3.length !== 5) {
      alert('사업자번호를 올바르게 입력해주세요. (3-2-5 형식)');
      if (resno1.length !== 3) {
        resno1Input?.focus();
      } else if (resno2.length !== 2) {
        resno2Input?.focus();
      } else {
        resno3Input?.focus();
      }
      return;
    }
    
    // 담당자명 검증
    if (!chargeInput?.value || chargeInput.value.trim() === '') {
      alert('담당자명을 입력해주세요.');
      chargeInput?.focus();
      return;
    }
    
    // 전화번호/핸드폰번호 검증 (둘 중 하나는 필수, 부분 입력 불가)
    const telno1 = telno1Input?.value || '';
    const telno2 = telno2Input?.value || '';
    const telno3 = telno3Input?.value || '';
    const ctelNo1 = ctelNo1Select?.value || '';
    const ctelNo2 = ctelNo2Input?.value || '';
    const ctelNo3 = ctelNo3Input?.value || '';

    const hasAnyTel = !!(telno1 || telno2 || telno3);
    const isTelComplete = !!(telno1 && telno2 && telno3);
    if (hasAnyTel && !isTelComplete) {
      alert('전화번호를 끝까지 입력해주세요.');
      if (!telno1) {
        telno1Input?.focus();
      } else if (!telno2) {
        telno2Input?.focus();
      } else {
        telno3Input?.focus();
      }
      return;
    }
    if (isTelComplete) {
      const telRegex = /^0\d{1,2}-\d{3,4}-\d{4}$/;
      if (!telRegex.test(`${telno1}-${telno2}-${telno3}`)) {
        alert('전화번호 형식이 올바르지 않습니다.');
        telno1Input?.focus();
        return;
      }
    }

    const hasAnyMobile = !!(ctelNo2 || ctelNo3);
    const isMobileComplete = !!(ctelNo1 && ctelNo2 && ctelNo3);
    if (hasAnyMobile && !isMobileComplete) {
      alert('핸드폰번호를 끝까지 입력해주세요.');
      if (!ctelNo2) {
        ctelNo2Input?.focus();
      } else {
        ctelNo3Input?.focus();
      }
      return;
    }
    if (isMobileComplete) {
      const mobileRegex = /^01\d-\d{3,4}-\d{4}$/;
      if (!mobileRegex.test(`${ctelNo1}-${ctelNo2}-${ctelNo3}`)) {
        alert('핸드폰번호 형식이 올바르지 않습니다.');
        ctelNo2Input?.focus();
        return;
      }
    }
    if (!isTelComplete && !isMobileComplete) {
      alert('전화번호 또는 핸드폰번호를 입력해주세요.');
      ctelNo2Input?.focus();
      return;
    }
    
    // 이메일 검증
    const emailDomain = email2SelSelect?.value || email2;
    const email = [email1, emailDomain].filter(v => v).join('@');
    if (!email1 || !emailDomain) {
      alert('이메일을 올바르게 입력해주세요.');
      if (!email1) {
        (document.querySelector('input[name="email1"]') as HTMLInputElement)?.focus();
      } else {
        (document.querySelector('input[name="email2"]') as HTMLInputElement)?.focus();
      }
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      (document.querySelector('input[name="email1"]') as HTMLInputElement)?.focus();
      return;
    }
    
    // 여행목적 코드를 insurance_type으로 매핑
    const getTravelPurpose = (goalCode: string): string => {
      switch (goalCode) {
        case '003': // 어학연수
          return '유학/어학연수';
        case '002': // 해외출장/주재원
        case '014': // 교환교수
          return '해외출장/주재원/교환교수';
        case '001': // 워킹홀리데이
          return '워킹홀리데이';
        default:
          return '유학/어학연수'; // 기본값
      }
    };

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const departureDateTime = startDate && startHour
      ? `${startDate} ${String(parseInt(startHour, 10) || 0).padStart(2, '0')}:00:00`
      : undefined;
    const fetchAvailablePlans = async (
      insuranceType: string,
      age: number,
      gender: string,
      options?: { birth_date?: string; departure_date?: string }
    ) => {
      const body: Record<string, unknown> = {
        insurance_type: insuranceType,
        age,
        gender,
        plan_variant: 'B',
        has_medical_expense: 1,
        include_foreign_currency: true,
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
        return data.plan_types as string[];
      }
      return [];
    };

    // ===== 피보험자 정보 유효성 검사 =====
    const validatedInsuredList: number[] = []; // 입력 완료된 인원 목록
    const incompleteInsuredList: number[] = []; // 입력 미완료 인원 목록
    
    for (let i = 1; i <= tourNum; i++) {
      const nameInput = document.querySelector(`input[name="insured_name_${i}"]`) as HTMLInputElement;
      const birthInput = document.querySelector(`input[name="birth_${i}"]`) as HTMLInputElement;
      const genderInput = document.querySelector(`input[name="gender_${i}"]:checked`) as HTMLInputElement;
      const countryTypeSelect = document.querySelector(`select[name="country_type_${i}"]`) as HTMLSelectElement;
      const ssn1Input = document.querySelector(`input[name="insured_ssn1_${i}"]`) as HTMLInputElement;
      const ssn2Input = document.querySelector(`input[name="insured_ssn2_${i}"]`) as HTMLInputElement;
      const country1Select = document.querySelector(`select[name="insured_country1_${i}"]`) as HTMLSelectElement;
      const country2Select = document.querySelector(`select[name="insured_country2_${i}"]`) as HTMLSelectElement;
      
      // 성명이 입력되지 않으면 해당 인원은 미입력으로 처리
      if (!nameInput?.value || nameInput.value.trim() === '') {
        incompleteInsuredList.push(i);
        continue;
      }
      
      const countryType = countryTypeSelect?.value || 'D';
      
      if (countryType === 'D') {
        // 내국인: 생년월일 검증 (8자리)
        if (!birthInput?.value || birthInput.value.length !== 8) {
          incompleteInsuredList.push(i);
          continue;
        }
        
        // 생년월일 형식/실제 날짜 검증 (YYYYMMDD)
        const insuredName = (nameInput?.value || '').trim() || `${i}번 가입자`;
        if (!isValidBirthDateYYYYMMDD(birthInput.value)) {
          alert(`${insuredName} 생년월일 잘못 입력 했습니다. 다시 확인 해주세요.`);
          birthInput?.focus();
          return;
        }
        
        // 성별 검증
        if (!genderInput) {
          incompleteInsuredList.push(i);
          continue;
        }
      } else {
        // 외국인: 외국인등록번호 검증 (앞 6자리 + 뒤 7자리)
        if (!ssn1Input?.value || ssn1Input.value.length !== 6) {
          incompleteInsuredList.push(i);
          continue;
        }
        
        if (!ssn2Input?.value || ssn2Input.value.length !== 7) {
          incompleteInsuredList.push(i);
          continue;
        }
        
        // 외국인 국적 검증
        if (!country1Select?.value || country1Select.value === '') {
          incompleteInsuredList.push(i);
          continue;
        }
        
        if (!country2Select?.value || country2Select.value === '') {
          incompleteInsuredList.push(i);
          continue;
        }
      }
      
      // 모든 필수 필드가 입력된 경우
      validatedInsuredList.push(i);
    }
    
    // 일부만 입력된 경우 확인 메시지 표시
    if (incompleteInsuredList.length > 0 && validatedInsuredList.length > 0) {
      const validatedCount = validatedInsuredList.length;
      const incompleteCount = incompleteInsuredList.length;
      const totalCount = tourNum;
      
      const confirmMessage = `${totalCount}명 중 ${validatedCount}명의 정보만 입력했고, ${incompleteCount}명은 입력을 안했습니다. 다음 단계 넘어갈까요?`;
      
      if (!confirm(confirmMessage)) {
        return; // 취소하면 진행하지 않음
      }
    } else if (validatedInsuredList.length === 0) {
      // 아무도 입력하지 않은 경우
      alert('최소 1명 이상의 가입자 정보를 입력해주세요.');
      const firstNameInput = document.querySelector('input[name="insured_name_1"]') as HTMLInputElement;
      firstNameInput?.focus();
      return;
    }
    
    // 사업자번호 합치기 (3-2-5 형식)
    const businessNumber = [resno1, resno2, resno3].join('-');
    
    // 전화번호 합치기
    const phone = [telno1, telno2, telno3].filter(v => v).join('-');
    
    // 핸드폰번호 합치기
    const mobilePhone = [ctelNo1, ctelNo2, ctelNo3].filter(v => v).join('-');
    
    // 피보험자 정보 수집 (입력 완료된 인원만 저장)
    const step2Data: any = {
      contractor_name: contractCompanyInput.value,
      contractor_business_number: businessNumber,
      contractor_contact_person: chargeInput.value,
      contractor_position: positionInput?.value || '',
      contractor_phone: phone || '',
      contractor_mobile_phone: mobilePhone || '',
      contractor_email: email,
      travel_purpose: getTravelPurpose(tourGoal),
    };
    
    // 입력 완료된 인원만 처리 (API 호출 및 저장)
    let savedIndex = 1; // 저장 시 사용할 인덱스 (1부터 시작)
    for (const i of validatedInsuredList) {
      const nameInput = document.querySelector(`input[name="insured_name_${i}"]`) as HTMLInputElement;
      const engNameInput = document.querySelector(`input[name="insured_engname_${i}"]`) as HTMLInputElement;
      const birthInput = document.querySelector(`input[name="birth_${i}"]`) as HTMLInputElement;
      const genderInput = document.querySelector(`input[name="gender_${i}"]:checked`) as HTMLInputElement;
      const countryTypeSelect = document.querySelector(`select[name="country_type_${i}"]`) as HTMLSelectElement;
      const ssn1Input = document.querySelector(`input[name="insured_ssn1_${i}"]`) as HTMLInputElement;
      const ssn2Input = document.querySelector(`input[name="insured_ssn2_${i}"]`) as HTMLInputElement;
      const country1Select = document.querySelector(`select[name="insured_country1_${i}"]`) as HTMLSelectElement;
      const country2Select = document.querySelector(`select[name="insured_country2_${i}"]`) as HTMLSelectElement;
      
      step2Data[`insured_name_${savedIndex}`] = nameInput.value;
      
      // 영문 이름 저장
      if (engNameInput) {
        step2Data[`insured_engname_${savedIndex}`] = engNameInput.value;
      }
      
      const countryType = countryTypeSelect?.value || 'D';
      step2Data[`insured_country_type_${savedIndex}`] = countryType;
      
      if (countryType === 'D') {
        // 내국인: 생년월일 저장
        step2Data[`insured_birth_${savedIndex}`] = birthInput.value;
        
        // 성별 저장 (1 -> '남자', 2 -> '여자')
        const genderValue = genderInput.value === '1' ? '남자' : '여자';
        step2Data[`insured_gender_${savedIndex}`] = genderValue;
        
        // 생년월일(8자리)과 성별(1,2,3,4)을 조합하여 주민번호 앞 7자리 생성
        const birth = birthInput.value; // 예: 19880818
        const genderCode = genderInput.value; // 1: 남자, 2: 여자
        
        // 생년월일 뒤 6자리 (YYMMDD)
        const birthSuffix = birth.substring(2, 8);
        
        // 생년에 따라 성별코드 결정
        const birthYear = parseInt(birth.substring(0, 4));
        let finalGenderCode = genderCode;
        
        if (birthYear >= 2000) {
          // 2000년대생
          finalGenderCode = genderCode === '1' ? '3' : '4';
        } else {
          // 1900년대생
          finalGenderCode = genderCode === '1' ? '1' : '2';
        }
        
        // 주민번호 앞 7자리 (YYMMDD + 성별코드)
        step2Data[`insured_ssn_${savedIndex}`] = birthSuffix + finalGenderCode;
        
        // API 호출하여 플랜 확인
        const birthValue = birthInput.value;
        const birthYear2 = parseInt(birthValue.substring(0, 4));
        const birthMonth = parseInt(birthValue.substring(4, 6));
        const birthDay = parseInt(birthValue.substring(6, 8));
        const today = new Date();
        let age = today.getFullYear() - birthYear2;
        if (today.getMonth() + 1 < birthMonth || (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)) {
          age--;
        }

        try {
          const planTypes = await fetchAvailablePlans(getTravelPurpose(tourGoal), age, genderValue, {
            birth_date: birthValue,
            departure_date: departureDateTime,
          });
          if (!planTypes.length) {
            alert(`${i}번 피보험자는 가입 가능한 보험상품이 없습니다.`);
            return;
          }
        } catch (error) {
          console.error('플랜 목록 조회 실패:', error);
          alert('플랜 목록 조회 중 오류가 발생했습니다.');
          return;
        }
      } else {
        // 외국인: 주민등록번호 저장
        step2Data[`insured_ssn1_${savedIndex}`] = ssn1Input.value;
        step2Data[`insured_ssn2_${savedIndex}`] = ssn2Input.value;
        
        // 외국인 국적 저장
        step2Data[`insured_country1_${savedIndex}`] = country1Select.value;
        step2Data[`insured_country2_${savedIndex}`] = country2Select.value;
      }
      
      savedIndex++;
    }
    
    // 실제 저장된 인원 수 저장
    step2Data.actual_insured_count = validatedInsuredList.length;
    
    // step1의 tourNum을 실제 입력된 인원 수로 업데이트 (입력 안된 인원 데이터 강제 삭제)
    const step1Data = localStorage.getItem('longstayInsuranceStep1');
    if (step1Data) {
      try {
        const step1Parsed = JSON.parse(step1Data);
        step1Parsed.tourNum = validatedInsuredList.length; // 실제 입력된 인원 수로 업데이트
        localStorage.setItem('longstayInsuranceStep1', JSON.stringify(step1Parsed));
      } catch (error) {
        console.error('Failed to update step1 data:', error);
      }
    }
    
    // localStorage에 저장
    localStorage.setItem('longstayInsuranceStep2', JSON.stringify(step2Data));
    
    // 3단계 페이지로 이동
    window.location.href = '/group-insurance/longstay/step3';
  };

  const handleBack = () => {
    window.history.back();
  };

  const changeTourNum = (newNum: number) => {
    setTourNum(newNum);
    
    // 새로운 인원에 대한 국적 타입 초기화
    const updatedCountryTypes: { [key: number]: string } = {};
    for (let i = 1; i <= newNum; i++) {
      updatedCountryTypes[i] = countryTypes[i] || 'D';
    }
    setCountryTypes(updatedCountryTypes);
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
          <a className="close" href="#" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ top: 8 }}>닫기</a>
        </div>
      </section>

      <div className="speed_content">
        <div className="con01">
          <div className="tour2023_pc_menu_wrap tourG_mat05 tourG_mab05">
            <span className="menu"><a href="javascript:void(0);">국내여행자보험</a></span>
            <span className="menu"><a href="javascript:void(0);">해외여행자보험</a></span>
            <span className="menu on"><a href="javascript:void(0);">해외장기체류보험</a></span>
          </div>
        </div>

        <div className="con01">
          <div className="tour2023_pc_SpeedTop_line01">
            <span className="tour2023_pc_SpeedTop_title05">2단계 : 가입자 정보 입력</span>
          </div>
          <form name="inputForm" method="POST">
            <div className="bgcolor_white">
              {/* 2단계에서는 여행보험 기본정보 변경 불가 (1단계에서 세팅한 데이터 사용)
              <h2 className="sub_title pt30 ag_left">여행보험 기본정보</h2>
              <div className="detailView01 bgcolor_white">
                <table className="specialB" border={1} cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                  <caption>최근 여행보험 가입내역</caption>
                  <colgroup>
                    <col width="23%" />
                    <col width="77%" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="sName ag_left">출발일시</td>
                      <td className="ddT ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_48" style={{ position: 'relative', overflow: 'visible' }}>
                            <DatePicker
                              selected={startDate ? parseDate(startDate) : null}
                              onChange={(date: Date | null) => {
                                if (date) {
                                  const formattedDate = formatDate(date);
                                  setStartDate(formattedDate);
                                  setHasSelectedStartDate(true);
                                } else {
                                  setStartDate('');
                                  setHasSelectedStartDate(false);
                                }
                              }}
                              onSelect={(date: Date | null) => {
                                if (date) {
                                  const formattedDate = formatDate(date);
                                  setStartDate(formattedDate);
                                  setHasSelectedStartDate(true);
                                }
                              }}
                              dateFormat="yyyy-MM-dd"
                              formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                              locale="ko"
                              placeholderText="날짜 선택"
                              dateFormatCalendar="yyyy년 MM월"
                              className={`tf_g dicon ${hasSelectedStartDate ? 'has-value' : ''}`}
                              wrapperClassName="date-picker-wrapper"
                              calendarClassName="custom-calendar"
                              popperClassName="custom-popper"
                              minDate={new Date()}
                              showPopperArrow={false}
                              popperPlacement="bottom-start"
                              shouldCloseOnSelect={true}
                              strictParsing
                            />
                          </div>
                          <div className="bg_join input_cell_01 wd_48 ml10">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="start_hour"
                                value={startHour}
                                onChange={(e) => setStartHour(e.target.value)}
                              >
                                {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                  <option key={h} value={String(h).padStart(2, '0')}>{h}시</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">도착일시</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_48" style={{ position: 'relative', overflow: 'visible' }}>
                            <DatePicker
                              selected={endDate ? parseDate(endDate) : null}
                              onChange={(date: Date | null) => {
                                if (date) {
                                  const formattedDate = formatDate(date);
                                  setEndDate(formattedDate);
                                  setHasSelectedEndDate(true);
                                } else {
                                  setEndDate('');
                                  setHasSelectedEndDate(false);
                                }
                              }}
                              onSelect={(date: Date | null) => {
                                if (date) {
                                  const formattedDate = formatDate(date);
                                  setEndDate(formattedDate);
                                  setHasSelectedEndDate(true);
                                }
                              }}
                              dateFormat="yyyy-MM-dd"
                              formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                              locale="ko"
                              placeholderText="날짜 선택"
                              dateFormatCalendar="yyyy년 MM월"
                              className={`tf_g dicon ${hasSelectedEndDate ? 'has-value' : ''}`}
                              wrapperClassName="date-picker-wrapper"
                              calendarClassName="custom-calendar"
                              popperClassName="custom-popper"
                              minDate={startDate ? (parseDate(startDate) || new Date()) : new Date()}
                              showPopperArrow={false}
                              popperPlacement="bottom-start"
                              shouldCloseOnSelect={true}
                              strictParsing
                            />
                          </div>
                          <div className="bg_join input_cell_01 wd_48 ml10">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="end_hour"
                                value={endHour}
                                onChange={(e) => setEndHour(e.target.value)}
                              >
                                {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                  <option key={h} value={String(h).padStart(2, '0')}>{h}시</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">여행지</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_48">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="tour_continent"
                                value={tourContinent}
                                onChange={(e) => {
                                  setTourContinent(e.target.value);
                                  setTourPlace(''); // 대륙 변경 시 국가 초기화
                                }}
                              >
                                <option value="">선택</option>
                                <option value="EU">유럽</option>
                                <option value="AS">아시아</option>
                                <option value="AF">아프리카</option>
                                <option value="AU">오세아니아</option>
                                <option value="NA">북아메리카</option>
                                <option value="SA">남아메리카</option>
                              </select>
                            </span>
                          </div>
                          <div className="bg_join input_cell_01 wd_48 ml10">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="tour_place"
                                value={tourPlace}
                                onChange={(e) => setTourPlace(e.target.value)}
                                disabled={!tourContinent}
                              >
                                <option value="">선택</option>
                                {tourContinent && continentPlaces[tourContinent]?.map(place => (
                                  <option key={place.value} value={place.value}>{place.label}</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">여행목적</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_50">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="tour_goal"
                                value={tourGoal}
                                onChange={(e) => setTourGoal(e.target.value)}
                              >
                                <option value="">선택하세요</option>
                                <option value="003">어학연수</option>
                                <option value="002">해외출장/주재원</option>
                                <option value="014">교환교수</option>
                                <option value="000">기타</option>
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">인원</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_50">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="select_tour_num"
                                value={tourNum}
                                onChange={(e) => changeTourNum(Number(e.target.value))}
                              >
                                {Array.from({ length: 250 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>{n}명</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              */}

              <div id="contractor_info">
                <div id="top_title">
                  <h2 className="sub_title pt30 ag_left">계약자 정보 입력</h2>
                </div>
                <div className="detailView01 bgcolor_white">
                  <table className="specialB" border={1} cellSpacing="0">
                    <caption>계약자 정보</caption>
                    <colgroup>
                      <col width="14%" />
                      <col width="*" />
                      <col width="13%" />
                      <col width="*" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="sName ag_left">법인(단체)명</td>
                        <td className="ddT ag_left box line_04 bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_100">
                              <input type="text" maxLength={20} className="tf_g" name="contract_company" />
                            </div>
                          </div>
                        </td>
                        <td className="sName ag_left">사업자번호</td>
                        <td className="ddT ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_48">
                              <input
                                ref={resno1Ref}
                                type="tel"
                                maxLength={3}
                                className="tf_g"
                                name="resno1"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                  if (v.length >= 3) resno2Ref.current?.focus();
                                }}
                              />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_48">
                              <input
                                ref={resno2Ref}
                                type="tel"
                                maxLength={2}
                                className="tf_g"
                                name="resno2"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                  if (v.length >= 2) resno3Ref.current?.focus();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) resno1Ref.current?.focus();
                                }}
                              />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_48">
                              <input
                                ref={resno3Ref}
                                type="tel"
                                maxLength={5}
                                className="tf_g"
                                name="resno3"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) resno2Ref.current?.focus();
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="sName01 ag_left">담당자명</td>
                        <td className="ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_100">
                              <input type="text" maxLength={20} className="tf_g" name="charge" />
                            </div>
                          </div>
                        </td>
                        <td className="sName01 ag_left">직급/직책</td>
                        <td className="dd ag_left box">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_100">
                              <input type="text" maxLength={10} className="tf_g" name="position" />
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="sName01 ag_left">전화번호</td>
                        <td className="ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_32">
                              <input
                                ref={telno1Ref}
                                type="tel"
                                maxLength={4}
                                className="tf_g"
                                name="contract_telno1"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                  if (v.length >= 4) telno2Ref.current?.focus();
                                }}
                              />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input
                                ref={telno2Ref}
                                type="tel"
                                maxLength={4}
                                className="tf_g"
                                name="contract_telno2"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                  if (v.length >= 4) telno3Ref.current?.focus();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) telno1Ref.current?.focus();
                                }}
                              />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input
                                ref={telno3Ref}
                                type="tel"
                                maxLength={4}
                                className="tf_g"
                                name="contract_telno3"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) telno2Ref.current?.focus();
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="sName01 ag_left">핸드폰번호</td>
                        <td className="ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_32">
                              <span className="ps_box02 wd_100">
                                <select
                                  ref={ctelNo1Ref}
                                  className="sel01"
                                  name="contract_ctel_no1"
                                  onChange={() => ctelNo2Ref.current?.focus()}
                                >
                                  <option value="010">010</option>
                                  <option value="011">011</option>
                                  <option value="016">016</option>
                                  <option value="017">017</option>
                                  <option value="018">018</option>
                                  <option value="019">019</option>
                                </select>
                              </span>
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input
                                ref={ctelNo2Ref}
                                type="tel"
                                maxLength={4}
                                className="tf_g"
                                name="contract_ctel_no2"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                  if (v.length >= 4) ctelNo3Ref.current?.focus();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) ctelNo1Ref.current?.focus();
                                }}
                              />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input
                                ref={ctelNo3Ref}
                                type="tel"
                                maxLength={4}
                                className="tf_g"
                                name="contract_ctel_no3"
                                inputMode="numeric"
                                onInput={(e) => {
                                  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
                                  (e.target as HTMLInputElement).value = v;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) ctelNo2Ref.current?.focus();
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="sName01 ag_left">이메일</td>
                        <td colSpan={3} className="dd ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_32">
                              <input 
                                type="text" 
                                maxLength={15} 
                                className="tf_g" 
                                name="email1"
                                value={email1}
                                onChange={(e) => setEmail1(e.target.value)}
                              />
                            </div>
                            <span className="fff-bar"> @ </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input 
                                type="text" 
                                maxLength={25} 
                                className="tf_g" 
                                name="email2"
                                value={email2}
                                onChange={(e) => setEmail2(e.target.value)}
                              />
                            </div>
                            <div className="bg_join input_cell_01 wd_30">
                              <span className="ps_box02 wd_100">
                                <select 
                                  className="sel01" 
                                  name="email2_sel"
                                  onChange={(e) => handleEmailDomainChange(e.target.value)}
                                >
                                  <option value="">직접입력</option>
                                  <option value="naver.com">naver.com</option>
                                  <option value="gmail.com">gmail.com</option>
                                  <option value="daum.net">daum.net</option>
                                  <option value="hanmail.net">hanmail.net</option>
                                  <option value="nate.com">nate.com</option>
                                </select>
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="insured_people_area_2">
                <h2 className="sub_title pt30 ag_left" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>가입자(피보험자) 정보 입력</span>
                  <button
                    type="button"
                    onClick={() => {
                      const width = 650;
                      const height = 700;
                      const left = (window.screen.width - width) / 2;
                      const top = (window.screen.height - height) / 2;
                      window.open(
                        '/group-insurance/longstay/step2/excel-upload',
                        'excelUpload',
                        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
                      );
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#4d60d6',
                    }}
                  >
                    <img 
                      src="/images/excel-icon.png" 
                      alt="엑셀 아이콘" 
                      style={{ width: '20px', height: '20px' }}
                    />
                  </button>
                </h2>
                <div className="detailView01 bgcolor_white">
                  <table className="specialB" border={1} cellSpacing="0">
                    <caption>동반자(피보험자) 정보</caption>
                    <colgroup>
                      <col width="7%" />
                      <col width="15%" />
                      <col width="17%" />
                      <col width="34%" />
                      <col width="15%" />
                    </colgroup>
                    <tbody id="insured_people_area">
                      <tr>
                        <td className="sName ag_center">순번</td>
                        <td className="sName ag_center">성명</td>
                        <td className="sName ag_center">영문이름</td>
                        <td className="sName ag_center">생년월일 / 성별</td>
                        <td className="sName ag_center">국적</td>
                      </tr>
                      {Array.from({ length: tourNum }, (_, i) => {
                        const index = i + 1;
                        const countryType = countryTypes[index] || 'D';
                        const countryList = countryLists[index] || [];
                        const isForeigner = countryType === 'F';
                        
                        return (
                          <React.Fragment key={i}>
                            <tr>
                              <td className="ag_center line_03" rowSpan={isForeigner ? 2 : 2}>{index}</td>
                              <td className="ag_center box line_03 bgcolor_red">
                                <div className="in_wrap01">
                                  <div className="bg_join input_cell_01">
                                    <input type="text" maxLength={15} className="tf_g" name={`insured_name_${index}`} style={{ imeMode: 'active' }} />
                                  </div>
                                </div>
                              </td>
                              <td className="ag_center box line_03">
                                <div className="in_wrap01">
                                  <div className="bg_join input_cell_01">
                                    <input type="text" maxLength={25} className="tf_g" name={`insured_engname_${index}`} style={{ imeMode: 'disabled' }} />
                                  </div>
                                </div>
                              </td>
                              <td className="ag_center box line_03 bgcolor_red" id={`birth_area_${index}`} style={{ display: isForeigner ? 'none' : '' }}>
                                <div className="in_wrap01" style={{ alignItems: 'center' }}>
                                  <div className="bg_join input_cell_01 wd_45">
                                    <input type="text" maxLength={8} className="tf_g" name={`birth_${index}`} id={`birth_${index}`} placeholder="19880818" />
                                  </div>
                                  <div className="btn_group_02">
                                    <input type="radio" id={`gender_M_${index}`} value="1" name={`gender_${index}`} defaultChecked />
                                    <label htmlFor={`gender_M_${index}`} className="nomal_btn">
                                      <div className="nomal_btn_txt">남자</div>
                                    </label>
                                    <input type="radio" id={`gender_W_${index}`} value="2" name={`gender_${index}`} />
                                    <label htmlFor={`gender_W_${index}`} className="nomal_btn">
                                      <div className="nomal_btn_txt">여자</div>
                                    </label>
                                  </div>
                                </div>
                              </td>
                              <td className="ag_center box line_03 bgcolor_red" id={`jumin_area_${index}`} style={{ display: isForeigner ? '' : 'none' }}>
                                <div className="in_wrap01">
                                  <div className="bg_join input_cell_01">
                                    <input type="tel" maxLength={6} className="tf_g" name={`insured_ssn1_${index}`} id={`insured_ssn1_${index}`} placeholder={isForeigner ? '외국인등록번호' : '주민등록번호'} />
                                  </div>
                                  <span className="fff-bar"> - </span>
                                  <div className="bg_join input_cell_01">
                                    <input type="password" maxLength={7} className="tf_g" name={`insured_ssn2_${index}`} id={`insured_ssn2_${index}`} />
                                  </div>
                                </div>
                              </td>
                              <td className="ag_center box line_03">
                                <div className="in_wrap01">
                                  <div className="bg_join input_cell_01 wd_100">
                                    <span className="ps_box02 wd_100">
                                      <select 
                                        className="sel01" 
                                        name={`country_type_${index}`}
                                        value={countryType}
                                        onChange={(e) => handleCountryTypeChange(index, e.target.value)}
                                      >
                                        <option value="D">내국인</option>
                                        <option value="F">외국인</option>
                                      </select>
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {isForeigner && (
                              <tr id={`insured_person_${i}_2`}>
                                <td className="ag_center box line_03">
                                  <div className="in_wrap01" style={{ padding: '0px 0px 0px 20%' }}>국적입력</div>
                                </td>
                                <td className="ag_center box bgcolor_red" colSpan={3}>
                                  <div className="in_wrap01">
                                    <div className="bg_join input_cell_01 wd_48">
                                      <span className="ps_box02 wd_100">
                                        <select 
                                          className="sel01" 
                                          name={`insured_country1_${index}`}
                                          onChange={(e) => handleContinentChange(index, e.target.value)}
                                        >
                                          <option value="">선택</option>
                                          <option value="EU">유럽</option>
                                          <option value="AS">아시아</option>
                                          <option value="AF">아프리카</option>
                                          <option value="AU">오세아니아</option>
                                          <option value="NA">북아메리카</option>
                                          <option value="SA">남아메리카</option>
                                        </select>
                                      </span>
                                    </div>
                                    <div className="bg_join input_cell_01 wd_48 ml10">
                                      <span className="ps_box02 wd_100">
                                        <select className="sel01" name={`insured_country2_${index}`}>
                                          <option value="">선택</option>
                                          {countryList.map((country) => (
                                            <option key={country.value} value={country.value}>
                                              {country.label}
                                            </option>
                                          ))}
                                        </select>
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            {!isForeigner && <tr></tr>}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="login_Btxt box01">
                  <dl>
                    <dd className="font_red">영문증서가 필요한 경우에는 영문이름을 입력해 주시기 바랍니다.</dd>
                    <dd className="font_gray">외국인은 외국인 등록번호가 있어야 보험가입이 가능합니다.</dd>
                    <dd className="font_gray">외국인이 본국으로 여행하는 경우 보험에 가입하실 수 없습니다.</dd>
                    <dd className="font_gray">여행자보험은 여행기간(보험기간)중 발생한 사고를 보장하는 보험입니다. 현재 치료중이거나 보험기간 이전 과거 상병으로 인한 치료는 보상받으실 수 없으며, 이를 보험계약시 알리지 않았다면 보상에 제한받으실 수도 있습니다.</dd>
                  </dl>
                </div>
              </div>
            </div>
          </form>

          {hasAnyForeigner && (
            <div className="foreigner-notice-agree" style={{ marginTop: '20px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={foreignerNoticeAgreed}
                  onChange={(e) => setForeignerNoticeAgreed(e.target.checked)}
                  style={{ marginTop: '3px', flexShrink: 0 }}
                />
                <span>외국인 가입 시 본국으로의 여행(경유포함)은 보험가입이 불가 합니다.</span>
              </label>
            </div>
          )}

          <div className="con_btnWrap mt30 mb10">
            <a href="#" onClick={(e) => { e.preventDefault(); handleSubmit(); }}>다음단계</a>
          </div>
          <div className="con_btnWrap_b mb40">
            <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>이전단계</a>
          </div>
        </div>

        <section className="ss_number_w">
          <div className="ss_number">
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </div>
        </section>
      </div>
    </div>
  );
}

