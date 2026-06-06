'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '해외의료비(질병_해외여행실손)',
    description:
      '해외여행 중 질병으로 인하여 해외의료기관에서 의사(치료받는 국가의 법에서 정한 병원 및 의사의 자격을 가진 자에 한함)의 치료를 받을 때에는 보험가입금액을 한도로 피보험자가 실제 부담한 의료비 전액(단, 착지치과, 침술의 경우 질병당 US$1,000 한도)을 보상(치료를 받은 당일부터 보험기간 만료시 종료일부터 180일 한도)',
  },
  {
    title: '해외여행중 질병사망 및 80%이상 고도후유장해',
    description:
      '해외여행 중 발생한 질병으로 보험기간 중 또는 보험기간 마지막 날로부터 30일 이내에 사망하거나 약관 [별표1] 장해분류표에서 정한 장해지급률이 80%이상에 해당하는 장해상태가 되었을 때 보험가입금액 지급',
  },
  {
    title: '해외여행중 식중독입원일당(4일이상 120일한도)',
    description:
      '해외여행 중 음식물 섭취로 인해 중독이 발생하고, 그 식중독의 치료를 직접적인 목적으로 4일 이상 입원치료를 받은 경우, 3일 초과 1일당 식중독입원일당을 120일을 한도로 지급',
  },
  {
    title: '해외여행중 질병 입원일당(4일 이상 30일한도)',
    description:
      '피보험자가 해외여행 도중에 진단확정된 질병의 치료를 직접적인 목적으로 병원 또는 의원(한방병원 또는 한의원 포함)에서 4일 이상 입원하여 의사의 치료를 받은 경우 3일 초과 입원 1일당 해외여행 질병 입원일당을 30일 한도로 지급함',
  },
  {
    title: '해외여행 중 특정전염병 치료비',
    description:
      '피보험자가 여행도중 약관 내 [별표 4] 특정전염병분류표에서 정한 특정전염병에 감염되어 전염병 환자로 진단받아 치료를 받는 경우에 보상',
  },
];

export default function CoverageDiseasePage() {
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
            질병보장
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
