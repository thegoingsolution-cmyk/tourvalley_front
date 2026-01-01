'use client';

import { useEffect, useState } from 'react';
import PCPremiumDetailPage from './pc/page';
import MobilePremiumDetailPage from './m/page';

export default function PremiumDetailPage() {
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
    return <MobilePremiumDetailPage />;
  }

  return <PCPremiumDetailPage />;
}

