'use client';

import React, { useEffect } from 'react';
import { PaymentMethod, PaymentSubMethod } from './types';

interface PaymentStepProps {
  paymentMethod: PaymentMethod | null;
  paymentSubMethod: PaymentSubMethod | null;
  depositBank: string;
  depositorName: string;
  expectedDepositYear: number;
  expectedDepositMonth: number;
  expectedDepositDay: number;
  cardType: '본인카드' | '기타카드';
  cardCategory: string;
  cardNumber1: string;
  cardNumber2: string;
  cardNumber3: string;
  cardNumber4: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardholderName: string;
  cardholderResidentNumber: string;
  approvalYear: number;
  approvalMonth: number;
  approvalDay: number;
  normalPremium: number;
  receiptPremium: number;
  isSamePremium: boolean;
  departureDate?: string; // 출발일 (YYYY-MM-DD 형식)
  departureTime?: string; // 출발시간 (HH 형식)
  arrivalDate?: string; // 도착일 (YYYY-MM-DD 형식)
  arrivalTime?: string; // 도착시간 (HH 형식)
  onPaymentMethodChange: (method: PaymentMethod | null) => void;
  onPaymentSubMethodChange: (method: PaymentSubMethod | null) => void;
  onDepositBankChange: (bank: string) => void;
  onDepositorNameChange: (name: string) => void;
  onExpectedDepositDateChange: (year: number, month: number, day: number) => void;
  onCardTypeChange: (type: '본인카드' | '기타카드') => void;
  onCardCategoryChange: (category: string) => void;
  onCardNumberChange: (part: 1 | 2 | 3 | 4, value: string) => void;
  onCardExpiryChange: (month: string, year: string) => void;
  onCardholderNameChange: (name: string) => void;
  onCardholderResidentNumberChange: (number: string) => void;
  onApprovalDateChange: (year: number, month: number, day: number) => void;
  onNormalPremiumChange: (premium: number) => void;
  onReceiptPremiumChange: (premium: number) => void;
  onIsSamePremiumChange: (same: boolean) => void;
  onSubmit: () => void;
  className?: string;
}

