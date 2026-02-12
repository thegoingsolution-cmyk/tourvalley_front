'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../../agreement/pc/page.css';

const coverageItems = [
  {
    title: '국내의료비(질병 급여_입원_국내여행실손_기본)',
    description:
      '국내여행 중에 질병으로 인하여 국내 의료기관에 입원하여 급여 치료를 받거나 급여 처방조제를 받은 경우 국민건강보험법에서 정한 요양급여 또는 의료급여법에서 정한 의료급여 중 본인부담금(본인이 실제로 부담한 금액)의 80％(다만, 20％ 해당액이 계약일 또는 매년 계약해당일부터 연간 200만원을 초과하는 경우 그 초과금액은 보상)를 보험가입금액을 한도로 보상(다만, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 입원 치료중 보험기간 종료시 계속중인 입원에 대해 종료일 다음날부터 180일까지 보상)',
  },
  {
    title: '국내의료비(질병 비급여_입원_국내여행실손_특약)',
    description:
      '국내여행 중 질병으로 인하여 국내 의료기관에 입원하여 비급여 치료를 받은 경우, 국민건강보험법 또는 의료급여법에 따른 비급여 의료비(단, 3대 비급여 제외)로 본인이 실제로 부담한 금액의 70％(단, 상급병실료차액의 경우 1일 평균금액 10만원을 한도로 비급여 병실료의 50％, 1일 평균금액은 입원기간 동안 비급여 병실료 전체를 총 입원일수로 나누어 산출)를 보험가입금액을 한도로 보상(다 만, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 입원 치료중 보험기간 종료시 계속중인 입원에 대해 종료일 다음날부터 180일까지 보상)',
  },
  {
    title: '국내의료비(질병 급여_통원_국내여행실손_기본)',
    description:
      '국내여행 중에 질병으로 인하여 국내 의료기관에 통원하여 급여 치료를 받거나 급여 처방조제를 받은 경우, 통원 1회당(외래 및 처방조제 합산) 국민건강보험법에서 정한 요양급여 또는 의료급여법에서 정한 의료급여 중 본인부담금(본인이 실제로 부담한 금액)에서 보건소, 병원, 의원급에서의 외래 및 그에 따른 약국에서의 처방조제에 대해 1만원과 보장대상의료비의 20％중 큰 금액, 전문요양기관, 상급종합병원, 종합병원에서의 외래 및 그에 따른 약국에서의 처방조제에 대해 2만원과 보장대상의료비의 20％중 큰 금액을 차감한 후 보험가입금액을 한도로 보상(다만, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 통원 치료중 보험기간 종료시 계속중인 통원에 대해 종료일 다음날부터 180일 이내의 통원 90회까지 보상)',
  },
  {
    title: '국내의료비(질병 비급여_통원_국내여행실손_특약)',
    description:
      '국내여행 중에 질병으로 인하여 국내 의료기관에 통원하여 비급여 치료를 받거나 비급여 처방조제를 받은 경우, 통원 1회당(외래 및 처방조제 합산) 국민건강보험법 또는 의료급여법에 따른 비급여의료비(단, 3대 비급여 및 상급병실료차액 제외)로 본인이 실제로 부담한 금액에서 보건소, 병원 등 의료기관에서의 외래 및 그에 따른 약국에서의 처방조제에 대해 3만원과 보장대상의료비의 30％중 큰 금액을 차감한 후 보험가입금액을 한도로 연간 통원 100회까지 보상(다만, 연간 보상한도는 입원과 통원 보상금액을 합산하여 입원 보험가입금액을 한도로 하며, 통원 치료중 보험기간 종료시 계속중인 통원에 대해 종료일 다음날부터 180일 이내의 통원 90회까지 보상)',
  },
  {
    title: '국내여행중 질병사망 및 80%이상 고도후유장해',
    description:
      '국내여행 중 발생한 질병으로 보험기간 중 또는 보험기간 마지막 날로부터 30일 이내에 사망하거나 약관 [별표1]장해분류표에서 정한 장해지급률이 80%이상에 해당하는 장해상태가 되었을 때 보험가입금액 지급',
  },
];

export default function CoverageDiseasePage() {
  const router = useRouter();

  const handleClose = () => {
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
            질병보장
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
