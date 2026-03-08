/**
 * 검색엔진용 구조화 데이터 (JSON-LD)
 * - 네이버·구글 리치 결과·사이트링크 수집에 활용
 */
import { SITE_URL, SEO_DEFAULT } from '@/config/seo';

export default function JsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_DEFAULT.openGraph.siteName,
    url: SITE_URL,
    description: SEO_DEFAULT.description,
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_DEFAULT.openGraph.siteName,
    url: SITE_URL,
    description: SEO_DEFAULT.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
