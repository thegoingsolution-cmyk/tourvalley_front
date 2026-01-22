'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCClaimGuideDBPage from './pc/page';
import MobileClaimGuideDBPage from './m/page';

export default function ClaimGuideDBPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileClaimGuideDBPage />;
  }

  return <PCClaimGuideDBPage />;
}

