'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import { getImagePath } from '@/utils/path';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

// 한국어 locale 등록
registerLocale('ko', ko);
import './page.css';

export default function PCEventInsurancePage() {
  const today = new Date();

  // 현재 시간 + 2시간 계산 (00~23시 형식)
  const getDefaultHour = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 2) % 24; // 24시 넘으면 0시로
    return String(nextHour).padStart(2, '0');
  };

  // 행사주최자 정보
  const [contractorName, setContractorName] = useState('');
  const [resno1, setResno1] = useState('');
  const [resno2, setResno2] = useState('');
  const [resno3, setResno3] = useState('');
  const [incharge, setIncharge] = useState('');
  const [ctelNo, setCtelNo] = useState('');
  const [telNo, setTelNo] = useState('');
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  const [selectEmail, setSelectEmail] = useState('');

  // 행사내용
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(today);
  const [startHour, setStartHour] = useState(getDefaultHour());
  const [endDate, setEndDate] = useState<Date | null>(today);
  const [endHour, setEndHour] = useState(getDefaultHour());
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [hasSelectedEndDate, setHasSelectedEndDate] = useState(false);
  /** 달력에서 날짜를 한 번이라도 선택했으면 true (초기값과 같아도) → CSS 적용용 */
  const [userHasInteractedWithStartDate, setUserHasInteractedWithStartDate] = useState(false);
  const [userHasInteractedWithEndDate, setUserHasInteractedWithEndDate] = useState(false);
  const initialStartDateRef = useRef<Date | null>(startDate);
  const initialEndDateRef = useRef<Date | null>(endDate);
  const [insuredCnt, setInsuredCnt] = useState('');
  const [actionInfo1, setActionInfo1] = useState<string | null>(null); // 운동경기
  const [actionInfo2, setActionInfo2] = useState<string | null>(null); // 불꽃놀이
  const [actionInfo3, setActionInfo3] = useState<string | null>(null); // 수상위험
  const [actionInfo4, setActionInfo4] = useState<string | null>(null); // 놀이시설
  const [actionInfo5, setActionInfo5] = useState<string | null>(null); // 드론
  const [actionInfo6, setActionInfo6] = useState<string | null>(null); // 기타

  // 보험가입조건
  const [inputYn, setInputYn] = useState(false);
  const [meCheck1, setMeCheck1] = useState(true);
  const [meCheck2, setMeCheck2] = useState(true);
  const [biCover1, setBiCover1] = useState('10000');
  const [biCover2, setBiCover2] = useState('20000');
  const [piCover1, setPiCover1] = useState('1000');
  const [meCover1, setMeCover1] = useState('100');
  const [meCover2, setMeCover2] = useState('1000');
  const [dtCover1, setDtCover1] = useState('10');

  // 첨부서류
  const [licenseName, setLicenseName] = useState('');
  const [overviewName, setOverviewName] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [overviewFile, setOverviewFile] = useState<File | null>(null);

  // 동의
  const [agree, setAgree] = useState(false);

  // 모달
  const [showInfoLayer, setShowInfoLayer] = useState(false);
  const [showCommonLayer, setShowCommonLayer] = useState(false);
  const [layerContent, setLayerContent] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  // 이메일 도메인 목록
  const emailDomains = [
    'naver.com',
    'gmail.com',
    'daum.net',
    'hanmail.net',
    'nate.com',
    'hotmail.com',
    'yahoo.co.kr',
  ];

  // 시간 옵션 (00~23시)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  // 이메일 선택 핸들러
  const handleEmailSelect = (value: string) => {
    setSelectEmail(value);
    if (value) {
      setEmail2(value);
    }
  };

  // 파일 선택 핸들러
  const handleFileChoose = (type: 'license' | 'overview') => {
    const input = document.getElementById(type) as HTMLInputElement;
    input?.click();
  };

  // 파일 변경 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'overview') => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
      const allowedExts = ['hwp', 'hwpx', 'pdf', 'jpg', 'gif', 'png', 'doc', 'docx'];

      if (!allowedExts.includes(fileExt)) {
        alert('업로드할 수 없는 확장자입니다.');
        e.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('용량이 10mb이하인 파일만 업로드할 수 있습니다.\n10mb를 초과하는 파일은 하단의 이메일로 보내주세요.');
        e.target.value = '';
        return;
      }

      if (type === 'license') {
        setLicenseFile(file);
        setLicenseName(fileName);
      } else {
        setOverviewFile(file);
        setOverviewName(fileName);
      }
    }
  };

  // 숫자만 입력 핸들러
  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  // 휴대폰 번호 포맷팅 (010-1234-5678)
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 하이픈이 이미 있으면 그대로 반환
    if (value.includes('-') && value === ctelNo) {
      return value;
    }
    
    // 자동 포맷팅
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 사무실 전화번호 포맷팅
  const formatTelNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 하이픈이 이미 있으면 그대로 반환
    if (value.includes('-') && value === telNo) {
      return value;
    }
    
    // 자동 포맷팅
    // 02로 시작하는 경우 (서울)
    if (numbers.startsWith('02')) {
      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 5) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
      } else {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
      }
    }
    // 그 외 지역번호 (031, 032, 033 등)
    else {
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
    }
  };

  // 다음 입력 필드로 이동
  const handleNextInput = (currentValue: string, maxLength: number, nextId: string) => {
    if (currentValue.length === maxLength) {
      const nextInput = document.getElementById(nextId) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  // 보험가입조건 직접입력 토글
  const handleCoverInputToggle = (checked: boolean) => {
    setInputYn(checked);
  };

  // 견적신청 핸들러
  const handleSubmit = async () => {
    // 유효성 검사
    if (!contractorName.trim()) {
      alert('법인/단체명을 입력해 주세요.');
      return;
    }

    if (resno1.length < 3 || resno2.length < 2 || resno3.length < 5) {
      alert('사업자 등록번호를 정확히 입력하여 주십시오');
      return;
    }

    if (!incharge) {
      alert('담당자명을 입력해 주세요.');
      return;
    }

    // 휴대폰 번호 체크 (하이픈 제외하고 10~11자리)
    const ctelNoNumbers = ctelNo.replace(/[^0-9]/g, '');
    if (!ctelNo || ctelNoNumbers.length < 10) {
      alert('휴대폰 번호를 정확히 입력해 주세요. (10~11자리)');
      return;
    }

    // 사무실 전화번호 체크 (하이픈 제외하고 9~11자리)
    const telNoNumbers = telNo.replace(/[^0-9]/g, '');
    if (!telNo || telNoNumbers.length < 9) {
      alert('사무실 전화번호를 정확히 입력해 주세요. (9~11자리)');
      return;
    }

    if (!email1 || !email2) {
      alert('이메일 주소를 입력해 주세요.');
      return;
    }

    if (!eventName) {
      alert('행사명을 입력해 주세요.');
      return;
    }

    if (!startDate) {
      alert('시작일을 입력해 주세요.');
      return;
    }

    if (!endDate) {
      alert('종료일을 입력해 주세요.');
      return;
    }

    if (!insuredCnt) {
      alert('참여인원 수를 입력해 주세요.');
      return;
    }

    if (actionInfo1 === null) {
      alert('운동경기 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo2 === null) {
      alert('불꽃놀이 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo3 === null) {
      alert('수상위험 활동 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo4 === null) {
      alert('놀이시설 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo5 === null) {
      alert('드론 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo6 === null) {
      alert('기타 위험활동 유무를 체크해 주세요.');
      return;
    }

    if (!agree) {
      alert('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    // 견적 신청 처리
    try {
      // 날짜 포맷 함수
      const formatDate = (date: Date | null) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // 로그인한 회원 정보 가져오기
      const memberInfo = localStorage.getItem('member');
      const memberId = memberInfo ? JSON.parse(memberInfo).id : null;

      const formData = new FormData();
      formData.append('contractor_name', contractorName);
      formData.append('registration_no', `${resno1}${resno2}${resno3}`);
      formData.append('incharge', incharge);
      formData.append('ctel_no', ctelNo);
      formData.append('tel_no', telNo);
      formData.append('email', `${email1}@${email2}`);
      formData.append('event_name', eventName);
      formData.append('start_date', `${formatDate(startDate)} ${startHour}:00:00`);
      formData.append('end_date', `${formatDate(endDate)} ${endHour}:00:00`);
      formData.append('insured_cnt', insuredCnt);
      
      // 회원 ID 추가 (로그인한 경우)
      if (memberId) {
        formData.append('member_id', memberId);
      }
      
      // 위험활동 정보 (유인 것만 포함)
      const actionInfoList = [actionInfo1, actionInfo2, actionInfo3, actionInfo4, actionInfo5, actionInfo6]
        .filter(info => info && info !== 'N')
        .join('/');
      formData.append('action_info', actionInfoList);

      // 보험가입조건
      console.log('=== 보험가입조건 전송 데이터 ===');
      console.log('직접입력 여부 (inputYn):', inputYn);
      
      if (inputYn) {
        console.log('직접입력 모드:');
        console.log('  - bi_person:', biCover1);
        console.log('  - bi_occurence:', biCover2);
        console.log('  - pi_occurence:', piCover1);
        console.log('  - dt_occurence:', dtCover1);
        console.log('  - meCheck2:', meCheck2);
        console.log('  - me_person:', meCover1);
        console.log('  - me_occurence:', meCover2);
        
        formData.append('bi_person', biCover1);
        formData.append('bi_occurence', biCover2);
        formData.append('pi_occurence', piCover1);
        formData.append('dt_occurence', dtCover1);
        
        // 참가자치료비 - 체크박스 상태에 따라 값 전송
        if (meCheck2 && meCover1 !== '0' && meCover2 !== '0') {
          formData.append('me_person', meCover1);
          formData.append('me_occurence', meCover2);
        } else {
          formData.append('me_person', '0');
          formData.append('me_occurence', '0');
        }
      } else {
        console.log('기본값 모드:');
        console.log('  - bi_person: 10000');
        console.log('  - bi_occurence: 20000');
        console.log('  - pi_occurence: 1000');
        console.log('  - dt_occurence: 10');
        console.log('  - meCheck1:', meCheck1);
        console.log('  - me_person: 100');
        console.log('  - me_occurence: 1000');
        
        formData.append('bi_person', '10000');
        formData.append('bi_occurence', '20000');
        formData.append('pi_occurence', '1000');
        formData.append('dt_occurence', '10');
        
        // 참가자치료비 - 체크박스 상태에 따라 값 전송
        if (meCheck1) {
          formData.append('me_person', '100');
          formData.append('me_occurence', '1000');
        } else {
          formData.append('me_person', '0');
          formData.append('me_occurence', '0');
        }
      }

      // 첨부파일
      if (licenseFile) {
        formData.append('license', licenseFile);
      }
      if (overviewFile) {
        formData.append('overview', overviewFile);
      }

      // API 호출 (credentials: 'include'로 쿠키/세션 전송)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/event-insurance/estimate`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        alert('견적 신청이 완료되었습니다.\n담당자가 확인 후 연락드리겠습니다.');
        // 폼 초기화
        window.location.reload();
      } else {
        alert(data.message || '견적 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('견적 신청 오류:', error);
      alert('견적 신청 중 오류가 발생했습니다.');
    }
  };

  // 도움말 레이어 표시
  const [layerTitle, setLayerTitle] = useState('');
  
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

  return (
    <div className="event-insurance-page-pc">
      <Header isMobile={false} />

      <main 
        className="event-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* 오른쪽 고정 버튼 */}
        <div className="container_box_w">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              const popupWidth = 450;
              const popupHeight = 800;
              const screenX = window.screenX ?? window.screenLeft ?? 0;
              const screenY = window.screenY ?? window.screenTop ?? 0;
              const outerWidth = window.outerWidth ?? document.documentElement.clientWidth;
              const outerHeight = window.outerHeight ?? document.documentElement.clientHeight;
              const left = Math.max(0, Math.round(screenX + (outerWidth - popupWidth) / 2));
              const top = Math.max(0, Math.round(screenY + (outerHeight - popupHeight) / 2));
              window.open(
                '/event-insurance/guide',
                'eventGuide',
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
              );
            }}
          >
            <div className="fixedRight_b01">
              <p className="fixedRight_txt01">행사주최자배상<br/>책임보험 안내</p>
            </div>
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); setShowServiceModal(true); }}>
            <div className="fixedRight_b02" style={{}}>
              <p className="icon_menu"><span className="icon_menu01"></span></p>
              <p className="fixedRight_txt02">서비스<br/>전체보기</p>
            </div>
          </a>
        </div>

        <section className="main_bg01 main_bg01_w">
          <div className="container_w">
            <section className="container_box_w">
              <div className="container_box">
                <div className="prow_01">
                  <form id="inputForm" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div>
                      {/* 타이틀 */}
                      <p className="tour2023_title02" style={{ marginTop: '20px' }}>
                        행사주최자 배상책임보험 견적신청
                      </p>
                      <div className="tour2023_txt40 tourG_mat22 tourG_mab07">
                        <p>지역축제, 공연, 콘서트, 박람회, 체육행사 등 안전한 행사 진행을 위해 행사보험을 준비하세요.</p>
                      </div>

                      {/* 01. 행사주최자 */}
                      <div className="tourG_mat04">
                        <p className="tour2023_title05">행사주최자</p>
                        <div className="tourG_mat27 tourG_mab05">
                          <section className="tourGuard_Info">
                            {/* 법인단체명 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03">
                              <label htmlFor="contract_name">법인단체명</label>
                              <input
                                type="text"
                                id="contract_name"
                                name="contractor_name"
                                maxLength={20}
                                placeholder="행사를 주최하는 법인단체명을 입력해 주세요"
                                className="tourGuard_input_w02"
                                value={contractorName}
                                onChange={(e) => setContractorName(e.target.value)}
                              />
                            </div>
                            {/* 사업자번호 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line03">
                              <label htmlFor="resno1">사업자번호</label>
                              <input
                                type="tel"
                                id="resno1"
                                name="resno1"
                                maxLength={3}
                                placeholder=""
                                className="tourGuard_input_w03"
                                value={resno1}
                                onChange={(e) => {
                                  handleNumberInput(e.target.value, setResno1);
                                  handleNextInput(e.target.value, 3, 'resno2');
                                }}
                              />
                              <input
                                type="tel"
                                id="resno2"
                                name="resno2"
                                maxLength={2}
                                placeholder=""
                                className="tourGuard_input_w03"
                                value={resno2}
                                onChange={(e) => {
                                  handleNumberInput(e.target.value, setResno2);
                                  handleNextInput(e.target.value, 2, 'resno3');
                                }}
                              />
                              <input
                                type="tel"
                                id="resno3"
                                name="resno3"
                                maxLength={5}
                                placeholder=""
                                className="tourGuard_input_w03"
                                value={resno3}
                                onChange={(e) => handleNumberInput(e.target.value, setResno3)}
                              />
                            </div>
                            {/* 담당자명 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03">
                              <label htmlFor="incharge">담당자명</label>
                              <input
                                type="text"
                                id="incharge"
                                name="incharge"
                                maxLength={15}
                                placeholder="담당자명을 입력해 주세요"
                                className="tourGuard_input_w02"
                                value={incharge}
                                onChange={(e) => setIncharge(e.target.value)}
                              />
                            </div>
                            {/* 휴대폰 번호 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03">
                              <label htmlFor="ctel_no">휴대폰 번호</label>
                              <input
                                type="tel"
                                id="ctel_no"
                                name="ctel_no"
                                maxLength={13}
                                placeholder="숫자만 입력해주세요."
                                className="tourGuard_input_w02"
                                value={ctelNo}
                                onChange={(e) => setCtelNo(formatPhoneNumber(e.target.value))}
                              />
                            </div>
                            {/* 사무실 전화번호 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03">
                              <label htmlFor="tel_no">사무실 전화번호</label>
                              <input
                                type="tel"
                                id="tel_no"
                                name="tel_no"
                                maxLength={13}
                                placeholder="숫자만 입력해주세요.(지역번호 포함)"
                                className="tourGuard_input_w02"
                                value={telNo}
                                onChange={(e) => setTelNo(formatTelNumber(e.target.value))}
                              />
                            </div>
                            {/* 이메일 주소 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03">
                              <label htmlFor="email1">이메일 주소</label>
                              <input
                                type="text"
                                id="email1"
                                name="email1"
                                maxLength={20}
                                placeholder=""
                                className="tourGuard_input_w01"
                                value={email1}
                                onChange={(e) => setEmail1(e.target.value)}
                              />
                              <div className="tourGuard_txt03" style={{ left: '32%' }}>@</div>
                              <input
                                type="text"
                                id="email2"
                                name="email2"
                                maxLength={20}
                                className="tourGuard_input_w01"
                                value={email2}
                                onChange={(e) => setEmail2(e.target.value)}
                              />
                              <div className="tourGuard_input_cell08 tourGuard_input_cell09 tourGuard">
                                <span className="tourGuard_ps_box">
                                  <select
                                    className="tourGuard_sel"
                                    id="select_email"
                                    name="select_email"
                                    value={selectEmail}
                                    onChange={(e) => handleEmailSelect(e.target.value)}
                                  >
                                    <option value="" disabled>선택</option>
                                    {emailDomains.map((domain) => (
                                      <option key={domain} value={domain}>{domain}</option>
                                    ))}
                                  </select>
                                </span>
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* 02. 행사내용 */}
                      <div className="tourG_mat10">
                        <p className="tour2023_title05">행사내용</p>
                        <div className="tourG_mat27 tourG_mab05">
                          <section className="tourGuard_Info">
                            {/* 행사명 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03">
                              <label htmlFor="event_name">행사명</label>
                              <input
                                type="text"
                                id="event_name"
                                name="event_name"
                                maxLength={30}
                                placeholder="행사명을 입력해 주세요"
                                className="tourGuard_input_w02"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                              />
                            </div>
                            {/* 행사시작일 */}
                            <div className="field-row tourG_line">
                              <div className="field-group date-field">
                                <label className="field-label" htmlFor="start_date">행사시작일</label>
                                <DatePicker
                                  id="start_date"
                                  selected={startDate}
                                  onChange={(date: Date | null) => {
                                    setStartDate(date);
                                    setHasSelectedStartDate(
                                      !!date && date.getTime() !== initialStartDateRef.current?.getTime()
                                    );
                                    if (date) setUserHasInteractedWithStartDate(true);
                                    if (date && endDate && date > endDate) {
                                      // 종료일 자동 보정 시에는 '사용자 선택'으로 처리하지 않음
                                      setEndDate(date);
                                      setHasSelectedEndDate(false);
                                    }
                                  }}
                                  onSelect={(date: Date | null) => {
                                    if (date) {
                                      setHasSelectedStartDate(
                                        date.getTime() !== initialStartDateRef.current?.getTime()
                                      );
                                      setUserHasInteractedWithStartDate(true);
                                    }
                                  }}
                                  dateFormat="yyyy-MM-dd"
                                  formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                                  locale="ko"
                                  placeholderText="날짜 선택"
                                  dateFormatCalendar="yyyy년 MM월"
                                  minDate={today}
                                  className={`field-input date-input ${(hasSelectedStartDate || userHasInteractedWithStartDate) ? 'has-value user-selected' : ''}`}
                                  wrapperClassName="date-picker-wrapper"
                                  calendarClassName="custom-calendar"
                                  popperClassName="custom-popper"
                                  showPopperArrow={false}
                                  popperPlacement="bottom-start"
                                  shouldCloseOnSelect={true}
                                  strictParsing
                                  autoComplete="off"
                                />
                              </div>
                              <span className="field-separator">/</span>
                              <div className="field-group time-field">
                                <select
                                  id="start_hour"
                                  name="start_hour"
                                  value={startHour}
                                  onChange={(e) => setStartHour(e.target.value)}
                                  className="field-input time-select"
                                >
                                  {hours.map((hour) => (
                                    <option key={hour} value={hour}>{hour}시</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {/* 행사종료일 */}
                            <div className="field-row tourG_line">
                              <div className="field-group date-field">
                                <label className="field-label" htmlFor="end_date">행사종료일</label>
                                <DatePicker
                                  id="end_date"
                                  selected={endDate}
                                  onChange={(date: Date | null) => {
                                    if (date && startDate && date < startDate) {
                                      alert('종료일은 시작일보다 이전일 수 없습니다.');
                                      setEndDate(startDate);
                                      // 시작일로 되돌릴 때는 '사용자 선택'으로 처리하지 않음
                                      setHasSelectedEndDate(false);
                                    } else {
                                      setEndDate(date);
                                      setHasSelectedEndDate(
                                        !!date && date.getTime() !== initialEndDateRef.current?.getTime()
                                      );
                                      if (date) setUserHasInteractedWithEndDate(true);
                                    }
                                  }}
                                  onSelect={(date: Date | null) => {
                                    if (date) {
                                      setHasSelectedEndDate(
                                        date.getTime() !== initialEndDateRef.current?.getTime()
                                      );
                                      setUserHasInteractedWithEndDate(true);
                                    }
                                  }}
                                  dateFormat="yyyy-MM-dd"
                                  formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                                  locale="ko"
                                  placeholderText="날짜 선택"
                                  dateFormatCalendar="yyyy년 MM월"
                                  minDate={startDate || today}
                                  className={`field-input date-input ${(hasSelectedEndDate || userHasInteractedWithEndDate) ? 'has-value user-selected' : ''}`}
                                  wrapperClassName="date-picker-wrapper"
                                  calendarClassName="custom-calendar"
                                  popperClassName="custom-popper"
                                  showPopperArrow={false}
                                  popperPlacement="bottom-start"
                                  shouldCloseOnSelect={true}
                                  strictParsing
                                  autoComplete="off"
                                />
                              </div>
                              <span className="field-separator">/</span>
                              <div className="field-group time-field">
                                <select
                                  id="end_hour"
                                  name="end_hour"
                                  value={endHour}
                                  onChange={(e) => setEndHour(e.target.value)}
                                  className="field-input time-select"
                                >
                                  {hours.map((hour) => (
                                    <option key={hour} value={hour}>{hour}시</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {/* 예상참여인원 */}
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
                                maxLength={5}
                                placeholder="숫자만 입력해주세요."
                                className="tourGuard_input_w02"
                                value={insuredCnt}
                                onChange={(e) => handleNumberInput(e.target.value, setInsuredCnt)}
                              />
                              <div className="tourGuard_txt21">명</div>
                            </div>
                            {/* 운동경기 / 불꽃놀이 유무 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                              <div className="tourG_rdo_area">
                                <label htmlFor="action_info_1_Y">운동경기/체육활동 유무</label>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_1_Y"
                                    value="AT"
                                    name="action_info_1"
                                    checked={actionInfo1 === 'AT'}
                                    onChange={(e) => setActionInfo1(e.target.value)}
                                  />
                                  <label htmlFor="action_info_1_Y">유</label>
                                </span>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_1_N"
                                    value="N"
                                    name="action_info_1"
                                    checked={actionInfo1 === 'N'}
                                    onChange={(e) => setActionInfo1(e.target.value)}
                                  />
                                  <label htmlFor="action_info_1_N" className="one_line0">무</label>
                                </span>
                              </div>
                              <div className="tourG_rdo_area">
                                <label htmlFor="action_info_2_Y">불꽃놀이 유무</label>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_2_Y"
                                    value="FW"
                                    name="action_info_2"
                                    checked={actionInfo2 === 'FW'}
                                    onChange={(e) => setActionInfo2(e.target.value)}
                                  />
                                  <label htmlFor="action_info_2_Y">유</label>
                                </span>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_2_N"
                                    value="N"
                                    name="action_info_2"
                                    checked={actionInfo2 === 'N'}
                                    onChange={(e) => setActionInfo2(e.target.value)}
                                  />
                                  <label htmlFor="action_info_2_N" className="one_line0">무</label>
                                </span>
                              </div>
                            </div>
                            {/* 수상위험 / 놀이시설(에어바운스) 유무 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                              <div className="tourG_rdo_area">
                                <label htmlFor="action_info_3_Y">수상위험 유무</label>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_3_Y"
                                    value="WR"
                                    name="action_info_3"
                                    checked={actionInfo3 === 'WR'}
                                    onChange={(e) => setActionInfo3(e.target.value)}
                                  />
                                  <label htmlFor="action_info_3_Y">유</label>
                                </span>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_3_N"
                                    value="N"
                                    name="action_info_3"
                                    checked={actionInfo3 === 'N'}
                                    onChange={(e) => setActionInfo3(e.target.value)}
                                  />
                                  <label htmlFor="action_info_3_N" className="one_line0">무</label>
                                </span>
                              </div>
                              <div className="tourG_rdo_area">
                                <label htmlFor="action_info_4_Y">놀이시설(에어바운스) 유무</label>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_4_Y"
                                    value="PF"
                                    name="action_info_4"
                                    checked={actionInfo4 === 'PF'}
                                    onChange={(e) => setActionInfo4(e.target.value)}
                                  />
                                  <label htmlFor="action_info_4_Y">유</label>
                                </span>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_4_N"
                                    value="N"
                                    name="action_info_4"
                                    checked={actionInfo4 === 'N'}
                                    onChange={(e) => setActionInfo4(e.target.value)}
                                  />
                                  <label htmlFor="action_info_4_N" className="one_line0">무</label>
                                </span>
                              </div>
                            </div>
                            {/* 드론 / 기타 위험활동 유무 */}
                            <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                              <div className="tourG_rdo_area">
                                <label htmlFor="action_info_5_Y">드론 유무</label>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_5_Y"
                                    value="DR"
                                    name="action_info_5"
                                    checked={actionInfo5 === 'DR'}
                                    onChange={(e) => setActionInfo5(e.target.value)}
                                  />
                                  <label htmlFor="action_info_5_Y">유</label>
                                </span>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_5_N"
                                    value="N"
                                    name="action_info_5"
                                    checked={actionInfo5 === 'N'}
                                    onChange={(e) => setActionInfo5(e.target.value)}
                                  />
                                  <label htmlFor="action_info_5_N" className="one_line0">무</label>
                                </span>
                              </div>
                              <div className="tourG_rdo_area">
                                <label htmlFor="action_info_6_Y">기타 위험활동 유무</label>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_6_Y"
                                    value="ET"
                                    name="action_info_6"
                                    checked={actionInfo6 === 'ET'}
                                    onChange={(e) => setActionInfo6(e.target.value)}
                                  />
                                  <label htmlFor="action_info_6_Y">유</label>
                                </span>
                                <span className="tourG_inp_rdo">
                                  <input
                                    type="radio"
                                    id="action_info_6_N"
                                    value="N"
                                    name="action_info_6"
                                    checked={actionInfo6 === 'N'}
                                    onChange={(e) => setActionInfo6(e.target.value)}
                                  />
                                  <label htmlFor="action_info_6_N" className="one_line0">무</label>
                                </span>
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* 03. 보험가입조건 */}
                      <div className="tour2023_flex tourG_mat04">
                        <p className="tour2023_title18">보험가입조건</p>
                        <ul className="tour2023_agree tourG_mat06 tourG_mRight02">
                          <li className="tour2023_cir tour2023_chk tourG_mat02">
                            <input
                              type="checkbox"
                              name="input_yn"
                              id="input_yn"
                              checked={inputYn}
                              onChange={(e) => handleCoverInputToggle(e.target.checked)}
                            />
                            <label htmlFor="input_yn">
                              <span className="tourGuard_txt24"> 직접입력</span>
                            </label>
                          </li>
                        </ul>
                      </div>
                      <section className="tourGuard_Info">
                        <div className="tourG_mab03">
                          <table className="tour2024_ListB" border={1} cellSpacing={0}>
                            <caption></caption>
                            <colgroup>
                              <col width="" />
                              <col width="" />
                              <col width="" />
                              <col width="" />
                            </colgroup>
                            <tbody id="generalCover" style={{ display: inputYn ? 'none' : '' }}>
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('bi'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('pi'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
                                    </a>
                                  </div>
                                </td>
                                <td className="ag_center">-</td>
                                <td className="ag_center">1,000만원</td>
                              </tr>
                              <tr>
                                <td className="ag_center tour2024_ListB_bg02">
                                  {' '}
                                  (선택)&nbsp;
                                  <ul className="tour2023_check">
                                    <li className="tour2023_cir03 tour2023_chk03 tourG_mat02">
                                      <input
                                        type="checkbox"
                                        name="me_check1"
                                        checked={meCheck1}
                                        onChange={(e) => setMeCheck1(e.target.checked)}
                                      />
                                    </li>
                                  </ul>
                                </td>
                                <td className="ag_center tour2024_ListB_bg02">
                                  <div className="tour2023_insuBox01">
                                    참가자치료비
                                    <br />
                                    (구내치료비){' '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('me'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
                                    </a>
                                  </div>
                                </td>
                                <td className="ag_center">
                                  <span className="tourGuard_blue">100만원</span>
                                </td>
                                <td className="ag_center">
                                  <span className="tourGuard_blue">1,000만원</span>
                                </td>
                              </tr>
                              <tr>
                                <td className="ag_center tour2024_ListB_bg02">필수</td>
                                <td className="ag_center tour2024_ListB_bg02">
                                  <div className="tour2023_insuBox01">
                                    자기부담금{' '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('dt'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
                                    </a>
                                  </div>
                                </td>
                                <td className="ag_center">-</td>
                                <td className="ag_center">10만원</td>
                              </tr>
                            </tbody>
                            <tbody id="inputCover" style={{ display: inputYn ? '' : 'none' }}>
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('bi'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
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
                                          value={biCover1}
                                          onChange={(e) => setBiCover1(e.target.value)}
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
                                          value={biCover2}
                                          onChange={(e) => setBiCover2(e.target.value)}
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('pi'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
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
                                          value={piCover1}
                                          onChange={(e) => setPiCover1(e.target.value)}
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
                                  {' '}
                                  (선택)&nbsp;
                                  <ul className="tour2023_check">
                                    <li className="tour2023_cir03 tour2023_chk03 tourG_mat02">
                                      <input
                                        type="checkbox"
                                        name="me_check2"
                                        checked={meCheck2}
                                        onChange={(e) => setMeCheck2(e.target.checked)}
                                      />
                                    </li>
                                  </ul>
                                </td>
                                <td className="ag_center tour2024_ListB_bg02">
                                  <div className="tour2023_insuBox01">
                                    참가자치료비
                                    <br />
                                    (구내치료비){' '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('me'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
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
                                          value={meCover1}
                                          onChange={(e) => setMeCover1(e.target.value)}
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
                                          value={meCover2}
                                          onChange={(e) => setMeCover2(e.target.value)}
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
                                    <a href="#" onClick={(e) => { e.preventDefault(); showHelpLayer('dt'); }}>
                                      <span className="icon_tip01 icon_tip02">도움말 보기</span>
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
                                          value={dtCover1}
                                          onChange={(e) => setDtCover1(e.target.value)}
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
                          <li className="tourGuard_inline_t02">
                            구내치료비는 선택사항입니다.{' '}
                            <span className="tour2023_blue">
                              (단, 체육활동이 포함되어 있으면 가입할 수 없습니다.)
                            </span>
                          </li>
                        </ul>
                      </div>

                      {/* 04. 첨부서류 */}
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

                      {/* 개인정보 수집 및 이용 동의 */}
                      <div className="in_wrap">
                        <div className="in_wrap pb5">
                          <ul className="tourG_agree">
                            <li className="tourG_cir tourG_chk">
                              <input
                                type="checkbox"
                                name="agree"
                                id="agree"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
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
                  </form>
                </div>

                <div className="tourG_mat20 tourG_Wrap"></div>
                {/* 하단 고정버튼 */}
                <section id="tour2023_fixedBanner" style={{ position: 'relative' }}>
                  <div className="tour2023_bottom_btn">
                    <a
                      href="#"
                      className="tour2023_btn_b tour2023_btn07"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmit();
                      }}
                    >
                      견적신청하기
                    </a>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </section>

        {/* 심의번호 */}
        <section className="ss_number_w">
          <div className="ss_number">
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
            <br />
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </div>
        </section>

        {/* 도움말 레이어 - 화면 가운데 모달 */}
        {showInfoLayer && (
          <section
            className="tour2023_guide_Wrap"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowInfoLayer(false)}
          >
            <div className="tour2023_help_Layer" id="infoLayerDiv" onClick={(e) => e.stopPropagation()}>
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

      </main>

      <Footer isMobile={false} />
      
      {/* 서비스 전체보기 모달 */}
      <ServiceModal 
        isOpen={showServiceModal} 
        onClose={() => setShowServiceModal(false)} 
      />
      
      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />
    </div>
  );
}

