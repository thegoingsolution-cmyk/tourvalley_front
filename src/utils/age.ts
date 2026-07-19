/**
 * 보험나이 계산 유틸리티
 * - 보험나이: 만나이에서 생일로부터 6개월이 경과하면 +1
 * - 개별보험, 단체보험 모두 동일한 기준 적용
 */

/**
 * 생년월일(년, 월, 일)로 보험나이 계산
 * @param year 출생년도 (4자리, 예: 1967)
 * @param month 출생월 (1-12)
 * @param day 출생일
 * @returns 보험나이
 */
export const calculateInsuranceAge = (year: number, month: number, day: number): number => {
  const today = new Date();

  // 만나이 계산
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
    age--;
  }

  // 보험나이: 만나이에서 6개월이 경과하면 +1
  const lastBirthday = new Date(today.getFullYear(), month - 1, day);
  if (today < lastBirthday) {
    lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
  }
  const sixMonthsLater = new Date(lastBirthday);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  if (today >= sixMonthsLater) {
    age++;
  }

  return age;
};

/** 외국인등록번호(성별코드 5~8) 세기: YY 50 이상 1900년대, 미만 2000년대 — 단체/개인 플로우 공통 */
const resolveForeignerCenturyPrefix = (yy: number): number => (yy >= 50 ? 1900 : 2000);

/** 주민/외국인등록번호 7번째 성별코드와 YY로 출생 세기 판별 */
const resolveCenturyPrefixFromGenderCode = (yy: number, genderCode: number): number => {
  if (genderCode >= 5 && genderCode <= 8) {
    return resolveForeignerCenturyPrefix(yy);
  }
  if (genderCode === 3 || genderCode === 4) return 2000;
  return 1900;
};

/**
 * 주민번호에서 보험나이와 성별 계산
 * @param residentNumber 주민등록번호 (앞 7자리 이상)
 * @returns { age: 보험나이, gender: '남자' | '여자' }
 */
export const calculateAgeAndGenderFromResidentNumber = (
  residentNumber: string
): { age: number; gender: '남자' | '여자' } => {
  if (!residentNumber || residentNumber.length < 7) {
    return { age: 0, gender: '남자' };
  }

  const birthYear = parseInt(residentNumber.substring(0, 2), 10);
  const birthMonth = parseInt(residentNumber.substring(2, 4), 10);
  const birthDay = parseInt(residentNumber.substring(4, 6), 10);
  const genderCode = parseInt(residentNumber.substring(6, 7), 10);

  let gender: '남자' | '여자' = '남자';

  // 내국인: 1,2 (1900년대), 3,4 (2000년대)
  // 외국인: 5,6 (남/여), 7,8 (남/여) — 세기는 YY 50 기준(공통 규칙)
  if (genderCode === 1 || genderCode === 2) {
    gender = genderCode === 1 ? '남자' : '여자';
  } else if (genderCode === 3 || genderCode === 4) {
    gender = genderCode === 3 ? '남자' : '여자';
  } else if (genderCode === 5 || genderCode === 6) {
    gender = genderCode === 5 ? '남자' : '여자';
  } else if (genderCode === 7 || genderCode === 8) {
    gender = genderCode === 7 ? '남자' : '여자';
  }

  const centuryPrefix = resolveCenturyPrefixFromGenderCode(birthYear, genderCode);
  const fullBirthYear = centuryPrefix + birthYear;
  const age = calculateInsuranceAge(fullBirthYear, birthMonth, birthDay);

  return { age, gender };
};

/**
 * 개인 여행 플로우 Participant — 보험료/플랜 API에 넣을 성별.
 * 내국인은 화면 성별 선택 값을 쓴다.
 * 외국인은 성별 입력 UI가 없고 외국인등록번호 7번째 자리 규칙(5·6 또는 7·8)과 동일하다.
 */
export const getPremiumGenderFromParticipant = (participant: {
  nationality?: string;
  gender: '남자' | '여자';
  residentNumber?: string;
}): '남자' | '여자' => {
  if (participant.nationality !== '외국인') return participant.gender;
  const digits = (participant.residentNumber ?? '').replace(/\D/g, '');
  if (digits.length < 7) return participant.gender;
  return calculateAgeAndGenderFromResidentNumber(digits).gender;
};

/**
 * 주민등록번호에서 생년월일 문자열(YYYYMMDD) 반환
 * available-plans API의 만 나이 기준 15세 판별용
 */
export const getBirthDateStringFromResidentNumber = (residentNumber: string): string | null => {
  if (!residentNumber || residentNumber.length < 7) return null;
  const birthYear = parseInt(residentNumber.substring(0, 2), 10);
  const birthMonth = residentNumber.substring(2, 4);
  const birthDay = residentNumber.substring(4, 6);
  const genderCode = parseInt(residentNumber.substring(6, 7), 10);
  const centuryPrefix = resolveCenturyPrefixFromGenderCode(birthYear, genderCode);
  const fullYear = centuryPrefix + birthYear;
  return `${fullYear}${birthMonth}${birthDay}`;
};

/**
 * step2 localStorage 데이터에서 가입자 상세보기용 성별·생년월일 반환.
 * 외국인은 성별/생년월일 입력 UI가 없고 외국인등록번호(5·6·7·8 성별코드)에서 추출한다.
 */
export const resolveInsuredDisplayInfoFromStep2 = (
  step2Data: Record<string, string | number | undefined>,
  index: number
): { gender: '남자' | '여자'; birthDate: string } => {
  const countryType = String(step2Data[`insured_country_type_${index}`] ?? 'D');

  if (countryType === 'F') {
    const ssn1 = String(step2Data[`insured_ssn1_${index}`] ?? '');
    const ssn2 = String(step2Data[`insured_ssn2_${index}`] ?? '');
    const residentNumber = ssn1 + ssn2;
    const { gender } = calculateAgeAndGenderFromResidentNumber(residentNumber);
    const birthDate = getBirthDateStringFromResidentNumber(residentNumber) ?? '';
    return { gender, birthDate };
  }

  return {
    gender: (step2Data[`insured_gender_${index}`] as '남자' | '여자') || '남자',
    birthDate: String(step2Data[`insured_birth_${index}`] ?? ''),
  };
};
