// 공통 타입 정의
export type PlanType =
  | '실속플랜'
  | '표준플랜'
  | '고급플랜'
  | '어린이플랜'
  | '어르신플랜1'
  | '어르신플랜1(실속)'
  | '어르신플랜1(표준)'
  | '어르신플랜2'
  | '워킹홀리데이실속플랜'
  | '워킹홀리데이표준플랜'
  | '워킹홀리데이(유로화플랜)';
export type Gender = '남자' | '여자';
export type PaymentMethod = '나이스페이먼츠' | '네이버페이' | '카카오페이' | '기타결제';
export type PaymentSubMethod = '무통장입금' | '가상계좌' | '수기카드';

export interface PlanInfo {
  type: PlanType;
  premium: number;
  coverages: {
    label: string;
    amount: string;
  }[];
}

export interface Participant {
  id: number;
  name: string;
  englishName?: string; // 영문 이름
  nationality: '내국인' | '외국인';
  birthDate: string;
  gender: '남자' | '여자';
  residentNumber?: string; // 주민번호 또는 외국인등록번호
  email1: string;
  email2: string;
  customEmail?: string; // 직접입력 이메일 도메인
  phone: string;
  isVerified: boolean;
  premium?: number;
  planType?: string;
}

/** 전체 이메일 문자열(email1 한 필드 입력 또는 기존 email1+도메인 분리 형식 모두 지원). */
export function getParticipantEmail(p: Participant | undefined): string {
  if (!p) return '';
  const local = (p.email1 || '').trim();
  if (!local) return '';
  if (local.includes('@')) return local;
  const domain =
    p.email2 === '직접입력'
      ? (p.customEmail || '').trim()
      : (p.email2 || '').trim();
  return domain ? `${local}@${domain}` : '';
}

/** 이메일 입력란 표시용(도메인 입력 전 local-only 문자열도 유지). */
export function getParticipantEmailInputValue(p: Participant | undefined): string {
  if (!p) return '';
  const e1 = p.email1 ?? '';
  if (e1.includes('@')) return e1;
  const domain =
    p.email2 === '직접입력'
      ? (p.customEmail || '').trim()
      : (p.email2 || '').trim();
  if (domain) return `${e1.trim()}@${domain}`;
  return e1;
}

export interface CalculatedPremium {
  id: number;
  name: string;
  gender: string;
  birthDate: string;
  planType: string;
  premium: number;
}

export interface CalculatedPremiums {
  participants: CalculatedPremium[];
  totalPremium: number;
}

export interface TravelInsuranceFormData {
  // STEP 1
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  birthDate: string;
  gender: 'male' | 'female';
  hasMedicalExpense: boolean;
  selectedPlan: PlanType | null;
  planInfo: { 실속플랜: PlanInfo; 표준플랜: PlanInfo } | null;
  participantCount: 1 | 2;
  
  // STEP 2
  participants: Participant[];
  calculatedPremiums: CalculatedPremiums | null;
  
  // STEP 2-1
  hasDangerousActivity: boolean | null;
  travelPurpose: string;
  
  // STEP 3
  contractConfirmed: boolean;
  normalPremium: number;
  receiptPremium: number;
  useAccidentFreeCash: number;
  accidentFreeCash: number;
  
  // Payment
  paymentMethod: PaymentMethod | null;
  paymentSubMethod: PaymentSubMethod | null;
  depositBank: string;
  depositorName: string;
  expectedDepositYear: number;
  expectedDepositMonth: number;
  expectedDepositDay: number;
  cardType: '본인카드' | '기타카드';
  cardCategory: string;
  cardNumber1: string;
  cardNumber2: string;
  cardNumber3: string;
  cardNumber4: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardholderName: string;
  cardholderResidentNumber: string;
  approvalYear: number;
  approvalMonth: number;
  approvalDay: number;
  isSamePremium: boolean;
}

