/**
 * 행사보험 견적신청 6단계 마법사 - 상수 정의
 * (기준: 웹_견적신청_프로세스.html 참조 디자인)
 */
import type {
  BaseLimits,
  OptCovKey,
  OptLimitsMap,
  RiskKey,
  WizardState,
} from './types';

/** 00시~23시 (DB DATETIME 저장을 위해 0~23 범위만 허용) */
export const TIMES: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export const EVENT_FORM_TYPES: Array<{ key: string; desc: string }> = [
  { key: '단일행사', desc: '정해진 기간에 한 번 열리는 행사' },
  { key: '반복행사', desc: '같은 행사를 여러 차례 개최' },
  { key: '상시행사', desc: '상설 운영·장기간 지속' },
];

export const CATEGORIES: string[] = [
  '축제·지역행사',
  '공연·콘서트',
  '전시·박람회',
  '학술·회의',
  '체육·스포츠',
  '기업·판촉행사',
  '문화·전통·종교행사',
  '기타',
];

/** 위험요소: [키, 라벨, 도움말] */
export const RISK_DEFS: Array<{ key: RiskKey; label: string; desc: string; code: string }> = [
  {
    key: '체육활동',
    label: '운동경기·체육활동',
    desc: '달리기, 축구, 농구, 야구, 자전거대회, 줄다리기, 격투기, 체육대회처럼 참가자가 직접 운동하는 프로그램을 말합니다.',
    code: 'AT',
  },
  {
    key: '불꽃놀이',
    label: '불꽃놀이',
    desc: '폭죽이나 불꽃쇼처럼 화약을 쓰는 연출이 있는 경우를 말합니다.',
    code: 'FW',
  },
  {
    key: '수상위험',
    label: '수상위험',
    desc: '강, 바다, 수영장, 워터파크 등 물에서 진행하거나 물 근처에서 하는 활동(래프팅·수상레저·선상행사 등)이 있는 경우예요.',
    code: 'WR',
  },
  {
    key: '놀이시설',
    label: '놀이시설(에어바운스)',
    desc: '에어바운스, 트램펄린, 미끄럼틀처럼 참가자가 타고 노는 놀이기구가 있는 행사인 경우를 말합니다.',
    code: 'PF',
  },
  {
    key: '드론',
    label: '드론',
    desc: '드론으로 촬영하거나 드론쇼·비행을 하는 경우예요.',
    code: 'DR',
  },
  {
    key: '이동행진',
    label: '장소 이동·행진·퍼레이드',
    desc: '한 곳에 머물지 않고 정해진 길을 따라 이동하는 경우를 말합니다(행진·마라톤·퍼레이드·성화봉송 등).',
    code: 'MV',
  },
];

export const PLAY_FACILITY_TYPES: string[] = [
  '에어바운스',
  '트램펄린',
  '미끄럼틀(슬라이드)',
  '볼풀장',
  '회전목마',
  '미니 바이킹',
  '미니기차',
  '범퍼카',
  '클라이밍(암벽)',
  '기타(직접입력)',
];

/** 담보 유형별 기본 한도 (직접입력 시엔 D.limits 사용) */
export const PLANS: Record<
  '1형' | '2형',
  BaseLimits & { 치료1인: string; 치료사고: string }
> = {
  '1형': {
    대인1인당: '5,000만원',
    대인1사고당: '1억원',
    대물: '1,000만원',
    자기부담금: '10만원',
    치료1인: '100만원',
    치료사고: '500만원',
  },
  '2형': {
    대인1인당: '1억원',
    대인1사고당: '2억원',
    대물: '3,000만원',
    자기부담금: '10만원',
    치료1인: '100만원',
    치료사고: '1,000만원',
  },
};

export const PLAN_DESC: Record<'1형' | '2형', string> = {
  '1형': '소규모·저위험 행사에 적합한 기본 한도',
  '2형': '가장 많이 선택 · 일반 행사에 권장하는 한도',
};

/** 가입금액 옵션 구간 */
export const AMT: Record<string, string[]> = {
  대인: [
    '1,000만원', '2,000만원', '3,000만원', '5,000만원', '1억원', '1억5,000만원',
    '2억원', '3억원', '4억원', '5억원', '10억원', '15억원', '20억원',
  ],
  대물: [
    '200만원', '500만원', '1,000만원', '2,000만원', '3,000만원', '5,000만원', '1억원',
    '1억5,000만원', '2억원', '3억원', '4억원', '5억원', '10억원', '15억원', '20억원',
  ],
  자부: ['10만원', '20만원', '30만원', '50만원'],
  치료1인: ['50만원', '100만원', '200만원', '300만원', '500만원'],
  치료사고: ['100만원', '300만원', '500만원', '1,000만원', '2,000만원', '4,000만원', '5,000만원'],
  음식: ['1,000만원', '3,000만원', '5,000만원', '1억원'],
  음식자부: ['30만원', '50만원', '100만원'],
  행사시설: ['1,000만원', '2,000만원', '3,000만원', '5,000만원', '1억원', '2억원', '3억원', '4억원', '5억원'],
  임차: ['1,000만원', '2,000만원', '3,000만원', '5,000만원', '1억원', '2억원', '3억원', '4억원', '5억원'],
  수탁: ['500만원', '1,000만원', '2,000만원'],
};

