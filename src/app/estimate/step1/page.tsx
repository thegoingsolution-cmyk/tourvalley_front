'use client';

import { useEffect, useState } from 'react';
import PCStep1Page from './pc/page';
import MobileStep1Page from './m/page';

export default function EstimateStep1Page() {
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
    return <MobileStep1Page />;
  }

  return <PCStep1Page />;
}

