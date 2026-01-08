'use client';

import { useEffect, useState } from 'react';
import PCStep2Page from './pc/page';
import MobileStep2Page from './m/page';

export default function EstimateStep2Page() {
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
    return <MobileStep2Page />;
  }

  return <PCStep2Page />;
}

