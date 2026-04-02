'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header, { CORPORATE_USE_GROUP_INSURANCE_MSG } from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

export default function DomesticStepPage() {
  const router = useRouter();
  const { isLoggedIn, member } = useAuth();

  const goToDomesticPage = (type: string) => {
    router.push(`/domestic/m?type=${type}`);
  };

  const handleIndividualEntry = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn && member?.member_type === '법인') {
      alert(CORPORATE_USE_GROUP_INSURANCE_MSG);
      router.push('/group-insurance/m');
      return;
    }
    goToDomesticPage('individual');
  };

  return (
    <div className="domestic-step-page-mobile">
      <Header isMobile={true} />

      <main className="main-content-mobile">
        <form name="inputForm" method="POST">
          <section className="tour2023_intro_Wrap" style={{ display: 'block', position: 'relative' }}>
            <div className="tour2023_intro">
              <div className="tour2023_intro_w prow_02">
                <p className="tour2023_intro_txt05">쉽고 빠른 국내여행자보험</p>
                <p className="tour2023_intro_txt06 tourG_mab05">개인, 단체 누구나! 국내 어디든 안전하게!</p>
                <a
                  href="javascript:void(0);"
                  onClick={handleIndividualEntry}
                >
                  <div className="tour2023_intro_box04">
                    <p className="tour2023_intro_txt11">국내여행 보험료 확인</p>
                    <p className="icon_03"></p>
                  </div>
                </a>
                <div className="tourG_mat17 tourG_mab04" style={{ display: 'block' }}>
                  <a
                    href="javascript:void(0);"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/group-insurance/m');
                    }}
                    style={{ pointerEvents: 'auto' }}
                    className="tourGuard_btn_b tour2023_btn"
                  >
                    단체여행자보험(사업자/법인)<span className="tour2023_arr"></span>
                  </a>
                </div>
                <p className="tour2023_intro_txt10">
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
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </span>
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

