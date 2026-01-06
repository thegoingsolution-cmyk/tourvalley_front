'use client';

import { useEffect, useState } from 'react';
import PCGroupInsurancePage from './pc/page';
import MobileGroupInsurancePage from './m/page';

export default function GroupInsurancePage() {
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
    return <MobileGroupInsurancePage />;
  }

  return <PCGroupInsurancePage />;
}

