'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '국내여행 중 상해사망후유장해',
    description:
      '가. 국내여행 중 상해의 직접결과로써 사망한 경우: 보험가입금액 전액 지급 나. 국내여행 중 급격하고도 우연한 외래사고로 인해 약관 [별표1] 장해분류표에서 정한 장해지급률에 해당하는 장해상태가 되었을 때 장해지급률 X 보험가입금액으로 산출한 금액을 지급',
  },
  {
    title: '국내여행 중 상해후유장해',
    description:
      '국내여행 중 급격하고도 우연한 외래사고로 인해 약관 [별표1] 장해분류표에서 정한 장해지급률에 해당하는 장해상태가 되었을 때 장해지급률 X 보험가입금액으로 산출한 금액을 지급',
  },
  {
    title: '국내여행 골절(치아파절 제외)진단비',
    description:
      '국내여행 중 상해의 직접결과로써 약관 (골절(치아파절 제외)분류표)에서 정한 골절(치아파절 제외)로 진단이 확정된 경우, 특약가입금액을 매 사고시마다 골절(치아파절 제외)진단비로 지급 단, 동일한 사고로 인하여 2가지 이상의 골절상태가 된 경우, 1회에 한하여 보상',
  },
  {
    title: '국내여행 화상진단비',
    description:
      '국내여행 중 상해의 직접결과로써 약관 (화상분류표)에서 정한 화상(염상 포함)에 해당하고, 신체척도 2도 이상의 화상으로 진단이 확정된 경우, 특약가입금액을 매 사고시마다 화상진단비로 지급 단, 동일한 사고로 인하여 2가지 이상의 화상상태가 된 경우, 1회에 한하여 보상',
  },
  {
    title: '국내여행 골절수술비(동일사고당 1회한)',
    description:
      '보험기간 중 피보험자가 국내여행 중에 상해로 약관에서 정한 골절을 입고 그 치료를 직접적인 목적으로 수술을 받은 경우 수술 1회당 보험가입금액 지급\n※ 하나의 사고로 두 종류 이상의 골절수술을 받은 경우에는 하나의 골절수술비 보험금만을 지급',
  },
  {
    title: '국내여행 상해수술비(동일사고당 1회한)',
    description:
      '보험기간 중 피보험자가 국내여행 중에 상해의 직접결과로써 수술을 받은 경우 수술 1회당 보험가입금액 지급\n※ 하나의 사고로 두 종류 이상의 상해수술을 받은 경우 하나의 상해수술비 보험금만을 지급',
  },
  {
    title: '국내여행 깁스치료비(동일사고 또는 질병당 1회한)',
    description:
      '국내여행 중 상해 또는 질병으로 인하여 깁스(Cast)치료를 받은 경우, 특약가입금액을 매 사고시마다 깁스치료비로 지급 단, 하나의 상해 또는 질병으로 인하여 2회 이상 깁스치료를 받은 경우, 1회 이상 보상. 상해\'라 함은 국내여행 중 발생한 급격하고도 우연한 외래의 사고로 신체(의수, 의족, 의안, 의치 등 신체보조장구는 제외하나, 인공장기나 부분 의치 등 신체에 이식되어 그 기능을 대신할 경우는 포함)에 입은 상해를 말합니다.',
  },
  {
    title: '국내여행 중 상해응급내원(응급) 치료비',
    description:
      '보험기간 중 피보험자가 국내여행 중 상해로 인한 "응급환자"로 응급실에 내원하여 진료를 받은 경우 보험가입금액 지급\n※ 응급실 도착 전 사망하였거나 병원을 옮겨 응급실에 내원한 환자도 보상\n※ 응급환자: 상해로 응급실에 내원하여 진료를 받은 자 중 응급의료에 관한 법률 시행규칙 제 2조(응급환자)에서 정하는 자',
  },
  {
    title: '국내여행 상해입원일당(4일이상 30일한도)',
    description:
      '보험기간 중 피보험자가 국내여행 중 상해를 입고 그 직접결과로써 생활기능 또는 업무능력에 지장을 가져와 병원 또는 의원(한방병원 또는 한의원 포함)에 4일 이상 입원하여 의사의 치료를 받은 경우에는 3일 초과 입원 1일당 이 특약가입금액을 국내여행 상해입원 일당으로 30일 한도로 지급',
  },
];

export default function CoverageAccidentPage() {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'COVERAGE_HELP_CLOSE_MODAL' }, window.location.origin);
      } catch (error) {
        console.error('도움말 모달 닫기 메시지 전송 오류:', error);
      }
      return;
    }

    if (window.opener) {
      window.close();
    } else {
      router.push('/main');
    }
  };

  return (
    <div id="isbwrapper" className="agreement-wrapper">
      <header id="header">
        <div className="layer_header prow_01">
          <span
            className="layer_title"
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          >
            상해보장
          </span>
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              handleClose();
            }}
            className="close"
            style={{ position: 'absolute', right: '4.68%' }}
          >
            나가기
          </a>
        </div>
      </header>

      <div id="contentWrap">
        <section className="tourGuard_bg ag_center prow_01">
          <div className="tourGuard_Topbg01">
            {coverageItems.map((item, index) => (
              <div key={`${item.title}-${index}`}>
                <ul
                  className={`tourG_Wrap ${index === 0 ? 'tourG_mat11' : 'tourG_mat10'} ag_left`}
                  style={{ listStyle: 'none', margin: '0 0 30px 0', padding: 0 }}
                >
                  <li className="tourG_mab03 tour2023_txt31">{item.title}</li>
                  <li className="tour2023_txt32">{item.description}</li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="tourG_mat23 tourG_Wrap"></div>
        <section id="tour2023_fixedBanner">
          <div className="tour2023_bottom_btn">
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handleClose();
              }}
              className="tour2023_btn_b tour2023_btn07"
            >
              확인
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
