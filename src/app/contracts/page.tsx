'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCContractPage from './pc/page';
import MobileContractPage from './m/page';

export default function ContractPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileContractPage />;
  }

  return <PCContractPage />;
}

