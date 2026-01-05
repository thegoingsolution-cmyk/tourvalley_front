'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompletionStep from '@/components/travel/CompletionStep';
import './page.css';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contractInfo, setContractInfo] = useState<any>(null);

  useEffect(() => {
    const loadContractInfo = async () => {
      try {
        const contractId = searchParams.get('contractId');
        const contractNumber = searchParams.get('contractNumber');
        
        if (!contractId && !contractNumber) {
          setLoading(false);
          return;
        }

        // 계약 정보를 가져오는 API 호출 (선택사항)
        // const response = await fetch(`/api/contracts/${contractId}`);
        // const data = await response.json();
        
        // 임시로 localStorage에서 가져오기
        const pendingPaymentStr = localStorage.getItem('pendingPayment');
        if (pendingPaymentStr) {
          const pendingPayment = JSON.parse(pendingPaymentStr);
          setContractInfo(pendingPayment);
          localStorage.removeItem('pendingPayment');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('계약 정보 조회 실패:', error);
        setLoading(false);
      }
    };

    loadContractInfo();
  }, [searchParams]);

  const handleViewDetails = () => {
    router.push('/contracts/pc');
  };

  const handleGoHome = () => {
    router.push('/domestic');
  };

  if (loading) {
    return (
      <div className="payment-success-page">
        <Header isMobile={false} />
        <main className="payment-success-content">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '60vh',
            padding: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <div style={{ fontSize: '18px', color: '#666' }}>로딩 중...</div>
          </div>
        </main>
        <Footer isMobile={false} />
      </div>
    );
  }

  const participantName = contractInfo?.customerName || searchParams.get('customerName') || '고객';

  return (
    <div className="payment-success-page">
      <Header isMobile={false} />
      <main className="payment-success-content">
        <CompletionStep
          participantName={participantName}
          onViewDetails={handleViewDetails}
          onGoHome={handleGoHome}
        />
      </main>
      <Footer isMobile={false} />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="payment-success-page">
        <Header isMobile={false} />
        <main className="payment-success-content">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '60vh',
            padding: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <div style={{ fontSize: '18px', color: '#666' }}>로딩 중...</div>
          </div>
        </main>
        <Footer isMobile={false} />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

