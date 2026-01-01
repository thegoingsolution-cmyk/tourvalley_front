'use client';

import { useEffect, useState } from 'react';
import PCLoginPage from './pc/page';
import MobileLoginPage from './m/page';

export default function LoginPage() {
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
    return <MobileLoginPage />;
  }

  return <PCLoginPage />;
}

