'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import QnaDetailPCPage from './pc/page';
import QnaDetailMobilePage from './m/page';

function QnaDetailContent() {
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