export default function PaymentStep({
  paymentMethod,
  paymentSubMethod,
  depositBank,
  depositorName,
  expectedDepositYear,
  expectedDepositMonth,
  expectedDepositDay,
  cardType,
  cardCategory,
  cardNumber1,
  cardNumber2,
  cardNumber3,
  cardNumber4,
  cardExpiryMonth,
  cardExpiryYear,
  cardholderName,
  cardholderResidentNumber,
  approvalYear,
  approvalMonth,
  approvalDay,
  normalPremium,
  receiptPremium,
  isSamePremium,
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  onPaymentMethodChange,
  onPaymentSubMethodChange,
  onDepositBankChange,
  onDepositorNameChange,
  onExpectedDepositDateChange,
  onCardTypeChange,
  onCardCategoryChange,
  onCardNumberChange,
  onCardExpiryChange,
  onCardholderNameChange,
  onCardholderResidentNumberChange,
  onApprovalDateChange,
  onNormalPremiumChange,
  onReceiptPremiumChange,
  onIsSamePremiumChange,
  onSubmit,
  className,
}: PaymentStepProps) {
  // 무통장입금, 가상계좌, 수기카드 선택 시 paymentMethod를 '기타결제'로 설정
  const handleSubMethodSelect = (subMethod: PaymentSubMethod) => {
    onPaymentMethodChange('기타결제');
    onPaymentSubMethodChange(subMethod);
    if (subMethod === '가상계좌') {
      onDepositBankChange('');
    }
  };

  // 입금예정일 검증: 오늘 이전 불가, 보험 시작일(출발일) 당일·이후 불가 → 오늘 이상, 보험 시작일 미만만 허용
  const validateExpectedDepositDate = (year: number, month: number, day: number): boolean => {
    // 입금예정일이 완전히 입력되지 않았으면 검증하지 않음
    if (year === 0 || month === 0 || day === 0) {
      return true;
    }

    // "오늘" 기준은 KST(Asia/Seoul)로 고정 (클라이언트 타임존 차이 방지)
    const kstNow = new Date(
      new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date()).replace(' ', 'T')
    );
    const todayYear = kstNow.getFullYear();
    const todayMonth = kstNow.getMonth() + 1;
    const todayDay = kstNow.getDate();

    // 1) 오늘 이전이면 불가
    if (year < todayYear ||
        (year === todayYear && month < todayMonth) ||
        (year === todayYear && month === todayMonth && day < todayDay)) {
      const formattedToday = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      alert(`입금예정일은 오늘(${formattedToday}) 이후로 설정해야 합니다.`);
      return false;
    }

    // 2) 보험 시작일(출발일) "날짜+시간" 기준 검증
    // - 출발시간이 00이면: 입금예정일은 전날까지만 허용
    // - 출발시간이 00이 아니면: 같은 날짜도 허용
    // - 출발시간이 24이면: 다음날 00으로 간주
    if (departureDate && /^\d{4}-\d{2}-\d{2}$/.test(departureDate.trim())) {
      const base = new Date(`${departureDate.trim()}T00:00:00`);
      if (!Number.isNaN(base.getTime())) {
        const effectiveStart = new Date(base);
        const rawHour = departureTime;
        const hasDepartureTime =
          rawHour !== undefined &&
          rawHour !== null &&
          String(rawHour).trim() !== '';
        const parsedHour = hasDepartureTime ? parseInt(String(rawHour), 10) : NaN;
        let effectiveHour = Number.isFinite(parsedHour) ? parsedHour : 0;
        if (effectiveHour === 24) {
          effectiveStart.setDate(effectiveStart.getDate() + 1);
          effectiveHour = 0;
        }

        const startY = effectiveStart.getFullYear();
        const startM = effectiveStart.getMonth() + 1;
        const startD = effectiveStart.getDate();

        const isAfterStartDate =
          year > startY ||
          (year === startY && month > startM) ||
          (year === startY && month === startM && day > startD);
        const isSameStartDate = year === startY && month === startM && day === startD;
        // 출발시간 정보가 없으면(=전달 누락/파싱 실패) 같은 날짜 제한은 걸지 않음
        const isNotAllowedSameDay = isSameStartDate && effectiveHour === 0 && hasDepartureTime;

        if (isAfterStartDate || isNotAllowedSameDay) {
          const formattedStart = `${startY}-${String(startM).padStart(2, '0')}-${String(startD).padStart(2, '0')}`;
          alert(`입금예정일은 보험 시작일(${formattedStart}) 전으로만 설정 가능합니다.`);
          return false;
        }
      }
    }

    return true;
  };

  // 입금예정일 변경 핸들러
  const handleExpectedDepositDateChange = (year: number, month: number, day: number) => {
    // 검증 실패 시 변경하지 않음
    if (!validateExpectedDepositDate(year, month, day)) {
      return;
    }
    onExpectedDepositDateChange(year, month, day);
  };

  const paymentLabelStyle: React.CSSProperties = {
    paddingLeft: '24px',
    paddingTop: '8px',
    paddingBottom: '8px',
  };
  const paymentIconStyle: React.CSSProperties = {
    width: '38px',
    height: '38px',
  };
  const paymentTextStyle: React.CSSProperties = {
    fontSize: '16px',
  };

  // 무통장입금 선택 시 기본값으로 우리은행 설정
  useEffect(() => {
    if (paymentSubMethod === '무통장입금' && depositBank === '') {
      onDepositBankChange('우리은행');
    }
  }, [paymentSubMethod, depositBank, onDepositBankChange]);

  return (
    <section className={`form-section ${className || ''}`}>
      <div className="form-container">
        <div className="form-card payment-form-card">
          <div className="form-header">
            <h1 className="form-title">보험료 결제</h1>
          </div>

          {/* 결제 방법 선택 */}
          <div className="payment-methods-section">
            <div className="payment-method-option">
              <label htmlFor="nicepay" className="payment-method-label" style={paymentLabelStyle}>
                <img 
                  src="/icons/payment-credit-card.png" 
                  alt="신용카드" 
                  className="payment-method-icon"
                  style={paymentIconStyle}
                />
                <span style={paymentTextStyle}>신용카드</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="nicepay"
                  value="나이스페이먼츠"
                  checked={paymentMethod === '나이스페이먼츠'}
                  onChange={() => {
                    onPaymentMethodChange('나이스페이먼츠');
                    onPaymentSubMethodChange(null);
                  }}
                />
              </label>
            </div>
            <div className="payment-method-option">
              <label htmlFor="naverpay" className="payment-method-label" style={paymentLabelStyle}>
                <img 
                  src="/icons/payment-naver-pay.png" 
                  alt="네이버페이" 
                  className="payment-method-icon"
                  style={paymentIconStyle}
                />
                <span style={paymentTextStyle}>네이버페이</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="naverpay"
                  value="네이버페이"
                  checked={paymentMethod === '네이버페이'}
                  onChange={() => {
                    onPaymentMethodChange('네이버페이');
                    onPaymentSubMethodChange(null);
                  }}
                />
              </label>
            </div>
            <div className="payment-method-option">
              <label htmlFor="kakaopay" className="payment-method-label" style={paymentLabelStyle}>
                <img 
                  src="/icons/payment-kakao-pay.png" 
                  alt="카카오페이" 
                  className="payment-method-icon"
                  style={paymentIconStyle}
                />
                <span style={paymentTextStyle}>카카오페이</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="kakaopay"
                  value="카카오페이"
                  checked={paymentMethod === '카카오페이'}
                  onChange={() => {
                    onPaymentMethodChange('카카오페이');
                    onPaymentSubMethodChange(null);
                  }}
                />
              </label>
            </div>
            <div className="payment-method-option">
              <label htmlFor="bank-transfer" className="payment-method-label" style={paymentLabelStyle}>
                <img 
                  src="/icons/payment-other.png" 
                  alt="무통장입금" 
                  className="payment-method-icon"
                  style={paymentIconStyle}
                />
                <span style={paymentTextStyle}>무통장입금</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="bank-transfer"
                  value="무통장입금"
                  checked={paymentMethod === '기타결제' && paymentSubMethod === '무통장입금'}
                  onChange={() => handleSubMethodSelect('무통장입금')}
                />
              </label>
            </div>
            {receiptPremium >= 10000 && (
              <div className="payment-method-option">
                <label htmlFor="virtual-account" className="payment-method-label" style={paymentLabelStyle}>
                  <img 
                    src="/icons/payment-other.png" 
                    alt="가상계좌" 
                    className="payment-method-icon"
                    style={paymentIconStyle}
                  />
                  <span style={paymentTextStyle}>가상계좌</span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="virtual-account"
                    value="가상계좌"
                    checked={paymentMethod === '기타결제' && paymentSubMethod === '가상계좌'}
                    onChange={() => handleSubMethodSelect('가상계좌')}
                  />
                </label>
              </div>
            )}
            <div className="payment-method-option">
              <label htmlFor="manual-card" className="payment-method-label" style={paymentLabelStyle}>
                <img 
                  src="/icons/payment-other.png" 
                  alt="수기카드" 
                  className="payment-method-icon"
                  style={paymentIconStyle}
                />
                <span style={paymentTextStyle}>수기카드</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="manual-card"
                  value="수기카드"
                  checked={paymentMethod === '기타결제' && paymentSubMethod === '수기카드'}
                  onChange={() => handleSubMethodSelect('수기카드')}
                />
              </label>
            </div>
          </div>

          {/* 무통장입금, 가상계좌, 수기카드 상세 정보 */}
          {paymentMethod === '기타결제' && (
            <>

              {/* 무통장입금 상세 정보 */}
              {paymentSubMethod === '무통장입금' && (
                <div className="bank-transfer-details">
                  <div className="bank-option">
                    <input
                      type="radio"
                      name="depositBank"
                      id="woori"
                      value="우리은행"
                      checked={depositBank === '우리은행'}
                      onChange={() => onDepositBankChange('우리은행')}
                    />
                    <label htmlFor="woori" className="bank-option-label">
                      <div className="bank-option-title">보험료입금 전용계좌 무통장입금</div>
                      <div className="bank-option-details">(우리은행 : 1005-604-481542, 예금주 빨주노초파남보)</div>
                    </label>
                  </div>
                  <div className="bank-option">
                    <input
                      type="radio"
                      name="depositBank"
                      id="nonghyup"
                      value="농협"
                      checked={depositBank === '농협'}
                      onChange={() => onDepositBankChange('농협')}
                    />
                    <label htmlFor="nonghyup" className="bank-option-label">
                      <div className="bank-option-title">보험료입금 전용계좌 무통장입금</div>
                      <div className="bank-option-details">(농협: 301-0337-8596-01, 예금주 빨주노초파남보)</div>
                    </label>
                  </div>
                  <div className="form-group form-group-vertical">
                    <label>입금자명</label>
                    <input
                      type="text"
                      value={depositorName}
                      onChange={(e) => onDepositorNameChange(e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <div className="form-group form-group-vertical">
                    <label>입금예정일</label>
                    <div className="date-inputs">
                      <select
                        value={expectedDepositYear}
                        onChange={(e) => handleExpectedDepositDateChange(Number(e.target.value), expectedDepositMonth, expectedDepositDay)}
                      >
                      <option value={0}>연도 선택</option>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}년</option>
                        ))}
                      </select>
                      <select
                        value={expectedDepositMonth}
                        onChange={(e) => handleExpectedDepositDateChange(expectedDepositYear, Number(e.target.value), expectedDepositDay)}
                      >
                      <option value={0}>월 선택</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>{month}월</option>
                        ))}
                      </select>
                      <select
                        value={expectedDepositDay}
                        onChange={(e) => handleExpectedDepositDateChange(expectedDepositYear, expectedDepositMonth, Number(e.target.value))}
                      >
                      <option value={0}>일 선택</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}일</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 가상계좌 상세 정보 */}
              {paymentSubMethod === '가상계좌' && (
                <div className="virtual-account-details">
                  <div className="form-group form-group-vertical">
                    <label>입금은행</label>
                    <select
                      value={depositBank}
                      onChange={(e) => onDepositBankChange(e.target.value)}
                    >
                      <option value="">은행 선택</option>
                      <option value="003">기업은행</option>
                      <option value="004">국민은행</option>
                      <option value="011">농협중앙회</option>
                      <option value="020">우리은행</option>
                      <option value="023">SC은행</option>
                      <option value="031">대구은행</option>
                      <option value="032">부산은행</option>
                      <option value="034">광주은행</option>
                      <option value="037">전북은행</option>
                      <option value="039">경남은행</option>
                      <option value="071">우체국</option>
                      <option value="081">하나은행</option>
                      <option value="088">신한은행</option>
                      <option value="089">케이뱅크</option>
                    </select>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                      ※ 가상계좌는 결제하기 버튼을 클릭하시면 발급되며, 발급된 계좌번호는 문자로 발송됩니다.
                    </p>
                  </div>
                </div>
              )}

              {/* 수기카드 상세 정보 - 간소화 버전 */}
              {paymentSubMethod === '수기카드' && (
                <div className="manual-card-details">
                  <div className="form-group form-group-vertical">
                    <label>카드구분</label>
                    <div className="card-type-buttons">
                      <button
                        type="button"
                        className={`card-type-btn ${cardType === '본인카드' ? 'selected' : ''}`}
                        onClick={() => onCardTypeChange('본인카드')}
                      >
                        본인카드
                      </button>
                      <button
                        type="button"
                        className={`card-type-btn ${cardType === '기타카드' ? 'selected' : ''}`}
                        onClick={() => onCardTypeChange('기타카드')}
                      >
                        기타카드
                      </button>
                    </div>
                  </div>
                  <div className="form-group form-group-vertical">
                    <label>카드종류</label>
                    <select
                      value={cardCategory}
                      onChange={(e) => onCardCategoryChange(e.target.value)}
                    >
                      <option value="">선택</option>
                      <option value="01">BC</option>
                      <option value="02">VISA</option>
                      <option value="03">LG</option>
                      <option value="04">국민</option>
                      <option value="05">다이너스</option>
                      <option value="06">삼성</option>
                      <option value="07">신한</option>
                      <option value="08">외환</option>
                      <option value="09">아멕스</option>
                      <option value="10">현대</option>
                      <option value="11">롯데</option>
                      <option value="12">한미</option>
                      <option value="13">씨티</option>
                      <option value="15">NH농협</option>
                    </select>
                  </div>
                  <div className="form-group form-group-vertical">
                    <label>카드번호</label>
                    <div className="card-number-inputs">
                      <input
                        type="text"
                        value={cardNumber1}
                        onChange={(e) => onCardNumberChange(1, e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        placeholder="0000"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={cardNumber2}
                        onChange={(e) => onCardNumberChange(2, e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        placeholder="0000"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={cardNumber3}
                        onChange={(e) => onCardNumberChange(3, e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        placeholder="0000"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={cardNumber4}
                        onChange={(e) => onCardNumberChange(4, e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        placeholder="0000"
                      />
                    </div>
                  </div>
                  <div className="form-group form-group-vertical">
                    <label>유효기간</label>
                    <div className="date-inputs">
                      <select
                        value={cardExpiryMonth}
                        onChange={(e) => onCardExpiryChange(e.target.value, cardExpiryYear)}
                      >
                        <option value="">선택</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={String(m).padStart(2, '0')}>{m}월</option>
                        ))}
                      </select>
                      <select
                        value={cardExpiryYear.length === 4 ? cardExpiryYear.slice(-2) : cardExpiryYear}
                        onChange={(e) => onCardExpiryChange(cardExpiryMonth, e.target.value)}
                      >
                        <option value="">선택</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                          <option key={y} value={String(y).slice(-2)}>{y}년</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group form-group-vertical">
                    <label>소유자 이름</label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => onCardholderNameChange(e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <div className="form-group form-group-vertical">
                    <label>소유자 생년월일 6자리 또는 13자리 (법인은 사업자번호)</label>
                    <input
                      type="text"
                      value={cardholderResidentNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '');
                        onCardholderResidentNumberChange(value);
                      }}
                      placeholder=""
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* 네이버페이 전용 안내 */}
          {paymentMethod === '네이버페이' && (
            <div className="payment-naver-pay-notice">
              <h3>※ 네이버페이 안내</h3>
              <ul>
                <li>네이버페이는 네이버ID로 신용카드 또는 은행계좌 정보를 등록하여 결제할 수 있는 간편결제 서비스입니다.</li>
                <li><strong>계약자(또는 결제 담당자) 본인 명의의 네이버 계정으로 로그인한 후 결제해 주세요.</strong> 타인 명의 계정으로는 결제가 제한됩니다.</li>
                <li>주문 변경 시 카드사 혜택 및 할부 적용 여부는 해당 카드사 정책에 따라 변경될 수 있습니다.</li>
                <li>지원 가능 결제수단 : 네이버페이 결제창 내 노출되는 모든 카드/계좌</li>
                <li>네이버페이 결제 시 네이버 로그인 후 결제가 진행됩니다.</li>
              </ul>
            </div>
          )}

          {/* 카카오페이 전용 안내 */}
          {paymentMethod === '카카오페이' && (
            <div className="payment-naver-pay-notice">
              <h3>※ 카카오페이 안내</h3>
              <ul>
                <li>카카오페이는 카카오톡으로 신용카드 또는 은행계좌 정보를 등록하여 결제할 수 있는 간편결제 서비스입니다.</li>
                <li>주문 변경 시 카드사 혜택 및 할부 적용 여부는 해당 카드사 정책에 따라 변경될 수 있습니다.</li>
                <li>지원 가능 결제수단 : 카카오페이 결제창 내 노출되는 모든 카드/계좌/카카오머니</li>
                <li>카카오페이 결제 시 카카오톡 인증 후 결제가 진행됩니다.</li>
              </ul>
            </div>
          )}

          {/* 참고사항 */}
          <div className="payment-notes-section">
            <h3>※참고하세요</h3>
            <ul>
              <li>여행보험료는 세법관련 규정에 따라 현금영수증 발급 대상이 아닙니다.</li>
              <li>신용카드 실시간 결제가 안되는 경우 수기카드 결제를 선택하여 결제하시기 바랍니다.</li>
              <li>가상계좌는 고객님 전용 보험료 입금계좌입니다. 먼저 입금은행을 선택하시고 결제하기를 선택하시면 고객님 전용 가상계좌가 생성되고 계좌번호를 문자로 보내드립니다.
              (단, 보험료가 1만원이 넘는 경우에 한합니다.)</li>
              <li>고객님 전용 가상계좌가 생성되지 않는 경우에는 보험료 입금 전용계좌(우리은행:1005-604-481542 또는 농협:301-0337-8596-01)로 입금해주시기 바랍니다. [예금주 ㈜빨주노초파남보]</li>
              <li>입금전용계좌 이용 시 고객센터 영업시간 내에만 입금확인이 가능합니다. 또한 입금영수증 발급은 불가능(입금영수증이 필요한 경우에는 가상계좌를 선택)하며 이체확인증이나 가입증명서로 대체 바랍니다.
              회계와 관련하여 회사의 은행계좌 사본 또는 사업자등록증이 필요한 경우 고객센터로 요청하시기 바랍니다.</li>
            </ul>
          </div>

          {/* 결제하기 버튼 */}
          <button
            type="button"
            className="payment-submit-btn"
            onClick={() => {
              // 무통장입금 선택 시 입금예정일 검증
              if (paymentMethod === '기타결제' && paymentSubMethod === '무통장입금') {
                if (!validateExpectedDepositDate(expectedDepositYear, expectedDepositMonth, expectedDepositDay)) {
                  return;
                }
              }
              onSubmit();
            }}
          >
            결제하기
          </button>
        </div>
      </div>
    </section>
  );
}

