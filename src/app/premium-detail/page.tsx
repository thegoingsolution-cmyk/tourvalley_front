'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCPremiumDetailPage from './pc/page';
import MobilePremiumDetailPage from './m/page';

export default function PremiumDetailPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobilePremiumDetailPage />;
  }

  return <PCPremiumDetailPage />;
}

