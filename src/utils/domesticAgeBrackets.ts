/** 국내여행보험 나이 구간 — 실손·비실손 공통 (3구간) */

export const DOMESTIC_SILSOK_AGE = {
  adultMin: 15,
  adultMax: 79,
  seniorMin: 80,
  seniorMax: 100,
} as const;

export function isDomesticMedicalExpenseOn(hasMedicalExpense?: boolean | number | string | null): boolean {
  return hasMedicalExpense !== 0 && hasMedicalExpense !== false && hasMedicalExpense !== '0';
}

/** 플랜 동기화 코호트: 성인(실속/표준) 구간 */
export function isDomesticAdultSyncCohort(age: number, _hasMedicalExpense = true): boolean {
  return age >= DOMESTIC_SILSOK_AGE.adultMin && age <= DOMESTIC_SILSOK_AGE.adultMax;
}

/** 플랜 동기화 코호트: 어르신 구간 */
export function isDomesticSeniorSyncCohort(age: number, _hasMedicalExpense = true): boolean {
  return age >= DOMESTIC_SILSOK_AGE.seniorMin && age <= DOMESTIC_SILSOK_AGE.seniorMax;
}

export function getDomesticSeniorAgeThreshold(_hasMedicalExpense?: boolean | number | string | null): number {
  return DOMESTIC_SILSOK_AGE.seniorMin;
}
