// 결제 서비스

interface NicepayPaymentRequest {
  contract_id: number;
  amount: number;
  orderId: string;
  goodsName: string;
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;
  returnUrl: string;
  closeUrl: string;
}

interface NaverPayPaymentRequest {
  contract_id: number;
  amount: number;
  productName: string;
  returnUrl: string;
}

interface KakaoPayPaymentRequest {
  contract_id: number;
  amount: number;
  itemName: string;
  returnUrl: string;
}

// 나이스페이먼츠 결제창 호출 파라미터 가져오기
export const requestNicepayPayment = async (data: NicepayPaymentRequest) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/nicepay/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Nicepay request error:', error);
    throw error;
  }
};

// 나이스페이먼츠 결제창 호출 (AUTHNICE API 방식)
export const openNicepayWindow = (params: any) => {
  return new Promise((resolve, reject) => {
    console.log('나이스페이 결제 시작');
    console.log('결제 파라미터:', params);
    
    // 스크립트가 이미 로드되어 있는지 확인
    // @ts-ignore
    if (window.AUTHNICE) {
      try {
        console.log('나이스페이 스크립트가 이미 로드되어 있습니다.');
        // @ts-ignore
        window.AUTHNICE.requestPay({
          clientId: params.clientKey,
          method: 'card',
          orderId: params.orderId,
          amount: typeof params.amount === 'string' ? parseInt(params.amount, 10) : params.amount,
          goodsName: params.goodsName,
          returnUrl: params.returnUrl,
          mallReserved: params.contract_id ? `contract_id=${params.contract_id}` : '',
          buyerName: params.buyerName,
          buyerEmail: params.buyerEmail,
          buyerTel: params.buyerTel,
          fnError: (result: any) => {
            console.error('결제 오류:', result);
            reject(new Error(result.msg || '결제 중 오류가 발생했습니다.'));
          }
        });
        resolve(true);
        return;
      } catch (error) {
        console.error('나이스페이 실행 오류:', error);
        reject(error);
        return;
      }
    }

    // 이미 로드 중인 스크립트가 있는지 확인
    const existingScript = document.querySelector('script[src*="pay.nicepay.co.kr"]');
    if (existingScript) {
      console.log('나이스페이 스크립트가 로드 중입니다. 대기합니다...');
      
      const checkInterval = setInterval(() => {
        // @ts-ignore
        if (window.AUTHNICE) {
          clearInterval(checkInterval);
          try {
            // @ts-ignore
            window.AUTHNICE.requestPay({
              clientId: params.clientKey,
              method: 'card',
              orderId: params.orderId,
              amount: typeof params.amount === 'string' ? parseInt(params.amount, 10) : params.amount,
              goodsName: params.goodsName,
              returnUrl: params.returnUrl,
              mallReserved: params.contract_id ? `contract_id=${params.contract_id}` : '',
              buyerName: params.buyerName,
              buyerEmail: params.buyerEmail,
              buyerTel: params.buyerTel,
              fnError: (result: any) => {
                console.error('결제 오류:', result);
                reject(new Error(result.msg || '결제 중 오류가 발생했습니다.'));
              }
            });
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        // @ts-ignore
        if (!window.AUTHNICE) {
          reject(new Error('나이스페이먼츠 스크립트 로드 타임아웃'));
        }
      }, 10000);
      return;
    }

    console.log('나이스페이 스크립트를 로드합니다...');
    
    // 나이스페이먼츠 결제창 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://pay.nicepay.co.kr/v1/js/';
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
      console.log('나이스페이 스크립트 로드 완료');
      
      // AUTHNICE 객체가 로드될 때까지 대기
      const checkInterval = setInterval(() => {
        // @ts-ignore
        if (window.AUTHNICE) {
          clearInterval(checkInterval);
          try {
            console.log('나이스페이 AUTHNICE 객체 확인 완료, 결제창을 엽니다.');
            // @ts-ignore
            window.AUTHNICE.requestPay({
              clientId: params.clientKey,
              method: 'card',
              orderId: params.orderId,
              amount: typeof params.amount === 'string' ? parseInt(params.amount, 10) : params.amount,
              goodsName: params.goodsName,
              returnUrl: params.returnUrl,
              mallReserved: params.contract_id ? `contract_id=${params.contract_id}` : '',
              buyerName: params.buyerName,
              buyerEmail: params.buyerEmail,
              buyerTel: params.buyerTel,
              fnError: (result: any) => {
                console.error('결제 오류:', result);
                reject(new Error(result.msg || '결제 중 오류가 발생했습니다.'));
              }
            });
            resolve(true);
          } catch (error) {
            console.error('나이스페이 실행 중 오류:', error);
            reject(error);
          }
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        // @ts-ignore
        if (!window.AUTHNICE) {
          reject(new Error('나이스페이먼츠 AUTHNICE 객체 로드 타임아웃'));
        }
      }, 10000);
    };
    
    script.onerror = (error) => {
      console.error('나이스페이 스크립트 로드 실패:', error);
      reject(new Error('나이스페이먼츠 스크립트 로드에 실패했습니다. 네트워크 연결을 확인해주세요.'));
    };
    
    document.body.appendChild(script);
  });
};

// 나이스페이먼츠 결제 승인
export const approveNicepayPayment = async (data: any) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/nicepay/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Nicepay approve error:', error);
    throw error;
  }
};

// 네이버페이 결제 준비
export const prepareNaverPayPayment = async (data: NaverPayPaymentRequest) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/naverpay/prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('NaverPay prepare error:', error);
    throw error;
  }
};

// 카카오페이 결제 준비
export const prepareKakaoPayPayment = async (data: KakaoPayPaymentRequest) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/kakaopay/prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('KakaoPay prepare error:', error);
    throw error;
  }
};

