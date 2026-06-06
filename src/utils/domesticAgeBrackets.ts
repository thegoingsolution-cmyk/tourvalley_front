/** 국내여행보험 나이 구간 — 실손(has_medical_expense=1) vs 비실손(=0) */

export const DOMESTIC_SILSOK_AGE = {
  adultMin: 15,
  adultMax: 79,
  seniorMin: 80,
  seniorMax: 100,
} as const;

export const DOMESTIC_BISILSOK_AGE = {
  adultMin: 15,
  adultMax: 70,
  senior1Min: 71,
  senior1Max: 90,
  senior2Min: 91,
  senior2Max: 100,
} as const;

export function isDomesticMedicalExpenseOn(hasMedicalExpense?: boolean | number | string | null): boolean {
  return hasMedicalExpense !== 0 && hasMedicalExpense !== false && hasMedicalExpense !== '0';
}

/** 플랜 동기화 코호트: 성인(실속/표준) 구간 */
export function isDomesticAdultSyncCohort(age: number, hasMedicalExpense = true): boolean {
  const silsok = isDomesticMedicalExpenseOn(hasMedicalExpense);
  if (silsok) {
    return age >= DOMESTIC_SILSOK_AGE.adultMin && age <= DOMESTIC_SILSOK_AGE.adultMax;
  }
  return age >= DOMESTIC_BISILSOK_AGE.adultMin && age <= DOMESTIC_BISILSOK_AGE.adultMax;
}

/** 플랜 동기화 코호트: 어르신 구간 */
export function isDomesticSeniorSyncCohort(age: number, hasMedicalExpense = true): boolean {
  const silsok = isDomesticMedicalExpenseOn(hasMedicalExpense);
  return silsok ? age >= DOMESTIC_SILSOK_AGE.seniorMin : age >= DOMESTIC_BISILSOK_AGE.senior1Min;
}

export function getDomesticSeniorAgeThreshold(hasMedicalExpense?: boolean | number | string | null): number {
  return isDomesticMedicalExpenseOn(hasMedicalExpense)
    ? DOMESTIC_SILSOK_AGE.seniorMin
    : DOMESTIC_BISILSOK_AGE.senior1Min;
}
