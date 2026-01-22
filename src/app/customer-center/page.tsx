'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCCustomerCenterPage from './pc/page';
import MobileCustomerCenterPage from './m/page';

export default function CustomerCenterPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileCustomerCenterPage />;
  }

  return <PCCustomerCenterPage />;
}

