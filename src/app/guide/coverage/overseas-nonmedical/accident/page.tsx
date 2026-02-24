'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '해외여행중 상해사망후유장해',
    description:
      '가. 해외여행 중 상해의 직접결과로써 사망한 경우: 보험가입금액 전액 지급 나. 해외여행 중 상해로 장해분류표에서 정한 장해지급률에 해당하는 장해상태가 되었을 경우: 후유장해보험금(보험가입금액x후유장해지급률로 산출한 금액) 지급',
  },
  {
    title: '해외여행 중 상해후유장해',
    description:
      '해외여행 중 상해로 장해분류표에서 정한 장해지급률에 해당하는 장해상태가 되었을 경우: 후유장해보험금(보험가입금액x후유장해지급률로 산출한 금액) 지급',
  },
  {
    title: '해외의료비',
    description:
      '해외여행 중 상해를 입고, 이로 인해 해외의료기관에서 의사(치료받는 국가의 법에서 정한 병원 및 의사의 자격을 가진 자에 한함)의 치료를 받는 때에는 보험가입금액을 한도로 피보험자가 실제 부담한 의료비 전액(단, 착치(치과), 침술의 경우 사고당 US$1,000 한도)을 보상(치료를 받은당일로부터 보험기간 만료시 종료일부터 180일 한도)',
  },
  {
    title: '해외여행중 골절(치아파절제외)진단비(동일사고당 1회한)',
    description:
      '해외여행 도중 상해의 직접결과로써 약관 (골절(치아파절제외)분류표)에서 정한 골절(치아파절제외)로 진단이 확정된 경우, 특약가입금액을 매 사고시마다 골절(치아파절제외)진단비로 지급 단, 동일한 사고로 인하여 2가지 이상의 골절상태가 된 경우, 1회에 한하여 보상',
  },
  {
    title: '해외여행 중 상해 입원일당(4일 이상 30일한도)',
    description:
      '피보험자가 해외여행 도중에 상해를 입고 그 직접결과로써 생활기능 또는 업무능력에 지장을 가져와 병원 또는 의원(한방병원 또는 한의원 포함)에 4일 이상 입원하여 의사의 치료를 받은 경우 3일 초과 입원 1일당 해외여행 상해 입원일당을 30일을 한도로 지급함',
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
