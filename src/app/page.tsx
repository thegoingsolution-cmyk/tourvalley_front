'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCMainPage from './main/pc/page';
import MobileMainPage from './main/m/page';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileMainPage />;
  }

  return <PCMainPage />;
}

