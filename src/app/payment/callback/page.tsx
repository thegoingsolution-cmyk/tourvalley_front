'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { approveNicepayPayment } from '@/services/paymentService';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('결제를 처리하고 있습니다...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // 나이스페이먼츠 결제 결과 파라미터
        const resultCode = searchParams.get('resultCode');
        const resultMsg = searchParams.get('resultMsg');
        const tid = searchParams.get('tid');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const authCode = searchParams.get('authCode');
        const cardCode = searchParams.get('cardCode');
        const cardName = searchParams.get('cardName');
        const cardNo = searchParams.get('cardNo');
        const cardQuota = searchParams.get('cardQuota');

        // localStorage에서 계약 정보 가져오기
        const pendingPaymentStr = localStorage.getItem('pendingPayment');
        if (!pendingPaymentStr) {
          setStatus('error');
          setMessage('결제 정보를 찾을 수 없습니다.');
          return;
        }

        const pendingPayment = JSON.parse(pendingPaymentStr);

        if (resultCode === '0000') {
          // 결제 성공 - 승인 처리
          const approveResult = await approveNicepayPayment({
            contract_id: pendingPayment.contract_id,
            amount: parseInt(amount || '0'),
            orderId: orderId || '',
            tid: tid || '',
            authCode: authCode || '',
            cardCode: cardCode || '',
            cardName: cardName || '',
            cardNo: cardNo || '',
            cardQuota: cardQuota || '',
            resultCode: resultCode || '',
            resultMsg: resultMsg || '',
          });

          if (approveResult.success) {
            setStatus('success');
            setMessage('결제가 완료되었습니다.');
            localStorage.removeItem('pendingPayment');
            
            // 3초 후 완료 화면으로 이동
            setTimeout(() => {
              router.push('/domestic?payment=success');
            }, 3000);
          } else {
            setStatus('error');
            setMessage(approveResult.message || '결제 승인에 실패했습니다.');
          }
        } else {
          // 결제 실패
          setStatus('error');
          setMessage(resultMsg || '결제에 실패했습니다.');
          localStorage.removeItem('pendingPayment');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage('결제 처리 중 오류가 발생했습니다.');
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      {status === 'processing' && (
        <>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <div style={{ fontSize: '18px', color: '#666' }}>{message}</div>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ fontSize: '48px', marginBottom: '20px', color: '#4CAF50' }}>✓</div>
          <div style={{ fontSize: '18px', color: '#333', marginBottom: '10px' }}>{message}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>잠시 후 자동으로 이동합니다...</div>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: '48px', marginBottom: '20px', color: '#f44336' }}>✗</div>
          <div style={{ fontSize: '18px', color: '#333', marginBottom: '20px' }}>{message}</div>
          <button
            onClick={() => router.push('/domestic')}
            style={{
              padding: '12px 24px',
              background: '#2843e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            돌아가기
          </button>
        </>
      )}
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <div style={{ fontSize: '18px', color: '#666' }}>로딩 중...</div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}

