'use client';

import { useEffect, useState, Suspense } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCLoginPage from './pc/page';
import MobileLoginPage from './m/page';

export default function LoginPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileLoginPage />;
  }

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><p style={{ color: '#666' }}>잠시만 기다려주세요...</p></div>}>
      <PCLoginPage />
    </Suspense>
  );
}

