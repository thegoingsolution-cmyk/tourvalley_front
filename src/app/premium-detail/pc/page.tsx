'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './page.css';

function PCPremiumDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const decodedReturnUrl = returnUrl ? decodeURIComponent(returnUrl) : null;
  const [participants, setParticipants] = useState<Array<{
    id: number;
    name: string;
    gender: string;
    birthDate: string;
    planType: string;
    premium: number;
  }>>([]);
  const [totalPremium, setTotalPremium] = useState(0);
  const [hasMedicalExpense, setHasMedicalExpense] = useState(true);

  // 데이터 정규화 함수 (다양한 데이터 소스에서 일관된 형식으로 변환)
  const normalizeParticipants = (participants: any[]): Array<{
    id: number;
    name: string;
    gender: string;
    birthDate: string;
    planType: string;
    premium: number;
  }> => {
    if (!Array.isArray(participants)) return [];
    
    return participants.map((p: any, index: number) => ({
      id: p.id || index + 1,
      name: p.name || '',
      gender: p.gender || '남자',
      birthDate: p.birthDate || p.birth_date || '',
      planType: p.planType || p.plan_type || '',
      premium: typeof p.premium === 'number' ? p.premium : (typeof p.premium === 'string' ? parseFloat(p.premium) || 0 : 0),
    }));
  };

  useEffect(() => {
    const contractId = searchParams.get('contractId');
    
    if (contractId) {
      // 계약 ID로 피보험자 정보 조회
      fetchParticipants(contractId);
    } else {
      // 기존 방식: URL 파라미터나 localStorage에서 데이터 가져오기
      const data = searchParams.get('data');
      if (data) {
        try {
          const parsed = JSON.parse(decodeURIComponent(data));
          const normalizedParticipants = normalizeParticipants(parsed.participants || []);
          setParticipants(normalizedParticipants);
          setTotalPremium(parsed.totalPremium || parsed.total_premium || 0);
          setHasMedicalExpense(parsed.hasMedicalExpense ?? parsed.has_medical_expense ?? true);
        } catch (error) {
          console.error('데이터 파싱 오류:', error);
        }
      } else {
        const stored = localStorage.getItem('premiumDetailData');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const normalizedParticipants = normalizeParticipants(parsed.participants || []);
            setParticipants(normalizedParticipants);
            setTotalPremium(parsed.totalPremium || parsed.total_premium || 0);
            setHasMedicalExpense(parsed.hasMedicalExpense ?? parsed.has_medical_expense ?? true);
          } catch (error) {
            console.error('데이터 파싱 오류:', error);
          }
        }
      }
    }
  }, [searchParams]);

  const fetchParticipants = async (contractId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/participants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setParticipants(data.participants || []);
          setTotalPremium(data.totalPremium || 0);
          setHasMedicalExpense(data.hasMedicalExpense ?? true);
        }
      } else {
        console.error('피보험자 정보 조회 실패');
      }
    } catch (error) {
      console.error('피보험자 정보 조회 오류:', error);
    }
  };

  return (
    <div className="premium-detail-page">
      <div className="premium-detail-content">
        <div className="form-section">
          <div className="form-container">
            <div className="form-card">
              <div className="modal-header">
                <h2 className="modal-title">가입자 자세히보기</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => {
                    if (decodedReturnUrl) {
                      if (decodedReturnUrl.startsWith('/group-insurance/m')) {
                        try {
                          sessionStorage.setItem('groupInsuranceReturn', '1');
                        } catch (error) {
                          console.error('복귀 플래그 저장 오류:', error);
                        }
                      }
                      router.push(decodedReturnUrl);
                      return;
                    }
                    window.close();
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="insured-list-section">
                  <h3 className="insured-list-title">가입자명단</h3>
                  <table className="insured-table">
                    <thead>
                      <tr>
                        <th>순번</th>
                        <th>성명</th>
                        <th>성별</th>
                        <th>생년월일</th>
                        <th>플랜</th>
                        <th>보험료</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => (
                        <tr key={participant.id}>
                          <td>{index + 1}</td>
                          <td>{participant.name}</td>
                          <td>{participant.gender === '남자' ? '남' : '여'}</td>
                          <td>{participant.birthDate}</td>
                          <td>
                            <button 
                              className="plan-badge-btn"
                              onClick={() => {
                                window.open(`/coverage-detail?planType=${participant.planType}&hasMedicalExpense=${hasMedicalExpense}`, '_blank');
                              }}
                            >
                              {participant.planType || '-'}
                            </button>
                          </td>
                          <td>{typeof participant.premium === 'number' && participant.premium > 0 ? participant.premium.toLocaleString() : '0'}원</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="plan-detail-note">
                    ※ 플랜명을 클릭하면 보장내용 상세보기가 가능합니다.
                  </p>
                </div>

                <div className="premium-summary-section">
                  <div className="summary-item">
                    총 가입자: <strong>{participants.length}명</strong>
                  </div>
                  <div className="summary-item">
                    총 보험료: <strong>{Math.floor(totalPremium || 0).toLocaleString()}원</strong>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="confirm-btn"
                    onClick={() => window.close()}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PCPremiumDetailPage() {
  return (
    <Suspense fallback={
      <div className="premium-detail-page">
        <div className="premium-detail-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>로딩 중...</div>
        </div>
      </div>
    }>
      <PCPremiumDetailContent />
    </Suspense>
  );
}

