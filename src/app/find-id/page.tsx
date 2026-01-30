'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCFindIdPage from './pc/page';
import MobileFindIdPage from './m/page';

export default function FindIdPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileFindIdPage />;
  }

  return <PCFindIdPage />;
}
