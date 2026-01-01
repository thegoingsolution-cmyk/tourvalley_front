'use client';

import { useEffect, useState } from 'react';
import PCMainPage from './main/pc/page';
import MobileMainPage from './main/m/page';

export default function Home() {
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
    return <MobileMainPage />;
  }

  return <PCMainPage />;
}

