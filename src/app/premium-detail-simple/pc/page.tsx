'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import '../../premium-detail/pc/page.css';

interface InsuredData {
  name: string;
  countryType: 'D' | 'F';
  engName: string;
  birthDate: string;
  gender: 'M' | 'W';
  ssn1: string;
  ssn2: string;
  country: string;
}

function PCPremiumDetailSimpleContent() {
  const searchParams = useSearchParams();
  const [participants, setParticipants] = useState<Array<{
    id: number;
    name: string;
    gender: string;
    birthDate: string;
  }>>([]);
  const [insuredData, setInsuredData] = useState<InsuredData[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [travelTab, setTravelTab] = useState<'DS' | 'FS' | 'FL'>('DS');

  useEffect(() => {
    // URL 파라미터에서 데이터 가져오기 (또는 localStorage에서)
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        setParticipants(parsed.participants || []);
        if (parsed.insuredData && Array.isArray(parsed.insuredData)) {
          setInsuredData(parsed.insuredData);
        }
        if (parsed.participantCount) {
          setParticipantCount(Number(parsed.participantCount));
        }
        if (parsed.tab && (parsed.tab === 'DS' || parsed.tab === 'FS' || parsed.tab === 'FL')) {
          setTravelTab(parsed.tab);
        }
      } catch (error) {
        console.error('데이터 파싱 오류:', error);
      }
    } else {
      // localStorage에서 가져오기 (fallback)
      const stored = localStorage.getItem('premiumDetailData');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setParticipants(parsed.participants || []);
          if (parsed.insuredData && Array.isArray(parsed.insuredData)) {
            setInsuredData(parsed.insuredData);
          }
          if (parsed.participantCount) {
            setParticipantCount(Number(parsed.participantCount));
          }
          if (parsed.tab && (parsed.tab === 'DS' || parsed.tab === 'FS' || parsed.tab === 'FL')) {
            setTravelTab(parsed.tab);
          }
        } catch (error) {
          console.error('데이터 파싱 오류:', error);
        }
      }
    }
  }, [searchParams]);

  const buildParticipantsPayload = () => {
    if (insuredData.length > 0) {
      return insuredData.map((insured, index) => ({
        id: index + 1,
        name: insured.name,
        nationality: insured.countryType === 'F' ? '외국인' : '내국인',
        birthDate: insured.birthDate,
        gender: insured.gender === 'W' ? '여자' : '남자',
        email1: '',
        email2: '',
        phone: '',
        isVerified: false,
      }));
    }

    return participants.map((participant, index) => ({
      id: index + 1,
      name: participant.name,
      nationality: '내국인',
      birthDate: participant.birthDate,
      gender: participant.gender,
      email1: '',
      email2: '',
      phone: '',
      isVerified: false,
    }));
  };

  const handleConfirm = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'PARTICIPANT_INPUT_CONFIRM',
        participants: buildParticipantsPayload(),
        participantCount: participantCount,
        insuredData: insuredData,
      }, window.location.origin);
    }

    window.close();
  };

  const handleEditClick = () => {
    const width = 500;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      `/group-insurance/participant-input?tab=${travelTab}`,
      'participantInput',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    // 팝업이 준비되면 기존 데이터 전달
    if (popup && insuredData.length > 0) {
      const sendData = () => {
        popup.postMessage({
          type: 'LOAD_INSURED_DATA',
          insuredData: insuredData,
          participantCount: participantCount,
        }, window.location.origin);
      };
      
      // 팝업에서 준비 완료 신호를 받으면 데이터 전달
      const handleReady = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data && event.data.type === 'PARTICIPANT_INPUT_READY') {
          window.removeEventListener('message', handleReady);
          setTimeout(sendData, 100); // 약간의 지연을 두어 React가 마운트될 시간을 줌
        }
      };
      
      window.addEventListener('message', handleReady);
      
      // 최대 5초 대기 후 리스너 제거
      setTimeout(() => {
        window.removeEventListener('message', handleReady);
      }, 5000);
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
                  onClick={() => window.close()}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="insured-list-section">
                  <h3 className="insured-list-title">가입자(피보험자)명단</h3>
                  <table className="insured-table">
                    <thead>
                      <tr>
                        <th>NO</th>
                        <th>이름</th>
                        <th>성별</th>
                        <th>생년월일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => (
                        <tr key={participant.id}>
                          <td>{index + 1}</td>
                          <td>{participant.name}</td>
                          <td>{participant.gender === '남자' ? '남' : '여'}</td>
                          <td>{participant.birthDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="modal-footer">
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                    }}
                  >
                    <button
                      className="confirm-btn"
                      onClick={handleConfirm}
                    >
                      확인
                    </button>
                    <button
                      className="confirm-btn"
                      onClick={handleEditClick}
                    >
                      수정
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PCPremiumDetailSimplePage() {
  return (
    <Suspense
      fallback={
        <div className="premium-detail-page">
          <div
            className="premium-detail-content"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <div>로딩 중...</div>
          </div>
        </div>
      }
    >
      <PCPremiumDetailSimpleContent />
    </Suspense>
  );
}
