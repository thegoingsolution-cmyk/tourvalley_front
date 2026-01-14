'use client';

import React, { useState, useEffect } from 'react';
import '../../popup/page.css';

const calculateAgeAndGender = (residentNumber: string) => {
  if (!residentNumber || residentNumber.length < 7) {
    return { age: 0, gender: '남자' };
  }

  const birthYear = parseInt(residentNumber.substring(0, 2));
  const birthMonth = parseInt(residentNumber.substring(2, 4));
  const birthDay = parseInt(residentNumber.substring(4, 6));
  const genderCode = parseInt(residentNumber.substring(6, 7));

  let gender = '남자';
  let centuryPrefix = 1900;
  
  if (genderCode === 1 || genderCode === 2) {
    centuryPrefix = 1900;
    gender = genderCode === 1 ? '남자' : '여자';
  } else if (genderCode === 3 || genderCode === 4) {
    centuryPrefix = 2000;
    gender = genderCode === 3 ? '남자' : '여자';
  }

  const fullBirthYear = centuryPrefix + birthYear;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - fullBirthYear;
  
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return { age, gender };
};

const getPlanType = (planCd: string): string => {
  const planMap: { [key: string]: string } = {
    'BAW': '실속플랜',
    'HCW': '표준플랜', // 화면에는 "고보장플랜"으로 표시되지만 백엔드에는 "표준플랜"으로 전송
  };
  return planMap[planCd] || '실속플랜';
};

export default function LongStayInsuranceStep3Page() {
  const [tourNum, setTourNum] = useState(1);
  const [insuredList, setInsuredList] = useState<any[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<{ [key: number]: string }>({});
  const [premiums, setPremiums] = useState<{ [key: number]: number }>({});
  const [totalPremium, setTotalPremium] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelPurpose, setTravelPurpose] = useState('유학/어학연수');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const step1Data = localStorage.getItem('longstayInsuranceStep1');
    const step2Data = localStorage.getItem('longstayInsuranceStep2');
    
    if (step1Data && step2Data) {
      try {
        const data1 = JSON.parse(step1Data);
        const data2 = JSON.parse(step2Data);
        
        setTourNum(data1.tourNum || 1);
        setStartDate(`${data1.startDate} ${data1.startHour}:00:00`);
        setEndDate(`${data1.endDate} ${data1.endHour}:00:00`);
        setTravelPurpose(data2.travel_purpose || '유학/어학연수');
        
        const insuredPersons = [];
        for (let i = 1; i <= data1.tourNum; i++) {
          const name = data2[`insured_name_${i}`] || `피보험자${i}`;
          const residentNumber = data2[`insured_ssn_${i}`] || '';
          const { age, gender } = calculateAgeAndGender(residentNumber);
          
          insuredPersons.push({
            index: i,
            name,
            residentNumber,
            age,
            gender,
          });
        }
        setInsuredList(insuredPersons);
        
        const defaultPlans: { [key: number]: string } = {};
        insuredPersons.forEach((person) => {
          defaultPlans[person.index] = 'BAW';
        });
        setSelectedPlans(defaultPlans);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
  }, []);

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
        has_medical_expense: true,
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-group-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_type: travelPurpose,
          insured_persons: insuredPersons,
          departure_date: startDate,
          arrival_date: endDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
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
    localStorage.setItem('longstayInsuranceStep3', JSON.stringify(step3Data));
    
    window.location.href = '/group-insurance/longstay/step4';
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
            <span className="menu"><a href="/group-insurance/domestic/popup">국내여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
            <span className="menu on"><a href="javascript:void(0);">해외장기체류보험</a></span>
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
                                  <option value="BAW">실속플랜</option>
                                  <option value="HCW">고보장플랜</option>
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

