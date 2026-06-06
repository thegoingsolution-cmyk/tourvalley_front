/** coverage-detail URL 쿼리에서 실손(국내의료비) 포함 여부 파싱 */

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
