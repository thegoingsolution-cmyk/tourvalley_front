'use client';

import { useEffect, useState } from 'react';
import PCClaimGuideHyundaiPage from './pc/page';
import MobileClaimGuideHyundaiPage from './m/page';

export default function ClaimGuideHyundaiPage() {
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
    return <MobileClaimGuideHyundaiPage />;
  }

  return <PCClaimGuideHyundaiPage />;
}

