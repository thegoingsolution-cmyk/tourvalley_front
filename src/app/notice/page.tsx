'use client';

import { useEffect, useState } from 'react';
import NoticePCPage from './pc/page';
import NoticeMobilePage from './m/page';

export default function NoticePage() {
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
    return <NoticeMobilePage />;
  }

  return <NoticePCPage />;
}
