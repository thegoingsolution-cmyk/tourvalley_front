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
  const birthDate = new Date(year, month - 1, day);

  // 만나이 계산
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
    age--;
  }

  // 보험나이: 만나이에서 6개월이 경과하면 +1
  const sixMonthsLater = new Date(birthDate);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  if (today >= sixMonthsLater) {
    age++;
  }

  return age;
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
  let centuryPrefix = 1900;

  // 내국인: 1,2 (1900년대), 3,4 (2000년대)
  // 외국인: 5,6 (1900년대), 7,8 (2000년대)
  if (genderCode === 1 || genderCode === 2) {
    centuryPrefix = 1900;
    gender = genderCode === 1 ? '남자' : '여자';
  } else if (genderCode === 3 || genderCode === 4) {
    centuryPrefix = 2000;
    gender = genderCode === 3 ? '남자' : '여자';
  } else if (genderCode === 5 || genderCode === 6) {
    centuryPrefix = 1900;
    gender = genderCode === 5 ? '남자' : '여자';
  } else if (genderCode === 7 || genderCode === 8) {
    centuryPrefix = 2000;
    gender = genderCode === 7 ? '남자' : '여자';
  }

  const fullBirthYear = centuryPrefix + birthYear;
  const age = calculateInsuranceAge(fullBirthYear, birthMonth, birthDay);

  return { age, gender };
};
