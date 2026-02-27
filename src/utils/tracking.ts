/**
 * 네이버 검색 광고 유입 여부를 확인하고 세션 스토리지에 저장
 * 메인 페이지에서 호출하여 URL 파라미터를 체크하고 저장
 */
export const checkAndSaveTrackingInfo = (): void => {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  
  // 네이버 검색 광고 유입 확인
  // utm_source=naver 또는 utm_medium=cpc인 경우 네이버 검색 광고로 판단
  if (utmSource === 'naver' || utmMedium === 'cpc') {
    sessionStorage.setItem('tracking_affiliate', '네이버검색광고');
    sessionStorage.setItem('tracking_access_path', '네이버');
  } else {
    // 기본값 저장 (한 번만 저장하도록 체크)
    if (!sessionStorage.getItem('tracking_affiliate')) {
      sessionStorage.setItem('tracking_affiliate', '투어밸리');
      sessionStorage.setItem('tracking_access_path', '투어밸리 사이트');
    }
  }
};

/**
 * 세션 스토리지에서 추적 정보 가져오기
 * @param device 'PC' | '모바일' | 'Mobile' - 디바이스 타입 (기본값: 'PC')
 * @returns {affiliate: string, access_path: string} 추적 정보
 */
export const getTrackingInfo = (device: 'PC' | '모바일' | 'Mobile' = 'PC'): { affiliate: string; access_path: string } => {
  if (typeof window === 'undefined') {
    const defaultAccessPath = device === 'PC' ? '투어밸리 사이트' : '투어밸리 모바일 사이트';
    return {
      affiliate: '투어밸리',
      access_path: defaultAccessPath,
    };
  }

  // 세션 스토리지에서 읽기
  const affiliate = sessionStorage.getItem('tracking_affiliate') || '투어밸리';
  let accessPath = sessionStorage.getItem('tracking_access_path');
  
  // access_path가 없거나 네이버가 아닌 경우 device에 따라 기본값 설정
  if (!accessPath || (affiliate !== '네이버검색광고' && accessPath === '네이버')) {
    accessPath = device === 'PC' ? '투어밸리 사이트' : '투어밸리 모바일 사이트';
  }

  return {
    affiliate,
    access_path: accessPath,
  };
};
