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
  // 기타결제 선택 시 기본값으로 무통장입금 설정
  useEffect(() => {
    if (paymentMethod === '기타결제' && paymentSubMethod === null) {
      onPaymentSubMethodChange('무통장입금');
    }
  }, [paymentMethod, paymentSubMethod, onPaymentSubMethodChange]);

  // 무통장입금 선택 시 기본값으로 우리은행 설정
  useEffect(() => {
    if (paymentSubMethod === '무통장입금' && depositBank === '') {
      onDepositBankChange('우리은행');
    }
  }, [paymentSubMethod, depositBank, onDepositBankChange]);

  return (
    <section className={`form-section ${className || ''}`}>
      <div className="form-container">
        <div className="form-card">
          <div className="form-header">
            <h1 className="form-title">보험료 결제</h1>
          </div>

          {/* 결제 방법 선택 */}
          <div className="payment-methods-section">
            <div className="payment-method-option">
              <label htmlFor="nicepay" className="payment-method-label">
                <img 
                  src="/icons/payment-credit-card.png" 
                  alt="신용카드" 
                  className="payment-method-icon"
                />
                <span>신용카드</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="nicepay"
                  value="나이스페이먼츠"
                  checked={paymentMethod === '나이스페이먼츠'}
                  onChange={() => onPaymentMethodChange('나이스페이먼츠')}
                />
              </label>
            </div>
            <div className="payment-method-option">
              <label htmlFor="naverpay" className="payment-method-label">
                <img 
                  src="/icons/payment-naver-pay.png" 
                  alt="네이버페이" 
                  className="payment-method-icon"
                />
                <span>네이버페이</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="naverpay"
                  value="네이버페이"
                  checked={paymentMethod === '네이버페이'}
                  onChange={() => onPaymentMethodChange('네이버페이')}
                />
              </label>
            </div>
            <div className="payment-method-option">
              <label htmlFor="kakaopay" className="payment-method-label">
                <img 
                  src="/icons/payment-kakao-pay.png" 
                  alt="카카오페이" 
                  className="payment-method-icon"
                />
                <span>카카오페이</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="kakaopay"
                  value="카카오페이"
                  checked={paymentMethod === '카카오페이'}
                  onChange={() => onPaymentMethodChange('카카오페이')}
                />
              </label>
            </div>
            <div className="payment-method-option">
              <label htmlFor="other" className="payment-method-label">
                <img 
                  src="/icons/payment-other.png" 
                  alt="기타결제" 
                  className="payment-method-icon"
                />
                <span>기타결제</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="other"
                  value="기타결제"
                  checked={paymentMethod === '기타결제'}
                  onChange={() => {
                    onPaymentMethodChange('기타결제');
                    onPaymentSubMethodChange('무통장입금');
                  }}
                />
              </label>
            </div>
          </div>

          {/* 기타결제 세부 방법 */}
          {paymentMethod === '기타결제' && (
            <>
              <div className="payment-sub-methods-section">
                <button
                  type="button"
                  className={`payment-sub-method-btn ${paymentSubMethod === '무통장입금' ? 'selected' : ''}`}
                  onClick={() => onPaymentSubMethodChange('무통장입금')}
                >
                  <div className="payment-sub-method-btn-content">
                    <div className="payment-sub-method-btn-title">무통장입금</div>
                    <div className="payment-sub-method-btn-subtitle">(보험료입금 전용계좌)</div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`payment-sub-method-btn ${paymentSubMethod === '수기카드' ? 'selected' : ''}`}
                  onClick={() => onPaymentSubMethodChange('수기카드')}
                >
                  <div className="payment-sub-method-btn-content">
                    <div className="payment-sub-method-btn-title">수기카드</div>
                    <div className="payment-sub-method-btn-subtitle">(카드번호 입력결제)</div>
                  </div>
                </button>
              </div>

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
                        onChange={(e) => onExpectedDepositDateChange(Number(e.target.value), expectedDepositMonth, expectedDepositDay)}
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}년</option>
                        ))}
                      </select>
                      <select
                        value={expectedDepositMonth}
                        onChange={(e) => onExpectedDepositDateChange(expectedDepositYear, Number(e.target.value), expectedDepositDay)}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>{month}월</option>
                        ))}
                      </select>
                      <select
                        value={expectedDepositDay}
                        onChange={(e) => onExpectedDepositDateChange(expectedDepositYear, expectedDepositMonth, Number(e.target.value))}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}일</option>
                        ))}
                      </select>
                    </div>
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
                        value={cardExpiryYear}
                        onChange={(e) => onCardExpiryChange(cardExpiryMonth, e.target.value)}
                      >
                        <option value="">선택</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                          <option key={y} value={y}>{y}년</option>
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
                <li>주문 변경 시 카드사 혜택 및 할부 적용 여부는 해당 카드사 정책에 따라 변경될 수 있습니다.</li>
                <li>지원 가능 결제수단 : 네이버페이 결제창 내 노출되는 모든 카드/계좌</li>
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
            onClick={onSubmit}
          >
            결제하기
          </button>
        </div>
      </div>
    </section>
  );
}

