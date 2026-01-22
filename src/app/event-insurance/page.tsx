'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCEventInsurancePage from './pc/page';
import MobileEventInsurancePage from './m/page';

export default function EventInsurancePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileEventInsurancePage />;
  }

  return <PCEventInsurancePage />;
}

