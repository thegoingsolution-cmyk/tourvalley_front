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

function CustomerCenterContent() {
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
    // 검색 기능 구현
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
    <div className="customer-form-section">
      <div className="customer-form-card">
        {/* Hero Section */}
        <div className="customer-hero">
          <h1 className="customer-hero-title">고객센터</h1>
          <div className="customer-hero-content">
            <div className="customer-hero-image">
              <img src={getImagePath('/images/customer_c_main.png')} alt="고객센터 메인" />
            </div>
            <div className="customer-hero-description">
              <p>출국교안하신 여행은?</p>
              <p>20년 노하우의 여행자보험 전문</p>
              <p className="customer-hero-highlight">투어밸리의 함께 하세요!</p>
            </div>
            <div className="customer-hero-buttons">
              <button className="customer-hero-button" onClick={() => window.location.href = '/customer-center?view=main'}>가입/신청내역 조회</button>
              <button className="customer-hero-button" onClick={() => window.location.href = '/customer-center?view=qna'}>Q&A게시판</button>
            </div>
          </div>          
        </div>

        {/* Insurance Section */}
        <div className="customer-insurance-section">
          <h2 className="customer-section-title">보험금 청구안내</h2>
          <div className="customer-insurance-cards">
            <a href="?view=chubb" className="customer-insurance-card">
              <img src={getImagePath('/images/logo_L77.png')} alt="CHUBB" className="customer-insurance-logo" />
              <div className="customer-insurance-text-wrapper">
                <span className="customer-insurance-text">CHUBB에이스손해보험</span>
                <img src={getImagePath('/images/g_more.png')} alt="더보기" className="customer-insurance-arrow" />
              </div>
            </a>
            <a href="?view=hyundai" className="customer-insurance-card customer-insurance-card-highlight">
              <img src={getImagePath('/images/logo_N09.png')} alt="현대해상" className="customer-insurance-logo" />
              <div className="customer-insurance-text-wrapper">
                <span className="customer-insurance-text">현대해상</span>
                <img src={getImagePath('/images/g_more.png')} alt="더보기" className="customer-insurance-arrow" />
              </div>
            </a>
          </div>
        </div>

        {/* Notice Section */}
        <div className="customer-notice-section">
          <h2 className="customer-section-title">공지사항</h2>
          <ul className="customer-notice-list">
            {notices.length > 0 ? (
              notices.map((notice) => (
                <li key={notice.id}>
                  <a href={`/customer-center?view=notice&id=${notice.id}`} className="customer-notice-link">
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
    </div>
  );

  const renderChubbView = () => (
    <div className="customer-form-section">
      <div className="customer-form-card">
        <div className="customer-detail-header">
          <h1 className="customer-detail-title">라이나손해보험</h1>
          <a href="?view=main" className="customer-detail-back">← 뒤로가기</a>
        </div>
        
        <div className="customer-detail-notice">
          <p>해외에서 보험사고가 발생하여 영문 증빙서류를 관련회사로 제출한 경우 보험사에 사고 내역만 별도로 우선 전달합니다.</p>
          <p>특별 유첨한 증빙 서류를 받거나 ADJ와 단계별로 ARudeo Rapoo대에 달기관야 오시기 바랍니다.</p>
          <p>보험금 청구기간은 사고발생대지 3년입니다.</p>
        </div>

        <div className="customer-detail-contacts">
          <p>• 에이스 손해보험 고객센터: 1666-5075</p>
          <p>• 해외 24시간 SOS 심야전화: +82-1588-1983</p>
        </div>

        <div className="customer-detail-tabs">
          <button 
            className={`customer-tab ${activeTab === '일반' ? 'active' : ''}`}
            onClick={() => setActiveTab('일반')}
          >
            일반
          </button>
          <button 
            className={`customer-tab ${activeTab === '주대응' ? 'active' : ''}`}
            onClick={() => setActiveTab('주대응')}
          >
            주대응
          </button>
          <button 
            className={`customer-tab ${activeTab === '배상책임' ? 'active' : ''}`}
            onClick={() => setActiveTab('배상책임')}
          >
            배상책임
          </button>
          <button 
            className={`customer-tab ${activeTab === '한정된 자산에 대한 추가보장' ? 'active' : ''}`}
            onClick={() => setActiveTab('한정된 자산에 대한 추가보장')}
          >
            한정된 자산에 대한<br/>추가보장
          </button>
        </div>

        <div className="customer-detail-content">
          {activeTab === '일반' && (
            <div className="customer-procedure">
              <ol>
                <li>1. 보험금청구서(위 개인(심돌부상)차변제외서 / 제반비용 포함)</li>
                <li>2. 여권사본</li>
                <li>3. 청구인 신분증사본</li>
                <li>4. 가족관계 확인(금전사)보험금과역 미성년자의 경우 등) 가족관계제공력서, 주민등록등본 등</li>
              </ol>
              
              <div className="customer-procedure-section">
                <h3>= 해민진료비 =</h3>
                <ol>
                  <li>1. 진단서(MEDICAL RECORD)</li>
                  <li>2. 치료비수수증(원본)</li>
                </ol>
              </div>

              <div className="customer-procedure-section">
                <h3>= 국내혜산비(일일알) =</h3>
                <ol>
                  <li>1. 카드이(신용카) 보든 국국내자에저긔 해당성</li>
                  <li>2. 진단서</li>
                  <li>3. (50만원 이하인 진단어이 포활한 입원계획치아서 보든 진해계산서의서 내의 기능)</li>
                  <li>4. 전원비제산서(영수증)</li>
                  <li>5. 진료비 제제산서(영수 체제)</li>
                </ol>
              </div>

              <div className="customer-procedure-section">
                <h3>= 국내혜산비(배손긔) =</h3>
                <ol>
                  <li>1. 카드이(신용카) 보든 국국내자에저긔 해당성</li>
                  <li>2. 진단서(치) 또질접 사류(진산서서, 통관계산서, 처분서, 소과서, 진료카드조 등)</li>
                  <li>3. 전원비제산서(영수증)</li>
                </ol>
              </div>
            </div>
          )}
          {/* 다른 탭 내용은 필요시 추가 */}
        </div>
      </div>
    </div>
  );

  const renderHyundaiView = () => (
    <div className="customer-form-section">
      <div className="customer-form-card">
        <div className="customer-detail-header">
          <h1 className="customer-detail-title">현대해상</h1>
          <a href="?view=main" className="customer-detail-back">← 뒤로가기</a>
        </div>
        
        <div className="customer-detail-notice">
          <p>해외에서 보험사고가 발생하여 영문 증빙서류를 관련회사로 제출한 경우 보험사에 사고 내역만 별도로 우선 전달합니다.</p>
          <p>특별 유첨한 증빙 서류를 받거나 ADJ와 단계별로 ARudeo Rapoo대에 달기관야 오시기 바랍니다.</p>
          <p>보험금 청구기간은 사고발생대지 3년입니다.</p>
        </div>

        <div className="customer-detail-contacts">
          <p>• 현대해상 고객센터: 1899-6782</p>
        </div>

        <div className="customer-detail-tabs">
          <button 
            className={`customer-tab ${activeTab === '일반' ? 'active' : ''}`}
            onClick={() => setActiveTab('일반')}
          >
            일반
          </button>
          <button 
            className={`customer-tab ${activeTab === '주대응' ? 'active' : ''}`}
            onClick={() => setActiveTab('주대응')}
          >
            주대응
          </button>
          <button 
            className={`customer-tab ${activeTab === '배상책임' ? 'active' : ''}`}
            onClick={() => setActiveTab('배상책임')}
          >
            배상책임
          </button>
          <button 
            className={`customer-tab ${activeTab === '한정된 자산에 대한 추가보장' ? 'active' : ''}`}
            onClick={() => setActiveTab('한정된 자산에 대한 추가보장')}
          >
            한정된 자산에 대한<br/>추가보장
          </button>
        </div>

        <div className="customer-detail-content">
          {activeTab === '일반' && (
            <div className="customer-procedure">
              <ol>
                <li>1. 보험금청구서(위 개인(심돌부상)차변제외서 / 제반비용 포함)</li>
                <li>2. 여권사본</li>
                <li>3. 청구인 신분증사본</li>
                <li>4. 가족관계 확인(금전사)보험금과역 미성년자의 경우 등) 가족관계제공력서, 주민등록등본 등</li>
              </ol>
              
              <div className="customer-procedure-section">
                <h3>= 해민진료비 =</h3>
                <ol>
                  <li>1. 진단서(MEDICAL RECORD)</li>
                  <li>2. 치료비수수증(원본)</li>
                </ol>
              </div>

              <div className="customer-procedure-section">
                <h3>= 국내혜산비(일일알) =</h3>
                <ol>
                  <li>1. 카드이(신용카) 보든 국국내자에저긔 해당성</li>
                  <li>2. 진단서</li>
                  <li>3. (50만원 이하인 진단어이 포활한 입원계획치아서 보든 진해계산서의서 내의 기능)</li>
                  <li>4. 전원비제산서(영수증)</li>
                  <li>5. 진료비 제제산서(영수 체제)</li>
                </ol>
              </div>

              <div className="customer-procedure-section">
                <h3>= 국내혜산비(배손긔) =</h3>
                <ol>
                  <li>1. 카드이(신용카) 보든 국국내자에저긔 해당성</li>
                  <li>2. 진단서(치) 또질접 사류(진산서서, 통관계산서, 처분서, 소과서, 진료카드조 등)</li>
                  <li>3. 전원비제산서(영수증)</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderNoticeDetailView = () => {
    if (!noticeDetail) {
      return (
        <div className="customer-form-section">
          <div className="customer-form-card">
            <div className="customer-notice-loading">로딩 중...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="customer-form-section">
        <div className="customer-form-card">
          <div className="customer-notice-detail-header">
            <h1 className="customer-notice-detail-title">Q&A 게시판</h1>
          </div>

          <div className="customer-notice-detail-content">
            <h2 className="customer-notice-detail-subject">{noticeDetail.title}</h2>
            <div className="customer-notice-detail-date">{formatNoticeDate(noticeDetail.created_at)}</div>
            
            <div className="customer-notice-detail-divider"></div>
            
            <div 
              className="customer-notice-detail-body"
              dangerouslySetInnerHTML={{ __html: noticeDetail.content || '' }}
            />
          </div>

          <div className="customer-notice-detail-footer">
            <button 
              className="customer-notice-detail-list-btn"
              onClick={() => window.location.href = '/customer-center?view=main'}
            >
              목록
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQnaView = () => (
    <div className="customer-form-section">
      <div className="customer-form-card">
        <div className="customer-qna-header">
          <h1 className="customer-qna-title">Q&A 게시판</h1>
          <button onClick={() => window.history.back()} className="customer-qna-close">
            나가기
          </button>
        </div>

        <div className="customer-qna-list">
          {qnaList.length === 0 ? (
            <div className="customer-qna-no-data">등록된 질의가 없습니다.</div>
          ) : (
            qnaList.map((item) => (
              <div key={item.id} className="customer-qna-item">
                <div className="customer-qna-subject">
                  <span className="customer-qna-status-badge" data-status={item.status}>
                    [{item.status}]
                  </span>
                  {item.is_secret === 1 && <span className="customer-qna-secret-icon">🔒</span>}
                  <a href={`#detail-${item.id}`} className="customer-qna-link">{item.title}</a>
                </div>
                <div className="customer-qna-info">
                  <span>{item.author_name}</span>
                  <span>{formatNoticeDate(item.created_at)}</span>
                  <span>조회수 <em className="customer-qna-views">{item.view_count}</em></span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="customer-qna-footer">
          {qnaPagination.totalPages > 0 && (
            <ul className="customer-qna-pagination">
              {Array.from({ length: Math.min(5, qnaPagination.totalPages) }, (_, i) => i + 1).map((page) => (
                <li key={page} className={page === qnaPagination.page ? 'active' : ''}>
                  <a href="#" onClick={(e) => { e.preventDefault(); fetchQnaList(page); }}>{page}</a>
                </li>
              ))}
              {qnaPagination.totalPages > 5 && qnaPagination.page < qnaPagination.totalPages && (
                <li className="next">
                  <a href="#" onClick={(e) => { e.preventDefault(); fetchQnaList(qnaPagination.page + 1); }}>›</a>
                </li>
              )}
            </ul>
          )}
          
          <div className="customer-qna-search">
            <div className="customer-qna-search-box">
              <input 
                type="text" 
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="검색" 
                className="customer-qna-search-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="customer-qna-search-btn">검색</button>
            </div>
          </div>

          <div className="customer-qna-register">
            <button className="customer-qna-register-btn" onClick={() => {
              setQnaWriteForm({
                title: '',
                content: '',
                author_name: isLoggedIn && member ? member.name : '',
                is_secret: false,
                secret_password: '',
              });
              setShowQnaWriteModal(true);
            }}>등록하기</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="customer-center-page-pc">
      <Header />
      <main 
        className="customer-center-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {view === 'main' && renderMainView()}
        {view === 'chubb' && renderChubbView()}
        {view === 'hyundai' && renderHyundaiView()}
        {view === 'qna' && renderQnaView()}
        {view === 'notice' && renderNoticeDetailView()}

        {/* Floating Buttons */}
        <div className="floating-buttons">
          <button className="floating-btn cash-btn">
            <img src={getImagePath('/icons/icon_cash.png')} alt="무사고캐시" className="floating-icon-img" />
            <span className="floating-text">무사고캐시란?</span>
          </button>
          <button className="floating-btn service-btn">
            <img src={getImagePath('/icons/icon_menu.png')} alt="서비스 전체보기" className="floating-icon-img" />
            <span className="floating-text">서비스<br/>전체보기</span>
          </button>
        </div>
      </main>
      <Footer />

      {/* Q&A 질문 등록 모달 */}
      {showQnaWriteModal && (
        <div className="modal-overlay" onClick={() => setShowQnaWriteModal(false)}>
          <div className="modal-content modal-qna" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>질문하기</h2>
              <button className="modal-close" onClick={() => setShowQnaWriteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>작성자 <span className="required">*</span></label>
                <input
                  type="text"
                  value={qnaWriteForm.author_name}
                  onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, author_name: e.target.value })}
                  className="form-input"
                  placeholder="이름을 입력하세요"
                  readOnly={isLoggedIn && member !== null}
                  style={isLoggedIn && member !== null ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                />
              </div>
              <div className="form-group">
                <label>제목 <span className="required">*</span></label>
                <input
                  type="text"
                  value={qnaWriteForm.title}
                  onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, title: e.target.value })}
                  className="form-input"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>내용 <span className="required">*</span></label>
                <textarea
                  value={qnaWriteForm.content}
                  onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, content: e.target.value })}
                  className="form-textarea"
                  placeholder="질문 내용을 입력하세요"
                  rows={10}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={qnaWriteForm.is_secret}
                    onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, is_secret: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span>비밀글로 작성</span>
                </label>
              </div>
              {qnaWriteForm.is_secret && (
                <div className="form-group">
                  <label>비밀번호 <span className="required">*</span></label>
                  <input
                    type="password"
                    value={qnaWriteForm.secret_password}
                    onChange={(e) => setQnaWriteForm({ ...qnaWriteForm, secret_password: e.target.value })}
                    className="form-input"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={handleQnaSubmit}>등록</button>
              <button className="cancel-btn" onClick={() => setShowQnaWriteModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PCCustomerCenterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerCenterContent />
    </Suspense>
  );
}

