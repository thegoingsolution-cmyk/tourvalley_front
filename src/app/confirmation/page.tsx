'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  readNonMemberContractAuth,
  buildFullBirthDateFromSixDigits,
} from '@/utils/nonMemberContractAuth';
import './page.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

type ContractDetail = {
  id: number;
  insuranceType?: string | null;
  departureDate?: string | null;
  arrivalDate?: string | null;
  travelCountry?: string | null;
  travelRegion?: string | null;
  travelParticipants?: number;
  totalPremium?: number | null;
  createdAt?: string | null;
  contractorType?: string | null;
  contractorCompanyName?: string | null;
  memberName?: string | null;
  memberBirthDate?: string | null;
  memberPhone?: string | null;
  memberEmail?: string | null;
  paymentMethod?: string | null;
  paymentSubMethod?: string | null;
  paymentStatus?: string | null;
  bankName?: string | null;
  bank_name?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
  accountHolder?: string | null;
  account_holder?: string | null;
  status?: string | null;
  businessNumber?: string | null;
};

type Participant = {
  id?: number;
  name: string;
  gender?: string;
  birthDate?: string;
  planType?: string;
  premium?: number;
};

type PlanCoverage = {
  planName: string;
  sections: { title: string; items: { label: string; amount: string; note?: string }[] }[];
};

/** 피보험자 명단에서 등장한 플랜 타입만 수집 (첫 등장 순서 유지) */
function getPlanListFromParticipants(participants: Participant[]): { planKey: string; planName: string; ageRange: string }[] {
  const seen = new Set<string>();
  const list: { planKey: string; planName: string; ageRange: string }[] = [];
  for (const p of participants) {
    const pt = (p.planType ?? '').trim();
    if (pt && !seen.has(pt)) {
      seen.add(pt);
      list.push({ planKey: pt, planName: pt, ageRange: '' });
    }
  }
  return list;
}

/** 플랜별 보장내용 머지: section별로 item을 합치고 플랜별 금액 매핑 */
function mergePlansCoverage(
  plans: { planKey: string; planName: string; ageRange?: string }[],
  coverages: (PlanCoverage | null)[]
): { title: string; items: { label: string; note?: string; amounts: Record<string, string> }[] }[] {
  const sectionMap = new Map<string, { label: string; note?: string; amounts: Record<string, string> }[]>();
  plans.forEach((plan, idx) => {
    const cov = coverages[idx];
    if (!cov?.sections) return;
    cov.sections.forEach((sec) => {
      let list = sectionMap.get(sec.title);
      if (!list) {
        list = [];
        sectionMap.set(sec.title, list);
      }
      sec.items.forEach((item) => {
        const found = list.find((x) => x.label === item.label && (x.note ?? '') === (item.note ?? ''));
        if (found) {
          found.amounts[plan.planKey] = item.amount;
        } else {
          list.push({
            label: item.label,
            note: item.note,
            amounts: { [plan.planKey]: item.amount },
          });
        }
      });
    });
  });
  return Array.from(sectionMap.entries()).map(([title, items]) => ({ title, items }));
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const formatPeriod = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '';
  return `${formatDate(start)} ~ ${formatDate(end)}`;
};

/** 생년월일을 YYMMDD 6자리 형식으로 (예: 981212) */
const formatBirth = (resident?: string | null) => {
  if (!resident) return '';
  const digits = String(resident).replace(/[^0-9]/g, '');
  if (digits.length < 6) return '';
  if (digits.length >= 8) return digits.slice(2, 8);
  return digits.slice(0, 6);
};

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined) return '';
  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(normalized)) return '';
  return Math.floor(normalized).toLocaleString('ko-KR');
};

