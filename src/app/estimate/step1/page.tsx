'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCStep1Page from '../pc/step1/page';
import MobileStep1Page from '../m/step1/page';

export default function EstimateStep1Page() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileStep1Page />;
  }

  return <PCStep1Page />;
}
