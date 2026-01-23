'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCPremiumDetailSimplePage from './pc/page';
import MobilePremiumDetailSimplePage from './m/page';

export default function PremiumDetailSimplePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobilePremiumDetailSimplePage />;
  }

  return <PCPremiumDetailSimplePage />;
}
