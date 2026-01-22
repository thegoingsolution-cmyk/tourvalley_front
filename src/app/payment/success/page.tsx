'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PaymentSuccessPCPage from './pc/page';
import PaymentSuccessMobilePage from './m/page';

export default function PaymentSuccessPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <PaymentSuccessMobilePage />;
  }

  return <PaymentSuccessPCPage />;
}


