'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCDomesticPage from './pc/page';
import MobileDomesticPage from './m/page';

export default function DomesticPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileDomesticPage />;
  }

  return <PCDomesticPage />;
}

