'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import { getImagePath } from '@/utils/path';
import { getNoticeDetail, Notice } from '@/utils/api';
import NoticeContent from '@/components/notice/NoticeContent';
import './page.css';

export default function NoticeDetailPCPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const noticeId = params?.id as string;
  const from = searchParams?.get('from');

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  // 공지사항 상세 불러오기
  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getNoticeDetail(parseInt(noticeId, 10));

        if (response.success) {
          setNotice(response.data.notice);
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

    if (noticeId) {
      fetchNoticeDetail();
    }
  }, [noticeId]);

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
    if (from === 'customer-center') {
      router.push('/customer-center');
    } else {
      router.push('/notice');
    }
  };

  return (
    <div id="isbwrapper" className="notice-detail-pc">
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
              {loading ? (
                <div className="loading-message">
                  <p>공지사항을 불러오는 중입니다...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={handleGoBack} className="retry-button">
                    목록으로 돌아가기
                  </button>
                </div>
              ) : notice ? (
                <section className="bgcolor_white ptb20 prow_01 mb_base">
                  <div className="B02_Notice_ContBox bgcolor_white mb_base">
                    <div className="B02_Notice_Head">
                      <div>
                        <span className="B02_Notice_HeadTxt">{notice.title}</span>
                      </div>
                      <div className="B02_Notice_date">
                        <span>{formatDate(notice.created_at)}</span>
                      </div>
                    </div>
                    <div className="B02_Notice_contBox">
                      <NoticeContent
                        content={notice.content || ''}
                        contentType={notice.content_type}
                        className="notice-content"
                      />
                    </div>
                    <div className="B02_Back_ListBtn">
                      <a href="#" onClick={(e) => { e.preventDefault(); handleGoBack(); }}>
                        목록
                      </a>
                    </div>
                  </div>
                </section>
              ) : (
                <div className="error-message">
                  <p>공지사항을 찾을 수 없습니다.</p>
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
    </div>
  );
}

