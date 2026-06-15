import type { PlanType } from '@/components/travel/types';

/** 국내: 일반 실속/표준 ↔ 어르신플랜1(실속)/(표준) — 실손·비실손 공통 80~100세 */
export const DOMESTIC_PLAN_TIER_ORDER: { 실속: readonly string[]; 표준: readonly string[] } = {
  실속: ['실속플랜', '어르신플랜1(실속)', '어르신플랜1'],
  표준: ['표준플랜', '어르신플랜1(표준)'],
};

export function getDomesticPlanTier(plan: string): '실속' | '표준' | null {
  if (DOMESTIC_PLAN_TIER_ORDER.실속.includes(plan)) return '실속';
  if (DOMESTIC_PLAN_TIER_ORDER.표준.includes(plan)) return '표준';
  return null;
}

export function pickDomesticPlanForTier(availablePlans: string[], tier: '실속' | '표준'): string | null {
  for (const c of DOMESTIC_PLAN_TIER_ORDER[tier]) {
    if (availablePlans.includes(c)) return c;
  }
  return null;
}

export function resolveDomesticPlanForParticipant(
  selectedPlan: PlanType | null,
  availablePlans: string[]
): string {
  if (availablePlans.length === 0) return '실속플랜';
  if (!selectedPlan) return availablePlans[0];
  if (availablePlans.includes(selectedPlan)) return selectedPlan;
  const tier = getDomesticPlanTier(selectedPlan);
  if (tier) {
    const picked = pickDomesticPlanForTier(availablePlans, tier);
    if (picked) return picked;
  }
  return availablePlans[0];
}

export function isDomesticTravelInsuranceUi(insuranceType?: string) {
  return (
    insuranceType === '국내여행자보험' ||
    insuranceType === '국내여행보험' ||
    insuranceType === '단체여행자보험 - 국내여행'
  );
}

/** 단체용 카드 키(실속/표준/고급) ↔ 해당 버킷의 실제 DB plan_type (보장상세·저장용) */
const GROUP_PLAN_TIER_CARD_KEYS = new Set(['실속플랜', '표준플랜', '고급플랜']);

export function resolveGroupTierBucketDbPlanType(
  tierCardKey: string,
  bucket?: Array<{ planType: string }>
): string {
  if (!bucket?.length) return tierCardKey;
  const unique = Array.from(new Set(bucket.map((r) => r.planType)));
  if (unique.length === 1) return unique[0];
  const specific = unique.filter((t) => !GROUP_PLAN_TIER_CARD_KEYS.has(t));
  if (specific.length >= 1) return specific[0];
  return unique[0];
}

/** 피보험자별 버킷 행에서 plan_type 조회 (계약 저장 시) */
export function findGroupBucketPlanTypeForInsured(
  insured: { name?: string; birthDate?: string; birth_date?: string },
  tierCardKey: string | null | undefined,
  participantPremiumsByPlan: Record<string, Array<{ name: string; birthDate: string; planType: string }>>
): string | undefined {
  if (!tierCardKey) return undefined;
  const bucket = participantPremiumsByPlan[tierCardKey];
  if (!bucket?.length) return undefined;
  const name = insured.name;
  const birth = String(insured.birthDate || insured.birth_date || '').replace(/[^0-9]/g, '');
  if (name && birth) {
    const row = bucket.find(
      (r) => r.name === name && String(r.birthDate || '').replace(/[^0-9]/g, '') === birth
    );
    if (row?.planType) return row.planType;
  }
  return undefined;
}

/** UI 카드 선택 표시: step1에서 표준만 골라도 시니어 카드(어르신플랜1(표준))와 동급 강조 */
export function isDomesticPlanCardSelected(
  selectedPlan: PlanType | null,
  cardPlan: string,
  insuranceType?: string
): boolean {
  if (!selectedPlan) return false;
  if (selectedPlan === cardPlan) return true;
  if (!isDomesticTravelInsuranceUi(insuranceType)) return false;
  const ts = getDomesticPlanTier(selectedPlan);
  const tc = getDomesticPlanTier(cardPlan);
  return ts !== null && ts === tc;
}
