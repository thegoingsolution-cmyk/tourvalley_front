import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/seo';

/**
 * robots.txt 동적 생성
 * - 네이버 서치어드바이저, 구글봇 수집 허용
 * - sitemap 위치 안내
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/confirmation', // 결제 완료 등 내부 페이지
        ],
      },
      {
        userAgent: 'Yeti', // 네이버 봇
        allow: '/',
        disallow: ['/api/', '/confirmation'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/confirmation'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, ''),
  };
}
