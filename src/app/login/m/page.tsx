'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { login, getCorporateMemberInfo } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

export default function MobileLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 인증 컨텍스트에서 login 함수 및 로그인 여부 가져오기
  const { login: authLogin, isLoggedIn, isLoading: authLoading } = useAuth();

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.replace('/main');
    }
  }, [authLoading, isLoggedIn, router]);

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

        // 개인: 이름, 법인: 회사명으로 환영 문구 표시
        const isCorporate = result.member.member_type === '법인';
        let displayName = result.member.name;
        if (isCorporate) {
          try {
            const corpResult = await getCorporateMemberInfo(result.member.id);
            if (corpResult.success && corpResult.corporate?.company_name) {
              displayName = corpResult.corporate.company_name;
            }
          } catch {
            // 조회 실패 시 이름 유지
          }
        }
        alert(`${displayName}님, 환영합니다!`);
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

  // 인증 상태 확인 중이거나 이미 로그인된 경우(리다이렉트 대기) 로딩 표시
  if (authLoading || isLoggedIn) {
    return (
      <div className="login-page-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#666' }}>잠시만 기다려주세요...</p>
      </div>
    );
  }

  return (
    <div className="login-page-mobile">
      <Header isMobile={true} />
      
      <main className="login-content-mobile">
        <div className="login-container-mobile">
          <h1 className="login-title-mobile">회원 LOGIN</h1>

          <form onSubmit={handleLogin} className="login-form-mobile">
            {/* 아이디 입력 */}
            <div className="form-field-mobile">
              <label className="form-label-mobile">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력해주세요"
                className="form-input-mobile"
                autoComplete="username"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="form-field-mobile">
              <label className="form-label-mobile">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                className="form-input-mobile"
                autoComplete="current-password"
              />
            </div>

            {/* 회원 혜택 박스 */}
            <div className="benefits-box-mobile">
              <h3 className="benefits-title-mobile">투어밸리 회원 혜택</h3>
              <ul className="benefits-list-mobile">
                <li><strong>01.</strong> 회원가입시 1,000P 마일리지 제공</li>
                <li><strong>02.</strong> 여행자보험 보험료의 3% 추가 마일리지 제공.</li>
                <li><strong>03.</strong> <span className="highlight-orange">안전여행을 위한 여행자보험 관리!</span> 보다 편하고 빨라집니다.</li>
              </ul>
            </div>

            {/* 로그인 버튼 */}
            <button 
              type="submit" 
              className="login-btn-mobile"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 하단 링크 */}
          <div className="login-links-mobile">
            <button 
              type="button" 
              className="link-btn-mobile"
              onClick={() => handleNavigate('/find-id')}
            >
              아이디찾기
            </button>
            <span className="link-divider-mobile">|</span>
            <button 
              type="button" 
              className="link-btn-mobile"
              onClick={() => handleNavigate('/reset-password')}
            >
              비밀번호재설정
            </button>
            <span className="link-divider-mobile">|</span>
            <button 
              type="button" 
              className="link-btn-mobile"
              onClick={() => handleNavigate('/signup')}
            >
              회원가입
            </button>
          </div>
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

