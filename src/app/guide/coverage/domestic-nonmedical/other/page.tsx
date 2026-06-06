'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '국내여행 중 휴대품손해(분실제외, 자기부담금 1만원, 이동통신단말기 보상제외)',
    description:
      '국내여행 중 우연한 사고에 의하여 보험의 목적에 입은 손해를 이 특별약관에 따라 보험가입금액(단, 1회의 사고에 대해 자기부담금 1만원을 공제한 후, 보험의 목적의 1개 또는 1조, 1쌍에 대해 20만원 한도로 보상)을 한도로 보상합니다. (분실은 제외)\n피보험자가 여행도중에 휴대하는 피보험자 소유, 사용, 관리의 휴대품에 한합니다. 단, 통화, 유가증권, 인지, 우표, 신용카드, 쿠폰, 항공권, 여권 등 이와 비슷한 것, 원고, 설계서, 도안, 물건의 원본, 모형, 증서, 장부, 금형(쇠틀), 목형(나무틀), 소프트웨어 및 이와 비슷한 것, 선박 또는 자동차(자동 3륜차, 자동 2륜차 포함), 산악 등반이나 탐험 등에 필요한 용구, 동물, 식물, 의치, 의수족, 콘택트렌즈 및 이와 유사한 신체보조장구, 이동통신단말기(공단말기 포함) 은 제외됩니다.',
  },
  {
    title: '국내여행중 배상책임(자기부담금 1만원)',
    description:
      '국내여행 중 생긴 우연한 사고로 타인의 신체의 장해 또는 재물의 손해에 대한 법률적인 배상책임을 부담함으로써 입은 손해를 보상 국내여행 중 타인의 신체나 재물에 손해를 가하여 법률상 배상책임을 부담하는 경우 보험가입금액 한도 내에서 보상(1회의 사고에 대하여 자기부담금 1만원 공제)\n단, 친족간 사고, 호텔이나 객실내의 동산을 제외한 피보험자가 소유, 사용 또는 관리하는 재물배상, 차량(원동력이 인력에 의한 것을 제외) 및 카트사고 등은 제외됩니다. (기타 자세한 내용은 약관 참조)',
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
