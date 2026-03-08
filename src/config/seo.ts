/**
 * SEO 공통 설정 (네이버 서치어드바이저, 구글 검색 대응)
 * - NEXT_PUBLIC_SITE_URL: 실제 서비스 도메인 (예: https://www.tourvalley.net)
 * - NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: 구글 Search Console 소유 확인 메타 content 값
 * - NEXT_PUBLIC_NAVER_SITE_VERIFICATION: 네이버 서치어드바이저 소유 확인 메타 content 값
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tourvalley.net';

export const VERIFICATION = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || undefined,
};

export const SEO_DEFAULT = {
  title: '투어밸리 여행자보험 - 국내·해외·장기체류 실시간 가입',
  description:
    '투어밸리에서 국내여행자보험, 해외여행자보험, 해외장기체류보험을 실시간으로 비교하고 가입하세요. 단체(법인) 보험, 개인 보험 한 번에.',
  keywords: [
    '여행자보험',
    '국내여행자보험',
    '해외여행자보험',
    '해외장기체류보험',
    '단체여행자보험',
    '투어밸리',
    '실시간 가입',
  ].join(', '),
  openGraph: {
    type: 'website' as const,
    locale: 'ko_KR',
    siteName: '투어밸리 여행자보험',
  },
};
