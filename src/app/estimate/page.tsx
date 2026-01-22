'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCEstimatePage from './pc/step1/page';
import MobileEstimatePage from './m/step1/page';

export default function EstimatePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileEstimatePage />;
  }

  return <PCEstimatePage />;
}
