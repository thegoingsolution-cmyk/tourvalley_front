'use client';

import { useEffect, useState } from 'react';
import PCOverseasPage from './pc/page';
import MobileOverseasPage from './m/page';

export default function OverseasPage() {
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
    return <MobileOverseasPage />;
  }

  return <PCOverseasPage />;
}

