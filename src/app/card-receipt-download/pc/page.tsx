'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

function CardReceiptDownloadContent() {
  const BANK_RECEIPT_VERIFY_KEY_PREFIX = 'bank_receipt_verified_';
  const searchParams = useSearchParams();
  const contractIdFromUrl = searchParams.get('contract_id') || '';
  const isEmailEntry = !!contractIdFromUrl.trim();

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
    // no-op (향후 기기 감지 필요 시 확장)
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

  // 1단계: 계약 조회 및 인증번호 발송
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

    if (!isEmailEntry && (!formData.ctel_no || formData.ctel_no.length < 10 || formData.ctel_no.length > 11)) {
      alert('휴대폰 번호를 정확히 입력해주세요.');
      return;
    }

    if (isEmailEntry) return; // 이메일 진입은 checkInput 대신 verifyByIdentity 사용

    const ctel_no1 = formData.ctel_no.substring(0, 3);
    const ctel_rest = formData.ctel_no.substring(3);

    if (!checkMobilePhone(ctel_no1, ctel_rest)) return;

    const newCtelNo = ctel_no1 + ctel_rest;
    let reSendYn = formData.reSendYn;

    if (formData.before_ctel !== newCtelNo) {
      reSendYn = 'N';
    }

    try {
      // 계약 검색 (가장 최근 1건은 백엔드에서 처리)
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

      // 인증번호 발송
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

  // 이메일 링크 진입(contract_id 있음): 생년월일/사업자번호로 바로 영수증 조회
  const verifyByIdentity = async () => {
    if (!contractIdFromUrl.trim()) return;

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
      const body: Record<string, string> = {
        contract_number: contractIdFromUrl.trim(),
        member_type: memberType,
      };
      if (memberType === 'I') {
        body.birth_date = formData.birth_date;
      } else {
        body.business_number = formData.resno1 + formData.resno2 + formData.resno3;
      }

      const response = await fetch('/api/certificate/verify-receipt-by-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!data.success || !data.receiptUrl) {
        alert(data.message || '영수증 정보를 찾을 수 없습니다.');
        return;
      }

      try {
        const url = new URL(data.receiptUrl, window.location.origin);
        const contractId = url.searchParams.get('contractId');
        if (url.pathname.includes('/payments/bank-transfer-receipt') && contractId) {
          localStorage.setItem(`${BANK_RECEIPT_VERIFY_KEY_PREFIX}${contractId}`, String(Date.now()));
        }
      } catch {
        // ignore
      }

      window.open(data.receiptUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 2단계: 인증번호 확인 후 카드 영수증 URL 조회
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

      // 인증 성공 후 카드 영수증 URL 조회 (가장 최근 1건)
      const receiptResponse = await fetch(
        `/api/payments/receipt?contract_id=${formData.contract_id_internal}`,
      );
      const receiptData = await receiptResponse.json();

      if (!receiptResponse.ok || !receiptData.success || !receiptData.receiptUrl) {
        alert(receiptData.message || '카드 영수증 정보를 찾을 수 없습니다.');
        return;
      }

      window.open(receiptData.receiptUrl, '_blank', 'noopener,noreferrer');

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
      <Header isMobile={false} />
      <div className="certificate-download-pc">
        <div className="cd-wrapper">
          <div className="cd-container">
            <div className="cd-content">
              <h1 className="cd-title">카드영수증 다운로드</h1>

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
                          id="card-type-individual"
                          checked={memberType === 'I'}
                          onChange={() => handleMemberTypeChange('I')}
                        />
                        <label htmlFor="card-type-individual">
                          <span className="cd-radio-text">개인</span>
                        </label>
                      </li>
                      <li className="cd-radio-item">
                        <input
                          type="radio"
                          name="memberType"
                          value="C"
                          id="card-type-company"
                          checked={memberType === 'C'}
                          onChange={() => handleMemberTypeChange('C')}
                        />
                        <label htmlFor="card-type-company">
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
                            className="cd-input cd-input-small"
                          />
                          <input
                            type="tel"
                            value={formData.resno2}
                            onChange={(e) => handleInputChange('resno2', e.target.value)}
                            maxLength={2}
                            className="cd-input cd-input-small"
                          />
                          <input
                            type="tel"
                            value={formData.resno3}
                            onChange={(e) => handleInputChange('resno3', e.target.value)}
                            maxLength={5}
                            className="cd-input cd-input-small"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 이메일 링크 진입: 확인 버튼만 (휴대폰/인증번호 없음) */}
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

                  {/* 휴대폰 번호 (일반 진입만) */}
                  {!isEmailEntry && (
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
                  )}

                  {/* 인증번호 입력 (일반 진입만) */}
                  {!isEmailEntry && showSignArea && (
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

export default function CardReceiptDownloadPC() {
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

