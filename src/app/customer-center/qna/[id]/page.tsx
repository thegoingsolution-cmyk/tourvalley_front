'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { isMobileDevice } from '@/utils/device';
import QnaDetailPCPage from './pc/page';
import QnaDetailMobilePage from './m/page';

function QnaDetailContent() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <QnaDetailMobilePage />;
  }

  return <QnaDetailPCPage />;
}

export default function QnaDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QnaDetailContent />
    </Suspense>
  );
}

