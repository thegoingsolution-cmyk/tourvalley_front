'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import { checkAndSaveTrackingInfo } from '@/utils/tracking';
import PCStep2Page from '../pc/step2/page';
import MobileStep2Page from '../m/step2/page';

export default function EstimateStep2Page() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkAndSaveTrackingInfo();
  }, []);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileStep2Page />;
  }

  return <PCStep2Page />;
}
