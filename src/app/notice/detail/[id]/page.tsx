'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import NoticeDetailPCPage from './pc/page';
import NoticeDetailMobilePage from './m/page';

function NoticeDetailContent() {
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
    return <NoticeDetailMobilePage />;
  }

  return <NoticeDetailPCPage />;
}

export default function NoticeDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NoticeDetailContent />
    </Suspense>
  );
}

