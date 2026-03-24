/**
 * 비회원 계약 조회(휴대폰 인증 후)와 계약 상세 팝업이 같은 origin에서 공유할 수 있도록
 * localStorage에 저장합니다. (sessionStorage는 새 창과 공유되지 않음)
 */
export const NON_MEMBER_CONTRACT_AUTH_KEY = 'b2c_non_member_contract_auth_v1';

export type NonMemberContractAuth =
  | {
      loginType: 'I';
      insuredName: string;
      birthDate: string;
      gender: string;
      phone: string;
      verifiedAt: number;
    }
  | {
      loginType: 'C';
      companyName: string;
      businessNumber: string;
      phone: string;
      verifiedAt: number;
    };

export function saveNonMemberContractAuth(
  auth: Omit<NonMemberContractAuth, 'verifiedAt'>
): void {
  if (typeof window === 'undefined') return;
  const payload = { ...auth, verifiedAt: Date.now() } as NonMemberContractAuth;
  try {
    localStorage.setItem(NON_MEMBER_CONTRACT_AUTH_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readNonMemberContractAuth(): NonMemberContractAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(NON_MEMBER_CONTRACT_AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as NonMemberContractAuth;
    const maxAge = 24 * 60 * 60 * 1000;
    if (typeof data.verifiedAt !== 'number' || Date.now() - data.verifiedAt > maxAge) {
      clearNonMemberContractAuth();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearNonMemberContractAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(NON_MEMBER_CONTRACT_AUTH_KEY);
  } catch {
    /* ignore */
  }
}

/** 폼 6자리 생년월일 → 목록/상세 API용 YYYYMMDD */
export function buildFullBirthDateFromSixDigits(birthDate: string): string {
  if (birthDate.length !== 6) return '';
  const year = parseInt(birthDate.substring(0, 2), 10);
  const currentYear = new Date().getFullYear();
  const currentYearLastTwo = currentYear % 100;
  const fullYear = year > currentYearLastTwo ? 1900 + year : 2000 + year;
  return `${fullYear}${birthDate.substring(2, 6)}`;
}
