'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './page.css';

// 보장 상세 데이터 타입 정의
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

interface PlanCoverage {
  planName: string;
  sections: CoverageSection[];
}

type InsuranceType = '국내여행보험' | '해외여행보험' | '유학/어학연수' | '워킹홀리데이' | '해외출장/주재원/교환교수';
type PlanType = '실속플랜' | '표준플랜' | '고급플랜';

function MobileCoverageDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planTypeParam = searchParams.get('planType') || '표준플랜';
  const insuranceTypeParam = searchParams.get('insuranceType') || '국내여행보험';
  const returnUrlParam = searchParams.get('returnUrl');
  const returnUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : '/domestic/m';
  const isMedicalExpenseParam = searchParams.get('isMedicalExpense');
  const currencyPlanParam = searchParams.get('currencyPlan') as '원화플랜' | '외화플랜' | null;
  const planVariantParam = searchParams.get('planVariant');

  const insuranceType: InsuranceType = insuranceTypeParam === '해외여행자보험' ? '해외여행보험' : (insuranceTypeParam as InsuranceType);
  const planType = planTypeParam as PlanType;
  const planVariant = planVariantParam === 'null' || planVariantParam === '' ? null : (planVariantParam || 'B');
  const needsMedicalExpenseDistinction = insuranceType === '국내여행보험' || insuranceType === '해외여행보험';
  const openGuidePopup = (url: string) => {
    const w = 650;
    const h = 700;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);
    const features = `popup=yes,width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`;
    const popup = window.open('about:blank', 'guidePopup', features);
    if (!popup) {
      alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
      return;
    }
    popup.location.replace(url);
    popup.focus();
  };
  const needsCurrencyPlanDistinction = insuranceType === '유학/어학연수' || insuranceType === '해외출장/주재원/교환교수';

  const [coverageData, setCoverageData] = useState<PlanCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const isMedicalExpense = needsMedicalExpenseDistinction ? isMedicalExpenseParam !== 'false' : undefined;
    const currencyPlan = needsCurrencyPlanDistinction ? (currencyPlanParam || '원화플랜') : undefined;

    const fetchDetail = async () => {
      setLoading(true);
      setError(false);
      try {
        const body: Record<string, unknown> = {
          insurance_type: insuranceType,
          plan_type: planType,
          is_medical_expense: isMedicalExpense,
          currency_plan: currencyPlan,
        };
        if (planVariant !== null) body.plan_variant = planVariant;
        else body.plan_variant = null;

        const res = await fetch('/api/travel/coverage-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setCoverageData({
            planName: json.planName,
            sections: json.sections || [],
          });
        } else if (isMounted) {
          setError(true);
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [insuranceType, planType, planVariant, needsMedicalExpenseDistinction, needsCurrencyPlanDistinction, isMedicalExpenseParam, currencyPlanParam]);

  const handleConfirm = (e?: React.MouseEvent<HTMLAnchorElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // 팝업으로 열린 경우 창 닫기
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
      return;
    }
    // returnUrl이 있으면 해당 URL로 이동, 없으면 이전 페이지로
    if (returnUrl && returnUrl !== '/coverage-detail/m') {
      if (returnUrl.startsWith('/group-insurance/m')) {
        try {
          sessionStorage.setItem('groupInsuranceReturn', '1');
        } catch (error) {
          console.error('복귀 플래그 저장 오류:', error);
        }
      }
      router.push(returnUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="coverage-detail-mobile-page">
      <div className="prow_01">
        <div className="tourG_mat13">
          <header id="header">
            <div className="tour2023_header_inner tour2023_header_line">
              <span className="tourTop_title">보장 상세보기</span>
              <a className="close" href="javascript:void(0);" onClick={(e) => handleConfirm(e)}>닫기</a>
            </div>
          </header>

          {loading && (
            <p className="tour2023_txt12" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>보장 내용을 불러오는 중입니다...</p>
          )}
          {error && !loading && (
            <p className="tour2023_txt12" style={{ padding: '24px', textAlign: 'center', color: '#c00' }}>보장 내용을 불러오지 못했습니다.</p>
          )}
          {!loading && !error && coverageData && (
            <>
              <p className="tour2023_title04">{coverageData.planName}</p>
              <p className="tour2023_Line01"></p>
              {coverageData.sections.map((section: CoverageSection, sectionIndex: number) => (
                <section key={sectionIndex} className="coverage-detail-section">
                  <p className="tour2023_txt18">
                    <span className="tour2023_blue">{section.title}</span>
                    {section.helpUrl ? (
                      <a
                        href={section.helpUrl}
                        onClick={(event) => {
                          event.preventDefault();
                          openGuidePopup(section.helpUrl as string);
                        }}
                      >
                        <img src="/images/icon_tip.png" alt="도움말 보기" className="icon_tip icon_tip01" />
                      </a>
                    ) : (
                      <span className="icon_tip icon_tip01" style={{ opacity: 0.5 }}>?</span>
                    )}
                  </p>
                  {section.items.map((item: CoverageItem, itemIndex: number) => (
                    <ul key={itemIndex} className="tour2023_planLayer">
                      <li className="tour2023_txt16">
                        <span>{item.label}</span>
                        {item.note && <em className="tour2023_txt16_s"> {item.note}</em>}
                      </li>
                      <li className="tour2023_txt17">{item.amount}</li>
                    </ul>
                  ))}
                </section>
              ))}
            </>
          )}

          <div className="tourG_mat17 tourG_Wrap"></div>
        </div>
      </div>
      
      <section id="tour2023_fixedBanner">
        <div className="tour2023_bottom_btn">
          <a href="javascript:void(0);" className="tour2023_btn_b tour2023_btn07" onClick={(e) => handleConfirm(e)}>확인</a>
        </div>
      </section>
    </div>
  );
}

export default function MobileCoverageDetailPage() {
  return (
    <Suspense fallback={
      <div className="coverage-detail-mobile-page">
        <div className="coverage-detail-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>로딩 중...</div>
        </div>
      </div>
    }>
      <MobileCoverageDetailContent />
    </Suspense>
  );
}

