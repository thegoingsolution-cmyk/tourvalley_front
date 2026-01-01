'use client';

import { useEffect, useState } from 'react';
import PCLongTermStayPage from './pc/page';
import MobileLongTermStayPage from './m/page';

export default function LongTermStayPage() {
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
    return <MobileLongTermStayPage />;
  }

  return <PCLongTermStayPage />;
}

