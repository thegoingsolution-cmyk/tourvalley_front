'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCClaimGuideHyundaiPage from './pc/page';
import MobileClaimGuideHyundaiPage from './m/page';

export default function ClaimGuideHyundaiPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileClaimGuideHyundaiPage />;
  }

  return <PCClaimGuideHyundaiPage />;
}

