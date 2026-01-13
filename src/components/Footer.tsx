'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getImagePath } from '@/utils/path';
import './Footer.css';

interface FooterProps {
  isMobile?: boolean;
}

export default function Footer({ isMobile = false }: FooterProps) {
  const router = useRouter();
  const [logoError, setLogoError] = useState<boolean>(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);

  if (isMobile) {
    return (
      <>
        <footer className="footer-mobile">
          <div className="footer-mobile-container">
            <div className="footer-mobile-top">
              <div className="footer-section" onClick={() => setIsCompanyModalOpen(true)} style={{ cursor: 'pointer' }}>
                <h3 className="footer-title">회사소개</h3>
              </div>
            <div className="footer-section" onClick={() => router.push('/customer-center')} style={{ cursor: 'pointer' }}>
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

        {/* 회사소개 모달 */}
        {isCompanyModalOpen && (
          <div className="company-modal-overlay" onClick={() => setIsCompanyModalOpen(false)}>
            <div className="company-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="company-modal-title">회사소개</div>
              <div className="company-modal-content">
                2008년<br />
                ㈜인스밸리에서 여행자보험 전문사이트 투어밸리 오픈<br />
                2022년<br />
                여행자보험 전문대리점 ㈜빨주노초파남보 설립<br /><br />
                고객님의 안전여행<br />
                보다 전문적으로 관리해 드리겠습니다.<br /><br />
                법인명 : ㈜빨주노초파남보<br />
                대표이사 : 한상윤<br /><br />
                자본금 : 2억원<br /><br />
                사업자등록번호 : 256-81-03026<br />
                보험대리점등록번호 : 2022120036<br />
                주소지 : 서울시 중구 을지로 11길 15 동화빌딩 603호<br />
                전화번호 : 02-2294-5519<br />
                팩스번호 : 02-2261-0098<br />
              </div>
              <div>
                <button onClick={() => setIsCompanyModalOpen(false)} className="company-modal-close-btn">
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </>
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

