'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCLongTermStayPage from './pc/page';
import MobileLongTermStayPage from './m/page';

export default function LongTermStayPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <MobileLongTermStayPage />;
  }

  return <PCLongTermStayPage />;
}

