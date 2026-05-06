'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { checkAndSaveTrackingInfo } from '@/utils/tracking';

/** 라우트 전환 시 URL 쿼리 기준으로 유입(UTM·NaPm 등)을 세션에 반영 */
export default function TrackingCapture() {
  const pathname = usePathname();

  useEffect(() => {
    checkAndSaveTrackingInfo();
  }, [pathname]);

  return null;
}
