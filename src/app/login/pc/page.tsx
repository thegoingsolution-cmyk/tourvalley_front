'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import { getImagePath } from '@/utils/path';
import { login } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

export default function PCLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  
  // 인증 컨텍스트에서 login 함수 가져오기
  const { login: authLogin } = useAuth();

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      alert('아이디를 입력해주세요.');
      return;
    }
    if (!password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success && result.member) {
        // 로그인 성공 시 세션에 회원 정보 저장
        authLogin(result.member);
        
        alert(`${result.member.name}님, 환영합니다!`);
        window.location.href = '/main';
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 이동 핸들러
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  const openRecoveryPopup = (path: string, name: string) => {
    const width = 520;
    const height = 760;
    const left = Math.max(0, Math.round((window.screen.width - width) / 2));
    const top = Math.max(0, Math.round((window.screen.height - height) / 2));
    const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;
    window.open(path, name, features);
  };

  return (
    <div className="login-page-pc">
      <Header isMobile={false} />
      
      <main 
        className="login-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* 오른쪽 고정 버튼 */}
        <div className="container_box_w">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCashModal(true); }}>
            <div className="fixedRight_b01">
              <p className="icon_cash"><span className="icon_cash01"></span></p>
              <p className="fixedRight_txt01">무사고캐시란?</p>
            </div>
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); setShowServiceModal(true); }}>
            <div className="fixedRight_b02">
              <p className="icon_menu"><span className="icon_menu01"></span></p>
              <p className="fixedRight_txt02">서비스<br/>전체보기</p>
            </div>
          </a>
        </div>

        <div className="login-container">
          <div className="login-card">
            <h1 className="login-title">회원 LOGIN</h1>

            <form onSubmit={handleLogin} className="login-form">
              {/* 아이디 입력 */}
              <div className="form-field">
                <label className="form-label">아이디</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력해주세요"
                  className="form-input"
                  autoComplete="username"
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="form-field">
                <label className="form-label">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                  className="form-input"
                  autoComplete="current-password"
                />
              </div>

              {/* 회원 혜택 박스 */}
              <div className="benefits-box">
                <h3 className="benefits-title">투어밸리 회원 혜택</h3>
                <ul className="benefits-list">
                  <li>01.회원가입시 1,000P 마일리지 제공</li>
                  <li>02.여행자보험 보험료의 3% 추가 마일리지 제공.</li>
                  <li>03.안전여행을 위한 여행자보험 관리! 보다 편하고 빨라집니다.</li>
                </ul>
              </div>

              {/* 로그인 버튼 */}
              <button 
                type="submit" 
                className="login-btn"
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* 하단 링크 */}
            <div className="login-links">
              <button 
                type="button" 
                className="link-btn"
                onClick={() => openRecoveryPopup('/find-id/pc', 'tourvalley-find-id')}
              >
                아이디찾기
              </button>
              <span className="link-divider">|</span>
              <button 
                type="button" 
                className="link-btn"
                onClick={() => openRecoveryPopup('/reset-password/pc', 'tourvalley-reset-password')}
              >
                비밀번호재설정
              </button>
              <span className="link-divider">|</span>
              <button 
                type="button" 
                className="link-btn"
                onClick={() => handleNavigate('/signup')}
              >
                회원가입
              </button>
            </div>
          </div>
        </div>

      </main>

      <Footer isMobile={false} />

      {/* 서비스 전체보기 모달 */}
      <ServiceModal 
        isOpen={showServiceModal} 
        onClose={() => setShowServiceModal(false)} 
      />

      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />
    </div>
  );
}

