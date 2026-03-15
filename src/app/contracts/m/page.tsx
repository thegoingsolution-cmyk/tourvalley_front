'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { sendVerificationCode, verifyCode } from '@/services/smsService';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import ServiceModal from '@/components/ServiceModal';
import GiftCardExchangeModal from '@/components/mileage/GiftCardExchangeModal';
import { getImagePath } from '@/utils/path';
import { formatInsurancePeriod } from '@/utils/dateTime';
import './page.css';

export default function MobileContractPage() {
  const router = useRouter();
  const { isLoggedIn, member } = useAuth();

  // 로그인한 유저용 상태
  const [searchType, setSearchType] = useState<'contract' | 'event'>('contract');
  const [inYear, setInYear] = useState<number>(1);
  const [mileageInYear, setMileageInYear] = useState<number>(1);
  const [cashInYear, setCashInYear] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'contract' | 'cash' | 'mileage'>('contract');
  const [showGiftCardModal, setShowGiftCardModal] = useState<boolean>(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // 법인 고객인 경우 무사고캐시 탭이 없으므로 기본 탭을 'contract'로 설정
  useEffect(() => {
    if (isLoggedIn && member && member.member_type === '법인' && activeTab === 'cash') {
      setActiveTab('contract');
    }
  }, [isLoggedIn, member, activeTab]);

  // 계약 목록 데이터
  interface Contract {
    id: number;
    contractNumber: string;
    insuranceType: string;
    planTypes: string[];
    departureDate: string;
    arrivalDate: string;
    totalPremium: number;
    status: string;
    createdAt: string;
    travelRegion?: string | null;
    travelCountry?: string | null;
    travelPurpose?: string | null;
  }
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractPagination, setContractPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  }>({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 3 });

  // 행사보험 계약 목록 데이터
  interface EventContract {
    id: number;
    contractNumber: string;
    insuranceType: string;
    insuranceCompany: string;
    eventName: string;
    eventLocation?: string | null;
    participants: number;
    startDate: string;
    endDate: string;
    premium: number;
    status: string;
    createdAt: string;
    contractor?: string | null;
  }
  const [eventContracts, setEventContracts] = useState<EventContract[]>([]);
  const [eventContractPagination, setEventContractPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  }>({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });

  // 마일리지 데이터
  interface MileageHistory {
    id: number;
    type: string;
    amount: number;
    balance: number;
    reason: string | null;
    reason_detail: string | null;
    created_at: string;
  }
  const [mileageInfo, setMileageInfo] = useState<{ totalMileage: number }>({ totalMileage: 0 });
  const [mileageList, setMileageList] = useState<MileageHistory[]>([]);
  
  // 무사고캐시 데이터
  interface CashHistory {
    id: number;
    type: string;
    amount: number;
    balance: number;
    reason: string | null;
    reason_detail: string | null;
    created_at: string;
    expire_date?: string;
  }
  const [cashList, setCashList] = useState<CashHistory[]>([]);
  const [cashInfo, setCashInfo] = useState<{ totalCash: number; expireCash: number }>({ totalCash: 0, expireCash: 0 });
  
  // 무사고캐시 적립 가능한 계약 목록
  interface EligibleContract {
    id: number;
    contract_number: string;
    insurance_type: string;
    departure_date: string;
    arrival_date: string;
    total_premium: number;
    status: string;
    created_at: string;
    travel_region?: string | null;
    travel_country?: string | null;
    travel_purpose?: string | null;
    eligibleCashAmount: number;
    daysSinceEnd: number;
    isEligible: boolean;
  }
  const [eligibleContracts, setEligibleContracts] = useState<EligibleContract[]>([]);
  const [isAccumulating, setIsAccumulating] = useState<number | null>(null);
  
  // 무사고캐시 상세 모달
  const [selectedCashDetail, setSelectedCashDetail] = useState<CashHistory | null>(null);
  const [showCashDetailModal, setShowCashDetailModal] = useState<boolean>(false);

  // 소멸예정 캐시 모달
  const [showExpireCashModal, setShowExpireCashModal] = useState<boolean>(false);
  const [expireCashList, setExpireCashList] = useState<CashHistory[]>([]);

  // 모달이 열릴 때 body 스크롤 고정
  useEffect(() => {
    if (showCashDetailModal || showExpireCashModal) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.classList.add('modal-open');
      
      return () => {
        // 모달이 닫힐 때 스크롤 위치 복원
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showCashDetailModal, showExpireCashModal]);

  // 로그인 타입 (비로그인 사용자용)
  const [loginType, setLoginType] = useState<'I' | 'C'>('I');

  // 개인 정보
  const [insuredName, setInsuredName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'1' | '2'>('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // 단체 정보
  const [companyName, setCompanyName] = useState('');
  const [businessNumber1, setBusinessNumber1] = useState('');
  const [businessNumber2, setBusinessNumber2] = useState('');
  const [businessNumber3, setBusinessNumber3] = useState('');
  const [companyPhoneNumber, setCompanyPhoneNumber] = useState('');
  const [companyVerificationCode, setCompanyVerificationCode] = useState('');
  const [showCompanyVerificationInput, setShowCompanyVerificationInput] = useState(false);
  const [companyRemainingTime, setCompanyRemainingTime] = useState(0);

  // 기타 상태
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [reSendYn, setReSendYn] = useState('N');
  const [beforeCtel, setBeforeCtel] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // 인증 완료 여부
  const [nonMemberContracts, setNonMemberContracts] = useState<Contract[]>([]); // 비회원 계약 목록
  const [nonMemberContractPagination, setNonMemberContractPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  }>({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });

  // 타이머 효과
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  useEffect(() => {
    if (companyRemainingTime > 0) {
      const timer = setInterval(() => {
        setCompanyRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [companyRemainingTime]);

  // 유효성 검사 (6자리: YYMMDD)
  const isValidBirthDate = (date: string): boolean => {
    if (!date || date.length !== 6) return false;
    // 숫자만 있는지 확인
    if (!/^\d{6}$/.test(date)) return false;
    
    const year = parseInt(date.substring(0, 2), 10);
    const month = parseInt(date.substring(2, 4), 10);
    const day = parseInt(date.substring(4, 6), 10);
    
    // NaN 체크
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    
    // 월 검증
    if (month < 1 || month > 12) return false;
    
    // 일 검증 (기본 범위)
    if (day < 1 || day > 31) return false;
    
    // 실제 날짜 유효성 검사
    const currentYear = new Date().getFullYear();
    const currentYearLastTwo = currentYear % 100;
    // YY가 현재 연도의 마지막 두 자리보다 크면 1900년대, 작거나 같으면 2000년대로 가정
    const fullYear = year > currentYearLastTwo ? 1900 + year : 2000 + year;
    
    const dateObj = new Date(fullYear, month - 1, day);
    if (dateObj.getFullYear() !== fullYear || 
        dateObj.getMonth() !== month - 1 || 
        dateObj.getDate() !== day) {
      return false;
    }
    
    return true;
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/-/g, '');
    return /^01[0-9]{9}$/.test(cleaned);
  };

  // 인증번호 발송
  const handleSendVerification = async () => {
    if (loginType === 'I') {
      if (!insuredName.trim()) {
        alert('대표가입자명을 입력해 주세요.');
        return;
      }
      if (!birthDate || !isValidBirthDate(birthDate)) {
        alert('생년월일을 6자리로 입력해 주세요. (예: 931208)');
        return;
      }
      if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
        alert('휴대폰 번호를 정확히 입력해 주세요.');
        return;
      }

      const cleanedPhone = phoneNumber.replace(/-/g, '');
      if (beforeCtel !== cleanedPhone) {
        setBeforeCtel(cleanedPhone);
        setReSendYn('N');
      }

      try {
        const result = await sendVerificationCode(cleanedPhone, false);
        if (result.success) {
          alert('인증번호가 발송되었습니다.');
          setShowVerificationInput(true);
          setRemainingTime(180);
          setIsVerificationSent(true);
          if (reSendYn === 'N') setReSendYn('Y');
        } else {
          alert(result.message || '인증번호 발송에 실패했습니다.');
        }
      } catch (error) {
        console.error('인증번호 발송 오류:', error);
        alert('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } else {
      if (!companyName.trim()) {
        alert('단체(사업자/법인)명을 입력해 주세요.');
        return;
      }
      if (!businessNumber1 || businessNumber1.length < 3) {
        alert('사업자번호를 정확히 입력해 주세요.');
        return;
      }
      if (!businessNumber2 || businessNumber2.length < 2) {
        alert('사업자번호를 정확히 입력해 주세요.');
        return;
      }
      if (!businessNumber3 || businessNumber3.length < 5) {
        alert('사업자번호를 정확히 입력해 주세요.');
        return;
      }
      if (!companyPhoneNumber || !isValidPhoneNumber(companyPhoneNumber)) {
        alert('휴대폰 번호를 정확히 입력해 주세요.');
        return;
      }

      const cleanedPhone = companyPhoneNumber.replace(/-/g, '');
      if (beforeCtel !== cleanedPhone) {
        setBeforeCtel(cleanedPhone);
        setReSendYn('N');
      }

      try {
        const result = await sendVerificationCode(cleanedPhone, false);
        if (result.success) {
          alert('인증번호가 발송되었습니다.');
          setShowCompanyVerificationInput(true);
          setCompanyRemainingTime(180);
          setIsVerificationSent(true);
          if (reSendYn === 'N') setReSendYn('Y');
        } else {
          alert(result.message || '인증번호 발송에 실패했습니다.');
        }
      } catch (error) {
        console.error('인증번호 발송 오류:', error);
        alert('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  // 계약 리스트 영역 스크롤용 ref
  const contractListRef = useRef<HTMLDivElement>(null);
  const memberContractListRef = useRef<HTMLDivElement>(null);
  const eventContractListRef = useRef<HTMLDivElement>(null);

  const scrollToNonMemberContractList = () => {
    if (contractListRef.current) {
      contractListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToMemberContractList = () => {
    if (memberContractListRef.current) {
      memberContractListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToEventContractList = () => {
    if (eventContractListRef.current) {
      eventContractListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 로그인하지 않은 유저용: 계약 목록 조회
  const getNonMemberContractList = async (page: number = 1) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      let url = '';
      
      if (loginType === 'I') {
        // 개인: 이름, 생년월일(6자리), 성별, 휴대폰 번호로 조회
        const cleanedPhone = phoneNumber.replace(/-/g, '');
        // 생년월일을 8자리로 변환 (YYMMDD -> YYYYMMDD)
        let fullBirthDate = '';
        if (birthDate.length === 6) {
          const year = parseInt(birthDate.substring(0, 2), 10);
          const currentYear = new Date().getFullYear();
          const currentYearLastTwo = currentYear % 100;
          const fullYear = year > currentYearLastTwo ? 1900 + year : 2000 + year;
          fullBirthDate = `${fullYear}${birthDate.substring(2, 6)}`;
        }
        
        url = `${API_BASE_URL}/api/contracts/non-member/list?name=${encodeURIComponent(insuredName)}&birth_date=${fullBirthDate}&gender=${gender}&phone=${cleanedPhone}&inyear=${inYear}&block_type=C&str_cur_page=${page}`;
      } else {
        // 단체: 사업자번호, 회사명, 담당자 휴대폰 번호로 조회
        const businessNumber = `${businessNumber1}-${businessNumber2}-${businessNumber3}`;
        const cleanedPhone = companyPhoneNumber.replace(/-/g, '');
        url = `${API_BASE_URL}/api/contracts/non-member/list?company_name=${encodeURIComponent(companyName)}&business_number=${encodeURIComponent(businessNumber)}&phone=${cleanedPhone}&inyear=${inYear}&block_type=C&str_cur_page=${page}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        const contractsData = data.contracts || [];
        setNonMemberContracts(contractsData);
        setNonMemberContractPagination({
          currentPage: data.pagination?.currentPage || page,
          totalPages: data.pagination?.totalPages || 0,
          totalCount: data.pagination?.totalCount || 0,
          pageSize: data.pagination?.pageSize || 10
        });
        
        // 계약 리스트가 있으면 해당 영역으로 스크롤 이동
        if (contractsData.length > 0 && contractListRef.current) {
          setTimeout(() => {
            contractListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      } else {
        setNonMemberContracts([]);
        setNonMemberContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
      }
    } catch (error) {
      console.error('계약 목록 조회 오류:', error);
      setNonMemberContracts([]);
      setNonMemberContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    if (remainingTime <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      return;
    }

    try {
      const cleanedPhone = phoneNumber.replace(/-/g, '');
      const result = await verifyCode(cleanedPhone, verificationCode);
      if (result.success) {
        alert('인증이 완료되었습니다.');
        setIsVerified(true);
        // 계약 목록 조회
        await getNonMemberContractList();
      } else {
        alert(result.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('인증번호 확인 오류:', error);
      alert('인증 확인에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleVerifyCompanyCode = async () => {
    if (!companyVerificationCode || companyVerificationCode.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    if (companyRemainingTime <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      return;
    }

    try {
      const cleanedPhone = companyPhoneNumber.replace(/-/g, '');
      const result = await verifyCode(cleanedPhone, companyVerificationCode);
      if (result.success) {
        alert('인증이 완료되었습니다.');
        setIsVerified(true);
        // 계약 목록 조회
        await getNonMemberContractList();
      } else {
        alert(result.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('인증번호 확인 오류:', error);
      alert('인증 확인에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleSearch = async () => {
    // 이미 인증이 완료된 경우 계약 리스트만 다시 조회
    if (isVerified) {
      await getNonMemberContractList();
      return;
    }

    // 인증이 완료되지 않은 경우 인증 진행
    if (loginType === 'I') {
      if (!showVerificationInput || !isVerificationSent) {
        alert('인증번호받기를 먼저 해주세요.');
        return;
      }
      await handleVerifyCode();
    } else {
      if (!showCompanyVerificationInput || !isVerificationSent) {
        alert('인증번호받기를 먼저 해주세요.');
        return;
      }
      await handleVerifyCompanyCode();
    }
  };

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setBirthDate(value);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      setPhoneNumber(value);
    }
  };

  const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      setCompanyPhoneNumber(value);
    }
  };

  const handleBusinessNumber1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 3) {
      setBusinessNumber1(value);
    }
  };

  const handleBusinessNumber2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 2) {
      setBusinessNumber2(value);
    }
  };

  const handleBusinessNumber3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 5) {
      setBusinessNumber3(value);
    }
  };

  // 로그인한 유저용: 계약 목록 조회
  const getContractList = async (page: number = 1) => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/contracts/list?member_id=${member.id}&inyear=${inYear}&block_type=C&str_cur_page=${page}&str_page_size=3`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        setContracts(data.contracts || []);
        setContractPagination({
          currentPage: data.pagination?.currentPage || page,
          totalPages: data.pagination?.totalPages || 0,
          totalCount: data.pagination?.totalCount || 0,
          pageSize: data.pagination?.pageSize || 3
        });
      } else {
        setContracts([]);
        setContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 3 });
      }
    } catch (error) {
      console.error('계약 목록 조회 오류:', error);
      setContracts([]);
      setContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 3 });
    }
  };

  // 로그인한 유저용: 행사보험 계약 목록 조회
  const getEventContractList = async (page: number = 1) => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/event-contracts/list?member_id=${member.id}&inyear=${inYear}&block_type=C&str_cur_page=${page}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        setEventContracts(data.contracts || []);
        setEventContractPagination({
          currentPage: data.pagination?.currentPage || page,
          totalPages: data.pagination?.totalPages || 0,
          totalCount: data.pagination?.totalCount || 0,
          pageSize: data.pagination?.pageSize || 10
        });
      } else {
        setEventContracts([]);
        setEventContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
      }
    } catch (error) {
      console.error('행사보험 계약 목록 조회 오류:', error);
      setEventContracts([]);
      setEventContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
    }
  };

  // 로그인한 유저용: 마일리지 정보 조회
  const getMileageInfo = async () => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/mileage/info?member_id=${member.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMileageInfo({
            totalMileage: data.totalMileage || 0,
          });
        }
      }
    } catch (error) {
      console.error('마일리지 정보 조회 오류:', error);
    }
  };

  // 로그인한 유저용: 마일리지 내역 조회
  const getMileageList = async () => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/mileage/list?member_id=${member.id}&inyear=${mileageInYear}&block_type=C&str_cur_page=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        setMileageList(data.mileageList || []);
      } else {
        setMileageList([]);
      }
    } catch (error) {
      console.error('마일리지 내역 조회 오류:', error);
      setMileageList([]);
    }
  };

  // 페이지 진입(또는 로그인/회원 정보 변경) 시 최신 마일리지 정보 조회
  useEffect(() => {
    if (isLoggedIn && member) {
      getMileageInfo();
    }
  }, [isLoggedIn, member]);

  // 로그인한 유저용: 데이터 로딩 useEffect
  useEffect(() => {
    if (isLoggedIn && member) {
      if (activeTab === 'contract') {
        if (searchType === 'contract') {
          getContractList(1);
        } else if (searchType === 'event') {
          getEventContractList(1);
        }
      } else if (activeTab === 'cash') {
        getCashInfo();
        getCashList();
        getEligibleContracts();
      } else if (activeTab === 'mileage') {
        getMileageInfo();
        getMileageList();
      }
    }
  }, [isLoggedIn, member, inYear, activeTab, searchType]);

  // 로그인한 유저용: 무사고캐시 정보 조회 (금액, 소멸예정 캐시)
  const getCashInfo = async () => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/cash/info?member_id=${member.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCashInfo({
            totalCash: data.totalCash || 0,
            expireCash: data.expireCash || 0,
          });
        }
      }
    } catch (error) {
      console.error('무사고캐시 정보 조회 오류:', error);
    }
  };

  // 로그인한 유저용: 무사고캐시 내역 조회
  const getCashList = async () => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/cash/list?member_id=${member.id}&inyear=${cashInYear}&block_type=C&str_cur_page=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        setCashList(data.cashList || []);
      } else {
        setCashList([]);
      }
    } catch (error) {
      console.error('무사고캐시 내역 조회 오류:', error);
      setCashList([]);
    }
  };

  // 소멸예정 캐시 목록 조회
  const fetchExpireCashList = async () => {
    if (!isLoggedIn || !member) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/cash/list?member_id=${member.id}&inyear=1&block_type=C&str_cur_page=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      if (data.success) {
        // 소멸예정 캐시 필터링 (만료일이 있고, 아직 만료되지 않은 항목)
        const now = new Date();
        const expireList = (data.cashList || []).filter((cash: CashHistory) => {
          if (!cash.created_at) return false;
          const createdDate = new Date(cash.created_at);
          const expireDate = new Date(createdDate);
          expireDate.setFullYear(expireDate.getFullYear() + 1);
          // 만료일이 현재보다 미래인 경우만 (충전 타입만)
          return cash.type === '충전' && expireDate > now;
        }).map((cash: CashHistory) => {
          // 만료일 계산
          const createdDate = new Date(cash.created_at);
          const expireDate = new Date(createdDate);
          expireDate.setFullYear(expireDate.getFullYear() + 1);
          return {
            ...cash,
            expire_date: expireDate.toISOString(),
          };
        });
        setExpireCashList(expireList);
      } else {
        setExpireCashList([]);
      }
    } catch (error) {
      console.error('소멸예정 캐시 목록 조회 오류:', error);
      setExpireCashList([]);
    }
  };

  // 무사고캐시 내역 조회 기간 변경 핸들러
  const handleCashInYearChange = (value: number) => {
    setCashInYear(value);
  };

  // 마일리지 내역 조회 기간 변경 시
  useEffect(() => {
    if (isLoggedIn && member && activeTab === 'mileage') {
      getMileageList();
    }
  }, [mileageInYear]);

  // 무사고캐시 적립 가능한 계약 목록 조회
  const getEligibleContracts = async () => {
    if (!isLoggedIn || !member || member.member_type !== '개인') return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/cash/eligible-contracts?member_id=${member.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEligibleContracts(data.contracts || []);
        }
      }
    } catch (error) {
      console.error('적립 가능한 계약 조회 오류:', error);
      setEligibleContracts([]);
    }
  };

  // 무사고캐시 적립
  const handleAccumulateCash = async (contractId: number) => {
    if (!isLoggedIn || !member) return;

    if (!confirm('무사고캐시를 적립하시겠습니까?')) {
      return;
    }

    setIsAccumulating(contractId);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/cash/accumulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          member_id: member.id,
          contract_id: contractId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`무사고캐시 ${data.cashAmount.toLocaleString()}원이 적립되었습니다.`);
        // 데이터 새로고침
        await Promise.all([
          getCashInfo(),
          getCashList(),
          getEligibleContracts(),
        ]);
      } else {
        alert(data.message || '무사고캐시 적립에 실패했습니다.');
      }
    } catch (error) {
      console.error('무사고캐시 적립 오류:', error);
      alert('무사고캐시 적립 중 오류가 발생했습니다.');
    } finally {
      setIsAccumulating(null);
    }
  };

  // 무사고캐시 내역 조회 기간 변경 시
  useEffect(() => {
    if (isLoggedIn && member && activeTab === 'cash') {
      getCashList();
    }
  }, [cashInYear]);

  // 비로그인 사용자 화면 렌더링
  const renderNonLoggedInView = () => (
    <>
      {/* 메인 컨텐츠 */}
      <div className="tour2023_header_line prow_01">
        <div className="tour2023_header_inner">
          <span className="tourTop_title">계약/캐시 조회</span>
        </div>
      </div>

      <form name="loginForm" method="post">
        <div className="prow_01">
          <p className="tour2023_title04">가입자정보</p>

          {/* 개인/단체 선택 */}
          <div className="tour2023_ra_Wrap tourG_mab08">
            <ul className="tour2023_ra_Wrap01">
              <li className="tour2023_rdo_area">
                <span className="tour2023_inp_rdo">
                  <input 
                    type="radio" 
                    id="one_pgood01" 
                    value="I" 
                    name="login_type" 
                    checked={loginType === 'I'}
                    onChange={(e) => {
                      setLoginType('I');
                      setShowVerificationInput(false);
                      setShowCompanyVerificationInput(false);
                      setIsVerificationSent(false);
                      setRemainingTime(0);
                      setCompanyRemainingTime(0);
                      setIsVerified(false);
                      setNonMemberContracts([]);
                      setNonMemberContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
                    }}
                  />
                  <label htmlFor="one_pgood01">개인</label>
                </span>
                <span className="tour2023_inp_rdo">
                  <input 
                    type="radio" 
                    id="one_pgood02" 
                    value="C" 
                    name="login_type"
                    checked={loginType === 'C'}
                    onChange={(e) => {
                      setLoginType('C');
                      setShowVerificationInput(false);
                      setShowCompanyVerificationInput(false);
                      setIsVerificationSent(false);
                      setRemainingTime(0);
                      setCompanyRemainingTime(0);
                      setIsVerified(false);
                      setNonMemberContracts([]);
                      setNonMemberContractPagination({ currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 10 });
                    }}
                  />
                  <label htmlFor="one_pgood02">단체(사업자/법인)</label>
                </span>
              </li>
            </ul>
          </div>

          <div className="tourGuard_Info">
            {/* 개인 입력 영역 */}
            {loginType === 'I' && (
              <div id="input_I" data-name="input_area">
                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="insured_name">대표가입자명</label>
                  <input 
                    type="text" 
                    name="insured_name" 
                    id="insured_name" 
                    maxLength={15} 
                    placeholder="대표가입자명" 
                    className="tourGuard_input_w02"
                    value={insuredName}
                    onChange={(e) => setInsuredName(e.target.value)}
                  />
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                  <label htmlFor="birth_date">생년월일</label>
                  <input 
                    type="tel" 
                    name="birth_date" 
                    id="birth_date" 
                    maxLength={6} 
                    placeholder="예)931208" 
                    className="tourGuard_input_w01"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                  />

                  <div className="tourG_rdo_area">
                    <label htmlFor="rad_mw01">성별</label>
                    <span className="tourG_inp_rdo">
                      <input 
                        type="radio" 
                        id="rad_mw01" 
                        value="1" 
                        name="gender"
                        checked={gender === '1'}
                        onChange={() => setGender('1')}
                      />
                      <label htmlFor="rad_mw01">남자</label>
                    </span>
                    <span className="tourG_inp_rdo">
                      <input 
                        type="radio" 
                        id="rad_mw02" 
                        value="2" 
                        name="gender"
                        checked={gender === '2'}
                        onChange={() => setGender('2')}
                      />
                      <label htmlFor="rad_mw02" className="one_line0">여자</label>
                    </span>
                  </div>
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="ctel_no">휴대폰 번호</label>
                  <input 
                    type="tel" 
                    name="ctel_no" 
                    id="ctel_no" 
                    maxLength={11} 
                    placeholder="숫자만 입력해주세요." 
                    className="tourGuard_input_w02"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                  />
                  <div className="tour2023_event_file">
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handleSendVerification(); }}
                      className="tour2023_btn_b01 tour2023_btn11"
                    >
                      인증받기
                    </a>
                  </div>
                </div>

                {showVerificationInput && (
                  <div id="signArea" className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor="signNo">인증번호</label>
                    <input 
                      type="tel" 
                      id="signNo" 
                      name="signNo" 
                      maxLength={6} 
                      placeholder="6자리 입력" 
                      className="tourGuard_input_w02"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 6) {
                          setVerificationCode(value);
                        }
                      }}
                    />
                    <div className="tour2023_timer">
                      <span className="tour2023_timeLimit" data-name="compare_time">{formatTime(remainingTime)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 단체 입력 영역 */}
            {loginType === 'C' && (
              <div id="input_C" data-name="input_area">
                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="contract_company">단체(사업자/법인)명</label>
                  <input 
                    type="text" 
                    name="contract_company" 
                    maxLength={30} 
                    placeholder="단체(사업자/법인)명" 
                    className="tourGuard_input_w02"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="resno1">사업자번호</label>
                  <input 
                    type="tel" 
                    name="resno1" 
                    maxLength={3} 
                    placeholder="" 
                    className="tourGuard_input_w03"
                    value={businessNumber1}
                    onChange={handleBusinessNumber1Change}
                  />
                  <span className="business-number-separator">-</span>
                  <input 
                    type="tel" 
                    name="resno2" 
                    maxLength={2} 
                    placeholder="" 
                    className="tourGuard_input_w03"
                    value={businessNumber2}
                    onChange={handleBusinessNumber2Change}
                  />
                  <span className="business-number-separator">-</span>
                  <input 
                    type="tel" 
                    name="resno3" 
                    maxLength={5} 
                    placeholder="" 
                    className="tourGuard_input_w03"
                    value={businessNumber3}
                    onChange={handleBusinessNumber3Change}
                  />
                </div>

                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label htmlFor="c_ctel_no">담당자 휴대폰 번호</label>
                  <input 
                    type="tel" 
                    name="c_ctel_no" 
                    maxLength={11} 
                    placeholder="숫자만 입력해주세요." 
                    className="tourGuard_input_w02"
                    value={companyPhoneNumber}
                    onChange={handleCompanyPhoneChange}
                  />
                  <div className="tour2023_event_file">
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handleSendVerification(); }}
                      className="tour2023_btn_b01 tour2023_btn11"
                    >
                      인증받기
                    </a>
                  </div>
                </div>

                {showCompanyVerificationInput && (
                  <div id="c_signArea" className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor="c_signNo">인증번호</label>
                    <input 
                      type="tel" 
                      id="c_signNo" 
                      name="c_signNo" 
                      maxLength={6} 
                      placeholder="6자리 입력" 
                      className="tourGuard_input_w02"
                      value={companyVerificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 6) {
                          setCompanyVerificationCode(value);
                        }
                      }}
                    />
                    <div className="tour2023_timer">
                      <span className="tour2023_timeLimit" data-name="compare_time">{formatTime(companyRemainingTime)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 조회하기 버튼 */}
          <div className="tourG_mat11">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); handleSearch(); }} 
              className="tourGuard_btn_b tour2023_btn01"
            >
              조회하기
            </a>
          </div>

          {/* 인증 완료 후 계약 리스트 표시 */}
          {isVerified && (
            <div className="prow_01">
              <div className="tourGuard_form_tt mag5 tourG_mab04 tourG_mat10">
                <label htmlFor="">보험가입내역 조회</label>
                <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                  <span className="tourGuard_ps_box">
                    <select 
                      className="tourGuard_sel" 
                      id="non_member_inyear" 
                      value={inYear}
                      onChange={(e) => {
                        setInYear(Number(e.target.value));
                        getNonMemberContractList(1);
                      }}
                    >
                      <option value={1}>최근 1년이내</option>
                      <option value={2}>최근 2년이내</option>
                    </select>
                  </span>
                </div>
              </div>

              {/* 계약 리스트 */}
              <div id="nonMemberContractList" ref={contractListRef} className="tourG_mat10" style={{ marginTop: 0, paddingTop: 40 }}>
                {nonMemberContracts.length === 0 ? (
                  <>
                    <p className="tour2023_title02">가입/신청내역</p>
                    <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                    <p className="tour2023_mypageBox">
                      <span className="tour2023_title14">계약 내역이 없습니다.</span>
                    </p>
                  </>
                ) : (
                  <>
                    {(() => {
                      const calculateDuration = (start: string, end: string) => {
                        if (!start || !end) return '';
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                        
                        if (diffDays >= 1) {
                          return `(${diffDays}일)`;
                        } else {
                          return `(${diffHours}시간)`;
                        }
                      };

                      const getInsuranceTypeDisplay = (insuranceType: string) => {
                        const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
                        if (longTermTypes.includes(insuranceType)) {
                          return '해외장기체류보험';
                        }
                        return insuranceType;
                      };

                      const getInsuranceCompany = (insuranceType: string) => {
                        const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
                        if (insuranceType === '국내여행보험') {
                          return '라이나손해 국내여행보험';
                        } else if (insuranceType === '해외여행보험') {
                          return '라이나손해 해외여행보험';
                        } else if (longTermTypes.includes(insuranceType)) {
                          return '메리츠화재 해외장기체류보험';
                        }
                        return '라이나손해 해외여행보험';
                      };

                      return nonMemberContracts.map((contract, index) => (
                        <div key={contract.id}>
                          {index === 0 && (
                            <p className="tour2023_title02">가입/신청내역</p>
                          )}
                          
                          <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                          <ul className="tour2023_conList_Wrap">
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">관리번호</span>
                              <span className="tour2023_txt10">
                                {contract.contractNumber}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">가입자</span>
                              <span className="tour2023_txt10">
                                {loginType === 'I' ? insuredName : companyName}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험종목/상품명</span>
                              <span className="tour2023_txt10">
                                {getInsuranceTypeDisplay(contract.insuranceType)}<br />
                                {getInsuranceCompany(contract.insuranceType)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험기간</span>
                              <span className="tour2023_txt10">
                                {formatInsurancePeriod(contract.departureDate, contract.arrivalDate)}<br />
                                {calculateDuration(contract.departureDate, contract.arrivalDate)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">여행지/여행목적</span>
                              <span className="tour2023_txt10">
                                {(() => {
                                  const destination = contract.travelCountry || contract.travelRegion || null;
                                  const purpose = contract.travelPurpose || null;
                                  
                                  if (destination && purpose) {
                                    return `${destination}/${purpose}`;
                                  } else if (purpose) {
                                    return purpose;
                                  } else if (destination) {
                                    return destination;
                                  }
                                  return '-';
                                })()}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">진행단계</span>
                              <span className="tour2023_txt10">{contract.status === '등록' ? '가입신청' : contract.status}</span>
                            </li>
                          </ul>
                          <div className="tourG_line05 tourG_mat09 tourG_mab04"></div>
                          <Link href={`/contracts/detail/${contract.id}`}>
                            <span className="tour2023_txt19">자세히보기&nbsp;&gt;</span>
                          </Link>
                          <div className="tourG_mat14 tourG_Wrap"></div>
                        </div>
                      ));
                    })()}

                    {/* 페이지네이션 */}
                    {nonMemberContractPagination.totalPages > 0 && (
                      <div className="board_foot" style={{ paddingBottom: '12px' }}>
                        <ul className="paging">
                          {/* 첫 페이지로 이동 */}
                          {nonMemberContractPagination.currentPage > 1 && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  scrollToNonMemberContractList();
                                  getNonMemberContractList(1);
                                }}
                                className="paging-nav-first"
                                title="첫 페이지"
                              >
                                <span className="paging-double-arrow-left">
                                  <img src={getImagePath('/images/g_more.png')} alt="첫 페이지" />
                                  <img src={getImagePath('/images/g_more.png')} alt="" />
                                </span>
                              </a>
                            </li>
                          )}
                          
                          {/* 이전 페이지로 이동 */}
                          {nonMemberContractPagination.currentPage > 1 && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  scrollToNonMemberContractList();
                                  getNonMemberContractList(nonMemberContractPagination.currentPage - 1);
                                }}
                                className="paging-nav-prev"
                                title="이전 페이지"
                              >
                                <img src={getImagePath('/images/g_more.png')} alt="이전" className="paging-arrow-left" />
                              </a>
                            </li>
                          )}

                          {/* 페이지 번호들 (최대 3개) */}
                          {(() => {
                            const { currentPage, totalPages } = nonMemberContractPagination;
                            let startPage = Math.max(1, currentPage - 1);
                            let endPage = Math.min(totalPages, startPage + 2);
                            
                            // 끝에서 3개가 안 될 경우 시작점 조정
                            if (endPage - startPage < 2) {
                              startPage = Math.max(1, endPage - 2);
                            }

                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(i);
                            }

                            return pages.map((page) => (
                              <li key={page} className={page === currentPage ? 'on' : ''}>
                                <a 
                                  href="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (page !== currentPage) {
                                    scrollToNonMemberContractList();
                                      getNonMemberContractList(page);
                                    }
                                  }}
                                >
                                  {page}
                                </a>
                              </li>
                            ));
                          })()}

                          {/* 다음 페이지로 이동 */}
                          {nonMemberContractPagination.currentPage < nonMemberContractPagination.totalPages && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  scrollToNonMemberContractList();
                                  getNonMemberContractList(nonMemberContractPagination.currentPage + 1);
                                }}
                                className="paging-nav-next"
                                title="다음 페이지"
                              >
                                <img src={getImagePath('/images/g_more.png')} alt="다음" className="paging-arrow-right" />
                              </a>
                            </li>
                          )}

                          {/* 마지막 페이지로 이동 */}
                          {nonMemberContractPagination.currentPage < nonMemberContractPagination.totalPages && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  scrollToNonMemberContractList();
                                  getNonMemberContractList(nonMemberContractPagination.totalPages);
                                }}
                                className="paging-nav-last"
                                title="마지막 페이지"
                              >
                                <span className="paging-double-arrow-right">
                                  <img src={getImagePath('/images/g_more.png')} alt="마지막" />
                                  <img src={getImagePath('/images/g_more.png')} alt="" />
                                </span>
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
        <span className="tour2023_txt02 tour2023_grey">
          <span>
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </span>
        </span>
      </div>
    </>
  );

  // 로그인한 사용자 화면 렌더링
  const renderLoggedInView = () => (
    <>
      {/* 상단 탭 메뉴 */}
      <section id="tour2023_mypageTop">
        <div className="tour2023_mypageTop_menu" style={{}}>
          <a 
            href="#" 
            className={`tour2023_mypageTop_w tour2023_mypageTop_m01_w02 tour2023_mypageTop_m01 ${activeTab === 'contract' ? 'on' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('contract');
            }}
          >
            가입/신청 내역
          </a>
          {member?.member_type === '개인' && (
            <a 
              href="#" 
              className={`tour2023_mypageTop_w tour2023_mypageTop_m01_w02 tour2023_mypageTop_m01 ${activeTab === 'cash' ? 'on' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('cash');
              }}
            >
              무사고캐시 내역
            </a>
          )}
          <a 
            href="#" 
            className={`tour2023_mypageTop_w tour2023_mypageTop_m01_w02 tour2023_mypageTop_m01 ${activeTab === 'mileage' ? 'on' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('mileage');
            }}
          >
            마일리지내역
          </a>
        </div>
      </section>

      <div className="prow_01">
        {/* 가입/신청 내역 탭 내용 */}
        {activeTab === 'contract' && (
          <>
            {/* 여행자보험/행사보험 선택 */}
            <div className="tour2023_ra_Wrap tourG_mat12 tourG_mab08">
              <ul className="tour2023_ra_Wrap01">
                <li className="tour2023_rdo_area">
                  <span className="tour2023_inp_rdo">
                    <input 
                      type="radio" 
                      id="one_pgood01" 
                      value="contract" 
                      name="search_type" 
                      checked={searchType === 'contract'}
                      onChange={(e) => setSearchType('contract')}
                    />
                    <label htmlFor="one_pgood01">여행자보험</label>
                  </span>
                  <span className="tour2023_inp_rdo">
                    <input 
                      type="radio" 
                      id="one_pgood02" 
                      value="event" 
                      name="search_type"
                      checked={searchType === 'event'}
                      onChange={(e) => setSearchType('event')}
                    />
                    <label htmlFor="one_pgood02">행사보험</label>
                  </span>
                </li>
              </ul>
            </div>

            {/* 보험가입내역 조회 */}
            <div className="tourGuard_form_tt mag5 tourG_mab04 tourG_mat10">
              <label htmlFor="">보험가입내역 조회</label>
              <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                <span className="tourGuard_ps_box">
                  <select 
                    className="tourGuard_sel" 
                    id="inyear" 
                    value={inYear}
                    onChange={(e) => setInYear(Number(e.target.value))}
                  >
                    <option value={1}>최근 1년이내</option>
                    <option value={2}>최근 2년이내</option>
                  </select>
                </span>
              </div>
            </div>

            {/* 계약 리스트 */}
            <div id="contractList" ref={memberContractListRef} className="tourG_mat10" style={{}}>
              {searchType === 'contract' ? (
                contracts.length === 0 ? (
                  <>
                    <p className="tour2023_title02">가입/신청내역</p>
                    <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                    <p className="tour2023_mypageBox">
                      <span className="tour2023_title14">여행자보험 가입내역이 없습니다.</span>
                    </p>
                  </>
                ) : (
                  <>
                    {(() => {
                      const calculateDuration = (start: string, end: string) => {
                        if (!start || !end) return '';
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                        
                        if (diffDays >= 1) {
                          return `(${diffDays}일)`;
                        } else {
                          return `(${diffHours}시간)`;
                        }
                      };

                      const getInsuranceTypeDisplay = (insuranceType: string) => {
                        const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
                        if (longTermTypes.includes(insuranceType)) {
                          return '해외장기체류보험';
                        }
                        return insuranceType;
                      };

                      const getInsuranceCompany = (insuranceType: string) => {
                        const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
                        if (insuranceType === '국내여행보험') {
                          return '라이나손해 국내여행보험';
                        } else if (insuranceType === '해외여행보험') {
                          return '라이나손해 해외여행보험';
                        } else if (longTermTypes.includes(insuranceType)) {
                          return '메리츠화재 해외장기체류보험';
                        }
                        return '라이나손해 해외여행보험';
                      };

                      return contracts.map((contract, index) => (
                        <div key={contract.id}>
                          {index === 0 && (
                            <p className="tour2023_title02">가입/신청내역</p>
                          )}
                          
                          <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                          <ul className="tour2023_conList_Wrap">
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">관리번호</span>
                              <span className="tour2023_txt10">
                                {contract.contractNumber}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">가입자</span>
                              <span className="tour2023_txt10">
                                {member?.name || '-'}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험종목/상품명</span>
                              <span className="tour2023_txt10">
                                {getInsuranceTypeDisplay(contract.insuranceType)}<br />
                                {getInsuranceCompany(contract.insuranceType)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험기간</span>
                              <span className="tour2023_txt10">
                                {formatInsurancePeriod(contract.departureDate, contract.arrivalDate)}<br />
                                {calculateDuration(contract.departureDate, contract.arrivalDate)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">여행지/여행목적</span>
                              <span className="tour2023_txt10">
                                {(() => {
                                  const destination = contract.travelCountry || contract.travelRegion || null;
                                  const purpose = contract.travelPurpose || null;
                                  
                                  if (destination && purpose) {
                                    return `${destination}/${purpose}`;
                                  } else if (purpose) {
                                    return purpose;
                                  } else if (destination) {
                                    return destination;
                                  }
                                  return '-';
                                })()}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">진행단계</span>
                              <span className="tour2023_txt10">{contract.status === '등록' ? '가입신청' : contract.status}</span>
                            </li>
                          </ul>
                          <div className="tourG_line05 tourG_mat09 tourG_mab04"></div>
                          <Link href={`/contracts/detail/${contract.id}`}>
                            <span className="tour2023_txt19">자세히보기&nbsp;&gt;</span>
                          </Link>
                          <div className="tourG_mat14 tourG_Wrap"></div>
                        </div>
                      ));
                    })()}

                    {/* 페이지네이션 */}
                    {contractPagination.totalPages > 0 && (
                      <div className="board_foot" style={{ paddingBottom: '12px' }}>
                        <ul className="paging">
                          {/* 첫 페이지로 이동 */}
                          {contractPagination.currentPage > 1 && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToMemberContractList();
                                  getContractList(1);
                                }}
                                className="paging-nav-first"
                                title="첫 페이지"
                              >
                                <span className="paging-double-arrow-left">
                                  <img src={getImagePath('/images/g_more.png')} alt="첫 페이지" />
                                  <img src={getImagePath('/images/g_more.png')} alt="" />
                                </span>
                              </a>
                            </li>
                          )}
                          
                          {/* 이전 페이지로 이동 */}
                          {contractPagination.currentPage > 1 && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToMemberContractList();
                                  getContractList(contractPagination.currentPage - 1);
                                }}
                                className="paging-nav-prev"
                                title="이전 페이지"
                              >
                                <img src={getImagePath('/images/g_more.png')} alt="이전" className="paging-arrow-left" />
                              </a>
                            </li>
                          )}

                          {/* 페이지 번호들 (최대 3개) */}
                          {(() => {
                            const { currentPage, totalPages } = contractPagination;
                            let startPage = Math.max(1, currentPage - 1);
                            let endPage = Math.min(totalPages, startPage + 2);
                            
                            // 끝에서 3개가 안 될 경우 시작점 조정
                            if (endPage - startPage < 2) {
                              startPage = Math.max(1, endPage - 2);
                            }

                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(i);
                            }

                            return pages.map((page) => (
                              <li key={page} className={page === currentPage ? 'on' : ''}>
                                <a 
                                  href="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (page !== currentPage) {
                                      scrollToMemberContractList();
                                      getContractList(page);
                                    }
                                  }}
                                >
                                  {page}
                                </a>
                              </li>
                            ));
                          })()}

                          {/* 다음 페이지로 이동 */}
                          {contractPagination.currentPage < contractPagination.totalPages && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToMemberContractList();
                                  getContractList(contractPagination.currentPage + 1);
                                }}
                                className="paging-nav-next"
                                title="다음 페이지"
                              >
                                <img src={getImagePath('/images/g_more.png')} alt="다음" className="paging-arrow-right" />
                              </a>
                            </li>
                          )}

                          {/* 마지막 페이지로 이동 */}
                          {contractPagination.currentPage < contractPagination.totalPages && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToMemberContractList();
                                  getContractList(contractPagination.totalPages);
                                }}
                                className="paging-nav-last"
                                title="마지막 페이지"
                              >
                                <span className="paging-double-arrow-right">
                                  <img src={getImagePath('/images/g_more.png')} alt="마지막" />
                                  <img src={getImagePath('/images/g_more.png')} alt="" />
                                </span>
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )
              ) : (
                eventContracts.length === 0 ? (
                  <>
                    <p className="tour2023_title02">가입/신청내역</p>
                    <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                    <p className="tour2023_mypageBox">
                      <span className="tour2023_title14">행사보험 가입내역이 없습니다.</span>
                    </p>
                  </>
                ) : (
                  <>
                    <div ref={eventContractListRef}></div>
                    {(() => {
                      const calculateEventDuration = (start: string, end: string) => {
                        if (!start || !end) return '';
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `(${diffDays}일)`;
                      };

                      const getStatusDisplay = (status: string) => {
                        const displayText = status === '등록' ? '가입신청' : status;
                        if (status === '등록' || status === '견적신청') {
                          return <em className="tourGuard_red">{displayText}</em>;
                        }
                        return displayText;
                      };

                      return eventContracts.map((contract, index) => (
                        <div key={contract.id}>
                          {index === 0 && (
                            <p className="tour2023_title02">가입/신청내역</p>
                          )}
                          
                          <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                          <ul className="tour2023_conList_Wrap">
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">관리번호</span>
                              <span className="tour2023_txt10">
                                {contract.contractNumber}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">가입자</span>
                              <span className="tour2023_txt10">
                                {contract.contractor || member?.name || '-'}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험종목/상품명</span>
                              <span className="tour2023_txt10">
                                {contract.insuranceType}<br />
                                {contract.insuranceCompany}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">행사명</span>
                              <span className="tour2023_txt10">
                                {contract.eventName}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">보험기간</span>
                              <span className="tour2023_txt10">
                                {formatInsurancePeriod(contract.startDate, contract.endDate)}<br />
                                {calculateEventDuration(contract.startDate, contract.endDate)}
                              </span>
                            </li>
                            <li className="tour2023_conList">
                              <span className="tour2023_txt09">진행단계</span>
                              <span className="tour2023_txt10">{getStatusDisplay(contract.status)}</span>
                            </li>
                          </ul>
                          <div className="tourG_line05 tourG_mat09 tourG_mab04"></div>
                          <div className="tourG_mat14 tourG_Wrap"></div>
                        </div>
                      ));
                    })()}

                    {/* 보험약관보기 & 행사보험견적신청 */}
                    <div className="tourG_mat04">
                      <a 
                        href="/pdf/N52_eventInsu_stipulation.pdf" 
                        download="N52_eventInsu_stipulation.pdf"
                        className="tourGuard_btn_b tour2023_btn06_gray"
                      >
                        보험약관보기<span className="tour2023_arr01"></span>
                      </a>
                    </div>
                    <div className="tourG_mat04">
                      <a 
                        href="/event-insurance"
                        className="tourGuard_btn_b tour2023_btn_event_estimate"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = '/event-insurance';
                        }}
                      >
                        행사보험견적신청
                      </a>
                    </div>

                    {/* 페이지네이션 */}
                    {eventContractPagination.totalPages > 0 && (
                      <div className="board_foot" style={{ paddingBottom: '12px' }}>
                        <ul className="paging">
                          {/* 첫 페이지로 이동 */}
                          {eventContractPagination.currentPage > 1 && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToEventContractList();
                                  getEventContractList(1);
                                }}
                                className="paging-nav-first"
                                title="첫 페이지"
                              >
                                <span className="paging-double-arrow-left">
                                  <img src={getImagePath('/images/g_more.png')} alt="첫 페이지" />
                                  <img src={getImagePath('/images/g_more.png')} alt="" />
                                </span>
                              </a>
                            </li>
                          )}
                          
                          {/* 이전 페이지로 이동 */}
                          {eventContractPagination.currentPage > 1 && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToEventContractList();
                                  getEventContractList(eventContractPagination.currentPage - 1);
                                }}
                                className="paging-nav-prev"
                                title="이전 페이지"
                              >
                                <img src={getImagePath('/images/g_more.png')} alt="이전" className="paging-arrow-left" />
                              </a>
                            </li>
                          )}

                          {/* 페이지 번호들 (최대 3개) */}
                          {(() => {
                            const { currentPage, totalPages } = eventContractPagination;
                            let startPage = Math.max(1, currentPage - 1);
                            let endPage = Math.min(totalPages, startPage + 2);
                            
                            // 끝에서 3개가 안 될 경우 시작점 조정
                            if (endPage - startPage < 2) {
                              startPage = Math.max(1, endPage - 2);
                            }

                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(i);
                            }

                            return pages.map((page) => (
                              <li key={page} className={page === currentPage ? 'on' : ''}>
                                <a 
                                  href="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (page !== currentPage) {
                                      scrollToEventContractList();
                                      getEventContractList(page);
                                    }
                                  }}
                                >
                                  {page}
                                </a>
                              </li>
                            ));
                          })()}

                          {/* 다음 페이지로 이동 */}
                          {eventContractPagination.currentPage < eventContractPagination.totalPages && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToEventContractList();
                                  getEventContractList(eventContractPagination.currentPage + 1);
                                }}
                                className="paging-nav-next"
                                title="다음 페이지"
                              >
                                <img src={getImagePath('/images/g_more.png')} alt="다음" className="paging-arrow-right" />
                              </a>
                            </li>
                          )}

                          {/* 마지막 페이지로 이동 */}
                          {eventContractPagination.currentPage < eventContractPagination.totalPages && (
                            <li>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                    scrollToEventContractList();
                                  getEventContractList(eventContractPagination.totalPages);
                                }}
                                className="paging-nav-last"
                                title="마지막 페이지"
                              >
                                <span className="paging-double-arrow-right">
                                  <img src={getImagePath('/images/g_more.png')} alt="마지막" />
                                  <img src={getImagePath('/images/g_more.png')} alt="" />
                                </span>
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </>
        )}

        {/* 무사고캐시 내역 탭 내용 */}
        {activeTab === 'cash' && (
          <>
            {/* 무사고캐시 정보 */}
            <section className="tour2023_cashBox01 tourG_mat14 tourG_mab05">
              <div className="tour2023_cashBox_in">
                <p className="tour2023_cash_txt01 tourG_mab04">
                  <b>고객님의 무사고캐시는 <span className="tour2023_cash_txt02">{cashInfo.totalCash.toLocaleString()}원</span>입니다.</b>
                </p>
                <p className="tour2023_cash_txt03">투어밸리 무사고캐시는 여행자보험에 재가입하는 경우 할인쿠폰으로 사용하실 수 있습니다.</p>
              </div>
            </section>
            <a 
              href="javascript:void(0);" 
              onClick={async (e) => {
                e.preventDefault();
                await fetchExpireCashList();
                setShowExpireCashModal(true);
              }}
            >
              <span className="tour2023_cash_txt04">소멸예정 캐시 {cashInfo.expireCash.toLocaleString()}원&nbsp;&gt;</span>
            </a>

            {/* 무사고캐시 적립 가능한 계약 목록 */}
            {member?.member_type === '개인' && eligibleContracts.length > 0 && (
              <>
                <div className="tourG_mat04 tourG_mab04 tour2023_title10">무사고캐시 적립 가능한 계약</div>
                <div className="tourG_mab05" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="tour2023_ListB_mobile" border={1} cellSpacing={0} style={{ minWidth: '600px' }}>
                    <caption></caption>
                    <colgroup>
                      <col width="20%" />
                      <col width="20%" />
                      <col width="15%" />
                      <col width="15%" />
                      <col width="30%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="sName tour2023_ListB_bg">계약번호</td>
                        <td className="sName tour2023_ListB_bg">보험종목</td>
                        <td className="sName tour2023_ListB_bg">보험료</td>
                        <td className="sName tour2023_ListB_bg">적립금액</td>
                        <td className="sName tour2023_ListB_bg">적립</td>
                      </tr>
                      {eligibleContracts.map((contract) => {
                        const premium = contract.total_premium ? Math.floor(parseFloat(String(contract.total_premium))) : 0;
                        return (
                          <tr key={contract.id}>
                            <td style={{ fontSize: '12px' }}>{contract.contract_number}</td>
                            <td>{contract.insurance_type}</td>
                            <td>{premium > 0 ? premium.toLocaleString() + '원' : '-'}</td>
                            <td style={{ color: '#1b37e1', fontWeight: '600' }}>
                              {contract.eligibleCashAmount.toLocaleString()}원
                            </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleAccumulateCash(contract.id)}
                              disabled={isAccumulating === contract.id}
                              className="tour2023_btn06"
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                minWidth: '60px',
                                whiteSpace: 'nowrap',
                                opacity: isAccumulating === contract.id ? 0.6 : 1,
                                cursor: isAccumulating === contract.id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {isAccumulating === contract.id ? '적립 중...' : '적립하기'}
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="tourG_line05 tourG_mat11 tourG_mab10"></div>
              </>
            )}

            {/* 무사고캐시내역 조회 */}
            <div className="tourGuard_form_tt mag5 tourG_mab04 tourG_mat10">
              <label htmlFor="">무사고캐시내역 조회</label>
              <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                <span className="tourGuard_ps_box">
                  <select 
                    className="tourGuard_sel" 
                    id="cashYear"
                    value={cashInYear}
                    onChange={(e) => handleCashInYearChange(Number(e.target.value))}
                  >
                    <option value={1}>최근 1년이내</option>
                    <option value={2}>최근 2년이내</option>
                  </select>
                </span>
              </div>
            </div>

            {/* 무사고캐시 적립 및 사용내역 제목 */}
            <div className="tourG_mat04 tourG_mab04 tour2023_title10">무사고캐시 적립 및 사용내역</div>

            {/* 무사고캐시 내역 리스트 */}
            <div id="cashList" className="tourG_mab03">
              {cashList.length === 0 ? (
                <>
                  <p className="tour2023_title02">무사고캐시 내역</p>
                  <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                  <p className="tour2023_mypageBox">
                    <span className="tour2023_title14">무사고캐시 적립 내역이 없습니다.</span>
                  </p>
                </>
              ) : (
                <table className="tour2023_ListB_mobile" border={1} cellSpacing={0}>
                  <caption></caption>
                  <colgroup>
                    <col width="22%" />
                    <col width="28%" />
                    <col width="25%" />
                    <col width="25%" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="sName tour2023_ListB_bg">일자</td>
                      <td className="sName tour2023_ListB_bg">내역</td>
                      <td className="sName tour2023_ListB_bg">캐시</td>
                      <td className="sName tour2023_ListB_bg">잔여캐시</td>
                    </tr>
                    {cashList.map((cash) => {
                      const amount = Math.floor((Math.abs(cash.amount) || 0) / 10) * 10;
                      const isPositive = cash.type === '충전';
                      const formatCashDate = (dateStr: string) => {
                        if (!dateStr) return '-';
                        const date = new Date(dateStr);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}.${month}.${day}`;
                      };

                      return (
                        <tr 
                          key={cash.id}
                          onClick={() => {
                            setSelectedCashDetail(cash);
                            setShowCashDetailModal(true);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontSize: '11px' }}>{formatCashDate(cash.created_at)}</td>
                          <td style={{ fontSize: '11px', textAlign: 'left', paddingLeft: '8px' }}>
                            {cash.reason || '-'}
                          </td>
                          <td style={{ 
                            color: isPositive ? '#1b37e1' : '#ff4444', 
                            fontWeight: '600',
                            fontSize: '11px'
                          }}>
                            {isPositive ? '+' : '-'}
                            {amount.toLocaleString()}원
                          </td>
                          <td style={{ fontSize: '11px' }}>
                            {cash.balance ? cash.balance.toLocaleString() + '원' : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* 안내 문구 */}
            <div className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mab04 tourG_mat14" style={{ marginTop: 20 }}>
              <ul className="tourGuard_inline tour2023_blue">
                <li className="tourGuard_inline_t01">※</li>
                <li className="tourGuard_inline_t02">무사고캐시의 적립가능 기간은 보험기간 종료 후 1년입니다.</li>
              </ul>
              <ul className="tourGuard_inline tour2023_blue">
                <li className="tourGuard_inline_t01">※</li>
                <li className="tourGuard_inline_t02">무사고캐시 적립가능 보험상품은 해외여행보험, 국내여행보험입니다.</li>
              </ul>
              <ul className="tourGuard_inline tour2023_blue">
                <li className="tourGuard_inline_t01">※</li>
                <li className="tourGuard_inline_t02">무사고캐시는 개인가입자에 한해 적립하실 수 있습니다. (법인/단체 제외)</li>
              </ul>
            </div>
          </>
        )}

        {/* 마일리지 내역 탭 내용 */}
        {activeTab === 'mileage' && (
          <>
            <div className="tour2023_mileageTop_menu" style={{ marginTop: 30 }}>
              <div className="tour2023_txt04">
                보유 마일리지: <span className="tour2023_blue">{mileageInfo.totalMileage.toLocaleString()}</span>P
              </div>
              <button 
                className="tour2023_btn06" 
                onClick={() => setShowGiftCardModal(true)}
                style={{ marginTop: 10, width: '100%' }}
              >
                문화상품권 전환신청
              </button>
            </div>

            {/* 마일리지 조회 기간 */}
            <div className="tourGuard_form_tt mag5 tourG_mab04 tourG_mat10">
              <label htmlFor="">마일리지내역 조회</label>
              <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                <span className="tourGuard_ps_box">
                  <select 
                    className="tourGuard_sel" 
                    id="mileageYear"
                    value={mileageInYear}
                    onChange={(e) => setMileageInYear(Number(e.target.value))}
                  >
                    <option value={1}>최근 1년이내</option>
                    <option value={2}>최근 2년이내</option>
                  </select>
                </span>
              </div>
            </div>

            {/* 마일리지 리스트 */}
            <div className="tourG_mat10">
              {mileageList.length === 0 ? (
                <>
                  <p className="tour2023_title02">마일리지 내역</p>
                  <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                  <p className="tour2023_mypageBox">
                    <span className="tour2023_title14">마일리지 내역이 없습니다.</span>
                  </p>
                </>
              ) : (
                <>
                  {(() => {
                    const formatMileageDate = (dateStr: string) => {
                      if (!dateStr) return '-';
                      const date = new Date(dateStr);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}.${month}.${day}`;
                    };

                    return mileageList.map((item, index) => (
                      <div key={item.id}>
                        {index === 0 && (
                          <p className="tour2023_title02">마일리지 내역</p>
                        )}
                        
                        <div className="tourG_line05 tourG_mat07 tourG_mab01"></div>
                        <ul className="tour2023_mileList_Wrap">
                          <li className="tour2023_mileList">
                            <span className="tour2023_mileList_txt01">
                              {formatMileageDate(item.created_at)}
                            </span>
                            <span 
                              className="tour2023_mileList_txt02"
                              style={{
                                color: item.type === '적립' ? '#1b37e1' : '#ff4444'
                              }}
                            >
                              {item.type === '적립' ? '+' : '-'}{Math.abs(item.amount).toLocaleString()}P
                            </span>
                          </li>
                          <li className="tour2023_mileList">
                            <span className="tour2023_mileList_txt03">
                              {item.reason || '-'}
                              {item.reason_detail && (
                                <><br />{item.reason_detail}</>
                              )}
                            </span>
                          </li>
                        </ul>
                        <div className="tourG_line05 tourG_mat09 tourG_mab04"></div>
                      </div>
                    ));
                  })()}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 심의번호 */}
      <div className="bgcolor_white prow_01 ptb20 essential_Wrap" style={{ textAlign: 'center' }}>
        <span className="tour2023_txt02 tour2023_grey">
          ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
          준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
        </span>
      </div>
    </>
  );

  return (
    <div id="isbwrapper">
      {/* 헤더 */}
      <Header isMobile={true} />

      {/* 로그인 상태에 따라 다른 화면 렌더링 */}
      {isLoggedIn ? renderLoggedInView() : renderNonLoggedInView()}

      {/* 푸터 */}
      <Footer isMobile={true} />

      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />

      {/* 서비스 전체보기 모달 */}
      <ServiceModal 
        isOpen={showServiceModal} 
        onClose={() => setShowServiceModal(false)} 
      />

      {/* 문화상품권 전환신청 모달 */}
      {isLoggedIn && member && (
        <GiftCardExchangeModal
          isOpen={showGiftCardModal}
          onClose={() => setShowGiftCardModal(false)}
          availableMileage={mileageInfo.totalMileage}
          memberId={member.id}
          onSuccess={async () => {
            await Promise.all([
              getMileageInfo(),
              getMileageList()
            ]);
          }}
        />
      )}
      
      {/* 무사고캐시 상세 모달 */}
      {showCashDetailModal && selectedCashDetail && (
        <div 
          className="tour2023_guide_Wrap" 
          style={{ display: 'block' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCashDetailModal(false);
            }
          }}
        >
          <div className="tour2023_guide_Layer">
            <div className="tour2023_guide_Box prow_02">
              <div className="tour2023_guide_txt01">무사고캐시 상세내역</div>
              <div className="tour2023_guide_txt02" style={{ textAlign: 'left', padding: '20px 0' }}>
                {(() => {
                  const amount = Math.floor((Math.abs(selectedCashDetail.amount) || 0) / 10) * 10;
                  const isPositive = selectedCashDetail.type === '충전';
                  const expireDate = (() => {
                    if (!selectedCashDetail.created_at) return '-';
                    const date = new Date(selectedCashDetail.created_at);
                    date.setFullYear(date.getFullYear() + 1);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}.${month}.${day}`;
                  })();

                  const formatCashDate = (dateStr: string) => {
                    if (!dateStr) return '-';
                    const date = new Date(dateStr);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hour = String(date.getHours()).padStart(2, '0');
                    const minute = String(date.getMinutes()).padStart(2, '0');
                    return `${year}.${month}.${day} ${hour}:${minute}`;
                  };

                  return (
                    <div style={{ lineHeight: '1.8' }}>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>일자:</strong>
                        <span>{formatCashDate(selectedCashDetail.created_at)}</span>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>유형:</strong>
                        <span>{selectedCashDetail.type}</span>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>금액:</strong>
                        <span style={{ 
                          color: isPositive ? '#1b37e1' : '#ff4444', 
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {isPositive ? '+' : '-'}{amount.toLocaleString()}원
                        </span>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>잔여캐시:</strong>
                        <span style={{ fontWeight: '600' }}>
                          {selectedCashDetail.balance ? selectedCashDetail.balance.toLocaleString() + '원' : '-'}
                        </span>
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>사유:</strong>
                        <span>{selectedCashDetail.reason || '-'}</span>
                      </div>
                      {selectedCashDetail.reason_detail && (
                        <div style={{ marginBottom: '15px' }}>
                          <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>상세사유:</strong>
                          <span>{selectedCashDetail.reason_detail}</span>
                        </div>
                      )}
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>만료일자:</strong>
                        <span>{expireDate}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                <a 
                  href="javascript:void(0);" 
                  className="btn_b tour2023_btn15_gray"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCashDetailModal(false);
                  }}
                >
                  닫기
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 소멸예정 캐시 모달 */}
      {showExpireCashModal && (
        <div 
          className="tour2023_guide_Wrap" 
          style={{ display: 'block' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExpireCashModal(false);
            }
          }}
        >
          <div className="tour2023_guide_Layer">
            <div className="tour2023_guide_Box prow_02">
              <div className="tour2023_guide_txt01">소멸예정 캐시</div>
              <div className="tour2023_guide_txt02" style={{ textAlign: 'left', padding: '20px 0' }}>
                {cashInfo.expireCash > 0 ? (
                  <div style={{ lineHeight: '1.8' }}>
                    <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                      총 소멸예정 캐시: <strong style={{ color: '#ff4444', fontSize: '16px' }}>{cashInfo.expireCash.toLocaleString()}원</strong>
                    </div>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                      {expireCashList.map((cash, index) => {
                        const formatCashDate = (dateStr: string) => {
                          if (!dateStr) return '-';
                          const date = new Date(dateStr);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const hour = String(date.getHours()).padStart(2, '0');
                          const minute = String(date.getMinutes()).padStart(2, '0');
                          return `${year}.${month}.${day} ${hour}:${minute}`;
                        };

                        const formatExpireDate = (dateStr: string) => {
                          if (!dateStr) return '-';
                          const date = new Date(dateStr);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}.${month}.${day}`;
                        };

                        const amount = Math.floor((Math.abs(cash.amount) || 0) / 10) * 10;
                        const expireDate = cash.expire_date ? formatExpireDate(cash.expire_date) : '-';

                        return (
                          <div key={cash.id || index} style={{ 
                            marginBottom: '20px', 
                            paddingBottom: '20px',
                            borderBottom: index < expireCashList.length - 1 ? '1px solid #f0f0f0' : 'none'
                          }}>
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>적립일:</strong>
                              <span>{formatCashDate(cash.created_at)}</span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>금액:</strong>
                              <span style={{ color: '#1b37e1', fontWeight: '600', fontSize: '16px' }}>
                                +{amount.toLocaleString()}원
                              </span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>만료일:</strong>
                              <span style={{ color: '#ff4444', fontWeight: '600' }}>{expireDate}</span>
                            </div>
                            {cash.reason && (
                              <div style={{ marginBottom: '10px' }}>
                                <strong style={{ display: 'inline-block', width: '90px', color: '#666' }}>사유:</strong>
                                <span>{cash.reason}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                    소멸예정 캐시가 없습니다.
                  </div>
                )}
              </div>
              <div>
                <a 
                  href="javascript:void(0);" 
                  className="btn_b tour2023_btn15_gray"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowExpireCashModal(false);
                  }}
                >
                  닫기
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
