'use client';

import { useEffect, useState } from 'react';
import PCSignupPage from './pc/page';
import MobileSignupPage from './m/page';

export default function SignupPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileSignupPage />;
  }

  return <PCSignupPage />;
}

