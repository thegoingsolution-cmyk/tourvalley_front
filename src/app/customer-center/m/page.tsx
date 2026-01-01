'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getImagePath } from '@/utils/path';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

interface QnaItem {
  id: number;
  title: string;
  author_name: string;
  status: string;
  is_secret: number;
  view_count: number;
  created_at: string;
}

interface Notice {
  id: number;
  title: string;
  content?: string;
  author_name: string;
  view_count: number;
  created_at: string;
}

function MobileCustomerCenterContent() {
  const searchParams = useSearchParams();
  const view = searchParams?.get('view') || 'main';
  const noticeId = searchParams?.get('id');
  const { isLoggedIn, member } = useAuth();
  const [activeTab, setActiveTab] = useState('일반');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeDetail, setNoticeDetail] = useState<Notice | null>(null);
  const [qnaList, setQnaList] = useState<QnaItem[]>([]);
  const [qnaPagination, setQnaPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [showQnaWriteModal, setShowQnaWriteModal] = useState<boolean>(false);
  const [qnaWriteForm, setQnaWriteForm] = useState({
    title: '',
    content: '',
    author_name: '',
    is_secret: false,
    secret_password: '',
  });

  // 공지사항 목록 로드
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notices?limit=5`);
        const data = await response.json();
        if (data.success) {
          setNotices(data.notices);
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error);
      }
    };

    fetchNotices();
  }, []);

  // 공지사항 상세 로드
  useEffect(() => {
    if (view === 'notice' && noticeId) {
      const fetchNoticeDetail = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notices/${noticeId}`);
          const data = await response.json();
          if (data.success) {
            setNoticeDetail(data.notice);
          }
        } catch (error) {
          console.error('Failed to fetch notice detail:', error);
        }
      };

      fetchNoticeDetail();
    }
  }, [view, noticeId]);

  // Q&A 목록 로드
  useEffect(() => {
    if (view === 'qna') {
      fetchQnaList(1);
    }
  }, [view]);

  const fetchQnaList = async (page: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/customer-inquiries?page=${page}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setQnaList(data.inquiries);
        setQnaPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    }
  };

  const handleQnaSubmit = async () => {
    if (!qnaWriteForm.title || !qnaWriteForm.content || !qnaWriteForm.author_name) {
      alert('제목, 내용, 작성자를 모두 입력해주세요.');
      return;
    }

    if (qnaWriteForm.is_secret && !qnaWriteForm.secret_password) {
      alert('비밀글은 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/customer-inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qnaWriteForm),
      });

      const data = await response.json();

      if (data.success) {
        alert('질문이 등록되었습니다.');
        setShowQnaWriteModal(false);
        setQnaWriteForm({ title: '', content: '', author_name: '', is_secret: false, secret_password: '' });
        fetchQnaList(1);
      } else {
        alert(data.message || '질문 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Submit inquiry error:', error);
      alert('질문 등록 중 오류가 발생했습니다.');
    }
  };

  const handleSearch = () => {
    console.log('검색어:', searchKeyword);
  };

  const formatNoticeDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const renderMainView = () => (
    <div className="customer-main-container-mobile">
      <div className="customer-hero-mobile">
        <h1 className="customer-hero-title-mobile">고객센터</h1>
        <div className="customer-hero-image-mobile">
          <img src={getImagePath('/images/customer_c_main.png')} alt="고객센터" />
        </div>
        <div className="customer-hero-description-mobile">
          <p>출국교안하신 여행은?</p>
          <p>20년 노하우의 여행자보험 전문</p>
          <p className="customer-hero-highlight-mobile">투어밸리의 함께 하세요!</p>
        </div>
        <div className="customer-hero-buttons-mobile">
          <button className="customer-hero-button-mobile" onClick={() => window.location.href = '/customer-center?view=main'}>가입/신청내역 조회</button>
          <button className="customer-hero-button-mobile" onClick={() => window.location.href = '/customer-center?view=qna'}>Q&A게시판</button>
        </div>
      </div>

      <div className="customer-insurance-section-mobile">
        <h2 className="customer-section-title-mobile">보험금 청구안내</h2>
        <a href="?view=chubb" className="customer-insurance-card-mobile">
          <img src={getImagePath('/images/logo_L77.png')} alt="CHUBB" />
          <span>CHUBB에이스손해보험 ›</span>
        </a>
        <a href="?view=hyundai" className="customer-insurance-card-mobile customer-insurance-card-highlight-mobile">
          <img src={getImagePath('/images/logo_N09.png')} alt="현대해상" />
          <span>현대해상 ›</span>
        </a>
      </div>

      <div className="customer-notice-section-mobile">
        <h2 className="customer-section-title-mobile">공지사항</h2>
        <ul className="customer-notice-list-mobile">
          {notices.length > 0 ? (
            notices.map((notice) => (
              <li key={notice.id}>
                <a href={`/customer-center?view=notice&id=${notice.id}`} className="customer-notice-link-mobile">
                  • {notice.title}
                </a>
              </li>
            ))
          ) : (
            <li>• 등록된 공지사항이 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderDetailView = (title: string, phone: string) => (
    <div className="customer-detail-container-mobile">
      <div className="customer-detail-header-mobile">
        <h1 className="customer-detail-title-mobile">{title}</h1>
        <a href="?view=main" className="customer-detail-back-mobile">← 뒤로</a>
      </div>
      
      <div className="customer-detail-notice-mobile">
        <p>해외에서 보험사고가 발생하여 영문 증빙서류를 관련회사로 제출한 경우 보험사에 사고 내역만 별도로 우선 전달합니다.</p>
        <p>보험금 청구기간은 사고발생대지 3년입니다.</p>
      </div>

      <div className="customer-detail-contacts-mobile">
        <p>{phone}</p>
      </div>

      <div className="customer-detail-tabs-mobile">
        <button 
          className={`customer-tab-mobile ${activeTab === '일반' ? 'active' : ''}`}
          onClick={() => setActiveTab('일반')}
        >
          일반
        </button>
        <button 
          className={`customer-tab-mobile ${activeTab === '주대응' ? 'active' : ''}`}
          onClick={() => setActiveTab('주대응')}
        >
          주대응
        </button>
        <button 
          className={`customer-tab-mobile ${activeTab === '배상책임' ? 'active' : ''}`}
          onClick={() => setActiveTab('배상책임')}
        >
          배상책임
        </button>
        <button 
          className={`customer-tab-mobile ${activeTab === '한정된 자산에 대한 추가보장' ? 'active' : ''}`}
          onClick={() => setActiveTab('한정된 자산에 대한 추가보장')}
        >
          한정된 자산에<br/>대한 추가보장
        </button>
      </div>

      <div className="customer-detail-content-mobile">
        {activeTab === '일반' && (
          <div className="customer-procedure-mobile">
            <ol>
              <li>1. 보험금청구서 개인(심돌부상)차변제외서 / 제반비용 포함</li>
              <li>2. 여권사본</li>
              <li>3. 청구인 신분증사본</li>
              <li>4. 가족관계 확인 가족관계제공력서, 주민등록등본 등</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );

  const renderNoticeDetailView = () => {
    if (!noticeDetail) {
      return (
        <div className="customer-notice-detail-container-mobile">
          <div className="customer-notice-loading-mobile">로딩 중...</div>
        </div>
      );
    }

    return (
      <div className="customer-notice-detail-container-mobile">
        <div className="customer-notice-detail-header-mobile">
          <h1 className="customer-notice-detail-title-mobile">Q&A 게시판</h1>
        </div>

        <div className="customer-notice-detail-content-mobile">
          <h2 className="customer-notice-detail-subject-mobile">{noticeDetail.title}</h2>
          <div className="customer-notice-detail-date-mobile">{formatNoticeDate(noticeDetail.created_at)}</div>
          
          <div className="customer-notice-detail-divider-mobile"></div>
          
          <div 
            className="customer-notice-detail-body-mobile"
            dangerouslySetInnerHTML={{ __html: noticeDetail.content || '' }}
          />
        </div>

        <div className="customer-notice-detail-footer-mobile">
          <button 
            className="customer-notice-detail-list-btn-mobile"
            onClick={() => window.location.href = '/customer-center?view=main'}
          >
            목록
          </button>
        </div>
      </div>
    );
  };

  const renderQnaView = () => (
    <div className="customer-qna-container-mobile">
      <div className="customer-qna-header-mobile">
        <h1 className="customer-qna-title-mobile">Q&A 게시판</h1>
        <button onClick={() => window.history.back()} className="customer-qna-close-mobile">
          나가기
        </button>
      </div>

      <div className="customer-qna-list-mobile">
        {qnaList.length === 0 ? (
          <div className="customer-qna-no-data-mobile">등록된 질의가 없습니다.</div>
        ) : (
          qnaList.map((item) => (
            <div key={item.id} className="customer-qna-item-mobile">
              <div className="customer-qna-subject-mobile">
                <span className="customer-qna-status-badge-mobile" data-status={item.status}>
                  [{item.status}]
                </span>
                {item.is_secret === 1 && <span className="customer-qna-secret-icon-mobile">🔒</span>}
                <a href={`#detail-${item.id}`}>{item.title}</a>
              </div>
              <div className="customer-qna-info-mobile">
                <span>{item.author_name}</span>
                <span>{formatNoticeDate(item.created_at)}</span>
                <span>조회수 <em>{item.view_count}</em></span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="customer-qna-footer-mobile">
        {qnaPagination.totalPages > 0 && (
          <ul className="customer-qna-pagination-mobile">
            {Array.from({ length: Math.min(5, qnaPagination.totalPages) }, (_, i) => i + 1).map((page) => (
              <li key={page} className={page === qnaPagination.page ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); fetchQnaList(page); }}>{page}</a>
              </li>
            ))}
            {qnaPagination.totalPages > 5 && qnaPagination.page < qnaPagination.totalPages && (
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); fetchQnaList(qnaPagination.page + 1); }}>›</a>
              </li>
            )}
          </ul>
        )}
        
        <div className="customer-qna-search-mobile">
          <input 
            type="text" 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="검색" 
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>검색</button>
        </div>

        <button className="customer-qna-register-btn-mobile" onClick={() => setShowQnaWriteModal(true)}>등록하기</button>
      </div>
    </div>
  );

  return (
    <>
      <Header isMobile={true} />
      <main className="customer-center-page-mobile">
        {view === 'main' && renderMainView()}
        {view === 'chubb' && renderDetailView('라이나손해보험', '• 에이스 손해보험: 1666-5075')}
        {view === 'hyundai' && renderDetailView('현대해상', '• 현대해상: 1899-6782')}
        {view === 'qna' && renderQnaView()}
        {view === 'notice' && renderNoticeDetailView()}
      </main>
      <Footer isMobile={true} />

      {/* Q&A 질문 등록 모달 */}
      {showQnaWriteModal && (
        <div className="modal-overlay-mobile" onClick={() => setShowQnaWriteModal(false)}>
          <div className="modal-content-mobile modal-qna-mobile" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-mobile">
              <h2>질문하기</h2>
              <button className="modal-close-mobile" onClick={() => setShowQnaWriteModal(false)}>×</button>
            </div>
            <div className="modal-body-mobile">
              <div className="form-group-mobile">
                <label>작성자 <span className="required-mobile">*</span></label>
                <input
                  type="text"
                  value={qnaWriteForm.author_name}
                  onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, author_name: e.target.value })}
                  className="form-input-mobile"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div className="form-group-mobile">
                <label>제목 <span className="required-mobile">*</span></label>
                <input
                  type="text"
                  value={qnaWriteForm.title}
                  onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, title: e.target.value })}
                  className="form-input-mobile"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="form-group-mobile">
                <label>내용 <span className="required-mobile">*</span></label>
                <textarea
                  value={qnaWriteForm.content}
                  onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, content: e.target.value })}
                  className="form-textarea-mobile"
                  placeholder="질문 내용을 입력하세요"
                  rows={8}
                />
              </div>
              <div className="form-group-mobile">
                <label className="checkbox-label-mobile">
                  <input
                    type="checkbox"
                    checked={qnaWriteForm.is_secret}
                    onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, is_secret: e.target.checked })}
                    className="form-checkbox-mobile"
                  />
                  <span>비밀글로 작성</span>
                </label>
              </div>
              {qnaWriteForm.is_secret && (
                <div className="form-group-mobile">
                  <label>비밀번호 <span className="required-mobile">*</span></label>
                  <input
                    type="password"
                    value={qnaWriteForm.secret_password}
                    onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, secret_password: e.target.value })}
                    className="form-input-mobile"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer-mobile">
              <button className="save-btn-mobile" onClick={handleQnaSubmit}>등록</button>
              <button className="cancel-btn-mobile" onClick={() => setShowQnaWriteModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MobileCustomerCenterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileCustomerCenterContent />
    </Suspense>
  );
}

