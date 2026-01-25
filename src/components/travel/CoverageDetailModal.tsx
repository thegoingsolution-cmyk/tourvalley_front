'use client';

import React from 'react';
import { PlanType } from './types';
import './CoverageDetailModal.css';

interface CoverageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: PlanType;
  insuranceType?: string; // 기본값: '국내여행보험'
  isMedicalExpense?: boolean; // 실손의료비 포함 여부 (기본값: true, 국내/해외여행보험용)
  currencyPlan?: '원화플랜' | '외화플랜'; // 원화플랜/외화플랜 구분 (유학/어학연수, 해외출장/주재원/교환교수용)
}

// 보장 상세 데이터 타입 정의
interface CoverageItem {
  label: string;
  amount: string;
  note?: string;
}

interface CoverageSection {
  title: string;
  helpUrl: string;
  items: CoverageItem[];
}

interface PlanCoverage {
  planName: string;
  sections: CoverageSection[];
}

type InsuranceType = '국내여행보험' | '해외여행보험' | '유학/어학연수' | '워킹홀리데이' | '해외출장/주재원/교환교수';
type PlanTypeKey = '실속플랜' | '표준플랜' | '고급플랜';
type MedicalExpenseType = '실손' | '비실손';
type CurrencyPlanType = '원화플랜' | '외화플랜';

// 보장 상세 데이터 구조
// 국내여행보험과 해외여행보험: 실손/비실손 구분
// 유학/어학연수와 해외출장/주재원/교환교수: 원화플랜/외화플랜 구분
// 워킹홀리데이: 구분 없음
type CoverageDataValue = 
  | PlanCoverage 
  | Record<MedicalExpenseType, PlanCoverage>
  | Record<CurrencyPlanType, PlanCoverage>;

