import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Favicon from '@/components/Favicon';
import TrackingCapture from '@/components/TrackingCapture';
import { AuthProvider } from '@/contexts/AuthContext';
import { SITE_URL, SEO_DEFAULT, VERIFICATION } from '@/config/seo';
import JsonLd from '@/components/JsonLd';

const NAVER_SITE_VERIFICATION_TOKENS = [
  VERIFICATION.naver,
  VERIFICATION.naverMobile,
].filter((token): token is string => Boolean(token));

// 운영 환경에서 basePath를 고려한 favicon 경로
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const faviconPath = basePath ? `${basePath}/favicon.ico` : '/favicon.ico';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_DEFAULT.title,
    template: `%s | 투어밸리 여행자보험`,
  },
  description: SEO_DEFAULT.description,
  keywords: SEO_DEFAULT.keywords,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: SEO_DEFAULT.title,
    description: SEO_DEFAULT.description,
    url: SITE_URL,
    siteName: SEO_DEFAULT.openGraph.siteName,
    locale: SEO_DEFAULT.openGraph.locale,
    type: SEO_DEFAULT.openGraph.type,
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_DEFAULT.title,
    description: SEO_DEFAULT.description,
  },
  icons: {
    icon: faviconPath,
    shortcut: faviconPath,
    apple: basePath ? `${basePath}/apple-touch-icon.png` : '/apple-touch-icon.png',
  },
  alternates: { canonical: SITE_URL },
  verification: {
    ...(VERIFICATION.google && { google: VERIFICATION.google }),
    ...(NAVER_SITE_VERIFICATION_TOKENS.length > 0 && {
      other: { 'naver-site-verification': NAVER_SITE_VERIFICATION_TOKENS },
    }),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 나이스페이먼츠 스크립트 사전 로드 (AUTHNICE API) */}
        <Script
          id="nicepay-script"
          src="https://pay.nicepay.co.kr/v1/js/"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <JsonLd />
        <AuthProvider>
          <TrackingCapture />
          <Favicon />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

