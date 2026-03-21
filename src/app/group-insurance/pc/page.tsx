'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PCGroupInsurancePage() {
  const router = useRouter();

  useEffect(() => {
    // 메일/직접진입 모두 동일하게 팝업 전용 화면으로 바로 이동
    const standalone = new URLSearchParams(window.location.search).get('standalone');
    const target = standalone === 'true'
      ? '/group-insurance/domestic/popup?standalone=true'
      : '/group-insurance/domestic/popup';
    router.replace(target);
  }, [router]);

  return <div>단체/법인 여행자보험 페이지로 이동 중...</div>;
}

