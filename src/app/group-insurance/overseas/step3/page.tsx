'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  let gender = '남자';
  let centuryPrefix = 1900;
  
  // 내국인: 1,2 (1900년대), 3,4 (2000년대)
  // 외국인: 5,6 (1900년대), 7,8 (2000년대)
  if (genderCode === 1 || genderCode === 2) {
    centuryPrefix = 1900;
    gender = genderCode === 1 ? '남자' : '여자';
  } else if (genderCode === 3 || genderCode === 4) {
    centuryPrefix = 2000;
    gender = genderCode === 3 ? '남자' : '여자';
  } else if (genderCode === 5 || genderCode === 6) {
    centuryPrefix = 1900;
    gender = genderCode === 5 ? '남자' : '여자';
  } else if (genderCode === 7 || genderCode === 8) {
    centuryPrefix = 2000;
    gender = genderCode === 7 ? '남자' : '여자';
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
    'STW': '표준플랜', // 국내실손 포함
    'BAW': '실속플랜', // 국내실손 포함
    'HCW': '고급플랜', // 국내실손 포함 - 화면에는 "고보장플랜"으로 표시되지만 백엔드에는 "고급플랜"으로 전송
    'STM': '표준플랜', // 국내실손 제외
    'BAM': '실속플랜', // 국내실손 제외
    'HCM': '고급플랜', // 국내실손 제외 - 화면에는 "고보장플랜"으로 표시되지만 백엔드에는 "고급플랜"으로 전송
  };
  return planMap[planCd] || '실속플랜';
};

