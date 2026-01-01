'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './page.css';

function MobilePremiumDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        setParticipants(parsed.participants || []);
        setTotalPremium(parsed.totalPremium || 0);
        setHasMedicalExpense(parsed.hasMedicalExpense ?? true);
      } catch (error) {
        console.error('데이터 파싱 오류:', error);
      }
    } else {
      const stored = localStorage.getItem('premiumDetailData');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setParticipants(parsed.participants || []);
          setTotalPremium(parsed.totalPremium || 0);
          setHasMedicalExpense(parsed.hasMedicalExpense ?? true);
        } catch (error) {
          console.error('데이터 파싱 오류:', error);
        }
      }
    }
  }, [searchParams]);

  return (
    <div className="premium-detail-page-mobile">
      <div className="premium-detail-content-mobile">
        <div className="form-section">
          <div className="form-container">
            <div className="form-card">
              <div className="modal-header">
                <h2 className="modal-title">가입자 자세히보기</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => window.close()}
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
                              {participant.planType}
                            </button>
                          </td>
                          <td>{participant.premium.toLocaleString()}원</td>
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
                    총 보험료: <strong>{totalPremium.toLocaleString()}원</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 고정 버튼 */}
      <div className="fixed-bottom-button">
        <button
          className="confirm-btn"
          onClick={() => window.close()}
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function MobilePremiumDetailPage() {
  return (
    <Suspense fallback={
      <div className="premium-detail-page-mobile">
        <div className="premium-detail-content-mobile" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>로딩 중...</div>
        </div>
      </div>
    }>
      <MobilePremiumDetailContent />
    </Suspense>
  );
}

