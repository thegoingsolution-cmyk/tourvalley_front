'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { login } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

type ActiveTab = 'member' | 'guest';

export default function MobileGroupInsuranceLoginPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('member');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const notifyAndClose = (member?: unknown) => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'GROUP_INSURANCE_JOIN_CONTINUE',
        member: member || null,
      }, window.location.origin);
      window.close();
      return;
    }

    sessionStorage.setItem('groupInsuranceReturn', '1');
    sessionStorage.setItem('groupInsuranceJoinContinue', '1');
    window.location.href = '/group-insurance';
  };

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
        authLogin(result.member);
        notifyAndClose(result.member);
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

  const handleGuestApply = () => {
    sessionStorage.setItem('groupInsuranceGuestApply', '1');
    notifyAndClose();
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="gi-login-page-mobile">
      <Header isMobile={true} />

      <main className="gi-login-content-mobile">
        <div className="gi-login-container-mobile">
          <div className="gi-tab-header">
            <button
              type="button"
              className={`gi-tab-btn ${activeTab === 'member' ? 'active' : ''}`}
              onClick={() => setActiveTab('member')}
            >
              회원 LOGIN
            </button>
            <button
              type="button"
              className={`gi-tab-btn ${activeTab === 'guest' ? 'active' : ''}`}
              onClick={() => setActiveTab('guest')}
            >
              비회원 가입신청
            </button>
          </div>

          {activeTab === 'member' && (
            <form onSubmit={handleLogin} className="gi-login-form">
              <div className="gi-form-field">
                <label className="gi-form-label">아이디</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="gi-form-input"
                  autoComplete="username"
                />
              </div>

              <div className="gi-form-field">
                <label className="gi-form-label">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="gi-form-input"
                  autoComplete="current-password"
                />
              </div>

              <div className="gi-form-check">
                <input type="checkbox" id="gi-save-id" />
                <label htmlFor="gi-save-id">아이디 저장</label>
              </div>

              <button type="submit" className="gi-primary-btn" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
              <div className="gi-login-links">
                <button
                  type="button"
                  className="gi-link-btn"
                  onClick={() => handleNavigate('/find-id')}
                >
                  아이디찾기
                </button>
                <span className="gi-link-divider">|</span>
                <button
                  type="button"
                  className="gi-link-btn"
                  onClick={() => handleNavigate('/reset-password')}
                >
                  비밀번호찾기
                </button>
                <span className="gi-link-divider">|</span>
                <button
                  type="button"
                  className="gi-link-btn"
                  onClick={() => handleNavigate('/signup')}
                >
                  회원가입
                </button>
              </div>
            </form>
          )}

          {activeTab === 'guest' && (
            <div className="gi-guest-panel">
              <div className="gi-guest-box">
                서비스 운영자인 회사를 단체포괄계약의 계약자로 하는 단체여행보험으로 가입하실 수
                있습니다.
                <br />
                <br />
                투어밸리 단체포괄회원에 가입하시면 법인 단체여행보험 관리가 보다 편리하며 가입
                실적에 따른 마일리지가 적립됩니다.
              </div>
              <button type="button" className="gi-primary-btn" onClick={handleGuestApply}>
                가입신청
              </button>
              <div className="gi-login-links gi-login-links-right">
                <button
                  type="button"
                  className="gi-link-btn"
                  onClick={() => handleNavigate('/signup')}
                >
                  회원가입
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}
