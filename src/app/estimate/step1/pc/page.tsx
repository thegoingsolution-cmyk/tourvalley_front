'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceModal from '@/components/ServiceModal';
import AccidentFreeCashModal from '@/components/travel/AccidentFreeCashModal';
import CountrySelectModal from '@/components/travel/CountrySelectModal';
import StepIndicator from '@/components/travel/StepIndicator';
import { getImagePath } from '@/utils/path';
import './page.css';

export default function PCStep1Page() {
  const router = useRouter();
  
  // 오늘 날짜를 기본값으로 설정
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  
  // 현재 시간 + 2시간을 기본값으로 설정 (24시까지)
  const currentHour = today.getHours();
  const calculatedHour = currentHour + 2;
  const defaultHour = calculatedHour === 24 ? 24 : (calculatedHour > 24 ? calculatedHour % 24 || 24 : calculatedHour);

  const [startDate, setStartDate] = useState(formattedDate);
  const [startHour, setStartHour] = useState(String(defaultHour).padStart(2, '0'));
  const [endDate, setEndDate] = useState(formattedDate);
  const [endHour, setEndHour] = useState(String(defaultHour).padStart(2, '0'));
  const [tourNum, setTourNum] = useState('1');
  const [productCd, setProductCd] = useState('국내여행'); // 기본값: 국내여행
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [travelCountry, setTravelCountry] = useState('');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // 시간 옵션 생성 (01시 ~ 24시)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i + 1;
    return { value: String(hour).padStart(2, '0'), label: `${hour}시` };
  });

  // 인원 옵션 생성 (1명 ~ 250명)
  const numOptions = Array.from({ length: 250 }, (_, i) => {
    const num = i + 1;
    return { value: String(num), label: `${num}명` };
  });

  const handleNextStep = () => {
    // 유효성 검사
    if (!startDate) {
      alert('출발일을 입력해주세요.');
      return;
    }
    if (!startHour) {
      alert('출발 시간을 입력해주세요.');
      return;
    }
    if (!endDate) {
      alert('도착일을 입력해주세요.');
      return;
    }
    if (!endHour) {
      alert('도착 시간을 입력해주세요.');
      return;
    }
    if (!tourNum) {
      alert('피보험자 수를 입력해주세요.');
      return;
    }

    // 날짜 유효성 검사
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      alert('도착일은 출발일보다 이전일 수 없습니다.');
      return;
    }

    // 여행 기간 계산
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      alert('여행 기간을 확인해 주세요.');
      return;
    }

    if (diffDays > 365) {
      alert('죄송합니다. 고객님! 여행보험의 최대보험기간은 1년입니다.\n1년이하로 재설정하여 주시기 바랍니다.');
      return;
    }

    // step2로 이동 (쿼리 파라미터로 데이터 전달)
    const params = new URLSearchParams({
      product_cd: productCd,
      start_date: startDate,
      start_hour: startHour,
      end_date: endDate,
      end_hour: endHour,
      tour_num: tourNum,
      tour_day: String(diffDays),
    });

    router.push(`/estimate/step2?${params.toString()}`);
  };

  return (
    <div className="estimate-step1-page">
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
          <div className="form-card">
              <form name="inputForm" method="POST">
                <div className="prow_01">
                  <div className="form-header tourG_mat13 tourG_mab05">
                    <p className="form-title tour2023_title01">여행자보험 견적신청</p>
                    <StepIndicator 
                      currentStep={1} 
                      stepLabels={['여행정보', '정보동의', '신청완료']}
                    />
                  </div>

                  <div className="menu_wrap_tab tourG_mat10 tourG_mab05">
                    <span 
                      className={`menu_tab ${productCd === '국내여행' ? 'on' : ''}`}
                      onClick={() => setProductCd('국내여행')}
                    >
                      <a href="#" onClick={(e) => e.preventDefault()}>국내여행</a>
                    </span>
                    <span 
                      className={`menu_tab ${productCd === '해외여행' ? 'on' : ''}`}
                      onClick={() => setProductCd('해외여행')}
                    >
                      <a href="#" onClick={(e) => e.preventDefault()}>해외여행</a>
                    </span>
                    <span 
                      className={`menu_tab ${productCd === '해외장기체류' ? 'on' : ''}`}
                      onClick={() => {
                        alert('준비중입니다.');
                      }}
                    >
                      <a href="#" onClick={(e) => e.preventDefault()}>해외장기체류</a>
                    </span>
                  </div>

                  <div className="tourGuard_Info">
                    <div className="form-fields">
                      {/* 출발일 */}
                      <div className="field-row">
                        <div className="field-group date-field">
                          <label className="field-label">출발일</label>
                          <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            className="field-input date-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={formattedDate}
                          />
                        </div>
                        <span className="field-separator">/</span>
                        <div className="field-group time-field">
                          <select
                            id="start_hour"
                            name="start_hour"
                            className="field-input time-select"
                            value={startHour}
                            onChange={(e) => setStartHour(e.target.value)}
                          >
                            {hourOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 도착일 */}
                      <div className="field-row">
                        <div className="field-group date-field">
                          <label className="field-label">도착일</label>
                          <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            className="field-input date-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || formattedDate}
                          />
                        </div>
                        <span className="field-separator">/</span>
                        <div className="field-group time-field">
                          <select
                            id="end_hour"
                            name="end_hour"
                            className="field-input time-select"
                            value={endHour}
                            onChange={(e) => setEndHour(e.target.value)}
                          >
                            {hourOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="field-row">
                      <div className="field-group">
                        <label className="field-label" htmlFor="tour_num">인원</label>
                        <select
                          id="tour_num"
                          name="tour_num"
                          className="field-input"
                          value={tourNum}
                          onChange={(e) => setTourNum(e.target.value)}
                          required
                        >
                          {numOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 여행국가 (해외여행보험용) */}
                    {productCd === '해외여행' && (
                      <div className="field-row">
                        <div className="field-group country-field" style={{ width: '100%' }}>
                          <label className="field-label">여행국가</label>
                          <div
                            onClick={() => {
                              setIsCountryModalOpen(true);
                              // onShowCountryModal 콜백이 필요하면 여기에 추가
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              fontSize: '16px',
                              color: travelCountry ? '#333' : '#999',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>{travelCountry || '여행국가를 선택하세요'}</span>
                            <span style={{ fontSize: '12px', color: '#999' }}>▼</span>
                          </div>
                          {travelCountry && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                              <p style={{ margin: 0 }}>
                                ※ 여러국가를 여행하는 경우 <span style={{ color: '#2843e5', fontWeight: 600 }}>최초 방문국가</span>를 선택하세요.
                              </p>
                              <p style={{ margin: '4px 0 0 0' }}>
                                단, <span style={{ color: '#2843e5', fontWeight: 600 }}>체코</span>가 포함된 여행인 경우 여행국가는 꼭 체코로 선택하시기 바랍니다.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="tourG_mat04 tourG_mab02">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNextStep(); }} className="tourGuard_btn_b tour2023_btn01">
                      다음단계
                    </a>
                  </div>

                  <section className="tourG_pat02" style={{ paddingBottom: '20px' }}>
                    <div className="tourG_box_know">
                      <p className="tourG_know_tit">※ 참고하세요.</p>
                      <ul className="tourG_know_s tourG_mat08 tourG_mab09">
                        <li className="know_dot"></li>
                        <li className="tourG_know_txt">
                          견적서는 신청시간 기준 2시간 이내(고객센터 마감 후에는 다음 영업시간 1시간 이내)에 메일로 발송하여 드립니다.
                        </li>
                      </ul>
                      <ul className="tourG_know_s tourG_mab09">
                        <li className="know_dot"></li>
                        <li className="tourG_know_txt">
                          견적서를 출력하여 사용하시는 경우에는 견적메일에서 <span className="tour2023_blue"><strong>견적서 출력하</strong>기</span>를 클릭하시면 인쇄가 가능합니다.
                        </li>
                      </ul>
                      <ul className="tourG_know_s tourG_mat08 tourG_mab09">
                        <li className="know_dot"></li>
                        <li className="tourG_know_txt">
                          견적신청 시에는 피보험자(가입자)의 성별 및 생년월일만 입력하면 되지만 <span className="tour2023_blue"><strong>여행자보험에 가입하려면 가입자(피보험자)의 이름이 추가로 필요합니다.</strong></span> 인원이 많은 경우에는 엑셀파일 업로드를 이용할 수 있습니다.
                        </li>
                      </ul>
                      <ul className="tourG_know_s tourG_mat08 tourG_mab09">
                        <li className="know_dot"></li>
                        <li className="tourG_know_txt">
                          보험료는 가입일자 기준으로 보험나이가 적용됩니다. <span className="tour2023_blue">견적일자와 가입일자가 다른 경우 보험나이의 변경으로 인해 보험료가 다소 달라질 수 있습니다.</span>
                        </li>
                      </ul>
                    </div>
                  </section>
                </div>

                <input type="hidden" name="product_cd" value={productCd} />
                <input type="hidden" name="start_year" value={startDate.split('-')[0]} />
                <input type="hidden" name="start_month" value={startDate.split('-')[1]} />
                <input type="hidden" name="start_day" value={startDate.split('-')[2]} />
                <input type="hidden" name="end_year" value={endDate.split('-')[0]} />
                <input type="hidden" name="end_month" value={endDate.split('-')[1]} />
                <input type="hidden" name="end_day" value={endDate.split('-')[2]} />
              </form>
          </div>
        </div>
      </main>

      <Footer isMobile={false} />

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

      {/* 여행국가 선택 모달 */}
      {productCd === '해외여행' && (
        <CountrySelectModal
          isOpen={isCountryModalOpen}
          onClose={() => {
            setIsCountryModalOpen(false);
            // onShowCountryModal 콜백이 필요하면 여기에 추가
          }}
          onSelect={(countryCode, countryName) => {
            setTravelCountry(countryName);
            setIsCountryModalOpen(false);
            // onShowCountryModal 콜백이 필요하면 여기에 추가
          }}
          selectedCountry={travelCountry}
        />
      )}
    </div>
  );
}

