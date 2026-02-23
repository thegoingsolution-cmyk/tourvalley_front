'use client';

import React, { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
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

export default function DomesticInsuranceStep2Page() {
  const { isLoggedIn, member, isLoading } = useAuth();
  const [corporateName, setCorporateName] = useState<string | null>(null);
  // Form states
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('01');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('01');
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [hasSelectedEndDate, setHasSelectedEndDate] = useState(false);
  const [tourGoal, setTourGoal] = useState('');
  const [tourNum, setTourNum] = useState(1);
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  // 외국인 선택 상태 관리 (각 피보험자별)
  const [countryTypes, setCountryTypes] = useState<{ [key: number]: string }>({});
  // 대륙별 국가 목록 (각 피보험자별)
  const [countryLists, setCountryLists] = useState<{ [key: number]: { value: string; label: string }[] }>({});
  // 사업자번호 입력칸 자동 포커스 이동용 ref
  const resno1Ref = useRef<HTMLInputElement>(null);
  const resno2Ref = useRef<HTMLInputElement>(null);
  const resno3Ref = useRef<HTMLInputElement>(null);
  const telno1Ref = useRef<HTMLInputElement>(null);
  const telno2Ref = useRef<HTMLInputElement>(null);
  const telno3Ref = useRef<HTMLInputElement>(null);
  const ctelNo1Ref = useRef<HTMLSelectElement>(null);
  const ctelNo2Ref = useRef<HTMLInputElement>(null);
  const ctelNo3Ref = useRef<HTMLInputElement>(null);

  // 대륙별 국가 목록 (해외 step2와 동일)
  const continentPlaces: { [key: string]: { value: string; label: string }[] } = {
    EU: [
      { value: 'DE', label: '독일' }, { value: 'FR', label: '프랑스' }, { value: 'GB', label: '영국' },
      { value: 'IT', label: '이탈리아' }, { value: 'ES', label: '스페인' }, { value: 'NL', label: '네덜란드' },
      { value: 'BE', label: '벨기에' }, { value: 'CH', label: '스위스' }, { value: 'AT', label: '오스트리아' },
      { value: 'GR', label: '그리스' }, { value: 'PT', label: '포르투갈' }, { value: 'CZ', label: '체코' },
      { value: 'PL', label: '폴란드' }, { value: 'HU', label: '헝가리' }, { value: 'SE', label: '스웨덴' },
      { value: 'NO', label: '노르웨이' }, { value: 'DK', label: '덴마크' }, { value: 'FI', label: '핀란드' },
      { value: 'RU', label: '러시아' },
    ],
    AS: [
      { value: 'JP', label: '일본' }, { value: 'CN', label: '중국' }, { value: 'TW', label: '대만' },
      { value: 'HK', label: '홍콩' }, { value: 'SG', label: '싱가포르' }, { value: 'TH', label: '태국' },
      { value: 'VN', label: '베트남' }, { value: 'PH', label: '필리핀' }, { value: 'ID', label: '인도네시아' },
      { value: 'MY', label: '말레이시아' }, { value: 'IN', label: '인도' }, { value: 'MN', label: '몽골' },
      { value: 'KZ', label: '카자흐스탄' }, { value: 'UZ', label: '우즈베키스탄' },
    ],
    AF: [
      { value: 'ZA', label: '남아프리카공화국' }, { value: 'EG', label: '이집트' }, { value: 'MA', label: '모로코' },
      { value: 'KE', label: '케냐' }, { value: 'TZ', label: '탄자니아' },
    ],
    AU: [
      { value: 'AU', label: '호주' }, { value: 'NZ', label: '뉴질랜드' }, { value: 'FJ', label: '피지' },
      { value: 'PG', label: '파푸아뉴기니' },
    ],
    NA: [
      { value: 'US', label: '미국' }, { value: 'CA', label: '캐나다' }, { value: 'MX', label: '멕시코' },
      { value: 'CU', label: '쿠바' },
    ],
    SA: [
      { value: 'BR', label: '브라질' }, { value: 'AR', label: '아르헨티나' }, { value: 'CL', label: '칠레' },
      { value: 'PE', label: '페루' }, { value: 'CO', label: '콜롬비아' },
    ],
  };

  // 국적 타입 변경 핸들러
  const handleCountryTypeChange = (index: number, value: string) => {
    setCountryTypes(prev => ({ ...prev, [index]: value }));
    if (value === 'F') {
      setCountryLists(prev => ({ ...prev, [index]: [] }));
    }
  };

  // 대륙 선택 시 국가 목록 업데이트
  const handleContinentChange = (index: number, continentCode: string) => {
    const countries = continentPlaces[continentCode] || [];
    setCountryLists(prev => ({ ...prev, [index]: countries }));
  };

  // 이메일 도메인 선택 핸들러
  const handleEmailDomainChange = (value: string) => {
    setEmail2(value);
  };

  // step1에서 전달받은 데이터 로드
  useEffect(() => {
    const savedData = localStorage.getItem('domesticInsuranceStep1');
    let tourNumValue = 1;
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setStartDate(data.startDate || '');
        setStartHour(data.startHour || '01');
        setEndDate(data.endDate || '');
        setEndHour(data.endHour || '01');
        setTourGoal(data.tourGoal || '');
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

  const handleSubmit = () => {
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
    
    // 사업자번호 합치기 (3-2-5 형식)
    const businessNumber = [resno1Input?.value || '', resno2Input?.value || '', resno3Input?.value || '']
      .filter(v => v).join('-');
    
    // 전화번호 합치기
    const phone = [telno1Input?.value || '', telno2Input?.value || '', telno3Input?.value || '']
      .filter(v => v).join('-');
    
    // 핸드폰번호 합치기
    const mobilePhone = [
      ctelNo1Select?.value || '', 
      ctelNo2Input?.value || '', 
      ctelNo3Input?.value || ''
    ].filter(v => v).join('-');
    
    // 이메일 합치기
    const emailDomain = email2SelSelect?.value || email2;
    const email = [email1, emailDomain].filter(v => v).join('@');
    
    // 피보험자 정보 수집
    const step2Data: any = {
      contractor_name: contractCompanyInput?.value || '',
      contractor_business_number: businessNumber || '',
      contractor_contact_person: chargeInput?.value || '',
      contractor_position: positionInput?.value || '',
      contractor_phone: phone || '',
      contractor_mobile_phone: mobilePhone || '',
      contractor_email: email || '',
    };
    
    for (let i = 1; i <= tourNum; i++) {
      const nameInput = document.querySelector(`input[name="insured_name_${i}"]`) as HTMLInputElement;
      const engNameInput = document.querySelector(`input[name="insured_engname_${i}"]`) as HTMLInputElement;
      const birthInput = document.querySelector(`input[name="birth_${i}"]`) as HTMLInputElement;
      const genderInput = document.querySelector(`input[name="gender_${i}"]:checked`) as HTMLInputElement;
      const countryTypeSelect = document.querySelector(`select[name="country_type_${i}"]`) as HTMLSelectElement;
      const ssn1Input = document.querySelector(`input[name="insured_ssn1_${i}"]`) as HTMLInputElement;
      const ssn2Input = document.querySelector(`input[name="insured_ssn2_${i}"]`) as HTMLInputElement;
      const country1Select = document.querySelector(`select[name="insured_country1_${i}"]`) as HTMLSelectElement;
      const country2Select = document.querySelector(`select[name="insured_country2_${i}"]`) as HTMLSelectElement;
      
      if (nameInput) {
        step2Data[`insured_name_${i}`] = nameInput.value;
      }
      
      // 영문 이름 저장
      if (engNameInput) {
        step2Data[`insured_engname_${i}`] = engNameInput.value;
      }
      
      const countryType = countryTypeSelect?.value || 'D';
      step2Data[`insured_country_type_${i}`] = countryType;
      
      if (countryType === 'D') {
        // 내국인: 생년월일, 성별, 주민번호
        if (birthInput && birthInput.value) {
          step2Data[`insured_birth_${i}`] = birthInput.value;
        }
        if (genderInput) {
          const genderValue = genderInput.value === '1' ? '남자' : '여자';
          step2Data[`insured_gender_${i}`] = genderValue;
        }
        if (birthInput && genderInput && birthInput.value.length === 8) {
          const birth = birthInput.value;
          const genderCode = genderInput.value;
          const birthSuffix = birth.substring(2, 8);
          const birthYear = parseInt(birth.substring(0, 4));
          let finalGenderCode = genderCode;
          if (birthYear >= 2000) {
            finalGenderCode = genderCode === '1' ? '3' : '4';
          } else {
            finalGenderCode = genderCode === '1' ? '1' : '2';
          }
          step2Data[`insured_ssn_${i}`] = birthSuffix + finalGenderCode;
        }
      } else {
        // 외국인: 주민등록번호, 국적
        if (ssn1Input && ssn2Input) {
          step2Data[`insured_ssn1_${i}`] = ssn1Input.value;
          step2Data[`insured_ssn2_${i}`] = ssn2Input.value;
        }
        if (country1Select) {
          step2Data[`insured_country1_${i}`] = country1Select.value;
        }
        if (country2Select) {
          step2Data[`insured_country2_${i}`] = country2Select.value;
        }
      }
    }
    
    
    // localStorage에 저장
    localStorage.setItem('domesticInsuranceStep2', JSON.stringify(step2Data));
    
    // 3단계 페이지로 이동
    window.location.href = '/group-insurance/domestic/step3';
  };

  const handleBack = () => {
    window.history.back();
  };

  const changeTourNum = (newNum: number) => {
    setTourNum(newNum);
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
            <span className="menu on"><a href="javascript:void(0);">국내여행자보험</a></span>
            <span className="menu"><a href="javascript:void(0);">해외여행자보험</a></span>
            <span className="menu"><a href="javascript:void(0);">해외장기체류보험</a></span>
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
                      <td className="dd ag_left box">전국일원</td>
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
                                <option value="">선택해 주세요</option>
                                <option value="001">일반관광</option>
                                <option value="013">래프팅</option>
                                <option value="006">스키/스노보드</option>
                                <option value="002">출장/연수/교육(체험학습)</option>
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
                <h2 className="sub_title pt30 ag_left">가입자(피보험자) 정보 입력</h2>
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
                    <dd className="font_gray">여행자보험은 여행기간(보험기간)중 발생한 사고를 보장하는 보험입니다. 현재 치료중이거나 보험기간 이전 과거 상병으로 인한 치료는 보상받으실 수 없으며, 이를 보험계약시 알리지 않았다면 보상에 제한받으실 수도 있습니다.</dd>
                  </dl>
                </div>
              </div>
            </div>
          </form>

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
            준법감시필 제2025-광고T-001(2025.01.30-2026-01.29)
          </div>
        </section>
      </div>
    </div>
  );
}

