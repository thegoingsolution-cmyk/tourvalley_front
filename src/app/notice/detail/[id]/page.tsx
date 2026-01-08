'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NoticeDetailPCPage from './pc/page';
import NoticeDetailMobilePage from './m/page';

export default function NoticeDetailPage() {
  const params = useParams();
  const noticeId = params.id as string;
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
    return <NoticeDetailMobilePage noticeId={noticeId} />;
  }

  return <NoticeDetailPCPage noticeId={noticeId} />;
}