const coverageDataMap: Record<InsuranceType, Record<PlanTypeKey, CoverageDataValue>> = {
  '국내여행보험': {
    '실속플랜': {
      '실손': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G5',
            items: [
              { label: '상해사망', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '상해입원의료비', amount: '1,000만원' },
              { label: '상해통원의료비', amount: '10만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G2',
            items: [
              { label: '해외의료비', amount: '-' },
              { label: '입원(급여/비급여)', amount: '1,000만원' },
              { label: '통원(급여/비급여)', amount: '10만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '1,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G6',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '50만원', note: '(1개 20만원한도, 이동통신단말기 보상제외)' },
              { label: '골절(치아파절제외)진단비', amount: '10만원' },
              { label: '화상진단비', amount: '10만원' },
              { label: '배상책임(본인부담금 1만원)', amount: '1,000만원' },
              { label: '상해입원일당', amount: '2만원', note: '(4일이상 30일한도)' },
              { label: '상해응급실내원(응급)의료비', amount: '3만원' },
              { label: '상해응급실내원(비응급)의료비', amount: '-' },
              { label: '골절수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '상해수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '깁스치료비', amount: '20만원', note: '(동일사고 또는 질병 1회한)' },
            ],
          },
        ],
      },
      '비실손': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G5',
            items: [
              { label: '상해사망', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G2',
            items: [
              { label: '해외의료비', amount: '-' },
              { label: '입원(급여/비급여)', amount: '-' },
              { label: '통원(급여/비급여)', amount: '-' },
              { label: '사망 및 80%이상 고도후유장해', amount: '1,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '-' },
              { label: '주사치료', amount: '-' },
              { label: '자기공명진단(MRA/MRI)', amount: '-' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G6',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '50만원', note: '(1개 20만원한도, 이동통신단말기 보상제외)' },
              { label: '골절(치아파절제외)진단비', amount: '10만원' },
              { label: '화상진단비', amount: '10만원' },
              { label: '배상책임(본인부담금 1만원)', amount: '1,000만원' },
              { label: '상해입원일당', amount: '2만원', note: '(4일이상 30일한도)' },
              { label: '상해응급실내원(응급)의료비', amount: '3만원' },
              { label: '상해응급실내원(비응급)의료비', amount: '-' },
              { label: '골절수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '상해수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '깁스치료비', amount: '20만원', note: '(동일사고 또는 질병 1회한)' },
            ],
          },
        ],
      },
    },
    '표준플랜': {
      '실손': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G1',
            items: [
              { label: '상해사망', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '상해입원의료비', amount: '1,000만원' },
              { label: '상해통원의료비', amount: '10만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G2',
            items: [
              { label: '해외의료비', amount: '-' },
              { label: '입원(급여/비급여)', amount: '1,000만원' },
              { label: '통원(급여/비급여)', amount: '10만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '1,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '50만원', note: '(1개 20만원한도, 이동통신단말기 보상제외)' },
              { label: '골절(치아파절제외)진단비', amount: '10만원' },
              { label: '화상진단비', amount: '10만원' },
              { label: '배상책임(본인부담금 1만원)', amount: '1,000만원' },
              { label: '상해입원일당', amount: '-', note: '(4일이상 30일한도)' },
              { label: '상해응급실내원(응급)의료비', amount: '-' },
              { label: '골절수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '상해수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '깁스치료비', amount: '20만원', note: '(동일사고 또는 질병 1회한)' },
            ],
          },
        ],
      },
      '비실손': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G1',
            items: [
              { label: '상해사망', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '상해입원의료비', amount: '1,000만원' },
              { label: '상해통원의료비', amount: '10만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G2',
            items: [
              { label: '해외의료비', amount: '-' },
              { label: '입원(급여/비급여)', amount: '-' },
              { label: '통원(급여/비급여)', amount: '-' },
              { label: '사망 및 80%이상 고도후유장해', amount: '1,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=DS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '50만원', note: '(1개 20만원한도, 이동통신단말기 보상제외)' },
              { label: '골절(치아파절제외)진단비', amount: '10만원' },
              { label: '화상진단비', amount: '10만원' },
              { label: '배상책임(본인부담금 1만원)', amount: '500만원' },
              { label: '상해입원일당', amount: '-', note: '(4일이상 30일한도)' },
              { label: '상해응급실내원(응급)의료비', amount: '-' },
              { label: '골절수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '상해수술비', amount: '20만원', note: '(동일사고 1회한)' },
              { label: '깁스치료비', amount: '20만원', note: '(동일사고 또는 질병 1회한)' },
            ],
          },
        ],
      },
    },
    '고급플랜': {
      '실손': {
        planName: '고급플랜',
        sections: [
          // TODO: 국내여행보험 고급플랜 실손 보장 내용을 여기에 입력하세요
        ],
      },
      '비실손': {
        planName: '고급플랜',
        sections: [
          // TODO: 국내여행보험 고급플랜 비실손 보장 내용을 여기에 입력하세요
        ],
      },
    },
  },
  '해외여행보험': {
    '실속플랜': {
      '실손': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G1',
            items: [
              { label: '해외의료비', amount: '2,000만원' },
              { label: '입원(급여/비급여)', amount: '3,000만원' },
              { label: '통원(급여/비급여)', amount: '15만원' },
              { label: '사망', amount: '1억원' },
              { label: '후유장해', amount: '-' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G2',
            items: [
              { label: '질병입원의료비', amount: '3,000만원' },
              { label: '질병통원의료비', amount: '15만원' },
              { label: '질병사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '50만원', note: '(1개 20만원 한도) (이동통신단말기 10만원 한도)' },
              { label: '배상책임(본인부담금 1만원)', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
              { label: '항공기납치', amount: '140만원' },
              { label: '특정전염병치료비', amount: '20만원' },
              { label: '중단사고발생 추가비용', amount: '50만원' },
              { label: '항공기 및 수화물지연에 따른 추가비용', amount: '10만원' },
              { label: '상해입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '질병입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '폭력상해피해 변호사선임비', amount: '1,000만원' },
              { label: '골절(치아파절제외)진단비당', amount: '20만원', note: '(동일사고당 1회한)' },
              { label: '인질구조비용 및 석방보석금', amount: '100만원' },
              { label: '출국항공기지연(2시간이상 4시간 미만)에 따른 추가비용', amount: '5만원' },
            ],
          },
        ],
      },
      '비실손': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G1',
            items: [
              { label: '해외의료비', amount: '2,000만원' },
              { label: '입원(급여/비급여)', amount: '-' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G2',
            items: [
              { label: '질병입원의료비', amount: '-' },
              { label: '질병통원의료비', amount: '-' },
              { label: '질병사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '-' },
              { label: '주사치료', amount: '-' },
              { label: '자기공명진단(MRA/MRI)', amount: '-' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '50만원', note: '(1개 20만원 한도) (이동통신단말기 10만원 한도)' },
              { label: '배상책임(본인부담금 1만원)', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
              { label: '항공기납치', amount: '140만원' },
              { label: '신용카드사용액 보장', amount: '1,000만원' },
              { label: '여권분실 후 재발급비용', amount: '6.7만원' },
              { label: '식중독입원일당', amount: '2만원' },
              { label: '특정전염병치료비', amount: '20만원' },
              { label: '중단사고발생 추가비용', amount: '50만원' },
              { label: '항공기 및 수화물지연에 따른 추가비용', amount: '30만원' },
              { label: '상해입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '질병입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '폭력상해피해 변호사선임비', amount: '1,000만원' },
              { label: '골절(치아파절제외)진단비당', amount: '20만원', note: '(동일사고당 1회한)' },
              { label: '인질구조비용 및 석방보석금', amount: '100만원' },
              { label: '출국항공기지연(2시간이상 4시간 미만)에 따른 추가비용', amount: '5만원' },
            ],
          },
        ],
      },
    },
    '표준플랜': {
      '실손': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G1',
            items: [
              { label: '해외의료비', amount: '5,000만원' },
              { label: '입원(급여/비급여)', amount: '3,000만원' },
              { label: '통원(급여/비급여)', amount: '15만원' },
              { label: '사망', amount: '2억원' },
              { label: '후유장해', amount: '-' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G2',
            items: [
              { label: '질병입원의료비', amount: '3,000만원' },
              { label: '질병통원의료비', amount: '15만원' },
              { label: '질병사망 및 80%이상 고도후유장해', amount: '3,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '100만원', note: '(1개 20만원 한도) (이동통신단말기 10만원 한도)' },
              { label: '배상책임(본인부담금 1만원)', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
              { label: '항공기납치', amount: '140만원' },
              { label: '특정전염병치료비', amount: '20만원' },
              { label: '중단사고발생 추가비용', amount: '100만원' },
              { label: '항공기 및 수화물지연에 따른 추가비용', amount: '50만원' },
              { label: '상해입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '질병입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '폭력상해피해 변호사선임비', amount: '1,000만원' },
              { label: '골절(치아파절제외)진단비당', amount: '20만원', note: '(동일사고당 1회한)' },
              { label: '인질구조비용 및 석방보석금', amount: '100만원' },
              { label: '출국항공기지연(2시간이상 4시간 미만)에 따른 추가비용', amount: '7만원' },
            ],
          },
        ],
      },
      '비실손': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G1',
            items: [
              { label: '해외의료비', amount: '5,000만원' },
              { label: '입원(급여/비급여)', amount: '-' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G2',
            items: [
              { label: '질병입원의료비', amount: '-' },
              { label: '질병통원의료비', amount: '-' },
              { label: '질병사망 및 80%이상 고도후유장해', amount: '3,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '-' },
              { label: '주사치료', amount: '-' },
              { label: '자기공명진단(MRA/MRI)', amount: '-' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '100만원', note: '(1개 20만원 한도) (이동통신단말기 10만원 한도)' },
              { label: '배상책임(본인부담금 1만원)', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
              { label: '항공기납치', amount: '140만원' },
              { label: '신용카드사용액 보장', amount: '1,000만원' },
              { label: '여권분실 후 재발급비용', amount: '6.7만원' },
              { label: '식중독입원일당', amount: '2만원' },
              { label: '특정전염병치료비', amount: '20만원' },
              { label: '중단사고발생 추가비용', amount: '100만원' },
              { label: '항공기 및 수화물지연에 따른 추가비용', amount: '50만원' },
              { label: '상해입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '질병입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '폭력상해피해 변호사선임비', amount: '1,000만원' },
              { label: '골절(치아파절제외)진단비당', amount: '20만원', note: '(동일사고당 1회한)' },
              { label: '인질구조비용 및 석방보석금', amount: '100만원' },
              { label: '출국항공기지연(2시간이상 4시간 미만)에 따른 추가비용', amount: '7만원' },
            ],
          },
        ],
      },
    },
    '고급플랜': {
      '실손': {
        planName: '고급플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G1',
            items: [
              { label: '해외의료비', amount: '1억원' },
              { label: '입원(급여/비급여)', amount: '5,000만원' },
              { label: '통원(급여/비급여)', amount: '20만원' },
              { label: '사망', amount: '3억원' },
              { label: '후유장해', amount: '-' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G2',
            items: [
              { label: '질병입원의료비', amount: '5,000만원' },
              { label: '질병통원의료비', amount: '20만원' },
              { label: '질병사망 및 80%이상 고도후유장해', amount: '3,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '150만원', note: '(1개 20만원 한도) (이동통신단말기 10만원 한도)' },
              { label: '배상책임(본인부담금 1만원)', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
              { label: '항공기납치', amount: '140만원' },
              { label: '특정전염병치료비', amount: '20만원' },
              { label: '중단사고발생 추가비용', amount: '100만원' },
              { label: '항공기 및 수화물지연에 따른 추가비용', amount: '80만원' },
              { label: '상해입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '질병입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '폭력상해피해 변호사선임비', amount: '1,000만원' },
              { label: '골절(치아파절제외)진단비당', amount: '20만원', note: '(동일사고당 1회한)' },
              { label: '인질구조비용 및 석방보석금', amount: '100만원' },
              { label: '출국항공기지연(2시간이상 4시간 미만)에 따른 추가비용', amount: '10만원' },
            ],
          },
        ],
      },
      '비실손': {
        planName: '고급플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G1',
            items: [
              { label: '해외의료비', amount: '1억원' },
              { label: '입원(급여/비급여)', amount: '-' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G2',
            items: [
              { label: '질병입원의료비', amount: '-' },
              { label: '질병통원의료비', amount: '-' },
              { label: '질병사망 및 80%이상 고도후유장해', amount: '3,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '-' },
              { label: '주사치료', amount: '-' },
              { label: '자기공명진단(MRA/MRI)', amount: '-' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FS&page_num=G4',
            items: [
              { label: '휴대품손해(본인부담금 1만원)', amount: '150만원', note: '(1개 20만원 한도) (이동통신단말기 10만원 한도)' },
              { label: '배상책임(본인부담금 1만원)', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
              { label: '항공기납치', amount: '140만원' },
              { label: '신용카드사용액 보장', amount: '1,000만원' },
              { label: '여권분실 후 재발급비용', amount: '6.7만원' },
              { label: '식중독입원일당', amount: '2만원' },
              { label: '특정전염병치료비', amount: '20만원' },
              { label: '중단사고발생 추가비용', amount: '100만원' },
              { label: '항공기 및 수화물지연에 따른 추가비용', amount: '80만원' },
              { label: '상해입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '질병입원일당', amount: '5만원', note: '(4일 이상 30일한도)' },
              { label: '폭력상해피해 변호사선임비', amount: '1,000만원' },
              { label: '골절(치아파절제외)진단비당', amount: '20만원', note: '(동일사고당 1회한)' },
              { label: '인질구조비용 및 석방보석금', amount: '100만원' },
              { label: '출국항공기지연(2시간이상 4시간 미만)에 따른 추가비용', amount: '10만원' },
            ],
          },
        ],
      },
    },
  },
  '유학/어학연수': {
    '실속플랜': {
      '원화플랜': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '2,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '2,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '2,000만원' },
            ],
          },
        ],
      },
      '외화플랜': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '20,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '20,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '20,000USD' },
            ],
          },
        ],
      },
    },
    '표준플랜': {
      '원화플랜': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '5,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '5,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
            ],
          },
        ],
      },
      '외화플랜': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '50,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '50,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '75,000USD' },
            ],
          },
        ],
      },
    },
    '고급플랜': {
      '원화플랜': {
        planName: '고급플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '2억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '1억원' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '20만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '1억원' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '20만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '5,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
            ],
          },
        ],
      },
      '외화플랜': {
        planName: '고급플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '2억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '100,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '20만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '100,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '20만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '5,000만원' },
              { label: '중대사고 구조송환비용', amount: '75,000USD' },
            ],
          },
        ],
      },
    },
  },
  '워킹홀리데이': {
    '실속플랜': {
      planName: '실속플랜',
      sections: [
        {
          title: '상해보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
          items: [
            { label: '상해사망후유장해', amount: '2,000만원' },
            { label: '상해후유장해', amount: '-' },
            { label: '해외의료비', amount: '2,000만원' },
            { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
            { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
          ],
        },
        {
          title: '질병보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
          items: [
            { label: '해외의료비', amount: '2,000만원' },
            { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
            { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            { label: '사망 및 80%이상 고도후유장해', amount: '-' },
          ],
        },
        {
          title: '상해질병 3대 비급여 국내의료비',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
          items: [
            { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
            { label: '주사치료', amount: '250만원' },
            { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
          ],
        },
        {
          title: '기타보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
          items: [
            { label: '배상책임보험', amount: '-' },
            { label: '중대사고 구조송환비용', amount: '1,000만원' },
          ],
        },
      ],
    },
    '표준플랜': {
      planName: '표준플랜',
      sections: [
        {
          title: '상해보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
          items: [
            { label: '상해사망후유장해', amount: '5,000만원' },
            { label: '상해후유장해', amount: '-' },
            { label: '해외의료비', amount: '5,000만원' },
            { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
            { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
          ],
        },
        {
          title: '질병보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
          items: [
            { label: '해외의료비', amount: '5,000만원' },
            { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
            { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            { label: '사망 및 80%이상 고도후유장해', amount: '-' },
          ],
        },
        {
          title: '상해질병 3대 비급여 국내의료비',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
          items: [
            { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
            { label: '주사치료', amount: '250만원' },
            { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
          ],
        },
        {
          title: '기타보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
          items: [
            { label: '배상책임보험', amount: '-' },
            { label: '중대사고 구조송환비용', amount: '5,000만원' },
          ],
        },
      ],
    },
    '고급플랜': {
      planName: '고급플랜',
      sections: [
        {
          title: '상해보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
          items: [
            { label: '상해사망후유장해', amount: '30,000EUR' },
            { label: '상해후유장해', amount: '-' },
            { label: '해외의료비', amount: '30,000EUR' },
            { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
            { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
          ],
        },
        {
          title: '질병보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
          items: [
            { label: '해외의료비', amount: '30,000EUR' },
            { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
            { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            { label: '사망 및 80%이상 고도후유장해', amount: '-' },
          ],
        },
        {
          title: '상해질병 3대 비급여 국내의료비',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
          items: [
            { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
            { label: '주사치료', amount: '250만원' },
            { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
          ],
        },
        {
          title: '기타보장',
          helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
          items: [
            { label: '배상책임보험', amount: '5,000만원' },
            { label: '중대사고 구조송환비용', amount: '30,000EUR' },
          ],
        },
      ],
    },
  },
  '해외출장/주재원/교환교수': {
    '실속플랜': {
      '원화플랜': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '2,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '2,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '2,000만원' },
            ],
          },
        ],
      },
      '외화플랜': {
        planName: '실속플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '20,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '20,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '20,000USD' },
            ],
          },
        ],
      },
    },
    '표준플랜': {
      '원화플랜': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '5,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '5,000만원' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
            ],
          },
        ],
      },
      '외화플랜': {
        planName: '표준플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '1억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '50,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '50,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '3,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '2,000만원' },
              { label: '중대사고 구조송환비용', amount: '75,000USD' },
            ],
          },
        ],
      },
    },
    '고급플랜': {
      '원화플랜': {
        planName: '고급플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '2억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '1억원' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '1억원' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '5,000만원' },
              { label: '중대사고 구조송환비용', amount: '5,000만원' },
            ],
          },
        ],
      },
      '외화플랜': {
        planName: '고급플랜',
        sections: [
          {
            title: '상해보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G1',
            items: [
              { label: '상해사망후유장해', amount: '2억원' },
              { label: '상해후유장해', amount: '-' },
              { label: '해외의료비', amount: '100,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
            ],
          },
          {
            title: '질병보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G2',
            items: [
              { label: '해외의료비', amount: '100,000USD' },
              { label: '국내입원의료비(급여/비급여)', amount: '5,000만원' },
              { label: '국내통원의료비(급여/비급여)', amount: '15만원' },
              { label: '사망 및 80%이상 고도후유장해', amount: '2,000만원' },
            ],
          },
          {
            title: '상해질병 3대 비급여 국내의료비',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G3',
            items: [
              { label: '도수, 체외충격파, 증식치료', amount: '350만원' },
              { label: '주사치료', amount: '250만원' },
              { label: '자기공명진단(MRA/MRI)', amount: '300만원' },
            ],
          },
          {
            title: '기타보장',
            helpUrl: '/tour/tourvalley/rainbow/common/guarantee_detail_pop.jsp?group_product=FL&page_num=G4',
            items: [
              { label: '배상책임보험', amount: '5,000만원' },
              { label: '중대사고 구조송환비용', amount: '75,000USD' },
            ],
          },
        ],
      },
    },
  },
};

