'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCStep2Page from './pc/page';
import MobileStep2Page from './m/page';

export default function EstimateStep2Page() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileStep2Page />;
  }

  return <PCStep2Page />;
}

