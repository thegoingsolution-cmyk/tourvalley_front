'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InsuranceLogoSwiper from '@/components/InsuranceLogoSwiper';
import './page.css';

export default function MobileMainPage() {

  return (
    <div className="main-page-mobile">
      <Header isMobile={true} />
      
      <main className="main-content-mobile">
        <section className="tour2023_intro_Wrap" style={{display: 'block', position: 'relative', zIndex: 1000}}>
          <div className="tour2023_intro">
            <div className="tour2023_intro_w prow_02">
              <p className="tour2023_intro_txt">더 쉽고 빠른</p>
              <p className="tour2023_intro_txt01 tourG_mab05">
                여행자보험
                <span className="tour2023_intro_txt02">'지금'</span> 필요하다면?
              </p>
              
              {/* 해외여행 */}
              <Link href="/step/overseas/m">
                <div className="tour2023_intro_box">
                  <p className="tour2023_intro_txt03 tourG_mat09">해외여행</p>
                  <p className="link_more"></p>
                  <div 
                    className="tour2023_intro_box_s tourG_mat10"
                    dangerouslySetInnerHTML={{
                      __html: '<marquee scrolldelay="" scrollamount="4"><span class="tour2023_intro_txt04">해외의료비 보장, 휴대품손해 보장, COVID-19 보장, 실손보험가입자는 더 저렴하게, 24시간 실시간보험료 확인, 해외골프여행, 해외 가족여행, 해외 단체여행, 미주여행, 동남아여행, 유럽여행, 배낭여행, 동유럽여행, 북유럽여행, 일본여행, 호주여행, 남미여행</span></marquee>'
                    }}
                  />
                </div>
              </Link>
              
              {/* 국내여행 */}
              <Link href="/step/domestic/m">
                <div className="tour2023_intro_box01 tourG_mat15">
                  <p className="tour2023_intro_txt03 tourG_mat09">국내여행</p>
                  <p className="link_more"></p>
                  <div 
                    className="tour2023_intro_box_s tourG_mat10"
                    dangerouslySetInnerHTML={{
                      __html: '<marquee scrolldelay="" scrollamount="4"><span class="tour2023_intro_txt04">글램핑, 가족여행, 야유회, 워크샵, 수학여행, MT, 체험학습, 레저, 수련회, 등산, 낚시, 자전거, 캠핑, 국토순례, 비박, 차박</span></marquee>'
                    }}
                  />
                </div>
              </Link>
              
              {/* 무사고캐시 */}
              <Link href="/accident-free-cash">
                <div className="tour2023_intro_box06 tourG_mat15">
                  <p className="tour2023_intro_txt14 tourG_mat09">무사고CASH 적립</p>
                  <p className="link_more"></p>
                  <div className="tour2023_intro_box_s tourG_mat10">
                    <span className="tour2023_intro_txt04">투어밸리 무사고 고객님께 드리는 특별한... </span>
                  </div>
                </div>
              </Link>

              {/* 단체(법인)보험 */}
              <div className="tourG_line05 tourG_mat13 tourG_mab08"></div>
              <Link href="/group-insurance">
                <div className="tour2023_intro_box05">
                  <p className="tour2023_intro_txt12 tourG_mat22">회사, 학교 종교단체 등 단체 전문 플랜</p>
                  <p className="link_more01"></p>
                  <div className="tour2023_intro_txt13 tourG_mat22">단체여행자보험(사업자/법인)</div>
                </div>
              </Link>
              <div className="tourG_mab05"></div>
              
              {/* 행사보험 */}
              <Link href="/event-insurance">
                <div className="tour2023_intro_box05">
                  <p className="tour2023_intro_txt12 tourG_mat22">축제, 문화재 등 참가인원이 불특정 다수 일 때</p>
                  <p className="link_more01"></p>
                  <div className="tour2023_intro_txt13 tourG_mat22">행사주최자 배상책임보험</div>
                </div>
              </Link>
              <div className="tourG_mab13"></div>
            </div>
          </div>
        </section>

        <div
          className="bgcolor_white prow_01 essential_Wrap"
          style={{ paddingTop: 0, paddingBottom: 20 }}
        >
          <InsuranceLogoSwiper variant="mobile" />
        </div>

        {/* Disclaimer */}
        <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{textAlign: 'center'}}>
          <span className="tour2023_txt02 tour2023_grey">
            <span style={{whiteSpace: 'nowrap'}}>
              ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
            </span>
            <br />
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </span>
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

