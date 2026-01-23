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
    console.log('나이스페이 결제 요청1:', data);
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

// 나이스페이먼츠 가상계좌 발급 요청

const buildVbankExpireDate = () => {
  const expireDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const year = expireDate.getFullYear().toString().slice(-2);
  const month = (expireDate.getMonth() + 1).toString().padStart(2, '0');
  const day = expireDate.getDate().toString().padStart(2, '0');
  const hours = expireDate.getHours().toString().padStart(2, '0');
  const minutes = expireDate.getMinutes().toString().padStart(2, '0');
  const seconds = expireDate.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const applyVbankParams = (requestParams: any, params: any) => {
  console.log('가상계좌 bankCode:', params.bankCode);
  if (!params.bankCode) {
    throw new Error('가상계좌 은행코드가 없습니다.');
  }

  requestParams.bankCode = params.bankCode;
  // 일부 SDK 버전은 bankCd 키를 사용합니다. 둘 다 전달해 호환성을 확보합니다.
  requestParams.bankCd = params.bankCode;
  requestParams.vbankHolder = params.vbankHolder || params.buyerName || '';

  // 가상계좌 유효시간/만료일 설정 (둘 다 전달, 유효시간 우선)
  requestParams.vbankValidHours = 168;
  requestParams.vbankExpDate = buildVbankExpireDate();

  // 가맹점 설정에서 에스크로 사용인 경우 기본값을 true로 설정
  requestParams.useEscrow = params.useEscrow ?? true;

  console.log('가상계좌 파라미터 확인:', {
    method: requestParams.method,
    bankCode: requestParams.bankCode,
    bankCd: requestParams.bankCd,
    vbankHolder: requestParams.vbankHolder,
    vbankValidHours: requestParams.vbankValidHours,
    vbankExpDate: requestParams.vbankExpDate,
    useEscrow: requestParams.useEscrow,
  });
};

// 나이스페이먼츠 결제창 호출 (AUTHNICE API 방식)
export const openNicepayWindow = (params: any) => {
  return new Promise((resolve, reject) => {
    console.log('나이스페이 결제 시작');
    console.log('결제 파라미터:', params);
    
    // 결제 방법 (card 또는 vbank)
    // 나이스페이는 소문자 vbank를 요구함
    const paymentMethod = params.method || 'card';
    
    // 스크립트가 이미 로드되어 있는지 확인
    const authnice = (window as any).AUTHNICE;
    if (authnice) {
      try {
        console.log('나이스페이 스크립트가 이미 로드되어 있습니다.');
        const requestParams: any = {
          clientId: params.clientKey,
          method: paymentMethod,
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
        };
        
        // 가상계좌인 경우 은행 코드/예금주명/만료일 추가
        if (paymentMethod === 'vbank') {
          try {
            applyVbankParams(requestParams, params);
          } catch (error) {
            reject(error);
            return;
          }
        }
        
        console.log('나이스페이 요청 파라미터:', requestParams);
        authnice.requestPay(requestParams);
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
        const authniceLoaded = (window as any).AUTHNICE;
        if (authniceLoaded) {
          clearInterval(checkInterval);
          try {
            const requestParams: any = {
              clientId: params.clientKey,
              method: paymentMethod,
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
            };
            
            // 가상계좌인 경우 은행 코드/예금주명/만료일 추가
            if (paymentMethod === 'vbank') {
              try {
                applyVbankParams(requestParams, params);
              } catch (error) {
                reject(error);
                return;
              }
            }
            
            console.log('나이스페이 요청 파라미터:', requestParams);
            authniceLoaded.requestPay(requestParams);
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!(window as any).AUTHNICE) {
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
        const authniceLoaded = (window as any).AUTHNICE;
        if (authniceLoaded) {
          clearInterval(checkInterval);
          try {
            console.log('나이스페이 AUTHNICE 객체 확인 완료, 결제창을 엽니다.');
            const requestParams: any = {
              clientId: params.clientKey,
              method: paymentMethod,
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
            };
            
            // 가상계좌인 경우 은행 코드/예금주명/만료일 추가
            if (paymentMethod === 'vbank') {
              try {
                applyVbankParams(requestParams, params);
              } catch (error) {
                reject(error);
                return;
              }
            }
            
            console.log('나이스페이 요청 파라미터:', requestParams);
            authniceLoaded.requestPay(requestParams);
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
        if (!(window as any).AUTHNICE) {
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

// 네이버페이 SDK 로드
export const loadNaverPaySDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('네이버 페이 SDK 로드 시작');
    
    // @ts-ignore
    if (window.Naver && window.Naver.Pay) {
      console.log('네이버 페이 SDK가 이미 로드되어 있음');
      resolve();
      return;
    }

    const script = document.createElement('script');
    const isDev = process.env.NEXT_PUBLIC_NAVER_PAY_ENV === 'dev' || process.env.NEXT_PUBLIC_NAVER_PAY_ENV === 'development';
    const sdkUrl = isDev 
      ? 'https://test-nsp.pay.naver.com/sdk/js/naverpay.min.js'
      : 'https://nsp.pay.naver.com/sdk/js/naverpay.min.js';
    
    console.log('네이버 페이 SDK URL:', sdkUrl);
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
      console.log('네이버 페이 SDK 로드 완료');
      resolve();
    };
    script.onerror = (error) => {
      console.error('네이버 페이 SDK 로드 실패:', error);
      reject(new Error('네이버 페이 SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });
};

// 네이버페이 결제 준비 및 실행
export const processNaverPayPayment = async (data: {
  contractId: number;
  amount: number;
  productName: string;
  productCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkOutDate: string;
}) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // 1. 네이버 페이 SDK 로드
    await loadNaverPaySDK();
    
    // 2. 예약 생성 API 호출 (계약 정보 준비)
    const createResponse = await fetch(`${baseUrl}/api/travel/contracts/${data.contractId}/create-naver-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        amount: data.amount,
        productName: data.productName,
        productCount: data.productCount,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        checkOutDate: data.checkOutDate,
      }),
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.message || '결제 준비 실패');
    }
    
    const createResult = await createResponse.json();
    
    if (!createResult.success || !createResult.data) {
      throw new Error(createResult.message || '결제 준비 실패');
    }
    
    const { orderId, merchantPayKey } = createResult.data;
    
    // 3. 네이버 페이 객체 생성
    const naverPayClientId = process.env.NEXT_PUBLIC_NAVER_PAY_CLIENT_ID;
    // chainId는 필수입니다 (샘플 코드 참고)
    const naverPayChainId = process.env.NAVER_PAY_CHAIN_ID || "Y1dub1pDaDgyM0w"; // chainId가 없으면 clientId 사용
    const isDev = process.env.NEXT_PUBLIC_NAVER_PAY_ENV === 'dev' || process.env.NEXT_PUBLIC_NAVER_PAY_ENV === 'development';
    
    if (!naverPayClientId) {
      throw new Error('네이버 페이 CLIENT_ID가 설정되지 않았습니다.');
    }
    
    // @ts-ignore
    const NaverPay = window.Naver?.Pay;
    if (!NaverPay) {
      throw new Error('네이버 페이 SDK를 로드할 수 없습니다.');
    }
    
    // 주의: 네이버 페이 SDK는 보안상의 이유로 window.location.origin을 강제로 사용합니다.
    // 샘플 코드에 따르면 chainId도 필수입니다.
    const sdkConfig: any = {
      mode: isDev ? 'development' : 'production',
      clientId: naverPayClientId,
      chainId: naverPayChainId, // chainId 필수
    };
    
    console.log('네이버 페이 SDK 설정:', {
      mode: sdkConfig.mode,
      clientId: sdkConfig.clientId,
      chainId: sdkConfig.chainId,
    });
    
    const oPay = NaverPay.create(sdkConfig);
    
    // 4. 이용완료일 설정
    let useCfmYmdt: string | undefined = undefined;
    if (data.checkOutDate) {
      const checkoutDateObj = new Date(data.checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkoutDateObj.setHours(0, 0, 0, 0);
      
      if (checkoutDateObj >= today) {
        useCfmYmdt = data.checkOutDate.replace(/-/g, '');
      } else {
        throw new Error('체크아웃 날짜는 오늘 이후여야 합니다.');
      }
    }
    
    // 5. 결제창 열기
    const returnUrl = `${baseUrl}/api/travel/naver-pay-callback`;
    
    // 네이버 페이 SDK open() 메서드 파라미터 준비
    // 샘플 코드와 동일하게 모든 값을 문자열로 전달해야 합니다
    // totalPayAmount = taxScopeAmount + taxExScopeAmount 여야 합니다
    const totalAmount = Math.round(data.amount);
    const paymentParams: any = {
      merchantPayKey: String(merchantPayKey || orderId),
      productName: String(data.productName),
      productCount: String(data.productCount),
      totalPayAmount: String(totalAmount),
      taxScopeAmount: String(totalAmount), // 과세 금액 (전체 금액을 과세로 설정)
      taxExScopeAmount: String(0), // 면세 금액
      returnUrl: String(returnUrl),
    };
    
    // 이용완료일이 있는 경우에만 추가
    // 개발 환경에서는 지원되지 않으므로 production 환경에서만 사용 (상용에서는 필수)
    if (useCfmYmdt && !isDev) {
      paymentParams.useCfmYmdt = String(useCfmYmdt);
    }
    
    // 개발 환경에서는 productItems가 지원되지 않을 수 있음
    // productItems: [{
    //   categoryType: 'ETC',
    //   categoryId: 'ETC',
    //   uid: String(data.contractId),
    //   name: String(data.productName),
    //   count: String(data.productCount),
    // }],
    
    console.log('네이버 페이 결제창 열기:', paymentParams);
    
    // 네이버 페이 결제창 열기
    oPay.open(paymentParams);
    
    return {
      success: true,
      message: '네이버 페이 결제창을 열었습니다.',
    };
  } catch (error) {
    console.error('NaverPay process error:', error);
    throw error;
  }
};

// 카카오페이 결제 준비 및 실행
export const processKakaoPayPayment = async (data: {
  contractId: number;
  amount: number;
  itemName: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    console.log('카카오페이 결제 준비 시작:', data);
    
    // 1. 결제 준비 API 호출
    const prepareResponse = await fetch(`${baseUrl}/api/travel/contracts/${data.contractId}/prepare-kakao-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        amount: data.amount,
        itemName: data.itemName,
        quantity: data.quantity,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
      }),
    });
    
    if (!prepareResponse.ok) {
      const errorData = await prepareResponse.json();
      throw new Error(errorData.message || '카카오페이 결제 준비 실패');
    }
    
    const prepareResult = await prepareResponse.json();
    
    if (!prepareResult.success || !prepareResult.data) {
      throw new Error(prepareResult.message || '카카오페이 결제 준비 실패');
    }
    
    const { tid, next_redirect_pc_url, next_redirect_mobile_url } = prepareResult.data;
    
    console.log('카카오페이 결제 준비 완료:', { tid, next_redirect_pc_url });
    
    // 2. 모바일/PC 구분하여 리다이렉트
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const redirectUrl = isMobile ? next_redirect_mobile_url : next_redirect_pc_url;
    
    if (!redirectUrl) {
      throw new Error('카카오페이 리다이렉트 URL을 받지 못했습니다.');
    }
    
    // 3. 카카오페이 결제 페이지로 이동
    console.log('카카오페이 결제 페이지로 이동:', redirectUrl);
    window.location.href = redirectUrl;
    
    return {
      success: true,
      message: '카카오페이 결제 페이지로 이동합니다.',
      data: { tid },
    };
  } catch (error) {
    console.error('카카오페이 결제 오류:', error);
    throw error;
  }
};

