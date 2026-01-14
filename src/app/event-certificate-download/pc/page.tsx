'use client';

import React, { useState, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

function EventCertificateDownloadContent() {
  const [formData, setFormData] = useState({
    contract_name: '',
    resno1: '',
    resno2: '',
    resno3: '',
    ctel_no: '',
    signNo: '',
    contract_number: '',
    contract_id_internal: 0,
    business_number: '',
    before_ctel: '',
    reSendYn: 'N'
  });
  const [showSignArea, setShowSignArea] = useState(false);

  const replaceChar = (value: string) => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleInputChange = (field: string, value: string) => {
    if (['resno1', 'resno2', 'resno3', 'ctel_no', 'signNo'].includes(field)) {
      value = replaceChar(value);
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleBusinessNumberInput = (index: 1 | 2 | 3, value: string) => {
    const maxLength = index === 1 ? 3 : index === 2 ? 2 : 5;
    value = replaceChar(value).substring(0, maxLength);
    
    setFormData({
      ...formData,
      [`resno${index}`]: value
    });

    // 자동 포커스 이동
    if (value.length === maxLength && index < 3) {
      const nextInput = document.getElementById(`resno${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const checkMobilePhone = (phone: string): boolean => {
    if (phone.length < 10 || phone.length > 11) {
      return false;
    }
    const mobilePrefix = ['010', '011', '016', '017', '018', '019'];
    const prefix = phone.substring(0, 3);
    if (!mobilePrefix.includes(prefix)) {
      alert('휴대폰 번호가 올바르지 않습니다.');
      return false;
    }
    return true;
  };

  const checkInput = async () => {
    if (!formData.contract_name.trim()) {
      alert('법인(단체)명을 입력해주세요');
      return;
    }

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

    if (!formData.ctel_no || formData.ctel_no.length < 10 || formData.ctel_no.length > 11) {
      alert('휴대폰 번호를 정확히 입력해주세요.');
      return;
    }

    if (!checkMobilePhone(formData.ctel_no)) {
      return;
    }

    const businessNumber = formData.resno1 + formData.resno2 + formData.resno3;
    const phoneNumber = formData.ctel_no;

    try {
      // 1단계: 계약 검색
      const findResponse = await fetch('/api/event-certificate/find-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_name: formData.contract_name.trim(),
          business_number: businessNumber,
          phone_number: phoneNumber
        })
      });

      const findData = await findResponse.json();

      if (!findData.success) {
        alert(findData.message || '계약을 찾을 수 없습니다.');
        return;
      }

      const contractNumber = findData.contract_number;
      const contractId = findData.contract_id;

      // 2단계: 인증번호 발송
      const sendResponse = await fetch('/api/event-certificate/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: contractNumber,
          contract_name: formData.contract_name.trim(),
          business_number: businessNumber,
          phone_number: phoneNumber
        })
      });

      const sendData = await sendResponse.json();

      if (sendData.success) {
        alert('인증번호가 발송되었습니다.');
        setShowSignArea(true);
        setFormData({
          ...formData,
          contract_number: contractNumber,
          contract_id_internal: contractId,
          business_number: businessNumber,
          before_ctel: phoneNumber,
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
          phone_number: formData.ctel_no,
          verification_code: formData.signNo
        })
      });

      const data = await response.json();

      if (data.success) {
        // 인증 성공 - 파일 다운로드
        const downloadUrl = `/api/event-certificate/download/${formData.contract_id_internal}`;
        
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
          contract_name: '',
          resno1: '',
          resno2: '',
          resno3: '',
          ctel_no: '',
          signNo: '',
          contract_number: '',
          contract_id_internal: 0,
          business_number: '',
          before_ctel: '',
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
      <div className="event-certificate-download-pc">
        <div className="ecd-wrapper">
          <div className="ecd-container">
            <div className="ecd-content">
              <h1 className="ecd-title">행사보험 가입증서 다운로드</h1>
              
              <form className="ecd-form">
                <section className="ecd-form-section">
                  {/* 법인(단체)명 */}
                  <div className="ecd-form-group">
                    <label>법인(단체)명</label>
                    <input
                      type="text"
                      value={formData.contract_name}
                      onChange={(e) => handleInputChange('contract_name', e.target.value)}
                      maxLength={20}
                      placeholder="법인(단체)명"
                      className="ecd-input"
                    />
                  </div>

                  {/* 사업자번호 */}
                  <div className="ecd-form-group ecd-business-number">
                    <label>사업자번호</label>
                    <div className="ecd-business-inputs">
                      <input
                        type="tel"
                        id="resno1"
                        value={formData.resno1}
                        onChange={(e) => handleBusinessNumberInput(1, e.target.value)}
                        maxLength={3}
                        placeholder=""
                        className="ecd-input ecd-input-small"
                      />
                      <input
                        type="tel"
                        id="resno2"
                        value={formData.resno2}
                        onChange={(e) => handleBusinessNumberInput(2, e.target.value)}
                        maxLength={2}
                        placeholder=""
                        className="ecd-input ecd-input-small"
                      />
                      <input
                        type="tel"
                        id="resno3"
                        value={formData.resno3}
                        onChange={(e) => handleBusinessNumberInput(3, e.target.value)}
                        maxLength={5}
                        placeholder=""
                        className="ecd-input ecd-input-small"
                      />
                    </div>
                  </div>

                  {/* 휴대폰 번호 */}
                  <div className="ecd-form-group">
                    <label>휴대폰 번호</label>
                    <input
                      type="tel"
                      value={formData.ctel_no}
                      onChange={(e) => handleInputChange('ctel_no', e.target.value)}
                      maxLength={11}
                      placeholder="(-없이) 숫자만 입력"
                      className="ecd-input"
                    />
                    <div className="ecd-button-wrapper">
                      <button
                        type="button"
                        onClick={checkInput}
                        className="ecd-button ecd-button-primary"
                      >
                        인증번호받기
                      </button>
                    </div>
                  </div>

                  {/* 인증번호 입력 */}
                  {showSignArea && (
                    <div className="ecd-form-group ecd-sign-area">
                      <label>인증번호</label>
                      <input
                        type="tel"
                        value={formData.signNo}
                        onChange={(e) => handleInputChange('signNo', e.target.value)}
                        maxLength={6}
                        placeholder="인증번호 입력"
                        className="ecd-input"
                      />
                      <div className="ecd-button-wrapper">
                        <button
                          type="button"
                          onClick={compareNo}
                          className="ecd-button ecd-button-primary"
                        >
                          확인
                        </button>
                      </div>
                    </div>
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

export default function EventCertificateDownloadPC() {
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
      <EventCertificateDownloadContent />
    </Suspense>
  );
}
