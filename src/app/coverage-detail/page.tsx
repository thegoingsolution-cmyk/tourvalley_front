'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCCoverageDetailPage from './pc/page';
import MobileCoverageDetailPage from './m/page';

export default function CoverageDetailPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileCoverageDetailPage />;
  }

  return <PCCoverageDetailPage />;
}