const B2C_CONFIRMATION_DRAFT_KEY = 'b2c_confirmation_draft';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const contractIdParam = searchParams.get('contractId');
  const contractId = contractIdParam ?? null;
  const isDraft = searchParams.get('draft') === '1';

  const { isLoggedIn, member, isLoading: authLoading } = useAuth();

  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(!!contractId || isDraft);
  const [error, setError] = useState<string | null>(null);
  const [plansCoverage, setPlansCoverage] = useState<(PlanCoverage | null)[]>([]);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [coverageReady, setCoverageReady] = useState(false);
  const [isNonMemberView, setIsNonMemberView] = useState(false);
  const printTriggered = useRef(false);
  const printTimeoutRef = useRef<number | null>(null);
  const draftLoadedRef = useRef(false);

  useEffect(() => {
    if (isDraft) {
      if (draftLoadedRef.current) {
        setLoading(false);
        return;
      }
      try {
        let raw: string | null = null;
        let fromOpener = false;
        if (typeof window !== 'undefined') {
          const openerStorage = window.opener?.sessionStorage;
          raw = openerStorage?.getItem(B2C_CONFIRMATION_DRAFT_KEY) ?? null;
          if (raw) {
            fromOpener = true;
          } else {
            raw = localStorage.getItem(B2C_CONFIRMATION_DRAFT_KEY);
          }
        }
        if (!raw) {
          setError('인쇄용 데이터가 없습니다. 계약정보 화면에서 다시 인쇄를 눌러주세요.');
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(raw) as { detail?: ContractDetail; participants?: Participant[] };
        if (parsed?.detail && Array.isArray(parsed.participants)) {
          draftLoadedRef.current = true;
          setDetail(parsed.detail);
          setParticipants(parsed.participants);
          if (typeof window !== 'undefined') {
            if (fromOpener) {
              window.opener?.sessionStorage?.removeItem(B2C_CONFIRMATION_DRAFT_KEY);
            } else {
              localStorage.removeItem(B2C_CONFIRMATION_DRAFT_KEY);
            }
          }
        } else {
          setError('인쇄용 데이터 형식이 올바르지 않습니다.');
        }
      } catch (e) {
        setError('인쇄용 데이터를 불러올 수 없습니다.');
      }
      setLoading(false);
      return;
    }
    if (!contractId) {
      setError('계약 정보가 없습니다.');
      setLoading(false);
      return;
    }

    if (authLoading) return;

    const fetchDetail = async () => {
      try {
        let response: Response;
        if (isLoggedIn && member?.id) {
          setIsNonMemberView(false);
          response = await fetch(
            `${API_BASE_URL}/api/contracts/detail/${contractId}?member_id=${encodeURIComponent(
              String(member.id)
            )}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            }
          );
        } else {
          const auth = readNonMemberContractAuth();
          if (!auth) {
            setError('가입내역 조회에서 휴대폰 인증을 완료한 뒤 다시 시도해 주세요.');
            setLoading(false);
            return;
          }
          setIsNonMemberView(true);
          let url = `${API_BASE_URL}/api/contracts/non-member/detail/${encodeURIComponent(contractId)}?`;
          if (auth.loginType === 'I') {
            url += new URLSearchParams({
              name: auth.insuredName,
              birth_date: buildFullBirthDateFromSixDigits(auth.birthDate),
              gender: auth.gender,
              phone: auth.phone,
            }).toString();
          } else {
            url += new URLSearchParams({
              company_name: auth.companyName,
              business_number: auth.businessNumber,
              phone: auth.phone,
            }).toString();
          }
          response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.contract) {
            setDetail(data.contract);
          } else {
            setError('계약 정보를 불러올 수 없습니다.');
          }
        } else {
          setError('계약 정보를 불러올 수 없습니다.');
        }
      } catch {
        setError('계약 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [contractId, authLoading, isLoggedIn, member?.id]);

  useEffect(() => {
    if (!contractId || !detail) return;
    if (isDraft) return;
    const fetchParticipants = async () => {
      try {
        let response: Response;
        if (isNonMemberView) {
          const auth = readNonMemberContractAuth();
          if (!auth) return;
          let url = `${API_BASE_URL}/api/contracts/non-member/${encodeURIComponent(contractId)}/participants?`;
          if (auth.loginType === 'I') {
            url += new URLSearchParams({
              name: auth.insuredName,
              birth_date: buildFullBirthDateFromSixDigits(auth.birthDate),
              gender: auth.gender,
              phone: auth.phone,
            }).toString();
          } else {
            url += new URLSearchParams({
              company_name: auth.companyName,
              business_number: auth.businessNumber,
              phone: auth.phone,
            }).toString();
          }
          response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
        } else {
          if (!member?.id) return;
          response = await fetch(
            `${API_BASE_URL}/api/contracts/${contractId}/participants?member_id=${encodeURIComponent(
              String(member.id)
            )}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            }
          );
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.participants)) {
            setParticipants(
              data.participants.map((p: any, i: number) => ({
                id: p.id ?? i + 1,
                name: p.name ?? '',
                gender: p.gender ?? '',
                birthDate: p.birthDate ?? p.birth_date ?? '',
                planType: p.planType ?? p.plan_type ?? '',
                premium: typeof p.premium === 'number' ? p.premium : Number(p.premium) || 0,
              }))
            );
          }
        }
      } catch {
        // participants optional
      }
    };
    fetchParticipants();
  }, [contractId, detail, isNonMemberView, member?.id]);

  useEffect(() => {
    const plans = getPlanListFromParticipants(participants);
    if (!detail?.insuranceType || plans.length === 0) {
      setPlansCoverage([]);
      setCoverageReady(true);
      return;
    }
    setCoverageLoading(true);
    setCoverageError(null);
    setCoverageReady(false);
    const insuranceTypeRaw = detail.insuranceType ?? '';
    const insuranceType =
      insuranceTypeRaw === '해외여행' || insuranceTypeRaw === '해외여행자보험'
        ? '해외여행보험'
        : insuranceTypeRaw === '국내여행자보험'
          ? '국내여행보험'
          : insuranceTypeRaw;
    Promise.all(
      plans.map((p) =>
        fetch(`${API_BASE_URL}/api/travel/coverage-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            insurance_type: insuranceType,
            plan_type: p.planKey,
            is_medical_expense: true,
            plan_variant: 'B',
          }),
        })
          .then((r) => r.json())
          .then((r) => (r.success && r.sections ? { planName: r.planName ?? p.planKey, sections: r.sections } : null))
          .catch(() => null)
      )
    )
      .then((results) => {
        setPlansCoverage(results);
        setCoverageLoading(false);
        const hasAny = results.some(Boolean);
        if (!hasAny) setCoverageError('보장내용을 불러올 수 없습니다.');
        setCoverageReady(true);
      })
      .catch(() => {
        setCoverageLoading(false);
        setCoverageError('보장내용을 불러올 수 없습니다.');
        setCoverageReady(true);
      });
  }, [detail?.insuranceType, participants]);

  useEffect(() => {
    if (loading || error || !detail || printTriggered.current) return;
    if (coverageLoading) return;
    if (!coverageReady) return;
    if (printTimeoutRef.current !== null) return;
    // Give React time to flush table rows before opening the print dialog.
    printTimeoutRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          printTriggered.current = true;
          window.print();
          printTimeoutRef.current = null;
        });
      });
    }, 600);
    return () => {
      if (printTimeoutRef.current !== null) {
        window.clearTimeout(printTimeoutRef.current);
        printTimeoutRef.current = null;
      }
    };
  }, [loading, error, detail, contractId, plansCoverage.length, coverageLoading, coverageReady]);

  if (loading) {
    return (
      <div className="cf-overseas cf-overseas--print-only">
        <p className="cf-overseas-loading">계약 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cf-overseas cf-overseas--print-only">
        <p className="cf-overseas-error">{error}</p>
      </div>
    );
  }

  const companyOrContractor =
    detail?.contractorType === '법인' && detail?.contractorCompanyName
      ? detail.contractorCompanyName
      : '(주)빨주노초파남보';
  const travelPlace =
    detail?.travelCountry ?? detail?.travelRegion ?? '국내일원';

  return (
    <div className="b2c-cf-wrapper cf-overseas--print-only">
      <div className="b2c-cf-container cf-overseas-wrapper">
        <article className="cf-overseas">
          <h1 className="cf-overseas-header">
            여행자보험 견적서 및 가입신청내역서
          </h1>

          {/* 기본정보: 이미지 형식 - 좌(신청일자,보험상품,보험기간,가입인원) | 우(보험회사,여행지,보험료) */}
          <section className="cf-overseas-section">
            <h2 className="cf-overseas-section-title">기본정보</h2>
            <table className="cf-overseas-table cf-overseas-table--two-col">
              <tbody>
                <tr>
                  <th>신청일자</th>
                  <td className="cf-dotted">{formatDate(detail?.createdAt)}</td>
                  <th>보험회사</th>
                  <td className="cf-dotted">라이나손보</td>
                </tr>
                <tr>
                  <th>보험상품</th>
                  <td className="cf-dotted">{detail?.insuranceType ?? '국내여행보험'}</td>
                  <th>여행지</th>
                  <td className="cf-dotted">{travelPlace || '국내일원'}</td>
                </tr>
                <tr>
                  <th>보험기간</th>
                  <td className="cf-dotted">{formatPeriod(detail?.departureDate, detail?.arrivalDate)}</td>
                  <th>보험료</th>
                  <td className="cf-dotted">{detail != null ? `${formatNumber(detail.totalPremium)}원` : ''}</td>
                </tr>
                <tr>
                  <th>가입인원</th>
                  <td className="cf-dotted">{detail != null ? String(detail.travelParticipants ?? 1) : ''}</td>
                  <th></th>
                  <td className="cf-dotted"></td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 계약자 정보(개인/단체) */}
          <section className="cf-overseas-section">
            <h2 className="cf-overseas-section-title">계약자 정보(개인/단체)</h2>
            <table className="cf-overseas-table cf-overseas-table--two-col">
              <tbody>
                <tr>
                  <th>계약자명</th>
                  <td className="cf-dotted">{companyOrContractor === '(주)빨주노초파남보' ? (detail?.memberName ?? '') : companyOrContractor}</td>
                  <th>주민번호(사업자번호)</th>
                  <td className="cf-dotted">{detail?.contractorType === '법인' && detail?.businessNumber ? detail.businessNumber : (detail?.memberBirthDate ? `${detail.memberBirthDate.substring(0, 6)}-*******` : '')}</td>
                </tr>
                {/* 휴대폰번호, E-MAIL
                <tr>
                  <th>휴대폰번호</th>
                  <td className="cf-dotted">{detail?.memberPhone ?? ''}</td>
                  <th>E-MAIL</th>
                  <td className="cf-dotted">{detail?.memberEmail ?? ''}</td>
                </tr>
                */}
              </tbody>
            </table>
          </section>

          {/* 가입자(피보험자) 명단: 순번, 성명, 성별, 생년월일, 플랜, 보험료 */}
          <section className="cf-overseas-section">
            <h2 className="cf-overseas-section-title">가입자(피보험자) 명단</h2>
            <table className="cf-overseas-table cf-overseas-table--insured">
              <thead>
                <tr>
                  <th>순번</th>
                  <th>성명</th>
                  <th>성별</th>
                  <th>생년월일</th>
                  <th>플랜</th>
                  <th>보험료</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  participants.map((p, idx) => (
                    <tr key={p.id ?? idx}>
                      <td>{idx + 1}</td>
                      <td>{p.name}</td>
                      <td>{p.gender ?? ''}</td>
                      <td>{formatBirth(p.birthDate)}</td>
                      <td>{p.planType ?? ''}</td>
                      <td>{p.premium != null ? `${formatNumber(p.premium)}원` : ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>1</td>
                    <td className="cf-dotted">{detail?.memberName ?? ''}</td>
                    <td className="cf-dotted"></td>
                    <td className="cf-dotted">{detail?.memberBirthDate ? formatBirth(detail.memberBirthDate) : ''}</td>
                    <td className="cf-dotted"></td>
                    <td className="cf-dotted"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* 결제정보 */}
          <section className="cf-overseas-section">
            <h2 className="cf-overseas-section-title">결제정보</h2>
            <table className="cf-overseas-table cf-overseas-table--two-col">
              <tbody>
                <tr>
                  <th>결제방법</th>
                  <td className="cf-dotted">
                    {detail?.paymentMethod === '기타결제' ? (detail?.paymentSubMethod ?? '기타결제') : (detail?.paymentMethod ?? '')}
                    {(detail?.paymentMethod === '무통장입금' ||
                      (detail?.paymentMethod === '기타결제' &&
                        (detail?.paymentSubMethod === '무통장입금' ||
                          detail?.paymentSubMethod === '가상계좌'))) && (
                      <div className="cf-bank-info" style={{ marginTop: 8 }}>
                        은행명: {detail?.bankName ?? detail?.bank_name ?? '-'} / 계좌번호: {detail?.accountNumber ?? detail?.account_number ?? '-'} / 예금주: (주)빨주노초파남보
                      </div>
                    )}
                  </td>
                  <th>결제여부</th>
                  <td className="cf-dotted">{detail?.paymentStatus ?? ''}</td>
                </tr>
                <tr>
                  <th>진행단계</th>
                  <td className="cf-dotted">{detail?.status ?? ''}</td>
                  <th></th>
                  <td className="cf-dotted"></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="cf-overseas-section">
            <h2 className="cf-overseas-section-title">플랜별 보장내용</h2>
            {coverageLoading && (
              <p className="cf-overseas-loading">보장내용을 불러오는 중...</p>
            )}
            {coverageError && plansCoverage.length === 0 && (
              <p className="cf-overseas-error">{coverageError}</p>
            )}
            {(() => {
              const plans = getPlanListFromParticipants(participants);
              const merged = mergePlansCoverage(plans, plansCoverage);
              if (merged.length === 0 && !coverageLoading) return null;
              return (
                <table className="cf-overseas-table cf-overseas-table--coverage cf-overseas-table--plans">
                  <thead>
                    <tr>
                      <th className="cf-coverage-name">담보명</th>
                      <th className="cf-coverage-amount-header" colSpan={plans.length}>
                        보장금액
                      </th>
                    </tr>
                    <tr>
                      <th className="cf-coverage-name"></th>
                      {plans.map((p) => (
                        <th key={p.planKey} className="cf-amount">
                          {p.planName}
                          {p.ageRange ? <span className="cf-plan-age">({p.ageRange})</span> : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {merged.map((section) => (
                      <React.Fragment key={section.title}>
                        <tr>
                          <th className="cf-cat" colSpan={1 + plans.length}>
                            {section.title}
                          </th>
                        </tr>
                        {section.items.map((item) => (
                          <tr key={`${section.title}-${item.label}-${item.note ?? ''}`}>
                            <td className="cf-coverage-label">
                              {item.label}
                              {item.note ? ` ${item.note}` : ''}
                            </td>
                            {plans.map((p) => (
                              <td key={p.planKey} className="cf-amount">
                                {item.amounts[p.planKey] ?? '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </section>

          {/*
          <div className="cf-overseas-notice">
            <h4>1. 주요 보상하지 아니하는 손해</h4>
            <p>
              계약자나 피보험자, 보험수익자의 고의, 피보험자의 자해, 심신상실 또는 정신질환, 전쟁, 외국의 무력행사, 혁명, 내란, 사변, 폭동, 전문등반, 글라이더조정, 스카이다이빙, 행글라이딩, 스쿠버다이빙, 스키(스노보드), 래프팅
            </p>
            <h4>2. 상해/질병 실손의료비</h4>
            <ul>
              <li>기왕증(질병 또는 상해로 과거에 진단 또는 치료를 받은 경우)으로 인한 손해</li>
              <li>치아보철, 금관, 틀니, 의치 및 임플란트로 인한 의료비는 보상하지 않습니다.</li>
              <li>직장, 항문질환(치질 등), 치과치료, 한방치료에서 발생한 국민건강보험법상 비급여의료비는 보상하지 않습니다.</li>
            </ul>
            <h4>3. 실손의료보험 본인부담금 안내</h4>
            <p>
              ※ 단, 국민건강보험법 또는 의료급여법을 적용받지 못하는 경우(미가입자)에는 본인이 실제로 부담한 금액의 40%를 가입금액 한도내에서 보상합니다.(본인부담금 별도)
            </p>
            <h4>4. 배상책임</h4>
            <ul>
              <li>렌터카와 같이 피보험자가 소유, 사용 또는 관리하는 재물에 대하여 정당한 권리를 가진 사람에게 부담하는 손해에 대한 배상책임(다만, 호텔의 객실이나 객실내의 동산에 끼치는 손해는 보상) 손해는 보상하지 않습니다.</li>
              <li>직무활동으로 인한 배상책임, 차량, 선박, 항공기, 총기의 소유, 사용 또는 관리로 인한 배상책임 손해는 보상하지 않습니다.</li>
            </ul>
            <h4>5. 휴대품손해(분실 제외, 자기부담금 1만원, 1품목(1조)당 20만원 한도, 이동통신단말기 보상제외)</h4>
            <ul>
              <li>휴대품손해에서 분실은 보상하는 손해가 아니며, 도난 파손 등은 보상합니다.</li>
              <li>현금, 신용카드, 유가증권 등은 보상하는 손해가 아닙니다.</li>
              <li>휴대품손해에서 1품목(1조) 당 보상한도는 20만원이며, 이동통신단말기(공단말기 포함)는 보상하지 않습니다.</li>
              <li>휴대품을 도난당한 경우 현지 경찰서에서 확인서(Police Report)를 받아 오시기 바랍니다.</li>
            </ul>
            <h4>6. 비례보상</h4>
            <p>
              의료실비 등 보상하는 다수의 다른 보험계약에 가입되어 있는 경우 약관에 따라 비례보상됩니다.
            </p>
            <p className="cf-note">
              ※ 가입담보별 자기부담금 및 보상하는 손해, 보상하지 않는 손해 등 구체적인 보상내용은 약관을 참조하시기 바랍니다.
            </p>
          </div>

          <div className="cf-overseas-footer">
            <p className="cf-overseas-footer-intro">
              이 확인서는 투어밸리 여행자보험 가입내역을 확인하는 문서입니다.
            </p>
            <p className="cf-overseas-footer-date">
              발행일 : {detail?.createdAt ? formatDate(detail.createdAt) : formatDate(new Date().toISOString())}
            </p>
            <div className="cf-overseas-footer-contact">
              <div className="cf-overseas-footer-row">
                <span className="cf-overseas-footer-left">
                  보험회사 : 라이나손해보험(에이스아메리칸화재해상보험)
                </span>
                <span className="cf-overseas-footer-right">
                  보상과 : 1666-5075
                </span>
              </div>
              <div className="cf-overseas-footer-row">
                <span className="cf-overseas-footer-left">
                  보험대리점 : ㈜빨주노초파남보 (1599-2541)
                </span>
                <span className="cf-overseas-footer-right">
                  투어밸리 고객센터 1599-2541
                </span>
              </div>
            </div>
          </div>
          */}
          <p className="cf-overseas-footer-date cf-overseas-footer-date--secondary">
            발행일 : {formatDate(new Date().toISOString())}
          </p>
          <div className="cf-overseas-footer-secondary">
            <div className="cf-overseas-footer-secondary-logo">
              <img src="/images/logo.png" alt="투어밸리" />
            </div>
            <div className="cf-overseas-footer-secondary-divider"></div>
            <p className="cf-overseas-footer-secondary-text">
              (주)빨주노초파남보 (04543) 서울시 중구 을지로 11길 15 동화빌딩 603호 고객센터 : 1599-2541
              <br />
              대표 : 한상윤 사업자등록번호 : 256-81-03026 통신판매업신고번호 : 제2023-서울중구-0084호
              보험대리점등록번호 : 제2022120036호
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
