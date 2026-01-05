'use client';

import React from 'react';
import './page.css';

export default function PrivacyAgreePage() {
  const handleClose = () => {
    window.close();
  };

  return (
    <div className="privacy-agree-page">
      <div id="isbwrapper">
        {/* 헤더 */}
        <header id="header">
          <div className="tour2023_header_inner tour2023_header_line">
            <span className="tourTop_title">개인(신용)정보 수집, 이용 동의</span>
            <a className="close" href="#" onClick={(e) => { e.preventDefault(); handleClose(); }}>
              닫기
            </a>
          </div>
        </header>

        {/* 본문 */}
        <div className="prow_01">
          <section className="tourG_mat12">
            <div className="tourGuard_ra_Wrap01">
              <p className="tour2023_title19">개인(신용)정보 수집, 이용 동의</p>
            </div>
            <div className="content_agree_Box">
              <p className="content_agree_Box01">
                당사는 보험회사의 대리점으로서 「개인정보보호법」 및 「신용정보의 이용 및 보호에 관한 법률」에 따라 영업배상책임보험(행사주최자 배상책임) 견적 및 가입설계와 관련하여 귀하의 개인(신용)정보를 수집하고 합니다.<br /><br />
                01. 보험회사 : 라이나손해보험, 현대해상, DB손해보험, 메리츠화재<br /><br />
                02. 개인(신용)정보의 수집 및 이용 목적 : 영업배상책임보험(행사주최자) 보험료 산출 및 견적서 제공<br /><br />
                03. 수집 및 이용할 개인(신용)정보의 내용<br />
                - 법인단체명, 사업자번호<br />
                - 담당자명, 핸드폰번호, E-메일<br /><br />
                04. 개인정보의 보유 및 이용기간 : 수집 및 이용 목적을 달성할 때까지
              </p>
            </div>
          </section>
          <div className="tourG_mat17 tourG_Wrap"></div>
        </div>

        {/* 하단 고정버튼 */}
        <section id="tour2023_fixedBanner">
          <div className="tour2023_bottom_btn">
            <a 
              href="#" 
              className="tour2023_btn_b tour2023_btn07"
              onClick={(e) => { e.preventDefault(); handleClose(); }}
            >
              확인
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

