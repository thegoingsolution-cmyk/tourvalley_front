'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import EventInsuranceWizard from '@/components/eventInsurance/EventInsuranceWizard';
import { getImagePath } from '@/utils/path';
import './page.css';

export default function PCEventInsurancePage() {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  return (
    <div className="event-insurance-page-pc">
      <Header isMobile={false} onOpenAccidentFreeCashModal={() => setShowCashModal(true)} />

      <main
        className="event-insurance-pc-main"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* 오른쪽 버튼 (페이지와 함께 스크롤, 국내여행 PC와 동일 패턴) */}
        <div className="container_box_w">
          <Link href="/event-insurance/guide">
            <div className="fixedRight_b01">
              <p className="fixedRight_txt01">
                행사주최자배상
                <br />
                책임보험 안내
              </p>
            </div>
          </Link>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowServiceModal(true);
            }}
          >
            <div className="fixedRight_b02">
              <p className="icon_menu">
                <span className="icon_menu01" />
              </p>
              <p className="fixedRight_txt02">
                서비스
                <br />
                전체보기
              </p>
            </div>
          </a>
        </div>

        <EventInsuranceWizard device="PC" />
      </main>

      <Footer isMobile={false} />

      <ServiceModal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} />
      <AccidentFreeCashModal isOpen={showCashModal} onClose={() => setShowCashModal(false)} />
    </div>
  );
}
