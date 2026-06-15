'use client';

import React, { useState, useEffect } from 'react';
import '../../popup/page.css';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
import { calculateAgeAndGenderFromResidentNumber, getBirthDateStringFromResidentNumber } from '@/utils/age';
import { isDomesticAdultSyncCohort, isDomesticSeniorSyncCohort } from '@/utils/domesticAgeBrackets';

// 플랜 코드 또는 플랜명을 DB plan_type으로 정규화
const normalizePlanType = (planCd: string): string => {
  const planMap: { [key: string]: string } = {
    'BAW': '실속플랜',
    'HCW': '표준플랜',
    'CHW': '어린이플랜',
    'OLW': '어르신플랜1(실속)',
    'O2W': '어르신플랜1(실속)',
  };
  return planMap[planCd] || planCd || '실속플랜';
};

/** 국내 단체: 실속/표준 등급 ↔ 피보험자 나이에 맞는 DB plan_type */
const DOMESTIC_TIER_ORDER: { 실속: string[]; 표준: string[] } = {
  실속: ['실속플랜', '어르신플랜1(실속)', '어르신플랜1'],
  표준: ['표준플랜', '어르신플랜1(표준)'],
};

/** 국내 단체(실손): 실속·표준 동기화 — 15–79세끼리 / 80세 이상끼리 */

const getDomesticPlanTier = (planType: string): '실속' | '표준' | null => {
  const p = normalizePlanType(planType);
  if (DOMESTIC_TIER_ORDER.실속.includes(p)) return '실속';
  if (DOMESTIC_TIER_ORDER.표준.includes(p)) return '표준';
  return null;
};

const pickDomesticPlanForTier = (availablePlans: string[], tier: '실속' | '표준'): string | null => {
  if (!availablePlans.length) return null;
  for (const candidate of DOMESTIC_TIER_ORDER[tier]) {
    if (availablePlans.includes(candidate)) return candidate;
  }
  return null;
};