/** 필수 담보 설명 */
export const BASECOV: Array<{ k: string; tip: string }> = [
  {
    k: '대인배상',
    tip: '행사 중 참가자·관람객 등 타인이 다치거나 사망했을 때, 주최자가 법률상 부담해야 하는 배상책임을 보상합니다. (배상책임보험의 핵심 담보)',
  },
  {
    k: '대물배상',
    tip: '행사 중 타인의 재물(차량·건물·주변 시설물 등)을 파손했을 때 주최자가 법률상 부담하는 배상책임을 보상합니다.',
  },
  {
    k: '자기부담금',
    tip: '사고 1건당 가입자가 먼저 부담하는 금액입니다. 이 금액을 초과하는 손해부터 보험금이 지급됩니다. 자기부담금이 낮을수록 보험료는 올라갑니다.',
  },
];

/** 선택 특약 (행별 가입금액 구간 포함) */
export const OPTROWS: Array<{
  k: OptCovKey;
  adv: boolean;
  cols: Array<[string, string]>;
  ded?: string;
  tip: string;
}> = [
  {
    k: '참가자치료비',
    adv: false,
    cols: [
      ['1인당', '치료1인'],
      ['1사고당', '치료사고'],
    ],
    tip: '행사 중 참가자가 다쳤을 때, 주최자의 잘못(과실)이 있었는지 따지지 않고 피해자의 치료비를 보상해 줍니다. 기본 담보인 대인배상은 「주최자에게 법적 책임이 있을 때」만 지급되지만, 참가자치료비는 과실을 묻지 않고 지급되므로 책임 소재를 다투지 않고 빠르게 처리할 수 있어 참가자 보호와 민원 예방에 효과적입니다.',
  },
  {
    k: '음식물배상',
    adv: false,
    cols: [['1사고당', '음식']],
    ded: '음식자부',
    tip: '행사장에서 제공·판매하거나 무료로 시식·급식한 음식물 때문에 참가자에게 신체 피해가 발생했을 때, 주최자가 부담하는 배상책임을 보상합니다. 푸드트럭·부스 판매, 급식, 시음·시식 행사가 있는 경우 권장됩니다.',
  },
  {
    k: '행사시설 설치·해체',
    adv: true,
    cols: [['1사고당', '행사시설']],
    tip: '무대·천막·부스·조형물 등을 설치하거나 철거·해체하는 작업 도중 발생한 대인·대물 사고에 대한 배상책임을 보상합니다.',
  },
  {
    k: '임차시설',
    adv: true,
    cols: [['1사고당', '임차']],
    tip: '행사를 위해 빌려 사용하는 시설(체육관·공연장·건물·공간 등)을 사용 중 훼손했을 때, 시설 소유자에게 부담하는 배상책임을 보상합니다.',
  },
  {
    k: '수탁물',
    adv: true,
    cols: [['1사고당', '수탁']],
    tip: '참가자·업체로부터 보관을 맡아 관리하는 물건(물품보관소 위탁물 등)이 관리 중 파손·분실됐을 때의 배상책임을 보상합니다.',
  },
];

export const EMAIL_DOMAINS: string[] = [
  'naver.com',
  'gmail.com',
  'daum.net',
  'hanmail.net',
  'nate.com',
  'hotmail.com',
  'yahoo.co.kr',
];

export function createInitialOptLimits(): OptLimitsMap {
  return {
    참가자치료비: { '1인당': '100만원', '1사고당': '1,000만원' },
    음식물배상: { '1사고당': '3,000만원', 자기부담금: '30만원' },
    '행사시설 설치·해체': { '1사고당': '1,000만원' },
    임차시설: { '1사고당': '1,000만원' },
    수탁물: { '1사고당': '500만원' },
  };
}

export function createInitialState(): WizardState {
  return {
    type: '',

    category: '',
    evName: '',
    venue: '실외',
    locType: '단일',
    region: '',
    places: ['', ''],
    routeFrom: '',
    routeVia: '',
    routeTo: '',
    moveNote: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    people: '',
    performer: false,

    riskFlags: {
      체육활동: false,
      불꽃놀이: false,
      수상위험: false,
      놀이시설: false,
      드론: false,
      이동행진: false,
    },
    riskDetail: {
      ws: { type: '', area: '', guard: '', gear: '', note: '' },
      pl: { types: [], typeEtc: '', cnt: '', mgr: '', note: '' },
      mv: { mode: '', dist: '', permit: '', staff: '', note: '' },
    },
    amusementPhotos: [],

    plan: '2형',
    planTouched: false,
    limits: {
      대인1인당: '1억원',
      대인1사고당: '2억원',
      대물: '3,000만원',
      자기부담금: '10만원',
    },
    optCov: {
      참가자치료비: true,
      음식물배상: false,
      '행사시설 설치·해체': false,
      임차시설: false,
      수탁물: false,
    },
    optLimits: createInitialOptLimits(),

    org: '',
    bizNo: '',
    contact: '',
    dept: '',
    tel: '',
    phone: '',
    email: '',
    budgetType: '적정',
    budgetAmt: '',
    licenseFile: null,
    overviewFile: null,
    cPrivacy: false,
    cMarketing: false,

    contractNumber: '',
  };
}

export const STEP_LABELS: string[] = ['행사유형', '행사정보', '위험요소', '담보선택', '신청자', '완료'];
