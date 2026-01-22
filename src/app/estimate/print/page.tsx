'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCPrintPage from '../pc/print/page';
import MobilePrintPage from '../m/print/page';

export default function EstimatePrintPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobilePrintPage />;
  }

  return <PCPrintPage />;
}
