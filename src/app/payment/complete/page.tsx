'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { approveNicepayPayment } from '@/services/paymentService';

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('결제를 처리하고 있습니다...');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  /** 모바일 등에서 useEffect 이중 실행 시 동일 orderId로 approve 두 번 호출되는 것 방지 */
  const processStartedRef = useRef(false);

  useEffect(() => {
    const processPayment = async () => {
      if (processStartedRef.current) {
        console.log('결제 완료 처리 이미 진행됨, 중복 실행 스킵 (orderId:', searchParams.get('orderId'), ')');
        return;
      }
      processStartedRef.current = true;

      try {
        console.log('===== 결제 완료 페이지 시작 =====');
        console.log('전체 URL:', window.location.href);
        
        // 모든 URL 파라미터 로그
        const allParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        console.log('받은 모든 파라미터:', allParams);
        
        // 나이스페이 AUTHNICE API 결과 파라미터 (다양한 형식 지원)
        const authResultCode = searchParams.get('authResultCode') || searchParams.get('resultCode');
        const authResultMsg = searchParams.get('authResultMsg') || searchParams.get('resultMsg');
        const tid = searchParams.get('tid');
        const clientId = searchParams.get('clientId');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const authToken = searchParams.get('authToken');
        const signature = searchParams.get('signature');
        const mallReserved = searchParams.get('mallReserved');

        console.log('파싱된 결제 정보:', {
          authResultCode,
          authResultMsg,
          tid,
          clientId,
          orderId,
          amount,
          authToken,
          signature,
          mallReserved
        });

        // mallReserved에서 contract_id 추출
        let contract_id_from_mall = null;
        if (mallReserved) {
          const match = mallReserved.match(/contract_id=(\d+)/);
          if (match) {
            contract_id_from_mall = parseInt(match[1]);
            console.log('mallReserved에서 추출한 contract_id:', contract_id_from_mall);
          }
        }

        // localStorage에서 계약 정보 가져오기
        const pendingPaymentStr = localStorage.getItem('pendingPayment');
        console.log('저장된 pendingPayment:', pendingPaymentStr);
        
        const pendingPayment = pendingPaymentStr ? JSON.parse(pendingPaymentStr) : null;
        const mallParams = mallReserved ? new URLSearchParams(mallReserved) : null;
        const insuranceTypeFromMall = mallParams?.get('insuranceType');
        const paymentMethodFromMall = mallParams?.get('paymentMethod');
        console.log('파싱된 pendingPayment:', pendingPayment);

        // contract_id 결정
        const contract_id = contract_id_from_mall || (pendingPayment?.contract_id);
        console.log('사용할 contract_id:', contract_id);

        console.log('authResultCode 체크:', authResultCode, '=== "0000"?', authResultCode === '0000');
        
        // 성공 코드 확인
        if (authResultCode === '0000') {
          console.log('✅ authResultCode가 0000입니다. 결제 승인 API 호출 시작');
          
          // 결제 성공 - 승인 처리
          const approvePayload = {
            contract_id: contract_id,
            amount: parseInt(amount || '0'),
            orderId: orderId || '',
            tid: tid || '',
            authToken: authToken || '',
            clientId: clientId || '',
            signature: signature || '',
            authResultCode: authResultCode || '',
            authResultMsg: authResultMsg || '',
            mallReserved: mallReserved || '',
          };
          
          console.log('승인 API 요청 데이터:', approvePayload);
          
          const approveResult = await approveNicepayPayment(approvePayload);
          
          console.log('승인 API 응답:', approveResult);

          if (approveResult.success) {
            console.log('✅ 결제 승인 성공!');
            
            // group-insurance 결제인지 확인
            const resolvedInsuranceType =
              pendingPayment?.insuranceType || insuranceTypeFromMall || null;
            const resolvedPaymentMethod =
              pendingPayment?.payment_method || paymentMethodFromMall || '나이스페이먼츠';

            const groupContractNumber = orderId || approveResult.data?.contractNumber || '';

            if (resolvedInsuranceType === 'domestic') {
              localStorage.removeItem('pendingPayment');
              router.push(`/group-insurance/domestic/step5?paymentSuccess=true&paymentMethod=${encodeURIComponent(resolvedPaymentMethod)}&contractId=${encodeURIComponent(String(contract_id || ''))}&contractNumber=${encodeURIComponent(groupContractNumber)}`);
              return;
            } else if (resolvedInsuranceType === 'overseas') {
              localStorage.removeItem('pendingPayment');
              router.push(`/group-insurance/overseas/step5?paymentSuccess=true&paymentMethod=${encodeURIComponent(resolvedPaymentMethod)}&contractId=${encodeURIComponent(String(contract_id || ''))}&contractNumber=${encodeURIComponent(groupContractNumber)}`);
              return;
            } else if (resolvedInsuranceType === 'longstay') {
              localStorage.removeItem('pendingPayment');
              router.push(`/group-insurance/longstay/step5?paymentSuccess=true&paymentMethod=${encodeURIComponent(resolvedPaymentMethod)}&contractId=${encodeURIComponent(String(contract_id || ''))}&contractNumber=${encodeURIComponent(groupContractNumber)}`);
              return;
            }
            
            localStorage.removeItem('pendingPayment');
            
            // CompletionStep 페이지로 리다이렉트
            const contractId = contract_id || approveResult.data?.contractId;
            const customerName = approveResult.data?.customerName || pendingPayment?.customerName || '';
            const contractNumber = approveResult.data?.contractNumber || orderId;
            
            router.push(`/payment/success?contractId=${contractId}&customerName=${encodeURIComponent(customerName)}&contractNumber=${contractNumber}`);
            return;
          } else {
            console.error('❌ 결제 승인 실패:', approveResult.message);
            localStorage.removeItem('pendingPayment');
            
            // 실패 페이지로 리다이렉트
            router.push(`/payment/fail?error=${encodeURIComponent(approveResult.message || '결제 승인 중 오류가 발생했습니다.')}`);
            return;
          }
        } else {
          // 결제 실패
          console.error('❌ authResultCode가 0000이 아닙니다:', authResultCode);
          console.error('authResultMsg:', authResultMsg);
          localStorage.removeItem('pendingPayment');
          
          // 실패 페이지로 리다이렉트
          router.push(`/payment/fail?error=${encodeURIComponent(authResultMsg || '결제에 실패했습니다.')}`);
          return;
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        localStorage.removeItem('pendingPayment');
        
        // 실패 페이지로 리다이렉트
        const errorMessage = error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.';
        router.push(`/payment/fail?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    processPayment();
  }, [searchParams, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
      {status === 'processing' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2843e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <div style={{ fontSize: '18px', color: '#666' }}>{message}</div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {status === 'success' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', color: '#4CAF50' }}>✓</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>{message}</div>
          
          {paymentInfo && (
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '24px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>주문번호</span>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '4px 0 0' }}>
                  {paymentInfo.orderId}
                </p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>결제금액</span>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2843e5', margin: '4px 0 0' }}>
                  {formatPrice(paymentInfo.amount)}
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => router.push('/domestic')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#2843e5',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', color: '#f44336' }}>✗</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>결제 실패</div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>{message}</div>
          
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'left',
              fontSize: '12px',
              color: '#6b7280',
              wordBreak: 'break-all'
            }}>
              <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : ''}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.back()}
              style={{
                flex: 1,
                padding: '16px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              다시 시도
            </button>
            <button
              onClick={() => router.push('/domestic')}
              style={{
                flex: 1,
                padding: '16px',
                background: '#2843e5',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              홈으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentCompletePage() {
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
      <PaymentCompleteContent />
    </Suspense>
  );
}

