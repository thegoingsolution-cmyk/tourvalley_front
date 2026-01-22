'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import { useRouter } from 'next/navigation';
import PCMainPage from './pc/page';
import MobileMainPage from './m/page';

export default function MainPage() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileMainPage />;
  }

  return <PCMainPage />;
}

