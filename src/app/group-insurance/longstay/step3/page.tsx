'use client';

import React, { useState, useEffect, useCallback } from 'react';
import '../../popup/page.css';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
import { calculateAgeAndGenderFromResidentNumber, getBirthDateStringFromResidentNumber } from '@/utils/age';

const getPlanType = (planCd: string, travelPurpose?: string): string => {
  // 워킹홀리데이인 경우 특별한 플랜명 매핑
  if (travelPurpose === '워킹홀리데이') {
    const workingHolidayPlanMap: { [key: string]: string } = {
      'BAW': '워킹홀리데이실속플랜',
      'HCW': '워킹홀리데이표준플랜',
      'HAW': '워킹홀리데이(유로화플랜)', // 고급플랜
    };
    return workingHolidayPlanMap[planCd] || '워킹홀리데이실속플랜';
  }
  
  // 어린이/어르신 플랜 (나이별 API 반환 plan_types와 동일한 이름 사용, U suffix = 외화)
  const agePlanMap: { [key: string]: string } = {
    'CH1': '어린이플랜',
    'CH2': '어린이플랜2',
    'CH1U': '어린이플랜',
    'CH2U': '어린이플랜2',
    'SR1': '어르신플랜1',
    'SR2': '어르신플랜2',
    'SR1U': '어르신플랜1',
    'SR2U': '어르신플랜2',
  };
  if (agePlanMap[planCd]) return agePlanMap[planCd];

  // 일반 플랜
  const planMap: { [key: string]: string } = {
    // 일반 플랜
    'BAW': '실속플랜',
    'HCW': '표준플랜', // 화면에는 "고보장플랜"으로 표시되지만 백엔드에는 "표준플랜"으로 전송
    // 원화 플랜
    'BAS': '실속플랜',
    'STD': '표준플랜',
    'HCV': '고급플랜', // 고급플랜으로 전송
    // 외화 플랜
    'BAU': '실속플랜',
    'STU': '표준플랜',
    'HCU': '고급플랜', // 고급플랜으로 전송
  };
  return planMap[planCd] || '실속플랜';
};

const getCurrencyPlan = (planCd: string, travelPurpose?: string): '원화' | '외화' => {
  // 워킹홀리데이인 경우: 고급플랜(HAW)만 외화
  if (travelPurpose === '워킹홀리데이') {
    return planCd === 'HAW' ? '외화' : '원화';
  }
  
  // 어린이/어르신 플랜: U suffix = 외화(U$달러), 없으면 원화
  if (planCd === 'CH1U' || planCd === 'CH2U' || planCd === 'SR1U' || planCd === 'SR2U') {
    return '외화';
  }
  if (planCd === 'CH1' || planCd === 'CH2' || planCd === 'SR1' || planCd === 'SR2') {
    return '원화';
  }
  
  // 외화 플랜: BAU, STU, HCU
  if (planCd === 'BAU' || planCd === 'STU' || planCd === 'HCU') {
    return '외화';
  }
  // 나머지는 원화
  return '원화';
};

