'use client';

import { useEffect, useState } from 'react';
import PCEventInsurancePage from './pc/page';
import MobileEventInsurancePage from './m/page';

export default function EventInsurancePage() {
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
    return <MobileEventInsurancePage />;
  }

  return <PCEventInsurancePage />;
}

