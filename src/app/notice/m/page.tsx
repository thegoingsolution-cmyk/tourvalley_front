'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getImagePath } from '@/utils/path';
import './page.css';

interface Notice {
  id: number;
  title: string;
  author_name: string;
  view_count: number;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function NoticeMobilePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 공지사항 목록 불러오기
  const fetchNotices = async (page: number, search?: string) => {
    try {
      setLoading(true);
      
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notices?page=${page}&limit=10${search ? `&search=${search}&searchType=title` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data) {
        setNotices(data.data.notices || []);
        setPagination(data.data.pagination || null);
      } else {
        setNotices([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('공지사항 로드 에러:', error);
      setNotices([]);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <>
      <Header isMobile={true} />
      
      <main className="notice-mobile-page">
        {/* 타이틀 */}
        <div className="B02_Top_title_Line">
          <span>공지사항</span>
          <button onClick={() => router.back()} className="notice-close-btn">
            <img src={getImagePath('/icons/ico_btn_close_bl.png')} alt="닫기" />
          </button>
        </div>

        {/* 공지사항 리스트 */}
        <section className="notice-list-section">
          {loading ? (
            <div className="notice-loading">
              <p>공지사항을 불러오는 중입니다...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="notice-empty">
              <p>등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <>
              <ul className="notice-list">
                {notices.map((notice) => (
                  <li key={notice.id}>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleNoticeClick(notice.id);
                      }}
                    >
                      <div className="notice-title">{notice.title}</div>
                      <div className="notice-info">
                        <span>{notice.author_name}</span>
                        <span>{formatDate(notice.created_at)}</span>
                        <span>조회수 <em>{notice.view_count}</em></span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>

              {/* 페이지네이션 */}
              {pagination && pagination.totalPages > 0 && (
                <div className="notice-pagination">
                  <ul>
                    {pagination.hasPrev && (
                      <li>
                        <a 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            handlePageChange(currentPage - 1); 
                          }}
                        >
                          ‹
                        </a>
                      </li>
                    )}
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const startPage = Math.max(1, currentPage - 2);
                      return startPage + i;
                    }).filter(page => page <= pagination.totalPages).map((page) => (
                      <li key={page} className={currentPage === page ? 'active' : ''}>
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
                      <li>
                        <a 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            handlePageChange(currentPage + 1); 
                          }}
                        >
                          ›
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* 검색 */}
          <div className="notice-search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="제목을 입력하세요"
            />
            <button onClick={handleSearch}>검색</button>
          </div>
        </section>
      </main>

      <Footer isMobile={true} />
    </>
  );
}
