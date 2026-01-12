'use client';

import { useEffect, useState } from 'react';
import PaymentSuccessPCPage from './pc/page';
import PaymentSuccessMobilePage from './m/page';

export default function PaymentSuccessPage() {
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
    return <PaymentSuccessMobilePage />;
  }

  return <PaymentSuccessPCPage />;
}


