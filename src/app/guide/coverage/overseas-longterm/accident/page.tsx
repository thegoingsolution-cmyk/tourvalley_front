'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '상해사망 후유장해',
    description:
      '보험기간 중 해외 체류를 목적으로 주거지를 출발하여 체류를 마치고 주거지에 도착할때까지의 해외체류 중 발생한 상해의 직접 결과로써 사망하거나 장해상태가 된 경우 보상',
  },
  {
    title: '상해후유장해',
    description:
      '보험기간 중 해외 체류를 목적으로 주거지를 출발하여 체류를 마치고 주거지에 도착할때까지의 해외체류 중 발생한 상해의 직접 결과로써 장해상태가 된 경우 보상',
  },
  {
    title: '해외발생의료실비(상해)',
    description: '해외체류 중에 입은 상해로 인하여 해외의료기관에서 의료비가 발생한 경우에 보상',
  },
  {
    title: '상해급여 실손의료비 - 국내의료실비(4세대)',
    description: '해외체류 중에 입은 상해로 인하여 국내의료기관에 입원 또는 통원하여 급여치료를 받거나 급여처방조제를 받은 경우에 보상',
  },
  {
    title: '상해비급여 실손의료비 - 국내의료실비(4세대)',
    description: '해외체류 중에 입은 상해로 인하여 국내의료기관에 입원 또는 통원하여 비급여치료를 받거나 비급여처방조제를 받은 경우에 보상',
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
