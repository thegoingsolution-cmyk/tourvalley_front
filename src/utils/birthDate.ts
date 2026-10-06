/** 앞 8자리가 실제 달력상 YYYYMMDD인지 */
export function isYyyyMmDdPrefix(digits: string): boolean {
  if (digits.length < 8) return false;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (year < 1900 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const birth = new Date(year, month - 1, day);
  return birth.getFullYear() === year && birth.getMonth() === month - 1 && birth.getDate() === day;
}

/**
 * 주민번호·생년월일 문자열에서 표시용 YYMMDD 6자리.
 * 13자리(YYMMDD+뒷7)는 앞 6자리, YYYYMMDD는 세기 두 자리를 뺀다.
 */
export function toDisplayYyMmDd(value?: string | null): string {
  if (!value) return '';
  const digits = String(value).replace(/[^0-9]/g, '');
  if (digits.length < 6) return '';
  if (digits.length !== 13 && isYyyyMmDdPrefix(digits)) return digits.slice(2, 8);
  return digits.slice(0, 6);
}

/**
 * 주민/외국인등록번호에서 YYYYMMDD와 성별.
 * 외국인 세기: 남5·여6=1900, 남7·여8=2000. 내국인 1·2=1900, 3·4=2000.
 * 15자리(YYYYMMDD+뒷7)는 앞 8자리를 쓰고, 13자리는 성별코드로 세기를 붙인다.
 */
export function parseResidentBirth(resident?: string | null): { birthDate: string; gender: 'M' | 'W' | null } {
  if (!resident) return { birthDate: '', gender: null };
  const digits = String(resident).replace(/[^0-9]/g, '');
  if (digits.length < 7) return { birthDate: '', gender: null };

  const storedAsYyyyMmDd = digits.length !== 13 && isYyyyMmDdPrefix(digits);
  const genderDigit = parseInt(storedAsYyyyMmDd ? digits[8] : digits[6], 10);
  let birthDate = '';
  if (storedAsYyyyMmDd) {
    birthDate = digits.slice(0, 8);
  } else {
    const yy = parseInt(digits.slice(0, 2), 10);
    const mmdd = digits.slice(2, 6);
    if (!Number.isNaN(yy)) {
      const century = [3, 4, 7, 8].includes(genderDigit) ? 2000 : 1900;
      birthDate = `${century + yy}${mmdd}`;
    }
  }

  let gender: 'M' | 'W' | null = null;
  if ([1, 3, 5, 7].includes(genderDigit)) gender = 'M';
  else if ([2, 4, 6, 8].includes(genderDigit)) gender = 'W';
  return { birthDate, gender };
}

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
