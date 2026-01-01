'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getImagePath } from '@/utils/path';
import './page.css';

export default function MobileMainPage() {
  return (
    <div className="main-page-mobile">
      <Header isMobile={true} />
      
      <main className="main-content-mobile">
        {/* Title Section */}
        <section className="title-section">
          <h1 className="main-title">
            <span style={{ color: '#f15605' }}>더 쉽고 빠른</span><br />여행자보험 <span className="highlight">'지금'</span> 필요하다면?
          </h1>
        </section>

        {/* Primary Cards */}
        <section className="primary-cards">
          {/* 해외여행 카드 */}
          <div className="primary-card overseas-card">
            <div className="primary-card-content">
              <div className="primary-card-text">
                <h2 className="primary-card-title">
                  해외여행
                  <img 
                    src={getImagePath('/images/link_more.png')} 
                    alt="더보기" 
                    className="title-arrow"
                    width={20}
                    height={20}
                  />
                </h2>
                <div className="scrolling-text-wrapper">
                  <div className="scrolling-text">
                    해외의료비 보장, 휴대품손해 보장, COVID-19 보장, 실손보험가입자는 더 저렴하게, 24시간 실시간보험료 확인, 해외골프여행, 해외 가족여행, 해외 단체여행, 미주여행, 동남아여행, 유럽여행, 배낭여행, 동유럽여행, 북유럽여행, 일본여행, 호주여행, 남미여행
                  </div>
                  <div className="scrolling-text" aria-hidden="true">
                    해외의료비 보장, 휴대품손해 보장, COVID-19 보장, 실손보험가입자는 더 저렴하게, 24시간 실시간보험료 확인, 해외골프여행, 해외 가족여행, 해외 단체여행, 미주여행, 동남아여행, 유럽여행, 배낭여행, 동유럽여행, 북유럽여행, 일본여행, 호주여행, 남미여행
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 국내여행 카드 */}
          <div className="primary-card domestic-card">
            <div className="primary-card-content">
              <div className="primary-card-text">
                <h2 className="primary-card-title">
                  국내여행
                  <img 
                    src={getImagePath('/images/link_more.png')} 
                    alt="더보기" 
                    className="title-arrow"
                    width={20}
                    height={20}
                  />
                </h2>
                <div className="scrolling-text-wrapper">
                  <div className="scrolling-text">
                    글램핑, 가족여행, 야유회, 워크샵, 수학여행, MT, 체험학습, 레저, 수련회, 등산, 낚시, 자전거, 캠핑, 국토순례, 비박, 차박
                  </div>
                  <div className="scrolling-text" aria-hidden="true">
                    글램핑, 가족여행, 야유회, 워크샵, 수학여행, MT, 체험학습, 레저, 수련회, 등산, 낚시, 자전거, 캠핑, 국토순례, 비박, 차박
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 무사고CASH 적립 카드 */}
          <div className="primary-card cash-card">
            <div className="primary-card-content">
              <div className="primary-card-text">
                <h2 className="primary-card-title">
                  무사고CASH 적립
                  <img 
                    src={getImagePath('/images/link_more.png')} 
                    alt="더보기" 
                    className="title-arrow"
                    width={20}
                    height={20}
                  />
                </h2>
                <div className="scrolling-text-wrapper">
                  <p className="primary-card-subtitle">투어밸리 무사고 고객님께 드리는 특별한...</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Cards */}
        <section className="secondary-cards">
          {/* 단체여행자보험 카드 */}
          <div className="secondary-card">
            <div className="secondary-card-content">
              <div className="secondary-card-text-wrapper">
                <p className="secondary-card-top-text">
                  회사, 학교 종교단체 등 단체 전문 플랜
                </p>
                <h3 className="secondary-card-title">단체여행자보험(사업자/법인)</h3>
              </div>
              <img 
                src={getImagePath('/images/link_more.png')} 
                alt="더보기" 
                className="secondary-card-arrow"
              />
            </div>
          </div>

          {/* 행사주최자 배상책임보험 카드 */}
          <div className="secondary-card">
            <div className="secondary-card-content">
              <div className="secondary-card-text-wrapper">
                <p className="secondary-card-top-text">
                  축제, 문화재 등 참가인원이 불특정 다수일 때
                </p>
                <h3 className="secondary-card-title">행사주최자 배상책임보험</h3>
              </div>
              <img 
                src={getImagePath('/images/link_more.png')} 
                alt="더보기" 
                className="secondary-card-arrow"
              />
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="disclaimer-section">
          <p className="disclaimer-text">
            ※본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
          </p>
          <p className="disclaimer-text">
            준법감시필 제2025-광고T-002(2025.04.07-2026-04.06)
          </p>
        </section>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

