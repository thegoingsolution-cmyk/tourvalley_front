// 공통 타입 정의
export type PlanType = '실속플랜' | '표준플랜' | '고급플랜' | '어린이플랜' | '어르신플랜1' | '어르신플랜2';
export type Gender = '남자' | '여자';
export type PaymentMethod = '나이스페이먼츠' | '네이버페이' | '카카오페이' | '기타결제';
export type PaymentSubMethod = '무통장입금' | '수기카드';

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
  email1: string;
  email2: string;
  customEmail?: string; // 직접입력 이메일 도메인
  phone: string;
  isVerified: boolean;
  premium?: number;
  planType?: string;
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

