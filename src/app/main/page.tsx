'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import { useRouter } from 'next/navigation';
import { checkAndSaveTrackingInfo } from '@/utils/tracking';
import PCMainPage from './pc/page';
import MobileMainPage from './m/page';

export default function MainPage() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMobile(isMobileDevice());
    // 네이버 검색 광고 유입 여부 체크 및 세션 스토리지에 저장
    checkAndSaveTrackingInfo();
  }, []);

  if (isMobile) {
    return <MobileMainPage />;
  }

  return <PCMainPage />;
}

