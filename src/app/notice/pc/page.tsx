'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import { getImagePath } from '@/utils/path';
import { getNotices, Notice } from '@/utils/api';
import './page.css';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface NoticePCProps {
  // Props if needed
}

export default function NoticePCPage(props: NoticePCProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  // 공지사항 목록 불러오기
  const fetchNotices = async (page: number, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getNotices({
        page,
        limit: 5,
        search: search || undefined,
        searchType: 'title'
      });

      if (response.success) {
        setNotices(response.data.notices);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || '공지사항을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('공지사항 로드 에러:', err);
      setError('공지사항을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchNotices(1);
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('검색할 단어를 입력해 주세요.');
      return;
    }
    fetchNotices(1, searchQuery);
  };

  const handleNoticeClick = (noticeId: number) => {
    router.push(`/notice/detail/${noticeId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNotices(page, searchQuery || undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClose = () => {
    router.back();
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

  return (
    <div id="isbwrapper" className="notice-list-pc">
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
                <span className="tourG_title">공지사항</span>
              </div>
            </header>

            <div id="contentWrap">
              <div className="B02_Notice_List bgcolor_white mb_base">
                {loading ? (
                  <div className="loading-message">
                    <p>공지사항을 불러오는 중입니다...</p>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => fetchNotices(currentPage)} className="retry-button">
                      다시 시도
                    </button>
                  </div>
                ) : notices.length === 0 ? (
                  <div className="empty-message">
                    <p>등록된 공지사항이 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <ul className="board_list_item">
                      {notices.map((notice) => (
                        <li key={notice.id}>
                          <div className="subject">
                            <a 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleNoticeClick(notice.id);
                              }}
                            >
                              {notice.title}
                            </a>
                          </div>
                          <div className="row">
                            <span>{notice.author_name}</span>
                            <span>{formatDate(notice.created_at)}</span>
                            <span>
                              조회수<em className="renum">{notice.view_count.toLocaleString()}</em>
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {pagination && pagination.totalPages > 0 && (
                      <div className="board_foot">
                        <ul className="paging">
                          {pagination.hasPrev && (
                            <li className="prev">
                              <a 
                                href="#" 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  handlePageChange(currentPage - 1); 
                                }}
                              >
                                이전
                              </a>
                            </li>
                          )}
                          
                          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <li key={page} className={currentPage === page ? 'on' : ''}>
                              <a 
                                href="#" 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  if (currentPage !== page) {
                                    handlePageChange(page); 
                                  }
                                }}
                              >
                                {page}
                              </a>
                            </li>
                          ))}

                          {pagination.hasNext && (
                            <li className="next">
                              <a 
                                href="#" 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  handlePageChange(currentPage + 1); 
                                }}
                              >
                                다음
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                <div className="in_wrap">
                  <div className="bg_join input_cell">
                    <div className="phoneArea">
                      <label className="lab_g" htmlFor="sch">
                        검색
                      </label>
                      <input
                        type="text"
                        maxLength={30}
                        className="tf_g"
                        id="sch"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                        placeholder="제목을 입력하세요"
                      />
                    </div>
                    <button className="btnConfirm" onClick={handleSearch}>
                      검색
                    </button>
                  </div>
                </div>
              </div>
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
    </div>
  );
}

