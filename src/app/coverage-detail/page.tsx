'use client';

import { useEffect, useState } from 'react';
import PCCoverageDetailPage from './pc/page';
import MobileCoverageDetailPage from './m/page';

export default function CoverageDetailPage() {
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
    return <MobileCoverageDetailPage />;
  }

  return <PCCoverageDetailPage />;
}

