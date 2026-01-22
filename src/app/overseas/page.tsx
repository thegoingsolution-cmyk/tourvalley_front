'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCOverseasPage from './pc/page';
import MobileOverseasPage from './m/page';

export default function OverseasPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileOverseasPage />;
  }

  return <PCOverseasPage />;
}

