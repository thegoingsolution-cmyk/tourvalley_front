'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PCMainPage from './pc/page';
import MobileMainPage from './m/page';

export default function MainPage() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileMainPage />;
  }

  return <PCMainPage />;
}

