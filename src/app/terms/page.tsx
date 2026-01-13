'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  useEffect(() => {
    // 모바일로 리다이렉트
    router.replace('/terms/m');
  }, [router]);

  return null;
}

