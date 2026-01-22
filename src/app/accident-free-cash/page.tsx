'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isMobileDevice } from '@/utils/device';

export default function AccidentFreeCashPage() {
  const router = useRouter();

  useEffect(() => {
    // 모바일 여부 확인
    const isMobile = isMobileDevice();
    
    if (isMobile) {
      router.replace('/accident-free-cash/m');
    } else {
      // PC에서는 메인 페이지로 이동 (모달은 Header에서 처리)
      router.replace('/main');
    }
  }, [router]);

  return <div>Loading...</div>;
}

