'use client';

import { useEffect, useState } from 'react';
import CertificateDownloadPC from './pc/page';
import CertificateDownloadMobile from './m/page';

export default function CertificateDownloadPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <CertificateDownloadMobile />;
  }

  return <CertificateDownloadPC />;
}

