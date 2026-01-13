'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    // 모바일로 리다이렉트
    router.replace('/privacy/m');
  }, [router]);

  return null;
}

