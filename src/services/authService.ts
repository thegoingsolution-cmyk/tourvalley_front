/**
 * 회원 인증 서비스
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CheckUsernameResponse {
  success: boolean;
  message: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  memberId?: number;
}

interface MemberInfo {
  id: number;
  member_type: string;
  username: string;
  name: string;
  birth_date?: string;
  gender?: string;
  email: string;
  email_domain?: string;
  mobile_phone: string;
  mileage: number;
  accident_free_cash: number;
  marketing_agreed?: boolean;
  email_receive?: boolean;
  sms_receive?: boolean;
  status: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  member?: MemberInfo;
}

interface FindIdResponse {
  success: boolean;
  message: string;
  username?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface PersonalMemberData {
  username: string;
  password: string;
  name: string;
  birthDate?: string;
  gender?: string;
  email: string;
  emailDomain?: string;
  phone: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
}

interface CorporateContact {
  name: string;
  department?: string;
  position?: string;
  email?: string;
  emailDomain?: string;
  phone?: string;
}

interface CorporateMemberData {
  username: string;
  password: string;
  companyName: string;
  businessNumber: string;
  contacts: CorporateContact[];
  comprehensiveContract: 'apply' | 'not_apply' | null;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  primaryPhone: string;
  businessFilePath?: string;  // 사업자등록증 파일 경로
  businessFileName?: string;  // 사업자등록증 원본 파일명
}

/**
 * 아이디 중복 확인
 */
export const checkUsername = async (username: string): Promise<CheckUsernameResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('아이디 중복확인 오류:', error);
    return {
      success: false,
      message: '아이디 확인에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 개인회원 가입
 */
export const registerPersonalMember = async (data: PersonalMemberData): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/personal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        email: data.email,
        emailDomain: data.emailDomain,
        phone: data.phone.replace(/-/g, ''),
        termsAgreed: data.termsAgreed,
        privacyAgreed: data.privacyAgreed,
        marketingAgreed: data.marketingAgreed,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('개인회원 가입 오류:', error);
    return {
      success: false,
      message: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 법인회원 가입
 */
export const registerCorporateMember = async (data: CorporateMemberData): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/corporate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        companyName: data.companyName,
        businessNumber: data.businessNumber,
        contacts: data.contacts.map(c => ({
          name: c.name,
          department: c.department,
          position: c.position,
          email: c.email,
          emailDomain: c.emailDomain,
          phone: c.phone?.replace(/-/g, ''),
        })),
        comprehensiveContract: data.comprehensiveContract,
        termsAgreed: data.termsAgreed,
        privacyAgreed: data.privacyAgreed,
        marketingAgreed: data.marketingAgreed,
        primaryPhone: data.primaryPhone.replace(/-/g, ''),
        businessFilePath: data.businessFilePath,
        businessFileName: data.businessFileName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('법인회원 가입 오류:', error);
    return {
      success: false,
      message: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 로그인
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('로그인 오류:', error);
    return {
      success: false,
      message: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 아이디 찾기
 */
export const findMemberId = async (data: {
  memberType: 'I' | 'C';
  name?: string;
  companyName?: string;
  businessNumber?: string;
  birthDate?: string;
  gender?: string;
  phoneNumber: string;
}): Promise<FindIdResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/find-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        phoneNumber: data.phoneNumber.replace(/-/g, ''),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('아이디 찾기 오류:', error);
    return { success: false, message: '아이디 찾기에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
};

/**
 * 비밀번호 재설정 본인 확인
 */
export const verifyResetPassword = async (data: {
  memberType: 'I' | 'C';
  username: string;
  name?: string;
  companyName?: string;
  businessNumber?: string;
  birthDate?: string;
  gender?: string;
  phoneNumber: string;
}): Promise<ResetPasswordResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        phoneNumber: data.phoneNumber.replace(/-/g, ''),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('비밀번호 재설정 확인 오류:', error);
    return { success: false, message: '비밀번호 재설정 확인에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
};

/**
 * 비밀번호 재설정
 */
export const confirmResetPassword = async (data: {
  memberType: 'I' | 'C';
  username: string;
  name?: string;
  companyName?: string;
  businessNumber?: string;
  birthDate?: string;
  gender?: string;
  phoneNumber: string;
  newPassword: string;
}): Promise<ResetPasswordResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        phoneNumber: data.phoneNumber.replace(/-/g, ''),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    return { success: false, message: '비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
};

interface UpdateMemberData {
  password?: string;
  email?: string;
  emailDomain?: string;
  mobilePhone?: string;
  marketingAgreed?: boolean;
  emailReceive?: boolean;
  smsReceive?: boolean;
}

interface UpdateMemberResponse {
  success: boolean;
  message: string;
  member?: MemberInfo;
}

/**
 * 회원 정보 수정
 */
export const updateMember = async (memberId: number, data: UpdateMemberData): Promise<UpdateMemberResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/member/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: data.password,
        email: data.email,
        emailDomain: data.emailDomain,
        mobilePhone: data.mobilePhone?.replace(/-/g, ''),
        marketingAgreed: data.marketingAgreed,
        emailReceive: data.emailReceive,
        smsReceive: data.smsReceive,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('회원 정보 수정 오류:', error);
    return {
      success: false,
      message: '회원 정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

// 법인회원 정보 타입
export interface CorporateInfo {
  id: number;
  company_name: string;
  business_number: string;
  comprehensive_contract: boolean;
  business_file_path?: string | null;
  business_file_name?: string | null;
}

export interface ContactInfo {
  id: number;
  contact_name: string;
  department: string | null;
  position: string | null;
  email: string | null;
  mobile_phone: string | null;
  is_primary: boolean;
}

interface GetCorporateInfoResponse {
  success: boolean;
  message: string;
  corporate?: CorporateInfo;
  contacts?: ContactInfo[];
}

/**
 * 법인회원 정보 조회
 */
export const getCorporateMemberInfo = async (memberId: number): Promise<GetCorporateInfoResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/corporate/${memberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('법인회원 정보 조회 오류:', error);
    return {
      success: false,
      message: '법인회원 정보 조회에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

interface UpdateCorporateMemberData {
  password?: string;
  contacts?: {
    id?: number;
    contact_name: string;
    department?: string;
    position?: string;
    email?: string;
    emailDomain?: string;
    mobile_phone?: string;
  }[];
  comprehensiveContract?: boolean;
  marketingAgreed?: boolean;
  emailReceive?: boolean;
  smsReceive?: boolean;
  businessFilePath?: string;
  businessFileName?: string;
}

interface UpdateCorporateMemberResponse {
  success: boolean;
  message: string;
}

interface WithdrawMemberResponse {
  success: boolean;
  message: string;
}

/**
 * 법인회원 정보 수정
 */
export const updateCorporateMember = async (
  memberId: number,
  data: UpdateCorporateMemberData
): Promise<UpdateCorporateMemberResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/corporate/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('법인회원 정보 수정 오류:', error);
    return {
      success: false,
      message: '법인회원 정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 회원 탈퇴 (soft delete)
 */
export const withdrawMember = async (memberId: number): Promise<WithdrawMemberResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/withdraw/${memberId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    return {
      success: false,
      message: '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

export default {
  login,
  checkUsername,
  registerPersonalMember,
  registerCorporateMember,
  updateMember,
  getCorporateMemberInfo,
  updateCorporateMember,
  withdrawMember,
};

