'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { 
  updateMember, 
  getCorporateMemberInfo, 
  updateCorporateMember,
  CorporateInfo,
  ContactInfo
} from '@/services/authService';
import './page.css';

// 담당자 폼 데이터 타입
interface ContactFormData {
  id?: number;
  contact_name: string;
  department: string;
  position: string;
  email: string;
  emailDomain: string;
  emailDomainSelect: string;
  mobile_phone: string;
}

export default function MobileMyPage() {
  const router = useRouter();
  const { isLoggedIn, member, updateMember: updateMemberContext, isLoading } = useAuth();

  // 공통 폼 상태
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [emailReceive, setEmailReceive] = useState(false);
  const [smsReceive, setSmsReceive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 개인회원 폼 상태
  const [email, setEmail] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [emailDomainSelect, setEmailDomainSelect] = useState('직접입력');
  const [mobilePhone, setMobilePhone] = useState('');

  // 법인회원 폼 상태
  const [corporateInfo, setCorporateInfo] = useState<CorporateInfo | null>(null);
  const [contacts, setContacts] = useState<ContactFormData[]>([]);
  const [comprehensiveContract, setComprehensiveContract] = useState(false);
  const [isCorporateLoading, setIsCorporateLoading] = useState(false);

  // 이메일 도메인 옵션
  const emailDomains = ['직접입력', 'naver.com', 'gmail.com', 'daum.net', 'hanmail.net', 'nate.com', 'kakao.com'];

  // 법인회원 여부
  const isCorporate = member?.member_type === '법인';

  // 로그인 체크 및 초기값 설정
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (member) {
      // 이메일/SMS 수신 동의
      setEmailReceive(member.email_receive || false);
      setSmsReceive(member.sms_receive || false);

      if (isCorporate) {
        // 법인회원 정보 조회
        loadCorporateInfo();
      } else {
        // 개인회원 이메일 설정
        if (member.email) {
          if (member.email.includes('@')) {
            const [emailId, domain] = member.email.split('@');
            setEmail(emailId || '');
            const domainToUse = domain || member.email_domain || '';
            setEmailDomain(domainToUse);
            const domainExists = emailDomains.includes(domainToUse);
            setEmailDomainSelect(domainExists ? domainToUse : '직접입력');
          } else {
            setEmail(member.email);
            const domainToUse = member.email_domain || '';
            setEmailDomain(domainToUse);
            const domainExists = emailDomains.includes(domainToUse);
            setEmailDomainSelect(domainExists ? domainToUse : '직접입력');
          }
        }
        
        // 개인회원 휴대폰 번호 포맷팅
        if (member.mobile_phone) {
          setMobilePhone(formatPhoneNumber(member.mobile_phone));
        }
      }
    }
  }, [isLoading, isLoggedIn, member, router, isCorporate]);

  // 법인회원 정보 조회
  const loadCorporateInfo = async () => {
    if (!member) return;
    
    setIsCorporateLoading(true);
    try {
      const result = await getCorporateMemberInfo(member.id);
      if (result.success && result.corporate && result.contacts) {
        setCorporateInfo(result.corporate);
        setComprehensiveContract(result.corporate.comprehensive_contract);
        
        // 담당자 정보 변환
        const contactForms: ContactFormData[] = result.contacts.map((contact: ContactInfo) => {
          let emailId = '';
          let emailDomainVal = '';
          let emailDomainSelectVal = '직접입력';
          
          if (contact.email) {
            if (contact.email.includes('@')) {
              const parts = contact.email.split('@');
              emailId = parts[0] || '';
              emailDomainVal = parts[1] || '';
            } else {
              emailId = contact.email;
            }
            
            if (emailDomains.includes(emailDomainVal)) {
              emailDomainSelectVal = emailDomainVal;
            }
          }
          
          return {
            id: contact.id,
            contact_name: contact.contact_name,
            department: contact.department || '',
            position: contact.position || '',
            email: emailId,
            emailDomain: emailDomainVal,
            emailDomainSelect: emailDomainSelectVal,
            mobile_phone: contact.mobile_phone ? formatPhoneNumber(contact.mobile_phone) : '',
          };
        });
        
        setContacts(contactForms);
      }
    } catch (error) {
      console.error('법인회원 정보 조회 오류:', error);
    } finally {
      setIsCorporateLoading(false);
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  // 전화번호 입력 처리
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setMobilePhone(formatPhoneNumber(value));
    }
  };

  // 이메일 도메인 선택 처리
  const handleEmailDomainSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setEmailDomainSelect(selected);
    if (selected !== '직접입력') {
      setEmailDomain(selected);
    } else {
      setEmailDomain('');
    }
  };

  // 담당자 필드 변경 처리
  const handleContactChange = (index: number, field: keyof ContactFormData, value: string) => {
    const newContacts = [...contacts];
    if (field === 'mobile_phone') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 11) {
        newContacts[index][field] = formatPhoneNumber(cleaned);
      }
    } else if (field === 'emailDomainSelect') {
      newContacts[index].emailDomainSelect = value;
      if (value !== '직접입력') {
        newContacts[index].emailDomain = value;
      } else {
        newContacts[index].emailDomain = '';
      }
    } else {
      (newContacts[index] as any)[field] = value;
    }
    setContacts(newContacts);
  };

  // 담당자 추가
  const handleAddContact = () => {
    setContacts([...contacts, {
      contact_name: '',
      department: '',
      position: '',
      email: '',
      emailDomain: '',
      emailDomainSelect: '직접입력',
      mobile_phone: '',
    }]);
  };

  // 개인회원 정보 수정 제출
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password && password.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    if (!email || !emailDomain) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    if (!mobilePhone) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateMember(member!.id, {
        password: password || undefined,
        email: email,
        emailDomain: emailDomain,
        mobilePhone: mobilePhone.replace(/-/g, ''),
        marketingAgreed: emailReceive || smsReceive,
        emailReceive: emailReceive,
        smsReceive: smsReceive,
      });

      if (result.success) {
        updateMemberContext({
          email: `${email}@${emailDomain}`,
          mobile_phone: mobilePhone.replace(/-/g, ''),
          marketing_agreed: emailReceive || smsReceive,
          email_receive: emailReceive,
          sms_receive: smsReceive,
        });
        
        alert('회원정보가 성공적으로 수정되었습니다.');
        setPassword('');
        setPasswordConfirm('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('회원정보 수정 오류:', error);
      alert('회원정보 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 법인회원 정보 수정 제출
  const handleCorporateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password && password.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    // 대표 담당자 필수 정보 확인
    if (contacts.length === 0 || !contacts[0].contact_name) {
      alert('담당자명을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateCorporateMember(member!.id, {
        password: password || undefined,
        contacts: contacts.map(c => ({
          id: c.id,
          contact_name: c.contact_name,
          department: c.department,
          position: c.position,
          email: c.email,
          emailDomain: c.emailDomain,
          mobile_phone: c.mobile_phone.replace(/-/g, ''),
        })),
        comprehensiveContract: comprehensiveContract,
        marketingAgreed: emailReceive || smsReceive,
        emailReceive: emailReceive,
        smsReceive: smsReceive,
      });

      if (result.success) {
        // 컨텍스트 업데이트
        if (contacts.length > 0) {
          updateMemberContext({
            name: contacts[0].contact_name,
            email: contacts[0].email ? `${contacts[0].email}@${contacts[0].emailDomain}` : '',
            mobile_phone: contacts[0].mobile_phone.replace(/-/g, ''),
            marketing_agreed: emailReceive || smsReceive,
            email_receive: emailReceive,
            sms_receive: smsReceive,
          });
        }
        
        alert('회원정보가 성공적으로 수정되었습니다.');
        setPassword('');
        setPasswordConfirm('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('회원정보 수정 오류:', error);
      alert('회원정보 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 처음으로 버튼
  const handleGoHome = () => {
    router.push('/main');
  };

  // 회원탈퇴
  const handleWithdraw = () => {
    if (confirm('정말 회원탈퇴를 진행하시겠습니까?\n탈퇴 시 모든 정보가 삭제됩니다.')) {
      alert('회원탈퇴 기능은 준비 중입니다.');
    }
  };

  if (isLoading || (isCorporate && isCorporateLoading)) {
    return (
      <div className="mypage-mobile">
        <Header isMobile={true} />
        <main className="mypage-content-mobile">
          <div className="loading-container">
            <p>로딩 중...</p>
          </div>
        </main>
        <Footer isMobile={true} />
      </div>
    );
  }

  return (
    <div className="mypage-mobile">
      <Header isMobile={true} />
      
      <main className="mypage-content-mobile">
        <div className="mypage-container-mobile">
          {/* 헤더 */}
          <div className="mypage-header-mobile">
            <h1 className="mypage-title-mobile">
              회원정보<span className="title-highlight">변경</span>
            </h1>
            <button 
              type="button" 
              className="withdraw-link-mobile"
              onClick={handleWithdraw}
            >
              회원탈퇴 &gt;
            </button>
          </div>

          {isCorporate ? (
            /* 법인회원 폼 */
            <form onSubmit={handleCorporateSubmit} className="mypage-form-mobile">
              {/* 아이디 (수정불가) */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">아이디</label>
                <input
                  type="text"
                  value={member?.username || ''}
                  className="form-input-mobile readonly"
                  readOnly
                  disabled
                />
              </div>

              {/* 비밀번호 */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="변경할 비밀번호를 입력해주세요"
                  className="form-input-mobile password-input"
                  autoComplete="new-password"
                />
              </div>

              {/* 비밀번호 재확인 */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">비밀번호 재확인</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재확인"
                  className="form-input-mobile"
                  autoComplete="new-password"
                />
              </div>

              {/* 법인단체명 (수정불가) */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">법인단체명</label>
                <input
                  type="text"
                  value={corporateInfo?.company_name || ''}
                  className="form-input-mobile readonly"
                  readOnly
                  disabled
                />
              </div>

              {/* 사업자번호 (수정불가) */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">사업자번호</label>
                <div className="business-number-display-mobile">
                  {corporateInfo?.business_number ? (
                    <>
                      <span className="business-part">{corporateInfo.business_number.substring(0, 3)}</span>
                      <span className="business-divider">—</span>
                      <span className="business-part">{corporateInfo.business_number.substring(3, 5)}</span>
                      <span className="business-divider">—</span>
                      <span className="business-part">{corporateInfo.business_number.substring(5)}</span>
                    </>
                  ) : ''}
                </div>
              </div>

              {/* 담당자 정보 */}
              {contacts.map((contact, index) => (
                <div key={index} className="contact-section-mobile">
                  {index === 0 && <div className="contact-divider-mobile" />}
                  
                  {/* 담당자명 */}
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">담당자명</label>
                    <input
                      type="text"
                      value={contact.contact_name}
                      onChange={(e) => handleContactChange(index, 'contact_name', e.target.value)}
                      placeholder="담당자명을 입력해주세요"
                      className="form-input-mobile"
                    />
                  </div>

                  {/* 부서 */}
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">부서</label>
                    <input
                      type="text"
                      value={contact.department}
                      onChange={(e) => handleContactChange(index, 'department', e.target.value)}
                      placeholder="부서를 입력해주세요"
                      className="form-input-mobile"
                    />
                  </div>

                  {/* 직급/직책 */}
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">직급/직책</label>
                    <input
                      type="text"
                      value={contact.position}
                      onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                      placeholder="직급/직책을 입력해주세요"
                      className="form-input-mobile"
                    />
                  </div>

                  {/* 이메일 주소 */}
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">이메일 주소</label>
                    <div className="email-input-group-mobile">
                      <input
                        type="text"
                        value={contact.email}
                        onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                        placeholder="이메일"
                        className="form-input-mobile email-id-mobile"
                      />
                      <span className="email-at-mobile">@</span>
                      <input
                        type="text"
                        value={contact.emailDomain}
                        onChange={(e) => handleContactChange(index, 'emailDomain', e.target.value)}
                        placeholder="도메인"
                        className="form-input-mobile email-domain-mobile"
                        readOnly={contact.emailDomainSelect !== '직접입력'}
                      />
                    </div>
                    <select
                      value={contact.emailDomainSelect}
                      onChange={(e) => handleContactChange(index, 'emailDomainSelect', e.target.value)}
                      className="form-select-mobile"
                    >
                      {emailDomains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain === '직접입력' ? '선택' : domain}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 휴대폰 번호 */}
                  <div className="form-field-mobile">
                    <label className="form-label-mobile">휴대폰 번호</label>
                    <input
                      type="tel"
                      value={contact.mobile_phone}
                      onChange={(e) => handleContactChange(index, 'mobile_phone', e.target.value)}
                      placeholder="휴대폰 번호를 입력해주세요"
                      className="form-input-mobile"
                    />
                  </div>
                </div>
              ))}

              {/* 담당자 추가 버튼 */}
              <div className="add-contact-wrapper-mobile">
                <button 
                  type="button" 
                  className="add-contact-btn-mobile"
                  onClick={handleAddContact}
                >
                  담당자추가 +
                </button>
              </div>

              {/* 수신 여부 */}
              <div className="receive-options-mobile">
                <div className="receive-row-mobile">
                  <span className="receive-label-mobile">이메일</span>
                  <div className="receive-buttons-mobile">
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="emailReceive"
                        checked={emailReceive}
                        onChange={() => setEmailReceive(true)}
                      />
                      <span className={`receive-btn-mobile ${emailReceive ? 'active' : ''}`}>수신</span>
                    </label>
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="emailReceive"
                        checked={!emailReceive}
                        onChange={() => setEmailReceive(false)}
                      />
                      <span className={`receive-btn-mobile ${!emailReceive ? 'active' : ''}`}>미수신</span>
                    </label>
                  </div>
                </div>
                <div className="receive-row-mobile">
                  <span className="receive-label-mobile">SMS</span>
                  <div className="receive-buttons-mobile">
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="smsReceive"
                        checked={smsReceive}
                        onChange={() => setSmsReceive(true)}
                      />
                      <span className={`receive-btn-mobile ${smsReceive ? 'active' : ''}`}>수신</span>
                    </label>
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="smsReceive"
                        checked={!smsReceive}
                        onChange={() => setSmsReceive(false)}
                      />
                      <span className={`receive-btn-mobile ${!smsReceive ? 'active' : ''}`}>미수신</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 포괄계약 신청 */}
              <div className="comprehensive-contract-section-mobile">
                <h3 className="section-title-mobile">
                  <span className="title-highlight">포괄계약 신청</span> 여부를 선택해 주세요.
                </h3>
                <div className="contract-options-mobile">
                  <label className="contract-option-mobile">
                    <input
                      type="radio"
                      name="comprehensiveContract"
                      checked={comprehensiveContract}
                      onChange={() => setComprehensiveContract(true)}
                    />
                    <span className={`contract-btn-mobile ${comprehensiveContract ? 'active' : ''}`}>신청</span>
                  </label>
                  <label className="contract-option-mobile">
                    <input
                      type="radio"
                      name="comprehensiveContract"
                      checked={!comprehensiveContract}
                      onChange={() => setComprehensiveContract(false)}
                    />
                    <span className={`contract-btn-mobile ${!comprehensiveContract ? 'active' : ''}`}>신청하지 않음</span>
                  </label>
                </div>
                
                <div className="contract-info-box-mobile">
                  <p>
                    포괄계약(open policy)을 체결하시면 청약서 작성, 보험료 정산 등 보험가입 프로세스가 보다 편리해 집니다. 포괄계약 신청시 <span className="highlight-red">사업자등록증(또는 고유번호증)은 필수서류</span>입니다.
                  </p>
                  <p className="contact-info">- 팩스번호 : 02-2261-0098</p>
                  <p className="contact-info">- 메일주소 : tourvalley@insvalley.com</p>
                </div>

                <button type="button" className="agreement-link-btn-mobile">
                  단체 및 포괄계약 업무 협정서 보기
                  <span className="arrow">›</span>
                </button>
              </div>

              {/* 버튼 */}
              <div className="form-buttons-mobile">
                <button 
                  type="button" 
                  className="btn-secondary-mobile"
                  onClick={handleGoHome}
                >
                  처음으로
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-mobile"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '처리 중...' : '회원정보변경'}
                </button>
              </div>
            </form>
          ) : (
            /* 개인회원 폼 */
            <form onSubmit={handlePersonalSubmit} className="mypage-form-mobile">
              {/* 아이디 (수정불가) */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">아이디</label>
                <input
                  type="text"
                  value={member?.username || ''}
                  className="form-input-mobile readonly"
                  readOnly
                  disabled
                />
              </div>

              {/* 비밀번호 */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="변경할 비밀번호를 입력해주세요"
                  className="form-input-mobile password-input"
                  autoComplete="new-password"
                />
              </div>

              {/* 비밀번호 재확인 */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">비밀번호 재확인</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재확인"
                  className="form-input-mobile"
                  autoComplete="new-password"
                />
              </div>

              {/* 이름 (수정불가) */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">이름</label>
                <input
                  type="text"
                  value={member?.name || ''}
                  className="form-input-mobile readonly"
                  readOnly
                  disabled
                />
              </div>

              {/* 생년월일 / 성별 (수정불가) */}
              <div className="form-field-row-mobile">
                <div className="form-field-half-mobile">
                  <label className="form-label-mobile">생년월일</label>
                  <input
                    type="text"
                    value={member?.birth_date || ''}
                    className="form-input-mobile readonly"
                    readOnly
                    disabled
                  />
                </div>
                <div className="form-field-half-mobile gender-field-mobile">
                  <label className="form-label-mobile">성별</label>
                  <div className="gender-buttons-mobile">
                    <button
                      type="button"
                      className={`gender-btn-mobile ${member?.gender === '남자' ? 'active' : ''}`}
                      disabled
                    >
                      남자
                    </button>
                    <button
                      type="button"
                      className={`gender-btn-mobile ${member?.gender === '여자' ? 'active' : ''}`}
                      disabled
                    >
                      여자
                    </button>
                  </div>
                </div>
              </div>

              {/* 이메일 주소 */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">이메일 주소</label>
                <div className="email-input-group-mobile">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    className="form-input-mobile email-id-mobile"
                  />
                  <span className="email-at-mobile">@</span>
                  <input
                    type="text"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    placeholder="도메인"
                    className="form-input-mobile email-domain-mobile"
                    readOnly={emailDomainSelect !== '직접입력'}
                  />
                </div>
                <select
                  value={emailDomainSelect}
                  onChange={handleEmailDomainSelect}
                  className="form-select-mobile"
                >
                  {emailDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain === '직접입력' ? '선택' : domain}
                    </option>
                  ))}
                </select>
              </div>

              {/* 휴대폰 번호 */}
              <div className="form-field-mobile">
                <label className="form-label-mobile">휴대폰 번호</label>
                <input
                  type="tel"
                  value={mobilePhone}
                  onChange={handlePhoneChange}
                  placeholder="휴대폰 번호를 입력해주세요"
                  className="form-input-mobile"
                />
              </div>

              {/* 수신 여부 */}
              <div className="receive-options-mobile">
                <div className="receive-row-mobile">
                  <span className="receive-label-mobile">이메일</span>
                  <div className="receive-buttons-mobile">
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="emailReceive"
                        checked={emailReceive}
                        onChange={() => setEmailReceive(true)}
                      />
                      <span className={`receive-btn-mobile ${emailReceive ? 'active' : ''}`}>수신</span>
                    </label>
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="emailReceive"
                        checked={!emailReceive}
                        onChange={() => setEmailReceive(false)}
                      />
                      <span className={`receive-btn-mobile ${!emailReceive ? 'active' : ''}`}>미수신</span>
                    </label>
                  </div>
                </div>
                <div className="receive-row-mobile">
                  <span className="receive-label-mobile">SMS</span>
                  <div className="receive-buttons-mobile">
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="smsReceive"
                        checked={smsReceive}
                        onChange={() => setSmsReceive(true)}
                      />
                      <span className={`receive-btn-mobile ${smsReceive ? 'active' : ''}`}>수신</span>
                    </label>
                    <label className="receive-option-mobile">
                      <input
                        type="radio"
                        name="smsReceive"
                        checked={!smsReceive}
                        onChange={() => setSmsReceive(false)}
                      />
                      <span className={`receive-btn-mobile ${!smsReceive ? 'active' : ''}`}>미수신</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="form-buttons-mobile">
                <button 
                  type="button" 
                  className="btn-secondary-mobile"
                  onClick={handleGoHome}
                >
                  처음으로
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-mobile"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '처리 중...' : '회원정보변경'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}