export default function DomesticInsuranceStep3Page() {
  const { isLoggedIn, member, isLoading } = useAuth();
  const [corporateName, setCorporateName] = useState<string | null>(null);
  const [tourNum, setTourNum] = useState(1);
  const [insuredList, setInsuredList] = useState<any[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<{ [key: number]: string }>({});
  const [premiums, setPremiums] = useState<{ [key: number]: number }>({});
  const [totalPremium, setTotalPremium] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [availablePlansByIndex, setAvailablePlansByIndex] = useState<{ [key: number]: string[] }>({});
  const inflightRef = React.useRef(false);
  const lastRequestKeyRef = React.useRef('');
  const calcTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const calculatePremiumsRef = React.useRef<() => void>(() => {});
  const sanitizeSelectedPlans = (plans: { [key: number]: string }) => {
    if (insuredList.length === 0) return plans;
    let changed = false;
    const next = { ...plans };
    insuredList.forEach((person) => {
      const availablePlans = availablePlansByIndex[person.index];
      if (!availablePlans || availablePlans.length === 0) return;
      const normalized = normalizePlanType(next[person.index] || '');
      if (!normalized || !availablePlans.includes(normalized)) {
        next[person.index] = availablePlans[0];
        changed = true;
      } else if (normalized !== next[person.index]) {
        next[person.index] = normalized;
        changed = true;
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

  // step1과 step2에서 전달받은 데이터 로드
  useEffect(() => {
    const step1Data = localStorage.getItem('domesticInsuranceStep1');
    const step2Data = localStorage.getItem('domesticInsuranceStep2');
    
    if (step1Data && step2Data) {
      try {
        const data1 = JSON.parse(step1Data);
        const data2 = JSON.parse(step2Data);
        
        // 실제 입력된 인원 수 사용 (step2에서 업데이트된 값 또는 actual_insured_count)
        const actualCount = data2.actual_insured_count || data1.tourNum || 1;
        setTourNum(actualCount);
        setStartDate(`${data1.startDate} ${data1.startHour}:00:00`);
        setEndDate(`${data1.endDate} ${data1.endHour}:00:00`);
        
        // 피보험자 리스트 생성 (입력 완료된 인원만 표시)
        const insuredPersons = [];
        for (let i = 1; i <= actualCount; i++) {
          const name = data2[`insured_name_${i}`] || `피보험자${i}`;
          const countryType = data2[`insured_country_type_${i}`] || 'D';
          
          let residentNumber = '';
          if (countryType === 'D') {
            residentNumber = data2[`insured_ssn_${i}`] || '';
          } else {
            const ssn1 = data2[`insured_ssn1_${i}`] || '';
            const ssn2 = data2[`insured_ssn2_${i}`] || '';
            residentNumber = ssn1 + ssn2;
          }
          
          const { age, gender } = calculateAgeAndGenderFromResidentNumber(residentNumber);
          
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
        
        // 기본 플랜 설정 (초기값; 유효하지 않으면 플랜 목록 기준으로 보정)
        const defaultPlans: { [key: number]: string } = {};
        insuredPersons.forEach((person) => {
          defaultPlans[person.index] = '실속플랜';
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
        insurance_type: '국내여행보험',
        age,
        gender,
        plan_variant: 'B',
        has_medical_expense: 1,
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
      const plans = availablePlansByIndex[person.index];
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

    setAvailablePlansByIndex((prev) => {
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
      const departureDate = startDate || undefined;
      const entries = await Promise.all(
        insuredList.map(async (person) => {
          const birthDate = getBirthDateStringFromResidentNumber(person.residentNumber || '') || undefined;
          const plans = await fetchAvailablePlans(person.age, person.gender, {
            birth_date: birthDate,
            departure_date: departureDate,
          });
          return [person.index, plans] as const;
        })
      );
      if (!isActive) return;
      const map: { [key: number]: string[] } = {};
      entries.forEach(([index, plans]) => {
        map[index] = plans;
      });
      setAvailablePlansByIndex(map);
    };

    loadPlans();
    return () => {
      isActive = false;
    };
  }, [insuredList, startDate]);

  useEffect(() => {
    if (insuredList.length === 0) return;
    setSelectedPlans((prev) => sanitizeSelectedPlans(prev));
  }, [availablePlansByIndex, insuredList]);

  // 보험료 계산 API 호출
  const calculatePremiums = async () => {
    if (!startDate || !endDate || insuredList.length === 0) {
      return;
    }

    if (await ensureAvailablePlans()) {
      return;
    }

    const allPlansReady = insuredList.every(person => {
      const availablePlans = availablePlansByIndex[person.index];
      if (!availablePlans || availablePlans.length === 0) {
        return false;
      }
      const normalized = normalizePlanType(selectedPlans[person.index] || '');
      return !!normalized && availablePlans.includes(normalized);
    });

    if (!allPlansReady) {
      return;
    }

    setLoading(true);
    try {
      const insuredPersons = insuredList.map(person => {
        const fallbackPlan = availablePlansByIndex[person.index]?.[0] || '실속플랜';
        const planType = normalizePlanType(selectedPlans[person.index] || fallbackPlan);
        return {
          age: person.age,
          gender: person.gender,
          plan_type: planType,
          plan_variant: 'B',
          has_medical_expense: true,
        };
      });

      const requestKey = JSON.stringify({
        insurance_type: '국내여행보험',
        insured_persons: insuredPersons,
        departure_date: startDate,
        arrival_date: endDate,
      });

      if (inflightRef.current && lastRequestKeyRef.current === requestKey) {
        return;
      }
      if (lastRequestKeyRef.current === requestKey && loading) {
        return;
      }

      inflightRef.current = true;
      lastRequestKeyRef.current = requestKey;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/travel/calculate-group-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestKey,
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
      inflightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    calculatePremiumsRef.current = calculatePremiums;
  }, [calculatePremiums]);

  const scheduleCalculate = React.useCallback(() => {
    if (calcTimerRef.current) {
      clearTimeout(calcTimerRef.current);
    }
    calcTimerRef.current = setTimeout(() => {
      calculatePremiumsRef.current();
    }, 150);
  }, []);

  // 보험료 자동 계산 (플랜/기간/플랜목록 준비 후)
  useEffect(() => {
    if (insuredList.length === 0) return;
    if (!startDate || !endDate) return;
    if (Object.keys(selectedPlans).length !== insuredList.length) return;

    const allPlansLoaded = insuredList.every((person) => {
      const plans = availablePlansByIndex[person.index];
      return Array.isArray(plans) && plans.length > 0;
    });
    if (!allPlansLoaded) return;

    scheduleCalculate();
  }, [selectedPlans, insuredList, availablePlansByIndex, startDate, endDate, scheduleCalculate]);

  const handlePlanChange = (index: number, planCd: string) => {
    setSelectedPlans((prev) => {
      const normalizedPlan = normalizePlanType(planCd);
      const canUsePlan = (personIndex: number, plan: string) => {
        const availablePlans = availablePlansByIndex[personIndex];
        if (!availablePlans || availablePlans.length === 0) {
          return true;
        }
        return availablePlans.includes(plan);
      };

      const tier = getDomesticPlanTier(normalizedPlan);
      const newSelectedPlans = { ...prev };

      if (tier) {
        const changer = insuredList.find((p) => p.index === index);
        if (!changer) return prev;
        const changerList = availablePlansByIndex[index] || [];
        const changerPick = pickDomesticPlanForTier(changerList, tier);
        if (!changerPick || !canUsePlan(index, changerPick)) {
          return prev;
        }
        const inSameSyncGroup = (personAge: number) => {
          if (isDomesticAdultSyncCohort(changer.age, true)) {
            return isDomesticAdultSyncCohort(personAge, true);
          }
          if (isDomesticSeniorSyncCohort(changer.age, true)) {
            return isDomesticSeniorSyncCohort(personAge, true);
          }
          return false;
        };
        insuredList.forEach((person) => {
          if (!inSameSyncGroup(person.age)) return;
          const list = availablePlansByIndex[person.index];
          if (!list || list.length === 0) return;
          const picked = pickDomesticPlanForTier(list, tier);
          if (picked) newSelectedPlans[person.index] = picked;
        });
      } else {
        if (!canUsePlan(index, normalizedPlan)) {
          return prev;
        }
        newSelectedPlans[index] = normalizedPlan;
      }

      const sanitizedPlans = sanitizeSelectedPlans(newSelectedPlans);
      scheduleCalculate();
      return sanitizedPlans;
    });
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
                  <table className="specialB" border={1} cellSpacing="0" id="vplan">
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
                      {insuredList.map((insured, index) => (
                        <tr key={index}>
                          <td className="ag_center">{insured.index}</td>
                          <td className="ag_center">{insured.name}</td>
                          <td className="ag_center">{insured.age}</td>
                          <td className="ag_center box bgcolor_02" style={{ paddingLeft: '4px', backgroundColor: '#fff0ab' }}>
                            <div className="bg_join input_cell_01">
                              <span className="ps_box02 wd_100">
                                <select 
                                  className="sel01" 
                                  value={selectedPlans[insured.index] || availablePlansByIndex[insured.index]?.[0] || '실속플랜'}
                                  onChange={(e) => handlePlanChange(insured.index, e.target.value)}
                                >
                                  {(() => {
                                    const fallbackPlans = ['실속플랜', '표준플랜'];
                                    const planOptions = (availablePlansByIndex[insured.index]?.length
                                      ? availablePlansByIndex[insured.index]
                                      : fallbackPlans) as string[];
                                    return planOptions.map((plan) => (
                                      <option key={plan} value={plan}>{plan}</option>
                                    ));
                                  })()}
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
                      <col width="12%" />
                      <col width="22%" />
                      <col width="11%" />
                      <col width="11%" />
                      <col width="11%" />
                      <col width="11%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td colSpan={2} className="sName ag_left">플랜명</td>
                        <td className="sName ag_center" style={{ paddingRight: '5px' }}>
                          <strong>어린이플랜<br />(국내실손 포함)</strong>
                        </td>
                        <td className="sName ag_center" style={{ paddingRight: '5px' }}>
                          <strong>실속플랜<br />(국내실손 포함)</strong>
                        </td>
                        <td className="sName ag_center" style={{ paddingRight: '5px' }}>
                          <strong>표준플랜<br />(국내실손 포함)</strong>
                        </td>
                        <td className="sName ag_center" style={{ paddingRight: '5px' }}>
                          <strong>어르신플랜<br />(국내실손 포함)</strong>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_04">가입연령</td>
                        <td className="ag_center bgcolor_04">0~15세</td>
                        <td className="ag_center bgcolor_04">15~79세</td>
                        <td className="ag_center bgcolor_04">15~79세</td>
                        <td className="ag_center bgcolor_04">80~100세</td>
                      </tr>
                      <tr>
                        <td rowSpan={8} className="ag_left bgcolor_red">상해</td>
                        <td className="ag_left bgcolor_red">국내여행중 상해사망후유장해</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">1억원</td>
                        <td className="ag_center">1억원</td>
                        <td className="ag_center">5,000만원</td>
                      </tr>
                      <tr>
                        <td className="ag_left bgcolor_red">국내여행상해 후유장해</td>
                        <td className="ag_center">1억원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">상해 급여 실손의료비<br />(입원_기본)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">상해 급여 실손의료비<br />(통원_기본)</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">상해 중증 비급여 실손의료비<br />(입원_특약1)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">상해 중증 비급여 실손의료비<br />(통원_특약1)</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">10만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">상해 비중증 비급여 실손의료비<br />(입원_특약2)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">상해 비중증 비급여 실손의료비<br />(통원_특약2)</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                      </tr>
                      <tr>
                        <td rowSpan={7} className="ag_left bgcolor_red">질병</td>
                        <td className="ag_center bgcolor_red">질병 급여 실손의료비<br />(입원_기본)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">질병 급여 실손의료비<br />(통원_기본)</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">질병 중증 비급여 실손의료비<br />(입원_특약1)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">질병 중증 비급여 실손의료비<br />(통원_특약1)</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">10만원</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">질병 비중증 비급여 실손의료비<br />(입원_특약2)</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td className="ag_center bgcolor_red">질병 비중증 비급여 실손의료비<br />(통원_특약2)</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td className="ag_left bgcolor_red">국내여행중 질병사망 및<br />질병 80%이상 후유장해</td>
                        <td className="ag_center">-</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">-</td>
                      </tr>
                      <tr>
                        <td rowSpan={4} className="ag_left bgcolor_red">상해질병</td>
                        <td className="ag_left bgcolor_red">상해질병 중증 3대 비급여 실손의료비<br />(근골격계이학요법/체외충격파_특약1)</td>
                        <td className="ag_center">350만원</td>
                        <td className="ag_center">350만원</td>
                        <td className="ag_center">350만원</td>
                        <td className="ag_center">350만원</td>
                      </tr>
                      <tr>
                        <td className="ag_left bgcolor_red">상해질병 중증 3대 비급여 실손의료비<br />(주사치료_특약1)</td>
                        <td className="ag_center">250만원</td>
                        <td className="ag_center">250만원</td>
                        <td className="ag_center">250만원</td>
                        <td className="ag_center">250만원</td>
                      </tr>
                      <tr>
                        <td className="ag_left bgcolor_red">상해질병 중증 3대 비급여 실손의료비<br />(자기공명영상진단_특약1)</td>
                        <td className="ag_center">300만원</td>
                        <td className="ag_center">300만원</td>
                        <td className="ag_center">300만원</td>
                        <td className="ag_center">300만원</td>
                      </tr>
                      <tr>
                        <td className="ag_left bgcolor_red">상해질병 비중증 비급여 실손의료비<br />(자기공명영상진단_특약2)</td>
                        <td className="ag_center">200만원</td>
                        <td className="ag_center">200만원</td>
                        <td className="ag_center">200만원</td>
                        <td className="ag_center">200만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행중 배상책임(자기부담금 1만원)</td>
                        <td className="ag_center">500만원</td>
                        <td className="ag_center">500만원</td>
                        <td className="ag_center">1,000만원</td>
                        <td className="ag_center">500만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행중 휴대품손해(분실제외,<br />자기부담금 1만원, 이동통신단말기 보상제외)</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">30만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 골절(치아파절제외)진단비</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 화상진단비</td>
                        <td className="ag_center">30만원</td>
                        <td className="ag_center">30만원</td>
                        <td className="ag_center">30만원</td>
                        <td className="ag_center">30만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 상해응급실내원(응급)치료비</td>
                        <td className="ag_center">3만원</td>
                        <td className="ag_center">3만원</td>
                        <td className="ag_center">3만원</td>
                        <td className="ag_center">3만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 상해입원일당(4일이상 30일한도)</td>
                        <td className="ag_center">5만원</td>
                        <td className="ag_center">5만원</td>
                        <td className="ag_center">5만원</td>
                        <td className="ag_center">5만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 골절수술비(동일사고당 1회한)</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 상해수술비(동일사고당 1회한)</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                        <td className="ag_center">50만원</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="ag_left bgcolor_red">국내여행 깁스치료비(동일사고 또는 질병당 1회한)</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
                        <td className="ag_center">20만원</td>
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

                {/* 5세대 실손의료보험(국내의료비) 본인부담금 안내 */}
                <div className="Box_line01 mtb20" style={{ marginBottom: '30px' }}>
                  <p className="txt">※ 5세대 실손의료보험(국내의료비) 본인부담금 안내</p>
                  <div className="login_Btxt pb10 Pslist-copay-intro">
                    <dl>
                      <dd className="font_gray">급여 의료비 : 본인부담금(본인이 실제로 부담한 금액)의 20%(4세대와 동일)</dd>
                      <dd className="font_gray">비급여 의료비는 중증 비급여, 비중증 비급여 의료비로 구분</dd>
                      <dd className="font_gray">
                        국민건강보험 본인부담금 산정특례 대상 질환 비급여(중증)는 4세대 실손과 동일하게 보상
                      </dd>
                      <dd className="font_gray">
                        국민건강보험 본인부담금 산정특례 대상 질환 이외의 질환은 비중증으로 구분하여 본인부담금을 상향 조정
                      </dd>
                    </dl>
                  </div>
                  <table className="Pslist Pslist-copay" border={1} cellSpacing="0">
                    <caption></caption>
                    <colgroup>
                      <col width="10%" />
                      <col width="30%" />
                      <col width="30%" />
                      <col width="30%" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col" />
                        <th scope="col">급여</th>
                        <th scope="col">
                          중증 비급여 특약1
                          <span className="Pslist-copay-sub">(산정특례대상 질환 대상)</span>
                        </th>
                        <th scope="col">
                          비중증 비급여 특약2
                          <span className="Pslist-copay-sub">(산정특례대상질환 이외의 질환)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">입원</th>
                        <td>본인부담금의 20%</td>
                        <td>본인부담금의 30%</td>
                        <td className="font_red">본인부담금의 50%</td>
                      </tr>
                      <tr>
                        <th scope="row">통원</th>
                        <td>1회당 2만원 또는 보장대상의료비의 20% 중 큰 금액</td>
                        <td>1회당 3만원 또는 보장대상의료비의 30% 중 큰 금액</td>
                        <td className="font_red">1회당 5만원 또는 보장대상의료비의 50% 중 큰 금액</td>
                      </tr>
                      <tr>
                        <th scope="row">3대 비급여</th>
                        <td />
                        <td>1회당 3만원 또는 30% 중 큰 금액</td>
                        <td className="font_red">
                          1회당 5만원 또는 보장대상의료비의 50% 중 큰 금액
                          <br />
                          비급여 도수치료, 주사비 보장 제외
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="login_Btxt pt10 Pslist-copay-note">
                    <dl>
                      <dd className="font_gray">
                        ※ 산정특례대상질환 : 암, 뇌혈관질환, 심장질환, 중증 화상 등 보건복지부 고시 산정 특례 대상질환을 말합니다.
                      </dd>
                    </dl>
                  </div>
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
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </div>
        </section>
      </div>
    </div>
  );
}

