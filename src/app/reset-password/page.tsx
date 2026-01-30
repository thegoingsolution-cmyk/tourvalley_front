'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCResetPasswordPage from './pc/page';
import MobileResetPasswordPage from './m/page';

export default function ResetPasswordPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileResetPasswordPage />;
  }

  return <PCResetPasswordPage />;
}
