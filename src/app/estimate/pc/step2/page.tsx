'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import ExcelUploadModal from '@/components/travel/ExcelUploadModal';
import EstimateCompletionModal from '@/components/estimate/EstimateCompletionModal';
import StepIndicator from '@/components/travel/StepIndicator';
import { getImagePath } from '@/utils/path';
import { getTrackingInfo } from '@/utils/tracking';
import './page.css';

interface Participant {
  id: number;
  gender: '남자' | '여자';
  birthDate: string;
}

interface ContractorInfo {
  name: string;
  phone: string;
  email1: string;
  email2: string;
  customEmail?: string;
}

function PCStep2PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // step1에서 전달받은 쿼리 파라미터
  const [productCd, setProductCd] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('');
  const [tourNum, setTourNum] = useState('');
  const [tourDay, setTourDay] = useState('');
  const [travelCountry, setTravelCountry] = useState('');
  
  const [agree, setAgree] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 신청자 정보
  const [contractorInfo, setContractorInfo] = useState<ContractorInfo>({
    name: '',
    phone: '',
    email1: '',
    email2: '',
    customEmail: '',
  });
  
  // 피보험자 리스트
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    // URL에서 쿼리 파라미터 읽기
    const product_cd = searchParams.get('product_cd') || '';
    const start_date = searchParams.get('start_date') || '';
    const start_hour = searchParams.get('start_hour') || '';
    const end_date = searchParams.get('end_date') || '';
    const end_hour = searchParams.get('end_hour') || '';
    const tour_num = searchParams.get('tour_num') || '';
    const tour_day = searchParams.get('tour_day') || '';
    const travel_country = searchParams.get('travel_country') || '';

    setProductCd(product_cd);
    setStartDate(start_date);
    setStartHour(start_hour);
    setEndDate(end_date);
    setEndHour(end_hour);
    setTourNum(tour_num);
    setTourDay(tour_day);
    setTravelCountry(travel_country);

    // 필수 파라미터가 없으면 step1으로 리다이렉트
    if (!product_cd || !start_date || !end_date || !tour_num) {
      router.push('/estimate/step1');
    }
  }, [searchParams, router]);

  // 피보험자 리스트 초기화 (tour_num만큼)
  useEffect(() => {
    if (showParticipantList && tourNum) {
      const num = parseInt(tourNum, 10);
      if (num > 0 && participants.length === 0) {
        const initialParticipants: Participant[] = [];
        for (let i = 0; i < num; i++) {
          initialParticipants.push({
            id: i + 1,
            gender: '남자',
            birthDate: '',
          });
        }
        setParticipants(initialParticipants);
      }
    }
  }, [showParticipantList, tourNum, participants.length]);

  const handleNextStep = async () => {
    if (!showParticipantList) {
      // 정보동의 화면에서 다음단계 클릭 시
      if (!agree) {
        alert('개인정보 수집 및 이용에 관한 동의를 해주세요.');
        return;
      }
      // 피보험자 리스트 입력 화면으로 전환
      setShowParticipantList(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 피보험자 리스트 입력 화면에서 다음단계 클릭 시
      // 신청자 정보 검증
      if (!contractorInfo.name) {
        alert('신청자 이름을 입력해주세요.');
        return;
      }
      if (!contractorInfo.phone || contractorInfo.phone.length < 10) {
        alert('휴대폰 번호를 정확히 입력해주세요.');
        return;
      }
      if (!contractorInfo.email1 || !contractorInfo.email2) {
        alert('이메일 주소를 입력해주세요.');
        return;
      }
      if (contractorInfo.email2 === '직접입력' && !contractorInfo.customEmail) {
        alert('이메일 도메인을 입력해주세요.');
        return;
      }
      
      // 피보험자 정보 검증
      for (const participant of participants) {
        if (!participant.birthDate || participant.birthDate.length !== 8) {
          alert('모든 피보험자의 생년월일(8자리)을 입력해주세요.');
          return;
        }
      }

      // 견적 신청 API 호출
      await handleSubmitEstimate();
    }
  };

  const handleSubmitEstimate = async () => {
    setIsSubmitting(true);
    
    try {
      const emailDomain = contractorInfo.email2 === '직접입력' ? contractorInfo.customEmail : contractorInfo.email2;
      const email = `${contractorInfo.email1}@${emailDomain}`;
      const trackingInfo = getTrackingInfo('PC');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/estimate/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_cd: productCd,
          start_date: startDate,
          start_hour: startHour,
          end_date: endDate,
          end_hour: endHour,
          tour_num: tourNum,
          tour_day: tourDay,
          contractor_name: contractorInfo.name,
          contractor_phone: contractorInfo.phone,
          contractor_email: email,
          affiliate: trackingInfo.affiliate,
          access_path: trackingInfo.access_path,
          travel_region: productCd === '국내여행' ? '전국일원' : null,
          travel_country: productCd === '해외여행' ? travelCountry : null,
          participants: participants.map((p, index) => ({
            sequence: index + 1,
            gender: p.gender,
            birth_date: p.birthDate,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCompletionModal(true);
      } else {
        alert(data.message || '견적 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('견적 신청 오류:', error);
      alert('견적 신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBeforeStep = () => {
    if (showParticipantList) {
      // 피보험자 리스트 화면에서 이전 단계 클릭 시 정보동의 화면으로
      setShowParticipantList(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // step1로 이동 (쿼리 파라미터로 데이터 전달)
      const params = new URLSearchParams({
        product_cd: productCd,
        start_date: startDate,
        start_hour: startHour,
        end_date: endDate,
        end_hour: endHour,
        tour_num: tourNum,
        tour_day: tourDay,
      });

      if (productCd === '해외여행' && travelCountry) {
        params.set('travel_country', travelCountry);
      }

      router.push(`/estimate/step1?${params.toString()}`);
    }
  };

  const handleParticipantChange = (index: number, field: keyof Participant, value: any) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  // 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${year}년 ${month}월 ${day}일`;
  };

  return (
    <div className="estimate-step2-page">
      <Header isMobile={false} />
      
      <main 
        className="estimate-content-pc"
        style={{ backgroundImage: `url(${getImagePath('/202309_main_bg02.png')})` }}
      >
        {/* 오른쪽 고정 버튼 */}
        <div className="container_box_w">
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCashModal(true); }}>
            <div className="fixedRight_b01">
              <p className="icon_cash"><span className="icon_cash01"></span></p>
              <p className="fixedRight_txt01">무사고캐시란?</p>
            </div>
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); setShowServiceModal(true); }}>
            <div className="fixedRight_b02" style={{}}>
              <p className="icon_menu"><span className="icon_menu01"></span></p>
              <p className="fixedRight_txt02">서비스<br/>전체보기</p>
            </div>
          </a>
        </div>

        <div className="form-section">
          <div className="form-container">
            <div className="form-card">
              <form name="inputForm" method="POST">
                {/* Header with title and steps */}
                <div className="form-header tourG_mat13 tourG_mab05">
                  <StepIndicator 
                    currentStep={2} 
                    stepLabels={['여행정보', '정보동의', '신청완료']}
                  />
                </div>

                {!showParticipantList ? (
                  <section className="">
                    <div className="tour2023_title10">개인(신용)정보의 수집 및 이용에 관한 동의</div>
                    <div className="content_agree_rdo">
                      <span className="tour2023_estimate_rdo">
                        <input 
                          type="radio" 
                          id="agree" 
                          name="agree"
                          checked={agree}
                          onChange={(e) => setAgree(e.target.checked)}
                        />
                        <label htmlFor="agree">동의합니다.</label>
                      </span>
                    </div>
                    <div className="content_agree_Box">
                      <p className="content_agree_Box01">
                        1. 고객정보의 수집 및 이용 목적<br/>저희 회사는 보험회사의 보험대리점으로서 「개인정보보호법」 및 「신용정보의 이용 및 보호에 관한 법률」에 따라 여행자 보험 견적과 관련하여 귀하의 개인(신용)정보를 수집 이용하고자 합니다. <br/><br/>
                        2. 수집하는 개인정보 항목 및 수집방법<br/>
                        ① 수집, 이용할 개인정보의 내용<br/>
                        신청자의 성명, 휴대폰번호, 전자우편주소, 여행자보험 보험료 산출을 위한 가입대상자의 성별, 생년월일<br/>
                        ② 수집방법 : 인터넷 홈페이지<br/><br/>
                        3. 개인정보의 보유 및 이용기간<br/>
                        수집/이용 목적을 달성할 때까지 보유 및 이용합니다.
                      </p>
                    </div>
                  </section>
                ) : (
                  <>
                    {/* 신청자 정보 */}
                    <div style={{ marginBottom: '30px' }}>
                      <p className="tour2023_title02" style={{ 
                        fontSize: '22px', 
                        fontWeight: 'bold', 
                        color: '#333',
                        marginBottom: '20px',
                      }}>
                        신청자 정보
                      </p>
                      <section className="tourGuard_Info">
                        {/* 이름 */}
                        <div className="tourGuard_form_tt mag5 tourG_mab03">
                          <label htmlFor="contractor_name">이름</label>
                          <input
                            type="text"
                            id="contractor_name"
                            name="contractor_name"
                            value={contractorInfo.name}
                            maxLength={15}
                            placeholder="이름입력"
                            className="tourGuard_input_w01"
                            onChange={(e) => setContractorInfo({ ...contractorInfo, name: e.target.value })}
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
                        </div>
                        
                        {/* 이메일 주소 */}
                        <div className="tourGuard_form_tt mag5 tourG_mab03">
                          <label htmlFor="email1">이메일 주소</label>
                          <input
                            type="text"
                            id="email1"
                            name="email1"
                            maxLength={20}
                            placeholder="아이디"
                            className="tourGuard_input_w01"
                            value={contractorInfo.email1}
                            onChange={(e) => setContractorInfo({ ...contractorInfo, email1: e.target.value })}
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
                          <div 
                            className="tourGuard_txt03"
                            style={{
                              marginTop: '23px',
                              marginLeft: '10px',
                            }}
                          >@</div>
                          <input
                            type="text"
                            id="email2"
                            name="email2"
                            maxLength={20}
                            className="tourGuard_input_w01"
                            value={contractorInfo.email2 === '직접입력' ? (contractorInfo.customEmail || '') : (contractorInfo.email2 || '')}
                            onChange={(e) => {
                              if (contractorInfo.email2 === '직접입력') {
                                setContractorInfo({ ...contractorInfo, customEmail: e.target.value });
                              } else {
                                setContractorInfo({ ...contractorInfo, email2: e.target.value });
                              }
                            }}
                            readOnly={contractorInfo.email2 !== '직접입력' && contractorInfo.email2 !== '' && contractorInfo.email2 !== undefined}
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
                          <div 
                            className="tourGuard_input_cell08 tourGuard_input_cell09 tourGuard"
                            style={{
                              marginTop: '23px',
                              marginLeft: '10px',
                              marginRight: '15px',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                            }}
                          >
                            <span className="tourGuard_ps_box" style={{
                              position: 'relative',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              height: '32px',
                              lineHeight: '32px',
                            }}>
                              <select
                                className="tourGuard_sel"
                                id="select_email"
                                name="select_email"
                                value={contractorInfo.email2 || ''}
                                onChange={(e) => {
                                  const email2 = e.target.value;
                                  setContractorInfo({ 
                                    ...contractorInfo, 
                                    email2: email2,
                                    customEmail: email2 !== '직접입력' ? '' : contractorInfo.customEmail
                                  });
                                }}
                                style={{
                                  flex: 1,
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                }}
                              >
                                <option value="">선택</option>
                                <option value="gmail.com">gmail.com</option>
                                <option value="naver.com">naver.com</option>
                                <option value="daum.net">daum.net</option>
                                <option value="nate.com">nate.com</option>
                                <option value="hotmail.com">hotmail.com</option>
                                <option value="직접입력">직접입력</option>
                              </select>
                              <img src="/icons/icon_sel.png" alt="선택" style={{ width: 'auto', height: '7px', marginLeft: '8px', pointerEvents: 'none' }} />
                            </span>
                          </div>
                        </div>
                        
                        {/* 휴대폰 번호 */}
                        <div className="tourGuard_form_tt mag5 tourG_mab03" style={{ paddingRight: '20px', position: 'relative' }}>
                          <label htmlFor="phone">휴대폰 번호</label>
                          <input
                            type="text"
                            id="phone"
                            value={contractorInfo.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                              setContractorInfo({ ...contractorInfo, phone: value });
                            }}
                            placeholder="숫자만 입력해주세요."
                            className="tourGuard_input_w01"
                            style={{
                              width: '70%',
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
                        </div>
                      </section>
                    </div>

                    {/* 피보험자 리스트 */}
                    <div className="tourG_mat13" style={{ marginTop: '30px' }}>
                      <p className="tour2023_title02" style={{ 
                        fontSize: '22px', 
                        fontWeight: 'bold', 
                        color: '#333',
                        marginBottom: '20px',
                      }}>
                        피보험자 리스트
                      </p>
                      <div>
                        <table width="100%" cellPadding="0" cellSpacing="0" className="tour2023_estimate_ta" style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          border: '1px solid #d8d8d8',
                        }}>
                          <tbody>
                            <tr>
                              <td className="tour2023_estimate_td01 tour2023_estimate_bg tour2023_estimate_w01" style={{
                                padding: '12px 10px',
                                border: '1px solid #d8d8d8',
                                background: '#ecf3f9',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                color: '#333',
                                width: '15%',
                              }}>
                                순번
                              </td>
                              <td className="tour2023_estimate_td01 tour2023_estimate_bg tour2023_estimate_w02" style={{
                                padding: '12px 10px',
                                border: '1px solid #d8d8d8',
                                background: '#ecf3f9',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                color: '#333',
                                width: '25%',
                              }}>
                                성별
                              </td>
                              <td className="tour2023_estimate_bg tour2023_estimate_w03" style={{
                                padding: '12px 10px',
                                border: '1px solid #d8d8d8',
                                background: '#ecf3f9',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                color: '#333',
                                width: '60%',
                              }}>
                                생년월일(8자리)
                              </td>
                            </tr>
                          </tbody>
                          <tbody id="insured_list">
                            {participants.map((participant, index) => (
                              <tr key={participant.id}>
                                <td className="tour2023_estimate_td01 tour2023_estimate_w01" style={{
                                  padding: '12px 10px',
                                  border: '1px solid #d8d8d8',
                                  textAlign: 'center',
                                  fontSize: '15px',
                                  color: '#333',
                                }}>
                                  {index + 1}
                                </td>
                                <td className="tour2023_estimate_td01 tour2023_estimate_w02" style={{
                                  padding: '12px 10px',
                                  border: '1px solid #d8d8d8',
                                }}>
                                  <div className="tour2023_estimate_area" style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div className="tour2023_estimate_rdo01_w" style={{ display: 'flex', gap: '15px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                                      <span className="tour2023_estimate_rdo01">
                                        <input
                                          type="radio"
                                          id={`gender_M_${participant.id}`}
                                          value="남자"
                                          name={`gender_${participant.id}`}
                                          checked={participant.gender === '남자'}
                                          onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                                        />
                                        <label htmlFor={`gender_M_${participant.id}`}>
                                          남자
                                        </label>
                                      </span>
                                      <span className="tour2023_estimate_rdo01">
                                        <input
                                          type="radio"
                                          id={`gender_W_${participant.id}`}
                                          value="여자"
                                          name={`gender_${participant.id}`}
                                          checked={participant.gender === '여자'}
                                          onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                                        />
                                        <label htmlFor={`gender_W_${participant.id}`}>
                                          여자
                                        </label>
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="tour2023_estimate_w03" style={{
                                  padding: '12px 10px',
                                  border: '1px solid #d8d8d8',
                                }}>
                                  <div className="tour2023_estimate_form_tt" style={{ textAlign: 'center' }}>
                                    <input
                                      type="text"
                                      id={`birth_${participant.id}`}
                                      name="birth"
                                      value={participant.birthDate}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        handleParticipantChange(index, 'birthDate', value);
                                      }}
                                      maxLength={8}
                                      placeholder="ex)19850505"
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '15px',
                                        textAlign: 'center',
                                        boxSizing: 'border-box',
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                        onClick={() => setShowExcelModal(true)}
                      >
                        <img 
                          src="/images/excel-icon.png" 
                          alt="엑셀 아이콘" 
                          className="excel-icon"
                        />
                        엑셀로 등록하기
                      </button>
                    </div>
                    
                    {/* 안내 문구 */}
                    <div className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mat06" style={{
                      marginTop: '20px',
                      marginBottom: '20px',
                    }}>
                      <ul className="tourGuard_inline" style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                        <li className="tourGuard_inline_t01" style={{ display: 'inline', marginRight: '5px' }}>※</li>
                        <li className="tourGuard_inline_t02" style={{ display: 'inline' }}>
                          여행자보험 견적서는 메일로 발송됩니다.
                        </li>
                      </ul>
                      <ul className="tourGuard_inline tourG_mat22" style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                        <li className="tourGuard_inline_t01" style={{ display: 'inline', marginRight: '5px' }}>※</li>
                        <li className="tourGuard_inline_t02" style={{ display: 'inline' }}>
                          메일에 첨부된<span className="tour2023_blue" style={{ color: '#1b37e1', fontWeight: 'bold' }}>견적서 출력하기</span>를 클릭하시면 견적서를 인쇄하여 사용하실 수 있습니다.
                        </li>
                      </ul>
                    </div>
                  </>
                )}

                <section className="tour2023_btn_ww">
                  <div className={`${showParticipantList ? 'tourG_mat12' : 'tourG_mat04'} tour2023_btn_ww01`}>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleBeforeStep(); }} className="tourGuard_btn_b tour2023_btn06_gray01">
                      {showParticipantList ? '이전단계' : '처음으로'}
                    </a>
                  </div>
                  <div className={`${showParticipantList ? 'tourG_mat12' : 'tourG_mat04'} tourG_mab02 tour2023_btn_ww02`}>
                    <a 
                      href="#" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (!isSubmitting) {
                          handleNextStep(); 
                        }
                      }} 
                      className="tourGuard_btn_b tour2023_btn01"
                      style={isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    >
                      {isSubmitting ? '처리 중...' : (showParticipantList ? '견적신청' : '다음단계')}
                    </a>
                  </div>
                </section>

                <input type="hidden" name="product_cd" value={productCd} />
                <input type="hidden" name="start_year" value={startDate.split('-')[0]} />
                <input type="hidden" name="start_month" value={startDate.split('-')[1]} />
                <input type="hidden" name="start_day" value={startDate.split('-')[2]} />
                <input type="hidden" name="start_date" value={startDate} />
                <input type="hidden" name="start_hour" value={startHour} />
                <input type="hidden" name="end_year" value={endDate.split('-')[0]} />
                <input type="hidden" name="end_month" value={endDate.split('-')[1]} />
                <input type="hidden" name="end_day" value={endDate.split('-')[2]} />
                <input type="hidden" name="end_date" value={endDate} />
                <input type="hidden" name="end_hour" value={endHour} />
                <input type="hidden" name="tour_num" value={tourNum} />
                <input type="hidden" name="tour_day" value={tourDay} />
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* 서비스 전체보기 모달 */}
      <ServiceModal 
        isOpen={showServiceModal} 
        onClose={() => setShowServiceModal(false)} 
      />
      
      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />

      {/* 엑셀 등록 모달 */}
      <ExcelUploadModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onUpload={(newParticipants, startId) => {
          // 기존 참가자 목록을 새로 파싱된 참가자들로 교체
          // 엑셀 파일에는 모든 피보험자가 포함되어 있으므로 전체 교체
          const participantsWithCorrectIds = newParticipants.map((p, index) => ({
            id: index + 1,
            gender: p.gender as '남자' | '여자',
            birthDate: p.birthDate,
          }));
          
          setParticipants(participantsWithCorrectIds);
          setShowExcelModal(false);
        }}
        currentParticipants={participants.map(p => ({
          id: p.id,
          name: '', // 피보험자 리스트에는 이름이 없음
          nationality: '내국인' as const,
          birthDate: p.birthDate,
          gender: p.gender,
          email1: '',
          email2: '',
          phone: '',
          isVerified: false,
        }))}
      />

      {/* 견적 신청 완료 모달 */}
      <EstimateCompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          router.push('/estimate/step1');
        }}
      />
    </div>
  );
}

export default function PCStep2Page() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>로딩 중...</div>
      </div>
    }>
      <PCStep2PageContent />
    </Suspense>
  );
}

