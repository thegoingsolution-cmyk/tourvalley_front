/**
 * 경로 유틸리티
 * 환경에 따라 basePath를 추가하여 올바른 경로를 반환
 */

/**
 * basePath를 가져옵니다
 * - 개발 환경: 빈 문자열 (로컬에서는 basePath 없음)
 * - 운영 환경: NEXT_PUBLIC_BASE_PATH 환경 변수 사용
 */
export const getBasePath = (): string => {
  // Next.js는 빌드 시점에 NEXT_PUBLIC_ 환경 변수를 번들에 포함시킴
  // 클라이언트 사이드에서도 접근 가능
  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  // 개발 환경에서는 항상 빈 문자열 반환
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  
  // 운영 환경에서는 환경 변수 값 사용
  // 디버깅
  if (typeof window !== 'undefined') {
    console.log('[getBasePath]', { 
      envBasePath,
      nodeEnv: process.env.NODE_ENV,
      isClient: typeof window !== 'undefined'
    });
  }
  
  return envBasePath;
};

/**
 * 경로에 basePath를 추가합니다
 * @param path - 상대 경로 (예: '/main')
 * @returns basePath가 추가된 경로
 */
export const addBasePath = (path: string): string => {
  const basePath = getBasePath();
  
  // basePath가 없으면 원본 경로 반환
  if (!basePath) {
    return path;
  }
  
  // basePath가 있으면 추가
  // path가 이미 basePath로 시작하는지 확인
  if (path.startsWith(basePath)) {
    return path;
  }
  
  // basePath와 path를 결합
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * 이미지 경로를 반환합니다
 * - 개발 환경: /images/logo.png
 * - 운영 환경: basePath/images/logo.png
 * @param imagePath - 이미지 경로 (예: '/images/logo.png')
 * @returns 환경에 맞는 이미지 경로
 */
export const getImagePath = (imagePath: string): string => {
  const basePath = getBasePath();
  
  // basePath가 없으면 원본 경로 반환 (로컬 환경)
  if (!basePath) {
    if (typeof window !== 'undefined') {
      // console.log('[getImagePath] 로컬 환경 - basePath 없음', { imagePath });
    }
    return imagePath;
  }
  
  // basePath가 있으면 추가 (운영 환경)
  // 이미 basePath로 시작하는지 확인
  if (imagePath.startsWith(basePath)) {
    if (typeof window !== 'undefined') {
      console.log('[getImagePath] 이미 basePath 포함', { imagePath });
    }
    return imagePath;
  }
  
  // basePath와 imagePath를 결합
  const result = `${basePath}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  
  // 디버깅 (클라이언트 사이드에서만 로그 출력)
  if (typeof window !== 'undefined') {
    console.log('[getImagePath] 최종 경로', { 
      basePath, 
      imagePath, 
      result,
      env: process.env.NEXT_PUBLIC_BASE_PATH,
      nodeEnv: process.env.NODE_ENV
    });
  }
  
  return result;
};

