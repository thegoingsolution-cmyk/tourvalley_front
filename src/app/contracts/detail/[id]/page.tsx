'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatInsurancePeriod } from '@/utils/dateTime';
import { useAuth } from '@/contexts/AuthContext';
import {
  readNonMemberContractAuth,
  buildFullBirthDateFromSixDigits,
} from '@/utils/nonMemberContractAuth';
import './page.css';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const { isLoggedIn, member, isLoading: authLoading } = useAuth();
  const [contractDetail, setContractDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiptLoading, setReceiptLoading] = useState(false);
  /** 비회원: 인증 정보 없음 vs 조회 실패 구분 */
  const [emptyHint, setEmptyHint] = useState<'guest' | 'notfound' | null>(null);

  useEffect(() => {
    setContractDetail(null);
    setLoading(true);
    setEmptyHint(null);
  }, [contractId]);

  useEffect(() => {
    if (!contractId) return;
    // 인증 컨텍스트가 준비되기 전에는 조회하지 않음 — 준비되면 이 effect가 다시 실행됨
    if (authLoading) return;
    fetchContractDetail(contractId);
  }, [contractId, authLoading, isLoggedIn, member?.id]);

  const fetchContractDetail = async (id: string) => {
    setEmptyHint(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    if (isLoggedIn && member?.id) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/contracts/detail/${id}?member_id=${encodeURIComponent(
            String(member.id)
          )}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.contract) {
            setContractDetail(data.contract);
          } else {
            setEmptyHint('notfound');
          }
        } else {
          setEmptyHint('notfound');
        }
      } catch (error) {
        console.error('계약 상세 조회 오류:', error);
        setEmptyHint('notfound');
      } finally {
        setLoading(false);
      }
      return;
    }

    const auth = readNonMemberContractAuth();
    if (!auth) {
      setEmptyHint('guest');
      setLoading(false);
      return;
    }

    try {
      let url = `${API_BASE_URL}/api/contracts/non-member/detail/${encodeURIComponent(id)}?`;
      if (auth.loginType === 'I') {
        const birth = buildFullBirthDateFromSixDigits(auth.birthDate);
        url += new URLSearchParams({
          name: auth.insuredName,
          birth_date: birth,
          gender: auth.gender,
          phone: auth.phone,
        }).toString();
      } else {
        url += new URLSearchParams({
          company_name: auth.companyName,
          business_number: auth.businessNumber,
          phone: auth.phone,
        }).toString();
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.contract) {
          setContractDetail(data.contract);
        } else {
          setEmptyHint('notfound');
        }
      } else {
        setEmptyHint('notfound');
      }
    } catch (error) {
      console.error('비회원 계약 상세 조회 오류:', error);
      setEmptyHint('notfound');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // B2C는 국내/해외/장기 구분 없이 모두 가입신청내역서(출력하기) 페이지로 열기
    window.open(
      `/confirmation?contractId=${contractId}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleClose = () => {
    // 팝업으로 열린 경우에만 창 닫기, 모바일 등 페이지 이동으로 진입한 경우 뒤로 가기
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    } else {
      router.back();
    }
  };

  const handleReceiptClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (!contractDetail?.paymentMethod) {
      alert('결제 정보를 찾을 수 없습니다.');
      return;
    }

    if (
      contractDetail.paymentMethod === '기타결제' &&
      contractDetail.paymentSubMethod === '무통장입금'
    ) {
      window.open(
        `/payments/bank-transfer-receipt?contractId=${contractId}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    if (receiptLoading) {
      return;
    }

    setReceiptLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(
        `${API_BASE_URL}/api/payments/receipt?contract_id=${contractId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      const data = await response.json();
      if (!response.ok || !data?.success) {
        alert(data?.message || '영수증을 불러오지 못했습니다.');
        return;
      }

      if (data.receiptUrl) {
        window.open(data.receiptUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      alert('영수증 URL을 찾을 수 없습니다.');
    } catch (error) {
      console.error('영수증 조회 오류:', error);
      alert('영수증 조회 중 오류가 발생했습니다.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleCardReceiptClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const url = typeof contractDetail?.receiptUrl === 'string' ? contractDetail.receiptUrl.trim() : '';
    if (!url) {
      alert('등록된 카드영수증이 없습니다.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="contract-detail-page">
        <div className="prow_01" style={{ textAlign: 'center', padding: '50px' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!contractDetail) {
    const message =
      emptyHint === 'guest'
        ? '가입내역 조회에서 휴대폰 인증을 완료한 뒤 자세히보기를 이용해 주세요.'
        : '계약 정보를 찾을 수 없습니다.';
    return (
      <div className="contract-detail-page">
        <div className="prow_01" style={{ textAlign: 'center', padding: '50px' }}>
          {message}
        </div>
      </div>
    );
  }

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffDays >= 1) {
      return `(${diffDays}일)`;
    } else {
      return `(${diffHours}시간)`;
    }
  };

  const getInsuranceTypeDisplay = (insuranceType: string) => {
    const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
    if (longTermTypes.includes(insuranceType)) {
      return '해외장기체류보험';
    }
    return insuranceType;
  };

  const getInsuranceCompany = (insuranceType: string) => {
    const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
    if (insuranceType === '국내여행보험') {
      return '라이나손해 국내여행보험';
    } else if (insuranceType === '해외여행') {
      return '라이나손해 해외여행보험';
    } else if (longTermTypes.includes(insuranceType)) {
      return '메리츠화재 해외장기체류보험';
    }
    return '라이나손해 해외여행보험';
  };

  const getTermsPdfPath = (insuranceType?: string | null) => {
    if (!insuranceType) return null;
    const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
    if (longTermTypes.includes(insuranceType) || insuranceType.includes('장기')) {
      return '/pdf/해외장기체류보험_약관.pdf';
    }
    if (insuranceType.includes('국내')) {
      return '/pdf/ACE손해_국내여행보험약관.pdf';
    }
    if (insuranceType.includes('해외')) {
      return '/pdf/ACE손해_해외여행보험약관.pdf';
    }
    return null;
  };

  const isPaymentCompleted = (() => {
    const rawStatus = contractDetail?.paymentStatus;
    if (!rawStatus) return false;
    const normalized = String(rawStatus).trim().toLowerCase();
    const paidStatuses = new Set(['결제완료', '완료', 'paid', 'success']);
    return paidStatuses.has(normalized) || paidStatuses.has(String(rawStatus).trim());
  })();

  const displayStatus = (() => {
    const raw = String(contractDetail?.status ?? '').trim();
    if (!raw) return '가입신청';
    if (raw === '등록') return '가입신청';
    const allowed = new Set(['가입신청', '가입완료', '취소신청', '취소']);
    return allowed.has(raw) ? raw : '가입신청';
  })();

  const termsPdfPath = getTermsPdfPath(contractDetail?.insuranceType);

  return (
    <div id="isbwrapper" className="contract-detail-page">
      <header id="header">
        <div className="tour2023_header_inner tour2023_header_line">
          <span className="tourTop_title">자세히보기</span>
          <a className="close" href="#" onClick={(e) => { e.preventDefault(); handleClose(); }}>닫기</a>
        </div>
      </header>
      
      <div className="prow_01">
        <div className="tourG_mat10">
          <p className="tour2023_title02">
            계약정보
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                handlePrint();
              }}
              className="tour2023_btn_b02 tour2023_btn08" 
              style={{ float: 'right', fontWeight: 400, fontFamily: "'Noto Sans KR', sans-serif, 'Malgun Gothic', '맑은 고딕'" }}
            >
              출력하기
            </a>
          </p>
          
          <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
          <ul className="tour2023_conList_Wrap">
            <li className="tour2023_conList">
              <span className="tour2023_txt09">보험종목/보험회사/상품명</span>
              <span className="tour2023_txt10">
                {getInsuranceTypeDisplay(contractDetail.insuranceType)}<br />
                {getInsuranceCompany(contractDetail.insuranceType)}
              </span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">보험기간</span>
              <span className="tour2023_txt10">
                {formatInsurancePeriod(contractDetail.departureDate, contractDetail.arrivalDate)}<br />
                {calculateDuration(contractDetail.departureDate, contractDetail.arrivalDate)}
              </span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">여행지/여행목적</span>
              <span className="tour2023_txt10">
                {(() => {
                  const destination = contractDetail.travelCountry || contractDetail.travelRegion || null;
                  const purpose = contractDetail.travelPurpose || null;
                  
                  if (destination && purpose) {
                    return `${destination}/${purpose}`;
                  } else if (purpose) {
                    return purpose;
                  } else if (destination) {
                    return destination;
                  }
                  return '-';
                })()}
              </span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">가입인원</span>
              <span className="tour2023_txt10">
                <a 
                  href="#" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    router.push(`/premium-detail?contractId=${contractId}`);
                  }}
                  className="tour2023_btn_b02 tour2023_btn08"
                >
                  자세히보기
                </a>
                {contractDetail.travelParticipants || 1}명
              </span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">합계 보험료</span>
              <span className="tour2023_txt10">{Math.floor(contractDetail.totalPremium || 0).toLocaleString()} 원</span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">무사고캐시 사용</span>
              <span className="tour2023_txt10">{Math.floor(contractDetail.useAccidentFreeCash ?? 0).toLocaleString()} 원</span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">결제보험료</span>
              <span className="tour2023_txt10">{Math.floor(contractDetail.paidAmount ?? contractDetail.totalPremium ?? 0).toLocaleString()} 원</span>
            </li>
          </ul>
          
          <div className="tourG_line05 tourG_mat09 tourG_mab01"></div>
          <ul className="tour2023_conList_Wrap">
            <li className="tour2023_conList">
              <span className="tour2023_txt09">계약자/취급자</span>
              <span className="tour2023_txt10">
                {contractDetail.contractorType === '법인' && contractDetail.contractorCompanyName
                  ? contractDetail.contractorCompanyName
                  : '(주)빨주노초파남보'}
              </span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">대표 가입자</span>
              <span className="tour2023_txt10">
                {contractDetail.memberName || '-'}<br />
                {contractDetail.memberBirthDate ? `${contractDetail.memberBirthDate.substring(0, 6)}-*******` : '-'}<br />
                {contractDetail.memberPhone || '-'}<br />
                {contractDetail.memberEmail || '-'}
              </span>
            </li>
          </ul>
          
          <div className="tourG_line05 tourG_mat09 tourG_mab01"></div>
          <ul className="tour2023_conList_Wrap">
            <li className="tour2023_conList">
              <span className="tour2023_txt09">결제방법</span>
              <span className="tour2023_txt10">
                {contractDetail.paymentMethod === '기타결제'
                  ? (contractDetail.paymentSubMethod || '기타결제')
                  : (contractDetail.paymentMethod || '무통장입금')}
              </span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">결제여부</span>
              <span className="tour2023_txt10">{isPaymentCompleted ? '결제완료' : '미결제'}</span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">진행단계</span>
              <span className="tour2023_txt10">{displayStatus}</span>
            </li>
          </ul>
          <div className="tourG_line05 tourG_mat09 tourG_mab01"></div>
        </div>

        <div className="tourG_mat13">
          <a 
            href={termsPdfPath || '#'}
            target={termsPdfPath ? '_blank' : undefined}
            rel={termsPdfPath ? 'noopener noreferrer' : undefined}
            onClick={(e) => {
              if (!termsPdfPath) {
                e.preventDefault();
                alert('약관 파일을 찾을 수 없습니다.');
              }
            }}
            className="tourGuard_btn_b tour2023_btn06_gray"
          >
            약관 PDF로 다운로드 받기<span className="tour2023_arr01"></span>
          </a>
          
          {contractDetail?.subscriptionCertificateUrl && (
            <div className="tourG_mat04">
              <a
                href={contractDetail.subscriptionCertificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tourGuard_btn_b tour2023_btn06_gray"
              >
                증권 다운로드 받기<span className="tour2023_arr01"></span>
              </a>
            </div>
          )}
          {isPaymentCompleted && contractDetail?.paymentSubMethod !== '수기카드' && (
            <div className="tourG_mat04">
              <a 
                href="#" 
                onClick={handleReceiptClick}
                className="tourGuard_btn_b tour2023_btn06_gray"
              >
                보험료입금증<span className="tour2023_arr01"></span>
              </a>
            </div>
          )}
          {isPaymentCompleted && contractDetail?.paymentSubMethod === '수기카드' && (
            <div className="tourG_mat04">
              <a
                href="#"
                onClick={handleCardReceiptClick}
                className="tourGuard_btn_b tour2023_btn06_gray"
              >
                카드영수증<span className="tour2023_arr01"></span>
              </a>
            </div>
          )}
        </div>
        <div className="tourG_mat17 tourG_Wrap"></div>
      </div>
    </div>
  );
}

