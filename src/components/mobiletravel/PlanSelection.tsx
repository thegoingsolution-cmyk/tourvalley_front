'use client';

import React, { useState, useEffect } from 'react';
import { PlanType, PlanInfo } from '../travel/types';

interface MobilePlanSelectionProps {
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
}

export default function MobilePlanSelection({
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
}: MobilePlanSelectionProps) {
  const [exchangeRate, setExchangeRate] = useState<{ rate: number; date: string; currency: string } | null>(null);
  const [supportedCurrency, setSupportedCurrency] = useState<'USD' | 'EUR'>('USD');
  const isLongTermStay = insuranceType === '해외장기체류보험';
  const currentCurrencyPlan = currencyPlan || '외화';
  const isWorkingHoliday = travelPurpose === '워킹홀리데이'; // 워킹홀리데이 여부

  // 환율 정보 가져오기 (해외장기체류보험인 경우)
  useEffect(() => {
    if (isLongTermStay && currentCurrencyPlan === '외화') {
      const fetchExchangeRate = async () => {
        try {
          // 워킹홀리데이인 경우 EUR 환율 사용
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
            // 일반적인 경우: 먼저 USD 환율 조회
            const usdResponse = await fetch('/api/travel/exchange-rate?currency=USD');
            const usdData = await usdResponse.json();
            
            if (usdData.success) {
              setExchangeRate({
                rate: usdData.exchangeRate,
                date: usdData.rateDate,
                currency: 'USD',
              });
              setSupportedCurrency('USD');
              
              // EUR 지원 여부 확인 (유로 사용 국가인 경우)
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

  // 환율 날짜 포맷팅 (YYYY-MM-DD -> M월 D일)
  const formatRateDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  return (
    <div className="plan-selection-card">
      {/* 해외장기체류보험: 플랜선택 가이드 (워킹홀리데이 제외) */}
      {isLongTermStay && !isWorkingHoliday && (
        <div className="plan-selection-guide">
          <h2 className="guide-title">플랜선택 가이드</h2>
          <p className="guide-text">
            비자나 학교보험 웨이버를 신청하는 경우 외화(US$)플랜을 선택하시기 바랍니다.
          </p>
          
          {/* 원화/외화 플랜 탭 */}
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
      
      {/* 환율 정보 (외화 플랜 선택 시 - 워킹홀리데이 제외) */}
      {isLongTermStay && !isWorkingHoliday && currentCurrencyPlan === '외화' && exchangeRate && (
        <div className="exchange-rate-info">
          <span className="rate-icon">▶</span>
          <span className="rate-text">
            {formatRateDate(exchangeRate.date)} KEB 1차고시 적용환율 {exchangeRate.rate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원(Currency: {exchangeRate.currency}$)
          </span>
        </div>
      )}
      {/* 국내실손의료비 보장 옵션 (해외장기체류보험 제외, hideMedicalExpenseOption이 false일 때만 표시) */}
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

      {/* 플랜 선택 영역 */}
      <div className="plans-container">
        {(() => {
          // 플랜 표시 순서 정의: 국내여행보험과 해외장기체류보험은 실속플랜 먼저, 해외여행보험은 표준플랜 먼저
          const planDisplayOrder: PlanType[] = insuranceType === '국내여행자보험' || insuranceType === '국내여행보험' || insuranceType === '해외장기체류보험'
            ? ['실속플랜', '표준플랜', '고급플랜', '어린이플랜', '어르신플랜1', '어르신플랜2']
            : ['표준플랜', '실속플랜', '고급플랜', '어린이플랜', '어르신플랜1', '어르신플랜2'];
          
          // planInfo에서 순서대로 정렬된 플랜 목록 생성
          const sortedPlans = planDisplayOrder
            .filter(planType => planInfo[planType])
            .map(planType => [planType, planInfo[planType]] as [string, PlanInfo]);
          
          // 순서에 없는 플랜들도 추가 (어린이플랜, 어르신플랜 등)
          const otherPlans = Object.entries(planInfo)
            .filter(([planType]) => !planDisplayOrder.includes(planType as PlanType));
          
          return [...sortedPlans, ...otherPlans];
        })().map(([planType, plan]) => {
          // 플랜 표시 이름 매핑 (백엔드에서 받아올 수 있도록 확장 가능)
          const planDisplayNames: Record<string, string> = {
            '실속플랜': '실속플랜',
            '표준플랜': '표준플랜',
            '고급플랜': '고급플랜',
            '어린이플랜': '어린이플랜',
            '어르신플랜1': '어르신플랜1',
            '어르신플랜2': '어르신플랜2',
          };

          // 플랜별 배지 색상 매핑
          const planBadgeColors: Record<string, string> = {
            '실속플랜': '#f65b64',
            '표준플랜': '#377af6',
            '고급플랜': '#2cc5ca',
            '어린이플랜': '#377af6', // 실속플랜과 동일
            '어르신플랜1': '#377af6', // 실속플랜과 동일
            '어르신플랜2': '#377af6', // 실속플랜과 동일
          };

          // 플랜 배지 스타일 결정
          const getBadgeClass = (type: string) => {
            if (type === '실속플랜' || type === '어린이플랜' || type === '어르신플랜1') {
              return 'plan-badge-economy';
            }
            return 'plan-badge-high';
          };

          // 플랜 표시 이름 결정
          const getDisplayName = (type: string) => {
            return planDisplayNames[type] || type;
          };

          // 플랜 배지 색상 결정
          const getBadgeColor = (type: string) => {
            return planBadgeColors[type] || '#999';
          };

          return (
            <div 
              key={planType}
              className={`plan-card ${selectedPlan === planType ? 'selected' : ''}`}
              onClick={() => onPlanSelect(planType as PlanType)}
            >
              <div className="plan-header-row">
                <div 
                  className={`plan-badge ${getBadgeClass(planType)}`}
                  style={{ 
                    background: getBadgeColor(planType),
                    color: '#fff'
                  }}
                >
                  {getDisplayName(planType)}
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

