'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCGroupInsurancePage from './pc/page';
import MobileGroupInsurancePage from './m/page';

export default function GroupInsurancePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileGroupInsurancePage />;
  }

  return <PCGroupInsurancePage />;
}

