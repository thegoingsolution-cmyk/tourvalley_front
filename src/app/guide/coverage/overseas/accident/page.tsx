'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '해외여행중 상해사망후유장해',
    description:
      '가. 해외여행 중 상해의 직접결과로 사망한 경우: 보험가입금액 전액 지급 나. 해외여행 중 상해로 장해분류표에서 정한 장해지급률에 해당하는 장해상태가 되었을 경우: 후유장해보험금(보험가입금액×후유장해지급률로 산출한 금액) 지급',
  },
  {
    title: '해외여행 중 상해후유장해',
    description:
      '해외여행 중 상해로 장해분류표에서 정한 장해지급률에 해당하는 장해상태가 되었을 경우: 후유장해 보험금(보험가입금액×후유장해지급률로 산출한 금액) 지급',
  },
  {
    title: '해외의료비',
    description:
      '해외여행 중 상해를 입고, 이로 인해 해외의료기관에서 의사(치료받는 국가의 법에서 정한 병원 및 의사의 자격을 가진 자에 한함)의 치료를 받는 때에 보장개시일 이후 부상과 관련해 직접 또는 간접적으로 발생된 의료비 전액(단, 착지치과, 침술의 경우 사고당 US$1,000 한도)을 보상(치료를 받은 당일로부터 치료기간과 치료 종료일로부터 180일 한도)',
  },
  {
    title: '국내의료비(상해 급여_입원)',
    description:
      '해외여행 중에 상해를 입고 국내 의료기관에 입원하여 급여 치료를 받은 경우 국민건강보험법에서 정한 요양급여 또는 의료급여법에서 정한 의료급여 중 본인부담금(본인이 실제로 부담한 금액)의 80%(다만, 20% 해당액이 계약일 또는 매년 계약해당일부터 연간 200만원을 초과하는 경우 그 초과금액은 보상)를 보험가입금액을 한도로 보상(단, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 입원 치료중 보험기간 종료시 계속중인 입원에 대해 종료일 다음날부터 180일까지 보상)',
  },
  {
    title: '국내의료비(상해 비급여_입원)',
    description:
      '해외여행 중에 상해를 입고 국내 의료기관에 입원하여 비급여 치료를 받은 경우 국민건강보험법 또는 의료급여법에 따른 비급여의료비(단, 3대 비급여 제외)로 본인이 실제로 부담한 금액의 70%(단, 상급병실료차액의 경우 1일 평균금액 10만원을 한도로 비급여 병실료의 50%)를 보험가입금액을 한도로 보상(단, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 입원 치료중 보험기간 종료시 계속중인 입원에 대해 종료일 다음날부터 180일까지 보상)',
  },
  {
    title: '국내의료비(상해 급여_통원)',
    description:
      '해외여행 중에 상해를 입고 국내 의료기관에 통원하여 급여 치료를 받거나 급여 처방조제를 받은 경우, 통원 1회당(외래 및 처방조제 합산) 국민건강보험법에서 정한 요양급여 또는 의료급여법에서 정한 의료급여 중 본인부담금(본인이 실제로 부담한 금액)에서 보건소, 병원, 의원급에서의 외래 및 그에 따른 약국에서의 처방조제에 대해 1만원과 보장대상의료비의 20%중 큰 금액, 전문요양기관, 상급종합병원, 종합병원에서의 외래 및 그에 따른 약국에서의 처방조제에 대해 2만원과 보장대상의료비의 20%중 큰 금액을 차감한 후 보험가입금액을 한도로 보상(단, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 통원 치료중 보험기간 종료시 계속중인 통원에 대해 종료일 다음날부터 180일 이내의 통원 90회까지 보상)',
  },
  {
    title: '국내의료비(상해 비급여_통원_해외여행실손_특약)',
    description:
      '해외여행 중에 상해를 입고 국내 의료기관에 통원하여 비급여 치료를 받거나 비급여 처방조제를 받은 경우, 통원 1회당(외래 및 처방조제 합산) 국민건강보험법 또는 의료급여법에 따른 비급여의료비(단, 3대 비급여 및 상급병실료차액 제외)로 본인이 실제로 부담한 금액에서 보건소, 병원 등 의료기관에서의 외래 및 그에 따른 약국에서의 처방조제에 대해 3만원과 보장대상의료비의 30%중 큰 금액을 차감한 후 보험가입금액을 한도로 연간 통원 100회까지 보상(단, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 통원 치료중 보험기간 종료시 계속중인 통원에 대해 종료일 다음날부터 180일 이내의 통원 90회까지 보상)',
  },
  {
    title: '해외여행중 골절(치아파절제외)진단비(동일사고 1회한)',
    description:
      '해외여행 도중 상해의 직접결과로써 약관(골절(치아파절제외)분류표)에서 정한 골절(치아파절제외)로 진단이 확정된 경우, 특약가입금액을 매 사고시마다 골절(치아파절제외)진단비로 지급(단, 동일한 사고로 인하여 2가지 이상의 골절상태가 된 경우, 1회에 한하여 보상)',
  },
  {
    title: '해외여행중 상해 입원일당(4일 이상 30일한도)',
    description:
      '피보험자가 해외여행 도중에 상해를 입고 그 직접결과로써 생활기능 또는 업무능력에 지장을 가져와 병원 또는 의원에 입원하여 받는 치료를 입원 치료 4일 이상 입원하여 의사의 치료를 받은 경우 3일 초과 입원 1일당 해외여행 상해 입원일당을 30일을 한도로 지급함',
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
