'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import './page.css';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const [contractDetail, setContractDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId) {
      fetchContractDetail(contractId);
    }
  }, [contractId]);

  const fetchContractDetail = async (id: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/contracts/detail/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContractDetail(data.contract);
        }
      }
    } catch (error) {
      console.error('계약 상세 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
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
    return (
      <div className="contract-detail-page">
        <div className="prow_01" style={{ textAlign: 'center', padding: '50px' }}>
          계약 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = date.getHours();
    return `${year}.${month}.${day} ${hour}시`;
  };

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
              onClick={(e) => { e.preventDefault(); handlePrint(); }}
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
                {formatDate(contractDetail.departureDate)} ~ {formatDate(contractDetail.arrivalDate)}<br />
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
              <span className="tour2023_txt09">무사고캐시</span>
              <span className="tour2023_txt10">0 원</span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">결제보험료</span>
              <span className="tour2023_txt10">{Math.floor(contractDetail.totalPremium || 0).toLocaleString()} 원</span>
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
              <span className="tour2023_txt10">{contractDetail.paymentMethod || '무통장입금'}</span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">결제여부</span>
              <span className="tour2023_txt10">{contractDetail.paymentStatus || '미결제'}</span>
            </li>
            <li className="tour2023_conList">
              <span className="tour2023_txt09">진행단계</span>
              <span className="tour2023_txt10">{contractDetail.status}</span>
            </li>
          </ul>
          <div className="tourG_line05 tourG_mat09 tourG_mab01"></div>
        </div>

        <div className="tourG_mat13">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); alert('약관 다운로드'); }}
            className="tourGuard_btn_b tour2023_btn06_gray"
          >
            약관 PDF로 다운로드 받기<span className="tour2023_arr01"></span>
          </a>
          
          <div className="tourG_mat04">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert('보험료입금증'); }}
              className="tourGuard_btn_b tour2023_btn06_gray"
            >
              보험료입금증<span className="tour2023_arr01"></span>
            </a>
          </div>
        </div>
        <div className="tourG_mat17 tourG_Wrap"></div>
      </div>
    </div>
  );
}