export default function LongStayInsuranceStep3Page() {
  const { isLoggedIn, member, isLoading } = useAuth();
  const [corporateName, setCorporateName] = useState<string | null>(null);
  const [tourNum, setTourNum] = useState(1);
  const [insuredList, setInsuredList] = useState<any[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<{ [key: number]: string }>({});
  const [premiums, setPremiums] = useState<{ [key: number]: number }>({});
  const [totalPremium, setTotalPremium] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelPurpose, setTravelPurpose] = useState('유학/어학연수');
  const [loading, setLoading] = useState(false);
  const [availablePlanTypesByIndex, setAvailablePlanTypesByIndex] = useState<{ [key: number]: string[] }>({});
  const calcTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = React.useRef(false);
  const lastRequestKeyRef = React.useRef('');
  const calculatePremiumsRef = React.useRef<() => void>(() => {});
  const sanitizeSelectedPlans = (plans: { [key: number]: string }) => {
    if (insuredList.length === 0) return plans;
    let changed = false;
    const next = { ...plans };
    insuredList.forEach((person) => {
      const availableTypes = availablePlanTypesByIndex[person.index];
      const hasCurrencyPlans = travelPurpose !== '워킹홀리데이';
      const planOptions = getAvailablePlansForPerson(hasCurrencyPlans, availableTypes);
      const currentPlan = next[person.index];
      if (!currentPlan || !planOptions.some(option => option.value === currentPlan)) {
        if (planOptions[0]?.value) {
          next[person.index] = planOptions[0].value;
          changed = true;
        }
      }
    });
    return changed ? next : plans;
  };

  useEffect(() => {
    if (isLoggedIn && member?.member_type === '법인') {
      getCorporateMemberInfo(member.id)
        .then((result) => {
          if (result.success && result.corporate) setCorporateName(result.corporate.company_name);
        })
        .catch(() => setCorporateName(null));
    } else {
      setCorporateName(null);
    }
  }, [isLoggedIn, member]);

  useEffect(() => {
    const step1Data = localStorage.getItem('longstayInsuranceStep1');
    const step2Data = localStorage.getItem('longstayInsuranceStep2');
    
    if (step1Data && step2Data) {
      try {
        const data1 = JSON.parse(step1Data);
        const data2 = JSON.parse(step2Data);
        
        // 실제 입력된 인원 수 사용 (step2에서 업데이트된 값 또는 actual_insured_count)
        const actualCount = data2.actual_insured_count || data1.tourNum || 1;
        setTourNum(actualCount);
        setStartDate(`${data1.startDate} ${data1.startHour}:00:00`);
        setEndDate(`${data1.endDate} ${data1.endHour}:00:00`);
        setTravelPurpose(data2.travel_purpose || '유학/어학연수');
        
        const insuredPersons = [];
        // 입력 완료된 인원만 표시 (인덱스는 1부터 순차적으로 저장되어 있음)
        for (let i = 1; i <= actualCount; i++) {
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
          
          const { age, gender } = calculateAgeAndGenderFromResidentNumber(residentNumber);
          
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
        const travelPurposeValue = data2.travel_purpose || '유학/어학연수';
        // 워킹홀리데이를 제외한 모든 목적은 원화/외화 플랜 사용
        const hasCurrencyPlans = travelPurposeValue !== '워킹홀리데이';
        insuredPersons.forEach((person) => {
          // 원화/외화 플랜이 있는 경우 기본값: 실속플랜(원화), 아니면 일반 플랜
          defaultPlans[person.index] = hasCurrencyPlans ? 'BAS' : 'BAW';
        });
        setSelectedPlans(defaultPlans);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
  }, []);

  const fetchAvailablePlans = async (
    age: number,
    gender: string,
    options?: { birth_date?: string; departure_date?: string }
  ) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const body: Record<string, unknown> = {
        insurance_type: travelPurpose,
        age,
        gender,
        plan_variant: 'B',
        has_medical_expense: 1,
        include_foreign_currency: true,
      };
      if (options?.birth_date) body.birth_date = options.birth_date;
      if (options?.departure_date) body.departure_date = options.departure_date;

      const response = await fetch(`${apiBase}/api/travel/available-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data?.success && Array.isArray(data.plan_types)) {
        return data.plan_types as string[];
      }
    } catch (error) {
      console.error('플랜 목록 조회 실패:', error);
    }
    return [];
  };

  const ensureAvailablePlans = async () => {
    const missing = insuredList.filter((person) => {
      const plans = availablePlanTypesByIndex[person.index];
      return !plans || plans.length === 0;
    });
    if (missing.length === 0) return false;

    const departureDate = startDate || undefined;
    const entries = await Promise.all(
      missing.map(async (person) => {
        const birthDate = getBirthDateStringFromResidentNumber(person.residentNumber || '') || undefined;
        const plans = await fetchAvailablePlans(person.age, person.gender, {
          birth_date: birthDate,
          departure_date: departureDate,
        });
        return [person.index, plans] as const;
      })
    );

    setAvailablePlanTypesByIndex((prev) => {
      const next = { ...prev };
      entries.forEach(([index, plans]) => {
        next[index] = plans;
      });
      return next;
    });
    return true;
  };

  useEffect(() => {
    if (insuredList.length === 0) return;
    let isActive = true;

    const loadPlans = async () => {
      const map: { [key: number]: string[] } = {};
      const departureDate = startDate || undefined;
      for (const person of insuredList) {
        const birthDate = getBirthDateStringFromResidentNumber(person.residentNumber || '') || undefined;
        const plans = await fetchAvailablePlans(person.age, person.gender, {
          birth_date: birthDate,
          departure_date: departureDate,
        });
        if (!isActive) return;
        map[person.index] = plans;
        setAvailablePlanTypesByIndex(prev => ({
          ...prev,
          [person.index]: plans,
        }));
      }
      if (!isActive) return;
      setAvailablePlanTypesByIndex(map);
    };

    loadPlans();
    return () => {
      isActive = false;
    };
  }, [insuredList, travelPurpose, startDate]);

  const getAvailablePlansForPerson = (hasCurrencyPlans: boolean, availableTypes?: string[]) => {
    const basePlans = hasCurrencyPlans
      ? [
          { value: 'BAS', label: '실속플랜(원화)' },
          { value: 'STD', label: '표준플랜(원화)' },
          { value: 'HCV', label: '고급플랜(원화)' },
          { value: 'BAU', label: '실속플랜(U$달러)' },
          { value: 'STU', label: '표준플랜(U$달러)' },
          { value: 'HCU', label: '고급플랜(U$달러)' },
        ]
      : [
          { value: 'BAW', label: '워킹홀리데이실속플랜' },
          { value: 'HCW', label: '워킹홀리데이표준플랜' },
          { value: 'HAW', label: '워킹홀리데이(유로화플랜)' },
        ];

    // 어린이/어르신 전용 플랜 옵션 (원화·외화 구분, 일반 플랜과 동일한 라벨 형식)
    const agePlans = [
      { value: 'CH1', label: '어린이플랜(원화)' },
      { value: 'CH2', label: '어린이플랜2(원화)' },
      { value: 'CH1U', label: '어린이플랜(U$달러)' },
      { value: 'CH2U', label: '어린이플랜2(U$달러)' },
      { value: 'SR1', label: '어르신플랜1(원화)' },
      { value: 'SR2', label: '어르신플랜2(원화)' },
      { value: 'SR1U', label: '어르신플랜1(U$달러)' },
      { value: 'SR2U', label: '어르신플랜2(U$달러)' },
    ];
    const allPlans = hasCurrencyPlans ? [...basePlans, ...agePlans] : basePlans;

    if (!availableTypes || availableTypes.length === 0) {
      return basePlans;
    }

    const filteredPlans = allPlans.filter(plan => availableTypes.includes(getPlanType(plan.value, travelPurpose)));
    return filteredPlans.length ? filteredPlans : basePlans;
  };

  useEffect(() => {
    if (insuredList.length === 0) return;
    setSelectedPlans((prev) => {
      return sanitizeSelectedPlans(prev);
    });
  }, [availablePlanTypesByIndex, insuredList, travelPurpose]);

  const calculatePremiums = useCallback(async () => {
    if (!startDate || !endDate || insuredList.length === 0) {
      return;
    }

    if (await ensureAvailablePlans()) {
      return;
    }

    // 모든 피보험자의 플랜이 선택되었는지 확인
    const allPlansSelected = insuredList.every(person => {
      return selectedPlans[person.index];
    });
    const hasAllPlanTypes = Object.keys(availablePlanTypesByIndex).length === insuredList.length;
    const allPlansReady = insuredList.every(person => {
      const availableTypes = availablePlanTypesByIndex[person.index];
      if (!availableTypes || availableTypes.length === 0) {
        return false;
      }
      const currentPlan = selectedPlans[person.index];
      if (!currentPlan) {
        return false;
      }
      const selectedPlanType = getPlanType(currentPlan, travelPurpose);
      if (availableTypes.includes(selectedPlanType)) {
        return true;
      }
      // 나이별 보정 플랜은 백엔드에서 처리되므로, 해당 플랜이 존재하면 통과
      if (person.age >= 71 && (availableTypes.includes('어르신플랜1') || availableTypes.includes('어르신플랜2'))) {
        return true;
      }
      return false;
    });

    if (!allPlansSelected || !allPlansReady || !hasAllPlanTypes) {
      return;
    }

    try {
      // 워킹홀리데이를 제외한 모든 목적은 원화/외화 플랜 사용
      const hasCurrencyPlans = travelPurpose !== '워킹홀리데이';
      const defaultPlan = hasCurrencyPlans ? 'BAS' : (travelPurpose === '워킹홀리데이' ? 'BAW' : 'BAW');
      const insuredPersons = insuredList.map(person => {
        const planCode = selectedPlans[person.index] || defaultPlan;
        return {
          age: person.age,
          gender: person.gender,
          plan_type: getPlanType(planCode, travelPurpose),
          plan_variant: 'B',
          has_medical_expense: true,
          currency_plan: getCurrencyPlan(planCode, travelPurpose),
        };
      });
      const requestKey = JSON.stringify({
        insurance_type: travelPurpose,
        departure_date: startDate,
        arrival_date: endDate,
        insured_persons: insuredPersons,
      });
      if (inflightRef.current && lastRequestKeyRef.current === requestKey) {
        return;
      }
      if (lastRequestKeyRef.current === requestKey && loading) {
        return;
      }
      inflightRef.current = true;
      lastRequestKeyRef.current = requestKey;
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-group-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestKey,
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
      inflightRef.current = false;
      setLoading(false);
    }
  }, [startDate, endDate, insuredList, selectedPlans, travelPurpose, availablePlanTypesByIndex, getAvailablePlansForPerson, ensureAvailablePlans]);

  useEffect(() => {
    calculatePremiumsRef.current = calculatePremiums;
  }, [calculatePremiums]);

  const scheduleCalculate = useCallback(() => {
    if (calcTimerRef.current) {
      clearTimeout(calcTimerRef.current);
    }
    calcTimerRef.current = setTimeout(() => {
      calculatePremiumsRef.current();
    }, 150);
  }, []);

  // selectedPlans 변경 감지를 위한 ref
  const prevSelectedPlansRef = React.useRef<string>('');

  useEffect(() => {
    const selectedPlansStr = JSON.stringify(selectedPlans);
    
    if (insuredList.length > 0 && 
        startDate &&
        endDate &&
        Object.keys(selectedPlans).length === insuredList.length &&
        selectedPlansStr !== prevSelectedPlansRef.current) {
      prevSelectedPlansRef.current = selectedPlansStr;
      scheduleCalculate();
    }
  }, [scheduleCalculate, insuredList.length, selectedPlans, startDate, endDate]);

  useEffect(() => {
    if (insuredList.length === 0) return;
    if (!startDate || !endDate) return;
    if (Object.keys(availablePlanTypesByIndex).length !== insuredList.length) return;
    if (Object.keys(selectedPlans).length !== insuredList.length) return;
    scheduleCalculate();
  }, [availablePlanTypesByIndex, scheduleCalculate, insuredList.length, selectedPlans, startDate, endDate]);

  const handlePlanChange = (index: number, planCd: string) => {
    setSelectedPlans(prev => {
      const newSelectedPlans = {
        ...prev,
        [index]: planCd
      };
      
      // 일반 플랜 코드 (어린이/어르신 플랜 제외)
      const normalPlans = ['BAS', 'STD', 'HCV', 'BAU', 'STU', 'HCU', 'BAW', 'HCW', 'HAW'];
      
      // 일반 플랜인 경우에만 일괄 적용
      if (normalPlans.includes(planCd)) {
        // 다른 모든 피보험자들에게도 동일한 플랜 적용
        insuredList.forEach(person => {
          if (person.index !== index) {
            newSelectedPlans[person.index] = planCd;
          }
        });
      }
      
      return sanitizeSelectedPlans(newSelectedPlans);
    });
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
            <span
              className="tour2023_pc_SpeedTop_title"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}
            >
              <span>단체여행자보험<em className="tour2023_pc_SpeedTop_title01">(법인/단체)</em></span>
              {!isLoading && isLoggedIn && member && (
                <span className="tour2023_pc_SpeedTop_loginUser" style={{ fontSize: 14, color: '#4d60d6', fontWeight: 500 }}>
                  {member.member_type === '법인' && corporateName ? corporateName : member.name}님
                </span>
              )}
            </span>
            <span className="tour2023_pc_SpeedTop_title02">사업자등록증(고유번호증) 있는 법인/단체 포괄회원 가입으로 보다 편리하게 이용하실 수 있습니다.</span>
          </p>
          <a className="close" href="#" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ top: 8 }}>닫기</a>
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
                        <td className="sName bgcolor_02" style={{ backgroundColor: '#fff0ab' }}><strong>플랜선택</strong></td>
                        <td className="sName"><strong>보험료</strong></td>
                      </tr>
                      {insuredList.map((insured, index) => {
                        // 워킹홀리데이를 제외한 모든 목적은 원화/외화 플랜 사용
                        const hasCurrencyPlans = travelPurpose !== '워킹홀리데이';
                        const defaultPlan = hasCurrencyPlans ? 'BAS' : 'BAW';
                        const availableTypes = availablePlanTypesByIndex[insured.index];
                        const effectivePlans = getAvailablePlansForPerson(hasCurrencyPlans, availableTypes);
                        return (
                          <tr key={index}>
                            <td className="ag_center">{insured.index}</td>
                            <td className="ag_center">{insured.name}</td>
                            <td className="ag_center">{insured.age}</td>
                            <td className="ag_center box bgcolor_02" style={{ paddingLeft: '4px', backgroundColor: '#fff0ab' }}>
                              <div className="bg_join input_cell_01">
                                <span className="ps_box02 wd_100">
                                  <select 
                                    className="sel01" 
                                    value={selectedPlans[insured.index] || effectivePlans[0]?.value || defaultPlan}
                                    onChange={(e) => handlePlanChange(insured.index, e.target.value)}
                                  >
                                    {effectivePlans.map(plan => (
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
                  {travelPurpose !== '워킹홀리데이' ? (
                    <>
                      <dd>기본 설정은 실속플랜입니다.</dd>
                      <dd>플랜별 보장내용을 확인하고 플랜선택을 변경하실 수 있습니다.</dd>
                      <dd>체류지가 미국 또는 캐나다인 경우 표준플랜이나 고급플랜을 선택하는 것을 추천드립니다.</dd>
                      <dd>비자나 학교보험 웨이버를 신청하는 경우 외화(US$)플랜을 선택하시기 바랍니다.</dd>
                    </>
                  ) : (
                    <dd><span className="font_blue">플랜명을 클릭하시면 플랜을 변경하실 수 있습니다.</span></dd>
                  )}
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

