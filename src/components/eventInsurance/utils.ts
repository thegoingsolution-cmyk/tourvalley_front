/**
 * 행사보험 견적신청 6단계 마법사 - 비즈니스 로직 유틸
 */
import { getTrackingInfo } from '@/utils/tracking';
import { PLANS, RISK_DEFS } from './constants';
import type {
  BaseLimits,
  Device,
  ErrorMap,
  OptCovKey,
  PlanKey,
  RiskKey,
  WizardState,
} from './types';

/** 인원·고위험 항목 기준 담보 추천 (1형/2형) */
const HIGH_RISK_KEYS: RiskKey[] = ['불꽃놀이', '수상위험', '놀이시설', '드론', '이동행진'];

export function recommendPlan(state: Pick<WizardState, 'people' | 'riskFlags'>): '1형' | '2형' {
  const people = Number(state.people) || 0;
  const hasHighRisk = HIGH_RISK_KEYS.some((k) => state.riskFlags[k]);
  if (people >= 1000 || hasHighRisk) return '2형';
  return '1형';
}

/** 현재 적용 중인 필수담보 한도 (직접입력이면 state.limits, 아니면 플랜 기본값) */
export function curLimits(state: Pick<WizardState, 'plan' | 'limits'>): BaseLimits {
  if (state.plan === '직접') return state.limits;
  const plan = PLANS[state.plan];
  return {
    대인1인당: plan.대인1인당,
    대인1사고당: plan.대인1사고당,
    대물: plan.대물,
    자기부담금: plan.자기부담금,
  };
}

/**
 * "1억원", "1억5,000만원", "3,000만원", "10만원" 등 라벨을 만원 단위 정수로 변환
 * (백엔드 FormData 는 만원 단위 정수 문자열을 기대함)
 */
export function amountLabelToManwon(label: string | undefined | null): number {
  if (!label) return 0;
  const s = String(label).replace(/,/g, '');
  let manwon = 0;
  const eokMatch = s.match(/^(\d+)억/);
  if (eokMatch) {
    manwon += parseInt(eokMatch[1], 10) * 10000;
    const rest = s.slice(eokMatch[0].length);
    const manMatch = rest.match(/^(\d+)만/);
    if (manMatch) manwon += parseInt(manMatch[1], 10);
  } else {
    const manMatch = s.match(/^(\d+)만/);
    if (manMatch) manwon = parseInt(manMatch[1], 10);
  }
  return manwon;
}

/** 플랜(1형/2형) 선택 시 참가자치료비 기본값 적용 (체육활동이면 강제 off) */
export function applyPlanDefaults(state: WizardState, plan: '1형' | '2형'): WizardState {
  const planDef = PLANS[plan];
  const athletic = state.riskFlags.체육활동;
  return {
    ...state,
    plan,
    optCov: {
      ...state.optCov,
      참가자치료비: athletic ? false : true,
    },
    optLimits: {
      ...state.optLimits,
      참가자치료비: { '1인당': planDef.치료1인, '1사고당': planDef.치료사고 },
    },
  };
}

/** 위험요소 유무 코드 (AT/FW/WR/PF/DR/MV) - '유' 인 항목만 '/' join */
export function buildActionInfo(state: Pick<WizardState, 'riskFlags'>): string {
  return RISK_DEFS.filter((r) => state.riskFlags[r.key]).map((r) => r.code).join('/');
}

/** 이동 구간 요약 텍스트 (이동 유형 event_location 용) */
export function buildMoveSummary(state: Pick<WizardState, 'routeFrom' | 'routeVia' | 'routeTo' | 'moveNote'>): string {
  const { routeFrom, routeVia, routeTo, moveNote } = state;
  const parts = [routeFrom, routeVia, routeTo].filter((v) => v && v.trim());
  if (!parts.length) return '';
  const base = `[이동] ${parts.join(' → ')}`;
  return moveNote && moveNote.trim() ? `${base} (${moveNote.trim()})` : base;
}

/** 복수 장소 요약 텍스트 */
export function buildPlacesSummary(state: Pick<WizardState, 'places'>): string {
  const places = (state.places || []).map((p) => p.trim()).filter(Boolean);
  if (!places.length) return '';
  return `[복수] ${places.join(' / ')}`;
}

