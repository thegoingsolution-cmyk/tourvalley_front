export const isMobileDevice = (): boolean => {
  // 화면 크기로 먼저 체크 (개발자 도구 모바일 모드에서도 작동)
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return true;
  }
  
  // userAgent 체크 (실제 모바일 기기)
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (nav.userAgentData && typeof nav.userAgentData.mobile === 'boolean') {
    return nav.userAgentData.mobile;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent);
};
