'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

export default function OverseasStepPage() {
  const router = useRouter();

  const goToOverseasPage = (type: string) => {
    // 해외여행보험 페이지로 이동
    router.push(`/overseas?type=${type}`);
  };

  return (
    <div className="overseas-step-page-mobile">
      <Header isMobile={true} />
      
      <main className="main-content-mobile">
        <form name="inputForm" method="POST">
          <section className="tour2023_intro_Wrap" style={{display: 'block', position: 'relative'}}>
            <div className="tour2023_intro">
              <div className="tour2023_intro_w prow_02">
                <p className="tour2023_intro_txt05">쉽고 빠른 해외여행자보험</p>
                <p className="tour2023_intro_txt06 tourG_mab05">세계 어디든 마음놓고 안전하게!</p>
                
                <section className="tour2023_intro_BWrap">
                  <div 
                    onClick={() => router.push('/overseas/m?type=short')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="tour2023_intro_box02">
                      <p className="tour2023_intro_txt07 tourG_mat16">단기여행</p>
                      <p className="tour2023_intro_txt08">(3개월미만)</p>
                      <p className="icon_01"></p>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => router.push('/long-term-stay/m')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="tour2023_intro_box03">
                      <p className="tour2023_intro_txt07 tourG_mat16">장기여행</p>
                      <p className="tour2023_intro_txt08">(3개월이상)</p>
                      <p className="icon_02"></p>
                      <div className="intro_bubble">
                        <div className="intro_bubble01">
                          <p className="tour2023_intro_txt09">
                            워킹홀리데이,<br />
                            주재원,
                            어학연수, <br />
                            유학,
                            해외체류 등..
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                
                <div className="tourG_mat17 tourG_mab04" style={{display: 'block'}}>
                  <a 
                    href="javascript:void(0);" 
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/group-insurance/m');
                    }}
                    style={{pointerEvents: 'auto'}} 
                    className="tourGuard_btn_b tour2023_btn"
                  >
                    단체여행자보험(사업자/법인)<span className="tour2023_arr"></span>
                  </a>
                </div>
                
                <p className="tour2023_intro_txt10" style={{display: 'block'}}>
                  <span className="tour2023_blue">사업자번호가 있는</span> 회사, 학교, 종교단체, 관공서 등<br />
                  단체 전문 플랜
                </p>
              </div>
            </div>
          </section>
        </form>

        {/* 심의번호 */}
        <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
          <span className="tour2023_txt02 tour2023_grey">
            <span style={{ whiteSpace: 'nowrap' }}>
              ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
            </span>
            <br />
            준법감시필 제2025-광고T-002(2025.04.07-2026-04.06)
          </span>
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

