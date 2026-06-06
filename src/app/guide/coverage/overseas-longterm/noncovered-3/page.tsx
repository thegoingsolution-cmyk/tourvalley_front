'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '도수, 체외충격파, 증식치료',
    description:
      '해외여행 중에 상해 또는 질병의 치료목적으로 국내 의료기관에 입원 또는 통원하여 비급여 도수치료·체외충격파치료·증식치료를 받은 경우 본인이 실제로 부담한 비급여 의료비(행위료, 약제비, 치료재료대 포함)에서 공제금액(1회당 3만원과 보장대상의료비의 30% 중 큰 금액)을 뺀 금액을 계약일부터 1년 단위로 350만원 이내에서 도수치료·체외충격파치료·증식치료의 각 치료횟수를 합산하여 최초 10회 보장하고, 이후 객관적이고 일반적으로 인정되는 검사결과 등을 토대로 증상의 개선, 병변호전 등이 확인된 경우에 한하여 10회 단위로 연간 50회까지 보상',
  },
  {
    title: '주사치료',
    description:
      '해외여행 중에 상해 또는 질병의 치료목적으로 국내 의료기관에 입원 또는 통원하여 주사치료를 받아 본인이 실제로 부담한 비급여 주사료에서 공제금액(1회당 3만원과 보장대상의료비의 30%중 큰 금액)을 뺀 금액을 보상한도(계약일부터 1년 단위로 각 상해·질병 치료행위를 합산하여 250만원 이내에서 50회까지)내에서 보상',
  },
  {
    title: '자기공명영상진단',
    description:
      '해외여행 중에 상해 또는 질병의 치료목적으로 국내 의료기관에 입원 또는 통원하여 자기공명영상진단(MRI, MRA)을 받아 본인이 실제로 부담한 비급여 의료비(조영제, 판독료 포함)에서 공제금액(1회당 3만원과 보장대상의료비의 30% 중 큰 금액)을 뺀 금액을 보상한도(계약일부터 1년 단위로 각 상해·질병 치료행위를 합산하여 연간 300만원 한도)내에서 보상',
  },
];

export default function CoverageNoncoveredThreePage() {
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
            상해질병 3대 비급여 국내의료비
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