/** 장소 유형별 표시/저장용 요약 */
export function buildPlaceText(state: Pick<WizardState, 'locType' | 'region' | 'places' | 'routeFrom' | 'routeVia' | 'routeTo' | 'moveNote'>): string {
  if (state.locType === '단일') return state.region?.trim() || '';
  if (state.locType === '복수') return buildPlacesSummary(state);
  return buildMoveSummary(state);
}

export function isHighRisk(state: Pick<WizardState, 'riskFlags'>): boolean {
  return HIGH_RISK_KEYS.some((k) => state.riskFlags[k]);
}

/** 단계별 필수값 검증 (참조 디자인의 validate() 로직과 동일한 항목만 검증) */
export function validateStep(step: number, state: WizardState): { ok: boolean; errors: ErrorMap } {
  const errors: ErrorMap = {};
  let ok = true;

  if (step === 1) {
    if (!state.type) {
      errors.type = true;
      ok = false;
    }
  }

  if (step === 2) {
    if (!state.evName.trim()) {
      errors.evName = true;
      ok = false;
    }
    if (!state.category) {
      errors.category = true;
      ok = false;
    }
    if (!state.people || Number(state.people) <= 0) {
      errors.people = true;
      ok = false;
    }
    const badLoc =
      state.locType === '단일'
        ? !state.region.trim()
        : state.locType === '복수'
          ? (state.places || []).filter((p) => p.trim()).length < 2
          : !(state.routeFrom.trim() && state.routeTo.trim());
    if (badLoc) {
      errors.region = true;
      ok = false;
    }
    const badDate = !(state.startDate && state.endDate && state.startTime && state.endTime);
    if (badDate) {
      errors.date = true;
      ok = false;
    }
  }

  if (step === 5) {
    if (!state.org.trim()) {
      errors.org = true;
      ok = false;
    }
    if (!state.contact.trim()) {
      errors.contact = true;
      ok = false;
    }
    const bizNoDigits = (state.bizNo || '').replace(/\D/g, '');
    if (bizNoDigits.length !== 10) {
      errors.bizNo = true;
      ok = false;
    }
    if (state.budgetType === '정액') {
      const budgetDigits = (state.budgetAmt || '').replace(/\D/g, '');
      if (!budgetDigits) {
        errors.budgetAmt = true;
        ok = false;
      }
    }
    const phoneDigits = (state.phone || '').replace(/\s/g, '');
    if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phoneDigits)) {
      errors.phone = true;
      ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email || '')) {
      errors.email = true;
      ok = false;
    }
    if (!state.cPrivacy) {
      errors.consent = true;
      ok = false;
    }
  }

  return { ok, errors };
}

/**
 * 견적신청 FormData 생성 (백엔드 /api/event-insurance/estimate 스펙과 일치)
 */
