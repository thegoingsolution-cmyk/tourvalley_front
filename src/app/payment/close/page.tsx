'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PaymentClosePage() {
  const router = useRouter();

  useEffect(() => {
    // 결제창이 닫혔을 때 처리
    localStorage.removeItem('pendingPayment');
    
    // 3초 후 메인 페이지로 이동
    setTimeout(() => {
      router.push('/domestic');
    }, 3000);
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>ℹ️</div>
      <div style={{ fontSize: '18px', color: '#333', marginBottom: '10px' }}>결제가 취소되었습니다.</div>
      <div style={{ fontSize: '14px', color: '#666' }}>잠시 후 자동으로 이동합니다...</div>
    </div>
  );
}

