'use client';

import { useEffect, useState } from 'react';
import PCMyPage from './pc/page';
import MobileMyPage from './m/page';

export default function MyPage() {
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
    return <MobileMyPage />;
  }

  return <PCMyPage />;
}

