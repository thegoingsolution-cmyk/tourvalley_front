'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import CertificateDownloadPC from './pc/page';
import CertificateDownloadMobile from './m/page';

export default function CertificateDownloadPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <CertificateDownloadMobile />;
  }

  return <CertificateDownloadPC />;
}

