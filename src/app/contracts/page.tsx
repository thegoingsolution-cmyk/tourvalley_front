'use client';

import { useEffect, useState } from 'react';
import PCContractPage from './pc/page';
import MobileContractPage from './m/page';

export default function ContractPage() {
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
    return <MobileContractPage />;
  }

  return <PCContractPage />;
}

