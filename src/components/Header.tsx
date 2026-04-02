'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getImagePath } from '@/utils/path';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
import ServiceModal from './ServiceModal';
import './Header.css';

export const CORPORATE_USE_GROUP_INSURANCE_MSG =
  '고객님은 법인회원이십니다. 법인단체계약으로 가입하시기 바랍니다.';

interface HeaderProps {
  isMobile?: boolean;
  onOpenAccidentFreeCashModal?: () => void;
}

export default function Header({ isMobile = false, onOpenAccidentFreeCashModal }: HeaderProps) {
  const [logoError, setLogoError] = useState<boolean>(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();

  // 단체여행보험 팝업 열기 (화면 가운데, 멀티모니터·태스크바 고려)
  const openGroupInsurancePopup = () => {
    const width = 870;
    const height = 930;
    const screenObj = typeof window !== 'undefined' ? (window.screen as Screen & { availLeft?: number; availTop?: number }) : { availLeft: 0, availTop: 0 };
    const availLeft = screenObj.availLeft ?? 0;
    const availTop = screenObj.availTop ?? 0;
    const availWidth = window.screen.availWidth;
    const availHeight = window.screen.availHeight;
    const left = availLeft + Math.max(0, Math.round((availWidth - width) / 2));
    const top = availTop + Math.max(0, Math.round((availHeight - height) / 2));
    const features = `width=${width},height=${height},left=${left},top=${top},screenX=${left},screenY=${top},scrollbars=yes,resizable=yes`;
    window.open('/group-insurance/domestic/popup', 'groupInsurancePopup', features);
  };
  
  // 인증 상태 가져오기
  const { isLoggedIn, member, logout, isLoading } = useAuth();
  const isCorporateLoggedIn = Boolean(isLoggedIn && member && member.member_type === '법인');
  const [corporateName, setCorporateName] = useState<string | null>(null);

  // 법인 회원일 경우 법인명 가져오기
  useEffect(() => {
    if (isLoggedIn && member && member.member_type === '법인') {
      getCorporateMemberInfo(member.id)
        .then((result) => {
          if (result.success && result.corporate) {
            setCorporateName(result.corporate.company_name);
          }
        })
        .catch((error) => {
          console.error('법인명 조회 오류:', error);
        });
    } else {
      setCorporateName(null);
    }
  }, [isLoggedIn, member]);

  // 로그아웃 처리
  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      window.location.href = '/main';
    }
  };

  // 메뉴가 열렸을 때 body 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  if (isMobile) {
    return (
      <>
        <header className="header-mobile">
          <div className="header-mobile-container">
            <Link href="/" className="header-mobile-logo">
              {!logoError ? (
                <img
                  src={getImagePath('/images/logo.png')}
                  alt="투어밸리 로고"
                  width={110}
                  height={32}
                  className="header-logo"
                  style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="logo-placeholder">투어밸리</div>
              )}
            </Link>
            <button 
              className="header-mobile-menu" 
              aria-label="메뉴"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <img 
                src={getImagePath('/images/btn_gnb_open.png')}
                alt="메뉴"
                width={25}
                height={25}
                className="hamburger-icon"
                style={{ width: '25px', height: 'auto' }}
              />
            </button>
          </div>
        </header>
        
        {/* Mobile Side Menu */}
        <div 
          className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className={`mobile-menu-sidebar ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-header">
              {!isLoading && (
                isLoggedIn && member ? (
                  <div className="mobile-menu-header-user">
                    <span className="mobile-menu-header-text">
                      {member.member_type === '법인' && corporateName ? corporateName : member.name}님
                    </span>
                    <Link 
                      href="/mypage"
                      className="mobile-menu-info-btn"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      정보 변경
                    </Link>
                    <button 
                      type="button"
                      className="mobile-menu-logout-btn"
                      onClick={() => {
                        if (confirm('로그아웃 하시겠습니까?')) {
                          logout();
                          setIsMobileMenuOpen(false);
                          window.location.href = '/main';
                        }
                      }}
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <div className="mobile-menu-header-auth">
                    <Link 
                      href="/login" 
                      className="mobile-menu-header-text"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      로그인
                    </Link>
                    <span className="mobile-menu-header-separator">/</span>
                    <Link 
                      href="/signup" 
                      className="mobile-menu-header-text"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      회원가입
                    </Link>
                  </div>
                )
              )}
              <button 
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="mobile-menu-content">
              <Link
                href="/overseas"
                className="mobile-menu-item"
                onClick={(e) => {
                  if (isCorporateLoggedIn) {
                    e.preventDefault();
                    alert(CORPORATE_USE_GROUP_INSURANCE_MSG);
                    setIsMobileMenuOpen(false);
                    router.push('/group-insurance');
                    return;
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="mobile-menu-text">해외여행자보험</span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link
                href="/long-term-stay"
                className="mobile-menu-item"
                onClick={(e) => {
                  if (isCorporateLoggedIn) {
                    e.preventDefault();
                    alert(CORPORATE_USE_GROUP_INSURANCE_MSG);
                    setIsMobileMenuOpen(false);
                    router.push('/group-insurance');
                    return;
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className="mobile-menu-text-wrapper">
                  <span className="mobile-menu-text">해외장기체류보험 (3개월초과)</span>
                  <span className="mobile-menu-subtext">(유학,주재원,워킹홀리데이)</span>
                </div>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link
                href="/domestic"
                className="mobile-menu-item"
                onClick={(e) => {
                  if (isCorporateLoggedIn) {
                    e.preventDefault();
                    alert(CORPORATE_USE_GROUP_INSURANCE_MSG);
                    setIsMobileMenuOpen(false);
                    router.push('/group-insurance');
                    return;
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="mobile-menu-text">국내여행자보험</span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link 
                href="/group-insurance"
                className="mobile-menu-item" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mobile-menu-text">단체여행자보험</span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link href="/estimate" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-menu-text">
                  여행자보험 견적신청 <span className="mobile-menu-new">new</span>
                </span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link href="/event-insurance" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-menu-text">행사주최자 배상책임보험</span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link href="/accident-free-cash" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-menu-text">무사고캐시</span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link href="/contracts" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-menu-text">계약/캐시조회</span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              <Link href="/customer-center" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-menu-text">고객센터</span>
                <span className="mobile-menu-arrow">›</span>
              </Link>
              
              {/* Customer Center Section */}
              <div className="mobile-menu-customer-section">
                <div className="mobile-menu-customer-info">
                  <p className="mobile-menu-customer-hours">고객센터 (평일 09시 - 18시)</p>
                <a href="tel:1599-2541" className="mobile-menu-customer-phone">
                  <img 
                    src={getImagePath('/icons/icon_talk_talk.png')} 
                    alt="전화 아이콘" 
                    className="mobile-menu-phone-icon"
                    width={20}
                    height={20}
                  />
                  <span className="mobile-menu-phone-number">1599-2541</span>
                </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <header className="header-pc">
      <div className="header-pc-container">
        {/* 첫 번째 줄: 로고와 유틸리티 */}
        <div className="header-pc-top">
          <Link href="/" className="header-pc-logo">
            {!logoError ? (
              <img
                src={getImagePath('/images/logo.png')}
                alt="투어밸리 로고"
                width={105}
                height={30}
                className="header-logo"
                style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="logo-placeholder">투어밸리</div>
            )}
          </Link>
          <div className="header-pc-utils">
            {!isLoading && (
              <>
                {isLoggedIn && member ? (
                  <>
                    <Link href="/mypage" className="util-link user-name">
                      {member.member_type === '법인' && corporateName ? corporateName : member.name}님
                    </Link>
                    <button 
                      type="button"
                      className="util-link logout-btn"
                      onClick={handleLogout}
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="util-link">로그인</Link>
                    <Link href="/signup" className="util-link">회원가입</Link>
                  </>
                )}
              </>
            )}
            <button 
              className="util-link service-all"
              onClick={() => setIsServiceModalOpen(true)}
            >
              <img 
                src={getImagePath('/icons/icon_menu.png')} 
                alt="메뉴 아이콘" 
                className="service-icon"
                width={16}
                height={16}
              />
              서비스전체보기
            </button>
          </div>
        </div>
        {/* 두 번째 줄: 메뉴 */}
        <nav className="header-pc-nav">
          <Link 
            href="/domestic" 
            className={`nav-link ${pathname?.startsWith('/domestic') ? 'active' : ''}`}
            onClick={(e) => {
              if (isCorporateLoggedIn) {
                e.preventDefault();
                alert(CORPORATE_USE_GROUP_INSURANCE_MSG);
                openGroupInsurancePopup();
              }
            }}
          >
            국내여행보험
          </Link>
          <Link 
            href="/overseas" 
            className={`nav-link ${pathname?.startsWith('/overseas') ? 'active' : ''}`}
            onClick={(e) => {
              if (isCorporateLoggedIn) {
                e.preventDefault();
                alert(CORPORATE_USE_GROUP_INSURANCE_MSG);
                openGroupInsurancePopup();
              }
            }}
          >
            해외여행보험
          </Link>
          <Link 
            href="/long-term-stay" 
            className={`nav-link ${pathname?.startsWith('/long-term-stay') ? 'active' : ''}`}
            onClick={(e) => {
              if (isCorporateLoggedIn) {
                e.preventDefault();
                alert(CORPORATE_USE_GROUP_INSURANCE_MSG);
                openGroupInsurancePopup();
              }
            }}
          >
            해외장기체류보험
          </Link>
          <Link 
            href="#" 
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              openGroupInsurancePopup();
            }}
          >
            단체여행보험
          </Link>
          <Link 
            href="/event-insurance" 
            className={`nav-link ${pathname?.startsWith('/event-insurance') ? 'active' : ''}`}
          >
            행사보험
          </Link>
          <Link 
            href="/contracts" 
            className={`nav-link ${pathname?.startsWith('/contracts') ? 'active' : ''}`}
          >
            계약/캐시조회
          </Link>
          <Link 
            href="/customer-center" 
            className={`nav-link ${pathname?.startsWith('/customer-center') ? 'active' : ''}`}
          >
            고객센터
          </Link>
        </nav>
      </div>
      <ServiceModal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)}
        onOpenAccidentFreeCashModal={onOpenAccidentFreeCashModal}
      />
    </header>
  );
}

