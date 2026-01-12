'use client';

import { useEffect, useState } from 'react';
import PCClaimGuidePage from './pc/page';
import MobileClaimGuidePage from './m/page';

export default function ClaimGuidePage() {
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
    return <MobileClaimGuidePage />;
  }

  return <PCClaimGuidePage />;
}

