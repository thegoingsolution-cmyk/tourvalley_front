/**
 * 피보험자 생년월일(YYYYMMDD 8자리) 검증: 형식·실제 존재하는 날짜이며 미래 출생 불가.
 */
export function isValidBirthDateYYYYMMDD(value: string): boolean {
  if (!/^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/.test(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const birth = new Date(year, month - 1, day);
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return false;
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const birthStart = new Date(year, month - 1, day);
  if (birthStart > todayStart) {
    return false;
  }
  return true;
}
