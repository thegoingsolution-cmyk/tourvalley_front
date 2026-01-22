'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCSignupPage from './pc/page';
import MobileSignupPage from './m/page';

export default function SignupPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileSignupPage />;
  }

  return <PCSignupPage />;
}