export default function CoverageDetailModal({
  isOpen,
  onClose,
  planType,
  insuranceType = '국내여행보험',
  isMedicalExpense = true, // 기본값: 실손
  currencyPlan, // 원화플랜/외화플랜 구분
}: CoverageDetailModalProps) {
  if (!isOpen) return null;

  // insurance_type과 plan_type에 따라 보장 데이터 가져오기
  const insuranceTypeKey = insuranceType as InsuranceType;
  const planTypeKey = planType as PlanTypeKey;
  
  // 국내여행보험과 해외여행보험은 실손/비실손 구분이 있음
  const needsMedicalExpenseDistinction = insuranceTypeKey === '국내여행보험' || insuranceTypeKey === '해외여행보험';
  // 유학/어학연수와 해외출장/주재원/교환교수는 원화플랜/외화플랜 구분이 있음
  const needsCurrencyPlanDistinction = insuranceTypeKey === '유학/어학연수' || insuranceTypeKey === '해외출장/주재원/교환교수';
  
  // 데이터 가져오기
  const planData = coverageDataMap[insuranceTypeKey]?.[planTypeKey];
  let coverageData: PlanCoverage;
  
  if (needsMedicalExpenseDistinction && planData && '실손' in planData) {
    // 실손/비실손 구분이 있는 경우
    const medicalExpenseType = isMedicalExpense !== false ? '실손' : '비실손'; // 기본값: 실손
    coverageData = (planData as Record<MedicalExpenseType, PlanCoverage>)[medicalExpenseType] || 
                   (planData as Record<MedicalExpenseType, PlanCoverage>)['실손'];
  } else if (needsCurrencyPlanDistinction && planData && '원화플랜' in planData) {
    // 원화플랜/외화플랜 구분이 있는 경우
    const currencyPlanType = currencyPlan || '원화플랜'; // 기본값: 원화플랜
    coverageData = (planData as Record<CurrencyPlanType, PlanCoverage>)[currencyPlanType] || 
                   (planData as Record<CurrencyPlanType, PlanCoverage>)['원화플랜'];
  } else if (planData && 'planName' in planData) {
    // 구분이 없는 경우 (직접 PlanCoverage)
    coverageData = planData as PlanCoverage;
  } else {
    // 기본값으로 국내여행보험 표준플랜 실손 사용
    const defaultPlanData = coverageDataMap['국내여행보험']?.['표준플랜'];
    if (defaultPlanData && '실손' in defaultPlanData) {
      coverageData = (defaultPlanData as Record<MedicalExpenseType, PlanCoverage>)['실손'];
    } else {
      coverageData = defaultPlanData as PlanCoverage;
    }
  }

  return (
    <div className="coverage-detail-modal-overlay" onClick={onClose}>
      <div className="coverage-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="coverage-detail-modal-header">
          <h2 className="coverage-detail-modal-title">보장 상세보기</h2>
          <button
            className="coverage-detail-modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="coverage-detail-modal-body">
          <p className="tour2023_title04">{coverageData.planName}</p>
          <p className="tour2023_Line01"></p>
          
          {coverageData.sections.map((section, sectionIndex) => (
            <section key={sectionIndex}>
              <p className="tour2023_txt18">
                <span className="tour2023_blue">{section.title}</span>
                <a 
                  href={section.helpUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="coverage-help-link"
                >
                  <img 
                    src="/images/icon_tip.png" 
                    alt="도움말 보기" 
                    className="icon_tip icon_tip01"
                  />
                </a>
              </p>
              
              {section.items.map((item, itemIndex) => (
                <ul key={itemIndex} className="tour2023_planLayer">
                  <li className="tour2023_txt16">
                    <span>{item.label}</span>
                    {item.note && (
                      <em className="tour2023_txt16_s"> {item.note}</em>
                    )}
                  </li>
                  <li className="tour2023_txt17">{item.amount}</li>
                </ul>
              ))}
            </section>
          ))}

          <div className="tourG_mat17 tourG_Wrap"></div>
        </div>
        <div className="coverage-detail-modal-footer">
          <button 
            className="tour2023_btn_b tour2023_btn07"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
