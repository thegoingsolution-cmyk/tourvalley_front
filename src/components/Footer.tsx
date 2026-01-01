'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getImagePath } from '@/utils/path';
import './Footer.css';

interface FooterProps {
  isMobile?: boolean;
}

export default function Footer({ isMobile = false }: FooterProps) {
  const [logoError, setLogoError] = useState<boolean>(false);

  if (isMobile) {
    return (
      <footer className="footer-mobile">
        <div className="footer-mobile-container">
          <div className="footer-mobile-top">
            <div className="footer-section">
              <h3 className="footer-title">회사소개</h3>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">고객센터</h3>
            </div>
          </div>
          <div className="footer-mobile-links">
            <Link href="/terms" className="footer-link">이용약관</Link>
            <span className="footer-divider">|</span>
            <Link href="/privacy" className="footer-link">개인정보처리방침</Link>
          </div>
          <div className="footer-mobile-info">
            <p>투어밸리 여행보험센터 T.1599-2541 (평일 10시 ~ 17시)</p>
            <p>㈜빨주노초파남보 대리점등록번호 2022120036 (대리점등록증)</p>
            <p>통신판매업신고번호 제2023-서울중구-0084호</p>
            <p>tourvalley@insvalley.com</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer-pc">
      <div className="footer-pc-container">
        <div className="footer-pc-disclaimer">
          <p>※본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />준강시킬 제2025-광고-001(2025.01.30-2026-01.29)</p>
        </div>
        <div className="footer-pc-content">
          <div className="footer-pc-logo">
            {!logoError ? (
              <img
                src={getImagePath('/images/logo.png')}
                alt="투어밸리 로고"
                width={120}
                height={40}
                className="footer-logo"
                style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="logo-placeholder">투어밸리</div>
            )}
          </div>
          <div className="footer-pc-info">
            <p>㈜빨주노초파남보 | (04543) 서울 중구 을지로11길 15 동화빌딩 603호 사업자등록번호: 256-81-03026</p>
            <p>대표: 한상윤</p>
            <p>보험대리점등록번호: 제2022120036호 (대리점등록증) | 통신판매업신고: 제2023-서울중구-0084호</p>
            <p>tourvalley@insvalley.com</p>
            <p>Copyright ⓒSince 2008 tourvalley.net All Rights Reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

