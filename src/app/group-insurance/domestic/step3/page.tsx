'use client';

import React, { useState, useEffect } from 'react';
import '../../popup/page.css';

// 주민번호에서 나이와 성별 계산
const calculateAgeAndGender = (residentNumber: string) => {
  if (!residentNumber || residentNumber.length < 7) {
    return { age: 0, gender: '남자' };
  }

  const birthYear = parseInt(residentNumber.substring(0, 2));
  const birthMonth = parseInt(residentNumber.substring(2, 4));
  const birthDay = parseInt(residentNumber.substring(4, 6));
  const genderCode = parseInt(residentNumber.substring(6, 7));

  // 성별 결정
  let gender = '남자';
  let centuryPrefix = 1900;
  
  if (genderCode === 1 || genderCode === 2) {
    centuryPrefix = 1900;
    gender = genderCode === 1 ? '남자' : '여자';
  } else if (genderCode === 3 || genderCode === 4) {
    centuryPrefix = 2000;
    gender = genderCode === 3 ? '남자' : '여자';
  }

  // 만 나이 계산
  const fullBirthYear = centuryPrefix + birthYear;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - fullBirthYear;
  
  // 생일이 지나지 않았으면 나이에서 1을 뺌
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return { age, gender };
};

// 플랜 코드를 백엔드 API용 플랜 타입으로 변환
const getPlanType = (planCd: string): string => {
  const planMap: { [key: string]: string } = {
    'BAW': '실속플랜',
    'HCW': '표준플랜', // 화면에는 "고보장플랜"으로 표시되지만 백엔드에는 "표준플랜"으로 전송
    'CHW': '어린이플랜',
    'OLW': '어르신플랜',
    'O2W': '어르신플랜2',
  };
  return planMap[planCd] || '실속플랜';
};

