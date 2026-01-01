'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 회원 정보 타입
export interface MemberInfo {
  id: number;
  member_type: string;
  username: string;
  name: string;
  birth_date?: string;
  gender?: string;
  email: string;
  email_domain?: string;
  mobile_phone: string;
  mileage: number;
  accident_free_cash: number;
  marketing_agreed?: boolean;
  email_receive?: boolean;
  sms_receive?: boolean;
  status: string;
}

// 인증 컨텍스트 타입
interface AuthContextType {
  isLoggedIn: boolean;
  member: MemberInfo | null;
  login: (memberInfo: MemberInfo) => void;
  logout: () => void;
  updateMember: (memberInfo: Partial<MemberInfo>) => void;
  isLoading: boolean;
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 세션 스토리지 키
const MEMBER_STORAGE_KEY = 'member';
const LOGIN_STATUS_KEY = 'isLoggedIn';

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 로컬 스토리지에서 세션 복원
  useEffect(() => {
    const storedMember = localStorage.getItem(MEMBER_STORAGE_KEY);
    const storedLoginStatus = localStorage.getItem(LOGIN_STATUS_KEY);

    if (storedLoginStatus === 'true' && storedMember) {
      try {
        const parsedMember = JSON.parse(storedMember);
        setMember(parsedMember);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('세션 복원 오류:', error);
        // 잘못된 데이터 정리
        localStorage.removeItem(MEMBER_STORAGE_KEY);
        localStorage.removeItem(LOGIN_STATUS_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // 로그인 처리
  const login = useCallback((memberInfo: MemberInfo) => {
    setMember(memberInfo);
    setIsLoggedIn(true);
    localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(memberInfo));
    localStorage.setItem(LOGIN_STATUS_KEY, 'true');
  }, []);

  // 로그아웃 처리
  const logout = useCallback(() => {
    setMember(null);
    setIsLoggedIn(false);
    localStorage.removeItem(MEMBER_STORAGE_KEY);
    localStorage.removeItem(LOGIN_STATUS_KEY);
  }, []);

  // 회원 정보 업데이트
  const updateMember = useCallback((updatedInfo: Partial<MemberInfo>) => {
    setMember(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedInfo };
      localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, member, login, logout, updateMember, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 커스텀 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  }
  return context;
}

export default AuthContext;

