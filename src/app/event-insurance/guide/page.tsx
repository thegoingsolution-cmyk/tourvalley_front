'use client';

import './page.css';

export default function EventInsuranceGuidePage() {
  return (
    <div id="isbwrapper">
      {/* 레이어 헤더 */}
      <header id="header">
        <div className="layer_header prow_01">
          <span className="layer_title">행사주최자 배상책임보험 상품안내</span>
          <a href="#" onClick={(e) => { e.preventDefault(); window.close(); }} className="close">
            <img src="/icons/ico_btn_close_bl.png" alt="닫기" />
          </a>
        </div>
      </header>
      
      {/* 본문 */}
      <div id="contentWrap">
        <section className="tourGuard_bg ag_center prow_01">
          <div className="tourGuard_Topbg01">

            {/* 행사주최자 배상책임보험이란? */}
            <div>
              <ul className="tourG_Wrap tourG_mat11 ag_left">
                <li className="tour2023_txt42">행사주최자 배상책임보험이란?</li>
                <li className="tour2023_txt32 tourG_mat22">
                  피보험자가 행사개요서 상의 행사 진행시 진행상의 과실이나 행사시설 등의 하자로 인해 발생한 제3자(관람객)에 대한 대인, 대물에 대한 배상책임을 보장하는 보험입니다.
                </li>
              </ul>
            </div>

            <div>
              <ul className="tourG_Wrap tourG_mat12 ag_left">
                <li className="tour2023_txt32 tour2023_blue">
                  ◎ 피보험자 : 행사를 주최하는 법인 또는 단체<br/>(행정관서, 지방자치단체, 기획/대행자, 공연장 시설소유업체 등)<br/><br/>
                  ◎ 행사 : 지역축제, 공연, 콘서트. 박람회, 체육행사, 불꽃놀이 등<br/><br/>
                  ◎ 보장대상 : 행사를 체험하는 제3자(관람객-불특정 다수)를 보장대상으로 합니다.<br/><br/>
                  ◎ 사례: <br/>
                  <div className="tour2023_event_Box tourG_mat27">
                    <p className="tour2023_txt32 tour2023_blue">
                      1) 행사 장소에 가이드 라인이 부적절하게 설치되어 시설물이 근처에 있던 관람객쪽으로 넘어져 관람객이 다치거나 및 관람객의 차량이 파손된 경우<br/>
                      2) 행사 참여 중 낙상사고가 발생한 경우<br/>
                      3) 행사종료 후 불꽃 피날레 중 날라온 불씨에 화상사고를 입은 경우 등<br/>
                    </p>
                  </div>
                  <br/>
                  ※ 주요 보장하지 않는 손해: <br/>
                  <div className="tour2023_event_Box tourG_mat27">
                    <p className="tour2023_txt32 tour2023_blue">
                      1) 행사진행요원, 아르바이트생, 공연팀, 체육대회 선수, 자원봉사자 등 행사 진행 스탭(Staff)이 입은 손해 <span className="tour2023_red"> → 별도로 여행자보험 또는 상해보험 가입시 보상가능</span><br/>
                      2) 피보험자가 소유, 점유, 임차, 사용하거나 보호, 관리, 통제하는 재물이 손해를 입었을 경우 그 재물에 대하여 정당한 권리를 가진 사람에게 부담하는 손해에 대한 배상책임<br/>
                      3) 행사에서 섭취한 음식물로 인한 사고(식중독 등)<br/>
                      4) 행사 장소 이동 중 사고로 인한 손해<br/><br/>
                      <span className="tour2023_red">※ 기타 자세한 보장내용은 반드시 약관을 참조하시기 바랍니다.</span><br/>
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* 치료비 특별약관이란? */}
            <div>
              <ul className="tourG_Wrap tourG_mat11 ag_left">
                <li className="tour2023_txt42">치료비 특별약관이란?</li>
                <li className="tour2023_txt32 tourG_mat22">
                  행사주최자 배상책임보험의 특별약관으로서 행사지역내에서 발생한 행사 수행에 따른 우연한 사고로 인하여 타인이 입은 신체장해에 대한 <span className="tour2023_red">치료비를 보상</span>합니다. 행사주최자의 과실이나 잘못이나 과실이 없어도 보상이 가능합니다.<br/>
                  <div className="tour2023_event_Box tourG_mat06">
                    <p className="tour2023_txt32">치료비라 함은 응급처치, 구급차, 입원, 치료, 수술, 영상촬영 등 제반검사, 병원이 실시한 간호비를 포함합니다. </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* 보험료 산출 기준 */}
            <div>
              <ul className="tourG_Wrap tourG_mat11 ag_left">
                <li className="tour2023_txt42">보험료 산출 기준</li>
                <li className="tour2023_txt32 tourG_mat22">행사기간 동안 총 예상참여인원수, 보험기간, 위험요소 등</li>
              </ul>
            </div>

            {/* 견적신청 필수 서류 */}
            <div>
              <ul className="tourG_Wrap tourG_mat11 ag_left">
                <li className="tour2023_txt42">견적신청 필수 서류</li>
                <li className="tour2023_txt32">
                  <div className="tour2023_event_Box tourG_mat27">
                    <p className="tour2023_txt32 tour2023_blue">
                      1) 사업자등록증(고유번호증)<br/>
                      2) 행사개요서(행사계획서)
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* 보험가입절차 */}
            <div>
              <ul className="tourG_Wrap tourG_mat11 ag_left">
                <li className="tour2023_txt42">보험가입절차</li>
              </ul>
              <ul className="tourGuard_btn_bw">
                <li>
                  <div className="tour2023_event_Box01 tourG_mat06">
                    <p className="tour2023_txt32 ag_center">견적신청</p>
                  </div>
                </li>
                <li className="tour2023_event_arrow tourGuard_gray">▶</li>
                <li>
                  <div className="tour2023_event_Box01 tourG_mat06">
                    <p className="tour2023_txt32 ag_center">견적서발송<br/>(비교견적가능)</p>
                  </div>
                </li>
                <li className="tour2023_event_arrow tourGuard_gray">▶</li>
                <li>
                  <div className="tour2023_event_Box01 tourG_mat06">
                    <p className="tour2023_txt32 ag_center">청약서 서명<br/>보험료 납입</p>
                  </div>
                </li>
                <li className="tour2023_event_arrow tourGuard_gray">▶</li>
                <li>
                  <div className="tour2023_event_Box01 tourG_mat06">
                    <p className="tour2023_txt32 ag_center">증권발송</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Q&A */}
            <div>
              <ul className="tourG_Wrap tourG_mat11 ag_left">
                <li className="tour2023_txt42">Q&A</li>
              </ul>
              <ul className="tourG_Wrap tourG_mat04 ag_left">
                <li className="tourGuard_txt08 tour2023_blue">Q. 행사주최자 배상책임보험과 행사종합보험은 어떻게 다른가요?</li>
                <li className="tour2023_txt32 tourG_mat22">A. 행사주최자 배상책임보험은 영업배상책임보험의 하나로 행사를 주최하는 자(피보험자)가 행사개요서 상의 행사 진행시 진행상의 과실이나 행사시설 등의 하자로 인해 발생한 제3자(관람객)에 대한 대인, 대물에 대한 배상책임을 보장하는 보험입니다. 행사종합보험은 이보다 넓은 범위를 보장하는 보험으로 배상책임보험의 보장내용을 포함하고 행사 취소, 연기, 변경됨으로서 발생되는 비용손실을 포괄적으로 담보하는 보험상품입니다. </li>
              </ul>
              <ul className="tourG_Wrap tourG_mat04 ag_left">
                <li className="tourGuard_txt08 tour2023_blue">Q. 보험회사별로 인수조건과 보험료가 차이가 있나요?</li>
                <li className="tour2023_txt32 tourG_mat22">A. 네. 행사주최자 배상책임보험은 보험회사별로 인수지침이 다르며 요율도 다릅니다. 따라서 보험에 가입하실 때 세부조건을 확인하신 후 가입하셔야 합니다. </li>
              </ul>
              <ul className="tourG_Wrap tourG_mat04 ag_left">
                <li className="tourGuard_txt08 tour2023_blue">Q. 공연에 참가하는 가수나 배우, STAFF 등은 보장대상에서 제외되나요?</li>
                <li className="tour2023_txt32 tourG_mat22">A. 네. 행사주최자 배상책임보험은 보통약관에서 피보험자(행사주최자)의 근로자 또는 고용된자(진행요원, 안전요원 등을 포함)는 보상대상에서 제외하고 있습니다. <span className="tour2023_red"> 따라서 보상을 받기 위해서는 별도로 여행자보험이나 상해보험에 가입해야 합니다.</span> </li>
              </ul>
              <ul className="tourG_Wrap tourG_mat04 ag_left">
                <li className="tourGuard_txt08 tour2023_blue">Q. 행사장 주변에서 노점상에서 음식을 사서 먹고 배탈이 난 경우 보장이 되나요?</li>
                <li className="tour2023_txt32 tourG_mat22">A. 아닙니다. 치료비 특별약관에 가입하였다 하더라도 행사장 주변 노점상 등에서 음식물을 사서 드시는 경우 피보험자의 점유를 벗어난 음식물로 보아 보상이 되지 않습니다. </li>
              </ul>
              <ul className="tourG_Wrap tourG_mat04 ag_left">
                <li className="tourGuard_txt08 tour2023_blue">Q. 치료비 특별약관은 반드시 가입해야 하나요?</li>
                <li className="tour2023_txt32 tourG_mat22">A. 아닙니다. 치료비 특별약관은 행사주최자 배상책임보험의 특별약관으로서 반드시 가입해야 하는 것은 아닙니다. <span className="tour2023_red"> 그러나 치료비 특별약관은 행사주최자의 과실이나 잘못이 없는 경우에도 행사참여자가 신체상해를 입어 치료비를 받으면 보험가입금액 한도내에서 보상이 가능합니다. </span>가급적 가입하는 것이 좋습니다. </li>
              </ul>
              <ul className="tourG_Wrap tourG_mat04 ag_left">
                <li className="tourGuard_txt08 tour2023_blue">Q. 불꽃놀이 행사도 보험가입이 되나요?</li>
                <li className="tour2023_txt32 tourG_mat22">A. 보험회사 인수조건에 따라 가입이 가능할 수 있습니다. 인수가 가능한 보험회사가 있고 불가능한 회사가 있습니다. 투어밸리에서는 가입이 가능한 보험사로 견적서를 보내드리고 있습니다. 다만 이 경우에도 위험률이 높은 경우 보험료가 높아질 수 있고 자기부담금도 달라질 수 있습니다. </li>
              </ul>
              <ul className="tourG_Wrap tourG_mat04 ag_left">
                <li className="tourGuard_txt08 tour2023_blue">Q. 당일 가입도 가능한가요?</li>
                <li className="tour2023_txt32 tourG_mat22">A. 행사시작 최소 2시간전까지는 신청을 해주셔야 가입이 가능합니다. 위험활동 등이 포함되어 있어 인수심사가 필요한 경우에는 불가능할 수도 있습니다. 가급적 행사1일전까지 신청해 주시기 바랍니다. </li>
                <li>
                  <br/><br/>
                  <span className="tour2023_red">※ 기타 자세한 보장내용은 반드시 약관을 참조하시기 바랍니다.</span>
                </li>
              </ul>
            </div>
            <div className="tourG_mat23 tourG_Wrap"></div>
          </div>
        </section>
        
        {/* 하단 고정버튼 */}
        <section id="tour2023_fixedBanner">
          <div className="tour2023_bottom_btn">
            <a href="#" onClick={(e) => { e.preventDefault(); window.close(); }} className="tour2023_btn_b tour2023_btn07">확인</a>
          </div>
        </section>
      </div>
    </div>
  );
}

