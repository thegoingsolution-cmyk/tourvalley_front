'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getImagePath } from '@/utils/path';
import './page.css';

interface Notice {
  id: number;
  title: string;
  content?: string;
  author_name: string;
  view_count: number;
  created_at: string;
}

export default function NoticeDetailMobilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const noticeId = params?.id as string;
  const from = searchParams?.get('from');

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  // 공지사항 상세 불러오기
  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notices/${noticeId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setNotice(data.data.notice || data.data);
        }
      } catch (error) {
        console.error('공지사항 로드 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    if (noticeId) {
      fetchNoticeDetail();
    }
  }, [noticeId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleGoBack = () => {
    if (from === 'customer-center') {
      router.push('/customer-center/m');
    } else {
      router.push('/notice/m');
    }
  };

  return (
    <>
      <Header isMobile={true} />
      
      <main className="notice-detail-mobile-page">
        {/* 타이틀 */}
        <div className="B02_Top_title_Line">
          <span>공지사항</span>
          <button onClick={handleGoBack} className="notice-close-btn">
            <img src={getImagePath('/icons/ico_btn_close_bl.png')} alt="닫기" />
          </button>
        </div>

        {/* 공지사항 상세 내용 */}
        <section className="notice-detail-section">
          {loading ? (
            <div className="notice-loading">
              <p>공지사항을 불러오는 중입니다...</p>
            </div>
          ) : !notice ? (
            <div className="notice-empty">
              <p>공지사항을 찾을 수 없습니다.</p>
              <button onClick={handleGoBack} className="notice-back-btn">
                목록으로 돌아가기
              </button>
            </div>
          ) : (
            <div className="notice-detail-content">
              <div className="notice-detail-header">
                <h1 className="notice-detail-title">{notice.title}</h1>
                <div className="notice-detail-meta">
                  <span>{notice.author_name}</span>
                  <span>{formatDate(notice.created_at)}</span>
                  <span>조회수 {notice.view_count}</span>
                </div>
              </div>

              <div className="notice-detail-divider"></div>

              <div 
                className="notice-detail-body"
                dangerouslySetInnerHTML={{ __html: notice.content || '' }}
              />

              <div className="notice-detail-footer">
                <button onClick={handleGoBack} className="notice-list-btn">
                  목록
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer isMobile={true} />
    </>
  );
}
