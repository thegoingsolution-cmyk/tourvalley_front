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

    // 보장내용(플랜별) 로딩이 끝난 뒤 인쇄 (빈 화면 인쇄 방지)
    if (planCoverageLoading) return;

    printTriggeredRef.current = true;
    window.print();
  }, [loading, estimateData, planCoverageLoading]);

  // 플랜별 보장내용 조회 (견적에 포함된 모든 플랜)
  useEffect(() => {
    if (!estimateData) return;
    if (planCoverageLoading) return;
    // 이미 조회를 끝냈거나(성공) 에러가 난 경우에는 다시 호출하지 않음
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
              // 국내여행보험: plan_variant 기본값을 'B'로 사용, 그 외는 null
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
              console.error('플랜 보장내용 조회 오류:', planType, e);
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

  // 피보험자 행 생성 (test.html과 동일한 구조)
  const renderParticipantRows = () => {
    const rows = [];
    for (let i = 0; i < Math.ceil(estimateData.participants.length / 2); i++) {
      const leftParticipant = estimateData.participants[i * 2];
      const rightParticipant = estimateData.participants[i * 2 + 1];

      rows.push(
        <tr key={i}>
          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
            {leftParticipant.sequence}
          </td>
          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
            {leftParticipant.gender === '남자' ? '남' : '여'}
          </td>
          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
            {leftParticipant.birth_date.substring(2)}
          </td>
          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
            {leftParticipant.planType}
          </td>
          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', borderRight: 'solid 1px #d8d8d8!important' }}>
            {formatPremium(leftParticipant.premium)}
          </td>
          {rightParticipant ? (
            <>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
                {rightParticipant.sequence}
              </td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
                {rightParticipant.gender === '남자' ? '남' : '여'}
              </td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
                {rightParticipant.birth_date.substring(2)}
              </td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
                {rightParticipant.planType}
              </td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}>
                {formatPremium(rightParticipant.premium)}
              </td>
            </>
          ) : (
            <>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}></td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}></td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}></td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}></td>
              <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px' }}></td>
            </>
          )}
        </tr>
      );
    }
    return rows;
  };

  const estimateDate = formatEstimateDate(estimateData.created_at);
  const insurancePeriod = formatInsurancePeriod();

  return (
    <html lang="ko">
      <head>
        <title>투어밸리 여행자보험 추천</title>
        <meta name="copyright" content="㈜빨주노초파남보" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, target-densitydpi=medium-dpi" />
      </head>
      <body>
        <div style={{ position: 'relative', display: 'block', width: '100%', textAlign: 'center', padding: '30px 30px' }}>
          <section style={{ position: 'relative', width: '700px', textAlign: 'center', margin: '0 auto' }}>
            {/* 계약 기본정보 */}
            <table cellPadding="0" cellSpacing="0" border={0} align="center" width="700">
              <tbody>
                <tr>
                  <td>
                    <span style={{ fontFamily: "'NanumSquareNeoTTF-dEb',Noto Sans KR, sans-serif,'Malgun Gothic','맑은 고딕'", fontWeight: 'bold', fontSize: '40px', color: '#000', letterSpacing: '-2px', textAlign: 'center', display: 'inline-block', width: '100%', padding: 0 }}>
                      투어밸리 여행자보험 견적서
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table style={{ width: '100%', border: 0, borderCollapse: 'collapse', tableLayout: 'fixed', borderSpacing: 0 }} border={1} cellSpacing={0}>
                      <caption></caption>
                      <colgroup>
                        <col width="110" />
                        <col width="210" />
                        <col width="110" />
                        <col width="280" />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', borderTop: '2px solid #000!important', background: '#eff7fe' }}>
                            견적일자
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', borderTop: '2px solid #000!important' }}>
                            {estimateDate}
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', borderTop: '2px solid #000!important', background: '#eff7fe' }}>
                            보험종류
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', borderTop: '2px solid #000!important' }}>
                            {estimateData.insurance_type}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', background: '#eff7fe' }}>
                            고 객 명
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box' }}>
                            {estimateData.contractor_name}
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', background: '#eff7fe' }}>
                            보험기간
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box' }}>
                            {insurancePeriod}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', background: '#eff7fe' }}>
                            인     원
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box' }}>
                            {estimateData.tour_num}명
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', background: '#eff7fe' }}>
                            합계보험료
                          </td>
                          <td style={{ position: 'relative', padding: '16px 17px 15px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '15px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box' }}>
                            {formatPremium(estimateData.total_premium)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", fontSize: '14px', color: '#1800ff', letterSpacing: '-1px', textAlign: 'left', display: 'inline-block', padding: '15px 0 0 0', verticalAlign: 'bottom', width: '100%' }}>
                    ※ 본 견적서의 보험료는 <span style={{ color: '#f01d1d' }}><b>견적일자 기준</b></span>입니다. 여행자보험은 가입일자를 기준으로 보험나이를 산정하므로 견적일자와<br />&nbsp;&nbsp;&nbsp;가입일자가 차이가 나는 경우 보험료가 달라질 수 있습니다.
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 플랜별 보장내용 */}
            <table cellPadding="0" cellSpacing="0" border={0} align="center" width="700">
              <tbody>
                <tr>
                  <td style={{ position: 'relative', display: 'inline-block', textAlign: 'left', width: '100%' }}>
                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", fontWeight: 'bold', fontSize: '21px', color: '#202020', letterSpacing: '-1.4px', textAlign: 'left', display: 'inline-block', padding: '70px 0 13px 0', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      플랜별 보장내용
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    {planCoverageLoading && (
                      <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                        보장내용을 불러오는 중입니다...
                      </div>
                    )}
                    {planCoverageError && !planCoverageLoading && (
                      <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '14px', color: '#c00' }}>
                        {planCoverageError}
                      </div>
                    )}
                    {!planCoverageLoading && !planCoverageError && planCoverages.length > 0 ? (
                      <>
                        {planCoverages.map((cov, idx) => (
                          <table
                            key={cov.planName}
                            style={{
                              width: '100%',
                              border: 0,
                              borderCollapse: 'collapse',
                              tableLayout: 'fixed',
                              marginTop: idx > 0 ? 50 : 0,
                            }}
                            border={1}
                            cellSpacing={0}
                          >
                            <caption></caption>
                            <colgroup>
                              <col width="60%" />
                              <col width="40%" />
                            </colgroup>
                            <tbody>
                              <tr>
                                <td colSpan={2} style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderTop: '2px solid #000!important', background: '#eff7fe' }}>
                                  가입플랜: {cov.planName}
                                </td>
                              </tr>
                              {cov.sections.map((section) => (
                                <React.Fragment key={`${cov.planName}-${section.title}`}>
                                  <tr>
                                    <th colSpan={2} style={{ position: 'relative', padding: '12px 17px 11px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'left', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', background: '#f5f5f5' }}>
                                      {section.title}
                                    </th>
                                  </tr>
                                  {section.items.map((item) => (
                                    <tr key={`${cov.planName}-${section.title}-${item.label}`}>
                                      <td style={{ position: 'relative', padding: '12px 17px 11px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', textAlign: 'left' }}>
                                        {item.label}{item.note ? ` ${item.note}` : ''}
                                      </td>
                                      <td style={{ position: 'relative', padding: '12px 17px 11px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box' }}>
                                        {item.amount}
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        ))}
                      </>
                    ) : (
                    <table style={{ width: '100%', border: 0, borderCollapse: 'collapse', tableLayout: 'fixed' }} border={1} cellSpacing={0}>
                      <caption></caption>
                      <colgroup>
                        <col width="45%" />
                        <col width="18.333%" />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td rowSpan={3} style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', background: '#eff7fe', borderTop: '2px solid #000!important' }}>
                            담보명
                          </td>
                          <td colSpan={1} style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderTop: '2px solid #000', borderRight: 'solid 1px #d8d8d8', background: '#eff7fe' }}>
                            보장금액
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', background: '#eff7fe', borderRight: 'solid 1px #d8d8d8' }}>
                            실속플랜
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', background: '#eff7fe', borderRight: 'solid 1px #d8d8d8' }}>
                            15-79세
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행중 상해사망
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            1억원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행중 상해후유장해
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            -
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(상해 급여_입원_국내여행실손_기본)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            1,000만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(상해 비급여_입원_국내여행실손_특약)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            10만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(상해 급여_통원_국내여행실손_기본)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            1,000만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(상해 비급여_통원_국내여행실손_특약)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            10만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(질병 급여_입원_국내여행실손_기본)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            -
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(질병 비급여_입원_국내여행실손_특약)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            -
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(질병 급여_통원_국내여행실손_기본)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            -
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(질병 비급여_통원_국내여행실손_특약)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            -
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행중 질병사망 및 80%이상 고도후유장해
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            1,000만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(상해질병 3대비급여도수, 체외충격파, 증식치료_국내여행실손_특약)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            350만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(상해질병 3대비급여_주사치료_국내여행실손_특약)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            250만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내의료비<br />(상해질병 3대비급여_자기공명영상진단_국내여행실손_특약)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            300만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행중 배상책임(자기부담금 1만원)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            500만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행중 휴대품손해(자기부담금 1만원)<br />(분실제외, 이동통신단말기 보상제외)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            50만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행 골절수술비(치아파절제외, 동일사고당 1회한)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            10만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            화상진단비
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            10만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행 골절수술비(동일사고당 1회한)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            20만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행 상해수술비(동일사고당 1회한)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            20만원
                          </td>
                        </tr>
                        <tr>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8', textAlign: 'left' }}>
                            국내여행중 깁스수술비<br />(동일사고 또는 질병당 1회한)
                          </td>
                          <td style={{ position: 'relative', padding: '14px 17px 13px 18px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '14px', textAlign: 'center', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '125%', boxSizing: 'border-box', borderRight: 'solid 1px #d8d8d8' }}>
                            20만원
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 피보험자별 보험료 */}
            <table cellPadding="0" cellSpacing="0" border={0} align="center" width="700" style={{ display: '' }}>
              <tbody>
                <tr>
                  <td style={{ position: 'relative', display: 'inline-block', textAlign: 'left', width: '100%' }}>
                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", fontWeight: 'bold', fontSize: '21px', color: '#202020', letterSpacing: '-1.4px', textAlign: 'left', display: 'inline-block', padding: '70px 0 13px 0' }}>
                      가입대상자(피보험자)별 보험료
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table style={{ width: '100%', border: 0, borderCollapse: 'collapse', tableLayout: 'fixed' }} border={1} cellSpacing={0}>
                      <caption></caption>
                      <colgroup>
                        <col width="10%" />
                        <col width="8%" />
                        <col width="10%" />
                        <col width="11%" />
                        <col width="11%" />
                        <col width="10%" />
                        <col width="8%" />
                        <col width="10%" />
                        <col width="11%" />
                        <col width="11%" />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>가입대상자</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>성별</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>생년월일</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>플랜명</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important', borderRight: 'solid 1px #d8d8d8!important' }}>보험료</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>가입대상자</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>성별</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>생년월일</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>플랜명</td>
                          <td style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', fontSize: '13px', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '-1.2px', background: '#f5f5f5', borderTop: '2px solid #000!important' }}>보험료</td>
                        </tr>
                        {renderParticipantRows()}
                        <tr>
                          <td colSpan={2} style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', letterSpacing: '-1.2px', fontSize: '15px', textAlign: 'left', paddingLeft: '21px', background: '#feffcc' }}>총인원</td>
                          <td colSpan={3} style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', letterSpacing: '-1.2px', fontSize: '21px!important', fontWeight: 900, textAlign: 'right', paddingRight: '22px', borderRight: 'solid 1px #d8d8d8', background: '#feffcc' }}>{estimateData.tour_num}명</td>
                          <td colSpan={2} style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', letterSpacing: '-1.2px', fontSize: '15px', textAlign: 'left', paddingLeft: '21px', background: '#feffcc' }}>합계보험료</td>
                          <td colSpan={3} style={{ position: 'relative', padding: '13px 0px 14px 0px', border: 0, borderBottom: 'solid 1px #d8d8d8', verticalAlign: 'middle', fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", lineHeight: '132%', boxSizing: 'border-box', letterSpacing: '-1.2px', fontSize: '21px!important', fontWeight: 900, textAlign: 'right', paddingRight: '22px', background: '#feffcc', color: '#f01d1d' }}>{formatPremium(estimateData.total_premium)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 알아두세요 */}
            <table width="700px" cellPadding="0" cellSpacing="0" border={0} style={{ position: 'relative', display: 'inline-block', width: '100%', border: '1px solid #e6e8ed', margin: '40px 0 15px 0', padding: '22px 14px 21px 22px', borderCollapse: 'collapse', borderSpacing: 0 }}>
              <tbody>
                <tr>
                  <td colSpan={2} style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", fontSize: '16px', color: '#555', textAlign: 'left', lineHeight: '120%', letterSpacing: '-1px', paddingBottom: '3px' }}>
                    ※ 알아두세요.
                  </td>
                </tr>
                <tr style={{ width: '100%', position: 'relative', display: 'inline-flex', justifyContent: 'flex-start' }}>
                  <td style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", display: 'inline-block', fontSize: '14px', color: '#555', textAlign: 'left', lineHeight: '150%', letterSpacing: '-0.8px', width: 'fit-content' }}>1.&nbsp;</td>
                  <td style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", display: 'inline-block', fontSize: '14px', color: '#555', textAlign: 'left', lineHeight: '150%', letterSpacing: '-0.8px', width: 'fit-content' }}>상법 제732조에 따라 15세 미만의 경우 사망에 대해서는 보장하지않습니다.(후유장해)</td>
                </tr>
                <tr style={{ width: '100%', position: 'relative', display: 'inline-flex', justifyContent: 'flex-start' }}>
                  <td style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", display: 'inline-block', fontSize: '14px', color: '#555', textAlign: 'left', lineHeight: '150%', letterSpacing: '-0.8px', width: 'fit-content' }}>2.&nbsp;</td>
                  <td style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", display: 'inline-block', fontSize: '14px', color: '#555', textAlign: 'left', lineHeight: '150%', letterSpacing: '-0.8px', width: 'fit-content' }}>(비례보상) 여행 중 실손의료비, 배상책임 및 휴대품손해 특별약관의 경우 보험금을 지급할 다수계약이 체결되어 있는 경우에는 약관에 따라 실손 비례 보상합니다.</td>
                </tr>
                <tr style={{ width: '100%', position: 'relative', display: 'inline-flex', justifyContent: 'flex-start' }}>
                  <td style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", display: 'inline-block', fontSize: '14px', color: '#555', textAlign: 'left', lineHeight: '150%', letterSpacing: '-0.8px', width: 'fit-content' }}>3.&nbsp;</td>
                  <td style={{ fontFamily: "'Noto Sans KR', sans-serif,'Malgun Gothic','맑은 고딕'", display: 'inline-block', fontSize: '14px', color: '#555', textAlign: 'left', lineHeight: '150%', letterSpacing: '-0.8px', width: 'fit-content' }}>가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</td>
                </tr>
              </tbody>
            </table>

            {/* 하단 이미지 및 푸터 */}
            {/* <table cellPadding="0" cellSpacing="0" border={0} align="center" width="700">
              <tbody>
                <tr>
                  <td width="100%" colSpan={2} style={{ padding: '45px 0 0 0' }}>
                    <img src="https://www.insvalley.com/tour/image/mail/202306_img03.png" alt="안전여행의 동반자! 투어밸리가 함께 하겠습니다." width="700" height="320" style={{ border: 0 }} />
                  </td>
                </tr>
              </tbody>
            </table> */}
            <table cellPadding="0" cellSpacing="0" border={0} align="center" width="700" style={{ position: 'relative', display: 'inline-block', boxSizing: 'border-box', background: '#eee', padding: '28px 10px 28px 15px', margin: '5px 0 35px 0', fontFamily: "Noto Sans KR, sans-serif,'Malgun Gothic','맑은 고딕'" }}>
              <tbody>
                <tr>
                  <td align="left" width="20%" style={{ padding: '0 0 0 15px' }}>
                    <img src="https://www.insvalley.com/tour/image/mail/2023_bottomlogo.png" alt="투어밸리" width="90" height="25" style={{ border: 0 }} />
                  </td>
                  <td width="80%">
                    <span style={{ fontFamily: "Noto Sans KR, sans-serif,'Malgun Gothic','맑은 고딕'", fontSize: '13px', color: '#999', textAlign: 'left', lineHeight: '140%', letterSpacing: '-0.7px', paddingTop: '1px', display: 'block' }}>
                      ㈜빨주노초파남보  대표 한상윤 사업자번호 256-81-03026   보험대리점등록번호 제2022120036호
                    </span>
                    <span style={{ fontFamily: "Noto Sans KR, sans-serif,'Malgun Gothic','맑은 고딕'", fontSize: '13px', color: '#999', textAlign: 'left', lineHeight: '140%', letterSpacing: '-0.7px', paddingTop: '1px', display: 'block' }}>
                      고객센터 1599-2541
                    </span>
                    <span style={{ fontFamily: "Noto Sans KR, sans-serif,'Malgun Gothic','맑은 고딕'", fontSize: '13px', color: '#999', textAlign: 'left', lineHeight: '140%', letterSpacing: '-0.7px', paddingTop: '1px', display: 'block' }}>
                      서울특별시 중구 을지로11길15 동화빌딩 603호 팩스 02-2261-0098  tourmaster@insvalley.com
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </body>
    </html>
  );
}

export default function EstimatePrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>로딩 중...</div>}>
      <EstimatePrintContent />
    </Suspense>
  );
}

