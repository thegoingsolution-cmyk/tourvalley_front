'use client';

import React, { useState, useEffect } from 'react';
import { Participant } from '@/components/travel/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '../m/page.css';

interface InsuredData {
  name: string;
  countryType: 'D' | 'F'; // D: 내국인, F: 외국인
  engName: string;
  birthDate: string;
  gender: 'M' | 'W';
  ssn1: string; // 주민번호 앞자리
  ssn2: string; // 주민번호 뒷자리
  country: string; // 외국인일 때만
}

export default function ParticipantInputPage() {
  const [participantCount, setParticipantCount] = useState(0);
  const [insuredList, setInsuredList] = useState<InsuredData[]>([]);
  const [travelType, setTravelType] = useState<'DS' | 'FS' | 'FL'>('DS');

  // URL 파라미터에서 탭 정보 읽기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as 'DS' | 'FS' | 'FL' | null;
      if (tab && (tab === 'DS' || tab === 'FS' || tab === 'FL')) {
        setTravelType(tab);
      }
    }
  }, []);

  // 부모 창에서 기존 데이터 받기
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안을 위해 origin 확인
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data && event.data.type === 'LOAD_INSURED_DATA') {
        const { insuredData, participantCount: count } = event.data;
        
        if (insuredData && Array.isArray(insuredData) && insuredData.length > 0) {
          setInsuredList(insuredData);
          if (count) {
            setParticipantCount(parseInt(count, 10));
          }
        }
      }

      if (event.data && event.data.type === 'EXCEL_UPLOAD') {
        const { participants } = event.data;
        if (participants && Array.isArray(participants) && participants.length > 0) {
          handleExcelUpload(participants, 1);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // 부모 창에 준비 완료 신호 전송
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'PARTICIPANT_INPUT_READY',
      }, window.location.origin);
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 가입자 수 변경 시 리스트 업데이트
  useEffect(() => {
    const newList: InsuredData[] = [];
    for (let i = 0; i < participantCount; i++) {
      if (insuredList[i]) {
        newList.push(insuredList[i]);
      } else {
        newList.push({
          name: '',
          countryType: 'D',
          engName: '',
          birthDate: '',
          gender: 'M',
          ssn1: '',
          ssn2: '',
          country: '',
        });
      }
    }
    setInsuredList(newList);
  }, [participantCount]);

  // 엑셀 업로드 처리
  const handleExcelUpload = (newParticipants: Participant[], startId: number) => {
    const convertedInsuredList: InsuredData[] = newParticipants.map((p) => {
      // 생년월일에서 주민번호 추출
      const birthYear = p.birthDate.substring(0, 2);
      const birthMonth = p.birthDate.substring(2, 4);
      const birthDay = p.birthDate.substring(4, 6);
      const ssn1 = birthYear + birthMonth + birthDay;
      
      // 성별에 따라 뒷자리 첫번째 숫자 결정
      let ssn2First = '1'; // 기본값 (1900년대 남자)
      if (p.gender === '여자') {
        ssn2First = '2';
      }
      const ssn2 = ssn2First + '000000';

      return {
        name: p.name,
        countryType: p.nationality === '외국인' ? 'F' : 'D',
        engName: '',
        birthDate: p.birthDate,
        gender: p.gender === '여자' ? 'W' : 'M',
        ssn1: ssn1,
        ssn2: ssn2,
        country: '',
      };
    });

    // 기존 리스트에 추가
    setInsuredList([...insuredList, ...convertedInsuredList]);
    setParticipantCount(insuredList.length + convertedInsuredList.length);
  };

  // 입력값 변경 핸들러
  const handleInputChange = (index: number, field: keyof InsuredData, value: string) => {
    const newList = [...insuredList];
    (newList[index] as any)[field] = value;
    setInsuredList(newList);
  };

  // 확인 버튼 클릭
  const handleConfirm = () => {
    if (participantCount < 1) {
      alert('가입인원을 선택해주세요.');
      return;
    }

    // 유효성 검사
    for (let i = 0; i < insuredList.length; i++) {
      const insured = insuredList[i];
      if (!insured.name.trim()) {
        alert(`가입자 ${i + 1}의 이름을 입력해주세요.`);
        return;
      }
      if (insured.countryType === 'D') {
        if (!insured.birthDate || insured.birthDate.length !== 8) {
          alert(`가입자 ${i + 1}의 생년월일을 올바르게 입력해주세요.`);
          return;
        }
      } else {
        if (!insured.ssn1 || insured.ssn1.length !== 6 || !insured.ssn2 || insured.ssn2.length !== 7) {
          alert(`가입자 ${i + 1}의 외국인등록번호를 올바르게 입력해주세요.`);
          return;
        }
        if (!insured.country) {
          alert(`가입자 ${i + 1}의 국적을 선택해주세요.`);
          return;
        }
      }
    }

    // Participant 형식으로 변환
    const participants: Participant[] = insuredList.map((insured, index) => ({
      id: index + 1,
      name: insured.name,
      nationality: insured.countryType === 'F' ? '외국인' : '내국인',
      birthDate: insured.birthDate,
      gender: insured.gender === 'W' ? '여자' : '남자',
      email1: '',
      email2: '',
      phone: '',
      isVerified: false,
    }));

    // 부모 창에 데이터 전달
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'PARTICIPANT_INPUT_CONFIRM',
        participants: participants,
        participantCount: participantCount,
        insuredData: insuredList, // InsuredData 형식으로도 전달
      }, window.location.origin);
      window.close();
    } else {
      alert('부모 창을 찾을 수 없습니다.');
    }
  };

  return (
    <div className="bgcolor_white">
      <Header isMobile={true} />
      
      <div id="isbwrapper">
        {/* 레이어 헤더 */}
        <header id="header">
          <div className="layer_header prow_01">
            <span className="layer_title" style={{ display: '' }}>가입자 입력</span>
            <a href="javascript:window.close();" className="close">나가기</a>
          </div>
        </header>

        {/* 본문 */}
        <div id="contentWrap" style={{ paddingBottom: '100px' }}>
          <form name="inputForm" method="POST">
            <section className="tourGuard_bg ag_center prow_01">
              <div className="tourGuard_Topbg01">
                {/* 기존 가입 이력 불러오기 버튼
                <div className="tourG_mab10 tourG_mat14">
                  <a
                    href="javascript:void(0);"
                    onClick={(e) => {
                      e.preventDefault();
                      const width = 500;
                      const height = 700;
                      const left = (window.screen.width / 2) - (width / 2);
                      const top = (window.screen.height / 2) - (height / 2);
                      window.open(
                        '/group-insurance/participant-input/load-history',
                        'loadHistory',
                        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                      );
                    }}
                    className="tourGuard_btn_b tour2023_btn10"
                  >
                    기존 가입 이력 불러오기<span className="tour2023_arr02"></span>
                  </a>
                </div>
                */}

                {/* 가입자 수 선택 */}
                <div className="tourGuard_form_tt mag5 tourG_mab03">
                  <label>가입자</label>
                  <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                    <span className="tourGuard_ps_box">
                      <select
                        className="tourGuard_sel"
                        id="tour_num"
                        name="tour_num"
                        value={participantCount}
                        onChange={(e) => setParticipantCount(Number(e.target.value))}
                      >
                        <option value={0} disabled>
                          가입인원을 선택하세요
                        </option>
                        {Array.from({ length: 250 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num}명
                          </option>
                        ))}
                      </select>
                    </span>
                  </div>
                </div>

                {/* 엑셀로 등록하기 버튼 */}
                <div style={{
                  textAlign: 'right',
                  marginTop: '20px',
                  marginBottom: '25px',
                }}>
                  <button
                    type="button"
                    className="excel-upload-btn"
                    onClick={() => {
                      const width = 520;
                      const height = 760;
                      const left = (window.screen.width / 2) - (width / 2);
                      const top = (window.screen.height / 2) - (height / 2);
                      window.open(
                        '/group-insurance/participant-input/excel-upload',
                        'excelUpload',
                        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                      );
                    }}
                  >
                    <img 
                      src="/images/excel-icon.png" 
                      alt="엑셀 아이콘" 
                      className="excel-icon"
                    />
                    엑셀로 등록하기
                  </button>
                </div>

                {/* 가입자 리스트 */}
                <div id="insured_list">
                  {insuredList.map((insured, index) => (
                    <div key={index} id={`insured_area_${index + 1}`} data-name="insured_area">
                      <div className="tour2023_flex">
                        <span className="tour2023_title03" data-name="insured_title">가입자 {index + 1}</span>
                      </div>
                      <section className="tourGuard_Info">
                        {/* 이름 */}
                        <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                          <label htmlFor={`insured_name_${index + 1}`}>이름</label>
                          <input
                            type="text"
                            id={`insured_name_${index + 1}`}
                            name="insured_name"
                            value={insured.name}
                            maxLength={8}
                            placeholder="이름"
                            className="tourGuard_input_w01"
                            onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                            style={{
                              height: '32px',
                              paddingLeft: '10px',
                              color: '#000',
                              fontSize: '18px',
                              letterSpacing: '0px',
                              marginTop: '23px',
                              marginLeft: '10px',
                              paddingTop: '0px',
                            }}
                          />
                          <div className="tourG_rdo_area">
                            <label htmlFor={`inp-phone2-${index}`}>국적</label>
                            <span className="tourG_inp_rdo">
                              <input
                                type="radio"
                                id={`country_type_D_${index + 1}`}
                                value="D"
                                name={`country_type_${index + 1}`}
                                checked={insured.countryType === 'D'}
                                onChange={() => handleInputChange(index, 'countryType', 'D')}
                              />
                              <label htmlFor={`country_type_D_${index + 1}`}>내국인</label>
                            </span>
                            <span className="tourG_inp_rdo">
                              <input
                                type="radio"
                                id={`country_type_F_${index + 1}`}
                                value="F"
                                name={`country_type_${index + 1}`}
                                checked={insured.countryType === 'F'}
                                onChange={() => handleInputChange(index, 'countryType', 'F')}
                              />
                              <label htmlFor={`country_type_F_${index + 1}`} className="one_line0">외국인</label>
                            </span>
                          </div>
                        </div>

                        {/* 영문이름 - 모든 탭에서 숨김 */}

                        {/* 생년월일 - 내국인일 때만 표시 (모든 탭에서 표시) */}
                        {insured.countryType === 'D' && (
                          <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line" id={`birth_area_${index + 1}`}>
                            <label>생년월일 8자리</label>
                            <input
                              type="tel"
                              id={`birth_${index + 1}`}
                              name="birth"
                              value={insured.birthDate}
                              maxLength={8}
                              placeholder="예)19981022"
                              className="tourGuard_input_w01"
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 8) {
                                  handleInputChange(index, 'birthDate', value);
                                }
                              }}
                              style={{
                                height: '32px',
                                paddingLeft: '10px',
                                color: '#000',
                                fontSize: '18px',
                                letterSpacing: '0px',
                                marginTop: '23px',
                                marginLeft: '10px',
                                paddingTop: '0px',
                              }}
                            />
                            <div className="tourG_rdo_area">
                              <label htmlFor={`inp-phone2-gender-${index}`}>성별</label>
                              <span className="tourG_inp_rdo">
                                <input
                                  type="radio"
                                  id={`gender_M_${index + 1}`}
                                  value="M"
                                  name={`gender_${index + 1}`}
                                  checked={insured.gender === 'M'}
                                  onChange={() => handleInputChange(index, 'gender', 'M')}
                                />
                                <label htmlFor={`gender_M_${index + 1}`}>남자</label>
                              </span>
                              <span className="tourG_inp_rdo">
                                <input
                                  type="radio"
                                  id={`gender_W_${index + 1}`}
                                  value="W"
                                  name={`gender_${index + 1}`}
                                  checked={insured.gender === 'W'}
                                  onChange={() => handleInputChange(index, 'gender', 'W')}
                                />
                                <label htmlFor={`gender_W_${index + 1}`} className="one_line0">여자</label>
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 외국인등록번호 - 외국인일 때만 표시 */}
                        {insured.countryType === 'F' && (
                          <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line01" id={`jumin_area_${index + 1}`}>
                            <label htmlFor={`insured_jumin1_${index + 1}`}>외국인등록번호</label>
                            <input
                              type="tel"
                              id={`insured_jumin1_${index + 1}`}
                              name="insured_ssn1"
                              maxLength={6}
                              placeholder="주민번호"
                              value={insured.ssn1}
                              className="tourGuard_input_w01"
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 6) {
                                  handleInputChange(index, 'ssn1', value);
                                }
                              }}
                              style={{
                                height: '32px',
                                paddingLeft: '10px',
                                fontSize: '18px',
                                letterSpacing: '0px',
                                paddingTop: '0px',
                                marginTop: '23px',
                                marginLeft: '10px',
                                color: '#000',
                              }}
                            />
                            <input
                              type="password"
                              id={`insured_jumin2_${index + 1}`}
                              name="insured_ssn2"
                              maxLength={7}
                              value={insured.ssn2}
                              className="tourGuard_input_w01"
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length <= 7) {
                                  handleInputChange(index, 'ssn2', value);
                                }
                              }}
                              style={{
                                height: '32px',
                                paddingLeft: '10px',
                                border: 0,
                                color: '#000',
                                fontSize: '18px',
                                letterSpacing: '0px',
                                caretColor: '#222',
                                display: 'inline-block',
                                verticalAlign: 'text-top',
                                paddingTop: '0px',
                                marginTop: '23px',
                                marginLeft: '10px',
                                background: 'transparent',
                              }}
                            />
                          </div>
                        )}

                        {/* 국적 - 외국인일 때만 표시 (국내여행 탭에서는 숨김) */}
                        {insured.countryType === 'F' && travelType !== 'DS' && (
                          <div id={`insured_country_area_${index + 1}`} className="tourGuard_form_tt mag5 tourG_mab03">
                            <label htmlFor={`insured_country_${index + 1}`}>국적</label>
                            <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                              <span className="tourGuard_ps_box">
                                <select
                                  className="tourGuard_sel"
                                  id={`insured_country_${index + 1}`}
                                  name="insured_country"
                                  value={insured.country}
                                  onChange={(e) => handleInputChange(index, 'country', e.target.value)}
                                >
                                  <option value="">선택하세요</option>
                                  <option value="US">미국</option>
                                  <option value="CN">중국</option>
                                  <option value="JP">일본</option>
                                  <option value="VN">베트남</option>
                                  <option value="TH">태국</option>
                                  <option value="PH">필리핀</option>
                                  <option value="ID">인도네시아</option>
                                  <option value="MY">말레이시아</option>
                                  <option value="SG">싱가포르</option>
                                  <option value="HK">홍콩</option>
                                  <option value="TW">대만</option>
                                  <option value="MO">마카오</option>
                                  <option value="GB">영국</option>
                                  <option value="FR">프랑스</option>
                                  <option value="DE">독일</option>
                                  <option value="IT">이탈리아</option>
                                  <option value="ES">스페인</option>
                                  <option value="CA">캐나다</option>
                                  <option value="AU">호주</option>
                                  <option value="NZ">뉴질랜드</option>
                                  <option value="BR">브라질</option>
                                  <option value="MX">멕시코</option>
                                  <option value="RU">러시아</option>
                                  <option value="IN">인도</option>
                                  <option value="KR">한국</option>
                                </select>
                              </span>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="tourG_mat23 tourG_Wrap"></div>

        {/* 하단 고정 버튼 */}
        <section id="tour2023_fixedBanner">
          <div className="tour2023_bottom_btn">
            <a
              href="#"
              className="tour2023_btn_b tour2023_btn07"
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              확인
            </a>
          </div>
        </section>
      </div>

      <Footer isMobile={true} />
    </div>
  );
}

