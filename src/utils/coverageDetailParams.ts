/** coverage-detail URL 쿼리에서 실손(국내의료비) 포함 여부 파싱 */

/** 화면 표시용 플랜명 → API plan_type (예: 표준플랜(국내실손 포함) → 표준플랜) */
export function resolvePlanTypeForCoverageApi(displayPlanType: string): string {
  const stripped = displayPlanType
    .replace(/\(국내실손 포함\)$/, '')
    .replace(/\(국내실손 제외\)$/, '')
    .trim();
  if (stripped === '고보장플랜') return '고급플랜';
  return stripped || displayPlanType;
}

/** 표시용 플랜명에서 실손 여부 추출. 접미사가 없으면 fallback 사용 */
export function resolveMedicalExpenseFromPlanDisplay(
  displayPlanType: string,
  fallback: boolean,
): boolean {
  if (displayPlanType.includes('(국내실손 포함)')) return true;
  if (displayPlanType.includes('(국내실손 제외)')) return false;
  return fallback;
}

export function parseMedicalExpenseSearchParam(
  searchParams: Pick<URLSearchParams, 'get'>,
): boolean | undefined {
  const raw =
    searchParams.get('hasMedicalExpense') ??
    searchParams.get('isMedicalExpense') ??
    searchParams.get('has_medical_expense');

  if (raw === null || raw.trim() === '') return undefined;

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;

  return undefined;
}

export function resolveMedicalExpenseForCoverageDetail(
  searchParams: Pick<URLSearchParams, 'get'>,
  needsMedicalExpenseDistinction: boolean,
  defaultValue = true,
): boolean | undefined {
  const parsed = parseMedicalExpenseSearchParam(searchParams);
  if (!needsMedicalExpenseDistinction) return undefined;
  return parsed ?? defaultValue;
}
