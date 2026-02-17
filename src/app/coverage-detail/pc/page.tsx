'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './page.css';

interface CoverageItem {
  label: string;
  amount: string;
  note?: string;
}

interface CoverageSection {
  title: string;
  helpUrl: string | null;
  items: CoverageItem[];
}

interface CoverageDetailResponse {
  success: boolean;
  planName: string;
  sections: CoverageSection[];
}

type InsuranceType = '국내여행보험' | '해외여행보험' | '유학/어학연수' | '워킹홀리데이' | '해외출장/주재원/교환교수';

function PCCoverageDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planType = searchParams.get('planType') || '표준플랜';
  const hasMedicalExpense = searchParams.get('hasMedicalExpense') !== 'false';
  const insuranceType = (searchParams.get('insuranceType') as InsuranceType) || '국내여행보험';
  const currencyPlan = searchParams.get('currencyPlan') as '원화플랜' | '외화플랜' | undefined;

  const [data, setData] = useState<CoverageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch('/api/travel/coverage-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            insurance_type: insuranceType,
            plan_type: planType,
            is_medical_expense: hasMedicalExpense,
            currency_plan: currencyPlan || undefined,
            plan_variant: 'B',
          }),
        });

        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setData({
            success: json.success,
            planName: json.planName,
            sections: json.sections || [],
          });
        } else if (isMounted) {
          setError(true);
        }
      } catch {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [planType, hasMedicalExpense, insuranceType, currencyPlan]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
      return;
    }
    router.back();
  };

  return (
    <div className="domestic-page-pc">
      <div className="domestic-content-pc">
        <div className="form-section">
          <div className="form-container">
            <div className="form-card">
              <div className="modal-header">
                <h2 className="modal-title">보장 상세보기</h2>
                <button
                  className="modal-close-btn"
                  onClick={handleClose}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="coverage-plan-title">{data?.planName ?? planType}</div>

                {loading && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                    보장 내용을 불러오는 중입니다...
                  </div>
                )}

                {error && !loading && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#c00' }}>
                    보장 내용을 불러오지 못했습니다.
                  </div>
                )}

                {!loading && !error && data && data.sections && data.sections.length > 0 && data.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="coverage-section">
                    <div className="coverage-section-header">
                      {section.helpUrl ? (
                        <a
                          href={section.helpUrl}
                          className="coverage-section-icon"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${section.title} 도움말`}
                        >
                          ?
                        </a>
                      ) : (
                        <span className="coverage-section-icon">?</span>
                      )}
                      <h3 className="coverage-section-title">{section.title}</h3>
                    </div>
                    <div className="coverage-items">
                      {section.items.map((item, itemIndex) => (
                        <React.Fragment key={itemIndex}>
                          <div className="coverage-item-row">
                            <span className="coverage-item-name">{item.label}</span>
                            <span className="coverage-item-amount">{item.amount}</span>
                          </div>
                          {item.note && (
                            <div className="coverage-item-note">{item.note}</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="modal-footer">
                  <button
                    className="confirm-btn"
                    onClick={handleClose}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PCCoverageDetailPage() {
  return (
    <Suspense fallback={
      <div className="domestic-page-pc">
        <div className="domestic-content-pc" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>로딩 중...</div>
        </div>
      </div>
    }>
      <PCCoverageDetailContent />
    </Suspense>
  );
}
