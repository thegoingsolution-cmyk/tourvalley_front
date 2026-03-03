'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

function CardReceiptDownloadContent() {
  const [memberType, setMemberType] = useState<'I' | 'C'>('I');
  const [formData, setFormData] = useState({
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
    contract_name: '',
    birth_ssn: '',
    ctel_no1: '',
    ctel_rest: '',
    before_ctel: '',
    reSendYn: 'N',
  });
  const [showSignArea, setShowSignArea] = useState(false);

  useEffect(() => {
    // no-op
  }, []);

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
      reSendYn: 'N',
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
      if (!formData.name.trim()) {
        alert('대표피보험자 이름을 입력해주세요.');
        return;
      }

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
      if (!formData.company_name.trim()) {
        alert('법인(단체)명을 입력해주세요');
        return;
      }

      if (formData.resno1.length < 3 || formData.resno2.length < 2 || formData.resno3.length < 5) {
        alert('사업자번호를 정확히 입력해주세요.');
        return;
      }

      contract_name = formData.company_name.trim();
      birth_ssn = formData.resno1 + formData.resno2 + formData.resno3;
    }

    if (!formData.ctel_no || formData.ctel_no.length < 10 || formData.ctel_no.length > 11) {
      alert('휴대폰 번호를 정확히 입력해주세요.');
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
      const findRequestBody: any = {
        member_type: memberType,
        phone_number: newCtelNo,
      };

      if (memberType === 'I') {
        findRequestBody.name = contract_name;
        findRequestBody.birth_date = formData.birth_date;
      } else {
        findRequestBody.company_name = contract_name;
        findRequestBody.business_number = birth_ssn;
      }

      const findResponse = await fetch('/api/certificate/find-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(findRequestBody),
      });

      const findData = await findResponse.json();

      if (!findData.success) {
        alert(findData.message || '계약을 찾을 수 없습니다.');
        return;
      }

      const contractNumber = findData.contract_number;
      const contractId = findData.contract_id;

      const sendCodeRequestBody: any = {
        contract_id: contractNumber,
        member_type: memberType,
        phone_number: newCtelNo,
      };

      if (memberType === 'I') {
        sendCodeRequestBody.name = contract_name;
        sendCodeRequestBody.birth_date = formData.birth_date;
      } else {
        sendCodeRequestBody.company_name = contract_name;
        sendCodeRequestBody.business_number = birth_ssn;
      }

      const sendResponse = await fetch('/api/certificate/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendCodeRequestBody),
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
          signNo: '',
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
          phone_number: formData.ctel_no1 + formData.ctel_rest,
          verification_code: formData.signNo,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || '인증에 실패했습니다.');
        return;
      }

      const receiptResponse = await fetch(
        `/api/payments/receipt?contract_id=${formData.contract_id_internal}`,
      );
      const receiptData = await receiptResponse.json();

      if (!receiptResponse.ok || !receiptData.success || !receiptData.receiptUrl) {
        alert(receiptData.message || '카드 영수증 정보를 찾을 수 없습니다.');
        return;
      }

      window.open(receiptData.receiptUrl, '_blank', 'noopener,noreferrer');

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
        reSendYn: 'N',
      });
      setShowSignArea(false);
    } catch (error) {
      console.error(error);
      alert('카드 영수증 조회 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Header isMobile={true} />
      <div className="certificate-download-mobile">
        <div className="cdm-wrapper">
          <div className="cdm-container">
            <div className="cdm-content">
              <h1 className="cdm-title">카드영수증 다운로드</h1>

              <form className="cdm-form">
                <section className="cdm-form-section">
                  <div className="cdm-member-type">
                    <ul className="cdm-radio-list">
                      <li className="cdm-radio-item">
                        <input
                          type="radio"
                          name="memberType"
                          value="I"
                          id="card-type-individual-m"
                          checked={memberType === 'I'}
                          onChange={() => handleMemberTypeChange('I')}
                        />
                        <label htmlFor="card-type-individual-m">
                          <span className="cdm-radio-text">개인</span>
                        </label>
                      </li>
                      <li className="cdm-radio-item">
                        <input
                          type="radio"
                          name="memberType"
                          value="C"
                          id="card-type-company-m"
                          checked={memberType === 'C'}
                          onChange={() => handleMemberTypeChange('C')}
                        />
                        <label htmlFor="card-type-company-m">
                          <span className="cdm-radio-text">법인단체</span>
                        </label>
                      </li>
                    </ul>
                  </div>

                  {memberType === 'I' && (
                    <div className="cdm-input-area">
                      <div className="cdm-form-group">
                        <label>이름</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          maxLength={25}
                          placeholder="이름 입력"
                          className="cdm-input"
                        />
                      </div>
                      <div className="cdm-form-group">
                        <label>생년월일</label>
                        <input
                          type="tel"
                          value={formData.birth_date}
                          onChange={(e) => handleInputChange('birth_date', e.target.value)}
                          maxLength={8}
                          placeholder="생년월일(8자리) 입력"
                          className="cdm-input"
                        />
                      </div>
                    </div>
                  )}

                  {memberType === 'C' && (
                    <div className="cdm-input-area">
                      <div className="cdm-form-group">
                        <label>법인(단체)명</label>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          maxLength={20}
                          placeholder="법인(단체)명"
                          className="cdm-input"
                        />
                      </div>
                      <div className="cdm-form-group cdm-business-number">
                        <label>사업자번호</label>
                        <div className="cdm-business-inputs">
                          <input
                            type="tel"
                            value={formData.resno1}
                            onChange={(e) => handleInputChange('resno1', e.target.value)}
                            maxLength={3}
                            className="cdm-input cdm-input-small"
                          />
                          <input
                            type="tel"
                            value={formData.resno2}
                            onChange={(e) => handleInputChange('resno2', e.target.value)}
                            maxLength={2}
                            className="cdm-input cdm-input-small"
                          />
                          <input
                            type="tel"
                            value={formData.resno3}
                            onChange={(e) => handleInputChange('resno3', e.target.value)}
                            maxLength={5}
                            className="cdm-input cdm-input-small"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="cdm-form-group">
                    <label>휴대폰 번호</label>
                    <input
                      type="tel"
                      value={formData.ctel_no}
                      onChange={(e) => handleInputChange('ctel_no', e.target.value)}
                      maxLength={11}
                      placeholder="(-없이) 숫자만 입력"
                      className="cdm-input"
                    />
                    <div className="cdm-button-wrapper">
                      <button
                        type="button"
                        onClick={checkInput}
                        className="cdm-button cdm-button-primary"
                      >
                        인증번호받기
                      </button>
                    </div>
                  </div>

                  {showSignArea && (
                    <div className="cdm-form-group cdm-sign-area">
                      <label>인증번호</label>
                      <input
                        type="tel"
                        value={formData.signNo}
                        onChange={(e) => handleInputChange('signNo', e.target.value)}
                        maxLength={6}
                        placeholder="인증번호 입력"
                        className="cdm-input"
                      />
                      <div className="cdm-button-wrapper">
                        <button
                          type="button"
                          onClick={compareNo}
                          className="cdm-button cdm-button-primary"
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </form>
              <div className="cdm-spacer" />
            </div>
          </div>
        </div>
      </div>
      <Footer isMobile={true} />
    </>
  );
}

export default function CardReceiptDownloadMobile() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontSize: '16px',
          }}
        >
          페이지를 불러오는 중...
        </div>
      }
    >
      <CardReceiptDownloadContent />
    </Suspense>
  );
}

