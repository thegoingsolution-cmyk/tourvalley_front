/**
 * 파일 업로드 서비스
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// 업로드 타입
export type UploadType = 'business' | 'contracts' | 'images';

// 업로드 응답 타입
export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
  };
}

/**
 * 파일 업로드
 * @param file 업로드할 파일
 * @param type 업로드 타입 (business, contracts, images)
 */
export const uploadFile = async (file: File, type: UploadType): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload/${type}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return {
      success: false,
      message: '파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
};

/**
 * 파일 삭제
 * @param type 업로드 타입
 * @param filename 파일명
 */
export const deleteFile = async (type: UploadType, filename: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload/${type}/${filename}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    return {
      success: false,
      message: '파일 삭제에 실패했습니다.',
    };
  }
};

export default {
  uploadFile,
  deleteFile,
};

