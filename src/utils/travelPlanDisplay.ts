/** confirmation 등에서 플랜명 표시 — 비실손만 (비실손) 접미사 */
export function formatConfirmationPlanLabel(planType: string, hasMedicalExpense = true): string {
  const base = (planType ?? '').trim();
  if (!base) return '';
  if (!hasMedicalExpense) return `${base}(비실손)`;
  return base;
}

export function parseHasMedicalExpense(value: unknown, defaultValue = true): boolean {
  if (value === undefined || value === null) return defaultValue;
  if (value === false || value === 0 || value === '0') return false;
  if (value === true || value === 1 || value === '1') return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'false' || normalized === 'no') return false;
    if (normalized === 'true' || normalized === 'yes') return true;
  }
  return defaultValue;
}

export function buildPlanCoverageKey(planType: string, hasMedicalExpense: boolean): string {
  return `${planType.trim()}::${hasMedicalExpense ? '1' : '0'}`;
}

export function normalizeConfirmationInsuranceType(raw?: string | null): string {
  const value = raw ?? '국내여행보험';
  if (value === '해외여행' || value === '해외여행자보험') return '해외여행보험';
  if (value === '국내여행자보험') return '국내여행보험';
  return value;
}

export function needsMedicalExpenseDistinction(insuranceType: string): boolean {
  return insuranceType === '국내여행보험' || insuranceType === '해외여행보험';
}

export function buildCoverageDetailsRequestBody(
  insuranceType: string,
  planType: string,
  hasMedicalExpense: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    insurance_type: insuranceType,
    plan_type: planType,
    plan_variant: insuranceType === '국내여행보험' ? 'B' : null,
  };
  if (needsMedicalExpenseDistinction(insuranceType)) {
    body.is_medical_expense = hasMedicalExpense;
  }
  return body;
}

/** coverage-details API 조회 시 plan_type 후보 (레거시 DB 호환) */
export function getCoverageDetailPlanTypeCandidates(planType: string): string[] {
  const base = (planType ?? '').trim();
  if (!base) return [];
  const candidates = [base];
  if (base === '어르신플랜1(실속)' || base === '어르신플랜1(표준)') {
    candidates.push('어르신플랜1');
  }
  return Array.from(new Set(candidates));
}
