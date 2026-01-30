'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
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
  const router = useRouter();
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
  const [showCashModal, setShowCashModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
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
        if (data.success && data.data && data.data.notices) {
          setNotices(data.data.notices || []);
        } else {
          setNotices([]);
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error);
        setNotices([]);
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
          if (data.success && data.data) {
            setNoticeDetail(data.data.notice || data.data);
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

  useEffect(() => {
    if (view === 'chubb') {
      setActiveTab('의료비');
    } else if (view === 'hyundai') {
      setActiveTab('의료비');
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
            {notices && notices.length > 0 ? (
              notices.map((notice) => (
                <li key={notice.id}>
                  <a href={`/notice/detail/${notice.id}?from=customer-center`} className="customer-notice-link">
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
        </div>
        <h2 className="sub_title ag_left">보험금 청구 안내</h2>
        
        <div className="customer-detail-notice join01_box">
          <div className="txt">
            해외에서 보험사고가 발생한 경우 보험금 지급과 관련된 서류를 꼼꼼히 챙기셔야 보험금을 손쉽게 받으실 수 있습니다.<br />
            특히 휴대품 도난시 현지 경찰서에서 도난확인서(Police Report)를 발급받아 오시기 바랍니다.<br />
            보험금 청구기간은 사고일로부터 3년입니다.
          </div>
        </div>

        <div className="customer-detail-contacts con01">
          <ul>
            <li><strong><span className="font_blue">에이스 손해보험 고객센터:</span> 1666-5075</strong></li>
            <li><strong><span className="font_blue">해외 24시간 SOS 상담전화:</span> +82-1588-1983</strong></li>
          </ul>
        </div>

        <div className="customer-detail-tabs">
          <div className="subNaviWrap02">
            <table className="naviLev2">
              <tbody>
                <tr>
                  <td className={activeTab === '의료비' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('의료비'); }}>의료비</a>
                  </td>
                  <td className={activeTab === '휴대품' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('휴대품'); }}>휴대품</a>
                  </td>
                  <td className={activeTab === '배상책임' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('배상책임'); }}>배상책임</a>
                  </td>
                  <td className={activeTab === '항공편 지연에 따른 추가비용' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('항공편 지연에 따른 추가비용'); }}>항공편 지연에 따른<br />추가비용</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="customer-detail-content">
          {activeTab === '의료비' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                <li>1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)</li>
                <li>2. 여권사본</li>
                <li>3. 청구인 신분증사본</li>
                <li>4. [가족관계 확인필요시](피보험자 미성년자인 경우 등) 가족관계증명서, 주민등록등본 등</li>
                </ol>

                --------------------------------------------------------------------------------------------------
              
                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 해외의료비 =</strong>
                  <ol>
                    <li>1. 진단서(MEDICAL RECORD)</li>
                    <li>2. 치료비영수증(원본)</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 국내의료비(입원) =</strong>
                  <ol>
                    <li>1. 가이드(인솔자) 또는 목격자(제3자) 확인서</li>
                    <li>2. 진단서</li>
                    <li>3. (50만원 이하시 진단명이 포함된 입퇴원확인서 또는 진료확인서로 대체 가능)</li>
                    <li>4. 진료비계산서(영수증)</li>
                    <li>5. 진료비 세부(상세)내역서</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 국내의료비(통원) =</strong>
                  <ol>
                    <li>1. 가이드(인솔자) 또는 목격자(제3자) 확인서</li>
                    <li>2. 진단명이 포함된 서류(진단서, 통원확인서, 처방전, 소견서, 진료차트 등)</li>
                    <li>3. 진료비계산서(영수증)</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeTab === '휴대품' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                <li>1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)</li>
                <li>2. 여권사본</li>
                <li>3. 청구인 신분증사본</li>
                <li>4. [가족관계 확인필요시](피보험자 미성년자인 경우 등) 가족관계증명서, 주민등록등본 등</li>
                </ol>

                --------------------------------------------------------------------------------------------------

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 도난 =</strong>
                  <ol>
                    <li>
                      1. 도난신고 사실확인서(Police Report)<br />
                      - 현지 경찰서에 신고 : 도난신고 확인서 발급<br />
                      - 공항수하물 사고시 : 공항안내서 신고확인서<br />
                      (항공사 보상관련 확인서류 첨부)<br />
                      - 호텔도난시 ) 프론트에 신고후 확인증 첨부<br />
                      - 경찰서 등 신고할 수 없는 부득이한 상황인 경우<br />
                      : 가이드 또는 목격자(제3자)확인서, 대사관 신고
                    </li>
                    <li>
                      2. 피해품 영수증(피해입증자료) : 구매영수증(발급시)<br />
                      - 구입시점부터 사고시점까지 법정 감가율 적용<br />
                      - 미제출시 25%감가(산정내역에 따라 변동)
                    </li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 파손 =</strong>
                  <ol>
                    <li>1. 가이드 또는 목격자(제3자) 확인서</li>
                    <li>2. 파손 물품 사진</li>
                    <li>3. 수리가능시 : 수리견적서, 영수증</li>
                    <li>4. 수리불가능시 : 수리불가확인서</li>
                    <li>5. 스마트폰인 경우 : 휴대폰 이용계약 등록사항 증명서(통신사 발급)</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">항공사에서 보상을 받은 경우</strong>
                  <ol>
                    <li>1. 항공사 사고접수지</li>
                    <li>2. 입금액이 확인가능한 통장사본</li>
                    <li>3. 항공사 보상불가 확인서(보상받지 못한 경우)</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeTab === '배상책임' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                <li>1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)</li>
                <li>2. 피보험자 주민등록등본(가족관계 확인서)</li>
                <li>3. 피해자 신분증 사본, 개인정보처리동의서</li>
                <li>4. 피보험자, 피해자 사고확인서(보험회사 양식)</li>
                </ol>

                --------------------------------------------------------------------------------------------------

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 대인사고 =</strong>
                  <ol>
                    <li>1. 피해자 진단서, 초진(응급)진료차트, 치료비영수증</li>
                    <li>2. 사고관련 입증서류 및 합의서</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 대물사고 =</strong>
                  <ol>
                    <li>1. 피해물 사진</li>
                    <li>2. 피해물 구입영수증 및 수리견적서, 수리영수증</li>
                    <li>3. 사고관련 입증서류 및 합의서</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeTab === '항공편 지연에 따른 추가비용' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                <li><strong>사고발생 수 30일 이내 손해입증자료 제출</strong></li>
                <li>1. 항공사 확인서</li>
                <li>2. e-ticket, 피보험자 여권 사본 및 출입국 사실 증명서</li>
                <li>3. 손해입증자료(구입일시, 내역, 장소가 확인 가능한 영수증에 한함)</li>
                </ol>

                --------------------------------------------------------------------------------------------------

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">
                    = 결항/지연/취소/과적에 의한 탑승거부로 <br />
                    4시간 내에 대체(항공)수단이 제공되지 못한 경우 =
                  </strong>
                  <ol>
                    <li>1. 식사, 간식, 전화통화 영수증</li>
                    <li>2. 숙박비, 숙박시설에 대한 교통비, 수화물이 다른 항공편으로 출발한 경우 비상의복 및 필수품 구입비용 영수증(단, 숙박이 필요한 경우에 한함)</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 수화물이 6시간 내에 도착하지 못한 경우 =</strong>
                  <ol>
                    <li>1. 비상의복과 필수품 구입비용 영수증</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 수화물이 24시간 내에 도착하지 못한 경우 =</strong>
                  <ol>
                    <li>1. 예정된 도착지에 도착 후 120시간 내에 발생한 의복과 필수품 등의 구입비용 영수증</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">알아두세요!</strong>
                  <ol>
                    <li>※ 발생 영수증의 경우 반드시 구입일시가 기재된 영수증이어야 합니다.</li>
                    <li>※ 항공사 확인서의 경우 결항, 지연, 과적에 의한 탑승거부 등 항공편 또는 수화물의 지연사유와 지연된 시간이 반드시 기재되어 있어야 합니다. (항공사 담당자 및 연락처가 기재되어 있지 않은 경우에는 서류 여백에 해당 사항을 별도로 기재바랍니다.)</li>
                  </ol>
                </div>
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
        </div>
        <h2 className="sub_title_03 pb20 ag_left">현대해상</h2>
        <h2 className="sub_title ag_left">보험금 청구 안내</h2>
        
        <div className="customer-detail-notice join01_box">
          <div className="txt">
            해외에서 보험사고가 발생한 경우 보험금 지급과 관련된 서류를 꼼꼼히 챙기셔야 보험금을 손쉽게 받으실 수 있습니다.<br />
            특히 휴대품 도난시 현지 경찰서에서 도난확인서(Police Report)를 발급받아 오시기 바랍니다. <br />
            보험금 청구기간은 사고일로부터 3년입니다.
          </div>
        </div>

        <div className="customer-detail-contacts con01">
          <ul>
            <li><strong><span className="font_blue">현대해상 고객센터:</span> 1899-6782</strong></li>
          </ul>
        </div>

        <h2 className="sub_title ag_left">보험금청구 구비서류 안내</h2>

        <div className="customer-detail-tabs">
          <div className="subNaviWrap02">
            <table className="naviLev2">
              <tbody>
                <tr>
                  <td className={activeTab === '의료비' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('의료비'); }}>의료비</a>
                  </td>
                  <td className={activeTab === '휴대품' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('휴대품'); }}>휴대품</a>
                  </td>
                  <td className={activeTab === '배상책임' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('배상책임'); }}>배상책임</a>
                  </td>
                  <td className={activeTab === '항공편 지연에 따른 추가비용' ? 'on' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('항공편 지연에 따른 추가비용'); }}>항공편 지연에 따른<br />추가비용</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="customer-detail-content">
          {activeTab === '의료비' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                <li>1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)</li>
                <li>2. 여권사본</li>
                <li>3. 청구인 신분증사본</li>
                <li>4. [가족관계 확인필요시](피보험자 미성년자인 경우 등) 가족관계증명서, 주민등록등본 등</li>
                </ol>

                --------------------------------------------------------------------------------------------------
              
                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 해외의료비 =</strong>
                  <ol>
                    <li>1. 진단서(MEDICAL RECORD)</li>
                    <li>2. 치료비영수증(원본)</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 국내의료비(입원) =</strong>
                  <ol>
                    <li>1. 가이드(인솔자) 또는 목격자(제3자) 확인서</li>
                    <li>2. 진단서</li>
                    <li>3. (50만원 이하시 진단명이 포함된 입퇴원확인서 또는 진료확인서로 대체 가능)</li>
                    <li>4. 진료비계산서(영수증)</li>
                    <li>5. 진료비 세부(상세)내역서</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 국내의료비(통원) =</strong>
                  <ol>
                    <li>1. 가이드(인솔자) 또는 목격자(제3자) 확인서</li>
                    <li>2. 진단명이 포함된 서류(진단서, 통원확인서, 처방전, 소견서, 진료차트 등)</li>
                    <li>3. 진료비계산서(영수증)</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeTab === '휴대품' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                  <li>1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)</li>
                  <li>2. 여권사본</li>
                  <li>3. 청구인 신분증사본</li>
                  <li>4. [가족관계 확인필요시](피보험자 미성년자인 경우 등) 가족관계증명서, 주민등록등본 등</li>
                </ol>

                --------------------------------------------------------------------------------------------------

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 도난 =</strong>
                  <ol>
                    <li>
                      1. 도난신고 사실확인서(Police Report)<br />
                      - 현지 경찰서에 신고 : 도난신고 확인서 발급<br />
                      - 공항수하물 사고시 : 공항안내서 신고확인서<br />
                      (항공사 보상관련 확인서류 첨부)<br />
                      - 호텔도난시 ) 프론트에 신고후 확인증 첨부<br />
                      - 경찰서 등 신고할 수 없는 부득이한 상황인 경우<br />
                      : 가이드 또는 목격자(제3자)확인서, 대사관 신고
                    </li>
                    <li>
                      2. 피해품 영수증(피해입증자료) : 구매영수증(발급시)<br />
                      - 구입시점부터 사고시점까지 법정 감가율 적용<br />
                      - 미제출시 25%감가(산정내역에 따라 변동)
                    </li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 파손 =</strong>
                  <ol>
                    <li>1. 가이드 또는 목격자(제3자) 확인서</li>
                    <li>2. 파손 물품 사진</li>
                    <li>3. 수리가능시 : 수리견적서, 영수증</li>
                    <li>4. 수리불가능시 : 수리불가확인서</li>
                    <li>5. 스마트폰인 경우 : 휴대폰 이용계약 등록사항 증명서(통신사 발급)</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">항공사에서 보상을 받은 경우</strong>
                  <ol>
                    <li>1. 항공사 사고접수지</li>
                    <li>2. 입금액이 확인가능한 통장사본</li>
                    <li>3. 항공사 보상불가 확인서(보상받지 못한 경우)</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeTab === '배상책임' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                  <li>1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)</li>
                  <li>2. 피보험자 주민등록등본(가족관계 확인서)</li>
                  <li>3. 피해자 신분증 사본, 개인정보처리동의서</li>
                  <li>4. 피보험자, 피해자 사고확인서(보험회사 양식)</li>
                </ol>

                --------------------------------------------------------------------------------------------------

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 대인사고 =</strong>
                  <ol>
                    <li>1. 피해자 진단서, 초진(응급)진료차트, 치료비영수증</li>
                    <li>2. 사고관련 입증서류 및 합의서</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 대물사고 =</strong>
                  <ol>
                    <li>1. 피해물 사진</li>
                    <li>2. 피해물 구입영수증 및 수리견적서, 수리영수증</li>
                    <li>3. 사고관련 입증서류 및 합의서</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeTab === '항공편 지연에 따른 추가비용' && (
            <div className="join02_box">
              <div className="txt customer-procedure">
                <ol>
                  <li><strong>사고발생 수 30일 이내 손해입증자료 제출</strong></li>
                  <li>1. 항공사 확인서</li>
                  <li>2. e-ticket, 피보험자 여권 사본 및 출입국 사실 증명서</li>
                  <li>3. 손해입증자료(구입일시, 내역, 장소가 확인 가능한 영수증에 한함)</li>
                </ol>

                --------------------------------------------------------------------------------------------------

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 결항/지연/취소/과적에 의한 탑승거부로 <br />4시간 내에 대체(항공)수단이 제공되지 못한 경우 =</strong>
                  <ol>
                    <li>1. 식사, 간식, 전화통화 영수증</li>
                    <li>2. 숙박비, 숙박시설에 대한 교통비, 수화물이 다른 항공편으로 출발한 경우 비상의복 및 필수품 구입비용 영수증(단, 숙박이 필요한 경우에 한함)</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 수화물이 6시간 내에 도착하지 못한 경우 =</strong>
                  <ol>
                    <li>1. 비상의복과 필수품 구입비용 영수증</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">= 수화물이 24시간 내에 도착하지 못한 경우 =</strong>
                  <ol>
                    <li>1. 예정된 도착지에 도착 후 120시간 내에 발생한 의복과 필수품 등의 구입비용 영수증</li>
                  </ol>
                </div>

                <div className="customer-procedure-section">
                  <strong className="customer-procedure-title">알아두세요!</strong>
                  <ol>
                    <li>※ 발생 영수증의 경우 반드시 구입일시가 기재된 영수증이어야 합니다.</li>
                    <li>※ 항공사 확인서의 경우 결항, 지연, 과적에 의한 탑승거부 등 항공편 또는 수화물의 지연사유와 지연된 시간이 반드시 기재되어 있어야 합니다. (항공사 담당자 및 연락처가 기재되어 있지 않은 경우에는 서류 여백에 해당 사항을 별도로 기재바랍니다.)</li>
                  </ol>
                </div>
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
                  {item.is_secret === 1 && <img src={getImagePath('/images/tg_icon_secret.png')} alt="비밀글" className="customer-qna-secret-icon" />}
                  <a 
                    href={`/customer-center/qna/${item.id}`} 
                    className="customer-qna-link"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/customer-center/qna/${item.id}`);
                    }}
                  >
                    {item.title}
                  </a>
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

        {view === 'main' && renderMainView()}
        {view === 'chubb' && renderChubbView()}
        {view === 'hyundai' && renderHyundaiView()}
        {view === 'qna' && renderQnaView()}
        {view === 'notice' && renderNoticeDetailView()}
      </main>
      <Footer />

      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />

      {/* 서비스 전체보기 모달 */}
      <ServiceModal 
        isOpen={showServiceModal} 
        onClose={() => setShowServiceModal(false)} 
      />

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

