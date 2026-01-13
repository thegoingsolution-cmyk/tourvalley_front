'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import ServiceModal from '@/components/ServiceModal';
import { getImagePath } from '@/utils/path';
import { sendVerificationCode, verifyCode as verifyPhoneCode } from '@/services/smsService';
import { checkUsername, registerPersonalMember, registerCorporateMember } from '@/services/authService';
import { uploadFile } from '@/services/uploadService';
import './page.css';

type MemberType = 'personal' | 'corporate' | null;
type Step = 'select' | 'terms' | 'form' | 'complete';

interface CorporateContact {
  id: number;
  name: string;
  department: string;
  position: string;
  email: string;
  emailDomain: string;
  phone: string;
}

export default function PCSignupPage() {
  const [step, setStep] = useState<Step>('select');
  const [memberType, setMemberType] = useState<MemberType>(null);
  
  // Modal states
  const [showCashModal, setShowCashModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // Terms agreement states
  const [allAgreed, setAllAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  // Personal member form states
  const [username, setUsername] = useState('');
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Corporate member form states
  const [companyName, setCompanyName] = useState('');
  const [businessNumber1, setBusinessNumber1] = useState('');
  const [businessNumber2, setBusinessNumber2] = useState('');
  const [businessNumber3, setBusinessNumber3] = useState('');
  const [contacts, setContacts] = useState<CorporateContact[]>([
    { id: 1, name: '', department: '', position: '', email: '', emailDomain: '', phone: '' }
  ]);
  const [comprehensiveContract, setComprehensiveContract] = useState<'apply' | 'not_apply' | null>(null);
  const [businessFile, setBusinessFile] = useState<File | null>(null);

  const emailDomains = ['선택', 'naver.com', 'gmail.com', 'daum.net', 'hanmail.net', 'nate.com', '직접입력'];

  // Timer countdown effect
  useEffect(() => {
    if (remainingTime > 0 && !phoneVerified) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [verificationSent, phoneVerified]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle all terms agreement
  const handleAllAgree = () => {
    const newValue = !allAgreed;
    setAllAgreed(newValue);
    setTermsAgreed(newValue);
    setPrivacyAgreed(newValue);
    setMarketingAgreed(newValue);
  };

  // Check individual terms
  const handleIndividualTerm = (type: 'terms' | 'privacy' | 'marketing', value: boolean) => {
    if (type === 'terms') setTermsAgreed(value);
    if (type === 'privacy') setPrivacyAgreed(value);
    if (type === 'marketing') setMarketingAgreed(value);
    
    // Update allAgreed based on individual states
    const newTerms = type === 'terms' ? value : termsAgreed;
    const newPrivacy = type === 'privacy' ? value : privacyAgreed;
    const newMarketing = type === 'marketing' ? value : marketingAgreed;
    setAllAgreed(newTerms && newPrivacy && newMarketing);
  };

  // Username duplicate check
  const handleUsernameCheck = async () => {
    if (!username) {
      alert('아이디를 입력해주세요.');
      return;
    }
    
    try {
      const result = await checkUsername(username);
      
      if (result.success) {
        setUsernameChecked(true);
        alert(result.message);
      } else {
        setUsernameChecked(false);
        alert(result.message);
      }
    } catch (error) {
      alert('아이디 확인에 실패했습니다.');
    }
  };

  // Send verification code via Aligo
  const handleSendVerification = async () => {
    // 법인회원은 contacts[0].phone, 개인회원은 phone 사용
    const phoneNumber = memberType === 'corporate' ? contacts[0]?.phone : phone;
    
    if (!phoneNumber) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }
    
    // 개인회원용 phone 상태도 업데이트 (인증 확인에서 사용)
    if (memberType === 'corporate') {
      setPhone(phoneNumber);
    }
    
    try {
      // 실제 SMS 발송 (testmode=false)
      // 개발 환경에서 테스트 시 true로 변경하면 SMS 발송 없이 콘솔에 인증번호 출력
      const testmode = false;
      const result = await sendVerificationCode(phoneNumber, testmode);
      
      if (result.success) {
        setVerificationSent(true);
        setRemainingTime(180); // 3분 = 180초
        alert(result.message);
        
        // 테스트 모드에서는 콘솔에 인증번호 출력
        if (testmode && result.code) {
          console.log('테스트 인증번호:', result.code);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('인증번호 발송에 실패했습니다.');
    }
  };

  // Verify phone code
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      alert('인증번호를 입력해주세요.');
      return;
    }
    
    // 법인회원은 contacts[0].phone, 개인회원은 phone 사용
    const phoneNumber = memberType === 'corporate' ? (contacts[0]?.phone || phone) : phone;
    
    try {
      const result = await verifyPhoneCode(phoneNumber, verificationCode);
      
      if (result.success) {
        setPhoneVerified(true);
        setRemainingTime(0); // 타이머 정지
        if (timerRef.current) clearInterval(timerRef.current);
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('인증 확인에 실패했습니다.');
    }
  };

  // Add corporate contact
  const addContact = () => {
    const newId = Math.max(...contacts.map(c => c.id)) + 1;
    setContacts([...contacts, { id: newId, name: '', department: '', position: '', email: '', emailDomain: '', phone: '' }]);
  };

  // Update contact
  const updateContact = (id: number, field: keyof CorporateContact, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Remove contact
  const removeContact = (id: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(c => c.id !== id));
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBusinessFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!usernameChecked) {
      alert('아이디 중복확인을 해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (!phoneVerified) {
      alert('휴대폰 인증을 완료해주세요.');
      return;
    }

    try {
      let result;
      
      if (memberType === 'personal') {
        // 개인회원 가입
        result = await registerPersonalMember({
          username,
          password,
          name,
          birthDate,
          gender,
          email,
          emailDomain,
          phone,
          termsAgreed,
          privacyAgreed,
          marketingAgreed,
        });
      } else if (memberType === 'corporate') {
        // 법인회원 가입
        const businessNumber = `${businessNumber1}-${businessNumber2}-${businessNumber3}`;
        const primaryPhone = contacts[0]?.phone || phone;
        
        // 포괄계약 신청 시 파일 업로드
        let businessFilePath = '';
        let businessFileName = '';
        
        if (comprehensiveContract === 'apply' && businessFile) {
          const uploadResult = await uploadFile(businessFile, 'business');
          if (uploadResult.success && uploadResult.data) {
            businessFilePath = uploadResult.data.url;
            businessFileName = uploadResult.data.originalName;
          } else {
            alert('사업자등록증 파일 업로드에 실패했습니다.');
            return;
          }
        }
        
        result = await registerCorporateMember({
          username,
          password,
          companyName,
          businessNumber,
          contacts: contacts.map(c => ({
            name: c.name,
            department: c.department,
            position: c.position,
            email: c.email,
            emailDomain: c.emailDomain,
            phone: c.phone,
          })),
          comprehensiveContract,
          termsAgreed,
          privacyAgreed,
          marketingAgreed,
          primaryPhone,
          businessFilePath,
          businessFileName,
        });
      }

      if (result?.success) {
        // 성공 시 완료 페이지로 이동
        setStep('complete');
      } else {
        alert(result?.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // Navigate to home
  const handleGoHome = () => {
    window.location.href = '/main';
  };

  // Navigate to next step
  const handleNext = () => {
    if (step === 'select' && memberType) {
      setStep('terms');
    } else if (step === 'terms' && termsAgreed && privacyAgreed) {
      setStep('form');
    }
  };

  // Navigate to previous step
  const handlePrev = () => {
    if (step === 'terms') {
      setStep('select');
    } else if (step === 'form') {
      setStep('terms');
    }
  };

  return (
    <div className="signup-page-pc">
      <Header isMobile={false} />
      
      <main 
        className="signup-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        <div className="signup-container">
          <div className="signup-card">
            <h1 className="signup-title">{step === 'complete' ? '투어밸리' : '투어밸리 회원가입'}</h1>
            {step !== 'complete' && <div className="signup-divider"></div>}

            {/* Step 1: Select Member Type */}
            {step === 'select' && (
              <div className="step-content">
                <div className="step-header">
                  <h2 className="step-title">
                    <span className="highlight">똑똑한 여행자보험</span><br />
                    <span className="highlight-blue">투어밸리</span> 회원이 되세요!
                  </h2>
                  <p className="step-desc">
                    지금 회원에 가입 하신 후<br />
                    마일리지 추가 혜택들 받아보세요!
                  </p>
                </div>

                <div className="member-type-options">
                  <label 
                    className={`member-type-option ${memberType === 'personal' ? 'selected' : ''}`}
                    onClick={() => setMemberType('personal')}
                  >
                    <img 
                      src={memberType === 'personal' ? '/icons/icon_rdo_ov.png' : '/icons/icon_rdo.png'}
                      alt="radio"
                      className="radio-icon"
                    />
                    <div className="option-text-wrapper">
                      <span className="option-text">개인회원</span>
                    </div>
                  </label>

                  <label 
                    className={`member-type-option ${memberType === 'corporate' ? 'selected' : ''}`}
                    onClick={() => setMemberType('corporate')}
                  >
                    <img 
                      src={memberType === 'corporate' ? '/icons/icon_rdo_ov.png' : '/icons/icon_rdo.png'}
                      alt="radio"
                      className="radio-icon"
                    />
                    <div className="option-text-wrapper">
                      <span className="option-text">법인단체회원</span>
                      <span className="option-subtext">사업자등록증(고유번호증)이 있는 개인/법인사업자, 각종 단체</span>
                    </div>
                  </label>
                </div>

                <button 
                  className="submit-btn"
                  onClick={handleNext}
                  disabled={!memberType}
                >
                  가입하기
                </button>
              </div>
            )}

            {/* Step 2: Terms Agreement */}
            {step === 'terms' && (
              <div className="step-content">
                <div className="step-header">
                  <h2 className="step-title">
                    <span className="highlight-blue">이용약관</span>에 먼저<br />
                    동의해 주세요.
                  </h2>
                </div>

                <div className="terms-section">
                  <label className="terms-item all-agree" onClick={handleAllAgree}>
                    <img 
                      src={allAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                      alt="checkbox"
                      className={`checkbox-icon ${allAgreed ? 'checked' : ''}`}
                    />
                    <span className="terms-text bold">전체동의</span>
                  </label>

                  <div className="terms-list">
                    <label className="terms-item" onClick={() => handleIndividualTerm('terms', !termsAgreed)}>
                      <img 
                        src={termsAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                        alt="checkbox"
                        className={`checkbox-icon ${termsAgreed ? 'checked' : ''}`}
                      />
                      <span className="terms-text">(필수) 투어밸리 사이트 이용약관 동의</span>
                      <span className="terms-arrow">›</span>
                    </label>

                    <label className="terms-item" onClick={() => handleIndividualTerm('privacy', !privacyAgreed)}>
                      <img 
                        src={privacyAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                        alt="checkbox"
                        className={`checkbox-icon ${privacyAgreed ? 'checked' : ''}`}
                      />
                      <span className="terms-text">(필수) 개인정보 수집, 이용, 조회 제공 동의</span>
                      <span className="terms-arrow">›</span>
                    </label>

                    <label className="terms-item" onClick={() => handleIndividualTerm('marketing', !marketingAgreed)}>
                      <img 
                        src={marketingAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                        alt="checkbox"
                        className={`checkbox-icon ${marketingAgreed ? 'checked' : ''}`}
                      />
                      <span className="terms-text">(선택) 혜택알림 이메일, 문자 동의</span>
                      <span className="terms-arrow">›</span>
                    </label>
                  </div>

                  <p className="terms-notice">
                    ※ 고객은 동의를 거부할 권리가 있으며 동의를 거부할 경우 회원가입이 제한됩니다.
                  </p>

                  <div className="benefits-box">
                    <h3 className="benefits-title">투어밸리 회원 혜택</h3>
                    <ul className="benefits-list">
                      <li><strong>01.</strong> 회원가입시 1,000P 마일리지 제공</li>
                      <li><strong>02.</strong> 여행보험가입시 보험료의 3%(최대 30,000P한도) 추가 지급</li>
                      <li><strong>03.</strong> <span className="highlight-orange">안전여행을 위한 여행자보험 관리!</span> 보다 편하고 빨라집니다.</li>
                    </ul>
                  </div>
                </div>

                <div className="button-group">
                  <button className="prev-btn" onClick={handlePrev}>처음으로</button>
                  <button 
                    className="submit-btn"
                    onClick={handleNext}
                    disabled={!termsAgreed || !privacyAgreed}
                  >
                    가입하기
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Form - Personal Member */}
            {step === 'form' && memberType === 'personal' && (
              <div className="step-content">
                <div className="step-header">
                  <h2 className="step-title">
                    <span className="highlight-blue">회원정보</span>를 입력해 주세요.
                  </h2>
                </div>

                <div className="form-section">
                  {/* Username */}
                  <div className="form-row">
                    <div className="form-field with-button">
                      <label className="form-label">아이디</label>
                      <div className="input-with-btn">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); setUsernameChecked(false); }}
                          placeholder="아이디"
                          className="form-input"
                        />
                        <button className="inline-btn" onClick={handleUsernameCheck}>중복확인</button>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">비밀번호</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Password Confirm */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">비밀번호 재확인</label>
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="비밀번호 재확인"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">이름</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Birth Date & Gender */}
                  <div className="form-row split">
                    <div className="form-field">
                      <label className="form-label">생년월일</label>
                      <input
                        type="text"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        placeholder="예)19990515"
                        maxLength={8}
                        className="form-input"
                      />
                    </div>
                    <span className="field-divider">/</span>
                    <div className="form-field gender-field">
                      <label className="form-label">성별</label>
                      <div className="gender-options">
                        <label className={`gender-option ${gender === 'male' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={gender === 'male'}
                            onChange={(e) => setGender(e.target.value)}
                          />
                          <span>남자</span>
                        </label>
                        <label className={`gender-option ${gender === 'female' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={gender === 'female'}
                            onChange={(e) => setGender(e.target.value)}
                          />
                          <span>여자</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="form-row">
                    <div className="form-field email-field">
                      <label className="form-label">이메일 주소</label>
                      <div className="email-input-group">
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="아이디"
                          className="form-input email-id"
                        />
                        <span className="email-at">@</span>
                        <select
                          value={emailDomain}
                          onChange={(e) => setEmailDomain(e.target.value)}
                          className="form-select email-domain"
                        >
                          {emailDomains.map(domain => (
                            <option key={domain} value={domain === '선택' ? '' : domain}>{domain}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="form-row">
                    <div className="form-field with-button">
                      <label className="form-label">휴대폰 번호</label>
                      <div className="input-with-btn">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="숫자만 입력해주세요."
                          className="form-input"
                        />
                        <button className="inline-btn" onClick={handleSendVerification}>인증받기</button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Code */}
                  {verificationSent && !phoneVerified && (
                    <div className="form-row">
                      <div className="form-field with-button">
                        <label className="form-label">인증번호</label>
                        <div className="input-with-btn">
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="인증번호 입력"
                            className="form-input"
                          />
                          <span className={`timer ${remainingTime <= 30 ? 'warning' : ''}`}>
                            {formatTime(remainingTime)}
                          </span>
                          <button 
                            className="inline-btn" 
                            onClick={handleVerifyCode}
                            disabled={remainingTime === 0}
                          >
                            확인
                          </button>
                        </div>
                      </div>
                      {remainingTime === 0 && (
                        <p className="timer-expired">인증시간이 만료되었습니다. 다시 인증받기를 눌러주세요.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="button-group">
                  <button className="prev-btn" onClick={handlePrev}>처음으로</button>
                  <button className="submit-btn" onClick={handleSubmit}>가입완료</button>
                </div>
              </div>
            )}

            {/* Step 3: Form - Corporate Member */}
            {step === 'form' && memberType === 'corporate' && (
              <div className="step-content">
                <div className="step-header">
                  <h2 className="step-title">
                    <span className="highlight-blue">회원정보</span>를 입력해 주세요.
                  </h2>
                </div>

                <div className="form-section">
                  {/* Username */}
                  <div className="form-row">
                    <div className="form-field with-button">
                      <label className="form-label">아이디</label>
                      <div className="input-with-btn">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); setUsernameChecked(false); }}
                          placeholder="아이디"
                          className="form-input"
                        />
                        <button className="inline-btn" onClick={handleUsernameCheck}>중복확인</button>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">비밀번호</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Password Confirm */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">비밀번호 재확인</label>
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="비밀번호 재확인"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">법인단체명</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="한글 최대 20자/영문25자 입력 가능합니다."
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Business Number */}
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">사업자번호</label>
                      <div className="business-number-group">
                        <input
                          type="text"
                          value={businessNumber1}
                          onChange={(e) => setBusinessNumber1(e.target.value)}
                          maxLength={3}
                          className="form-input business-input"
                        />
                        <span className="number-divider">—</span>
                        <input
                          type="text"
                          value={businessNumber2}
                          onChange={(e) => setBusinessNumber2(e.target.value)}
                          maxLength={2}
                          className="form-input business-input"
                        />
                        <span className="number-divider">—</span>
                        <input
                          type="text"
                          value={businessNumber3}
                          onChange={(e) => setBusinessNumber3(e.target.value)}
                          maxLength={5}
                          className="form-input business-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  {contacts.map((contact, index) => (
                    <div key={contact.id} className="contact-section">
                      {/* Contact Name */}
                      <div className="form-row">
                        <div className="form-field">
                          <label className="form-label">담당자명</label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                            placeholder="한글 최대 15자 입력 가능합니다."
                            className="form-input"
                          />
                        </div>
                      </div>

                      {/* Department */}
                      <div className="form-row">
                        <div className="form-field">
                          <label className="form-label">부서</label>
                          <input
                            type="text"
                            value={contact.department}
                            onChange={(e) => updateContact(contact.id, 'department', e.target.value)}
                            placeholder="부서 또는 지점명"
                            className="form-input"
                          />
                        </div>
                      </div>

                      {/* Position */}
                      <div className="form-row">
                        <div className="form-field">
                          <label className="form-label">직급/직책</label>
                          <input
                            type="text"
                            value={contact.position}
                            onChange={(e) => updateContact(contact.id, 'position', e.target.value)}
                            placeholder="직급 또는 직책"
                            className="form-input"
                          />
                        </div>
                      </div>

                      {/* Contact Email */}
                      <div className="form-row">
                        <div className="form-field email-field">
                          <label className="form-label">이메일 주소</label>
                          <div className="email-input-group">
                            <input
                              type="text"
                              value={contact.email}
                              onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                              placeholder="아이디"
                              className="form-input email-id"
                            />
                            <span className="email-at">@</span>
                            <select
                              value={contact.emailDomain}
                              onChange={(e) => updateContact(contact.id, 'emailDomain', e.target.value)}
                              className="form-select email-domain"
                            >
                              {emailDomains.map(domain => (
                                <option key={domain} value={domain === '선택' ? '' : domain}>{domain}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Contact Phone */}
                      <div className="form-row">
                        <div className="form-field with-button">
                          <label className="form-label">휴대폰 <span className="label-highlight">번호</span></label>
                          <div className="input-with-btn">
                            <input
                              type="text"
                              value={contact.phone}
                              onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                              placeholder="숫자만 입력해주세요."
                              className="form-input"
                            />
                            {index === 0 && (
                              <button className="inline-btn" onClick={handleSendVerification}>인증받기</button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Verification Code - 첫 번째 담당자만 */}
                      {index === 0 && verificationSent && !phoneVerified && (
                        <div className="form-row">
                          <div className="form-field with-button">
                            <label className="form-label">인증번호</label>
                            <div className="input-with-btn">
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="인증번호 입력"
                                className="form-input"
                              />
                              <span className={`timer ${remainingTime <= 30 ? 'warning' : ''}`}>
                                {formatTime(remainingTime)}
                              </span>
                              <button 
                                className="inline-btn" 
                                onClick={handleVerifyCode}
                                disabled={remainingTime === 0}
                              >
                                확인
                              </button>
                            </div>
                          </div>
                          {remainingTime === 0 && (
                            <p className="timer-expired">인증시간이 만료되었습니다. 다시 인증받기를 눌러주세요.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Contact Button */}
                  <div className="add-contact-row">
                    <button className="add-contact-btn" onClick={addContact}>담당자추가 +</button>
                  </div>

                  {/* Comprehensive Contract */}
                  <div className="comprehensive-section">
                    <h3 className="section-title">
                      <span className="highlight-red">포괄계약 신청</span> 여부를 선택해 주세요.
                    </h3>
                    <div className="radio-group">
                      <label className={`radio-option ${comprehensiveContract === 'apply' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="comprehensive"
                          value="apply"
                          checked={comprehensiveContract === 'apply'}
                          onChange={() => setComprehensiveContract('apply')}
                        />
                        <span className="radio-circle">
                          {comprehensiveContract === 'apply' && <span className="radio-dot"></span>}
                        </span>
                        <span>신청</span>
                      </label>
                      <label className={`radio-option ${comprehensiveContract === 'not_apply' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="comprehensive"
                          value="not_apply"
                          checked={comprehensiveContract === 'not_apply'}
                          onChange={() => setComprehensiveContract('not_apply')}
                        />
                        <span className="radio-circle">
                          {comprehensiveContract === 'not_apply' && <span className="radio-dot"></span>}
                        </span>
                        <span>신청하지 않음</span>
                      </label>
                    </div>

                    <div className="comprehensive-info">
                      <p>
                        포괄계약(open policy)을 체결하시면 청약서 작성, 보험료 정산 등 보험가입 프로세스가 보다 편리해 집니다. 포괄계약 신청시 <span className="highlight-red">사업자등록증(또는 고유번호증)은 필수서류</span>입니다.
                      </p>
                      <p>• 팩스번호 : 02-2261-0098</p>
                      <p>• 메일주소 : tourvalley@insvalley.com</p>
                    </div>

                    <button className="agreement-link">
                      단체 및 포괄계약 업무 협정서 보기 <span>›</span>
                    </button>
                  </div>

                  {/* File Upload */}
                  {comprehensiveContract === 'apply' && (
                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">사업자등록증/고유번호증 첨부</label>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="form-input file-input"
                        />
                        {businessFile && <span className="file-name">{businessFile.name}</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="button-group">
                  <button className="prev-btn" onClick={handlePrev}>처음으로</button>
                  <button className="submit-btn" onClick={handleSubmit}>가입완료</button>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && (
              <div className="step-content complete-content">
                <div className="complete-icon">
                  <img 
                    src={getImagePath('/join_end.png')} 
                    alt="회원가입 완료" 
                    className="complete-image"
                  />
                </div>
                
                <h2 className="complete-title">회원가입을 축하드립니다.</h2>
                
                <p className="complete-mileage">
                  회원가입 축하 마일리지<br />
                  <strong>1,000P</strong>가 지급되었습니다.
                </p>
                
                <p className="complete-message">
                  회원님의 <strong>안전여행 관리</strong><br />
                  <strong>똑똑한 여행자보험</strong><br />
                  <span className="highlight-blue">투어밸리</span>가 함께 합니다.
                </p>
                
                <p className="complete-thanks">감사합니다.</p>
                
                <button className="submit-btn home-btn" onClick={handleGoHome}>
                  홈으로
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Buttons */}
        <div className="floating-buttons">
          <button className="floating-btn cash-btn" onClick={() => setShowCashModal(true)}>
            <img src={getImagePath('/icons/icon_cash.png')} alt="무사고캐시" className="floating-icon-img" />
            <span className="floating-text">무사고캐시란?</span>
          </button>
          <button className="floating-btn service-btn" onClick={() => setShowServiceModal(true)}>
            <img src={getImagePath('/icons/icon_menu.png')} alt="서비스 전체보기" className="floating-icon-img" />
            <span className="floating-text">서비스<br/>전체보기</span>
          </button>
        </div>
      </main>

      <Footer isMobile={false} />

      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />

      {/* 서비스 전체보기 모달 */}
      <ServiceModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onOpenAccidentFreeCashModal={() => {
          setShowServiceModal(false);
          setShowCashModal(true);
        }}
      />
    </div>
  );
}

