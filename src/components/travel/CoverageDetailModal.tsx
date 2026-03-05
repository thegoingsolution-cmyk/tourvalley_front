'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PlanType } from './types';
import './CoverageDetailModal.css';

interface CoverageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: PlanType;
  insuranceType?: string; // 기본값: '국내여행보험'
  isMedicalExpense?: boolean; // 실손의료비 포함 여부 (기본값: true, 국내/해외여행보험용)
  currencyPlan?: '원화플랜' | '외화플랜'; // 원화플랜/외화플랜 구분 (유학/어학연수, 해외출장/주재원/교환교수용)
  planVariant?: 'A' | 'B' | null; // 플랜 변형. null이면 백엔드에서 plan_variant IS NULL 매칭
}

// 보장 상세 데이터 타입 정의
interface CoverageItem {
  label: string;
  amount: string;
  note?: string;
}

interface CoverageSection {
  title: string;
  helpUrl: string;
  items: CoverageItem[];
}

interface PlanCoverage {
  planName: string;
  sections: CoverageSection[];
}

type InsuranceType = '국내여행보험' | '해외여행보험' | '유학/어학연수' | '워킹홀리데이' | '해외출장/주재원/교환교수';

export default function CoverageDetailModal({
  isOpen,
  onClose,
  planType,
  insuranceType = '국내여행보험',
  isMedicalExpense = true, // 기본값: 실손
  currencyPlan, // 원화플랜/외화플랜 구분
  planVariant = 'B',
}: CoverageDetailModalProps) {
  if (!isOpen) return null;

  const insuranceTypeKey = insuranceType as InsuranceType;
  const [coverageData, setCoverageData] = useState<PlanCoverage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const confirmButtonStyle: React.CSSProperties = {
    fontFamily: 'NanumSquareNeoTTF-bRg',
    width: '100%',
    fontSize: '21px',
    letterSpacing: '-1px',
    paddingTop: '0',
    height: '60px',
    backgroundColor: '#fe5700',
    borderRadius: '7px',
    boxSizing: 'border-box',
    color: '#fff',
    textAlign: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    outline: 'none',
  };

  const requestPayload = useMemo(() => {
    return {
      insurance_type: insuranceTypeKey,
      plan_type: planType,
      is_medical_expense: isMedicalExpense,
      currency_plan: currencyPlan,
      plan_variant: planVariant,
    };
  }, [insuranceTypeKey, planType, isMedicalExpense, currencyPlan, planVariant]);

  useEffect(() => {
    let isMounted = true;

    const fetchCoverageDetail = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch('/api/travel/coverage-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        if (response.ok) {
          const data: { success: boolean; planName: string; sections: CoverageSection[] } = await response.json();
          if (data.success && isMounted) {
            setCoverageData({
              planName: data.planName,
              sections: data.sections,
            });
            return;
          }
        }

        if (isMounted) {
          setCoverageData({ planName: String(planType), sections: [] });
          setHasError(true);
        }
      } catch (error) {
        if (isMounted) {
          setCoverageData({ planName: String(planType), sections: [] });
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCoverageDetail();
    return () => {
      isMounted = false;
    };
  }, [requestPayload, insuranceTypeKey, planType, isMedicalExpense, currencyPlan]);

  return (
    <div className="coverage-detail-modal-overlay" onClick={onClose}>
      <div className="coverage-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="coverage-detail-modal-header">
          <h2 className="coverage-detail-modal-title">보장 상세보기</h2>
          <button
            className="coverage-detail-modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="coverage-detail-modal-body">
          <p className="tour2023_title04">{coverageData?.planName || planType}</p>
          <p className="tour2023_Line01"></p>

          {isLoading && (
            <p className="tour2023_txt12">보장 내용을 불러오는 중입니다...</p>
          )}

          {!isLoading && hasError && (
            <p className="tour2023_txt12">보장 내용을 불러오지 못했습니다.</p>
          )}

          {!isLoading && !hasError && coverageData?.sections.map((section, sectionIndex) => (
            <section key={sectionIndex}>
              <p className="tour2023_txt18">
                <span className="tour2023_blue">{section.title}</span>
                <a
                  href={section.helpUrl}
                  className="coverage-help-link"
                  onClick={(event) => {
                    event.preventDefault();
                    const popupWidth = 520;
                    const popupHeight = 720;
                    const left = Math.max(0, (window.screen.width - popupWidth) / 2);
                    const top = Math.max(0, (window.screen.height - popupHeight) / 2);
                    const features = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`;
                    window.open(section.helpUrl, 'coverageHelp', features);
                  }}
                  aria-label={`${section.title} 도움말`}
                >
                  <img
                    src="/images/icon_tip.png"
                    alt="도움말 보기"
                    className="icon_tip icon_tip01"
                  />
                </a>
              </p>
              
              {section.items.map((item, itemIndex) => (
                <ul key={itemIndex} className="tour2023_planLayer">
                  <li className="tour2023_txt16">
                    <span>{item.label}</span>
                    {item.note && (
                      <em className="tour2023_txt16_s"> {item.note}</em>
                    )}
                  </li>
                  <li className="tour2023_txt17">{item.amount}</li>
                </ul>
              ))}
            </section>
          ))}

          <div className="tourG_mat17 tourG_Wrap"></div>
        </div>
        <div className="coverage-detail-modal-footer">
          <button 
            className="tour2023_btn_b tour2023_btn07"
            style={confirmButtonStyle}
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