export function buildFormData(state: WizardState, device: Device): FormData {
  const fd = new FormData();

  const limits = curLimits(state);

  const formatDateTime = (date: string, hour: string) => `${date} ${hour}:00:00`;

  let memberId: string | null = null;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('member') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) memberId = String(parsed.id);
    }
  } catch {
    memberId = null;
  }

  fd.append('contractor_name', state.org);
  fd.append('registration_no', (state.bizNo || '').replace(/\D/g, ''));
  fd.append('incharge', state.contact);
  fd.append('department', state.dept || '');
  fd.append('ctel_no', (state.phone || '').replace(/\D/g, ''));
  fd.append('tel_no', (state.tel || '').replace(/\D/g, ''));
  fd.append('email', state.email);

  fd.append('event_name', state.evName);
  fd.append('event_form_type', state.type || '');
  fd.append('event_category', state.category || '');
  fd.append('venue_type', state.venue);
  fd.append('location_type', state.locType);

  const eventLocation = buildPlaceText(state);
  fd.append('event_location', eventLocation);
  if (state.locType === '복수') {
    const places = (state.places || []).map((p) => p.trim()).filter(Boolean);
    fd.append('places', JSON.stringify(places));
  } else {
    fd.append('places', '');
  }
  fd.append('route_from', state.locType === '이동' ? state.routeFrom : '');
  fd.append('route_via', state.locType === '이동' ? state.routeVia : '');
  fd.append('route_to', state.locType === '이동' ? state.routeTo : '');
  fd.append('move_note', state.locType === '이동' ? state.moveNote : '');

  fd.append('start_date', formatDateTime(state.startDate, state.startTime));
  fd.append('end_date', formatDateTime(state.endDate, state.endTime));
  fd.append('insured_cnt', String(Number(state.people) || 0));
  fd.append('has_performer', state.performer ? '유' : '무');

  fd.append('action_info', buildActionInfo(state));
  fd.append('risk_detail', JSON.stringify(state.riskDetail));

  const planLabel: string = state.plan === '직접' ? '직접입력' : state.plan;
  fd.append('plan_label', planLabel);

  fd.append('bi_person', String(amountLabelToManwon(limits.대인1인당)));
  fd.append('bi_occurence', String(amountLabelToManwon(limits.대인1사고당)));
  fd.append('pi_occurence', String(amountLabelToManwon(limits.대물)));
  fd.append('dt_occurence', String(amountLabelToManwon(limits.자기부담금)));

  const covPmed = state.optCov.참가자치료비;
  fd.append('cov_pmed', covPmed ? '1' : '0');
  fd.append('me_person', String(covPmed ? amountLabelToManwon(state.optLimits.참가자치료비['1인당']) : 0));
  fd.append('me_occurence', String(covPmed ? amountLabelToManwon(state.optLimits.참가자치료비['1사고당']) : 0));

  const covFood = state.optCov.음식물배상;
  fd.append('cov_food', covFood ? '1' : '0');
  fd.append('food_per_accident', String(covFood ? amountLabelToManwon(state.optLimits.음식물배상['1사고당']) : 0));
  fd.append('food_deductible', String(covFood ? amountLabelToManwon(state.optLimits.음식물배상['자기부담금']) : 0));

  const covInstall = state.optCov['행사시설 설치·해체'];
  fd.append('cov_install', covInstall ? '1' : '0');
  fd.append(
    'install_per_accident',
    String(covInstall ? amountLabelToManwon(state.optLimits['행사시설 설치·해체']['1사고당']) : 0)
  );

  const covRented = state.optCov.임차시설;
  fd.append('cov_rented', covRented ? '1' : '0');
  fd.append('rented_per_accident', String(covRented ? amountLabelToManwon(state.optLimits.임차시설['1사고당']) : 0));

  const covBailee = state.optCov.수탁물;
  fd.append('cov_bailee', covBailee ? '1' : '0');
  fd.append('bailee_per_accident', String(covBailee ? amountLabelToManwon(state.optLimits.수탁물['1사고당']) : 0));

  fd.append('budget_type', state.budgetType);
  fd.append('budget_amount', state.budgetType === '정액' ? (state.budgetAmt || '').replace(/\D/g, '') : '');

  fd.append('marketing_consent', state.cMarketing ? '1' : '0');

  if (memberId) fd.append('member_id', memberId);

  const trackingInfo = getTrackingInfo(device);
  fd.append('affiliate', trackingInfo.affiliate);
  fd.append('access_path', trackingInfo.access_path);

  fd.append('device', device);

  if (state.licenseFile) fd.append('license', state.licenseFile);
  if (state.overviewFile) fd.append('overview', state.overviewFile);
  state.amusementPhotos.forEach((file) => fd.append('amusement_photos', file));

  return fd;
}

/** 선택 특약 라벨(리뷰용) - "특약명 (1인 x/1사고 y)" */
export function optCovSummaryLabel(state: WizardState, key: OptCovKey): string {
  const lim = state.optLimits[key] || {};
  const parts: string[] = [];
  if (lim['1인당']) parts.push(`1인 ${lim['1인당']}`);
  if (lim['1사고당']) parts.push(`1사고 ${lim['1사고당']}`);
  if (lim['자기부담금']) parts.push(`자부 ${lim['자기부담금']}`);
  return parts.length ? `${key} (${parts.join('/')})` : key;
}


/** 사업자번호 입력 포맷: 000-00-00000 */
export function formatBizNoInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** 휴대폰 입력 포맷: 010-0000-0000 */
export function formatMobileInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 일반전화 입력 포맷: 02-0000-0000 / 031-000-0000 */
export function formatTelInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.startsWith('02')) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export function planDisplayName(plan: PlanKey): string {
  return plan === '직접' ? '직접입력' : plan;
}
