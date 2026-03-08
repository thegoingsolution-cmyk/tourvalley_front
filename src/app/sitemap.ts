import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/seo';

const base = (path: string) => `${SITE_URL}${path}`;

/**
 * sitemap.xml 동적 생성
 * - 네이버 서치어드바이저·구글에 수집될 주요 URL 제공
 * - priority, changeFrequency로 중요도·갱신 주기 전달
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: base('/'),
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    // 국내/해외/장기 체류 (PC·모바일 공통 경로; 리다이렉트 또는 동일 콘텐츠)
    { url: base('/domestic/pc'), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: base('/domestic/m'), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: base('/overseas/pc'), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: base('/overseas/m'), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: base('/long-term-stay/pc'), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: base('/long-term-stay/m'), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    // 단체 보험 (법인/단체)
    { url: base('/group-insurance/domestic/popup'), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: base('/group-insurance/overseas/popup'), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: base('/group-insurance/longstay/popup'), lastModified, changeFrequency: 'weekly', priority: 0.8 },
    // 고객센터
    { url: base('/customer-center/pc'), lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: base('/customer-center/m'), lastModified, changeFrequency: 'weekly', priority: 0.7 },
    // 보험료 추정
    { url: base('/estimate/pc/step1'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: base('/estimate/m/step1'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    // 이벤트 보험
    { url: base('/event-insurance/pc'), lastModified, changeFrequency: 'monthly', priority: 0.6 },
    // 가입 안내 (보장 내용 등)
    { url: base('/guide/coverage/domestic-nonmedical/accident'), lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: base('/guide/coverage/overseas/disease'), lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: base('/guide/coverage/overseas/accident'), lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];

  return routes;
}
