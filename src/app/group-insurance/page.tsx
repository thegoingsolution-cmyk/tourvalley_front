'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import PCGroupInsurancePage from './pc/page';
import MobileGroupInsurancePage from './m/page';

export default function GroupInsurancePage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // 디바이스 판별 전에는 PC/모바일 라우트를 렌더하지 않아
  // 모바일에서 PC 경로가 먼저 실행되는 타이밍 이슈를 방지한다.
  if (isMobile === null) {
    return null;
  }

  if (isMobile) {
    return <MobileGroupInsurancePage />;
  }

  return <PCGroupInsurancePage />;
}

