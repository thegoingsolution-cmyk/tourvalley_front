'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCPremiumDetailPage from './pc/page';
import MobilePremiumDetailPage from './m/page';

export default function PremiumDetailPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let mobile = isMobileDevice();
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      try {
        mobile = window.opener.innerWidth <= 768;
      } catch {
        // If we cannot access opener (e.g., cross-origin), fall back.
      }
    }
    setIsMobile(mobile);
  }, []);

  if (isMobile) {
    return <MobilePremiumDetailPage />;
  }

  return <PCPremiumDetailPage />;
}

