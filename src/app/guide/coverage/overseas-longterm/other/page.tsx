'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '해외체류 중 중대사고 송환비용',
    description:
      '해외체류 중 피보험자가 탑승한 항공기 또는 선박이 행방불명 또는 조난되는 등의 경우에 계약자, 피보험자 등이 부담하는 수색구조비용, 항공운임 등 교통비, 숙박비, 이송비용 등을 보상',
  },
  {
    title: '해외체류 중 배상책임',
    description:
      '피보험자가 우연한 사고로 타인의 신체나 재물에 손해를 가하여 법률상 배상책임을 부담하는 경우, 약관에서 정한 보상한도액 내에서 보상(자기부담금 1만원)\n단, 친족간 사고, 호텔이나 객실내의 동산을 제외한 피보험자가 소유, 사용 또는 관리하는 재물배상, 차량(원동력이 인력에 의한 것을 제외) 및 카트사고 등은 제외',
  },
];

export default function CoverageOtherPage() {
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
            기타보장
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
