'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import { getImagePath } from '@/utils/path';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

interface QnaResponse {
  id: number;
  content: string;
  responder_name: string;
  created_at: string;
}

interface QnaDetail {
  id: number;
  title: string;
  content: string | null;
  author_name: string;
  status: string;
  is_secret?: number;
  is_secret_required?: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  response?: QnaResponse;
}

export default function QnaDetailPCPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const qnaId = params?.id as string;
  const from = searchParams?.get('from');
  const { isLoggedIn, member } = useAuth();

  const [qna, setQna] = useState<QnaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Q&A 상세 불러오기
  useEffect(() => {
    const fetchQnaDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // 본인 확인을 위해 author_name을 쿼리 파라미터로 전달
        const authorName = isLoggedIn && member ? member.name : '';
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/customer-inquiries/${qnaId}${authorName ? `?author_name=${encodeURIComponent(authorName)}` : ''}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.inquiry) {
          const inquiry = data.inquiry;
          
          // 비밀글인 경우 비밀번호 필요 여부 확인
          if (inquiry.is_secret === 1 && inquiry.is_secret_required) {
            // 본인이 아닌 경우 비밀번호 모달 표시
            setQna(inquiry);
            setShowPasswordModal(true);
          } else {
            setQna(inquiry);
          }
        } else {
          setError(data.message || 'Q&A를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Q&A 로드 에러:', err);
        setError('Q&A를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    if (qnaId) {
      fetchQnaDetail();
    }
  }, [qnaId, isLoggedIn, member]);
  
  // 비밀번호 확인
  const handleVerifyPassword = async () => {
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      setPasswordError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/customer-inquiries/${qnaId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success && data.inquiry) {
        setQna(data.inquiry);
        setShowPasswordModal(false);
        setPassword('');
        setPasswordError(null);
      } else {
        setPasswordError(data.message || '비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error('비밀번호 확인 에러:', err);
      setPasswordError('비밀번호 확인 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  const handleGoBack = () => {
    router.push('/customer-center?view=qna');
  };

  return (
    <div id="isbwrapper" className="qna-detail-pc">
      <Header isMobile={false} />

      <main 
        className="main_bg01 main_bg01_w"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* 오른쪽 고정 버튼 */}
        <div className="container_box_w">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCashModal(true); }}>
            <div className="fixedRight_b01">
              <p className="icon_cash"><span className="icon_cash01"></span></p>
              <p className="fixedRight_txt01">무사고캐시란?</p>
            </div>
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); setShowServiceModal(true); }}>
            <div className="fixedRight_b02" style={{}}>
              <p className="icon_menu"><span className="icon_menu01"></span></p>
              <p className="fixedRight_txt02">서비스<br/>전체보기</p>
            </div>
          </a>
        </div>

        <section className="container_w">
          <div className="container_box">
            <header id="header">
              <div className="tourG_header_inner tourG_header_line">
                <span className="tourG_title">Q&A 게시판</span>
              </div>
            </header>

            <div id="contentWrap">
              {loading ? (
                <div className="loading-message">
                  <p>Q&A를 불러오는 중입니다...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={handleGoBack} className="retry-button">
                    목록으로 돌아가기
                  </button>
                </div>
              ) : qna ? (
                <section className="bgcolor_white ptb20 prow_01 mb_base">
                  <div className="B02_Notice_ContBox bgcolor_white mb_base">
                    <div className="B02_Notice_Head">
                      <div>
                        <span className="B02_Notice_HeadTxt">{qna.title}</span>
                      </div>
                      <div className="B02_Notice_date">
                        <span>{formatDate(qna.created_at)}</span>
                      </div>
                    </div>
                    <div className="B02_Notice_contBox">
                      <div className="qna-detail-info">
                        <div className="qna-detail-meta">
                          <span>작성자: {qna.author_name}</span>
                          <span>조회수: {qna.view_count}</span>
                          <span className={`qna-status qna-status-${qna.status === '완료' ? 'completed' : 'pending'}`}>
                            [{qna.status}]
                          </span>
                        </div>
                      </div>
                      {qna.content ? (
                        <div
                          className="notice-content"
                          dangerouslySetInnerHTML={{ __html: qna.content }}
                        />
                      ) : (
                        <div className="qna-secret-message">
                          <p>비밀글입니다. 비밀번호를 입력해주세요.</p>
                        </div>
                      )}
                    </div>
                    {/* 관리자 답변 영역 */}
                    {qna.response && (
                      <div className="B02_Notice_ContBox bgcolor_white mb_base qna-response-box">
                        <div className="B02_Notice_Head qna-response-head">
                          <span className="B02_Notice_HeadTxt">관리자 답변</span>
                          <div className="B02_Notice_date">
                            <span>담당자: {qna.response.responder_name}</span>
                            <span>{formatDate(qna.response.created_at)}</span>
                          </div>
                        </div>
                        <div className="B02_Notice_contBox">
                          <div
                            className="notice-content qna-response-content"
                            dangerouslySetInnerHTML={{ __html: qna.response.content }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="B02_Back_ListBtn">
                      <a href="#" onClick={(e) => { e.preventDefault(); handleGoBack(); }}>
                        목록
                      </a>
                    </div>
                  </div>
                </section>
              ) : (
                <div className="error-message">
                  <p>Q&A를 찾을 수 없습니다.</p>
                  <button onClick={handleGoBack} className="retry-button">
                    목록으로 돌아가기
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer isMobile={false} />

      {/* 서비스 전체보기 모달 */}
      <ServiceModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
      />

      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />

      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-content modal-password" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>비밀글 확인</h2>
              <button className="modal-close" onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
                setPasswordError(null);
                handleGoBack();
              }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>비밀번호 <span className="required">*</span></label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="form-input"
                  placeholder="비밀번호를 입력하세요"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword();
                    }
                  }}
                />
                {passwordError && (
                  <div className="form-error">{passwordError}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={handleVerifyPassword}>확인</button>
              <button className="cancel-btn" onClick={() => {
                setShowPasswordModal(false);
                setPassword('');
                setPasswordError(null);
                handleGoBack();
              }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

