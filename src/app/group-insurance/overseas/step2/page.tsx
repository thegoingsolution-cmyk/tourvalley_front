'use client';

import React, { useState, useEffect } from 'react';
import '../../popup/page.css';

export default function OverseasInsuranceStep2Page() {
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('01');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('01');
  const [tourContinent, setTourContinent] = useState('');
  const [tourPlace, setTourPlace] = useState('');
  const [tourGoal, setTourGoal] = useState('');
  const [tourNum, setTourNum] = useState(1);
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');

  // 이메일 도메인 선택 핸들러
  const handleEmailDomainChange = (value: string) => {
    setEmail2(value);
  };

  // step1에서 전달받은 데이터 로드
  useEffect(() => {
    const savedData = localStorage.getItem('overseasInsuranceStep1');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setStartDate(data.startDate || '');
        setStartHour(data.startHour || '01');
        setEndDate(data.endDate || '');
        setEndHour(data.endHour || '01');
        setTourContinent(data.tourContinent || '');
        setTourPlace(data.tourPlace || '');
        setTourGoal(data.tourGoal || '');
        setTourNum(data.tourNum || 1);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
  }, []);

  const handleSubmit = () => {
    // 계약자(법인/단체) 정보 수집
    const contractCompanyInput = document.querySelector('input[name="contract_company"]') as HTMLInputElement;
    
    // 피보험자 정보 수집
    const step2Data: any = {
      contractor_name: contractCompanyInput?.value || '',
    };
    
    for (let i = 1; i <= tourNum; i++) {
      const nameInput = document.querySelector(`input[name="insured_name_${i}"]`) as HTMLInputElement;
      const birthInput = document.querySelector(`input[name="birth_${i}"]`) as HTMLInputElement;
      const genderInput = document.querySelector(`input[name="gender_${i}"]:checked`) as HTMLInputElement;
      
      if (nameInput) {
        step2Data[`insured_name_${i}`] = nameInput.value;
      }
      
      // 생년월일(8자리)과 성별(1,2,3,4)을 조합하여 주민번호 앞 7자리 생성
      if (birthInput && genderInput) {
        const birth = birthInput.value; // 예: 19880818
        const genderCode = genderInput.value; // 1: 남자(1900년대), 2: 여자(1900년대), 3: 남자(2000년대), 4: 여자(2000년대)
        
        if (birth.length === 8) {
          // 생년월일 뒤 6자리 (YYMMDD)
          const birthSuffix = birth.substring(2, 8);
          
          // 생년에 따라 성별코드 결정
          const birthYear = parseInt(birth.substring(0, 4));
          let finalGenderCode = genderCode;
          
          if (birthYear >= 2000) {
            // 2000년대생
            finalGenderCode = genderCode === '1' ? '3' : '4';
          } else {
            // 1900년대생
            finalGenderCode = genderCode === '1' ? '1' : '2';
          }
          
          // 주민번호 앞 7자리 (YYMMDD + 성별코드)
          step2Data[`insured_ssn_${i}`] = birthSuffix + finalGenderCode;
        }
      }
    }
    
    // localStorage에 저장
    localStorage.setItem('overseasInsuranceStep2', JSON.stringify(step2Data));
    
    // 3단계 페이지로 이동
    window.location.href = '/group-insurance/overseas/step3';
  };

  const handleBack = () => {
    window.history.back();
  };

  const changeTourNum = (newNum: number) => {
    setTourNum(newNum);
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
          <a className="close" href="#" onClick={(e) => { e.preventDefault(); window.close(); }}>닫기</a>
        </div>
      </section>

      <div className="speed_content">
        <div className="con01">
          <div className="tour2023_pc_menu_wrap tourG_mat05 tourG_mab05">
            <span className="menu"><a href="javascript:void(0);">국내여행자보험</a></span>
            <span className="menu on"><a href="javascript:void(0);">해외여행자보험</a></span>
            <span className="menu"><a href="javascript:void(0);">해외장기체류보험</a></span>
          </div>
        </div>

        <div className="con01">
          <div className="tour2023_pc_SpeedTop_line01">
            <span className="tour2023_pc_SpeedTop_title05">2단계 : 가입자 정보 입력</span>
          </div>
          <form name="inputForm" method="POST">
            <div className="bgcolor_white">
              <h2 className="sub_title pt30 ag_left">여행보험 기본정보</h2>
              <div className="detailView01 bgcolor_white">
                <table className="specialB" border={1} cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                  <caption>최근 여행보험 가입내역</caption>
                  <colgroup>
                    <col width="23%" />
                    <col width="77%" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="sName ag_left">출발일시</td>
                      <td className="ddT ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_48">
                            <input 
                              type="date" 
                              className="tf_g dicon" 
                              name="start_date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                            />
                          </div>
                          <div className="bg_join input_cell_01 wd_48 ml10">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="start_hour"
                                value={startHour}
                                onChange={(e) => setStartHour(e.target.value)}
                              >
                                {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                  <option key={h} value={String(h).padStart(2, '0')}>{h}시</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">도착일시</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_48">
                            <input 
                              type="date" 
                              className="tf_g dicon" 
                              name="end_date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                            />
                          </div>
                          <div className="bg_join input_cell_01 wd_48 ml10">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="end_hour"
                                value={endHour}
                                onChange={(e) => setEndHour(e.target.value)}
                              >
                                {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                  <option key={h} value={String(h).padStart(2, '0')}>{h}시</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">여행지</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_48">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="tour_continent"
                                value={tourContinent}
                                onChange={(e) => setTourContinent(e.target.value)}
                              >
                                <option value="">선택</option>
                                <option value="EU">유럽</option>
                                <option value="AS">아시아</option>
                                <option value="AF">아프리카</option>
                                <option value="AU">오세아니아</option>
                                <option value="NA">북아메리카</option>
                                <option value="SA">남아메리카</option>
                              </select>
                            </span>
                          </div>
                          <div className="bg_join input_cell_01 wd_48 ml10">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="tour_place"
                                value={tourPlace}
                                onChange={(e) => setTourPlace(e.target.value)}
                              >
                                <option value="">선택</option>
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">여행목적</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_50">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="tour_goal"
                                value={tourGoal}
                                onChange={(e) => setTourGoal(e.target.value)}
                              >
                                <option value="">선택하세요</option>
                                <option value="001">일반관광</option>
                                <option value="002">출장/연수/교육(체험학습)</option>
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="sName01 ag_left">인원</td>
                      <td className="dd ag_left box">
                        <div className="in_wrap01">
                          <div className="bg_join input_cell_01 wd_50">
                            <span className="ps_box02 wd_100">
                              <select 
                                className="sel01" 
                                name="select_tour_num"
                                value={tourNum}
                                onChange={(e) => changeTourNum(Number(e.target.value))}
                              >
                                {Array.from({ length: 250 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>{n}명</option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div id="contractor_info">
                <div id="top_title">
                  <h2 className="sub_title pt30 ag_left">계약자 정보 입력</h2>
                </div>
                <div className="detailView01 bgcolor_white">
                  <table className="specialB" border={1} cellSpacing="0">
                    <caption>계약자 정보</caption>
                    <colgroup>
                      <col width="14%" />
                      <col width="*" />
                      <col width="13%" />
                      <col width="*" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="sName ag_left">법인(단체)명</td>
                        <td className="ddT ag_left box line_04 bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_100">
                              <input type="text" maxLength={20} className="tf_g" name="contract_company" />
                            </div>
                          </div>
                        </td>
                        <td className="sName ag_left">사업자번호</td>
                        <td className="ddT ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_48">
                              <input type="tel" maxLength={3} className="tf_g" name="resno1" />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_48">
                              <input type="tel" maxLength={2} className="tf_g" name="resno2" />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_48">
                              <input type="tel" maxLength={5} className="tf_g" name="resno3" />
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="sName01 ag_left">담당자명</td>
                        <td className="ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_100">
                              <input type="text" maxLength={20} className="tf_g" name="charge" />
                            </div>
                          </div>
                        </td>
                        <td className="sName01 ag_left">직급/직책</td>
                        <td className="dd ag_left box">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_100">
                              <input type="text" maxLength={10} className="tf_g" name="position" />
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="sName01 ag_left">전화번호</td>
                        <td className="ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_32">
                              <input type="tel" maxLength={4} className="tf_g" name="contract_telno1" />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input type="tel" maxLength={4} className="tf_g" name="contract_telno2" />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input type="tel" maxLength={4} className="tf_g" name="contract_telno3" />
                            </div>
                          </div>
                        </td>
                        <td className="sName01 ag_left">핸드폰번호</td>
                        <td className="ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_32">
                              <span className="ps_box02 wd_100">
                                <select className="sel01" name="contract_ctel_no1">
                                  <option value="010">010</option>
                                  <option value="011">011</option>
                                  <option value="016">016</option>
                                  <option value="017">017</option>
                                  <option value="018">018</option>
                                  <option value="019">019</option>
                                </select>
                              </span>
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input type="tel" maxLength={4} className="tf_g" name="contract_ctel_no2" />
                            </div>
                            <span className="fff-bar"> - </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input type="tel" maxLength={4} className="tf_g" name="contract_ctel_no3" />
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="sName01 ag_left">이메일</td>
                        <td colSpan={3} className="dd ag_left box bgcolor_red">
                          <div className="in_wrap01">
                            <div className="bg_join input_cell_01 wd_32">
                              <input 
                                type="text" 
                                maxLength={15} 
                                className="tf_g" 
                                name="email1"
                                value={email1}
                                onChange={(e) => setEmail1(e.target.value)}
                              />
                            </div>
                            <span className="fff-bar"> @ </span>
                            <div className="bg_join input_cell_01 wd_32">
                              <input 
                                type="text" 
                                maxLength={25} 
                                className="tf_g" 
                                name="email2"
                                value={email2}
                                onChange={(e) => setEmail2(e.target.value)}
                              />
                            </div>
                            <div className="bg_join input_cell_01 wd_30">
                              <span className="ps_box02 wd_100">
                                <select 
                                  className="sel01" 
                                  name="email2_sel"
                                  onChange={(e) => handleEmailDomainChange(e.target.value)}
                                >
                                  <option value="">직접입력</option>
                                  <option value="naver.com">naver.com</option>
                                  <option value="gmail.com">gmail.com</option>
                                  <option value="daum.net">daum.net</option>
                                </select>
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="insured_people_area_2">
                <h2 className="sub_title pt30 ag_left">가입자(피보험자) 정보 입력</h2>
                <div className="detailView01 bgcolor_white">
                  <table className="specialB" border={1} cellSpacing="0">
                    <caption>동반자(피보험자) 정보</caption>
                    <colgroup>
                      <col width="7%" />
                      <col width="15%" />
                      <col width="34%" />
                      <col width="15%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td className="sName ag_center">순번</td>
                        <td className="sName ag_center">성명</td>
                        <td className="sName ag_center">생년월일 / 성별</td>
                        <td className="sName ag_center">국적</td>
                      </tr>
                      {Array.from({ length: tourNum }, (_, i) => (
                        <React.Fragment key={i}>
                          <tr>
                            <td className="ag_center line_03" rowSpan={2}>{i + 1}</td>
                            <td className="ag_center box line_03 bgcolor_red">
                              <div className="in_wrap01">
                                <div className="bg_join input_cell_01">
                                  <input type="text" maxLength={15} className="tf_g" name={`insured_name_${i + 1}`} />
                                </div>
                              </div>
                            </td>
                            <td className="ag_center box line_03 bgcolor_red">
                              <div className="in_wrap01" style={{ alignItems: 'center' }}>
                                <div className="bg_join input_cell_01 wd_45">
                                  <input type="text" maxLength={8} className="tf_g" name={`birth_${i + 1}`} placeholder="19880818" />
                                </div>
                                <div className="btn_group_02">
                                  <input type="radio" id={`gender_M_${i + 1}`} value="1" name={`gender_${i + 1}`} defaultChecked />
                                  <label htmlFor={`gender_M_${i + 1}`} className="nomal_btn">
                                    <div className="nomal_btn_txt">남자</div>
                                  </label>
                                  <input type="radio" id={`gender_W_${i + 1}`} value="2" name={`gender_${i + 1}`} />
                                  <label htmlFor={`gender_W_${i + 1}`} className="nomal_btn">
                                    <div className="nomal_btn_txt">여자</div>
                                  </label>
                                </div>
                              </div>
                            </td>
                            <td className="ag_center box line_03">
                              <div className="in_wrap01">
                                <div className="bg_join input_cell_01 wd_100">
                                  <span className="ps_box02 wd_100">
                                    <select className="sel01" name={`country_type_${i + 1}`}>
                                      <option value="D">내국인</option>
                                      <option value="F">외국인</option>
                                    </select>
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr></tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="login_Btxt box01">
                  <dl>
                    <dd className="font_gray">외국인은 외국인 등록번호가 있어야 보험가입이 가능합니다.</dd>
                    <dd className="font_gray">여행자보험은 여행기간(보험기간)중 발생한 사고를 보장하는 보험입니다. 현재 치료중이거나 보험기간 이전 과거 상병으로 인한 치료는 보상받으실 수 없으며, 이를 보험계약시 알리지 않았다면 보상에 제한받으실 수도 있습니다.</dd>
                  </dl>
                </div>
              </div>
            </div>
          </form>

          <div className="con_btnWrap mt30 mb10">
            <a href="#" onClick={(e) => { e.preventDefault(); handleSubmit(); }}>다음단계</a>
          </div>
          <div className="con_btnWrap_b mb40">
            <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>이전단계</a>
          </div>
        </div>

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

