'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccidentFreeCashPage() {
  const router = useRouter();

  useEffect(() => {
    // 모바일 여부 확인
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
      router.replace('/accident-free-cash/m');
    } else {
      // PC에서는 메인 페이지로 이동 (모달은 Header에서 처리)
      router.replace('/main');
    }
  }, [router]);

  return <div>Loading...</div>;
}

