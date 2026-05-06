/**
 * UTM·ref 등으로 유입 채널을 확인하고 세션 스토리지에 저장
 * (레이아웃·메인·견적 step1 등에서 호출)
 *
 * 인플루언서: ?ref=토큰 (또는 utm_source=동일토큰) → 아래 INFLUENCER_REF_MAP 매핑
 * 네이버 검색 광고(유료): utm_medium=cpc (캠페인별 utm_campaign 분기)
 *   - utm_campaign=tourvalley_kw 또는 투어밸리 → 투어밸리검색광고(브랜드 키워드 SA 집계용)
 *   - 그 외 cpc → 네이버검색광고
 * 네이버 자연/검색 유입: ?NaPm=…(통합검색 클릭 추적) 또는 utm_source=naver 단독(CPC 아님)
 */

/** 네이버 SA 최종 URL의 utm_campaign: ASCII는 tourvalley_kw 권장, 한글 캠페인명은 투어밸리 */
function isNaverTourvalleyKeywordSaCampaign(utmCampaignRaw: string | null): boolean {
  if (!utmCampaignRaw) return false;
  let key = utmCampaignRaw.trim();
  try {
    key = decodeURIComponent(key).trim();
  } catch {
    /* utm_campaign 원문 사용 */
  }
  if (key === '투어밸리') return true;
  if (key.toLowerCase() === 'tourvalley_kw') return true;
  return false;
}

/** ref / utm_source에 쓰는 불투명 토큰 → DB에 넣을 affiliate, access_path */
const INFLUENCER_REF_MAP: Record<string, { affiliate: string; access_path: string }> = {
  // 예: 블로그
  '7k2m9x4p': { affiliate: '한상윤블로그', access_path: '블로그' },
  'i3s9m2n8': { affiliate: '이상민블로그', access_path: '블로그' },
  // 새 인플루언서 추가 시: 고유 토큰 발급 후 한 줄 추가
  // 'x3n8q1w5': { affiliate: 'OO인플루언서', access_path: '인스타그램' },
};

const LEGACY_UTM_SLUGS: Record<string, { affiliate: string; access_path: string }> = {
  hansangyunblog: { affiliate: '한상윤블로그', access_path: '블로그' },
  leesangminblog: { affiliate: '이상민블로그', access_path: '블로그' },
};

function getInfluencerFromRefOrUtm(
  refParam: string | null,
  utmSource: string | null
): { affiliate: string; access_path: string } | null {
  if (refParam && INFLUENCER_REF_MAP[refParam]) {
    return INFLUENCER_REF_MAP[refParam];
  }
  if (utmSource && INFLUENCER_REF_MAP[utmSource]) {
    return INFLUENCER_REF_MAP[utmSource];
  }
  if (utmSource && LEGACY_UTM_SLUGS[utmSource]) {
    return LEGACY_UTM_SLUGS[utmSource];
  }
  return null;
}

function isKnownInfluencerPair(affiliate: string, accessPath: string): boolean {
  return Object.values(INFLUENCER_REF_MAP).some(
    (v) => v.affiliate === affiliate && v.access_path === accessPath
  );
}

function isValidStoredPair(affiliate: string, accessPath: string): boolean {
  if (affiliate === '네이버검색광고' && accessPath === '네이버') return true;
  if (affiliate === '투어밸리검색광고' && accessPath === '네이버') return true;
  if (affiliate === '네이버 투어밸리' && accessPath === '네이버') return true;
  if (
    affiliate === '투어밸리' &&
    (accessPath === '투어밸리 사이트' || accessPath === '투어밸리 모바일 사이트')
  ) {
    return true;
  }
  return isKnownInfluencerPair(affiliate, accessPath);
}

export const checkAndSaveTrackingInfo = (): void => {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const refParam = urlParams.get('ref');
  const napm = urlParams.get('NaPm') ?? urlParams.get('napm');

  // 네이버 검색 광고(유료): CPC — utm_campaign으로 브랜드 키워드 전용 집계 분리
  if (utmMedium === 'cpc') {
    if (isNaverTourvalleyKeywordSaCampaign(utmCampaign)) {
      sessionStorage.setItem('tracking_affiliate', '투어밸리검색광고');
    } else {
      sessionStorage.setItem('tracking_affiliate', '네이버검색광고');
    }
    sessionStorage.setItem('tracking_access_path', '네이버');
    return;
  }

  // 네이버 통합검색 등 자연 유입: NaPm 파라미터가 붙는 경우가 많음
  if (napm) {
    sessionStorage.setItem('tracking_affiliate', '네이버 투어밸리');
    sessionStorage.setItem('tracking_access_path', '네이버');
    return;
  }

  if (utmSource === 'naver') {
    sessionStorage.setItem('tracking_affiliate', '네이버 투어밸리');
    sessionStorage.setItem('tracking_access_path', '네이버');
    return;
  }

  const influencer = getInfluencerFromRefOrUtm(refParam, utmSource);
  if (influencer) {
    sessionStorage.setItem('tracking_affiliate', influencer.affiliate);
    sessionStorage.setItem('tracking_access_path', influencer.access_path);
    return;
  }

  // 기본값 (한 번만)
  if (!sessionStorage.getItem('tracking_affiliate')) {
    sessionStorage.setItem('tracking_affiliate', '투어밸리');
    sessionStorage.setItem('tracking_access_path', '투어밸리 사이트');
  }
};

/**
 * 세션 스토리지에서 추적 정보 가져오기
 * @param device 'PC' | '모바일' | 'Mobile' - 디바이스 타입 (기본값: 'PC')
 * @returns {affiliate: string, access_path: string} 추적 정보
 */
export const getTrackingInfo = (
  device: 'PC' | '모바일' | 'Mobile' = 'PC'
): { affiliate: string; access_path: string } => {
  if (typeof window === 'undefined') {
    const defaultAccessPath = device === 'PC' ? '투어밸리 사이트' : '투어밸리 모바일 사이트';
    return {
      affiliate: '투어밸리',
      access_path: defaultAccessPath,
    };
  }

  const affiliate = sessionStorage.getItem('tracking_affiliate') || '투어밸리';
  let accessPath = sessionStorage.getItem('tracking_access_path');

  const deviceDefaultPath = device === 'PC' ? '투어밸리 사이트' : '투어밸리 모바일 사이트';

  if (!accessPath || !isValidStoredPair(affiliate, accessPath)) {
    accessPath = deviceDefaultPath;
  }

  return {
    affiliate,
    access_path: accessPath,
  };
};
