'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { sendVerificationCode, verifyCode as verifyPhoneCode } from '@/services/smsService';
import './page.css';

type MemberType = 'personal' | 'corporate' | null;
type Step = 'select' | 'terms' | 'form';

interface CorporateContact {
  id: number;
  name: string;
  department: string;
  position: string;
  email: string;
  emailDomain: string;
  phone: string;
}

export default function MobileSignupPage() {
  const [step, setStep] = useState<Step>('select');
  const [memberType, setMemberType] = useState<MemberType>(null);
  
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
    setUsernameChecked(true);
    alert('사용 가능한 아이디입니다.');
  };

  // Send verification code
  const handleSendVerification = async () => {
    if (!phone) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }
    
    try {
      const testmode = process.env.NODE_ENV === 'development';
      const result = await sendVerificationCode(phone, testmode);
      
      if (result.success) {
        setVerificationSent(true);
        alert(result.message);
        
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
    
    try {
      const result = await verifyPhoneCode(phone, verificationCode);
      
      if (result.success) {
        setPhoneVerified(true);
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

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBusinessFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!usernameChecked) {
      alert('아이디 중복확인을 해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!phoneVerified) {
      alert('휴대폰 인증을 완료해주세요.');
      return;
    }
    alert('회원가입이 완료되었습니다.');
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
    <div className="signup-page-mobile">
      <Header isMobile={true} />
      
      <main className="signup-content-mobile">
        <div className="signup-container-mobile">
          <h1 className="signup-title-mobile">투어밸리 회원가입</h1>
          <div className="signup-divider-mobile"></div>

          {/* Step 1: Select Member Type */}
          {step === 'select' && (
            <div className="step-content-mobile">
              <div className="step-header-mobile">
                <h2 className="step-title-mobile">
                  <span className="highlight">똑똑한 여행자보험</span><br />
                  <span className="highlight-blue">투어밸리</span> 회원이 되세요!
                </h2>
                <p className="step-desc-mobile">
                  지금 회원에 가입 하신 후<br />
                  마일리지 추가 혜택들 받아보세요!
                </p>
              </div>

              <div className="member-type-options-mobile">
                <label 
                  className={`member-type-option-mobile ${memberType === 'personal' ? 'selected' : ''}`}
                  onClick={() => setMemberType('personal')}
                >
                  <img 
                    src={memberType === 'personal' ? '/icons/icon_rdo_ov.png' : '/icons/icon_rdo.png'}
                    alt="radio"
                    className="radio-icon-mobile"
                  />
                  <div className="option-text-wrapper-mobile">
                    <span className="option-text-mobile">개인회원</span>
                  </div>
                </label>

                <label 
                  className={`member-type-option-mobile ${memberType === 'corporate' ? 'selected' : ''}`}
                  onClick={() => setMemberType('corporate')}
                >
                  <img 
                    src={memberType === 'corporate' ? '/icons/icon_rdo_ov.png' : '/icons/icon_rdo.png'}
                    alt="radio"
                    className="radio-icon-mobile"
                  />
                  <div className="option-text-wrapper-mobile">
                    <span className="option-text-mobile">법인단체회원</span>
                    <span className="option-subtext-mobile">사업자등록증(고유번호증)이 있는 개인/법인사업자, 각종 단체</span>
                  </div>
                </label>
              </div>

              <button 
                className="submit-btn-mobile"
                onClick={handleNext}
                disabled={!memberType}
              >
                가입하기
              </button>
            </div>
          )}

          {/* Step 2: Terms Agreement */}
          {step === 'terms' && (
            <div className="step-content-mobile">
              <div className="step-header-mobile">
                <h2 className="step-title-mobile">
                  <span className="highlight-blue">이용약관</span>에 먼저<br />
                  동의해 주세요.
                </h2>
              </div>

              <div className="terms-section-mobile">
                <label className="terms-item-mobile all-agree" onClick={handleAllAgree}>
                  <img 
                    src={allAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                    alt="checkbox"
                    className={`checkbox-icon-mobile ${allAgreed ? 'checked' : ''}`}
                  />
                  <span className="terms-text-mobile bold">전체동의</span>
                </label>

                <div className="terms-list-mobile">
                  <label className="terms-item-mobile" onClick={() => handleIndividualTerm('terms', !termsAgreed)}>
                    <img 
                      src={termsAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                      alt="checkbox"
                      className={`checkbox-icon-mobile ${termsAgreed ? 'checked' : ''}`}
                    />
                    <span className="terms-text-mobile">(필수) 투어밸리 사이트 이용약관 동의</span>
                    <span className="terms-arrow-mobile">›</span>
                  </label>

                  <label className="terms-item-mobile" onClick={() => handleIndividualTerm('privacy', !privacyAgreed)}>
                    <img 
                      src={privacyAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                      alt="checkbox"
                      className={`checkbox-icon-mobile ${privacyAgreed ? 'checked' : ''}`}
                    />
                    <span className="terms-text-mobile">(필수) 개인정보 수집, 이용, 조회 제공 동의</span>
                    <span className="terms-arrow-mobile">›</span>
                  </label>

                  <label className="terms-item-mobile" onClick={() => handleIndividualTerm('marketing', !marketingAgreed)}>
                    <img 
                      src={marketingAgreed ? '/icons/chk_ov.png' : '/icons/checkbox-icon.png'}
                      alt="checkbox"
                      className={`checkbox-icon-mobile ${marketingAgreed ? 'checked' : ''}`}
                    />
                    <span className="terms-text-mobile">(선택) 혜택알림 이메일, 문자 동의</span>
                    <span className="terms-arrow-mobile">›</span>
                  </label>
                </div>

                <p className="terms-notice-mobile">
                  ※ 고객은 동의를 거부할 권리가 있으며 동의를 거부할 경우 회원가입이 제한됩니다.
                </p>

                <div className="benefits-box-mobile">
                  <h3 className="benefits-title-mobile">투어밸리 회원 혜택</h3>
                  <ul className="benefits-list-mobile">
                    <li><strong>01.</strong> 회원가입시 1,000P 마일리지 제공</li>
                    <li><strong>02.</strong> 여행보험가입시 보험료의 3%(최대 30,000P한도) 추가 지급</li>
                    <li><strong>03.</strong> <span className="highlight-orange">안전여행을 위한 여행자보험 관리!</span> 보다 편하고 빨라집니다.</li>
                  </ul>
                </div>
              </div>

              <div className="button-group-mobile">
                <button className="prev-btn-mobile" onClick={handlePrev}>처음으로</button>
                <button 
                  className="submit-btn-mobile"
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
            <div className="step-content-mobile">
              <div className="step-header-mobile">
                <h2 className="step-title-mobile">
                  <span className="highlight-blue">회원정보</span>를 입력해 주세요.
                </h2>
              </div>

              <div className="form-section-mobile">
                {/* Username */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile with-button">
                    <label className="form-label-mobile">아이디</label>
                    <div className="input-with-btn-mobile">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setUsernameChecked(false); }}
                        placeholder="아이디"
                        className="form-input-mobile"
                      />
                      <button className="inline-btn-mobile" onClick={handleUsernameCheck}>중복확인</button>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">비밀번호</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호"
                      className="form-input-mobile"
                    />
                  </div>
                </div>

                {/* Password Confirm */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">비밀번호 재확인</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="비밀번호 재확인"
                      className="form-input-mobile"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">이름</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="이름"
                      className="form-input-mobile"
                    />
                  </div>
                </div>

                {/* Birth Date & Gender */}
                <div className="form-row-mobile split">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">생년월일</label>
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="예)19990515"
                      maxLength={8}
                      className="form-input-mobile"
                    />
                  </div>
                  <span className="field-divider-mobile">/</span>
                  <div className="form-field-mobile gender-field-mobile">
                    <label className="form-label-mobile">성별</label>
                    <div className="gender-options-mobile">
                      <label className={`gender-option-mobile ${gender === 'male' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={gender === 'male'}
                          onChange={(e) => setGender(e.target.value)}
                        />
                        <span>남자</span>
                      </label>
                      <label className={`gender-option-mobile ${gender === 'female' ? 'selected' : ''}`}>
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
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">이메일 주소</label>
                    <div className="email-input-group-mobile">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="아이디"
                        className="form-input-mobile email-id-mobile"
                      />
                      <span className="email-at-mobile">@</span>
                      <select
                        value={emailDomain}
                        onChange={(e) => setEmailDomain(e.target.value)}
                        className="form-select-mobile"
                      >
                        {emailDomains.map(domain => (
                          <option key={domain} value={domain === '선택' ? '' : domain}>{domain}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile with-button">
                    <label className="form-label-mobile">휴대폰 번호</label>
                    <div className="input-with-btn-mobile">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="숫자만 입력해주세요."
                        className="form-input-mobile"
                      />
                      <button className="inline-btn-mobile" onClick={handleSendVerification}>인증받기</button>
                    </div>
                  </div>
                </div>

                {/* Verification Code */}
                {verificationSent && !phoneVerified && (
                  <div className="form-row-mobile">
                    <div className="form-field-mobile with-button">
                      <label className="form-label-mobile">인증번호</label>
                      <div className="input-with-btn-mobile">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="인증번호 입력"
                          className="form-input-mobile"
                        />
                        <button className="inline-btn-mobile" onClick={handleVerifyCode}>확인</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="button-group-mobile">
                <button className="prev-btn-mobile" onClick={handlePrev}>처음으로</button>
                <button className="submit-btn-mobile" onClick={handleSubmit}>가입완료</button>
              </div>
            </div>
          )}

          {/* Step 3: Form - Corporate Member */}
          {step === 'form' && memberType === 'corporate' && (
            <div className="step-content-mobile">
              <div className="step-header-mobile">
                <h2 className="step-title-mobile">
                  <span className="highlight-blue">회원정보</span>를 입력해 주세요.
                </h2>
              </div>

              <div className="form-section-mobile">
                {/* Username */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile with-button">
                    <label className="form-label-mobile">아이디</label>
                    <div className="input-with-btn-mobile">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setUsernameChecked(false); }}
                        placeholder="아이디"
                        className="form-input-mobile"
                      />
                      <button className="inline-btn-mobile" onClick={handleUsernameCheck}>중복확인</button>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">비밀번호</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호"
                      className="form-input-mobile"
                    />
                  </div>
                </div>

                {/* Password Confirm */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">비밀번호 재확인</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="비밀번호 재확인"
                      className="form-input-mobile"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">법인단체명</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="한글 최대 20자/영문25자 입력 가능합니다."
                      className="form-input-mobile"
                    />
                  </div>
                </div>

                {/* Business Number */}
                <div className="form-row-mobile">
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">사업자번호</label>
                    <div className="business-number-group-mobile">
                      <input
                        type="text"
                        value={businessNumber1}
                        onChange={(e) => setBusinessNumber1(e.target.value)}
                        maxLength={3}
                        className="form-input-mobile business-input-mobile"
                      />
                      <span className="number-divider-mobile">—</span>
                      <input
                        type="text"
                        value={businessNumber2}
                        onChange={(e) => setBusinessNumber2(e.target.value)}
                        maxLength={2}
                        className="form-input-mobile business-input-mobile"
                      />
                      <span className="number-divider-mobile">—</span>
                      <input
                        type="text"
                        value={businessNumber3}
                        onChange={(e) => setBusinessNumber3(e.target.value)}
                        maxLength={5}
                        className="form-input-mobile business-input-mobile"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                {contacts.map((contact, index) => (
                  <div key={contact.id} className="contact-section-mobile">
                    <div className="form-row-mobile">
                      <div className="form-field-mobile">
                        <label className="form-label-mobile">담당자명</label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                          placeholder="한글 최대 15자 입력 가능합니다."
                          className="form-input-mobile"
                        />
                      </div>
                    </div>

                    <div className="form-row-mobile">
                      <div className="form-field-mobile">
                        <label className="form-label-mobile">부서</label>
                        <input
                          type="text"
                          value={contact.department}
                          onChange={(e) => updateContact(contact.id, 'department', e.target.value)}
                          placeholder="부서 또는 지점명"
                          className="form-input-mobile"
                        />
                      </div>
                    </div>

                    <div className="form-row-mobile">
                      <div className="form-field-mobile">
                        <label className="form-label-mobile">직급/직책</label>
                        <input
                          type="text"
                          value={contact.position}
                          onChange={(e) => updateContact(contact.id, 'position', e.target.value)}
                          placeholder="직급 또는 직책"
                          className="form-input-mobile"
                        />
                      </div>
                    </div>

                    <div className="form-row-mobile">
                      <div className="form-field-mobile">
                        <label className="form-label-mobile">이메일 주소</label>
                        <div className="email-input-group-mobile">
                          <input
                            type="text"
                            value={contact.email}
                            onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                            placeholder="아이디"
                            className="form-input-mobile email-id-mobile"
                          />
                          <span className="email-at-mobile">@</span>
                          <select
                            value={contact.emailDomain}
                            onChange={(e) => updateContact(contact.id, 'emailDomain', e.target.value)}
                            className="form-select-mobile"
                          >
                            {emailDomains.map(domain => (
                              <option key={domain} value={domain === '선택' ? '' : domain}>{domain}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="form-row-mobile">
                      <div className="form-field-mobile with-button">
                        <label className="form-label-mobile">휴대폰 번호</label>
                        <div className="input-with-btn-mobile">
                          <input
                            type="text"
                            value={contact.phone}
                            onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                            placeholder="숫자만 입력해주세요."
                            className="form-input-mobile"
                          />
                          {index === 0 && (
                            <button className="inline-btn-mobile" onClick={handleSendVerification}>인증받기</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="add-contact-row-mobile">
                  <button className="add-contact-btn-mobile" onClick={addContact}>담당자추가 +</button>
                </div>

                {/* Comprehensive Contract */}
                <div className="comprehensive-section-mobile">
                  <h3 className="section-title-mobile">
                    <span className="highlight-red">포괄계약 신청</span> 여부를 선택해 주세요.
                  </h3>
                  <div className="radio-group-mobile">
                    <label className={`radio-option-mobile ${comprehensiveContract === 'apply' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="comprehensive"
                        value="apply"
                        checked={comprehensiveContract === 'apply'}
                        onChange={() => setComprehensiveContract('apply')}
                      />
                      <span className="radio-circle-mobile">
                        {comprehensiveContract === 'apply' && <span className="radio-dot-mobile"></span>}
                      </span>
                      <span>신청</span>
                    </label>
                    <label className={`radio-option-mobile ${comprehensiveContract === 'not_apply' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="comprehensive"
                        value="not_apply"
                        checked={comprehensiveContract === 'not_apply'}
                        onChange={() => setComprehensiveContract('not_apply')}
                      />
                      <span className="radio-circle-mobile">
                        {comprehensiveContract === 'not_apply' && <span className="radio-dot-mobile"></span>}
                      </span>
                      <span>신청하지 않음</span>
                    </label>
                  </div>

                  <div className="comprehensive-info-mobile">
                    <p>
                      포괄계약(open policy)을 체결하시면 청약서 작성, 보험료 정산 등 보험가입 프로세스가 보다 편리해 집니다. 포괄계약 신청시 <span className="highlight-red">사업자등록증(또는 고유번호증)은 필수서류</span>입니다.
                    </p>
                    <p>• 팩스번호 : 02-2261-0098</p>
                    <p>• 메일주소 : admin@tourvalley.net</p>
                  </div>

                  <button className="agreement-link-mobile">
                    단체 및 포괄계약 업무 협정서 보기 <span>›</span>
                  </button>
                </div>

                {comprehensiveContract === 'apply' && (
                  <div className="form-row-mobile">
                    <div className="form-field-mobile">
                      <label className="form-label-mobile">사업자등록증/고유번호증 첨부</label>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="form-input-mobile file-input-mobile"
                      />
                      {businessFile && <span className="file-name-mobile">{businessFile.name}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="button-group-mobile">
                <button className="prev-btn-mobile" onClick={handlePrev}>처음으로</button>
                <button className="submit-btn-mobile" onClick={handleSubmit}>가입완료</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

