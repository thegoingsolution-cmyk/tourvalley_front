'use client';

import { useEffect, useState } from 'react';
import EventCertificateDownloadPC from './pc/page';
import EventCertificateDownloadMobile from './m/page';

export default function EventCertificateDownloadPage() {
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
    return <EventCertificateDownloadMobile />;
  }

  return <EventCertificateDownloadPC />;
}
