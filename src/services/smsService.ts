/**
 * SMS 인증 서비스
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SendVerificationResponse {
  success: boolean;
  message: string;
  code?: string; // 테스트 모드에서만 반환
}

interface VerifyCodeResponse {
  success: boolean;
  message: string;
}

interface VerificationStatusResponse {
  success: boolean;
  verified: boolean;
  expiresAt?: string;
}

/**
 * 인증번호 발송
 */
export const sendVerificationCode = async (
  phoneNumber: string,
  testmode: boolean = false
): Promise<SendVerificationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber.replace(/-/g, ''),
        testmode,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('인증번호 발송 오류:', error);
    return {
      success: false,
      message: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 인증번호 확인
 */
export const verifyCode = async (
  phoneNumber: string,
  code: string
): Promise<VerifyCodeResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sms/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber.replace(/-/g, ''),
        code,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('인증번호 확인 오류:', error);
    return {
      success: false,
      message: '인증 확인에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 인증 상태 확인
 */
export const checkVerificationStatus = async (
  phoneNumber: string
): Promise<VerificationStatusResponse> => {
  try {
    const cleanPhone = phoneNumber.replace(/-/g, '');
    const response = await fetch(`${API_BASE_URL}/api/sms/status/${cleanPhone}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    return {
      success: false,
      verified: false,
    };
  }
};

export default {
  sendVerificationCode,
  verifyCode,
  checkVerificationStatus,
};

