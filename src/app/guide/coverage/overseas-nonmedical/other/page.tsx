'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../coverage.css';

const coverageItems = [
  {
    title: '해외여행중 휴대품손해(분실제외, 자기부담금1만원) (보상한도 기타 20만원)(단, 이동통신단말기 10만원)',
    description:
      '해외여행 중에 생긴 우연한 사고에 의하여 보험의 목적(여행도중에 휴대하는 피보험자 소유, 사용, 관리의 휴대품)에 입은 손해를 보상함(1회의 사고에 대하여 자기부담금 1만원을 공제한 금액으로 하며 보험의 목적의 1개 또는 1조, 1쌍에 대해 20만원 한도(단, 이동통신단말기(공단말기 포함)에 대해 최대 10만원을 한도로 함). 분실은 제외) 단, 통화, 신용카드, 유가증권, 항공권, 여권 등 휴대품손해로서 보험의 목적에 의한 사고 등은 제외됩니다. (기타 자세한 내용은 보험약관 참조)',
  },
  {
    title: '해외여행중 배상책임(자기부담금 1만원)',
    description:
      '해외여행 중 생긴 우연한 사고로 타인의 신체나 재물에 손해를 가하여 법률상 배상책임을 부담하는 경우, 보험가입금액 한도내에서 보상(1회의 사고에 대하여 자기부담금 1만원)\n단, 친족간 사고, 호텔이나 객실내의 동산을 제외한 피보험자가 소유, 사용 또는 관리하는 재물배상, 차량(원동력이 인력에 의한 것을 제외) 및 카트사고 등은 제외 (기타 약관 참조)',
  },
  {
    title: '해외여행중 중대사고 구조송환비용(자기부담금:사고(질병)당 10만원 공제후 20%)',
    description:
      '해외여행 중 피보험자가 탑승한 항공기, 선박의 행방불명, 조난 또는 피보험자가 사망하거나 7일 이상 입원한 경우, 피보험자가 국토교통부령에서 정하는 비용의 수색·구조비용, 동반/구조 후송비, 국내외 이송비, 시신의 유해당 화장비용 등(자기부담금(사고(질병)당 10만원 공제후 20%)을 공제한 후 보험가입금액을 한도로 보상)',
  },
  {
    title: '해외여행중 항공기납치',
    description:
      '해외여행 중 피보험자가 탑승한 항공기가 납치됨에 따라 예정목적지에 도착할 수 없게 된 동안 매일 70,000원의 금액으로 납치목적지 도착예정시간에서 12시간이 경과한 이후부터 시작되는 24시간을 1일로 보아 20일을 한도로 보상',
  },
  {
    title: '신용카드사용액보상(해외여행중 상해사망)',
    description:
      '피보험자가 해외여행도중 상해로 인하여 사망한 경우 보험가입금액 전액을 카드사용금액의 결제비용으로 보상',
  },
  {
    title: '해외여행중 여권분실 후 재발급 비용',
    description:
      '피보험자가 해외여행 도중 여권을 분실하거나 도난당하여 재외공관에 여권분실신고를 하고 여행증명서를 발급받은 경우 보상',
  },
  {
    title: '해외여행중 중단사고발생 추가비용',
    description:
      '해외여행 중 아래의 여행중단 사유 발생으로 인해 귀국해야 하거나 여행을 중단할 수 밖에 없는 경우, 귀국항공료 및 미리 지불한 여행 서비스 비용을 보상(단, 선박의 경우 2박 이내의 숙박료 보험가입금액을 한도로 보상)\n<여행중단 사유>\n1. 피보험자 및 여행동반 가족이 사망 또는 질병으로 3일 이상 입원한 경우\n2. 피보험자의 3촌 이내 친족 및 여행동반자의 사망\n3. 지진, 분화, 해일, 태풍, 홍수 또는 이와 비슷한 천재지변, 전쟁, 외국의 무력행사, 혁명, 내란, 사변, 테러, 기타 이들과 유사한 사태',
  },
  {
    title: '항공기 및 수화물 지연에 따른 추가비용',
    description:
      '해외여행 중 아래의 보험사고로 인하여 피보험자가 추가로 지출한 비용(아래 가, 나의 경우 식사비, 숙박비 필요한 경우 숙박비, 다, 라의 경우 비상식품, 생활필수품 구입비, 기타 약관 참조)에 대하여 1사고당 보험가입금액 한도로 보상\n가. 국제선 정규항공편이 결항되어 실제 도착시간이 4시간 이내 피보험자에게 대체적인 항공수단을 제공하지 못한 경우\n나. 국제선 정규항공편이 4시간 이상 지연, 취소되거나 또는 피보험자가 과적에 의해 탑승이 거부되어 예정시간으로부터 4시간 내 대체적인 수단을 제공하지 못한 경우\n다. 피보험자의 수화물이 항공편에 의해 도착지에 도착한 날로부터 6시간 이내 도착하지 못하는 경우\n라. 피보험자가 목적지에 도착한 후 24시간 내 등록된 수화물이 도착하지 못하는 경우',
  },
  {
    title: '해외여행중 폭력상해피해 변호사 선임비용',
    description:
      '해외여행 중 타인에 의한 폭력상해로 상해를 입고, 이를 원인으로 재판을 진행한 경우(보험기간 중 종료일의 개시일 이내에 발생한 상해 또는 보험기간 중 발생하여 보험기간 종료 후 1년 이내에 판결이 확정된 경우) 피보험자가 부담한 변호사선임비용을 특별약관의 보험가입금액 한도로 보상\n※ 폭력상해란 피보험자(피해자)와 피보험자 이외의 자(가해자) 사이에 발생한 물리적 폭력으로 인하여 피보험자의 신체에 의해 상해를 입은 사건(피보험자의 신체보조장구는 제외하며, 인공장기나 부분 의치 등 신체에 이식되어 그 기능을 대신할 경우는 포함) 등으로 상해로 판명된 경우\n※ 소송 및 재판으로 문서 등으로 타인에 의한 폭력상해로 피보험자가 상해를 입은 사건임이 확인될 수 있는 경우에 한하여 보험금 지급',
  },
  {
    title: '해외여행중 인질구조비용 및 석방보석금',
    description:
      '해외여행 도중에 인질상태에 놓이게 되었을 경우에 해당 피보험자의 구출을 위해 실제로 소요된 구조비용(구출과 관련된 수색비, 정보제공자 사례비 등 포함)과 석방보석금을 이 특별약관의 보험가입금액 한도로 보상\n※ 인질상태라 함은 아래와 같은 경우를 말합니다\n1. 불법적인 유괴, 납치 또는 감금 등에 의하여 구속되었을 경우\n2. 보복무력적 조직 또는 구속적 당사자에게 살해 등의 위협을 당하여 합법적인 비정치적인 조건을 약속하고 석방된 경우\n3. 신체 또는 정신적으로 구속상태에 놓이고 본인의 의사로 감금되어 있었던 경우',
  },
  {
    title: '출국항공기지연(2시간이상 4시간 미만)에 따른 추가비용',
    description:
      '피보험자가 해외여행을 목적으로 탑승예정인 국내공항에서 출발하는 국제선 항공편이 지연 2시간 이상 4시간 미만의 항공지연보험사고가 발생하여 피보험자가 실제로 지출한 식사비, 음료비 및 편의시설 이용 비용 및 편의시설 이용을 위한 교통비',
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