export default function DomesticInsuranceStep3Page() {
  const [tourNum, setTourNum] = useState(1);
  const [insuredList, setInsuredList] = useState<any[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<{ [key: number]: string }>({});
  const [premiums, setPremiums] = useState<{ [key: number]: number }>({});
  const [totalPremium, setTotalPremium] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // step1과 step2에서 전달받은 데이터 로드
  useEffect(() => {
    const step1Data = localStorage.getItem('domesticInsuranceStep1');
    const step2Data = localStorage.getItem('domesticInsuranceStep2');
    
    if (step1Data && step2Data) {
      try {
        const data1 = JSON.parse(step1Data);
        const data2 = JSON.parse(step2Data);
        
        setTourNum(data1.tourNum || 1);
        setStartDate(`${data1.startDate} ${data1.startHour}:00:00`);
        setEndDate(`${data1.endDate} ${data1.endHour}:00:00`);
        
        // 피보험자 리스트 생성
        const insuredPersons = [];
        for (let i = 1; i <= data1.tourNum; i++) {
          const name = data2[`insured_name_${i}`] || `피보험자${i}`;
          const residentNumber = data2[`insured_ssn_${i}`] || '';
          
          console.log('=== 피보험자 정보 디버깅 ===');
          console.log(`피보험자 ${i}:`, { name, residentNumber });
          console.log('step2 전체 데이터:', data2);
          
          const { age, gender } = calculateAgeAndGender(residentNumber);
          
          console.log('계산된 나이/성별:', { age, gender });
          
          insuredPersons.push({
            index: i,
            name,
            residentNumber,
            age,
            gender,
          });
        }
        setInsuredList(insuredPersons);
        
        // 기본 플랜 설정
        const defaultPlans: { [key: number]: string } = {};
        insuredPersons.forEach((person) => {
          defaultPlans[person.index] = person.age < 15 ? 'CHW' : 'BAW';
        });
        setSelectedPlans(defaultPlans);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
  }, []);

  // 보험료 계산 API 호출
  const calculatePremiums = async () => {
    if (!startDate || !endDate || insuredList.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const insuredPersons = insuredList.map(person => ({
        age: person.age,
        gender: person.gender,
        plan_type: getPlanType(selectedPlans[person.index] || 'BAW'),
        has_medical_expense: true, // 국내실손 포함 여부 (플랜에 따라 다를 수 있음)
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-group-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_type: '국내여행보험',
          insured_persons: insuredPersons,
          departure_date: startDate,
          arrival_date: endDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 각 피보험자별 보험료 설정
        const newPremiums: { [key: number]: number } = {};
        data.insured_persons.forEach((person: any) => {
          newPremiums[person.index] = person.premium;
        });
        setPremiums(newPremiums);
        setTotalPremium(data.total_premium);
      } else {
        alert(data.message || '보험료 계산에 실패했습니다.');
      }
    } catch (error) {
      console.error('보험료 계산 오류:', error);
      alert('보험료 계산 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 보험료 자동 계산 (플랜 변경 시)
  useEffect(() => {
    if (insuredList.length > 0 && Object.keys(selectedPlans).length === insuredList.length) {
      calculatePremiums();
    }
  }, [selectedPlans, insuredList]);

  const handlePlanChange = (index: number, planCd: string) => {
    setSelectedPlans(prev => ({
      ...prev,
      [index]: planCd
    }));
  };

  const handleSubmit = () => {
    // 플랜 선택 확인
    for (let i = 1; i <= tourNum; i++) {
      if (!selectedPlans[i]) {
        alert(`${i}번 피보험자의 플랜을 선택해주세요.`);
        return;
      }
      if (!premiums[i]) {
        alert(`${i}번 피보험자의 보험료 계산을 해주세요.`);
        return;
      }
    }
    
    // step3 데이터 저장
    const step3Data = {
      selected_plans: selectedPlans,
      premiums: premiums,
      total_premium: totalPremium
    };
    localStorage.setItem('domesticInsuranceStep3', JSON.stringify(step3Data));
    
    window.location.href = '/group-insurance/domestic/step4';
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="speed_Wrap" style={{ background: '#fff' }}>
      <section className="tour2023_pc_SpeedTop_w">
        <div className="tour2023_pc_SpeedTop">
          <p className="tour2023_pc_SpeedTop_icon"></p>
          <p className="tour2023_pc_SpeedTop01">
            <span className="tour2023_pc_SpeedTop_title">단체여행자보험<em className="tour2023_pc_SpeedTop_title01">(법인/단체)</em></span>
            <span className="tour2023_pc_SpeedTop_title02">사업자등록증(고유번호증) 있는 법인/단체 포괄회원 가입으로 보다 편리하게 이용하실 수 있습니다.</span>
          </p>
          <a className="close" href="javascript:window.close();">닫기</a>
        </div>
      </section>

      <div className="speed_content">
        <div className="con01">
          <div className="tour2023_pc_menu_wrap tourG_mat05 tourG_mab05">
            <span className="menu on"><a href="javascript:void(0);">국내여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/longstay/popup">해외장기체류보험</a></span>
          </div>
        </div>

        <div className="con01">
          <div className="bgcolor_white">
            <p className="sub_title_02 ag_left pt10">3단계 : 플랜선택</p>
            <div className="bgcolor_white">
              <h2 className="sub_title pt30 ag_left">플랜선택</h2>
              <div className="detailView01 bgcolor_white">
                <form name="inputForm" method="POST">
                  <table className="specialB" border={1} cellSpacing="0">
                    <caption></caption>
                    <colgroup>
                      <col width="8%" />
                      <col width="14%" />
                      <col width="12%" />
                      <col width="*" />
                      <col width="20%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="sName"><strong>순번</strong></td>
                        <td className="sName"><strong>성명</strong></td>
                        <td className="sName"><strong>보험나이</strong></td>
                        <td className="sName bgcolor_02"><strong>플랜선택</strong></td>
                        <td className="sName"><strong>보험료</strong></td>
                      </tr>
                      {insuredList.map((insured, index) => (
                        <tr key={index}>
                          <td className="ag_center">{insured.index}</td>
                          <td className="ag_center">{insured.name}</td>
                          <td className="ag_center">{insured.age}</td>
                          <td className="ag_center box bgcolor_02" style={{ paddingLeft: '4px' }}>
                            <div className="bg_join input_cell_01">
                              <span className="ps_box02 wd_100">
                                <select 
                                  className="sel01" 
                                  value={selectedPlans[insured.index] || 'BAW'}
                                  onChange={(e) => handlePlanChange(insured.index, e.target.value)}
                                >
                                  <option value="BAW">실속플랜(국내실손 포함)</option>
                                  <option value="HCW">고보장플랜(국내실손 포함)</option>
                                </select>
                              </span>
                            </div>
                          </td>
                          <td className="ag_right bgcolor_red">
                            {premiums[insured.index] ? `${premiums[insured.index].toLocaleString()}원` : '-원'}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} className="ag_center bgcolor_g02 font_red font16"><strong>합계보험료</strong></td>
                        <td className="ag_right bgcolor_red font_red font16">
                          <strong>{totalPremium > 0 ? `${totalPremium.toLocaleString()}원` : '-원'}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </form>
              </div>

              <div className="plan_guide mb10">
                <dl>
                  <dt>플랜선택 가이드</dt>
                  <dd><span className="font_blue">플랜명을 클릭하시면 플랜을 변경하실 수 있습니다.</span></dd>
                </dl>
              </div>

              <div className="con_btnWrap mt30 mb10">
                <a href="#" onClick={(e) => { e.preventDefault(); handleSubmit(); }}>다음단계</a>
              </div>
              <div className="con_btnWrap_b mb40">
                <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>이전단계</a>
              </div>

              {/* 플랜별 보장내역 표 */}
              <div className="detailView bgcolor_white">
                <div className="detailView bgcolor_white">
                  <h2 className="sub_title pt10 ag_left">플랜별 보장내역</h2>

                  <table className="specialB" border={1} cellSpacing="0">
                    <caption></caption>
                    <colgroup>
                      <col width="13%" />
                      <col width="25%" />
                      <col width="15%" />
                      <col width="15%" />
                      <col width="15%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td colSpan={2} className="sName ag_left">플랜명</td>
                        <td className="sName ag_center" style={{ paddingRight: '5px' }}>
                          <strong>어린이플랜<br />(국내실손 포함)</strong>
                        </td>
                        <td className="sName ag_center" style={{ paddingRight: '5px' }}>
                          <strong>어르신플랜<br />(국내실손 포함)</strong>
                        </td>
                        <td className="sName ag_center" style={{ paddingRight: '5px' }}>
                          <strong>어르신플랜2<br />(국내실손 포함)</strong>
                        </td>
                        <td className="sName">
                          <div className="bg_join input_cell_01">
                            <span className="ps_box02 wd_100">
                              <select className="sel01" name="plan_cd">
                                <option value="BAW" selected>실속플랜(국내실손 포함)</option>
                                <option value="HCW">고보장플랜(국내실손 포함)</option>
                              </select>
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    <tbody>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_04">가입연령</td>
                        <td className="ag_center bgcolor_04">0-14세</td>
                        <td className="ag_center bgcolor_04">71-90세</td>
                        <td className="ag_center bgcolor_04">91-100세</td>
                        <td className="ag_center bgcolor_04">15-70세</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 중 상해사망후유장해</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">3,000만원</td>
                        <td className="ag_center">5,000만원</td>
                        <td className="ag_center">1억원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 중 상해후유장해</td>
                        <td className="ag_center">1억원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td rowSpan={4} className="ag_left bgcolor_red">상해</td>
                        <td className="ag_center bgcolor_red">국내의료비<br />(상해 급여_입원_기본)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">국내의료비<br />(상해급여_통원_기본)</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">국내의료비<br />(상해 비급여_입원_특약)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">국내의료비<br />(상해 비급여_통원_특약)</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 알아두세요 */}
                <div className="Box_line01 mtb20">
                  <p className="txt"><span className="font_blue">※ 알아두세요.</span></p>
                  <div className="login_Btxt">
                    <dl>
                      <dd className="font_gray">라이나손해보험의 국내여행보험 상품입니다.</dd>
                      <dd className="font_gray">국내여행보험의 주계약은 상해사망 및 후유장해이며 그 외에는 기타특약입니다. 기타특약은 해당특약 가입시에만 보상받으실 수 있습니다.</dd>
                      <dd className="font_gray">배상책임, 휴대품손해는 자기부담금 각 1만원입니다.</dd>
                      <dd className="font_gray">휴대품손해에서 <span className="font_red">휴대품 1개(1조 또는 1쌍)의 보상한도는 20만원</span>입니다. <span className="font_red">이동통신단말기(핸드폰, 공단말기 포함)은 보상하지 않습니다.</span></dd>
                      <dd className="font_gray"><span className="font_red">(비례보상)실손의료비, 특별비용, 배상책임, 휴대품손해를 보상하는 상품</span>은 2개 이상의 보험에 가입하더라도 중복 보상되지 않고 <span className="font_red">비례보상됩니다.</span></dd>
                      <dd className="font_gray">상법 제732조에 따라 15세 미만의 경우 사망에 대해서는 보장하지않습니다.(후유장해)</dd>
                      <dd className="font_gray">가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</dd>
                    </dl>
                  </div>
                </div>

                {/* 실손의료비 본인부담금 안내 */}
                <div className="Box_line01 mtb20" style={{ marginBottom: '30px' }}>
                  <p className="txt">※ 실손의료비 본인부담금 안내</p>
                  <div className="login_Btxt pb10">
                    <dl>
                      <dd className="font_gray">실손의료보험은 급여(건강보험의 본인부담금)과 비급여를 보상하는 상품으로 보상대상 의료비에 대해 일정금액의 자기부담금이 있습니다.(4세대 실손의료보험 개정 2021년 8월 1일 적용)</dd>
                      <dd className="font_gray">가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</dd>
                    </dl>
                  </div>
                  <table className="Pslist" border={1} cellSpacing="0">
                    <caption></caption>
                    <colgroup>
                      <col width="30%" />
                      <col width="70%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="ag_left sName">상해/질병<br />급여 국내입원</td>
                        <td className="sName">본인부담금(본인이 실제로 부담한 금액)의 20%</td>
                      </tr>
                      <tr>
                        <td className="ag_left">상해/질병<br />급여 국내통원</td>
                        <td className="">
                          보건소, 병원, 의원급에서의 외래 및 그에 따른 약국에서의 처방조제<br />
                          - 1만원과 보장대상의료비의 20％중 큰 금액<br />
                          전문요양기관, 상급종합병원, 종합병원에서의 외래 및 그에 따른 약국에서의 처방조제<br />
                          - 2만원과 보장대상의료비의 20％중 큰 금액
                        </td>
                      </tr>
                      <tr>
                        <td className="ag_left">상해/질병<br />비급여 국내입원</td>
                        <td className="">
                          1. 본인부담금(본인이 실제로 부담한 금액)의 30%<br />
                          2. 상급병실료차액<br />
                          : 비급여 병실료의 50％ (1일 평균금액 10만원 한도)
                        </td>
                      </tr>
                      <tr>
                        <td className="ag_left">상해/질병<br />비급여 국내통원</td>
                        <td className="">
                          통원 1회당(외래 처방조제 합산) :3만원과 보장대상의료비의 30％중 큰 금액<br />
                          (단, 3대 비급여 및 상급병실료차액 제외) ※ 연간 통원 100회까지 보상
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="con_btnWrap mt30 mb10">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleSubmit(); }}>다음단계</a>
                </div>
                <div className="con_btnWrap_b mb40">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>이전단계</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 심의번호 */}
        <section className="ss_number_w">
          <div className="ss_number">
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
            준법감시필 제2025-광고T-001(2025.01.30-2026-01.29)
          </div>
        </section>
      </div>
    </div>
  );
}

