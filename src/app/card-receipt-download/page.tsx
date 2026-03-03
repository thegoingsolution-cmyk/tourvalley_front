'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import CardReceiptDownloadPC from './pc/page';
import CardReceiptDownloadMobile from './m/page';

export default function CardReceiptDownloadPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <CardReceiptDownloadMobile />;
  }

  return <CardReceiptDownloadPC />;
}

