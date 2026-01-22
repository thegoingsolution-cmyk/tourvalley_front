'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import NoticePCPage from './pc/page';
import NoticeMobilePage from './m/page';

export default function NoticePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <NoticeMobilePage />;
  }

  return <NoticePCPage />;
}
