'use client';

import { useEffect, useState } from 'react';
import PCCustomerCenterPage from './pc/page';
import MobileCustomerCenterPage from './m/page';

export default function CustomerCenterPage() {
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
    return <MobileCustomerCenterPage />;
  }

  return <PCCustomerCenterPage />;
}

