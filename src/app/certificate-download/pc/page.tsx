'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

function CertificateDownloadContent() {
  const searchParams = useSearchParams();
  const [memberType, setMemberType] = useState<'I' | 'C'>('I');
  const [urlContractId, setUrlContractId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    company_name: '',
    resno1: '',
    resno2: '',
    resno3: '',
    ctel_no: '',
    signNo: '',
    contract_number: '', // contract_id에서 contract_number로 변경
    contract_id_internal: 0, // 내부 ID (다운로드용)
    file_type: 'policy',
    contract_name: '',
    birth_ssn: '',
    ctel_no1: '',
    ctel_rest: '',
    before_ctel: '',
    reSendYn: 'N',
    fromAgent: ''
  });
  const [showSignArea, setShowSignArea] = useState(false);
  const [isKakao, setIsKakao] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 기기 감지만 수행
    if (/KAKAOTALK/i.test(navigator.userAgent)) {
      setIsKakao(true);
    }
    
    if (/iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())) {
      setIsIOS(true);
    }
  }, []);

  // URL 쿼리: contract_id 있으면 해당 계약 가입증서, 없으면 최신 계약
  useEffect(() => {
    const contractId = searchParams.get('contract_id');
    const fileType = searchParams.get('file_type');
    if (contractId?.trim()) {
      setUrlContractId(contractId.trim());
    }
    if (fileType?.trim()) {
      setFormData((prev) => ({ ...prev, file_type: fileType.trim() as 'policy' }));
    }
  }, [searchParams]);

  const handleMemberTypeChange = (type: 'I' | 'C') => {
    setMemberType(type);
    setFormData({
      ...formData,
      name: '',
      birth_date: '',
      company_name: '',
      resno1: '',
      resno2: '',
      resno3: '',
      ctel_no: '',
      signNo: '',
      reSendYn: 'N'
    });
    setShowSignArea(false);
  };

  const replaceChar = (value: string) => {
    return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  };

  const handleInputChange = (field: string, value: string) => {
    if (['birth_date', 'resno1', 'resno2', 'resno3', 'ctel_no', 'signNo'].includes(field)) {
      value = replaceChar(value);
    }
    setFormData({ ...formData, [field]: value });
  };

  const isYYYYMMDD = (dateStr: string): boolean => {
    if (dateStr.length !== 8) return false;
    
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    
    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    return true;
  };

  const isEmailEntry = !!urlContractId;

  const checkMobilePhone = (first: string, rest: string): boolean => {
    const fullNumber = first + rest;
    if (fullNumber.length < 10 || fullNumber.length > 11) return false;
    
    const mobilePrefix = ['010', '011', '016', '017', '018', '019'];
    if (!mobilePrefix.includes(first)) {
      alert('휴대폰 번호가 올바르지 않습니다.');
      return false;
    }
    return true;
  };

  const checkInput = async () => {
    let contract_name = '';
    let birth_ssn = '';

    if (memberType === 'I') {
      if (!formData.birth_date || formData.birth_date.length !== 8) {
        alert('생년월일 8자리를 입력해주세요.');
        return;
      }

      if (!isYYYYMMDD(formData.birth_date)) {
        alert('생년월일을 정확히 입력해주세요.');
        return;
      }

      contract_name = formData.name.trim();
      birth_ssn = formData.birth_date.substring(2);
    } else {
      if (formData.resno1.length < 3) {
        alert('사업자번호를 정확히 입력해주세요.');
        return;
      }

      if (formData.resno2.length < 2) {
        alert('사업자번호를 정확히 입력해주세요.');
        return;
      }

      if (formData.resno3.length < 5) {
        alert('사업자번호를 정확히 입력해주세요.');
        return;
      }

      contract_name = formData.company_name.trim();
      birth_ssn = formData.resno1 + formData.resno2 + formData.resno3;
    }

    if (!isEmailEntry && (!formData.ctel_no || formData.ctel_no.length < 10 || formData.ctel_no.length > 11)) {
      alert('휴대폰 번호를 정확히 입력해주세요.');
      return;
    }

    if (isEmailEntry) {
      // 이메일 링크 진입인 경우에는 휴대폰 인증 플로우를 사용하지 않음
      return;
    }

    const ctel_no1 = formData.ctel_no.substring(0, 3);
    const ctel_rest = formData.ctel_no.substring(3);

    if (!checkMobilePhone(ctel_no1, ctel_rest)) return;

    const newCtelNo = ctel_no1 + ctel_rest;
    let reSendYn = formData.reSendYn;
    
    if (formData.before_ctel !== newCtelNo) {
      reSendYn = 'N';
    }

    try {
      // 1단계: 입력 정보로 계약 검색 (URL에 contract_id 있으면 해당 건, 없으면 최신 건)
      const findRequestBody: any = {
        member_type: memberType,
        phone_number: newCtelNo
      };

      if (memberType === 'I') {
        if (contract_name) {
          findRequestBody.name = contract_name;
        }
        findRequestBody.birth_date = formData.birth_date;
      } else {
        if (contract_name) {
          findRequestBody.company_name = contract_name;
        }
        findRequestBody.business_number = birth_ssn;
      }

      if (urlContractId) {
        findRequestBody.contract_number = urlContractId;
      }

      const findResponse = await fetch('/api/certificate/find-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(findRequestBody)
      });

      const findData = await findResponse.json();
      
      if (!findData.success) {
        alert(findData.message || '계약을 찾을 수 없습니다.');
        return;
      }

      // 계약번호 저장
      const contractNumber = findData.contract_number;
      const contractId = findData.contract_id;

      // 2단계: 인증번호 발송
      const sendCodeRequestBody: any = {
        contract_id: contractNumber,
        member_type: memberType,
        phone_number: newCtelNo
      };

      if (memberType === 'I') {
        if (contract_name) {
          sendCodeRequestBody.name = contract_name;
        }
        sendCodeRequestBody.birth_date = formData.birth_date;
      } else {
        if (contract_name) {
          sendCodeRequestBody.company_name = contract_name;
        }
        sendCodeRequestBody.business_number = birth_ssn;
      }

      const sendResponse = await fetch('/api/certificate/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendCodeRequestBody)
      });

      const sendData = await sendResponse.json();

      if (sendData.success) {
        alert('인증번호가 발송되었습니다.');
        setShowSignArea(true);
        setFormData({
          ...formData,
          contract_number: contractNumber,
          contract_id_internal: contractId,
          contract_name,
          birth_ssn,
          ctel_no1,
          ctel_rest,
          before_ctel: newCtelNo,
          reSendYn: 'Y',
          signNo: ''
        });
      } else {
        alert(sendData.message || '인증번호 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('처리 중 오류가 발생했습니다.\n새로고침 후 다시 시도해주세요.');
    }
  };

  // 이메일 링크 진입: contract_id + 생년월일 또는 사업자번호만으로 가입증명서 다운로드
  const verifyByIdentity = async () => {
    if (!urlContractId) return;

    if (memberType === 'I') {
      if (!formData.birth_date || formData.birth_date.length !== 8) {
        alert('생년월일 8자리를 입력해주세요.');
        return;
      }

      if (!isYYYYMMDD(formData.birth_date)) {
        alert('생년월일을 정확히 입력해주세요.');
        return;
      }
    } else {
      if (formData.resno1.length < 3 || formData.resno2.length < 2 || formData.resno3.length < 5) {
        alert('사업자번호를 정확히 입력해주세요.');
        return;
      }
    }

    try {
      const body: any = {
        contract_number: urlContractId,
        member_type: memberType,
      };

      if (memberType === 'I') {
        body.birth_date = formData.birth_date;
      } else {
        body.business_number = formData.resno1 + formData.resno2 + formData.resno3;
      }

      const response = await fetch('/api/certificate/verify-by-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success || !data.contractId) {
        alert(data.message || '가입증명서를 찾을 수 없습니다.');
        return;
      }

      window.open(`/api/certificate/download/${data.contractId}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const compareNo = async () => {
    if (formData.reSendYn !== 'Y') {
      alert('인증번호받기를 먼저 해주세요.');
      return;
    }

    if (!formData.signNo || formData.signNo.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/certificate/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formData.ctel_no1 + formData.ctel_rest,
          verification_code: formData.signNo
        })
      });

      const data = await response.json();

      if (data.success) {
        // 인증 성공 - 파일 다운로드 (저장된 내부 ID 사용)
        const downloadUrl = `/api/certificate/download/${formData.contract_id_internal}`;
        
        // 새 창에서 다운로드 시작
        const downloadWindow = window.open(downloadUrl, '_blank');
        
        // 다운로드 완료 후 창 닫기 (3초 후)
        setTimeout(() => {
          if (downloadWindow) {
            downloadWindow.close();
          }
        }, 3000);

        // 폼 초기화
        setFormData({
          ...formData,
          name: '',
          birth_date: '',
          company_name: '',
          resno1: '',
          resno2: '',
          resno3: '',
          ctel_no: '',
          signNo: '',
          contract_number: '',
          contract_id_internal: 0,
          reSendYn: 'N'
        });
        setShowSignArea(false);
      } else {
        alert(data.message || '인증에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('인증에 실패했습니다.');
    }
  };

  return (
    <>
      <Header isMobile={false} />
      <div className="certificate-download-pc">
        <div className="cd-wrapper">
          <div className="cd-container">
            <div className="cd-content">
              <h1 className="cd-title">가입증서 다운로드</h1>
              
              <form
                className="cd-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isEmailEntry) {
                    verifyByIdentity();
                  } else if (showSignArea) {
                    compareNo();
                  } else {
                    checkInput();
                  }
                }}
              >
                <section className="cd-form-section">
                  {/* 개인/법인단체 선택 */}
                  <div className="cd-member-type">
                    <ul className="cd-radio-list">
                      <li className="cd-radio-item">
                        <input
                          type="radio"
                          name="memberType"
                          value="I"
                          id="type-individual"
                          checked={memberType === 'I'}
                          onChange={() => handleMemberTypeChange('I')}
                        />
                        <label htmlFor="type-individual">
                          <span className="cd-radio-text">개인</span>
                        </label>
                      </li>
                      <li className="cd-radio-item">
                        <input
                          type="radio"
                          name="memberType"
                          value="C"
                          id="type-company"
                          checked={memberType === 'C'}
                          onChange={() => handleMemberTypeChange('C')}
                        />
                        <label htmlFor="type-company">
                          <span className="cd-radio-text">법인단체</span>
                        </label>
                      </li>
                    </ul>
                  </div>

                  {/* 개인 입력 폼 */}
                  {memberType === 'I' && (
                    <div className="cd-input-area">
                      <div className="cd-form-group">
                        <label>생년월일</label>
                        <input
                          type="tel"
                          value={formData.birth_date}
                          onChange={(e) => handleInputChange('birth_date', e.target.value)}
                          maxLength={8}
                          placeholder="생년월일(8자리) 입력"
                          className="cd-input"
                        />
                      </div>
                    </div>
                  )}

                  {/* 법인단체 입력 폼 */}
                  {memberType === 'C' && (
                    <div className="cd-input-area">
                      <div className="cd-form-group cd-business-number">
                        <label>사업자번호</label>
                        <div className="cd-business-inputs">
                          <input
                            type="tel"
                            value={formData.resno1}
                            onChange={(e) => handleInputChange('resno1', e.target.value)}
                            maxLength={3}
                            placeholder=""
                            className="cd-input cd-input-small"
                          />
                          <input
                            type="tel"
                            value={formData.resno2}
                            onChange={(e) => handleInputChange('resno2', e.target.value)}
                            maxLength={2}
                            placeholder=""
                            className="cd-input cd-input-small"
                          />
                          <input
                            type="tel"
                            value={formData.resno3}
                            onChange={(e) => handleInputChange('resno3', e.target.value)}
                            maxLength={5}
                            placeholder=""
                            className="cd-input cd-input-small"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 이메일 링크 진입: 휴대폰 인증 없이 본인확인 후 다운로드 */}
                  {isEmailEntry && (
                    <div className="cd-form-group">
                      <div className="cd-button-wrapper">
                        <button
                          type="button"
                          onClick={verifyByIdentity}
                          className="cd-button cd-button-primary"
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 일반 진입: 휴대폰 인증 플로우 */}
                  {!isEmailEntry && (
                    <>
                      <div className="cd-form-group">
                        <label>휴대폰 번호</label>
                        <input
                          type="tel"
                          value={formData.ctel_no}
                          onChange={(e) => handleInputChange('ctel_no', e.target.value)}
                          maxLength={11}
                          placeholder="(-없이) 숫자만 입력"
                          className="cd-input"
                        />
                        <div className="cd-button-wrapper">
                          <button
                            type="button"
                            onClick={checkInput}
                            className="cd-button cd-button-primary"
                          >
                            인증번호받기
                          </button>
                        </div>
                      </div>

                      {/* 인증번호 입력 */}
                      {showSignArea && (
                        <div className="cd-form-group cd-sign-area">
                          <label>인증번호</label>
                          <input
                            type="tel"
                            value={formData.signNo}
                            onChange={(e) => handleInputChange('signNo', e.target.value)}
                            maxLength={6}
                            placeholder="인증번호 입력"
                            className="cd-input"
                          />
                          <div className="cd-button-wrapper">
                            <button
                              type="button"
                              onClick={compareNo}
                              className="cd-button cd-button-primary"
                            >
                              확인
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer isMobile={false} />
    </>
  );
}

export default function CertificateDownloadPC() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '16px'
      }}>
        페이지를 불러오는 중...
      </div>
    }>
      <CertificateDownloadContent />
    </Suspense>
  );
}

