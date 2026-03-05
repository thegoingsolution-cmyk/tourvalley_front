'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 동적 페이지로 설정
export const dynamic = 'force-dynamic';

interface Participant {
  sequence: number;
  gender: string;
  birth_date: string;
  age: number;
  planType: string;
  premium: number;
}

interface EstimateData {
  request_number: string;
  product_cd: string;
  insurance_type: string;
  start_date: string;
  start_hour: string;
  end_date: string;
  end_hour: string;
  tour_num: number;
  contractor_name: string;
  participants: Participant[];
  total_premium: number;
  created_at: string;
}

interface CoverageItem {
  label: string;
  amount: string;
  note?: string;
}

interface CoverageSection {
  title: string;
  items: CoverageItem[];
}

interface PlanCoverage {
  planName: string;
  sections: CoverageSection[];
}

function EstimatePrintContent() {
  const searchParams = useSearchParams();
  const requestNumber = searchParams.get('request');
  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planCoverages, setPlanCoverages] = useState<PlanCoverage[]>([]);
  const [planCoverageLoading, setPlanCoverageLoading] = useState(false);
  const [planCoverageError, setPlanCoverageError] = useState<string | null>(null);
  const printTriggeredRef = useRef(false);

  useEffect(() => {
    if (!requestNumber) {
      setError('견적 번호가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchEstimate = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/estimate/${requestNumber}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.message || '견적서를 불러올 수 없습니다.');
          return;
        }

        setEstimateData(result.data);
      } catch (err) {
        console.error('견적서 조회 오류:', err);
        setError('견적서를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [requestNumber]);

  useEffect(() => {
    if (printTriggeredRef.current) return;
    if (loading || !estimateData) return;

    // 플랜별 보장내용 로딩이 끝난 뒤 인쇄 (가능하면 보장내용까지 포함해서 인쇄)
    if (planCoverageLoading) return;

    printTriggeredRef.current = true;
    window.print();
  }, [loading, estimateData, planCoverageLoading]);

  // 플랜별 보장내용 조회 (견적에 포함된 모든 플랜)
  useEffect(() => {
    if (!estimateData) return;
    if (planCoverageLoading) return;
    if (planCoverages.length > 0 || planCoverageError) return;

    const uniquePlanTypes = Array.from(
      new Set(
        estimateData.participants
          .map((p) => p.planType)
          .filter((p): p is string => Boolean(p))
      )
    );
    if (uniquePlanTypes.length === 0) return;

    const fetchCoverages = async () => {
      try {
        setPlanCoverageLoading(true);
        setPlanCoverageError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const results = await Promise.all(
          uniquePlanTypes.map(async (planType) => {
            try {
              const planVariant =
                estimateData.insurance_type === '국내여행보험' ? 'B' : null;

              const res = await fetch(`${apiUrl}/api/travel/coverage-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  insurance_type: estimateData.insurance_type,
                  plan_type: planType,
                  is_medical_expense: true,
                  currency_plan: null,
                  plan_variant: planVariant,
                }),
              });
              const json = await res.json();
              if (res.ok && json.success && Array.isArray(json.sections)) {
                return {
                  planName: json.planName || planType,
                  sections: json.sections as CoverageSection[],
                } as PlanCoverage;
              }
            } catch (e) {
              console.error('모바일 플랜 보장내용 조회 오류:', planType, e);
            }
            return null;
          })
        );

        const valid = results.filter((c): c is PlanCoverage => c !== null);
        if (valid.length === 0) {
          setPlanCoverageError('보장내용을 불러올 수 없습니다.');
        } else {
          setPlanCoverages(valid);
        }
      } finally {
        setPlanCoverageLoading(false);
      }
    };

    fetchCoverages();
  }, [estimateData, planCoverageLoading, planCoverages.length, planCoverageError]);

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <p>견적서를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !estimateData) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <p>{error || '견적서를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  // 견적일자 포맷팅
  const formatEstimateDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // 보험기간 포맷팅
  const formatInsurancePeriod = () => {
    const startDate = estimateData.start_date.replace(/-/g, '.');
    const endDate = estimateData.end_date.replace(/-/g, '.');
    return `${startDate} ${estimateData.start_hour}시 ~ ${endDate} ${estimateData.end_hour}시`;
  };

  // 보험료 포맷팅
  const formatPremium = (premium: number): string => {
    if (premium === 0) return '0원';
    return `${premium.toLocaleString()}원`;
  };

  // PC 버전과 동일한 구조로 작성 필요
  // 현재는 기본 구조만 제공
  const estimateDate = formatEstimateDate(estimateData.created_at);
  const insurancePeriod = formatInsurancePeriod();

  return (
    <div className="estimate-print-mobile">
      <div style={{ padding: '20px' }}>
        <h1>투어밸리 여행자보험 견적서</h1>
        <p>견적일자: {estimateDate}</p>
        <p>보험종류: {estimateData.insurance_type}</p>
        <p>고객명: {estimateData.contractor_name}</p>
        <p>보험기간: {insurancePeriod}</p>
        <p>인원: {estimateData.tour_num}명</p>
        <p>합계보험료: {formatPremium(estimateData.total_premium)}</p>

        {/* 플랜별 보장내용 (모바일용 간단 버전) */}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>플랜별 보장내용</h2>

          {planCoverageLoading && (
            <p style={{ fontSize: '14px', color: '#666' }}>보장내용을 불러오는 중입니다...</p>
          )}

          {planCoverageError && !planCoverageLoading && (
            <p style={{ fontSize: '14px', color: '#c00' }}>{planCoverageError}</p>
          )}

          {!planCoverageLoading &&
            !planCoverageError &&
            planCoverages.map((cov, idx) => (
              <div key={cov.planName} style={{ marginTop: idx > 0 ? '32px' : 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  가입플랜: {cov.planName}
                </h3>
                {cov.sections.map((section) => (
                  <div key={`${cov.planName}-${section.title}`} style={{ marginBottom: '10px' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        padding: '6px 0',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      {section.title}
                    </div>
                    {section.items.map((item) => (
                      <div
                        key={`${cov.planName}-${section.title}-${item.label}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: '8px', textAlign: 'left' }}>
                          {item.label}
                          {item.note ? ` ${item.note}` : ''}
                        </div>
                        <div style={{ minWidth: '90px', textAlign: 'right' }}>{item.amount}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function EstimatePrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>로딩 중...</div>}>
      <EstimatePrintContent />
    </Suspense>
  );
}
