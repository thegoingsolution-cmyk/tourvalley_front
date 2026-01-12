'use client';

import { useEffect, useState } from 'react';
import PCClaimGuideDBPage from './pc/page';
import MobileClaimGuideDBPage from './m/page';

export default function ClaimGuideDBPage() {
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
    return <MobileClaimGuideDBPage />;
  }

  return <PCClaimGuideDBPage />;
}

