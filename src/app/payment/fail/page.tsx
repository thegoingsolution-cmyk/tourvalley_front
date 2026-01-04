'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('error') || searchParams.get('message');
    setErrorMessage(error || '결제 처리 중 오류가 발생했습니다.');
  }, [searchParams]);

  const handleRetry = () => {
    // localStorage에서 이전 페이지 정보 확인
    const pendingPaymentStr = localStorage.getItem('pendingPayment');
    if (pendingPaymentStr) {
      const pendingPayment = JSON.parse(pendingPaymentStr);
      const insuranceType = pendingPayment.insuranceType || 'domestic';
      router.push(`/${insuranceType}`);
    } else {
      router.push('/domestic');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <section className="form-section">
      <div className="form-container">
        <div className="form-card">
          <div className="completion-section" style={{ textAlign: 'center' }}>
            <div className="completion-icon" style={{ 
              width: '120px', 
              height: '120px', 
              fontSize: '72px',
              backgroundColor: '#fee',
              color: '#e74c3c',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px'
            }}>✕</div>
            
            <div className="completion-message" style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              color: '#333'
            }}>
              결제 실패
            </div>
            
            <div className="completion-submessage" style={{ 
              fontSize: '16px', 
              color: '#666',
              marginBottom: '10px',
              lineHeight: '1.6'
            }}>
              결제 처리 중 문제가 발생했습니다.
            </div>

            {errorMessage && (
              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                margin: '20px 0',
                fontSize: '14px',
                color: '#856404'
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'center',
              marginTop: '30px'
            }}>
              <button
                type="button"
                style={{
                  padding: '15px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={handleRetry}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
              >
                다시 시도
              </button>
              
              <button
                type="button"
                style={{
                  padding: '15px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={handleGoHome}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7f8c8d'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#95a5a6'}
              >
                홈으로
              </button>
            </div>
          </div>

          <div className="completion-notes" style={{ marginTop: '40px' }}>
            <h3>※ 안내사항</h3>
            <ul style={{ lineHeight: '1.8', color: '#666' }}>
              <li>결제가 진행되지 않았으므로 보험 가입이 완료되지 않았습니다.</li>
              <li>문제가 계속되면 고객센터로 문의해 주시기 바랍니다.</li>
              <li>고객센터: 월~금 10:00~17:00 (토,일 공휴일 휴무)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PaymentFailPage() {
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
      <PaymentFailContent />
    </Suspense>
  );
}

