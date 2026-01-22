'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import EventCertificateDownloadPC from './pc/page';
import EventCertificateDownloadMobile from './m/page';

export default function EventCertificateDownloadPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <EventCertificateDownloadMobile />;
  }

  return <EventCertificateDownloadPC />;
}
