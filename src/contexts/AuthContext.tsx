'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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

const MEMBER_STORAGE_KEY = 'member';
const LOGIN_STATUS_KEY = 'isLoggedIn';
const LOGIN_EXPIRES_AT_KEY = 'loginExpiresAt';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 로그인 후 2시간

function clearAuthStorage() {
  localStorage.removeItem(MEMBER_STORAGE_KEY);
  localStorage.removeItem(LOGIN_STATUS_KEY);
  localStorage.removeItem(LOGIN_EXPIRES_AT_KEY);
}

function readStoredSession(): { member: MemberInfo; expiresAt: number } | null {
  const storedMember = localStorage.getItem(MEMBER_STORAGE_KEY);
  const storedLoginStatus = localStorage.getItem(LOGIN_STATUS_KEY);
  const storedExpiresAt = localStorage.getItem(LOGIN_EXPIRES_AT_KEY);

  if (storedLoginStatus !== 'true' || !storedMember) {
    return null;
  }

  const expiresAt = storedExpiresAt ? Number(storedExpiresAt) : NaN;
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    return null;
  }

  try {
    return { member: JSON.parse(storedMember) as MemberInfo, expiresAt };
  } catch (error) {
    console.error('세션 복원 오류:', error);
    return null;
  }
}

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const applyLoggedOut = useCallback(() => {
    setMember(null);
    setIsLoggedIn(false);
    clearAuthStorage();
    clearExpiryTimer();
  }, [clearExpiryTimer]);

  const scheduleExpiry = useCallback((expiresAt: number) => {
    clearExpiryTimer();
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      applyLoggedOut();
      return;
    }
    expiryTimerRef.current = setTimeout(() => {
      applyLoggedOut();
    }, remaining);
  }, [applyLoggedOut, clearExpiryTimer]);

  const applyLoggedIn = useCallback((memberInfo: MemberInfo, expiresAt: number) => {
    setMember(memberInfo);
    setIsLoggedIn(true);
    localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(memberInfo));
    localStorage.setItem(LOGIN_STATUS_KEY, 'true');
    localStorage.setItem(LOGIN_EXPIRES_AT_KEY, String(expiresAt));
    scheduleExpiry(expiresAt);
  }, [scheduleExpiry]);

  // 초기 로드 시 로컬 스토리지에서 세션 복원 (2시간 유효)
  useEffect(() => {
    const session = readStoredSession();
    if (session) {
      setMember(session.member);
      setIsLoggedIn(true);
      scheduleExpiry(session.expiresAt);
    } else {
      clearAuthStorage();
    }
    setIsLoading(false);

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!readStoredSession()) {
        applyLoggedOut();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== MEMBER_STORAGE_KEY &&
        event.key !== LOGIN_STATUS_KEY &&
        event.key !== LOGIN_EXPIRES_AT_KEY
      ) {
        return;
      }
      const current = readStoredSession();
      if (current) {
        setMember(current.member);
        setIsLoggedIn(true);
        scheduleExpiry(current.expiresAt);
      } else {
        applyLoggedOut();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearExpiryTimer();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
    };
  }, [applyLoggedOut, clearExpiryTimer, scheduleExpiry]);

  // 로그인 처리
  const login = useCallback((memberInfo: MemberInfo) => {
    applyLoggedIn(memberInfo, Date.now() + SESSION_DURATION_MS);
  }, [applyLoggedIn]);

  // 로그아웃 처리
  const logout = useCallback(() => {
    applyLoggedOut();
  }, [applyLoggedOut]);

  // 회원 정보 업데이트 (만료 시각은 유지)
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
