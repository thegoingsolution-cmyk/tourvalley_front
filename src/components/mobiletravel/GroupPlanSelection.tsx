'use client';

import React, { useState, useEffect } from 'react';
import { PlanType, PlanInfo } from '../travel/types';

interface GroupPlanSelectionProps {
  planInfo: Record<string, PlanInfo>;
  selectedPlan: PlanType | null;
  onPlanSelect: (plan: PlanType) => void;
  hasMedicalExpense: boolean;
  onMedicalExpenseChange: (value: boolean) => void;
  insuranceType?: string;
  contractBreakdownText?: string;
  onContractDetailClick?: (planType: PlanType) => void;
  onContractBreakdownClick?: (planType: PlanType) => void;
  // 해외장기체류보험용 props
  currencyPlan?: '원화' | '외화';
  onCurrencyPlanChange?: (plan: '원화' | '외화') => void;
  travelCountry?: string;
  travelPurpose?: string; // 여행목적 (워킹홀리데이인 경우 통화 플랜 선택 숨김)
  hideMedicalExpenseOption?: boolean; // 국내실손의료비 보장 옵션 숨김 여부
  /** 단체: 카드 키(실속/표준/고급)에 대해 버킷 내 plan_type이 하나일 때 배지에 실제 DB 플랜명 */
  groupTierDbPlanLabels?: Partial<Record<PlanType, string>>;
}

const STANDARD_PLAN_LABELS = ['실속플랜', '표준플랜', '고급플랜'] as const;
const buildDisplayPlanEntries = (planInfo: Record<string, PlanInfo>) => {
  const entries = Object.entries(planInfo);
  if (entries.length === 0) return [];

  const sortedByPremium = [...entries].sort((a, b) => (a[1].premium || 0) - (b[1].premium || 0));
  if (sortedByPremium.length <= 3) {
    return sortedByPremium.map(([planType, plan], index) => ({
      planType,
      plan,
      displayName: STANDARD_PLAN_LABELS[Math.min(index, STANDARD_PLAN_LABELS.length - 1)],
      sortTier: index,
    }));
  }

  const lowest = sortedByPremium[0];
  const highest = sortedByPremium[sortedByPremium.length - 1];
  const middle = sortedByPremium[Math.floor(sortedByPremium.length / 2)];

  const unique = [lowest, middle, highest].filter((entry, index, array) => {
    return array.findIndex((check) => check[0] === entry[0]) === index;
  });

  return unique.map(([planType, plan], index) => ({
    planType,
    plan,
    displayName: STANDARD_PLAN_LABELS[Math.min(index, STANDARD_PLAN_LABELS.length - 1)],
    sortTier: index,
  }));
};

