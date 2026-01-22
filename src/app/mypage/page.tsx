'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCMyPage from './pc/page';
import MobileMyPage from './m/page';

export default function MyPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileMyPage />;
  }

  return <PCMyPage />;
}

