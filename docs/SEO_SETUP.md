# SEO 설정 가이드 (네이버 서치어드바이저 · 구글)

검색 수집·노출을 위해 적용된 설정과, 네이버/구글에 사이트를 등록하는 방법입니다.

## 1. 이미 적용된 설정

- **메타데이터** (`src/app/layout.tsx`, `src/config/seo.ts`)
  - `title`, `description`, `keywords`
  - Open Graph(OG), Twitter Card
  - `metadataBase`로 절대 URL 기준
  - `robots` 메타: index, follow
- **구조화 데이터 (JSON-LD)** (`src/components/JsonLd.tsx`)
  - `Organization`, `WebSite` 스키마
  - 네이버·구글 리치 결과/사이트링크 수집에 활용
- **robots.txt** (`src/app/robots.ts`)
  - 전체 허용, `/api/`, `/confirmation` 비허용
  - Yeti(네이버), Googlebot 규칙
  - `sitemap.xml` 위치 안내
- **sitemap.xml** (`src/app/sitemap.ts`)
  - 메인, 국내/해외/장기체류, 단체보험, 고객센터 등 주요 URL
  - `priority`, `changeFrequency` 설정

## 2. 환경 변수 (배포 시 설정)

| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 실제 서비스 도메인 (sitemap/robots/OG용) | `https://www.tourvalley.net` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | 구글 Search Console 소유 확인 메타 content 값 | (구글에서 발급한 값) |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 소유 확인 메타 content 값 | (네이버에서 발급한 값) |

- **PC/모바일 도메인이 다르면**  
  배포별로 해당 도메인을 넣어주세요. (예: PC 빌드 `https://www.tourvalley.net`, 모바일 빌드 `https://m.tourvalley.net`)  
  sitemap/robots는 해당 빌드의 도메인으로 생성됩니다.

## 3. 네이버 서치어드바이저

1. [서치어드바이저](https://searchadvisor.naver.com/) 접속 후 사이트 추가.
2. **사이트 소유 확인**
   - HTML 태그 방식: 환경 변수 `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`에 네이버에서 발급한 content 값만 넣으면 메타 태그가 자동 주입됩니다.
   - (또는 `src/app/layout.tsx`의 metadata.verification에 직접 추가 가능)
3. **사이트맵 제출**
   - URL 수집 > 사이트맵 제출에서 `https://사용중인도메인/sitemap.xml` 입력.
4. **수집 요청**
   - URL 수집 > 수집 요청에서 메인 URL 등 필요한 URL 요청.

## 4. 구글 Search Console

1. [Google Search Console](https://search.google.com/search-console) 접속 후 속성 추가(URL 접두어 권장).
2. **소유권 확인**
   - HTML 태그 방식: 환경 변수 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`에 구글에서 발급한 content 값만 넣으면 메타 태그가 자동 주입됩니다.
3. **사이트맵 제출**
   - Sitemaps 메뉴에서 `https://사용중인도메인/sitemap.xml` 제출.
4. **색인 요청**
   - URL 검사로 메인 URL 등 색인 요청.

## 5. favicon

- 검색 결과에 아이콘이 나오도록 `public/favicon.ico`, 필요 시 `public/apple-touch-icon.png`를 준비하세요.
- 프로젝트는 이미 `layout`에서 favicon을 참조하고 있습니다.

## 6. 추가로 하면 좋은 것

- **페이지별 메타**: 중요 페이지(`/domestic/pc`, `/overseas/pc` 등)에 `metadata` 또는 `generateMetadata`로 페이지별 `title`/`description` 지정 시 검색 노출에 유리합니다.
- **이미지**: OG 이미지(`openGraph.images`)를 설정하면 SNS·검색 미리보기에 이미지가 노출됩니다.
- **사이트링크**: 네이버/구글은 내부 링크 구조를 보고 자동으로 사이트링크를 만듭니다. 메인·하위 페이지 간 링크를 일관되게 두면 도움이 됩니다.
