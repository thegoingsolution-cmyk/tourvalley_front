'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCAgreementPage from './pc/page';
import MobileAgreementPage from './m/page';

export default function AgreementPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileAgreementPage />;
  }

  return <PCAgreementPage />;
}
