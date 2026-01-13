'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { sendVerificationCode, verifyCode } from '@/services/smsService';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import ServiceModal from '@/components/ServiceModal';
import GiftCardExchangeModal from '@/components/mileage/GiftCardExchangeModal';
import { getImagePath } from '@/utils/path';
import './page.css';

export default function MobileContractPage() {
  const router = useRouter();
  const { isLoggedIn, member } = useAuth();

  // 로그인한 유저용 상태
  const [searchType, setSearchType] = useState<'contract' | 'event'>('contract');
  const [inYear, setInYear] = useState<number>(1);
  const [mileageInYear, setMileageInYear] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'contract' | 'mileage'>('contract');
  const [showGiftCardModal, setShowGiftCardModal] = useState<boolean>(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // 계약 목록 데이터
  interface Contract {
    id: number;
    contractNumber: string;
    insuranceType: string;
    planTypes: string[];
    departureDate: string;
    arrivalDate: string;
    totalPremium: number;
    status: string;
    createdAt: string;
    travelRegion?: string | null;
    travelCountry?: string | null;
    travelPurpose?: string | null;
  }
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractPagination, setContractPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  }>({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 3 });

  // 행사보험 계약 목록 데이터
  interface EventContract {
    id: number;
    contractNumber: string;
    insuranceType: string;
    insuranceCompany: string;
    eventName: string;
    eventLocation?: string | null;
    participants: number;
    startDate: string;
    endDate: string;
    premium: number;
    status: string;
    createdAt: string;
    contractor?: string | null;
  }
  const [eventContracts, setEventContracts] = useState<EventContract[]>([]);
  const [eventContractPagination, setEventContractPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  }>({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });

  // 마일리지 데이터
  interface MileageHistory {
    id: number;
    type: string;
    amount: number;
    balance: number;
    reason: string | null;
    reason_detail: string | null;
    created_at: string;
  }
  const [mileageInfo, setMileageInfo] = useState<{ totalMileage: number }>({ totalMileage: 0 });
  const [mileageList, setMileageList] = useState<MileageHistory[]>([]);

  // 로그인 타입 (비로그인 사용자용)
  const [loginType, setLoginType] = useState<'I' | 'C'>('I');

  // 개인 정보
  const [insuredName, setInsuredName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'1' | '2'>('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // 단체 정보
  const [companyName, setCompanyName] = useState('');
  const [businessNumber1, setBusinessNumber1] = useState('');
  const [businessNumber2, setBusinessNumber2] = useState('');
  const [businessNumber3, setBusinessNumber3] = useState('');
  const [companyPhoneNumber, setCompanyPhoneNumber] = useState('');
  const [companyVerificationCode, setCompanyVerificationCode] = useState('');
  const [showCompanyVerificationInput, setShowCompanyVerificationInput] = useState(false);
  const [companyRemainingTime, setCompanyRemainingTime] = useState(0);

  // 기타 상태
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [reSendYn, setReSendYn] = useState('N');
  const [beforeCtel, setBeforeCtel] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);

  // 타이머 효과
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  useEffect(() => {
    if (companyRemainingTime > 0) {
      const timer = setInterval(() => {
        setCompanyRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [companyRemainingTime]);

  // 유효성 검사
  const isValidBirthDate = (date: string): boolean => {
    if (date.length !== 8) return false;
    const year = parseInt(date.substring(0, 4));
    const month = parseInt(date.substring(4, 6));
    const day = parseInt(date.substring(6, 8));
    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    return true;
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/-/g, '');
    return /^01[0-9]{9}$/.test(cleaned);
  };

  // 인증번호 발송
  const handleSendVerification = async () => {
    if (loginType === 'I') {
      if (!insuredName.trim()) {
        alert('대표가입자명을 입력해 주세요.');
        return;
      }
      if (!birthDate || !isValidBirthDate(birthDate)) {
        alert('생년월일을 8자리로 입력해 주세요.');
        return;
      }
      if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
        alert('휴대폰 번호를 정확히 입력해 주세요.');
        return;
      }

      const cleanedPhone = phoneNumber.replace(/-/g, '');
      if (beforeCtel !== cleanedPhone) {
        setBeforeCtel(cleanedPhone);
        setReSendYn('N');
      }

      try {
        const result = await sendVerificationCode(cleanedPhone, false);
        if (result.success) {
          alert('인증번호가 발송되었습니다.');
          setShowVerificationInput(true);
          setRemainingTime(180);
          setIsVerificationSent(true);
          if (reSendYn === 'N') setReSendYn('Y');
        } else {
          alert(result.message || '인증번호 발송에 실패했습니다.');
        }
      } catch (error) {
        console.error('인증번호 발송 오류:', error);
        alert('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } else {
      if (!companyName.trim()) {
        alert('단체(사업자/법인)명을 입력해 주세요.');
        return;
      }
      if (!businessNumber1 || businessNumber1.length < 3) {
        alert('사업자번호를 정확히 입력해 주세요.');
        return;
      }
      if (!businessNumber2 || businessNumber2.length < 2) {
        alert('사업자번호를 정확히 입력해 주세요.');
        return;
      }
      if (!businessNumber3 || businessNumber3.length < 5) {
        alert('사업자번호를 정확히 입력해 주세요.');
        return;
      }
      if (!companyPhoneNumber || !isValidPhoneNumber(companyPhoneNumber)) {
        alert('휴대폰 번호를 정확히 입력해 주세요.');
        return;
      }

      const cleanedPhone = companyPhoneNumber.replace(/-/g, '');
      if (beforeCtel !== cleanedPhone) {
        setBeforeCtel(cleanedPhone);
        setReSendYn('N');
      }

      try {
        const result = await sendVerificationCode(cleanedPhone, false);
        if (result.success) {
          alert('인증번호가 발송되었습니다.');
          setShowCompanyVerificationInput(true);
          setCompanyRemainingTime(180);
          setIsVerificationSent(true);
          if (reSendYn === 'N') setReSendYn('Y');
        } else {
          alert(result.message || '인증번호 발송에 실패했습니다.');
        }
      } catch (error) {
        console.error('인증번호 발송 오류:', error);
        alert('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    if (remainingTime <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      return;
    }

    try {
      const cleanedPhone = phoneNumber.replace(/-/g, '');
      const result = await verifyCode(cleanedPhone, verificationCode);
      if (result.success) {
        alert('인증이 완료되었습니다.');
        router.push('/contracts/list');
      } else {
        alert(result.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('인증번호 확인 오류:', error);
      alert('인증 확인에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleVerifyCompanyCode = async () => {
    if (!companyVerificationCode || companyVerificationCode.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    if (companyRemainingTime <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      return;
    }

    try {
      const cleanedPhone = companyPhoneNumber.replace(/-/g, '');
      const result = await verifyCode(cleanedPhone, companyVerificationCode);
      if (result.success) {
        alert('인증이 완료되었습니다.');
        router.push('/contracts/list');
      } else {
        alert(result.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('인증번호 확인 오류:', error);
      alert('인증 확인에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleSearch = async () => {
    if (loginType === 'I') {
      if (!showVerificationInput || !isVerificationSent) {
        alert('인증번호받기를 먼저 해주세요.');
        return;
      }
      await handleVerifyCode();
    } else {
      if (!showCompanyVerificationInput || !isVerificationSent) {
        alert('인증번호받기를 먼저 해주세요.');
        return;
      }
      await handleVerifyCompanyCode();
    }
  };

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 8) {
      setBirthDate(value);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      setPhoneNumber(value);
    }
  };

  const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      setCompanyPhoneNumber(value);
    }
  };

  const handleBusinessNumber1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 3) {
      setBusinessNumber1(value);
    }
  };

  const handleBusinessNumber2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 2) {
      setBusinessNumber2(value);
    }
  };

  const handleBusinessNumber3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 5) {
      setBusinessNumber3(value);
    }
  };

  // 로그인한 유저용: 계약 목록 조회
  const getContractList = async (page: number = 1) => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/contracts/list?member_id=${member.id}&inyear=${inYear}&block_type=C&str_cur_page=${page}&pageSize=3`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        const contractsData = data.contracts || [];
        const limitedContracts = contractsData.slice(0, 3);
        setContracts(limitedContracts);
        
        const totalCount = data.pagination?.totalCount || 0;
        const totalPages = Math.ceil(totalCount / 3);
        setContractPagination({
          currentPage: data.pagination?.currentPage || page,
          totalPages: totalPages,
          totalCount: totalCount,
          pageSize: 3
        });
      } else {
        setContracts([]);
        setContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 3 });
      }
    } catch (error) {
      console.error('계약 목록 조회 오류:', error);
      setContracts([]);
      setContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 3 });
    }
  };

  // 로그인한 유저용: 행사보험 계약 목록 조회
  const getEventContractList = async (page: number = 1) => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/event-contracts/list?member_id=${member.id}&inyear=${inYear}&block_type=C&str_cur_page=${page}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        setEventContracts(data.contracts || []);
        setEventContractPagination({
          currentPage: data.pagination?.currentPage || page,
          totalPages: data.pagination?.totalPages || 0,
          totalCount: data.pagination?.totalCount || 0,
          pageSize: data.pagination?.pageSize || 10
        });
      } else {
        setEventContracts([]);
        setEventContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
      }
    } catch (error) {
      console.error('행사보험 계약 목록 조회 오류:', error);
      setEventContracts([]);
      setEventContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
    }
  };

  // 로그인한 유저용: 마일리지 정보 조회
  const getMileageInfo = async () => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/mileage/info?member_id=${member.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMileageInfo({
            totalMileage: data.totalMileage || 0,
          });
        }
      }
    } catch (error) {
      console.error('마일리지 정보 조회 오류:', error);
    }
  };

  // 로그인한 유저용: 마일리지 내역 조회
  const getMileageList = async () => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/mileage/list?member_id=${member.id}&inyear=${mileageInYear}&block_type=C&str_cur_page=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        setMileageList(data.mileageList || []);
      } else {
        setMileageList([]);
      }
    } catch (error) {
      console.error('마일리지 내역 조회 오류:', error);
      setMileageList([]);
    }
  };

  // 로그인한 유저용: 데이터 로딩 useEffect
  useEffect(() => {
    if (isLoggedIn && member) {
      if (activeTab === 'contract') {
        if (searchType === 'contract') {
          getContractList(1);
        } else if (searchType === 'event') {
          getEventContractList(1);
        }
      } else if (activeTab === 'mileage') {
        getMileageInfo();
        getMileageList();
      }
    }
  }, [isLoggedIn, member, inYear, activeTab, searchType]);

  // 마일리지 내역 조회 기간 변경 시
  useEffect(() => {
    if (isLoggedIn && member && activeTab === 'mileage') {
      getMileageList();
    }
  }, [mileageInYear]);

  // 비로그인 사용자 화면 렌더링
  const renderNonLoggedInView = () => (
    <>
      {/* 메인 컨텐츠 */}
      <div className="tour2023_header_line prow_01">
        <div className="tour2023_header_inner">
          <span className="tourTop_title">계약/캐시 조회</span>
        </div>
      </div>

      <form name="loginForm" method="post">
        <div className="prow_01">
          <p className="tour2023_title04">가입자정보</p>

          {/* 개인/단체 선택 */}
          <div className="tour2023_ra_Wrap tourG_mab08">
            <ul className="tour2023_ra_Wrap01">
              <li className="tour2023_rdo_area">
                <span className="tour2023_inp_rdo">
                  <input 
                    type="radio" 
                    id="one_pgood01" 
                    value="I" 
                    name="login_type" 
                    checked={loginType === 'I'}
                    onChange={(e) => {
                      setLoginType('I');
                      setShowVerificationInput(false);
                      setShowCompanyVerificationInput(false);
                      setIsVerificationSent(false);
                      setRemainingTime(0);
                      setCompanyRemainingTime(0);
                    }}
                  />
                  <label htmlFor="one_pgood01">개인</label>
                </span>
                <span className="tour2023_inp_rdo">
                  <input 
                    type="radio" 
                    id="one_pgood02" 
                    value="C" 
                    name="login_type"
                    checked={loginType === 'C'}
                    onChange={(e) => {
                      setLoginType('C');
                      setShowVerificationInput(false);
                      setShowCompanyVerificationInput(false);
                      setIsVerificationSent(false);
                      setRemainingTime(0);
                      setCompanyRemainingTime(0);
                    }}
                  />
                  <label htmlFor="one_pgood02">단체(사업자/법인)</label>
                </span>
              </li>
            </ul>
          </div>

          <div className="tourGuard_Info">
            {/* 개인 입력 영역 */}
            {loginType === 'I' && (
              <div id="input_I" data-name="input_area">
                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="insured_name">대표가입자명</label>
                  <input 
                    type="text" 
                    name="insured_name" 
                    id="insured_name" 
                    maxLength={15} 
                    placeholder="대표가입자명" 
                    className="tourGuard_input_w02"
                    value={insuredName}
                    onChange={(e) => setInsuredName(e.target.value)}
                  />
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                  <label htmlFor="birth_date">생년월일</label>
                  <input 
                    type="tel" 
                    name="birth_date" 
                    id="birth_date" 
                    maxLength={8} 
                    placeholder="예)19990515" 
                    className="tourGuard_input_w01"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                  />

                  <div className="tourG_rdo_area">
                    <label htmlFor="rad_mw01">성별</label>
                    <span className="tourG_inp_rdo">
                      <input 
                        type="radio" 
                        id="rad_mw01" 
                        value="1" 
                        name="gender"
                        checked={gender === '1'}
                        onChange={() => setGender('1')}
                      />
                      <label htmlFor="rad_mw01">남자</label>
                    </span>
                    <span className="tourG_inp_rdo">
                      <input 
                        type="radio" 
                        id="rad_mw02" 
                        value="2" 
                        name="gender"
                        checked={gender === '2'}
                        onChange={() => setGender('2')}
                      />
                      <label htmlFor="rad_mw02" className="one_line0">여자</label>
                    </span>
                  </div>
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="ctel_no">휴대폰 번호</label>
                  <input 
                    type="tel" 
                    name="ctel_no" 
                    id="ctel_no" 
                    maxLength={11} 
                    placeholder="숫자만 입력해주세요." 
                    className="tourGuard_input_w02"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                  />
                  <div className="tour2023_event_file">
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handleSendVerification(); }}
                      className="tour2023_btn_b01 tour2023_btn11"
                    >
                      인증받기
                    </a>
                  </div>
                </div>

                {showVerificationInput && (
                  <div id="signArea" className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor="signNo">인증번호</label>
                    <input 
                      type="tel" 
                      id="signNo" 
                      name="signNo" 
                      maxLength={6} 
                      placeholder="6자리 입력" 
                      className="tourGuard_input_w02"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 6) {
                          setVerificationCode(value);
                        }
                      }}
                    />
                    <div className="tour2023_timer">
                      <span className="tour2023_timeLimit" data-name="compare_time">{formatTime(remainingTime)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 단체 입력 영역 */}
            {loginType === 'C' && (
              <div id="input_C" data-name="input_area">
                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="contract_company">단체(사업자/법인)명</label>
                  <input 
                    type="text" 
                    name="contract_company" 
                    maxLength={30} 
                    placeholder="단체(사업자/법인)명" 
                    className="tourGuard_input_w02"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line03">
                  <label htmlFor="resno1">사업자번호</label>
                  <input 
                    type="tel" 
                    name="resno1" 
                    maxLength={3} 
                    placeholder="" 
                    className="tourGuard_input_w03"
                    value={businessNumber1}
                    onChange={handleBusinessNumber1Change}
                  />
                  <input 
                    type="tel" 
                    name="resno2" 
                    maxLength={2} 
                    placeholder="" 
                    className="tourGuard_input_w03"
                    value={businessNumber2}
                    onChange={handleBusinessNumber2Change}
                  />
                  <input 
                    type="tel" 
                    name="resno3" 
                    maxLength={5} 
                    placeholder="" 
                    className="tourGuard_input_w03"
                    value={businessNumber3}
                    onChange={handleBusinessNumber3Change}
                  />
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="c_ctel_no">담당자 휴대폰 번호</label>
                  <input 
                    type="tel" 
                    name="c_ctel_no" 
                    maxLength={11} 
                    placeholder="숫자만 입력해주세요." 
                    className="tourGuard_input_w02"
                    value={companyPhoneNumber}
                    onChange={handleCompanyPhoneChange}
                  />
                  <div className="tour2023_event_file">
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handleSendVerification(); }}
                      className="tour2023_btn_b01 tour2023_btn11"
                    >
                      인증받기
                    </a>
                  </div>
                </div>

                {showCompanyVerificationInput && (
                  <div id="c_signArea" className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor="c_signNo">인증번호</label>
                    <input 
                      type="tel" 
                      id="c_signNo" 
                      name="c_signNo" 
                      maxLength={6} 
                      placeholder="6자리 입력" 
                      className="tourGuard_input_w02"
                      value={companyVerificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 6) {
                          setCompanyVerificationCode(value);
                        }
                      }}
                    />
                    <div className="tour2023_timer">
                      <span className="tour2023_timeLimit" data-name="compare_time">{formatTime(companyRemainingTime)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 조회하기 버튼 */}
          <div className="tourG_mat11">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); handleSearch(); }} 
              className="tourGuard_btn_b tour2023_btn01"
            >
              조회하기
            </a>
          </div>
        </div>
      </form>

      <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
        <span className="tour2023_txt02 tour2023_grey">
          <span>
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
            준법감시필 제2025-광고T-002(2025.04.07-2026-04.06)
          </span>
        </span>
      </div>
    </>
  );

  // 로그인한 사용자 화면 렌더링
  const renderLoggedInView = () => (
    <>
      {/* 상단 탭 메뉴 */}
      <section id="tour2023_mypageTop">
        <div className="tour2023_mypageTop_menu" style={{}}>
          <a 
            href="#" 
            className={`tour2023_mypageTop_w tour2023_mypageTop_m01_w02 tour2023_mypageTop_m01 ${activeTab === 'contract' ? 'on' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('contract');
            }}
          >
            가입/신청 내역
          </a>
          <a 
            href="#" 
            className={`tour2023_mypageTop_w tour2023_mypageTop_m01_w02 tour2023_mypageTop_m01 ${activeTab === 'mileage' ? 'on' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('mileage');
            }}
          >
            마일리지내역
          </a>
        </div>
      </section>

      <div className="prow_01">
        {/* 가입/신청 내역 탭 내용 */}
        {activeTab === 'contract' && (
          <>
            {/* 여행자보험/행사보험 선택 */}
            <div className="tour2023_ra_Wrap tourG_mat12 tourG_mab08">
              <ul className="tour2023_ra_Wrap01">
                <li className="tour2023_rdo_area">
                  <span className="tour2023_inp_rdo">
                    <input 
                      type="radio" 
                      id="one_pgood01" 
                      value="contract" 
                      name="search_type" 
                      checked={searchType === 'contract'}
                      onChange={(e) => setSearchType('contract')}
                    />
                    <label htmlFor="one_pgood01">여행자보험</label>
                  </span>
                  <span className="tour2023_inp_rdo">
                    <input 
                      type="radio" 
                      id="one_pgood02" 
                      value="event" 
                      name="search_type"
                      checked={searchType === 'event'}
                      onChange={(e) => setSearchType('event')}
                    />
                    <label htmlFor="one_pgood02">행사보험</label>
                  </span>
                </li>
              </ul>
            </div>

            {/* 보험가입내역 조회 */}
            <div className="tourGuard_form_tt mag5 tourG_mab04 tourG_mat10">
              <label htmlFor="">보험가입내역 조회</label>
              <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                <span className="tourGuard_ps_box">
                  <select 
                    className="tourGuard_sel" 
                    id="inyear" 
                    value={inYear}
                    onChange={(e) => setInYear(Number(e.target.value))}
                  >
                    <option value={1}>최근 1년이내</option>
                    <option value={2}>최근 2년이내</option>
                  </select>
                </span>
              </div>
            </div>

            {/* 계약 리스트 */}
            <div id="contractList" className="tourG_mat10" style={{}}>
              {searchType === 'contract' ? (
                contracts.length === 0 ? (
                  <>
                    <p className="tour2023_title02">가입/신청내역</p>
                    <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                    <p className="tour2023_mypageBox">
                      <span className="tour2023_title14">여행자보험 가입내역이 없습니다.</span>
                    </p>
                  </>
                ) : (
                  <>
                    {(() => {
                      // 헬퍼 함수들
                      const formatDate = (dateStr: string) => {
                        if (!dateStr) return '-';
                        const date = new Date(dateStr);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hour = date.getHours();
                        return `${year}.${month}.${day} ${hour}시`;
                      };

                      const calculateDuration = (start: string, end: string) => {
                        if (!start || !end) return '';
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                        
                        if (diffDays >= 1) {
                          return `(${diffDays}일)`;
                        } else {
                          return `(${diffHours}시간)`;
                        }
                      };

                      const getInsuranceTypeDisplay = (insuranceType: string) => {
                        const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
                        if (longTermTypes.includes(insuranceType)) {
                          return '해외장기체류보험';
                        }
                        return insuranceType;
                      };

                      const getInsuranceCompany = (insuranceType: string) => {
                        const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
                        if (insuranceType === '국내여행') {
                          return '라이나손해 국내여행보험';
                        } else if (insuranceType === '해외여행') {
                          return '라이나손해 해외여행보험';
                        } else if (longTermTypes.includes(insuranceType)) {
                          return '메리츠화재 해외장기체류보험';
                        }
                        return '라이나손해 해외여행보험';
                      };

                      return contracts.map((contract, index) => (
                        <div key={contract.id}>
                          {index === 0 && (
                            <p className="tour2023_title02">가입/신청내역</p>
                          )}
                          
                          <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                          <ul className="tour2023_conList_Wrap">
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">관리번호</span>
                              <span className="tour2023_txt10">
                                {contract.contractNumber}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">가입자</span>
                              <span className="tour2023_txt10">
                                {member?.name || '-'}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험종목/상품명</span>
                              <span className="tour2023_txt10">
                                {getInsuranceTypeDisplay(contract.insuranceType)}<br />
                                {getInsuranceCompany(contract.insuranceType)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험기간</span>
                              <span className="tour2023_txt10">
                                {formatDate(contract.departureDate)} ~ {formatDate(contract.arrivalDate)}<br />
                                {calculateDuration(contract.departureDate, contract.arrivalDate)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">여행지/여행목적</span>
                              <span className="tour2023_txt10">
                                {(() => {
                                  const destination = contract.travelCountry || contract.travelRegion || null;
                                  const purpose = contract.travelPurpose || null;
                                  
                                  if (destination && purpose) {
                                    return `${destination}/${purpose}`;
                                  } else if (purpose) {
                                    return purpose;
                                  } else if (destination) {
                                    return destination;
                                  }
                                  return '-';
                                })()}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">진행단계</span>
                              <span className="tour2023_txt10">{contract.status}</span>
                            </li>
                          </ul>
                          <div className="tourG_line05 tourG_mat09 tourG_mab04"></div>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              const popupWidth = 500;
                              const popupHeight = 700;
                              const left = (window.screen.width - popupWidth) / 2;
                              const top = (window.screen.height - popupHeight) / 2;
                              
                              window.open(
                                `/contracts/detail/${contract.id}`,
                                'contract_detail',
                                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
                              );
                            }}
                          >
                            <span className="tour2023_txt19">자세히보기&nbsp;&gt;</span>
                          </a>
                          <div className="tourG_mat14 tourG_Wrap"></div>
                        </div>
                      ));
                    })()}

                    {/* 페이지네이션 */}
                    {contractPagination.totalPages > 1 && (
                      <div className="board_foot" style={{ paddingBottom: '12px' }}>
                        <ul className="paging">
                          {Array.from({ length: contractPagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <li key={page} className={page === contractPagination.currentPage ? 'on' : ''}>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (page !== contractPagination.currentPage) {
                                    getContractList(page);
                                  }
                                }}
                              >
                                {page}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )
              ) : (
                eventContracts.length === 0 ? (
                  <>
                    <p className="tour2023_title02">가입/신청내역</p>
                    <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                    <p className="tour2023_mypageBox">
                      <span className="tour2023_title14">행사보험 가입내역이 없습니다.</span>
                    </p>
                  </>
                ) : (
                  <>
                    {(() => {
                      const formatEventDate = (dateStr: string) => {
                        if (!dateStr) return '-';
                        const date = new Date(dateStr);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hour = String(date.getHours()).padStart(2, '0');
                        return `${year}.${month}.${day} ${hour}시`;
                      };

                      const calculateEventDuration = (start: string, end: string) => {
                        if (!start || !end) return '';
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `(${diffDays}일)`;
                      };

                      const getStatusDisplay = (status: string) => {
                        if (status === '등록' || status === '견적신청') {
                          return <em className="tourGuard_red">{status}</em>;
                        }
                        return status;
                      };

                      return eventContracts.map((contract, index) => (
                        <div key={contract.id}>
                          {index === 0 && (
                            <p className="tour2023_title02">가입/신청내역</p>
                          )}
                          
                          <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                          <ul className="tour2023_conList_Wrap">
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">관리번호</span>
                              <span className="tour2023_txt10">
                                {contract.contractNumber}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">가입자</span>
                              <span className="tour2023_txt10">
                                {contract.contractor || member?.name || '-'}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험종목/상품명</span>
                              <span className="tour2023_txt10">
                                {contract.insuranceType}<br />
                                {contract.insuranceCompany}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">행사명</span>
                              <span className="tour2023_txt10">
                                {contract.eventName}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험기간</span>
                              <span className="tour2023_txt10">
                                {formatEventDate(contract.startDate)} ~ {formatEventDate(contract.endDate)}<br />
                                {calculateEventDuration(contract.startDate, contract.endDate)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">진행단계</span>
                              <span className="tour2023_txt10">{getStatusDisplay(contract.status)}</span>
                            </li>
                          </ul>
                          <div className="tourG_line05 tourG_mat09 tourG_mab04"></div>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              const popupWidth = 500;
                              const popupHeight = 700;
                              const left = (window.screen.width - popupWidth) / 2;
                              const top = (window.screen.height - popupHeight) / 2;
                              
                              window.open(
                                `/contracts/event-detail/${contract.id}`,
                                'event_contract_detail',
                                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
                              );
                            }}
                          >
                            <span className="tour2023_txt19">자세히보기&nbsp;&gt;</span>
                          </a>
                          <div className="tourG_mat14 tourG_Wrap"></div>
                        </div>
                      ));
                    })()}

                    {/* 페이지네이션 */}
                    {eventContractPagination.totalPages > 1 && (
                      <div className="board_foot" style={{ paddingBottom: '12px' }}>
                        <ul className="paging">
                          {Array.from({ length: eventContractPagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <li key={page} className={page === eventContractPagination.currentPage ? 'on' : ''}>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (page !== eventContractPagination.currentPage) {
                                    getEventContractList(page);
                                  }
                                }}
                              >
                                {page}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </>
        )}

        {/* 마일리지 내역 탭 내용 */}
        {activeTab === 'mileage' && (
          <>
            <div className="tour2023_mileageTop_menu" style={{ marginTop: 30 }}>
              <div className="tour2023_txt04">
                보유 마일리지: <span className="tour2023_blue">{mileageInfo.totalMileage.toLocaleString()}</span>P
              </div>
              <button 
                className="tour2023_btn06" 
                onClick={() => setShowGiftCardModal(true)}
                style={{ marginTop: 10, width: '100%' }}
              >
                문화상품권 전환신청
              </button>
            </div>

            {/* 마일리지 조회 기간 */}
            <div className="tourGuard_form_tt mag5 tourG_mab04 tourG_mat10">
              <label htmlFor="">마일리지내역 조회</label>
              <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                <span className="tourGuard_ps_box">
                  <select 
                    className="tourGuard_sel" 
                    id="mileageYear"
                    value={mileageInYear}
                    onChange={(e) => setMileageInYear(Number(e.target.value))}
                  >
                    <option value={1}>최근 1년이내</option>
                    <option value={2}>최근 2년이내</option>
                  </select>
                </span>
              </div>
            </div>

            {/* 마일리지 리스트 */}
            <div className="tourG_mat10">
              {mileageList.length === 0 ? (
                <>
                  <p className="tour2023_title02">마일리지 내역</p>
                  <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                  <p className="tour2023_mypageBox">
                    <span className="tour2023_title14">마일리지 내역이 없습니다.</span>
                  </p>
                </>
              ) : (
                <>
                  {(() => {
                    const formatMileageDate = (dateStr: string) => {
                      if (!dateStr) return '-';
                      const date = new Date(dateStr);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}.${month}.${day}`;
                    };

                    return mileageList.map((item, index) => (
                      <div key={item.id}>
                        {index === 0 && (
                          <p className="tour2023_title02">마일리지 내역</p>
                        )}
                        
                        <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                        <ul className="tour2023_mileList_Wrap">
                          <li className="tour2023_mileList">
                            <span className="tour2023_mileList_txt01">
                              {formatMileageDate(item.created_at)}
                            </span>
                            <span 
                              className="tour2023_mileList_txt02"
                              style={{
                                color: item.type === '적립' ? '#1b37e1' : '#ff4444'
                              }}
                            >
                              {item.type === '적립' ? '+' : '-'}{Math.abs(item.amount).toLocaleString()}P
                            </span>
                          </li>
                          <li className="tour2023_mileList">
                            <span className="tour2023_mileList_txt03">
                              {item.reason || '-'}
                              {item.reason_detail && (
                                <><br />{item.reason_detail}</>
                              )}
                            </span>
                          </li>
                        </ul>
                        <div className="tourG_line05 tourG_mat09 tourG_mab04"></div>
                      </div>
                    ));
                  })()}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 심의번호 */}
      <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
        <span className="tour2023_txt02 tour2023_grey">
          <span>
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
            준법감시필 제2025-광고T-002(2025.04.07-2026-04.06)
          </span>
        </span>
      </div>
    </>
  );

  return (
    <div id="isbwrapper">
      {/* 헤더 */}
      <Header isMobile={true} />

      {/* 로그인 상태에 따라 다른 화면 렌더링 */}
      {isLoggedIn ? renderLoggedInView() : renderNonLoggedInView()}

      {/* 푸터 */}
      <Footer isMobile={true} />

      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />

      {/* 서비스 전체보기 모달 */}
      <ServiceModal 
        isOpen={showServiceModal} 
        onClose={() => setShowServiceModal(false)} 
      />

      {/* 문화상품권 전환신청 모달 */}
      {isLoggedIn && member && (
        <GiftCardExchangeModal
          isOpen={showGiftCardModal}
          onClose={() => setShowGiftCardModal(false)}
          availableMileage={mileageInfo.totalMileage}
          memberId={member.id}
          onSuccess={async () => {
            await Promise.all([
              getMileageInfo(),
              getMileageList()
            ]);
          }}
        />
      )}
    </div>
  );
}
