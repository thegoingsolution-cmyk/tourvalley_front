'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getImagePath } from '@/utils/path';
import './page.css';

export default function PCContractPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // 로그인 타입: 'I' (개인) 또는 'C' (단체)
  const [loginType, setLoginType] = useState<'I' | 'C'>('I');

  // 개인 정보
  const [insuredName, setInsuredName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'1' | '2'>('1'); // 1: 남자, 2: 여자
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

  // 생년월일 유효성 검사
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

  // 휴대폰 번호 유효성 검사
  const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/-/g, '');
    return /^01[0-9]{9}$/.test(cleaned);
  };

  // 인증번호 발송 (개인)
  const handleSendVerification = async () => {
    if (loginType === 'I') {
      // 개인 검증
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

      // TODO: API 호출하여 인증번호 발송
      // 임시로 성공 처리
      alert('인증번호가 발송되었습니다.');
      setShowVerificationInput(true);
      setRemainingTime(180); // 3분
      setIsVerificationSent(true);
      if (reSendYn === 'N') setReSendYn('Y');
    } else {
      // 단체 검증
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

      // TODO: API 호출하여 인증번호 발송
      alert('인증번호가 발송되었습니다.');
      setShowCompanyVerificationInput(true);
      setCompanyRemainingTime(180); // 3분
      setIsVerificationSent(true);
      if (reSendYn === 'N') setReSendYn('Y');
    }
  };

  // 인증번호 확인 (개인)
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    if (remainingTime <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      return;
    }

    // TODO: API 호출하여 인증번호 확인
    // 임시로 성공 처리
    alert('인증이 완료되었습니다.');
    router.push('/contracts/list');
  };

  // 인증번호 확인 (단체)
  const handleVerifyCompanyCode = async () => {
    if (!companyVerificationCode || companyVerificationCode.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    if (companyRemainingTime <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      return;
    }

    // TODO: API 호출하여 인증번호 확인
    alert('인증이 완료되었습니다.');
    router.push('/contracts/list');
  };

  // 조회하기
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

  // 시간 포맷 (MM:SS)
  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // 생년월일 입력 핸들러 (숫자만)
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 8) {
      setBirthDate(value);
    }
  };

  // 휴대폰 번호 입력 핸들러 (숫자만)
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

  // 사업자번호 입력 핸들러
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

  return (
    <div className="contract-page-pc">
      <Header isMobile={false} />

      <main 
        className="contract-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        <div className="contract-form-container">
          <div className="tour2023_header_line prow_01">
            <div className="tour2023_header_inner">
              <span className="tourTop_title">계약/캐시 조회</span>
            </div>
          </div>

          <div className="prow_01">
          <p className="tour2023_title04">가입자정보</p>

          {/* 개인/단체 선택 */}
          <div className="tour2023_ra_Wrap tourG_mab08">
            <ul className="tour2023_ra_Wrap01">
              <li className="tour2023_rdo_area">
                <span className="tour2023_inp_rdo">
                  <input
                    type="radio"
                    id="login_type_I"
                    value="I"
                    name="login_type"
                    checked={loginType === 'I'}
                    onChange={(e) => {
                      setLoginType('I');
                      setShowVerificationInput(false);
                      setIsVerificationSent(false);
                      setRemainingTime(0);
                    }}
                  />
                  <label htmlFor="login_type_I">개인</label>
                </span>
                <span className="tour2023_inp_rdo">
                  <input
                    type="radio"
                    id="login_type_C"
                    value="C"
                    name="login_type"
                    checked={loginType === 'C'}
                    onChange={(e) => {
                      setLoginType('C');
                      setShowCompanyVerificationInput(false);
                      setIsVerificationSent(false);
                      setCompanyRemainingTime(0);
                    }}
                  />
                  <label htmlFor="login_type_C">단체(사업자/법인)</label>
                </span>
              </li>
            </ul>
          </div>

          <div className="tourGuard_Info">
            {/* 개인 입력 영역 */}
            {loginType === 'I' && (
              <div id="input_I" className="input_area">
                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="insured_name">대표가입자명</label>
                  <input
                    type="text"
                    id="insured_name"
                    name="insured_name"
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
                    id="birth_date"
                    name="birth_date"
                    maxLength={8}
                    placeholder="예)19990515"
                    className="tourGuard_input_w01"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                  />

                  <div className="tourG_rdo_area">
                    <label htmlFor="gender_male">성별</label>
                    <span className="tourG_inp_rdo">
                      <input
                        type="radio"
                        id="gender_male"
                        value="1"
                        name="gender"
                        checked={gender === '1'}
                        onChange={(e) => setGender('1')}
                      />
                      <label htmlFor="gender_male">남자</label>
                    </span>
                    <span className="tourG_inp_rdo">
                      <input
                        type="radio"
                        id="gender_female"
                        value="2"
                        name="gender"
                        checked={gender === '2'}
                        onChange={(e) => setGender('2')}
                      />
                      <label htmlFor="gender_female" className="one_line0">여자</label>
                    </span>
                  </div>
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="ctel_no">휴대폰 번호</label>
                  <input
                    type="tel"
                    id="ctel_no"
                    name="ctel_no"
                    maxLength={11}
                    placeholder="숫자만 입력해주세요."
                    className="tourGuard_input_w02"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                  />
                  <div className="tour2023_event_file">
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      className="tour2023_btn_b01 tour2023_btn11"
                    >
                      인증받기
                    </button>
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
                      <span className="tour2023_timeLimit">{formatTime(remainingTime)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 단체 입력 영역 */}
            {loginType === 'C' && (
              <div id="input_C" className="input_area">
                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="contract_company">단체(사업자/법인)명</label>
                  <input
                    type="text"
                    id="contract_company"
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
                    id="resno1"
                    name="resno1"
                    maxLength={3}
                    placeholder=""
                    className="tourGuard_input_w03"
                    value={businessNumber1}
                    onChange={handleBusinessNumber1Change}
                  />
                  <input
                    type="tel"
                    id="resno2"
                    name="resno2"
                    maxLength={2}
                    placeholder=""
                    className="tourGuard_input_w03"
                    value={businessNumber2}
                    onChange={handleBusinessNumber2Change}
                  />
                  <input
                    type="tel"
                    id="resno3"
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
                    id="c_ctel_no"
                    name="c_ctel_no"
                    maxLength={11}
                    placeholder="숫자만 입력해주세요."
                    className="tourGuard_input_w02"
                    value={companyPhoneNumber}
                    onChange={handleCompanyPhoneChange}
                  />
                  <div className="tour2023_event_file">
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      className="tour2023_btn_b01 tour2023_btn11"
                    >
                      인증받기
                    </button>
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
                      <span className="tour2023_timeLimit">{formatTime(companyRemainingTime)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 회원 로그인 섹션 */}
            <section className="tour2023_cash_f tourG_mab05">
              <div className="tour2023_txt33 tour2023_blue">투어밸리 회원님은 회원 로그인 하세요.</div>
              <div>
                <Link href="/login" className="tour2023_btn_b tour2023_btnLogin">
                  회원 LOGIN
                </Link>
              </div>
            </section>

            {/* 무사고캐시란 버튼 */}
            <div className="btnWrap ag_right">
              <button type="button" className="btn tourG_btn_cash01">
                무사고캐시란? <span className="cash01_ico"></span>
              </button>
            </div>

            {/* 조회하기 버튼 */}
            <div className="tourG_mat04 tourG_mab02">
              <button
                type="button"
                onClick={handleSearch}
                className="tourGuard_btn_b tour2023_btn01"
              >
                조회하기
              </button>
            </div>

            {/* 안내 문구 */}
            <div className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mab04 tourG_mat06">
              <ul className="tourGuard_inline">
                <li className="tourGuard_inline_t01">※</li>
                <li className="tourGuard_inline_t02">사업자/법인 고객은 무사고캐시가 적용되지 않습니다.</li>
              </ul>
            </div>
          </div>
        </div>
        </div>

        {/* Floating Buttons */}
        <div className="floating-buttons">
          <button className="floating-btn cash-btn">
            <img src={getImagePath('/icons/icon_cash.png')} alt="무사고캐시" className="floating-icon-img" />
            <span className="floating-text">무사고캐시란?</span>
          </button>
          <button className="floating-btn service-btn">
            <img src={getImagePath('/icons/icon_menu.png')} alt="서비스 전체보기" className="floating-icon-img" />
            <span className="floating-text">서비스<br/>전체보기</span>
          </button>
        </div>
      </main>

      <Footer isMobile={false} />
    </div>
  );
}

