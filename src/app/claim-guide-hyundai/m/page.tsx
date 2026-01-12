'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

export default function MobileClaimGuideHyundaiPage() {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="claim-guide-hyundai-page mobile">
      <Header isMobile={true} />
      <section className="main_bg01 main_bg01_w">
        <div className="container_w">
          <div className="container_box">
            <section className="bgcolor_white pt30 pb30 prow_01">
              <h2 className="sub_title_03 pb20 ag_left">현대해상</h2>
              <h2 className="sub_title ag_left">보험금 청구 안내</h2>

              <div className="claim-notice-box">
                <table border={0} cellSpacing={0} cellPadding={0} className="join01_box">
                  <tbody>
                    <tr>
                      <td className="txt">
                        해외에서 보험사고가 발생한 경우 보험금 지급과 관련된 서류를 꼼꼼히 챙기셔야 보험금을 손쉽게 받으실 수 있습니다.<br/>
                        특히 휴대품 도난시 현지 경찰서에서 도난확인서(Police Report)를 발급받아 오시기 바랍니다. <br/>
                        보험금 청구기간은 사고일로부터 3년입니다.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="con01 pt15 pb40 ag_left">
                <ul>
                  <li><strong><span className="font_blue">현대해상 고객센터:</span> 1899-6782</strong></li>
                </ul>
              </div>

              <h2 className="sub_title ag_left">보험금청구 구비서류 안내</h2>

              <div className="claim-tabs-container">
                <div className="subNaviWrap02 level2" id="tabs">
                  <table className="naviLev2">
                    <tbody>
                      <tr>
                        <td className={activeTab === 1 ? 'on' : ''}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(1); }}>의료비</a>
                        </td>
                        <td className={activeTab === 2 ? 'on' : ''}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(2); }}>휴대품</a>
                        </td>
                      </tr>
                      <tr>
                        <td className={activeTab === 3 ? 'on' : ''}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(3); }}>배상책임</a>
                        </td>
                        <td className={activeTab === 4 ? 'on' : ''}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(4); }}>항공편 지연</a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="tab-content" style={{ display: activeTab === 1 ? 'block' : 'none' }}>
                  <table width="100%" border={0} cellSpacing={0} cellPadding={0} className="join02_box">
                    <tbody>
                      <tr>
                        <td className="txt">
                          1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)<br/>
                          2. 여권사본<br/>
                          3. 청구인 신분증사본<br/>
                          4. [가족관계 확인필요시](피보험자 미성년자인 경우 등) 가족관계증명서, 주민등록등본 등<br/><br/>
                          --------------------------------------------------------------------------------------------------<br/><br/>
                          <strong>= 해외의료비 =</strong><br/>
                          1. 진단서(MEDICAL RECORD)<br/>
                          2. 치료비영수증(원본)<br/><br/>
                          <strong>= 국내의료비(입원) =</strong><br/>
                          1. 가이드(인솔자) 또는 목격자(제3자) 확인서<br/>
                          2. 진단서<br/>
                          (50만원 이하시 진단명이 포함된 입퇴원확인서 또는 진료확인서로 대체 가능)<br/>
                          3. 진료비계산서(영수증)<br/>
                          4. 진료비 세부(상세)내역서<br/><br/>
                          <strong>= 국내의료비(통원) = </strong><br/>
                          1. 가이드(인솔자) 또는 목격자(제3자) 확인서<br/>
                          2. 진단명이 포함된 서류(진단서, 통원확인서, 처방전, 소견서, 진료차트 등)<br/>
                          3. 진료비계산서(영수증)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="tab-content" style={{ display: activeTab === 2 ? 'block' : 'none' }}>
                  <table width="100%" border={0} cellSpacing={0} cellPadding={0} className="join02_box">
                    <tbody>
                      <tr>
                        <td className="txt">
                          1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)<br/>
                          2. 여권사본<br/>
                          3. 청구인 신분증사본<br/>
                          4. [가족관계 확인필요시](피보험자 미성년자인 경우 등) 가족관계증명서, 주민등록등본 등<br/><br/>
                          --------------------------------------------------------------------------------------------------<br/><br/>
                          <strong>= 도난 =</strong><br/>
                          1. 도난신고 사실확인서(Police Report)<br/>
                          <span className="pad02">- 현지 경찰서에 신고 : 도난신고 확인서 발급</span><br/>
                          <span className="pad02">- 공항수하물 사고시 : 공항안내서 신고확인서</span><br/>
                          <span className="pad02">(항공사 보상관련 확인서류 첨부)</span><br/>
                          <span className="pad02">- 호텔도난시 ) 프론트에 신고후 확인증 첨부</span><br/>
                          <span className="pad02">- 경찰서 등 신고할 수 없는 부득이한 상황인 경우</span><br/>
                          <span className="pad02">: 가이드 또는 목격자(제3자)확인서, 대사관 신고</span><br/><br/>
                          2. 피해품 영수증(피해입증자료) : 구매영수증(발급시)<br/>
                          <span className="pad02">- 구입시점부터 사고시점까지 법정 감가율 적용</span><br/>
                          <span className="pad02">- 미제출시 25%감가(산정내역에 따라 변동)</span><br/><br/>
                          <strong>= 파손 =</strong><br/>
                          1. 가이드 또는 목격자(제3자) 확인서<br/>
                          2. 파손 물품 사진<br/>
                          3. 수리가능시 : 수리견적서, 영수증<br/>
                          4. 수리불가능시 : 수리불가확인서<br/>
                          5. 스마트폰인 경우 : 휴대폰 이용계약 등록사항 증명서(통신사 발급)<br/><br/>
                          --------------------------------------------------------------------------------------------------<br/><br/>
                          <strong>항공사에서 보상을 받은 경우</strong><br/>
                          1. 항공사 사고접수지<br/>
                          2. 입금액이 확인가능한 통장사본<br/>
                          2. 항공사 보상불가 확인서(보상받지 못한 경우)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="tab-content" style={{ display: activeTab === 3 ? 'block' : 'none' }}>
                  <table width="100%" border={0} cellSpacing={0} cellPadding={0} className="join02_box">
                    <tbody>
                      <tr>
                        <td className="txt">
                          1. 보험금청구서 및 개인(신용)정보처리동의서 (계좌번호 포함)<br/>
                          2. 피보험자 주민등록등본(가족관계 확인서)<br/>
                          3. 피해자 신분증 사본, 개인정보처리동의서<br/>
                          4. 피보험자, 피해자 사고확인서(보험회사 양식) <br/><br/>
                          --------------------------------------------------------------------------------------------------<br/><br/>
                          <strong>= 대인사고 =</strong><br/>
                          1. 피해자 진단서, 초진(응급)진료차트, 치료비영수증<br/>
                          2. 사고관련 입증서류 및 합의서<br/><br/>
                          <strong>= 대물사고 =</strong><br/>
                          1. 피해물 사진<br/>
                          2. 피해물 구입영수증 및 수리견적서, 수리영수증<br/>
                          3. 사고관련 입증서류 및 합의서<br/>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="tab-content" style={{ display: activeTab === 4 ? 'block' : 'none' }}>
                  <table width="100%" border={0} cellSpacing={0} cellPadding={0} className="join02_box">
                    <tbody>
                      <tr>
                        <td className="txt">
                          <p>
                            <span className="t_red"><strong>사고발생 수 30일 이내 손해입증자료 제출</strong></span><br/><br/>
                            1. 항공사 확인서<br/>
                            2. e-ticket, 피보험자 여권 사본 및 출입국 사실 증명서<br/>
                            3. 손해입증자료(구입일시, 내역, 장소가 확인 가능한 영수증에 한함)<br/><br/>
                            --------------------------------------------------------------------------------------------------<br/><br/>
                            <strong>= 결항/지연/취소/과적에 의한 탑승거부로 <br/>
                            4시간 내에 대체(항공)수단이 제공되지 못한 경우 =</strong><br/>
                            1. 식사, 간식, 전화통화 영수증<br/>
                            2. 숙박비, 숙박시설에 대한 교통비, 수화물이 다른 항공편으로 출발한 경우 비상의복 및 필수품 구입비용 영수증(단, 숙박이 필요한 경우에 한함)<br/><br/>
                            <strong>= 수화물이 6시간 내에 도착하지 못한 경우 =</strong><br/>
                            1. 비상의복과 필수품 구입비용 영수증<br/><br/>
                            <strong>= 수화물이 24시간 내에 도착하지 못한 경우 =</strong><br/>
                            1. 예정된 도착지에 도착 후 120시간 내에 발생한 의복과 필수품 등의 구입비용 영수증<br/><br/>
                            --------------------------------------------------------------------------------------------------<br/><br/>
                            <span className="t_blue">
                              <strong>알아두세요!</strong><br/>
                              ※ 발생 영수증의 경우 반드시 구입일시가 기재된 영수증이어야 합니다.<br/>
                              ※ 항공사 확인서의 경우 결항, 지연, 과적에 의한 탑승거부 등 항공편 또는 수화물의 지연사유와 지연된 시간이 반드시 기재되어 있어야 합니다. (항공사 담당자 및 연락처가 기재되어 있지 않은 경우에는 서류 여백에 해당 사항을 별도로 기재바랍니다.
                            </span><br/>
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