export default function OverseasInsuranceStep3Page() {
  const [tourNum, setTourNum] = useState(1);
  const [insuredList, setInsuredList] = useState<any[]>([]);
  const [planTypes, setPlanTypes] = useState<{ [key: number]: 'V' | 'N' }>({}); // V: 국내실손 담보, N: 국내실손 부담보
  const [selectedPlans, setSelectedPlans] = useState<{ [key: number]: string }>({});
  const [premiums, setPremiums] = useState<{ [key: number]: number }>({});
  const [totalPremium, setTotalPremium] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const step1Data = localStorage.getItem('overseasInsuranceStep1');
    const step2Data = localStorage.getItem('overseasInsuranceStep2');
    
    if (step1Data && step2Data) {
      try {
        const data1 = JSON.parse(step1Data);
        const data2 = JSON.parse(step2Data);
        
        setTourNum(data1.tourNum || 1);
        setStartDate(`${data1.startDate} ${data1.startHour}:00:00`);
        setEndDate(`${data1.endDate} ${data1.endHour}:00:00`);
        
        const insuredPersons = [];
        for (let i = 1; i <= data1.tourNum; i++) {
          const name = data2[`insured_name_${i}`] || `피보험자${i}`;
          const countryType = data2[`insured_country_type_${i}`] || 'D';
          
          let residentNumber = '';
          if (countryType === 'D') {
            // 내국인: insured_ssn_${i} 사용
            residentNumber = data2[`insured_ssn_${i}`] || '';
          } else {
            // 외국인: insured_ssn1_${i}와 insured_ssn2_${i}를 합침
            const ssn1 = data2[`insured_ssn1_${i}`] || '';
            const ssn2 = data2[`insured_ssn2_${i}`] || '';
            residentNumber = ssn1 + ssn2;
          }
          
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
        const defaultPlanTypes: { [key: number]: 'V' | 'N' } = {};
        insuredPersons.forEach((person) => {
          defaultPlanTypes[person.index] = 'V'; // 기본값: 국내실손 담보
          defaultPlans[person.index] = 'STW'; // 기본값: 표준플랜(국내실손 포함)
        });
        setPlanTypes(defaultPlanTypes);
        setSelectedPlans(defaultPlans);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
  }, []);

  const calculatePremiums = useCallback(async () => {
    if (!startDate || !endDate || insuredList.length === 0) {
      return;
    }

    // 모든 피보험자의 플랜이 선택되었는지 확인
    const allPlansSelected = insuredList.every(person => {
      return selectedPlans[person.index] && planTypes[person.index];
    });

    if (!allPlansSelected) {
      return;
    }

    setLoading(true);
    try {
      const insuredPersons = insuredList.map(person => {
        const planType = planTypes[person.index] || 'V';
        const hasMedicalExpense = planType === 'V'; // V면 국내실손 담보(true), N이면 부담보(false)
        return {
          age: person.age,
          gender: person.gender,
          plan_type: getPlanType(selectedPlans[person.index] || 'STW'),
          has_medical_expense: hasMedicalExpense,
        };
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-group-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_type: '해외여행보험',
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
  }, [startDate, endDate, insuredList, selectedPlans, planTypes]);

  // selectedPlans와 planTypes 변경 감지를 위한 ref
  const prevSelectedPlansRef = React.useRef<string>('');
  const prevPlanTypesRef = React.useRef<string>('');

  useEffect(() => {
    const selectedPlansStr = JSON.stringify(selectedPlans);
    const planTypesStr = JSON.stringify(planTypes);
    
    if (insuredList.length > 0 && 
        Object.keys(selectedPlans).length === insuredList.length && 
        Object.keys(planTypes).length === insuredList.length &&
        (selectedPlansStr !== prevSelectedPlansRef.current || planTypesStr !== prevPlanTypesRef.current)) {
      prevSelectedPlansRef.current = selectedPlansStr;
      prevPlanTypesRef.current = planTypesStr;
      calculatePremiums();
    }
  }, [calculatePremiums, insuredList.length, selectedPlans, planTypes]);

  const handlePlanTypeChange = (index: number, planType: 'V' | 'N') => {
    setPlanTypes(prev => {
      const newPlanTypes = {
        ...prev,
        [index]: planType
      };
      
      // 플랜 타입 변경 시 기본 플랜 설정
      let defaultPlan = '';
      if (planType === 'V') {
        defaultPlan = 'STW'; // 국내실손 담보: 표준플랜
      } else {
        defaultPlan = 'STM'; // 국내실손 부담보: 표준플랜
      }
      
      setSelectedPlans(prevPlans => ({
        ...prevPlans,
        [index]: defaultPlan
      }));
      
      return newPlanTypes;
    });
  };

  const handlePlanChange = (index: number, planCd: string) => {
    setSelectedPlans(prev => {
      const newSelectedPlans = {
        ...prev,
        [index]: planCd
      };
      
      // 변경된 피보험자의 플랜 타입 확인
      const changedPlanType = planTypes[index];
      
      // 일반 플랜 코드 (어린이/어르신 플랜 제외)
      const normalPlans = ['STW', 'BAW', 'HCW', 'STM', 'BAM', 'HCM'];
      
      // 일반 플랜인 경우에만 일괄 적용
      if (normalPlans.includes(planCd)) {
        // 같은 플랜 타입을 가진 다른 피보험자들에게도 동일한 플랜 적용
        insuredList.forEach(person => {
          if (person.index !== index && planTypes[person.index] === changedPlanType) {
            // 같은 플랜 타입이면 동일한 플랜으로 변경
            newSelectedPlans[person.index] = planCd;
          }
        });
      }
      
      return newSelectedPlans;
    });
  };

  const handleSubmit = () => {
    for (let i = 1; i <= tourNum; i++) {
      if (!planTypes[i]) {
        alert(`${i}번 피보험자의 국내실손 담보/부담보를 선택해주세요.`);
        return;
      }
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
      plan_types: planTypes,
      selected_plans: selectedPlans,
      premiums: premiums,
      total_premium: totalPremium
    };
    localStorage.setItem('overseasInsuranceStep3', JSON.stringify(step3Data));
    
    window.location.href = '/group-insurance/overseas/step4';
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
            <span className="menu on"><a href="javascript:void(0);">해외여행자보험</a></span>
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
                      <col width="*" />
                      <col width="20%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="sName"><strong>순번</strong></td>
                        <td className="sName"><strong>성명</strong></td>
                        <td className="sName"><strong>보험나이</strong></td>
                        <td className="sName bgcolor_02" colSpan={2}><strong>플랜선택</strong></td>
                        <td className="sName"><strong>보험료</strong></td>
                      </tr>
                      {insuredList.map((insured, index) => {
                        const planType = planTypes[insured.index] || 'V';
                        const availablePlans = planType === 'V' 
                          ? [
                              { value: 'STW', label: '표준플랜(국내실손 포함)' },
                              { value: 'BAW', label: '실속플랜(국내실손 포함)' },
                              { value: 'HCW', label: '고보장플랜(국내실손 포함)' }
                            ]
                          : [
                              { value: 'STM', label: '표준플랜(국내실손 제외)' },
                              { value: 'BAM', label: '실속플랜(국내실손 제외)' },
                              { value: 'HCM', label: '고보장플랜(국내실손 제외)' }
                            ];
                        return (
                          <tr key={index}>
                            <td className="ag_center">{insured.index}</td>
                            <td className="ag_center">{insured.name}</td>
                            <td className="ag_center">{insured.age}</td>
                            <td className="ag_center box bgcolor_02" style={{ paddingLeft: '4px' }}>
                              <div className="bg_join input_cell_01">
                                <span className="ps_box02 wd_100">
                                  <select 
                                    className="sel01" 
                                    value={planType}
                                    onChange={(e) => handlePlanTypeChange(insured.index, e.target.value as 'V' | 'N')}
                                  >
                                    <option value="V">국내실손 담보</option>
                                    <option value="N">국내실손 부담보</option>
                                  </select>
                                </span>
                              </div>
                            </td>
                            <td className="ag_center box bgcolor_02" style={{ paddingLeft: '4px' }}>
                              <div className="bg_join input_cell_01">
                                <span className="ps_box02 wd_100">
                                  <select 
                                    className="sel01" 
                                    value={selectedPlans[insured.index] || (planType === 'V' ? 'STW' : 'STM')}
                                    onChange={(e) => handlePlanChange(insured.index, e.target.value)}
                                  >
                                    {availablePlans.map(plan => (
                                      <option key={plan.value} value={plan.value}>{plan.label}</option>
                                    ))}
                                  </select>
                                </span>
                              </div>
                            </td>
                            <td className="ag_right bgcolor_red">
                              {premiums[insured.index] ? `${premiums[insured.index].toLocaleString()}원` : '-원'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={5} className="ag_center bgcolor_g02 font_red font16"><strong>합계보험료</strong></td>
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
                  <dd>15세-70세는 <span className="font_red">국내실손 의료비담보 기준플랜</span>이 기본으로 설정되어 있습니다.</dd>
                  <dd>15세 미만은 어린이플랜, 71 ~ 90세는 어르신플랜으로 자동 설정됩니다.</dd>
                  <dd>플랜명을 클릭하시면 플랜을 변경하실 수 있습니다.<br />(동일연령대는 동일한 플랜으로 가입하셔야 합니다. 예- 기준플랜은 모두 기준플랜으로)</dd>
                  <dd>여행국가 중에 체코가 포함되어 있는 경우 고보장플랜으로 선택하시기 바랍니다. (의료비, 특별비용 3만유로 이상 플랜)</dd>
                </dl>
              </div>
              <div className="plan_guide mb30">
                <dl>
                  <dt>실손 의료보험 가입자 플랜선택 가이드</dt>
                  <dd>이미 실손 의료보험에 가입하셨다면 해외여행보험의 <span className="font_red">국내실손 의료비를 중복 가입하는 것은 권장하지 않습니다.</span></dd>
                  <dd><strong>국내실손 의료비를 중복가입</strong> 하더라도 보험금은 실제 발생한 손해액을 기준으로 지급하므로 <strong>중복가입의 실익</strong>이<br />낮을 수 있습니다.</dd>
                  <dd><span className="font_red">실손 의료보험 가입자는 국내실손 내의료비 부담보플랜을 선택하시기 바랍니다.</span></dd>
                  <dd>실손 의료보험 계약보유여부 확인방법<br />한국신용정보원 보험신용정보 (<a href="http://www.credit4u.or.kr" target="_blank" style={{color:'blue'}}>www.credit4u.or.kr</a>)에서 이미 가입한 실손의료보험을 조회하실 수 있습니다.</dd>
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

