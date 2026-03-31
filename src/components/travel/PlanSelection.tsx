'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlanType, PlanInfo } from './types';
import { isDomesticPlanCardSelected } from '@/utils/domesticPlanTier';

interface PlanSelectionProps {
  planInfo: Record<string, PlanInfo>;
  selectedPlan: PlanType | null;
  onPlanSelect: (plan: PlanType) => void;
  hasMedicalExpense: boolean;
  onMedicalExpenseChange: (value: boolean) => void;
  participantCount: 1 | 2;
  onParticipantCountChange: (count: 1 | 2) => void;
  onAddParticipant?: () => void;
  insuranceType?: string;
  onContractDetailClick?: (planType: PlanType) => void;
  // 해외장기체류보험용 props
  currencyPlan?: '원화' | '외화';
  onCurrencyPlanChange?: (plan: '원화' | '외화') => void;
  travelCountry?: string;
  travelPurpose?: string; // 여행목적 (워킹홀리데이인 경우 통화 플랜 선택 숨김)
}

export default function PlanSelection({
  planInfo,
  selectedPlan,
  onPlanSelect,
  hasMedicalExpense,
  onMedicalExpenseChange,
  participantCount,
  onParticipantCountChange,
  onAddParticipant,
  insuranceType,
  onContractDetailClick,
  currencyPlan,
  onCurrencyPlanChange,
  travelCountry,
  travelPurpose,
}: PlanSelectionProps) {
  const [exchangeRate, setExchangeRate] = useState<{ rate: number; date: string; currency: string } | null>(null);
  const [supportedCurrency, setSupportedCurrency] = useState<'USD' | 'EUR'>('USD');
  const [showMedicalExpenseNotice, setShowMedicalExpenseNotice] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isLongTermStay = insuranceType === '해외장기체류보험';
  const currentCurrencyPlan = currencyPlan || '원화';
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

  useEffect(() => {
    setIsClient(true);
  }, []);

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
              type="button"
              className={`currency-tab ${currentCurrencyPlan === '원화' ? 'active' : ''}`}
              onClick={() => onCurrencyPlanChange?.('원화')}
            >
              원화플랜
            </button>
            <button
              type="button"
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
      {/* 국내실손의료비 보장 옵션 (해외장기체류보험 제외) */}
      {!isLongTermStay && (
        <div className="medical-expense-option">
          <div className="medical-expense-header">
            <span
              className="question-icon"
              role="button"
              tabIndex={0}
              onClick={() => setShowMedicalExpenseNotice(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setShowMedicalExpenseNotice(true);
                }
              }}
            >
              ?
            </span>
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

      {showMedicalExpenseNotice && isClient && createPortal(
        <div
          className="medical-expense-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowMedicalExpenseNotice(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            id="commonLayerBody"
            className="tour2023_pcBox_Layer"
            style={{
              width: '30%',
              minWidth: '320px',
              maxWidth: '520px',
              background: '#fff',
              borderRadius: '8px',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tour2023_guide_Box prow_02">
              <div className="tour2023_guide_txt01">
                [ 실손의료보험 중복가입자 중복
                <br />
                보상 불가 (비례보상) ]
              </div>
              <div className="tour2023_guide_txt02">
                실손의료보험 가입자는
                <br />
                ‘국내실손의료비 보장’을 포함하셔도
                <br />
                중복 보상이 되지않습니다.
              </div>
              <div>
                <button
                  type="button"
                  className="btn_b tour2023_btn15_gray"
                  onClick={() => setShowMedicalExpenseNotice(false)}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 플랜 선택 영역 */}
      <div className="plans-container">
        {(() => {
          // 플랜 표시 순서 정의: 국내여행보험과 해외장기체류보험은 실속플랜 먼저, 해외여행보험은 표준플랜 먼저
          const planDisplayOrder: PlanType[] = insuranceType === '국내여행자보험' || insuranceType === '국내여행보험' || insuranceType === '해외장기체류보험'
            ? ['실속플랜', '표준플랜', '고급플랜', '어린이플랜', '어르신플랜1(실속)', '어르신플랜1(표준)', '어르신플랜1', '어르신플랜2', '워킹홀리데이실속플랜', '워킹홀리데이표준플랜', '워킹홀리데이(유로화플랜)']
            : ['표준플랜', '실속플랜', '고급플랜', '어린이플랜', '어르신플랜1(실속)', '어르신플랜1(표준)', '어르신플랜1', '어르신플랜2', '워킹홀리데이실속플랜', '워킹홀리데이표준플랜', '워킹홀리데이(유로화플랜)'];
          
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
            '어르신플랜1(실속)': '어르신플랜1(실속)',
            '어르신플랜1(표준)': '어르신플랜1(표준)',
            '어르신플랜2': '어르신플랜2',
            '워킹홀리데이실속플랜': '워킹홀리데이실속플랜',
            '워킹홀리데이표준플랜': '워킹홀리데이표준플랜',
            '워킹홀리데이(유로화플랜)': '워킹홀리데이(유로화플랜)',
          };

          // 플랜별 배지 색상 매핑
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

          // 플랜 배지 스타일 결정
          const getBadgeClass = (type: string) => {
            if (
              type === '실속플랜' ||
              type === '어린이플랜' ||
              type === '어르신플랜1' ||
              type === '어르신플랜1(실속)' ||
              type === '워킹홀리데이실속플랜'
            ) {
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
              className={`plan-card ${isDomesticPlanCardSelected(selectedPlan, planType, insuranceType) ? 'selected' : ''}`}
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
              <div className="plan-coverages">
                {plan.coverages.map((coverage, idx) => (
                  <div key={idx} className="coverage-item">
                    <span className="coverage-label">{coverage.label}</span>
                    <span className="coverage-amount">{coverage.amount}</span>
                  </div>
                ))}
              </div>
              <a 
                href="#" 
                className="coverage-detail-link"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (onContractDetailClick) {
                    onContractDetailClick(planType as PlanType);
                  }
                }}
              >
                보장 상세보기 &gt;
              </a>
            </div>
          );
        })}
      </div>

      {/* 가입 인원 선택 */}
      <div 
        className="participant-selection"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={`participant-btn ${participantCount === 2 ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onParticipantCountChange(2);
            onAddParticipant?.();
          }}
        >
          2인 이상 가입
        </button>
        <button
          type="button"
          className={`participant-btn primary ${participantCount === 1 ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onParticipantCountChange(1);
          }}
        >
          1인 가입
        </button>
      </div>

      <style jsx global>{`
        .medical-expense-modal-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        .medical-expense-modal-overlay .tour2023_pcBox_Layer {
          width: min(520px, 90vw);
          min-width: 320px;
          max-width: 520px;
          background: #fff;
          border-radius: 12px;
          padding: 32px 28px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tour2023_guide_Box {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
          width: 100%;
          border-radius: 13px;
          box-sizing: border-box;
          padding: 0;
        }

        .tour2023_guide_txt01 {
          font-family: 'NanumSquareNeoTTF-cBd';
          font-size: 17px;
          color: #ff4040;
          letter-spacing: -1.2px;
          line-height: 140%;
          padding: 0 0 14px 0;
          text-align: center;
        }

        .tour2023_guide_txt02 {
          font-family: 'NanumSquareNeoTTF-bRg';
          font-size: 15px;
          color: #3e3e3e;
          letter-spacing: -0.4px;
          line-height: 150%;
          padding: 0 0 22px 0;
          text-align: center;
        }

        .tour2023_btn15_gray {
          width: 120px;
          font-size: 16px;
          padding: 10px 0 11px;
          height: auto;
          background-color: #fe5700;
          border-radius: 8px;
          box-sizing: border-box;
          color: #fff;
          text-align: center;
          position: relative;
          display: inline-block;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

