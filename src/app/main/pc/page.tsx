'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getImagePath } from '@/utils/path';
import './page.css';

export default function PCMainPage() {
  return (
    <div className="main-page-pc">
      <Header isMobile={false} />
      
      <main className="main-content-pc">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-image-wrapper">
              <img
                src={getImagePath('/top_banner01.png')}
                alt="여행자보험 일러스트"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        {/* Content Blocks */}
        <section className="content-blocks">
          <div className="blocks-container">
            <div className="blocks-wrapper">
              {/* 왼쪽: 6개 카드 */}
              <div className="cards-grid">
                {/* Row 1 */}
                <div className="blocks-row">
                  {/* 국내여행보험 */}
                  <div className="content-card domestic">
                    <p className="card-title">
                      가족여행, 야유회, 등산, 낚시, 캠핑 등..<br />
                      <span className="card-title-bold">국내 어디라도 안전하게~</span>
                    </p>
                    <button className="card-button">
                      국내 여행자보험 <img src={getImagePath('/images/link_more.png')} alt="" className="card-button-arrow" />
                    </button>
                    <div className="card-illustration">
                      <img
                        src={getImagePath('/icons/icon_tour.png')}
                        alt="국내여행 일러스트"
                        className="card-image"
                      />
                    </div>
                  </div>

                  {/* 해외여행보험 */}
                  <div className="content-card overseas">
                    <p className="card-title">
                      <span className="card-title-bold">3개월 이하</span><br />
                      해외여행, 골프, 배낭여행, 단기출장,<br />어학연수 등
                    </p>
                    <button className="card-button">
                      해외 여행자보험 <img src={getImagePath('/images/link_more.png')} alt="" className="card-button-arrow" />
                    </button>
                    <div className="card-illustration">
                      <img
                        src={getImagePath('/icons/icon_tour5.png')}
                        alt="해외여행 일러스트"
                        className="card-image"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="blocks-row">
                  {/* 해외장기체류보험 */}
                  <div className="content-card long-term">
                    <p className="card-title">
                      <span className="card-title-bold">3개월 초과</span><br />
                      유학, 어학연수, 출장, 주재원,<br />워킹홀리데이 등
                    </p>
                    <button className="card-button">
                      해외장기체류보험 <img src={getImagePath('/images/link_more.png')} alt="" className="card-button-arrow" />
                    </button>
                    <div className="card-illustration">
                      <img
                        src={getImagePath('/icons/icon_tour1.png')}
                        alt="장기체류 일러스트"
                        className="card-image"
                      />
                    </div>
                  </div>

                  {/* 단체/법인 여행자보험 */}
                  <div className="content-card group">
                    <p className="card-title">
                      회사, 학교, 학원, 종교단체, 관공서, 복지센터 등..<br />
                      <span className="card-title-bold-nowrap"><span className="card-title-bold">사업자번호가 있는 모든 단체</span>라면?</span>
                    </p>
                    <button className="card-button">
                      단체/법인 여행자보험 <img src={getImagePath('/images/link_more.png')} alt="" className="card-button-arrow" />
                    </button>
                    <div className="card-illustration">
                      <img
                        src={getImagePath('/icons/icon_tour3.png')}
                        alt="단체보험 일러스트"
                        className="card-image"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="blocks-row">
                  {/* 행사보험 */}
                  <div className="content-card event">
                    <p className="card-title">
                      축제, 문화재 등<br />
                      참가인원이 불특정 다수인가요?<br />
                      이제 행사보험으로 안전을 관리하세요.
                    </p>
                    <button className="card-button">
                      행사보험 견적신청 <img src={getImagePath('/images/link_more.png')} alt="" className="card-button-arrow" />
                    </button>
                    <div className="card-illustration">
                      <img
                        src={getImagePath('/icons/icon_tour4.png')}
                        alt="행사보험 일러스트"
                        className="card-image"
                      />
                    </div>
                  </div>

                  {/* 무사고캐시 */}
                  <div className="content-card cash-reward">
                    <p className="card-title">
                      사고없이 다녀오셨다면?<br />
                      <span className="card-title-bold-nowrap">투어밸리 <span className="card-title-bold">무사고캐시를 적립</span>하세요.</span>
                    </p>
                    <button className="card-button">
                      무사고캐시 자세히보기 <img src={getImagePath('/images/link_more.png')} alt="" className="card-button-arrow" />
                    </button>
                    <div className="card-illustration">
                      <img
                        src={getImagePath('/icons/icon_tour2.png')}
                        alt="무사고캐시 일러스트"
                        className="card-image"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 고객센터 */}
              <section className="tour2023_pc_customer01">
                <div className="tour2023_pc_customer_tit">
                  <p className="tour2023_pcBox_txt14"><img src={getImagePath('/icons/icon_customer.png')} alt="" className="ico_customer" />고객센터</p>
                </div>
                <div className="tour2023_pc_customer_m">
                  <ul>
                    <a href="#" className="tour2023_pc_customer_m01">
                      <li className="tour2023_pcBox_txt15">공지사항</li>
                      <li><img src={getImagePath('/images/g_more.png')} alt="" className="tour2023PC_arr002" /></li>
                    </a>
                  </ul>
                  <ul>
                    <a href="#" className="tour2023_pc_customer_m01">
                      <li className="tour2023_pcBox_txt15">가입내역조회</li>
                      <li><img src={getImagePath('/images/g_more.png')} alt="" className="tour2023PC_arr002" /></li>
                    </a>
                  </ul>
                  <ul>
                    <a href="#" className="tour2023_pc_customer_m01">
                      <li className="tour2023_pcBox_txt15">Q&A 게시판</li>
                      <li><img src={getImagePath('/images/g_more.png')} alt="" className="tour2023PC_arr002" /></li>
                    </a>
                  </ul>
                  <ul>
                    <a href="#" className="tour2023_pc_customer_m01">
                      <li className="tour2023_pcBox_txt15">보험금청구안내</li>
                      <li><img src={getImagePath('/images/g_more.png')} alt="" className="tour2023PC_arr002" /></li>
                    </a>
                  </ul>
                  <ul>
                    <a href="#" className="tour2023_pc_customer_m01">
                      <li className="tour2023_pcBox_txt15">무사고캐시안내</li>
                      <li><img src={getImagePath('/images/g_more.png')} alt="" className="tour2023PC_arr002" /></li>
                    </a>
                  </ul>
                </div>
                <div className="tour2023_pc_center">
                  <p className="tour2023_pc_center_txt">투어밸리 고객센터<br />상담시간 : 평일 09시 - 18시</p>
                  <p className="tour2023_pc_center_call"><img src={getImagePath('/icons/icon_call01.png')} alt="" className="ico_center_call" />1599-2541</p>
                </div>
              </section>
            </div>
          </div>
        </section>

        {/* Bottom Navigation Icons */}
        <section className="bottom-nav">
          <div className="bottom-nav-container">
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu01.png')}
                alt="국내 여행자보험"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">국내<br />여행자보험</span>
            </div>
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu02.png')}
                alt="해외 여행자보험"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">해외<br />여행자보험</span>
            </div>
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu03.png')}
                alt="해외 장기체류보험"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">해외<br />장기체류보험</span>
            </div>
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu04.png')}
                alt="단체 여행자보험"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">단체<br />여행자보험</span>
            </div>
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu05.png')}
                alt="행사주최자 배상책임보험"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">행사주최자<br />배상책임보험</span>
            </div>
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu06.png')}
                alt="여행자보험 견적신청"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">여행자보험<br />견적신청</span>
            </div>
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu07.png')}
                alt="여행사전용 여행보험센터"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">여행사전용<br />여행보험센터</span>
            </div>
            <div className="nav-icon-item">
              <img
                src={getImagePath('/bottom-menu/b_menu09.png')}
                alt="무사고 캐시적립"
                className="nav-icon-image"
              />
              <span className="nav-icon-label">무사고<br />캐시적립</span>
            </div>
          </div>
        </section>
      </main>

      <Footer isMobile={false} />
    </div>
  );
}