export default function GroupPlanSelection({
  planInfo,
  selectedPlan,
  onPlanSelect,
  hasMedicalExpense,
  onMedicalExpenseChange,
  insuranceType,
  contractBreakdownText,
  onContractDetailClick,
  onContractBreakdownClick,
  currencyPlan,
  onCurrencyPlanChange,
  travelCountry,
  travelPurpose,
  hideMedicalExpenseOption = false,
  groupTierDbPlanLabels,
}: GroupPlanSelectionProps) {
  const [exchangeRate, setExchangeRate] = useState<{ rate: number; date: string; currency: string } | null>(null);
  const [supportedCurrency, setSupportedCurrency] = useState<'USD' | 'EUR'>('USD');
  const isLongTermStay = insuranceType === '해외장기체류보험';
  const currentCurrencyPlan = currencyPlan || '외화';
  const isWorkingHoliday = travelPurpose === '워킹홀리데이';

  useEffect(() => {
    if (isLongTermStay && currentCurrencyPlan === '외화') {
      const fetchExchangeRate = async () => {
        try {
          if (isWorkingHoliday) {
            const eurResponse = await fetch('/api/travel/exchange-rate?currency=EUR');
            const eurData = await eurResponse.json();

            if (eurData.success) {
              setSupportedCurrency('EUR');
              setExchangeRate({
                rate: eurData.exchangeRate,
                date: eurData.rateDate,
                currency: 'EUR',
              });
            }
          } else {
            const usdResponse = await fetch('/api/travel/exchange-rate?currency=USD');
            const usdData = await usdResponse.json();

            if (usdData.success) {
              setExchangeRate({
                rate: usdData.exchangeRate,
                date: usdData.rateDate,
                currency: 'USD',
              });
              setSupportedCurrency('USD');

              const euroCountries = [
                '독일', '프랑스', '이탈리아', '스페인', '네덜란드', '벨기에', '그리스',
                '포르투갈', '오스트리아', '핀란드', '아일랜드', '룩셈부르크', '슬로바키아',
                '슬로베니아', '에스토니아', '라트비아', '리투아니아', '몰타', '키프로스'
              ];

              if (travelCountry && euroCountries.includes(travelCountry)) {
                const eurResponse = await fetch('/api/travel/exchange-rate?currency=EUR');
                const eurData = await eurResponse.json();

                if (eurData.success) {
                  setSupportedCurrency('EUR');
                  setExchangeRate({
                    rate: eurData.exchangeRate,
                    date: eurData.rateDate,
                    currency: 'EUR',
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('환율 정보 가져오기 오류:', error);
        }
      };

      fetchExchangeRate();
    }
  }, [isLongTermStay, currentCurrencyPlan, travelCountry, isWorkingHoliday]);

  const formatRateDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  return (
    <div className="plan-selection-card">
      {isLongTermStay && !isWorkingHoliday && (
        <div className="plan-selection-guide">
          <h2 className="guide-title">플랜선택 가이드</h2>
          <p className="guide-text">
            비자나 학교보험 웨이버를 신청하는 경우 외화(US$)플랜을 선택하시기 바랍니다.
          </p>

          <div className="currency-plan-tabs">
            <button
              className={`currency-tab ${currentCurrencyPlan === '원화' ? 'active' : ''}`}
              onClick={() => onCurrencyPlanChange?.('원화')}
            >
              원화플랜
            </button>
            <button
              className={`currency-tab ${currentCurrencyPlan === '외화' ? 'active' : ''}`}
              onClick={() => onCurrencyPlanChange?.('외화')}
            >
              외화플랜({supportedCurrency === 'EUR' ? 'EUR' : 'USD'})
            </button>
          </div>
        </div>
      )}

      {isLongTermStay && !isWorkingHoliday && currentCurrencyPlan === '외화' && exchangeRate && (
        <div className="exchange-rate-info">
          <span className="rate-icon">▶</span>
          <span className="rate-text">
            {formatRateDate(exchangeRate.date)} KEB 1차고시 적용환율 {exchangeRate.rate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원(Currency: {exchangeRate.currency}$)
          </span>
        </div>
      )}

      {!isLongTermStay && !hideMedicalExpenseOption && (
        <div className="medical-expense-option">
          <div className="medical-expense-header">
            <span className="question-icon">?</span>
            <span className="medical-expense-label">국내실손의료비 보장</span>
          </div>
          <div className="medical-expense-toggle">
            <button
              className={`toggle-btn ${hasMedicalExpense ? 'active' : ''}`}
              onClick={() => onMedicalExpenseChange(true)}
            >
              포함
            </button>
            <button
              className={`toggle-btn ${!hasMedicalExpense ? 'active' : ''}`}
              onClick={() => onMedicalExpenseChange(false)}
            >
              제외
            </button>
          </div>
        </div>
      )}

      <div className="plans-container">
        {buildDisplayPlanEntries(planInfo)
          .sort((a, b) => a.sortTier - b.sortTier)
          .map(({ planType, plan, displayName: tierDisplayName }) => {
            const badgeLabel = groupTierDbPlanLabels?.[planType as PlanType] ?? tierDisplayName;
            const planBadgeColors: Record<string, string> = {
              '실속플랜': '#f65b64',
              '표준플랜': '#377af6',
              '고급플랜': '#2cc5ca',
              '어린이플랜': '#377af6',
              '어르신플랜1': '#377af6',
              '어르신플랜1(실속)': '#f65b64',
              '어르신플랜1(표준)': '#377af6',
              '어르신플랜2': '#377af6',
              '워킹홀리데이실속플랜': '#f65b64',
              '워킹홀리데이표준플랜': '#377af6',
              '워킹홀리데이(유로화플랜)': '#2cc5ca',
            };

            const getBadgeClass = (type: string) => {
              if (type === '실속플랜' || type === '어린이플랜' || type === '어르신플랜1' || type === '어르신플랜1(실속)' || type === '워킹홀리데이실속플랜') {
                return 'plan-badge-economy';
              }
              return 'plan-badge-high';
            };

            const getBadgeColor = (type: string) => {
              return planBadgeColors[type] || '#999';
            };

            const styleKey =
              planBadgeColors[badgeLabel] !== undefined ? badgeLabel : tierDisplayName;

            return (
              <div 
                key={planType}
                className={`plan-card ${selectedPlan === planType ? 'selected' : ''}`}
                onClick={() => onPlanSelect(planType as PlanType)}
              >
                <div className="plan-header-row">
                  <div
                    className={`plan-badge ${getBadgeClass(styleKey)}`}
                    style={{
                      background: getBadgeColor(styleKey),
                      color: '#fff'
                    }}
                  >
                    {badgeLabel}
                  </div>
                  <div className="plan-price">{plan.premium.toLocaleString()}원</div>
                </div>
                {contractBreakdownText && (
                  <div
                    className="contract-breakdown"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      textAlign: 'left',
                      backgroundColor: '#f2f2f2',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      marginTop: '6px',
                      marginBottom: '16px',
                      gap: '8px',
                    }}
                  >
                    <span style={{ flex: 1, textAlign: 'center' }}>{contractBreakdownText}</span>
                    {onContractBreakdownClick && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onContractBreakdownClick(planType as PlanType);
                        }}
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cfcfcf',
                          background: '#fff',
                          color: '#333',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        상세보기
                      </button>
                    )}
                  </div>
                )}
                <div className="plan-coverages">
                  {plan.coverages.map((coverage, idx) => (
                    <div key={idx} className="coverage-item">
                      <span className="coverage-label">{coverage.label}</span>
                      <span className="coverage-amount">{coverage.amount}</span>
                    </div>
                  ))}
                </div>
                {onContractDetailClick && (
                  <a
                    href="#"
                    className="coverage-detail-link"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onContractDetailClick(planType as PlanType);
                    }}
                  >
                    보장 상세보기 &gt;
                  </a>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
