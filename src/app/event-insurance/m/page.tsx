'use client';

import React, { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { checkAndSaveTrackingInfo, getTrackingInfo } from '@/utils/tracking';
import './page.css';

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

export default function MobileEventInsurancePage() {
  useEffect(() => {
    checkAndSaveTrackingInfo();
  }, []);

  // Get today's date in YYYY-MM-DD format (Korea timezone)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;

  // Get current hour + 2 hours (default time)
  // 예: 오후 10시 5분이면 +2시간 = 24시, 오후 11시 3분이면 +2시간 = 01시
  const getDefaultHour = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const calculatedHour = currentHour + 2;
    // 24시가 되면 24로 유지, 25시 이상이면 1시부터 시작 (0시는 없음)
    const defaultHour = calculatedHour === 24 ? 24 : (calculatedHour > 24 ? calculatedHour % 24 || 24 : calculatedHour);
    return String(defaultHour).padStart(2, '0');
  };

  const [formData, setFormData] = useState({
    contractor_name: '',
    resno1: '',
    resno2: '',
    resno3: '',
    incharge: '',
    ctel_no: '',
    tel_no: '',
    email1: '',
    email2: '',
    select_email: '',
    event_name: '',
    start_date: todayString,
    start_hour: getDefaultHour(),
    end_date: todayString,
    end_hour: getDefaultHour(),
    insured_cnt: '',
    action_info_1: null as string | null,
    action_info_2: null as string | null,
    action_info_3: null as string | null,
    action_info_4: null as string | null,
    action_info_5: null as string | null,
    action_info_6: null as string | null,
    input_yn: false,
    me_check: true,
    bi_cover1: '10000',
    bi_cover2: '20000',
    pi_cover1: '1000',
    me_cover1: '100',
    me_cover2: '1000',
    dt_cover1: '10',
    agree: false,
  });

  const [coverInputMode, setCoverInputMode] = useState(false);
  const [licenseName, setLicenseName] = useState('');
  const [overviewName, setOverviewName] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [overviewFile, setOverviewFile] = useState<File | null>(null);
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [hasSelectedEndDate, setHasSelectedEndDate] = useState(false);
  /** 달력에서 날짜를 한 번이라도 선택했으면 true (초기값과 같아도) → CSS 적용용 */
  const [userHasInteractedWithStartDate, setUserHasInteractedWithStartDate] = useState(false);
  const [userHasInteractedWithEndDate, setUserHasInteractedWithEndDate] = useState(false);
  const initialStartDateRef = useRef(todayString);
  const initialEndDateRef = useRef(todayString);

  // 예상참여인원 도움말 모달
  const [showInfoLayer, setShowInfoLayer] = useState(false);
  const [layerTitle, setLayerTitle] = useState('');
  const [layerContent, setLayerContent] = useState('');
  const showHelpLayer = (type: string) => {
    let title = '';
    let content = '';
    switch (type) {
      case 'insured_cnt':
        title = '예상참여인원';
        content = '행사기간 동안 예상되는 총참여인원수를 말합니다.<br>(예시: 1일 100명 행사기간 10일<br>예상참여인원 1,000명)<br><br>* 행사관계자, 임직원은 제외 후 입력 바랍니다.<br>(관계자,임직원은 부담보)';
        break;
      case 'bi':
        title = '대인배상';
        content = '보험기간 중 발생한 보험사고로 인하여<br/>제3자에게 발생한 신체손해에 대한<br/>법률상의 책임을 말합니다.';
        break;
      case 'pi':
        title = '대물배상';
        content = '보험기간 중 발생한 보험사고로 인하여<br/>제3자에게 발생한 재물손해에 대한<br/>법률상의 책임을 말합니다.';
        break;
      case 'me':
        title = '참가자치료비';
        content = '행사 참가자가 행사장 내에서 상해를 입은 경우<br/>발생한 치료비를 보상합니다.';
        break;
      case 'dt':
        title = '자기부담금';
        content = '사고 발생 시 계약자가 부담하는 금액을<br/>말합니다.';
        break;
    }
    setLayerTitle(title);
    setLayerContent(content);
    setShowInfoLayer(true);
  };

  // 컴포넌트 마운트 시 스타일 강제 재적용 (다른 페이지에서 돌아올 때 CSS 깨짐 방지)
  useEffect(() => {
    // 스타일이 제대로 적용되도록 강제 리플로우 및 클래스 재적용
    const forceReflow = () => {
      const elements = document.querySelectorAll('.event-insurance-mobile .tourGuard_form_tt.tourG_line.event-insurance-radio-group');
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // 강제 리플로우 트리거
        void htmlEl.offsetHeight;
        
        // 라디오 버튼이 있는 경우 클래스 추가
        const hasRadio = htmlEl.querySelector('.tourG_rdo_area');
        if (hasRadio && !htmlEl.classList.contains('tourG_line-with-radio')) {
          htmlEl.classList.add('tourG_line-with-radio');
        }
        
        // 스타일 강제 재계산
        htmlEl.style.display = 'none';
        void htmlEl.offsetHeight;
        htmlEl.style.display = '';
      });
    };

    // 마운트 시 즉시 실행
    forceReflow();

    // 약간의 지연 후 다시 실행 (다른 스타일이 적용된 후)
    const timeoutId1 = setTimeout(forceReflow, 50);
    const timeoutId2 = setTimeout(forceReflow, 200);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, []);

  const emailDomains = [
    'naver.com',
    'gmail.com',
    'daum.net',
    'hanmail.net',
    'nate.com',
    'hotmail.com',
    'yahoo.co.kr',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'input_yn') {
        setCoverInputMode(checked);
      }
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'select_email') {
      setFormData(prev => ({ ...prev, email2: value, select_email: value }));
    } else if (['resno1', 'resno2', 'resno3', 'insured_cnt'].includes(name)) {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'license') {
        setLicenseName(file.name);
        setLicenseFile(file);
      } else if (type === 'overview') {
        setOverviewName(file.name);
        setOverviewFile(file);
      }
    }
  };

  const handleFileChoose = (type: string) => {
    const fileInput = document.getElementById(type) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.contractor_name.trim()) {
      alert('법인/단체명을 입력해 주세요.');
      return;
    }
    
    if (formData.resno1.length < 3 || formData.resno2.length < 2 || formData.resno3.length < 5) {
      alert('사업자 등록번호를 정확히 입력하여 주십시오');
      return;
    }

    if (!formData.incharge) {
      alert('담당자명을 입력해 주세요.');
      return;
    }

    // 휴대폰 번호 체크 (하이픈 제외하고 10~11자리)
    const ctelNoNumbers = formData.ctel_no.replace(/[^0-9]/g, '');
    if (!formData.ctel_no || ctelNoNumbers.length < 10) {
      alert('휴대폰 번호를 정확히 입력해 주세요. (10~11자리)');
      return;
    }

    // 사무실 전화번호 체크 (하이픈 제외하고 9~11자리)
    const telNoNumbers = formData.tel_no.replace(/[^0-9]/g, '');
    if (!formData.tel_no || telNoNumbers.length < 9) {
      alert('사무실 전화번호를 정확히 입력해 주세요. (9~11자리)');
      return;
    }

    if (!formData.email1 || !formData.email2) {
      alert('이메일 주소를 입력해 주세요.');
      return;
    }

    if (!formData.event_name) {
      alert('행사명을 입력해 주세요.');
      return;
    }

    if (!formData.start_date) {
      alert('시작일을 입력해 주세요.');
      return;
    }

    if (!formData.end_date) {
      alert('종료일을 입력해 주세요.');
      return;
    }

    if (!formData.insured_cnt) {
      alert('참여인원 수를 입력해 주세요.');
      return;
    }

    // action_info는 null이면 미선택, ''(빈 문자열)이면 "무" 선택, 다른 값이면 "유" 선택
    if (formData.action_info_1 === null || formData.action_info_1 === undefined) {
      alert('운동경기 유무를 체크해 주세요.');
      return;
    }

    if (formData.action_info_2 === null || formData.action_info_2 === undefined) {
      alert('불꽃놀이 유무를 체크해 주세요.');
      return;
    }

    if (formData.action_info_3 === null || formData.action_info_3 === undefined) {
      alert('수상위험 활동 유무를 체크해 주세요.');
      return;
    }

    if (formData.action_info_4 === null || formData.action_info_4 === undefined) {
      alert('놀이시설 유무를 체크해 주세요.');
      return;
    }

    if (formData.action_info_5 === null || formData.action_info_5 === undefined) {
      alert('드론 유무를 체크해 주세요.');
      return;
    }

    if (formData.action_info_6 === null || formData.action_info_6 === undefined) {
      alert('기타 위험활동 유무를 체크해 주세요.');
      return;
    }

    if (!formData.agree) {
      alert('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    // 견적 신청 처리
    try {
      // 로그인한 회원 정보 가져오기
      const memberInfo = localStorage.getItem('member');
      const memberId = memberInfo ? JSON.parse(memberInfo).id : null;

      const apiFormData = new FormData();
      apiFormData.append('contractor_name', formData.contractor_name);
      apiFormData.append('registration_no', `${formData.resno1}${formData.resno2}${formData.resno3}`);
      apiFormData.append('incharge', formData.incharge);
      apiFormData.append('ctel_no', formData.ctel_no);
      apiFormData.append('tel_no', formData.tel_no);
      apiFormData.append('email', `${formData.email1}@${formData.email2}`);
      apiFormData.append('event_name', formData.event_name);
      apiFormData.append('start_date', `${formData.start_date} ${formData.start_hour}:00:00`);
      apiFormData.append('end_date', `${formData.end_date} ${formData.end_hour}:00:00`);
      apiFormData.append('insured_cnt', formData.insured_cnt);
      
      // 회원 ID 추가 (로그인한 경우)
      if (memberId) {
        apiFormData.append('member_id', memberId);
      }

      const trackingInfo = getTrackingInfo('모바일');
      apiFormData.append('affiliate', trackingInfo.affiliate);
      apiFormData.append('access_path', trackingInfo.access_path);

      // 위험활동 정보 (유인 것만 포함)
      const actionInfoList = [
        formData.action_info_1,
        formData.action_info_2,
        formData.action_info_3,
        formData.action_info_4,
        formData.action_info_5,
        formData.action_info_6
      ]
        .filter(info => info && info !== 'N' && info !== '')
        .join('/');
      apiFormData.append('action_info', actionInfoList);

      // 보험가입조건
      if (formData.input_yn) {
        // 직접입력 모드
        apiFormData.append('bi_person', formData.bi_cover1);
        apiFormData.append('bi_occurence', formData.bi_cover2);
        apiFormData.append('pi_occurence', formData.pi_cover1);
        apiFormData.append('dt_occurence', formData.dt_cover1);
        
        // 참가자치료비 - 체크박스 상태에 따라 값 전송
        if (formData.me_check && formData.me_cover1 !== '0' && formData.me_cover2 !== '0') {
          apiFormData.append('me_person', formData.me_cover1);
          apiFormData.append('me_occurence', formData.me_cover2);
        } else {
          apiFormData.append('me_person', '0');
          apiFormData.append('me_occurence', '0');
        }
      } else {
        // 기본값 모드
        apiFormData.append('bi_person', '10000');
        apiFormData.append('bi_occurence', '20000');
        apiFormData.append('pi_occurence', '1000');
        apiFormData.append('dt_occurence', '10');
        
        // 참가자치료비 - 체크박스 상태에 따라 값 전송
        if (formData.me_check) {
          apiFormData.append('me_person', '100');
          apiFormData.append('me_occurence', '1000');
        } else {
          apiFormData.append('me_person', '0');
          apiFormData.append('me_occurence', '0');
        }
      }

      // 첨부파일
      if (licenseFile) {
        apiFormData.append('license', licenseFile);
      }
      if (overviewFile) {
        apiFormData.append('overview', overviewFile);
      }

      // API 호출 (credentials: 'include'로 쿠키/세션 전송)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/event-insurance/estimate`, {
        method: 'POST',
        body: apiFormData,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        alert('견적 신청이 완료되었습니다.\n담당자가 확인 후 연락드리겠습니다.');
        // 폼 초기화
        setFormData({
          contractor_name: '',
          resno1: '',
          resno2: '',
          resno3: '',
          incharge: '',
          ctel_no: '',
          tel_no: '',
          email1: '',
          email2: '',
          select_email: '',
          event_name: '',
          start_date: todayString,
          start_hour: getDefaultHour(),
          end_date: todayString,
          end_hour: getDefaultHour(),
          insured_cnt: '',
          action_info_1: null as string | null,
          action_info_2: null as string | null,
          action_info_3: null as string | null,
          action_info_4: null as string | null,
          action_info_5: null as string | null,
          action_info_6: null as string | null,
          input_yn: false,
          me_check: true,
          bi_cover1: '10000',
          bi_cover2: '20000',
          pi_cover1: '1000',
          me_cover1: '100',
          me_cover2: '1000',
          dt_cover1: '10',
          agree: false,
        });
        initialStartDateRef.current = todayString;
        initialEndDateRef.current = todayString;
        setHasSelectedStartDate(false);
        setHasSelectedEndDate(false);
        setLicenseName('');
        setOverviewName('');
        setLicenseFile(null);
        setOverviewFile(null);
        setCoverInputMode(false);
      } else {
        alert(data.message || '견적 신청에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('견적 신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="bgcolor_white event-insurance-mobile">
      <Header isMobile={true} />
      
      <div id="isbwrapper">
        <div className="prow_01">
          <form name="inputForm" id="inputForm">
            <div>
              <p className="tour2023_title02" style={{ marginTop: '35px' }}>행사주최자 배상책임보험 견적신청</p>
              <div className="tour2023_txt40 tourG_mat22 tourG_mab07">
                <p>지역축제, 공연, 콘서트, 박람회, 체육행사 등 안전한 행사 진행을 위해 행사보험을 준비하세요.</p>
              </div>

              {/* 행사주최자 */}
              <div className="tourG_mat04">
                <p className="tour2023_title05">행사주최자</p>
                <div className="tourG_mat27 tourG_mab05">
                  <section className="tourGuard_Info">
                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="contract_name">법인단체명</label>
                      <input 
                        type="text" 
                        id="contract_name" 
                        name="contractor_name"
                        value={formData.contractor_name}
                        onChange={handleInputChange}
                        maxLength={20}
                        placeholder="행사를 주최하는 법인단체명을 입력해 주세요"
                        className="tourGuard_input_w02"
                      />
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line03">
                      <label htmlFor="resno1">사업자번호</label>
                      <input 
                        type="tel" 
                        id="resno1" 
                        name="resno1"
                        value={formData.resno1}
                        onChange={handleInputChange}
                        maxLength={3}
                        className="tourGuard_input_w03"
                      />
                      <input 
                        type="tel" 
                        id="resno2" 
                        name="resno2"
                        value={formData.resno2}
                        onChange={handleInputChange}
                        maxLength={2}
                        className="tourGuard_input_w03"
                      />
                      <input 
                        type="tel" 
                        id="resno3" 
                        name="resno3"
                        value={formData.resno3}
                        onChange={handleInputChange}
                        maxLength={5}
                        className="tourGuard_input_w03"
                      />
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="incharge">담당자명</label>
                      <input 
                        type="text" 
                        id="incharge" 
                        name="incharge"
                        value={formData.incharge}
                        onChange={handleInputChange}
                        maxLength={15}
                        placeholder="담당자명을 입력해 주세요"
                        className="tourGuard_input_w02"
                      />
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="ctel_no">휴대폰 번호</label>
                      <input 
                        type="tel" 
                        id="ctel_no" 
                        name="ctel_no"
                        value={formData.ctel_no}
                        onChange={handleInputChange}
                        maxLength={12}
                        placeholder="숫자만 입력해주세요."
                        className="tourGuard_input_w02"
                      />
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="tel_no">사무실 전화번호</label>
                      <input 
                        type="text" 
                        id="tel_no" 
                        name="tel_no"
                        value={formData.tel_no}
                        onChange={handleInputChange}
                        maxLength={12}
                        placeholder="숫자만 입력해주세요.(지역번호 포함)"
                        className="tourGuard_input_w02"
                      />
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="email1">이메일 주소</label>
                      <input 
                        type="text" 
                        id="email1" 
                        name="email1"
                        value={formData.email1}
                        onChange={handleInputChange}
                        maxLength={20}
                        className="tourGuard_input_w01"
                      />
                      <div className="tourGuard_txt03" style={{ left: '32%' }}>@</div>
                      <input 
                        type="text" 
                        id="email2" 
                        name="email2"
                        value={formData.email2}
                        onChange={handleInputChange}
                        maxLength={20}
                        className="tourGuard_input_w01"
                      />
                      <div className="tourGuard_input_cell08 tourGuard_input_cell09 tourGuard">
                        <span className="tourGuard_ps_box">
                          <select 
                            className="tourGuard_sel" 
                            id="select_email" 
                            name="select_email"
                            value={formData.select_email}
                            onChange={handleInputChange}
                          >
                            <option value="" disabled>선택</option>
                            {emailDomains.map(domain => (
                              <option key={domain} value={domain}>{domain}</option>
                            ))}
                          </select>
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* 행사내용 */}
              <div className="tourG_mat10">
                <p className="tour2023_title05">행사내용</p>
                <div className="tourG_mat27 tourG_mab05">
                  <section className="tourGuard_Info">
                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="event_name">행사명</label>
                      <input 
                        type="text" 
                        id="event_name" 
                        name="event_name"
                        value={formData.event_name}
                        onChange={handleInputChange}
                        maxLength={30}
                        placeholder="행사명을 입력해 주세요"
                        className="tourGuard_input_w02"
                      />
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line departure-date-field">
                      <label htmlFor="start_date">행사시작일</label>
                      <div className="date-picker-wrapper" style={{ width: '45%', display: 'inline-block' }}>
                        <DatePicker
                          selected={formData.start_date ? parseDate(formData.start_date) : null}
                          onChange={(date: Date | null) => {
                            if (date) {
                              const formattedDate = formatDate(date);
                              setFormData(prev => ({ ...prev, start_date: formattedDate }));
                              setHasSelectedStartDate(formattedDate !== initialStartDateRef.current);
                              setUserHasInteractedWithStartDate(true);
                            } else {
                              setFormData(prev => ({ ...prev, start_date: '' }));
                              setHasSelectedStartDate(false);
                            }
                          }}
                          onSelect={(date: Date | null) => {
                            if (date) {
                              const formattedDate = formatDate(date);
                              setFormData(prev => ({ ...prev, start_date: formattedDate }));
                              setHasSelectedStartDate(formattedDate !== initialStartDateRef.current);
                              setUserHasInteractedWithStartDate(true);
                            }
                          }}
                          dateFormat="yyyy-MM-dd"
                          formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                          locale="ko"
                          placeholderText="날짜 선택"
                          dateFormatCalendar="yyyy년 MM월"
                          className={`tourGuard_input_w01 ${(hasSelectedStartDate || userHasInteractedWithStartDate) ? 'has-value user-selected' : ''}`}
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
                      <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell02 tourGuard" style={{ marginRight: 0 }}>
                        <span className="tourGuard_ps_box">
                          <select 
                            className="tourGuard_sel07" 
                            id="start_hour" 
                            name="start_hour"
                            value={formData.start_hour}
                            onChange={handleInputChange}
                          >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                              <option key={hour} value={hour.toString().padStart(2, '0')}>
                                {hour.toString().padStart(2, '0')}시
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line arrival-date-field">
                      <label htmlFor="end_date">행사종료일</label>
                      <div className="date-picker-wrapper" style={{ width: '45%', display: 'inline-block' }}>
                        <DatePicker
                          selected={formData.end_date ? parseDate(formData.end_date) : null}
                          onChange={(date: Date | null) => {
                            if (date) {
                              const formattedDate = formatDate(date);
                              setFormData(prev => ({ ...prev, end_date: formattedDate }));
                              setHasSelectedEndDate(formattedDate !== initialEndDateRef.current);
                              setUserHasInteractedWithEndDate(true);
                            } else {
                              setFormData(prev => ({ ...prev, end_date: '' }));
                              setHasSelectedEndDate(false);
                            }
                          }}
                          onSelect={(date: Date | null) => {
                            if (date) {
                              const formattedDate = formatDate(date);
                              setFormData(prev => ({ ...prev, end_date: formattedDate }));
                              setHasSelectedEndDate(formattedDate !== initialEndDateRef.current);
                              setUserHasInteractedWithEndDate(true);
                            }
                          }}
                          dateFormat="yyyy-MM-dd"
                          formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                          locale="ko"
                          placeholderText="날짜 선택"
                          dateFormatCalendar="yyyy년 MM월"
                          className={`tourGuard_input_w01 ${(hasSelectedEndDate || userHasInteractedWithEndDate) ? 'has-value user-selected' : ''}`}
                          wrapperClassName="date-picker-wrapper"
                          calendarClassName="custom-calendar"
                          popperClassName="custom-popper"
                          minDate={formData.start_date ? (parseDate(formData.start_date) || new Date()) : new Date()}
                          showPopperArrow={false}
                          popperPlacement="bottom-start"
                          shouldCloseOnSelect={true}
                          strictParsing
                        />
                      </div>
                      <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell02 tourGuard" style={{ marginRight: 0 }}>
                        <span className="tourGuard_ps_box">
                          <select 
                            className="tourGuard_sel07" 
                            id="end_hour" 
                            name="end_hour"
                            value={formData.end_hour}
                            onChange={handleInputChange}
                          >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                              <option key={hour} value={hour.toString().padStart(2, '0')}>
                                {hour.toString().padStart(2, '0')}시
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="insured_cnt">
                        예상참여인원{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('insured_cnt'); }} className="help_tip">
                          <img src="/images/heip_tip.png" alt="도움말 보기" />
                        </a>
                      </label>
                      <input 
                        type="tel" 
                        id="insured_cnt" 
                        name="insured_cnt"
                        value={formData.insured_cnt}
                        onChange={handleInputChange}
                        maxLength={5}
                        placeholder="숫자만 입력해주세요."
                        className="tourGuard_input_w02"
                      />
                      <div className="tourGuard_txt21">명</div>
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line tourG_line-with-radio event-insurance-radio-group">
                      <div className="tourG_rdo_area">
                        <label htmlFor="action_info_1_Y" className="event-insurance-rdo-label">운동경기/체육활동 유무</label>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_1_Y" 
                            value="AT" 
                            name="action_info_1"
                            checked={formData.action_info_1 === 'AT'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_1_Y">유</label>
                        </span>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_1_N" 
                            value="" 
                            name="action_info_1"
                            checked={formData.action_info_1 === ''}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_1_N" className="one_line0">무</label>
                        </span>
                      </div>

                      <div className="tourG_rdo_area">
                        <label htmlFor="action_info_2_Y" className="event-insurance-rdo-label">불꽃놀이 유무</label>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_2_Y" 
                            value="FW" 
                            name="action_info_2"
                            checked={formData.action_info_2 === 'FW'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_2_Y">유</label>
                        </span>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_2_N" 
                            value="" 
                            name="action_info_2"
                            checked={formData.action_info_2 === ''}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_2_N" className="one_line0">무</label>
                        </span>
                      </div>
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line tourG_line-with-radio event-insurance-radio-group">
                      <div className="tourG_rdo_area">
                        <label htmlFor="action_info_3_Y" className="event-insurance-rdo-label">수상위험 유무</label>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_3_Y" 
                            value="WR" 
                            name="action_info_3"
                            checked={formData.action_info_3 === 'WR'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_3_Y">유</label>
                        </span>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_3_N" 
                            value="" 
                            name="action_info_3"
                            checked={formData.action_info_3 === ''}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_3_N" className="one_line0">무</label>
                        </span>
                      </div>

                      <div className="tourG_rdo_area">
                        <label htmlFor="action_info_4_Y" className="event-insurance-rdo-label">놀이시설(에어바운스) 유무</label>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_4_Y" 
                            value="PF" 
                            name="action_info_4"
                            checked={formData.action_info_4 === 'PF'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_4_Y">유</label>
                        </span>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_4_N" 
                            value="" 
                            name="action_info_4"
                            checked={formData.action_info_4 === ''}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_4_N" className="one_line0">무</label>
                        </span>
                      </div>
                    </div>

                    <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line tourG_line-with-radio event-insurance-radio-group">
                      <div className="tourG_rdo_area">
                        <label htmlFor="action_info_5_Y" className="event-insurance-rdo-label">드론 유무</label>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_5_Y" 
                            value="DR" 
                            name="action_info_5"
                            checked={formData.action_info_5 === 'DR'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_5_Y">유</label>
                        </span>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_5_N" 
                            value="" 
                            name="action_info_5"
                            checked={formData.action_info_5 === ''}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_5_N" className="one_line0">무</label>
                        </span>
                      </div>

                      <div className="tourG_rdo_area">
                        <label htmlFor="action_info_6_Y" className="event-insurance-rdo-label">기타 위험활동 유무</label>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_6_Y" 
                            value="ET" 
                            name="action_info_6"
                            checked={formData.action_info_6 === 'ET'}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_6_Y">유</label>
                        </span>
                        <span className="tourG_inp_rdo event-insurance-inp-rdo">
                          <input 
                            type="radio" 
                            id="action_info_6_N" 
                            value="" 
                            name="action_info_6"
                            checked={formData.action_info_6 === ''}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="action_info_6_N" className="one_line0">무</label>
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* 보험가입조건 */}
              <div className="tour2023_flex tourG_mat04">
                <p className="tour2023_title18">보험가입조건</p>
                <ul className="tour2023_agree tourG_mat06 tourG_mRight02">
                  <li className="tour2023_cir tour2023_chk tourG_mat02">
                    <input 
                      type="checkbox" 
                      name="input_yn" 
                      id="input_yn"
                      checked={formData.input_yn}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="input_yn"><span className="tourGuard_txt24"> 직접입력</span></label>
                  </li>
                </ul>
              </div>

              <section className="tourGuard_Info">
                <div className="tourG_mab03">
                  <table className="tour2024_ListB" border={1} cellSpacing="0">
                    <colgroup>
                      <col width="" />
                      <col width="" />
                      <col width="" />
                      <col width="" />
                    </colgroup>
                    <tbody id="generalCover" style={{ display: coverInputMode ? 'none' : '' }}>
                      <tr>
                        <td rowSpan={2} className="sName tour2024_ListB_bg tour2024_ListB_wd">선택</td>
                        <td rowSpan={2} className="sName tour2024_ListB_bg tour2024_ListB_wd01">구분</td>
                        <td colSpan={2} className="sName tour2024_ListB_bg tour2024_ListB_wd02 Bline">보상한도</td>
                      </tr>
                      <tr>
                        <td className="sName tour2024_ListB_bg no01">1인당</td>
                        <td className="sName tour2024_ListB_bg no01">1사고당</td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">필수</td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            대인배상{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('bi'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center">1억원</td>
                        <td className="ag_center">2억원</td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">필수</td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            대물배상{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('pi'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">1,000만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">
                          (선택)&nbsp;
                          <ul className="tour2023_check">
                            <li className="tour2023_cir03 tour2023_chk03 tourG_mat02">
                              <input 
                                type="checkbox" 
                                name="me_check"
                                checked={formData.me_check}
                                onChange={handleInputChange}
                              />
                            </li>
                          </ul>
                        </td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            참가자치료비<br />(구내치료비){' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('me'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center"><span className="tourGuard_blue">100만원</span></td>
                        <td className="ag_center"><span className="tourGuard_blue">1,000만원</span></td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">필수</td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            자기부담금{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('dt'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">10만원</td>
                      </tr>
                    </tbody>

                    <tbody id="inputCover" style={{ display: coverInputMode ? '' : 'none' }}>
                      <tr>
                        <td rowSpan={2} className="sName tour2024_ListB_bg tour2024_ListB_wd">선택</td>
                        <td rowSpan={2} className="sName tour2024_ListB_bg tour2024_ListB_wd01">구분</td>
                        <td colSpan={2} className="sName tour2024_ListB_bg tour2024_ListB_wd02 Bline">보상한도</td>
                      </tr>
                      <tr>
                        <td className="sName tour2024_ListB_bg no01">1인당</td>
                        <td className="sName tour2024_ListB_bg no01">1사고당</td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">필수</td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            대인배상{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('bi'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center">
                          <div className="tour2023_sel">
                            <div className="tour2023_estimate_form_tt tourGuard styled-select">
                              <span className="tourGuard_ps_box_event">
                                <select 
                                  className="tourGuard_sel01" 
                                  id="bi_cover1" 
                                  name="bi_cover1"
                                  value={formData.bi_cover1}
                                  onChange={handleInputChange}
                                >
                                  <option value="5000">5천만</option>
                                  <option value="10000">1억</option>
                                  <option value="20000">2억</option>
                                  <option value="30000">3억</option>
                                </select>
                              </span>
                            </div>
                            <span className="tourGuard_txt33">원</span>
                          </div>
                        </td>
                        <td className="ag_center">
                          <div className="tour2023_sel">
                            <div className="tour2023_estimate_form_tt tourGuard styled-select">
                              <span className="tourGuard_ps_box_event">
                                <select 
                                  className="tourGuard_sel01" 
                                  id="bi_cover2" 
                                  name="bi_cover2"
                                  value={formData.bi_cover2}
                                  onChange={handleInputChange}
                                >
                                  <option value="5000">5천만</option>
                                  <option value="10000">1억</option>
                                  <option value="20000">2억</option>
                                  <option value="30000">3억</option>
                                  <option value="50000">5억</option>
                                  <option value="100000">10억</option>
                                </select>
                              </span>
                            </div>
                            <span className="tourGuard_txt33">원</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">필수</td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            대물배상{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('pi'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">
                          <div className="tour2023_sel">
                            <div className="tour2023_estimate_form_tt tourGuard styled-select">
                              <span className="tourGuard_ps_box_event">
                                <select 
                                  className="tourGuard_sel01" 
                                  id="pi_cover1" 
                                  name="pi_cover1"
                                  value={formData.pi_cover1}
                                  onChange={handleInputChange}
                                >
                                  <option value="1000">1천만</option>
                                  <option value="3000">3천만</option>
                                  <option value="5000">5천만</option>
                                  <option value="10000">1억</option>
                                  <option value="30000">3억</option>
                                  <option value="50000">5억</option>
                                </select>
                              </span>
                            </div>
                            <span className="tourGuard_txt33">원</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">
                          (선택)&nbsp;
                          <ul className="tour2023_check">
                            <li className="tour2023_cir03 tour2023_chk03 tourG_mat02">
                              <input 
                                type="checkbox" 
                                name="me_check"
                                checked={formData.me_check}
                                onChange={handleInputChange}
                              />
                            </li>
                          </ul>
                        </td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            참가자치료비<br />(구내치료비){' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('me'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center">
                          <div className="tour2023_sel">
                            <div className="tour2023_estimate_form_tt tourGuard styled-select">
                              <span className="tourGuard_ps_box_event">
                                <select 
                                  className="tourGuard_sel01" 
                                  id="me_cover1" 
                                  name="me_cover1"
                                  value={formData.me_cover1}
                                  onChange={handleInputChange}
                                >
                                  <option value="0">가입안함</option>
                                  <option value="50">50만</option>
                                  <option value="100">100만</option>
                                  <option value="500">500만</option>
                                </select>
                              </span>
                            </div>
                            <span className="tourGuard_txt33">원</span>
                          </div>
                        </td>
                        <td className="ag_center">
                          <div className="tour2023_sel">
                            <div className="tour2023_estimate_form_tt tourGuard styled-select">
                              <span className="tourGuard_ps_box_event">
                                <select 
                                  className="tourGuard_sel01" 
                                  id="me_cover2" 
                                  name="me_cover2"
                                  value={formData.me_cover2}
                                  onChange={handleInputChange}
                                >
                                  <option value="0">가입안함</option>
                                  <option value="1000">1천만</option>
                                  <option value="2000">2천만</option>
                                  <option value="4000">4천만</option>
                                </select>
                              </span>
                            </div>
                            <span className="tourGuard_txt33">원</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="ag_center tour2024_ListB_bg02">필수</td>
                        <td className="ag_center tour2024_ListB_bg02">
                          <div className="tour2023_insuBox01">
                            자기부담금{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('dt'); }} className="help_tip">
                              <img src="/images/heip_tip.png" alt="도움말 보기" />
                            </a>
                          </div>
                        </td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">
                          <div className="tour2023_sel">
                            <div className="tour2023_estimate_form_tt tourGuard styled-select">
                              <span className="tourGuard_ps_box_event">
                                <select 
                                  className="tourGuard_sel01" 
                                  id="dt_cover1" 
                                  name="dt_cover1"
                                  value={formData.dt_cover1}
                                  onChange={handleInputChange}
                                >
                                  <option value="10">10만</option>
                                  <option value="50">50만</option>
                                  <option value="100">100만</option>
                                </select>
                              </span>
                            </div>
                            <span className="tourGuard_txt33">원</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mab01">
                <ul className="tourGuard_inline">
                  <li className="tourGuard_inline_t01">※</li>
                  <li className="tourGuard_inline_t02">보험가입조건은 직접 설정하실 수 있습니다.</li>
                </ul>
                <ul className="tourGuard_inline tourG_mat22">
                  <li className="tourGuard_inline_t01">※</li>
                  <li className="tourGuard_inline_t02">제시된 조건은 일반적으로 가장 많이 선택하는 조건입니다.</li>
                </ul>
                <ul className="tourGuard_inline tourG_mat22">
                  <li className="tourGuard_inline_t01">※</li>
                  <li className="tourGuard_inline_t02">구내치료비는 선택사항입니다. <span className="tour2023_blue">(단, 체육활동이 포함되어 있으면 가입할 수 없습니다.)</span></li>
                </ul>
              </div>

              {/* 첨부서류 */}
              <div className="tourG_mat10">
                <p className="tour2023_title05">첨부서류</p>
                <section className="tourGuard_Info">
                  {/* 사업자등록증(고유번호증) */}
                  <div className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor="license_name">사업자등록증(고유번호증)</label>
                    <input
                      type="text"
                      id="license_name"
                      name="license_name"
                      maxLength={50}
                      placeholder="업로드해 주세요"
                      className="tourGuard_input_w02"
                      value={licenseName}
                      onClick={() => handleFileChoose('license')}
                      readOnly
                    />
                    <div className="tour2023_event_file">
                      <a
                        href="#"
                        className="tour2023_btn_b01 tour2023_btn11"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileChoose('license');
                        }}
                      >
                        파일찾기
                      </a>
                    </div>
                    <input
                      type="file"
                      id="license"
                      name="license"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileChange(e, 'license')}
                    />
                  </div>
                  {/* 행사개요 문서 */}
                  <div className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor="overview_name">행사개요</label>
                    <input
                      type="text"
                      id="overview_name"
                      name="overview_name"
                      maxLength={50}
                      placeholder="업로드해 주세요"
                      className="tourGuard_input_w02"
                      value={overviewName}
                      onClick={() => handleFileChoose('overview')}
                      readOnly
                    />
                    <div className="tour2023_event_file">
                      <a
                        href="#"
                        className="tour2023_btn_b01 tour2023_btn11"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileChoose('overview');
                        }}
                      >
                        파일찾기
                      </a>
                    </div>
                    <input
                      type="file"
                      id="overview"
                      name="overview"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileChange(e, 'overview')}
                    />
                  </div>
                </section>
                <div className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mab01">
                  <ul className="tourGuard_inline">
                    <li className="tourGuard_inline_t01">※</li>
                    <li className="tourGuard_inline_t02">
                      행사주최자 배상책임보험 견적서 발송은 견적신청 후 2시간 정도 걸립니다.
                      <br />
                      (영업시간 기준)
                    </li>
                  </ul>
                  <ul className="tourGuard_inline tourG_mat22">
                    <li className="tourGuard_inline_t01">※</li>
                    <li className="tourGuard_inline_t02">
                      첨부파일(
                      <span className="tour2023_blue">hwp, hwpx, pdf, jpg, gif, png, doc파일 가능</span>
                      )이 10메가 초과되거나 파일 업로드가 안되는 경우 팩스로 보내주시기 바랍니다.{' '}
                      <span className="tour2023_blue"></span>
                      <br />
                      <span className="tour2023_blue">
                        (팩스번호 : 02-2261-0098, 이메일: han4566@hanmail.net)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 개인정보 동의 */}
              <div className="in_wrap">
                <div className="in_wrap pb5">
                  <ul className="tourG_agree">
                    <li className="tourG_cir tourG_chk">
                      <input 
                        type="checkbox" 
                        name="agree" 
                        id="agree"
                        checked={formData.agree}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="agree">
                        <span className="tourGuard_txt24">개인정보 수집 및 이용 동의(필수)</span>
                      </label>
                      <a
                        href="#"
                        className="tourG_more"
                        onClick={(e) => {
                          e.preventDefault();
                          // 개인정보 동의서 팝업
                          window.open('/event-insurance/privacy-agree', 'privacy_agree', 'width=500,height=700');
                        }}
                      ></a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="tourG_mat20 tourG_Wrap"></div>
            
            {/* 하단 고정버튼 */}
            <section id="tour2023_fixedBanner" style={{ position: 'relative' }}>
              <div className="tour2023_bottom_btn">
                <a href="javascript:void(0);" className="tour2023_btn_b tour2023_btn07" onClick={handleSubmit}>
                  견적신청하기
                </a>
              </div>
            </section>
          </form>
        </div>
      </div>

      {/* 예상참여인원 도움말 모달 - 화면 가운데 */}
      {showInfoLayer && (
        <section
          className="tour2023_guide_Wrap event-insurance-help-modal"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowInfoLayer(false)}
        >
          <div className="tour2023_help_Layer" onClick={(e) => e.stopPropagation()}>
            <div className="tour2023_help_Box prow_02">
              <a
                className="close"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowInfoLayer(false);
                }}
              >
                닫기
              </a>
              <div className="tour2023_help_txt01">{layerTitle}</div>
              <div
                className="tour2023_help_txt02"
                dangerouslySetInnerHTML={{ __html: layerContent }}
              />
            </div>
          </div>
        </section>
      )}

      <Footer isMobile={true} />
    </div>
  );
}
