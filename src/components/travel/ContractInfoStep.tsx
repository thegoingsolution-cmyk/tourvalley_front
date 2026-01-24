'use client';

import React, { useState } from 'react';
import StepIndicator from './StepIndicator';
import { Participant, CalculatedPremiums } from './types';
import AccidentFreeCashModal from './AccidentFreeCashModal';

interface ContractInfoStepProps {
  insuranceType: string;
  insuranceCompany?: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  travelPurpose: string;
  travelCountry?: string; // 해외여행보험용 여행국가
  participants: Participant[];
  calculatedPremiums: CalculatedPremiums | null;
  hasMedicalExpense: boolean;
  receiptPremium: number;
  useAccidentFreeCash: number;
  accidentFreeCash: number;
  contractConfirmed: boolean;
  onUseAccidentFreeCashChange: (value: number) => void;
  onReceiptPremiumChange: (value: number) => void;
  onContractConfirmedChange: (confirmed: boolean) => void;
  onShowPayment: () => void;
  companyName?: string; // 법인단체명 (단체 보험인 경우)
}

export default function ContractInfoStep({
  insuranceType,
  insuranceCompany = '라이나손해',
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  travelPurpose,
  travelCountry,
  participants,
  calculatedPremiums,
  hasMedicalExpense,
  receiptPremium,
  useAccidentFreeCash,
  accidentFreeCash,
  contractConfirmed,
  onUseAccidentFreeCashChange,
  onReceiptPremiumChange,
  onContractConfirmedChange,
  onShowPayment,
  companyName,
}: ContractInfoStepProps) {
  const [isAccidentFreeCashModalOpen, setIsAccidentFreeCashModalOpen] = useState(false);

  const periodDays = Math.ceil(
    (new Date(`${arrivalDate}T${arrivalTime}:00:00`).getTime() - 
     new Date(`${departureDate}T${departureTime}:00:00`).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  const handleUseCashChange = (value: number) => {
    const maxValue = Math.min(accidentFreeCash, calculatedPremiums?.totalPremium || 0);
    const finalValue = Math.max(0, Math.min(maxValue, value));
    onUseAccidentFreeCashChange(finalValue);
    onReceiptPremiumChange((calculatedPremiums?.totalPremium || 0) - finalValue);
  };

  const handleUseAllCash = () => {
    const maxValue = Math.min(accidentFreeCash, calculatedPremiums?.totalPremium || 0);
    onUseAccidentFreeCashChange(maxValue);
    onReceiptPremiumChange((calculatedPremiums?.totalPremium || 0) - maxValue);
  };

  const formatResidentNumber = (birthDate: string, gender: '남자' | '여자') => {
    if (!birthDate || birthDate.length !== 8) return '';
    // YYYYMMDD 형식에서 뒤 6자리 추출 (YYMMDD)
    const yearMonthDay = birthDate.substring(2, 8);
    // 성별 코드: 남자 = 1, 여자 = 2
    const genderCode = gender === '남자' ? '1' : '2';
    return `${yearMonthDay}-${genderCode}******`;
  };

  const handleContractConfirm = (checked: boolean) => {
    onContractConfirmedChange(checked);
    if (checked) {
      setTimeout(() => {
        onShowPayment();
        // PaymentStep으로 스크롤
        setTimeout(() => {
          const paymentSection = document.querySelector('.payment-methods-section');
          if (paymentSection) {
            paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }, 100);
    }
  };

  return (
    <>
    <section className={`form-section ${contractConfirmed ? 'has-payment-step' : ''}`}>
      <div className="form-container">
        <div className="form-card contract-form-card">
          <div className="form-header">
            {/* <h1 className="form-title">{insuranceType}</h1> */}
            <h1 className="form-title"></h1>
            <StepIndicator currentStep={3} />
          </div>

          <div className="step3-section">
            <div className="step3-header">
              <h2 className="step3-title">계약정보</h2>
              <button
                type="button"
                className="print-btn"
                onClick={() => {
                  const printContent = document.querySelector('.contract-info-grid')?.parentElement;
                  if (!printContent) return;
                  
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>계약정보</title>
                        <style>
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            padding: 20px;
                            margin: 0;
                          }
                          .contract-info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 16px;
                          }
                          .contract-info-item {
                            padding: 12px;
                            border-bottom: 1px solid #e0e0e0;
                          }
                          .contract-info-item label {
                            display: block;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #333;
                          }
                          .contract-info-item div {
                            color: #666;
                          }
                          .contract-info-item-divider {
                            border-top: 2px solid #333;
                            padding-top: 16px;
                            margin-top: 8px;
                          }
                          .contract-info-item-divider label {
                            font-size: 18px;
                          }
                          .contract-info-item-divider div {
                            font-size: 18px;
                            font-weight: 700;
                            color: #333;
                          }
                          .participant-info-details div {
                            margin-bottom: 4px;
                          }
                          .participant-detail-link {
                            display: none;
                          }
                          @media print {
                            body { margin: 0; padding: 10px; }
                          }
                        </style>
                      </head>
                      <body>
                        <h2 style="margin-bottom: 20px; font-size: 24px; font-weight: 700;">계약정보</h2>
                        ${printContent.querySelector('.contract-info-grid')?.outerHTML || ''}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  setTimeout(() => {
                    printWindow.print();
                  }, 250);
                }}
              >
                <span className="Print_ico"></span>
                인쇄
              </button>
            </div>
            <div className="step3-header-divider"></div>

            <div className="contract-info-grid">
              <div className="contract-info-item">
                <label>보험종목/상품명</label>
                <div>{insuranceCompany} {insuranceType}</div>
              </div>
              <div className="contract-info-item">
                <label>보험기간</label>
                <div>
                  {new Date(departureDate).toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                  }).replace(/\./g, '.').replace(/\s/g, '')} {departureTime}시
                  ~
                  {new Date(arrivalDate).toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                  }).replace(/\./g, '.').replace(/\s/g, '')} {arrivalTime}시
                  ({periodDays}일)
                </div>
              </div>
              <div className="contract-info-item">
                <label>여행지/여행목적</label>
                <div>
                  {travelCountry && travelCountry.trim() 
                    ? `${travelCountry}/${travelPurpose}`
                    : travelPurpose
                  }
                </div>
              </div>
              <div className="contract-info-item">
                <label>가입인원</label>
                <div>
                  <button
                    type="button"
                    className="participant-detail-link"
                    onClick={() => {
                      const data = {
                        participants: calculatedPremiums?.participants || [],
                        totalPremium: calculatedPremiums?.totalPremium || 0,
                        hasMedicalExpense: hasMedicalExpense,
                      };
                      localStorage.setItem('premiumDetailData', JSON.stringify(data));
                      window.open('/premium-detail', '_blank');
                    }}
                  >
                    자세히보기
                  </button>
                  {calculatedPremiums?.participants.length || participants.length || 0}명
                </div>
              </div>
              <div className="contract-info-item contract-info-item-divider">
                <label>합계 보험료</label>
                <div>{calculatedPremiums?.totalPremium.toLocaleString() || 0}원</div>
              </div>
              <div className="contract-info-item">
                <label>포괄계약자(취급자)</label>
                <div>(주)빨주노초파남보</div>
              </div>
              {companyName && (
                <div className="contract-info-item">
                  <label>법인단체명</label>
                  <div>{companyName}</div>
                </div>
              )}
              <div className="contract-info-item">
                <label>대표 가입자</label>
                <div className="participant-info-details">
                  <div>{participants[0]?.name || ''}</div>
                  <div>{participants[0]?.birthDate && participants[0]?.gender ? formatResidentNumber(participants[0].birthDate, participants[0].gender) : ''}</div>
                  <div>{participants[0]?.phone ? `${participants[0].phone.substring(0, 3)}-${participants[0].phone.substring(3, 7)}-${participants[0].phone.substring(7)}` : ''}</div>
                  <div>
                    {participants[0]?.email1 && participants[0]?.email2 
                      ? `${participants[0].email1}@${participants[0].email2 === '직접입력' ? (participants[0].customEmail || '') : participants[0].email2}`
                      : ''}
                  </div>
                </div>
              </div>
            </div>
            <div className="contract-info-grid-divider"></div>

            {/* 보험료 및 무사고캐시 */}
            <div className="premium-cash-section">
              <div className="premium-display">
                <span className="premium-label">보험료</span>
                <span className="premium-value">{calculatedPremiums?.totalPremium.toLocaleString() || 0}원</span>
              </div>
              <div className="accident-free-cash-section">
                <div className="accident-free-cash-label">
                  나의 무사고캐시 {accidentFreeCash.toLocaleString()}원
                  <span 
                    className="question-icon-small" 
                    onClick={() => setIsAccidentFreeCashModalOpen(true)}
                  >
                    ?
                  </span>
                </div>
                <div className="accident-free-cash-input">
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={useAccidentFreeCash}
                      onChange={(e) => handleUseCashChange(parseInt(e.target.value) || 0)}
                      min="0"
                      max={accidentFreeCash}
                    />
                    <span className="unit-text">원</span>
                  </div>
                  <button
                    type="button"
                    className="use-cash-btn"
                    onClick={handleUseAllCash}
                  >
                    사용
                  </button>
                </div>
              </div>
              <div className="payment-amount-section">
                <span className="payment-amount-label">결제금액</span>
                <span className="payment-amount-value">{receiptPremium.toLocaleString()}원</span>
              </div>
              {!travelCountry && (
                <div className="mobile-phone-warning">
                  ※이동통신단말기(휴대폰)은 보상되지 않습니다.
                </div>
              )}
              {!contractConfirmed && (
                <div className="contract-confirm-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={contractConfirmed}
                      onChange={(e) => handleContractConfirm(e.target.checked)}
                      className="checkbox-input"
                    />
                    위 내용을 확인하셨습니까?
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <AccidentFreeCashModal 
      isOpen={isAccidentFreeCashModalOpen}
      onClose={() => setIsAccidentFreeCashModalOpen(false)}
    />
    </>
  );
}

