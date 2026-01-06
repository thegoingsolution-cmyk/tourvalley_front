'use client';

import React, { useState } from 'react';
import '../../popup/page.css';

export default function DomesticInsuranceStep4Page() {
  const [agree1, setAgree1] = useState('');
  const [agree2, setAgree2] = useState('');
  const [agree3, setAgree3] = useState('');
  const [agree4, setAgree4] = useState('');
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [allAgree, setAllAgree] = useState(false);
  const [finalAgree1, setFinalAgree1] = useState(false);
  const [finalAgree2, setFinalAgree2] = useState(false);
  const [finalAgree3, setFinalAgree3] = useState(false);
  const [finalAgree4, setFinalAgree4] = useState(false);

  const handleNextStep = () => {
    // 1. 여행기간 중 아래의 위험한 활동이 포함되어 있습니까?
    if (!agree1) {
      alert('1번 항목을 선택해주세요.');
      return;
    }
    if (agree1 === 'Y') {
      alert('죄송합니다. 고객님\n여행보험에 가입할 수 없습니다.');
      return;
    }

    // 2. 실손 의료보험 계약체결을 위한 사전 동의
    if (agree2 !== 'Y') {
      alert('2번 항목의 실손 의료보험 계약체결을 위한 사전 동의를 해주세요.');
      return;
    }

    // 3. 여행보험 약관보기
    if (agree3 !== 'Y') {
      alert('3번 항목의 여행보험 약관보기를 읽어보고 선택해주세요.');
      return;
    }

    // 4. 여행보험 가입시 알아두어야 할 사항
    if (agree4 !== 'Y') {
      alert('4번 항목의 여행보험 가입시 알아두어야 할 사항을 읽어보고 선택해주세요.');
      return;
    }

    // 모든 조건이 충족되면 최종 동의 모달 표시
    setShowFinalModal(true);
  };

  const handleAllAgreeChange = (checked: boolean) => {
    setAllAgree(checked);
    setFinalAgree1(checked);
    setFinalAgree2(checked);
    setFinalAgree3(checked);
    setFinalAgree4(checked);
  };

  const handleFinalSubmit = () => {
    if (!finalAgree1 || !finalAgree2 || !finalAgree3 || !finalAgree4) {
      alert('모든 항목에 동의해주세요.');
      return;
    }

    // 5단계로 이동
    window.location.href = '/group-insurance/domestic/step5';
  };

  const handleBack = () => {
    window.history.back();
  };

  const openConsentPopup = (url: string, name: string) => {
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  return (
    <div className="speed_Wrap" style={{ background: '#fff' }}>
      <section className="tour2023_pc_SpeedTop_w">
        <div className="tour2023_pc_SpeedTop">
          <p className="tour2023_pc_SpeedTop_icon"></p>
          <p className="tour2023_pc_SpeedTop01">
            <span className="tour2023_pc_SpeedTop_title">
              단체여행자보험<em className="tour2023_pc_SpeedTop_title01">(법인/단체)</em>
            </span>
            <span className="tour2023_pc_SpeedTop_title02">
              사업자등록증(고유번호증) 있는 법인/단체 포괄회원 가입으로 보다 편리하게 이용하실 수 있습니다.
            </span>
          </p>
          <a className="close" href="javascript:window.close();">
            닫기
          </a>
        </div>
      </section>

      <div className="speed_content">
        <div className="con01">
          <div className="tour2023_pc_menu_wrap tourG_mat05 tourG_mab05">
            <span className="menu on">
              <a href="/group-insurance/domestic/popup">국내여행자보험</a>
            </span>
            <span className="menu">
              <a href="/group-insurance/overseas/popup">해외여행자보험</a>
            </span>
            <span className="menu">
              <a href="/group-insurance/longstay/popup">해외장기체류보험</a>
            </span>
          </div>
        </div>

        <div className="con01">
          <div className="bgcolor_white">
            <p className="sub_title_02 ag_left pt10">4단계 : 설문서 작성</p>

            {/* 1. 여행기간 중 아래의 위험한 활동이 포함되어 있습니까? */}
            <p className="sub_title_s ag_left pt30">
              <strong>1. 여행기간 중 아래의 위험한 활동이 포함되어 있습니까?</strong>
            </p>
            <div className="ccs_tbl v2 ty2">
              <div className="ccs_tbl_cont">
                <div className="ccs_rdo_area">
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="c01"
                      value="Y"
                      name="agree1"
                      checked={agree1 === 'Y'}
                      onChange={(e) => setAgree1(e.target.value)}
                    />
                    <label htmlFor="c01">예</label>
                  </span>
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="c02"
                      value="N"
                      name="agree1"
                      checked={agree1 === 'N'}
                      onChange={(e) => setAgree1(e.target.value)}
                    />
                    <label htmlFor="c02">아니요</label>
                  </span>
                </div>
              </div>
            </div>
            <div className="Box_line02 mtb15 mt15">
              <p className="txt">
                <span className="font_blue01">
                  ① 스쿠버다이빙 ② 행글라이딩,패러글라이딩 ③ 스카이다이빙 ④ 수상스키 ⑤ 자동차,오토바이 경주{' '}
                </span>
                ⑥ 번지점프 ⑦ 빙벽,암벽등반 ⑧ 제트스키 ⑨ 래프팅{' '}
                <span className="font_red">
                  <strong>⑩ 스키(스노보드)</strong>
                </span>{' '}
                ⑪ 운동경기참여(전지훈련,대회,시합)
              </p>
            </div>

            {/* 2. 실손 의료보험 계약체결을 위한 사전 동의 */}
            <p className="sub_title_s ag_left pt30">
              <strong>2. 실손 의료보험 계약체결을 위한 사전 동의</strong>
            </p>
            <div className="Box_line02">
              <p className="txt">
                보험감독규정 제4-31조의 3에 따라 실손 의료보험 계약체결 전에 비례보상에 대한 안내 후 가입동의를
                확인하고자 합니다. 실손 의료보험 계약을 체결하고 있으신 경우, 당사의 여행보험을 가입하고 여행 중
                발생한 사고로 국내에서 치료받으시는 경우, 각 보험사는 보상대상의료비 및 보상책임액에 따라
                비례분담액을 지급합니다.
              </p>
            </div>
            <p className="sub_title_s ag_left pt10">
              의료비보험의 중복과 비례보상의 내용을 확인하시고, 여행보험(실손 의료비보험) 가입에 동의하십니까?
            </p>
            <div className="ccs_tbl v2 ty2">
              <div className="ccs_tbl_cont">
                <div className="ccs_rdo_area">
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="d01"
                      value="Y"
                      name="agree2"
                      checked={agree2 === 'Y'}
                      onChange={(e) => setAgree2(e.target.value)}
                    />
                    <label htmlFor="d01">예</label>
                  </span>
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="d02"
                      value="N"
                      name="agree2"
                      checked={agree2 === 'N'}
                      onChange={(e) => setAgree2(e.target.value)}
                    />
                    <label htmlFor="d02">아니요</label>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. 여행보험 약관보기 */}
            <p className="sub_title_s ag_left pt30">
              <strong>3. 여행보험 약관보기</strong>
            </p>
            <a
              href="/pdf/ACE손해_국내여행보험약관.pdf"
              target="_blank"
              download="ACE손해_국내여행보험약관.pdf"
            >
              <div className="Box_line03">
                <p className="txt">
                  국내여행보험 약관보기<span className="btn_view"></span>
                </p>
              </div>
            </a>
            <p className="sub_title_s ag_left pt10">국내여행 약관을 읽어보셨습니까?</p>
            <div className="ccs_tbl v2 ty2">
              <div className="ccs_tbl_cont">
                <div className="ccs_rdo_area">
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="e01"
                      value="Y"
                      name="agree3"
                      checked={agree3 === 'Y'}
                      onChange={(e) => setAgree3(e.target.value)}
                    />
                    <label htmlFor="e01">예</label>
                  </span>
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="e02"
                      value="N"
                      name="agree3"
                      checked={agree3 === 'N'}
                      onChange={(e) => setAgree3(e.target.value)}
                    />
                    <label htmlFor="e02">아니요</label>
                  </span>
                </div>
              </div>
            </div>

            {/* 4. 여행보험 가입시 알아두어야 할 사항 */}
            <p className="sub_title_s ag_left pt30">
              <strong>4. 여행보험 가입시 알아두어야 할 사항</strong>
            </p>
            <div style={{ textAlign: 'center' }}>
              <div className="polWrap" style={{ width: '96%', textAlign: 'left' }}>
                <div
                  className="yakgwan"
                  style={{
                    width: 'calc(100% - 20px)',
                    margin: '10px 0 7px',
                    padding: '10px',
                    height: '100px',
                    border: '1px solid #ddd',
                    fontSize: '1em',
                    overflowY: 'scroll',
                    backgroundColor: '#fff',
                  }}
                >
                  <span className="pol_head2">
                    <strong>보험계약을 청약할 때에는 약관상의 보험계약자 권리나 의무사항을 확인하시고, 다음 사항에 유의하시기 바랍니다.</strong>
                    <br /><br />
                    <span className="t_blue">1. 보험가입 시, 주의사항</span><br /><br />
                    - 보험계약 체결 전 상품설명서 및 약관을 반드시 읽어보시기 바랍니다.<br />
                    - 보험계약자가 기존 보험계약을 해지하고 새로운 보험계약을 체결하는 경우, 보험인수가 거절되거나 보험료가 인상될 수 있으며, 보장내용(면책기간 재 적용 등)이 달라질 수 있습니다.<br />
                    - 보험료를 내신 후에는 회사가 발행 한 소정의 양식(청약서, 상품설명서, 보험증권)을 받으시기 바랍니다.<br />
                    - 보험료가 납입 되지 않을 경우 손해발생시 보상을 받을 수 없습니다.<br />
                    - 보험계약 청약 시 기재사항을 사실대로 빠짐없이 작성하고 자필 서명하셔야 합니다.<br />
                    - 보험기간 중에 발생한 사고 및 질병에 한하여 보상하며, 보상받을 수 있는 경우와 보상받을 수 없는 경우를 확인하셔야 합니다.<br />
                    <br />
                    <span className="t_blue">2. 알릴 의무</span><br />
                    계약 전 알릴 의무
                    - 계약자 또는 피보험자는 청약할 때 청약서에서 질문한 사항에 대하여 알고 있는 사실을 반드시 사실대로 알려야 하며 만약 사실대로 알리지 아니하였을 경우 보험금의 지급이 거절되거나 계약이 해지될 수 있습니다.
                    계약 후 알릴 의무
                    - 계약자 또는 피보험자는 보험계약을 맺은 후 피보험자의 직업 또는 직무변경으로 인한 위험 증가 및 주소 변경 등 보험약관에 정한 계약 후 알릴 의무 사항이 발생하였을 경우 지체 없이 회사에 알리고 보험증권에 확인을 받아야 합니다. 그렇지 않을 경우 보험금의 지급이 거절되거나 계약이 해지될 수 있습니다.
                    <br />
                    <span className="t_blue">3. 사고발생 시, 조치요청</span><br />
                    상해/질병사고 발생 시<br />
                    - 에이스손해보험 고객센터 전화 (82-2-1566-5800)<br />
                    - 의료기관 예약, 방문 치료한 경우 병원 진단서, 치료비 영수증 등을 준비<br />
                    - 약국에서 약을 구입하여 복용한 경우 영수증 및 처방전을 구비<br />
                    휴대품 도난사고 발생 시<br />
                    - 도난사고 발생사실을 인근 경찰서에 신고, 도난품 명세서 등을 작성 후 구비(물품 구입시 영수증 첨부)<br />
                    - 공항에서 수하물 도난 시에는 공항안내소에 신고하여 확인증 꼭 받아둠<br />
                    - 호텔에서 도난사고 발생 시에는 프론트에 신고하여 확인증 받아둠<br />
                    - 경찰서 등에 신고할 수 없는 경우에는 목격자를 확보하여 육하원칙에 의거 진술서를 받아둠<br />
                    배상책임 발생 시<br />
                    - 제3자의 신체/재물 손해를 증명하는 서류 및 병원치료비 영수증/손상물 견적서, 사고사실 확인서를 받아둠<br />
                    <br />
                    <span className="t_blue">4. 보험금을 지급하는 사유</span><br />
                    - 피보험자가 보험증권에 기재된 여행을 목적으로 주거지를 출발하여 여행을 마치고 주거지에 도착할 때까지의 보험기간 중에 상해의 직접결과로써 사망한 경우(질병으로 인한 사망은 제외), 사망보험금을 지급하고 장해지급률에 해당하는 장해상태가 되었을 때 후유장해보험금(장해분류표에서 정한 지급률을 보험가입금액에 곱하여 산출한 금액)을 지급하여 드립니다. 다수계약이 체결되어 있는 경우에는 회사는 해당약관에 따라 비례 보상합니다.<br />
                    <br />
                    <span className="t_blue">5. 보험금을 지급하지 아니하는 사유</span><br />
                    - 계약자, 피보험자, 보험 수익자의 고의<br />
                    - 피보험자의 임신, 출산(제왕절개 포함), 산후기<br />
                    - 전쟁, 외국의 무력행사, 혁명, 내란, 사변, 폭동<br />
                    - 전문등반, 글라이더 조종, 스카이다이빙, 스쿠버다이빙, 행글라이딩, 수상보트, 패러글라이딩<br />
                    - 모터보트, 자동차 또는 오토바이에 의한 경기, 시범, 흥행 또는 시운전 등<br />
                    - 선박승무원, 어부, 사공, 그 밖에 선박에 탑승하는 것을 직무로 하는 사람이 직무상 선박에 탑승하고 있는 동안<br />
                    * 기타 세부 담보별 보험금을 지급하지 않는 사유는 반드시 약관을 참조하시기 바랍니다.<br />
                    <br />
                    <span className="t_blue">6. 청약의 철회</span><br />
                    - 계약자는 보험증권을 받은 날부터 15일 이내에 그 청약을 철회할 수 있습니다. 다만, 진단계약 보험기간이 1년 미만, 전문보험계약자가 체결한 계약 또는 청약한 날부터 30일 초과된 계약은 청약을 철회할 수 없습니다.<br />
                    <br />
                    <span className="t_blue">7. 계약의 취소</span><br />
                    - 계약체결 시 약관 및 계약자 보관용 청약서를 청약할 때 계약자에게 전달하지 않거나 약관의 중요한 내용을 설명하지 않은 때 또는 계약을 체결할 때 계약자가 청약서에 자필서명(날인(도장을 찍음) 하지 않은 때에는 계약이 성립한 날부터 3개월 이내에 계약을 취소할 수 있습니다. 계약이 취소된 경우에는 회사는 이미 납입한 보험료를 계약자에게 돌려 드리며, 보험료를 받은 기간에 대하여 '보험개발원이 공시하는 보험계약대출이율'을 연단위 복리로 계산한 금액을 더하여 지급합니다.<br />
                    <br />
                    <span className="t_blue">8. 보험료 세액공제</span><br />
                    - 소득세법 제 52조 1항2호에 의거 당해 연도에 급여액에서 연간 100만원까지 보험료 세액공제 혜택을 받으실 수 있습니다.<br />
                    <br />
                    <span className="t_blue">9. 계약의 해지 및 보험료의 환급</span><br />
                    - 계약자는 계약이 소멸하기 전에는 언제든지 계약의 일부 또는 전부를 해지할 수 있으며, 계약의 해지 시 보험기간 중 남은 미경과 기간에 대한 해지 환급금을 돌려 드리므로 해지 환급금이 원래 납입하신 보험료보다 적거나 없을 수 있습니다.<br />
                    <br />
                    <span className="t_blue">10. 계약의 무효</span><br />
                    - 다음 중 한가지에 해당되는 경우에는 계약을 무효로 하며 이미 납입한 보험료를 돌려드립니다.<br />
                    - 만 15세 미만자, 심신상실자 또는 심신박약한자의 사망을 보험금 지급사유로 한 경우<br />
                    - 타인의 사망을 보험금 지급사유로 하는 계약서에서 계약을 체결할 때까지 피보험자의 서면에 의한 동의를 얻지 않은 경우<br />
                    - 계약을 체결할 때 계약에서 정한 피보험자의 나이에 미달되었거나 초과되었을 경우<br />
                    <br />
                    <span className="t_blue">11. 전환 계약 시 유의사항</span><br />
                    - 보험계약자가 기존에 체결했던 보험계약을 해지 후 신 계약 체결 시, 보험인수가 거절되거나 보험료가 인상되거나 보장내용이 달라질 수 있습니다.<br />
                    <br />
                    <span className="t_blue">12. 상담, 안내 및 분쟁해결</span><br />
                    가입하신 보험에 관하여 상담이 필요하거나 불만사항이 있을 때에는 에이스손해보험 고객 서비스 팀으로 연락하여 주시기 바라며, 처리결과에 이의가 있으시면 금융감독원에 민원 또는 분쟁조정 등을 신청하실 수 있습니다.<br />
                    에이스손해보험 고객 서비스 팀 연락처<br />
                    - TEL:(02)1566-5800<br />
                    - (08213) 서울시 구로구 경인로610, 11층 에이스고객서비스센터(신도림동413-9번지, 코리아빌딩)<br />
                    금융감독원 연락처<br />
                    - TEL:국번 없이 1332<br />
                    - 인터넷: www.fss.or.kr<br />
                    - 서울시 영등포구 여의대로 97 (우편번호 150-743)<br />
                    <br />
                    <span className="t_blue">13. 금융감독원 보험범죄 신고센터</span><br />
                    보험범죄는 형법 제347조(사기)에 의거 10년 이하의 징역이나 2천 만원 이하의 벌금에 처해지며, 보험범죄를 교사한 경우에도 동일한 처벌을 받을 수 있습니다.<br />
                    - 인터넷: 금융감독원 홈페이지(www.fss.or.kr) 내 「보험범죄신고센터」<br />
                    - 인터넷 보험범죄신고센터(insucop.fss.or.kr)<br />
                    - TEL(전용): 1588-3311<br />
                    <br />
                    <span className="t_blue">14. 비례보상</span><br />
                    실손의료보험은 실제 의료비를 보상하는 상품으로서 2개 이상의 보험에 가입하더라 도 다음과 같은 방법으로 비례보상되므로 유사한 보험가입 여부 및 보상한도를 반드시 확인하시기 바랍니다.<br />
                    <br />
                    <span className="t_blue">15. 보험모집질서 확립 및 신고센터</span><br />
                    보험계약과 관련한 보험모집질서 문란행위는 보험업법에 의해 처벌받을 수 있습니다.<br />
                    - 금융감독원 보험 모집질서 위반행위 신고센터험<br />
                    - TEL:1332/인터넷:<a href="http://nws.fss.or.kr" target="_blank">nws.fss.or.kr</a><br />
                    - 사고접수, 보험처리 등 보험계약 관련 문의 (에이스아메리칸화재해상보험주식회사, 처브그룹 컴퍼니)<br />
                    - TEL:1566-5800/인터넷: <a href="https://www2.chubb.com/kr-kr/" target="_blank">www.chubb.com/kr</a><br />
                    <br />
                    * 예금자보호 안내<br />
                    - 이 보험계약은 예금자보호법에 따라 예금보험공사가 보호하되, 보호 한도는 본 보험회사에 있는 귀하의 모든 예금보호대상 금융상품의 해약환급금(또는 만기 시 보험금이나 사고보험금)에 기타지급금을 합하여 1인당 "최고 5천만원"이며, 5천만원을 초과하는 나머지 금액은 보호하지 않습니다. 다만, 보험계약자 및 보험료 납부자가 법인인 보험계약은 예금자보호법에 따라 예금보험공사가 보호하지 않습니다.<br />
                    * 개인정보 보호안내<br />
                    - 보험계약자에게는 법에서 정한 경우를 제외하고 본인의 동의없이 본인의 개인정보가 제3자에게 제공 이용되지 않을 권리가 있습니다.<br />
                    * 의료급여 수급권자 보험료 할인안내<br />
                    - 의료급여 수급권자에 해당하는 피보험자가 실손의료보험(담보) 가입시 보험료 10%할인 적용 됩니다. 단, 의료급여 수급권자를 증명할 수 있는 서류를 제출한 경우에 한함.<br />
                    * 비급여 진료비 비교 관련 안내<br />
                    - 비급여 진료비 가격은 의료기관별로 상이하므로 가격비교를 통해 실손의료보험에서 고객님이 부담하시는 비용을 절감하실 수 있습니다. 의료기관별 비급여 진료비 가격은 건강보험심사평가원 홈페이지에서 확인 가능합니다.<br />
                    - 인터넷: www.hair.or.kr → 정보 → 비급여 진료비 정보<br />
                  </span>
                </div>
              </div>
            </div>
            <p className="sub_title_s ag_left pt10">
              위의 여행보험 계약시 알아두어야 할 사항을 숙지하고 동의하십니까?
            </p>
            <div className="ccs_tbl v2 ty2">
              <div className="ccs_tbl_cont">
                <div className="ccs_rdo_area">
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="f01"
                      value="Y"
                      name="agree4"
                      checked={agree4 === 'Y'}
                      onChange={(e) => setAgree4(e.target.value)}
                    />
                    <label htmlFor="f01">예</label>
                  </span>
                  <span className="ccs_inp_rdo">
                    <input
                      type="radio"
                      id="f02"
                      value="N"
                      name="agree4"
                      checked={agree4 === 'N'}
                      onChange={(e) => setAgree4(e.target.value)}
                    />
                    <label htmlFor="f02">아니요</label>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="con_btnWrap mt30 mb10">
            <a href="#" onClick={(e) => { e.preventDefault(); handleNextStep(); }}>
              다음단계
            </a>
          </div>
          <div className="con_btnWrap_b mb40">
            <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>
              이전단계
            </a>
          </div>
        </div>

        {/* 심의번호 */}
        <section className="ss_number_w">
          <div className="ss_number">
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.
            <br />
            준법감시필 제2025-광고T-001(2025.01.30-2026-01.29)
          </div>
        </section>
      </div>

      {/* 최종 동의 모달 */}
      {showFinalModal && (
        <section className="tour2023_pcBox_Wrap" style={{ display: 'block' }} onClick={() => setShowFinalModal(false)}>
          <div className="tour2023_pcBox_Layer" onClick={(e) => e.stopPropagation()}>
            <div className="tour2023_pc_layer tour2023_pcBox_plan">
              <div className="tour2023_pcBox_top01">
                <p className="tour2023_pcBox_tit01">
                  보험가입을 위한 개인(신용)정보 수집,<br />이용,조회제공 동의서
                </p>
                <a className="close" href="#" onClick={(e) => { e.preventDefault(); setShowFinalModal(false); }}>
                  닫기
                </a>
              </div>
            {/* 본문 */}
            <div className="tour2023_limit_state">
              <div className="tourG_mat06">
                <div className="">
                  <div className="in_wrap pb5">
                    <ul className="tourG_agree">
                      <li className="tourG_cir tourG_chk">
                        <input
                          type="checkbox"
                          id="all_agree"
                          checked={allAgree}
                          onChange={(e) => handleAllAgreeChange(e.target.checked)}
                        />
                        <label htmlFor="all_agree">
                          <span className="tourGuard_txt06 tourG_mleft05">전체동의</span>
                        </label>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="tourG_line02 tourG_mat07 tourG_mab05"></div>

                {/* 동의 01 */}
                <div className="in_wrap tourG_mab03">
                  <ul className="tourG_agree">
                    <li className="tourG_cir tourG_chk">
                      <label>
                        <span className="tourGuard_txt04">여행보험 사이트 이용동의</span>
                      </label>
                      <a
                        href="javascript:void(0);"
                        className="tourG_more"
                        onClick={() => openConsentPopup('/terms/consent-01.html', 'consent01')}
                      ></a>
                    </li>
                  </ul>
                </div>

                {/* 동의 02 */}
                <div className="in_wrap tourG_mab03">
                  <ul className="tourG_agree">
                    <li className="tourG_cir tourG_chk">
                      <label>
                        <span className="tourGuard_txt04">개인(신용)정보의 수집, 이용, 조회, 제공 동의</span>
                      </label>
                      <a
                        href="javascript:void(0);"
                        className="tourG_more"
                        onClick={() => openConsentPopup('/terms/consent-02.html', 'consent02')}
                      ></a>
                    </li>
                  </ul>
                </div>

                {/* 동의 03 */}
                <div className="in_wrap tourG_mab03">
                  <ul className="tourG_agree">
                    <li className="tourG_cir tourG_chk">
                      <label>
                        <span className="tourGuard_txt04">민감정보 및 고유 식별 정보 처리</span>
                      </label>
                      <a
                        href="javascript:void(0);"
                        className="tourG_more"
                        onClick={() => openConsentPopup('/terms/consent-03.html', 'consent03')}
                      ></a>
                    </li>
                  </ul>
                </div>

                {/* 동의 04 */}
                <div className="in_wrap tourG_mab04">
                  <ul className="tourG_agree">
                    <li className="tourG_cir tourG_chk">
                      <label>
                        <span className="tourGuard_txt04">여행보험 가입시 알아두어야 할 사항</span>
                      </label>
                      <a
                        href="javascript:void(0);"
                        className="tourG_more"
                        onClick={() => openConsentPopup('/terms/consent-04.html', 'consent04')}
                      ></a>
                    </li>
                  </ul>
                </div>
                <div className="tourG_mat12">
                  <a
                    href="/pdf/ACE손해_국내여행보험약관.pdf"
                    className="tourGuard_btn_b tour2023_btn06_gray"
                    target="_blank"
                    download="ACE손해_국내여행보험약관.pdf"
                  >
                    국내여행보험 약관보기<span className="tour2023_arr01"></span>
                  </a>
                </div>
                <div className="tourG_mat07 tourG_mab02">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="tourGuard_btn_b tourGuard_btn01">
                    확인
                  </a>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      )}
    </div>
  );
}

