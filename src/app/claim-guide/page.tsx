'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCClaimGuidePage from './pc/page';
import MobileClaimGuidePage from './m/page';

export default function ClaimGuidePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileClaimGuidePage />;
  }

  return <PCClaimGuidePage />;
}

