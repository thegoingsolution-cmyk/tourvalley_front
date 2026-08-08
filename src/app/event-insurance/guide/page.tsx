'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import { getImagePath } from '@/utils/path';
import { isMobileDevice } from '@/utils/device';
import '../pc/page.css';
import './page.css';

export default function EventInsuranceGuidePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const guideContent = (
    <div className="event-guide-wrap">
        <div className="event-guide-hero">
          <span className="tag">행사주최자 배상책임보험</span>
          <h1>
            행사보험, 의무는 아니지만
            <br />
            필수입니다
          </h1>
          <p>
            법으로 강제하진 않아도, <b>예상치 못한 사고에 대비해</b> 많은 행사가 행사보험을
            준비합니다.
          </p>
        </div>

        {/* 1. 정의 + 대상 */}
        <div className="event-guide-sec">
          <h2>어떤 보험인가요?</h2>
          <div className="event-guide-kbox">
            행사를 진행하다 <b>주최 측의 과실이나 시설물 하자</b>로{' '}
            <b>관람객(제3자)</b>이 다치거나(대인) 물건이 부서지면(대물), 주최 측이 부담해야 할{' '}
            <b>배상금을 보험사가 대신 지급</b>하는 보험입니다.
          </div>
          <div className="event-guide-who2">
            <div className="event-guide-wrow">
              <div className="event-guide-wlab">
                가입 대상 <span>(피보험자 · 행사를 주최하는 법인·단체)</span>
              </div>
              <div className="event-guide-wchips">
                <span>시청·구청</span>
                <span>주민센터</span>
                <span>행정관서</span>
                <span>공공기관</span>
                <span>문화재단</span>
                <span>문화원</span>
                <span>관광재단</span>
                <span>축제추진위원회</span>
                <span>학교</span>
                <span>교회·종교단체</span>
                <span>기업</span>
                <span>행사기획사</span>
                <span>공연기획사</span>
                <span>시설운영사</span>
              </div>
            </div>
            <div className="event-guide-wrow">
              <div className="event-guide-wlab">대상 행사</div>
              <div className="event-guide-wchips">
                <span>지역축제·문화제</span>
                <span>공연·콘서트</span>
                <span>페스티벌</span>
                <span>박람회·전시회</span>
                <span>체육대회·스포츠</span>
                <span>마라톤·걷기대회</span>
                <span>기념식·개막식</span>
                <span>불꽃놀이·야간행사</span>
                <span>플리마켓·먹거리장터</span>
              </div>
            </div>
            <div className="event-guide-wrow">
              <div className="event-guide-wlab">보장 대상</div>
              <div className="event-guide-wtxt">
                행사를 관람·체험하는 <b>관람객 및 참가자 등 제3자</b>
                <div className="event-guide-wnote">
                  ※ 주최 측에 고용된 근로자(진행요원·안전요원 등)는 행사보험에서 보장하지 않으며,
                  단체여행자보험·단체상해보험으로 보완할 수 있습니다. 다만 자원봉사자·공연자(출연진)
                  및 그 보조자는 보험회사에 따라 보장되는 경우가 있습니다.
                </div>
              </div>
            </div>
            <div className="event-guide-wrow">
              <div className="event-guide-wlab">가입 시점</div>
              <div className="event-guide-wtxt">
                행사 시작 <b>최소 2시간 전</b>까지 (권장: 행사 1일 전)
              </div>
            </div>
          </div>
        </div>

        {/* 2. 보장 O/X */}
        <div className="event-guide-sec">
          <h2>무엇을 보장하나요?</h2>
          <p className="lead">
            기본 보장으로 되는 것과 안 되는 것을 먼저 확인하세요. 안 되는 항목도{' '}
            <b>특약을 추가하면 보장</b>됩니다.
          </p>
          <div className="event-guide-cov2">
            <div className="col o">
              <div className="ch">✓ 기본으로 보장돼요</div>
              <ul>
                <li>관람객이 시설물·구조물에 다친 경우 (대인)</li>
                <li>행사 중 낙상 등으로 관람객이 부상당한 경우</li>
                <li>관람객의 차량·물건이 파손된 경우 (대물)</li>
                <li>불꽃 피날레 중 불씨로 관람객이 화상을 입은 경우</li>
              </ul>
            </div>
            <div className="col x">
              <div className="ch">✕ 기본에서는 제외돼요</div>
              <ul>
                <li>
                  진행요원·안전요원 등 주최 측에 <b>고용된 스탭</b>이 업무 중 입은 손해
                  <span className="fix">
                    → 별도 상해·여행자보험으로 보장 (자원봉사자·공연자는 일부 보험사 보상 가능)
                  </span>
                </li>
                <li>
                  주최 측이 소유·임차·관리하는 <b>재물</b> 자체의 손해
                  <span className="fix">→ 임차시설·수탁물 특약으로 보장</span>
                </li>
                <li>
                  행사 <b>음식물로 인한 식중독</b> 사고
                  <span className="fix">→ 음식물배상 특약으로 보장</span>
                </li>
                <li>
                  <b>차량(이륜차 포함) 운행</b> 중 발생한 사고
                  <span className="fix">→ 자동차보험에서 보장</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3. 담보·특약별 보상 */}
        <div className="event-guide-sec">
          <h2>이런 사고를 보상합니다</h2>
          <p className="lead">
            기본 담보(대인·대물)에 행사 성격에 맞는 <b>특약</b>을 더할 수 있습니다. 각 담보가
            어떤 사고를 보상하는지 예시로 확인하세요.
          </p>
          <div className="event-guide-covlist">
            <div className="event-guide-ccard">
              <div className="event-guide-cbadge basic">기본</div>
              <div className="event-guide-cttl">🤕 대인배상</div>
              <div className="event-guide-cdesc">
                관람객이 다쳐 주최 측이 부담해야 할 치료·배상금을 보상합니다.
              </div>
              <div className="event-guide-cex">
                <b>보상 예시</b> · 무대 구조물이 넘어져 관람객이 다친 경우 → 치료비·위자료 배상
              </div>
            </div>

            <div className="event-guide-ccard">
              <div className="event-guide-cbadge basic">기본</div>
              <div className="event-guide-cttl">🚗 대물배상</div>
              <div className="event-guide-cdesc">
                관람객의 차량·물건이 파손됐을 때 배상금을 보상합니다.
              </div>
              <div className="event-guide-cex">
                <b>보상 예시</b> · 넘어진 시설물에 관람객 차량이 파손된 경우 → 수리비 배상
              </div>
            </div>

            <div className="event-guide-ccard hl">
              <div className="event-guide-cbadge must">특약 · 권장</div>
              <div className="event-guide-cttl">🩹 참가자치료비</div>
              <div className="event-guide-cdesc">
                <b>주최 측 과실이 없어도</b> 행사 중 다친 참가자의 치료비를 보상합니다.
                응급처치·구급차·입원·수술·검사·간호비 포함. 피해자 과실을 따지지 않아 실무상 꼭
                필요한 담보입니다.
              </div>
              <div className="event-guide-cex">
                <b>보상 예시</b> · 참가자가 스스로 발을 헛디뎌 넘어져 다쳐도 치료비 지급
              </div>
            </div>

            <div className="event-guide-ccard">
              <div className="event-guide-cbadge opt">특약</div>
              <div className="event-guide-cttl">🍱 음식물배상</div>
              <div className="event-guide-cdesc">
                주최 측이 제공한 음식물로 생긴 식중독 등의 사고를 보상합니다.
                푸드박스·푸드트럭·부스 등 음식 제공 행사에 권장.
              </div>
              <div className="event-guide-cex">
                <b>보상 예시</b> · 행사 부스에서 제공한 음식으로 식중독 → 치료비·배상{' '}
                <span style={{ display: 'block', marginTop: 3 }}>
                  (행사장 밖 노점에서 사 먹은 음식은 제외)
                </span>
              </div>
            </div>

            <div className="event-guide-ccard">
              <div className="event-guide-cbadge opt">특약</div>
              <div className="event-guide-cttl">🏗️ 행사시설 설치·해체</div>
              <div className="event-guide-cdesc">
                무대·부스·구조물을 설치하거나 해체하는 작업 중 발생한 사고의 배상책임을 보상합니다.
              </div>
              <div className="event-guide-cex">
                <b>보상 예시</b> · 무대 해체 중 자재가 떨어져 행인이 다친 경우 → 치료비 배상
              </div>
            </div>

            <div className="event-guide-ccard">
              <div className="event-guide-cbadge opt">특약</div>
              <div className="event-guide-cttl">🔧 임차시설</div>
              <div className="event-guide-cdesc">
                행사를 위해 빌린 시설·장비가 손해를 입었을 때 그 배상책임을 보상합니다.
              </div>
              <div className="event-guide-cex">
                <b>보상 예시</b> · 임차한 음향·조명 장비가 행사 중 파손된 경우 → 손해 배상
              </div>
            </div>

            <div className="event-guide-ccard">
              <div className="event-guide-cbadge opt">특약</div>
              <div className="event-guide-cttl">📦 수탁물</div>
              <div className="event-guide-cdesc">
                주최 측이 보관을 맡은 관람객·참가자의 물품이 손해를 입었을 때 보상합니다.
              </div>
              <div className="event-guide-cex">
                <b>보상 예시</b> · 물품보관소에 맡긴 참가자 소지품이 분실·훼손된 경우 → 손해 배상
              </div>
            </div>
          </div>
          <div className="event-guide-covfoot">
            <b>자기부담금이란?</b> 사고 시 가입자가 먼저 부담하는 금액으로, 낮을수록 보험료는
            올라갑니다.
            <br />
            특약은 <b>행사 성격에 맞는 항목만</b> 선택해 가입할 수 있으며, 보장한도도 조정할 수
            있습니다. 자세한 구성은 견적 상담에서 안내드립니다.
          </div>
        </div>

        {/* 4. 산출 기준 */}
        <div className="event-guide-sec">
          <h2>보험료는 어떻게 정해지나요?</h2>
          <p className="lead">
            행사주최자 배상책임보험은 정찰가가 없습니다. 아래 요소로 보험사별 요율을 적용해
            산출하므로 <b>견적 신청이 필요</b>합니다.
          </p>
          <div className="event-guide-factors">
            <span className="event-guide-factor">총 예상 참여인원</span>
            <span className="event-guide-factor">보험(행사) 기간</span>
            <span className="event-guide-factor">위험요소</span>
            <span className="event-guide-factor">보장한도·특약 구성</span>
          </div>
          <div className="event-guide-mininote">
            보험회사마다 <b>인수지침(가입 조건)과 요율이 다릅니다.</b> 비즈밸리는 인수 가능한 여러
            보험사의 견적을 비교해 <b>행사 및 예산에 맞는 최적의 보험조건</b>을 안내드립니다.
          </div>
        </div>

        {/* 5. 서류 & 절차 */}
        <div className="event-guide-sec">
          <h2>필수 서류 & 가입 절차</h2>
          <div className="event-guide-docs">
            <div className="event-guide-doc">
              <div className="n">1</div>
              <div>
                <b>사업자등록증</b>
                <span>(또는 고유번호증) — 계약자 확인·청약용</span>
              </div>
            </div>
            <div className="event-guide-doc">
              <div className="n">2</div>
              <div>
                <b>행사개요서</b>
                <span>(행사계획서) — 위험 검토·정확한 견적용</span>
              </div>
            </div>
          </div>
          <div className="event-guide-steps">
            <div className="event-guide-step">
              <div className="ic">📝</div>
              <div className="t">견적신청</div>
              <div className="s">폼 작성·서류 제출</div>
            </div>
            <div className="event-guide-step">
              <div className="ic">📨</div>
              <div className="t">견적서 발송</div>
              <div className="s">비교견적 안내</div>
            </div>
            <div className="event-guide-step">
              <div className="ic">✍️</div>
              <div className="t">청약·납입</div>
              <div className="s">서명·보험료 납입</div>
            </div>
            <div className="event-guide-step">
              <div className="ic">📄</div>
              <div className="t">증권 발송</div>
              <div className="s">가입 완료</div>
            </div>
          </div>
        </div>

        {/* 6. Q&A */}
        <div className="event-guide-sec">
          <h2>자주 묻는 질문</h2>
          <div className="event-guide-qa">
            <details>
              <summary>행사주최자 배상책임보험과 행사종합보험은 어떻게 다른가요?</summary>
              <div className="a">
                배상책임보험은 관람객(제3자)에 대한 <b>대인·대물 배상책임</b>만 보장합니다.
                행사종합보험은 여기에 더해 <b>행사 취소·연기·변경으로 생기는 비용 손실</b>까지
                포괄적으로 담보하는 더 넓은 상품입니다.
              </div>
            </details>
            <details>
              <summary>보험사별로 조건과 보험료가 다른가요?</summary>
              <div className="a">
                네. 보험회사마다 <b>인수지침과 요율이 다릅니다.</b> 세부 조건을 확인한 뒤
                가입하셔야 하며, 비즈밸리가 인수 가능한 보험사로 비교견적을 보내드립니다.
              </div>
            </details>
            <details>
              <summary>공연 가수·배우·스탭도 보장되나요?</summary>
              <div className="a">
                주최 측에 <b>고용된 근로자(진행요원·안전요원 등)</b>가 업무 중 입은 신체손해는
                보통약관상 <b>보상 대상에서 제외</b>되며, 별도 상해·여행자보험으로 보완해야 합니다.
                다만 <b>자원봉사자·공연자(가수·배우·아나운서 등) 및 그 보조자는 일부 보험회사에서
                보상되는 경우</b>가 있어, 해당 인원이 있는 행사는 보상 가능한 보험사로 견적을
                안내해 드립니다.
              </div>
            </details>
            <details>
              <summary>그렇다면 staff는 어떻게 보장받을 수 있나요?</summary>
              <div className="a">
                행사 진행요원·안전요원·자원봉사자 등 staff의 상해는{' '}
                <b>단체여행자보험(단체상해보험)</b>으로 준비하는 것이 일반적입니다. 행사 기간에
                맞춰 <b>하루 단위로도 가입</b>할 수 있어 인원이 많아도 비용 부담이 적습니다.
                비즈밸리가 함께 운영하는 여행자보험 전문 사이트 <b>투어밸리</b>에서 단체 단위로
                간편하게 가입하실 수 있습니다.
                <a
                  className="event-guide-qlink"
                  href="https://www.tourvalley.net"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  투어밸리에서 단체보험 가입하기 →
                </a>
              </div>
            </details>
            <details>
              <summary>행사장 주변 노점에서 사 먹고 배탈이 나면 보장되나요?</summary>
              <div className="a">
                아닙니다. 음식물배상·치료비 특약에 가입했더라도,{' '}
                <b>주최 측 점유를 벗어난 노점 음식</b>으로 인한 사고는 보상되지 않습니다. (주최
                측이 제공한 음식물의 식중독은 음식물배상 특약으로 보장 가능합니다.)
              </div>
            </details>
            <details>
              <summary>참가자치료비(치료비 특약)는 꼭 가입해야 하나요?</summary>
              <div className="a">
                필수는 아니지만, <b>주최 측 과실이 없어도 참가자 치료비를 보상</b>하는 담보라
                실무상 매우 유용합니다. 가급적 함께 가입하시길 권합니다.
              </div>
            </details>
            <details>
              <summary>불꽃놀이 행사도 가입되나요?</summary>
              <div className="a">
                보험사 인수 조건에 따라 <b>가능한 곳도, 불가능한 곳도</b> 있습니다. 비즈밸리는 인수
                가능한 보험사로 견적을 보내드립니다. 다만 위험률이 높으면 보험료·자기부담금이
                달라질 수 있습니다.
              </div>
            </details>
            <details>
              <summary>당일 가입도 가능한가요?</summary>
              <div className="a">
                행사 시작 <b>최소 2시간 전</b>까지 신청하셔야 가입이 가능합니다. 위험활동이
                포함되어 인수심사가 필요하면 당일 가입은 어려울 수 있으니, <b>가급적 행사 1일 전</b>
                까지 신청해 주세요.
              </div>
            </details>
          </div>
        </div>

        {/* 7. 마감 안내 + CTA */}
        <div className="event-guide-deadline">
          <div className="ic">⏰</div>
          <div className="tx">
            신청은 <b>행사 시작 2시간 전</b>까지 가능합니다. 위험활동이 포함된 행사는 인수심사가
            필요하니 <b>행사 1일 전</b>까지 신청을 권장합니다.
          </div>
        </div>

        <div className="event-guide-cta">
          <h3>지금 견적을 받아보세요</h3>
          <p>서류 준비가 안 되어 있어도 우선 신청하면 담당자가 안내해 드립니다.</p>
          <Link className="btn" href="/event-insurance">
            행사보험 견적신청하기 →
          </Link>
          <span className="call">
            문의: 고객센터 1599-2541 · admin@tourvalley.net · 팩스 02-2261-0098
          </span>
        </div>

        <p className="event-guide-disc">
          ※ 본 안내는 상품 이해를 돕기 위한 요약입니다. 담보·한도·보장 여부 등 자세한 내용은 반드시
          보험회사 약관을 참조하시기 바랍니다.
        </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="event-guide-page event-guide-page--mobile">
        <Header isMobile={true} />
        <main className="event-guide-main-m">{guideContent}</main>
        <Footer isMobile={true} />
      </div>
    );
  }

  return (
    <div className="event-insurance-page-pc event-guide-page">
      <Header isMobile={false} onOpenAccidentFreeCashModal={() => setShowCashModal(true)} />

      <main
        className="event-insurance-pc-main"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* 오른쪽 버튼 (페이지와 함께 스크롤, 국내여행 PC와 동일 패턴) */}
        <div className="container_box_w">
          <Link href="/event-insurance">
            <div className="fixedRight_b01">
              <p className="fixedRight_txt01">
                행사주최자배상
                <br />
                책임보험 안내
              </p>
            </div>
          </Link>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowServiceModal(true);
            }}
          >
            <div className="fixedRight_b02">
              <p className="icon_menu">
                <span className="icon_menu01" />
              </p>
              <p className="fixedRight_txt02">
                서비스
                <br />
                전체보기
              </p>
            </div>
          </a>
        </div>

        {guideContent}
      </main>

      <Footer isMobile={false} />

      <ServiceModal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} />
      <AccidentFreeCashModal isOpen={showCashModal} onClose={() => setShowCashModal(false)} />
    </div>
  );
}
