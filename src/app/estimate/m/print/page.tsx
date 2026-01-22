'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 동적 페이지로 설정
export const dynamic = 'force-dynamic';

interface Participant {
  sequence: number;
  gender: string;
  birth_date: string;
  age: number;
  planType: string;
  premium: number;
}

interface EstimateData {
  request_number: string;
  product_cd: string;
  insurance_type: string;
  start_date: string;
  start_hour: string;
  end_date: string;
  end_hour: string;
  tour_num: number;
  contractor_name: string;
  participants: Participant[];
  total_premium: number;
  created_at: string;
}

function EstimatePrintContent() {
  const searchParams = useSearchParams();
  const requestNumber = searchParams.get('request');
  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestNumber) {
      setError('견적 번호가 없습니다.');
      setLoading(false);
      return;
    }

    const fetchEstimate = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/estimate/${requestNumber}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.message || '견적서를 불러올 수 없습니다.');
          return;
        }

        setEstimateData(result.data);
      } catch (err) {
        console.error('견적서 조회 오류:', err);
        setError('견적서를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [requestNumber]);

  useEffect(() => {
    if (!loading && estimateData) {
      // 페이지 로드 후 자동으로 인쇄 다이얼로그 실행
      window.print();
    }
  }, [loading, estimateData]);

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <p>견적서를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !estimateData) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <p>{error || '견적서를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  // 견적일자 포맷팅
  const formatEstimateDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // 보험기간 포맷팅
  const formatInsurancePeriod = () => {
    const startDate = estimateData.start_date.replace(/-/g, '.');
    const endDate = estimateData.end_date.replace(/-/g, '.');
    return `${startDate} ${estimateData.start_hour}시 ~ ${endDate} ${estimateData.end_hour}시`;
  };

  // 보험료 포맷팅
  const formatPremium = (premium: number): string => {
    if (premium === 0) return '0원';
    return `${premium.toLocaleString()}원`;
  };

  // PC 버전과 동일한 구조로 작성 필요
  // 현재는 기본 구조만 제공
  const estimateDate = formatEstimateDate(estimateData.created_at);
  const insurancePeriod = formatInsurancePeriod();

  return (
    <div className="estimate-print-mobile">
      <div style={{ padding: '20px' }}>
        <h1>투어밸리 여행자보험 견적서</h1>
        <p>견적일자: {estimateDate}</p>
        <p>보험종류: {estimateData.insurance_type}</p>
        <p>고객명: {estimateData.contractor_name}</p>
        <p>보험기간: {insurancePeriod}</p>
        <p>인원: {estimateData.tour_num}명</p>
        <p>합계보험료: {formatPremium(estimateData.total_premium)}</p>
        <p>피보험자 리스트 및 상세 정보는 PC 버전과 동일한 구조로 추가 구현 필요</p>
      </div>
    </div>
  );
}

export default function EstimatePrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>로딩 중...</div>}>
      <EstimatePrintContent />
    </Suspense>
  );
}
