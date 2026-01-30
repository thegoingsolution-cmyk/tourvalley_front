import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Favicon from '@/components/Favicon';
import { AuthProvider } from '@/contexts/AuthContext';

// 운영 환경에서 basePath를 고려한 favicon 경로
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const faviconPath = basePath ? `${basePath}/favicon.ico` : '/favicon.ico';

export const metadata: Metadata = {
  title: '투어밸리 여행자보험',
  description: '투어밸리 여행자보험',
  icons: {
    icon: faviconPath,
    shortcut: faviconPath,
    apple: basePath ? `${basePath}/apple-touch-icon.png` : '/apple-touch-icon.png',
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
        <AuthProvider>
          <Favicon />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

