/**
 * 행사보험 견적신청 6단계 마법사 - 상태 타입 정의
 */

export type Device = 'PC' | '모바일';

export type EventFormType = '단일행사' | '반복행사' | '상시행사';

export type VenueType = '실외' | '실내' | '혼합';

export type LocationType = '단일' | '복수';

/** 담보 유형 카드 (내부 상태값). 제출 시 '직접' -> '직접입력' 으로 매핑 */
export type PlanKey = '1형' | '2형' | '직접';

export type BudgetType = '정액' | '적정';

export interface WaterRiskDetail {
  type: string;
  area: string;
  guard: string;
  gear: string;
  note: string;
}

export interface PlayFacilityDetail {
  types: string[];
  typeEtc: string;
  cnt: string;
  mgr: string;
  note: string;
}

export interface MoveDetail {
  mode: string;
  dist: string;
  permit: string;
  staff: string;
  note: string;
}

export interface RiskDetail {
  ws: WaterRiskDetail;
  pl: PlayFacilityDetail;
  mv: MoveDetail;
}

/** 위험요소 유무 플래그 키 */
export type RiskKey = '체육활동' | '불꽃놀이' | '수상위험' | '놀이시설' | '드론' | '이동행진';

export type RiskFlags = Record<RiskKey, boolean>;

/** 기본(필수) 담보 한도 필드 */
export type BaseLimitField = '대인1인당' | '대인1사고당' | '대물' | '자기부담금';

export type BaseLimits = Record<BaseLimitField, string>;

/** 선택 특약 키 */
export type OptCovKey = '참가자치료비' | '음식물배상' | '행사시설 설치·해체' | '임차시설' | '수탁물';

export type OptCovMap = Record<OptCovKey, boolean>;

/** 특약별 한도 컬럼 (예: '1인당','1사고당','자기부담금') → 라벨 문자열 */
export type OptLimitCols = Record<string, string>;

export type OptLimitsMap = Record<OptCovKey, OptLimitCols>;

export interface WizardState {
  /** step1 */
  type: EventFormType | '';

  /** step2 */
  category: string;
  evName: string;
  venue: VenueType;
  locType: LocationType;
  region: string;
  routeFrom: string;
  routeVia: string;
  routeTo: string;
  moveNote: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  people: string;
  performer: boolean | null;

  /** step3 */
  riskFlags: RiskFlags;
  riskDetail: RiskDetail;
  amusementPhotos: File[];

  /** step4 */
  plan: PlanKey;
  planTouched: boolean;
  limits: BaseLimits;
  optCov: OptCovMap;
  optLimits: OptLimitsMap;

  /** step5 */
  org: string;
  bizNo: string;
  contact: string;
  dept: string;
  tel: string;
  phone: string;
  email: string;
  budgetType: BudgetType;
  budgetAmt: string;
  licenseFile: File | null;
  overviewFile: File | null;
  cPrivacy: boolean;
  cMarketing: boolean;

  /** step6 (제출 후 채워짐) */
  contractNumber: string;
}

export interface WizardProps {
  device: Device;
}

export type ErrorMap = Record<string, boolean>;
