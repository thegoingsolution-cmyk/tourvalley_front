'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getImagePath } from '@/utils/path';
import './page.css';

export default function MobileOverseasPage() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];

  const [departureDate, setDepartureDate] = useState(formattedDate);
  const [departureTime, setDepartureTime] = useState('11');
  const [arrivalDate, setArrivalDate] = useState(formattedDate);
  const [arrivalTime, setArrivalTime] = useState('11');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('male');
  const [travelCountry, setTravelCountry] = useState('');

  const timeOptions = Array.from({ length: 24 }, (_, i) => i);

  const handleCalculate = () => {
    console.log('보험료 계산:', {
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      birthDate,
      gender,
      travelCountry
    });
  };

  return (
    <div className="overseas-page-mobile">
      <Header isMobile={true} />
      
      <main className="overseas-content-mobile">
        {/* Background with city skyline */}
        <div className="overseas-background-mobile">
          <img
            src={getImagePath('/202309_main_bg02.png')}
            alt="도시 배경"
            className="background-image-mobile"
          />
        </div>

        {/* Main Form Section */}
        <section className="form-section-mobile">
          <div className="form-container-mobile">
            <div className="form-card-mobile">
              {/* Header with title and steps */}
              <div className="form-header-mobile">
                <h1 className="form-title-mobile">해외여행자보험</h1>
                <div className="step-indicator-mobile">
                  <div className="step-mobile active">
                    <span className="step-number-mobile">1</span>
                    <span className="step-label-mobile">여행정보</span>
                  </div>
                  <div className="step-line-mobile"></div>
                  <div className="step-mobile">
                    <span className="step-number-mobile">2</span>
                    <span className="step-label-mobile">가입정보</span>
                  </div>
                  <div className="step-line-mobile"></div>
                  <div className="step-mobile">
                    <span className="step-number-mobile">3</span>
                    <span className="step-label-mobile">신청완료</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-fields-mobile">
                {/* 출발일 */}
                <div className="field-row-mobile">
                  <div className="field-group-mobile date-field-mobile">
                    <label className="field-label-mobile">출발일</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="field-input-mobile date-input-mobile"
                    />
                  </div>
                  <span className="field-separator-mobile">/</span>
                  <div className="field-group-mobile time-field-mobile">
                    <select
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="field-input-mobile time-select-mobile"
                    >
                      {timeOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}시
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 도착일 */}
                <div className="field-row-mobile">
                  <div className="field-group-mobile date-field-mobile">
                    <label className="field-label-mobile">도착일</label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="field-input-mobile date-input-mobile"
                    />
                  </div>
                  <span className="field-separator-mobile">/</span>
                  <div className="field-group-mobile time-field-mobile">
                    <select
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="field-input-mobile time-select-mobile"
                    >
                      {timeOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}시
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 생년월일 & 성별 */}
                <div className="field-row-mobile">
                  <div className="field-group-mobile birth-field-mobile">
                    <label className="field-label-mobile">생년월일 8자리</label>
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="예)19981022"
                      className="field-input-mobile birth-input-mobile"
                      maxLength={8}
                    />
                  </div>
                  <span className="field-separator-mobile">/</span>
                  <div className="field-group-mobile gender-field-mobile">
                    <label className="field-label-mobile">성별</label>
                    <div className="gender-options-mobile">
                      <label className={`gender-option-mobile ${gender === 'male' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={gender === 'male'}
                          onChange={(e) => setGender(e.target.value)}
                          className="gender-radio-mobile"
                        />
                        <span className="gender-text-mobile">남자</span>
                      </label>
                      <label className={`gender-option-mobile ${gender === 'female' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={gender === 'female'}
                          onChange={(e) => setGender(e.target.value)}
                          className="gender-radio-mobile"
                        />
                        <span className="gender-text-mobile">여자</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 여행국가 */}
                <div className="field-row-mobile">
                  <div className="field-group-mobile country-field-mobile" style={{ width: '100%' }}>
                    <label className="field-label-mobile">여행국가</label>
                    <div
                      onClick={() => {
                        // 모달 열기 (추후 구현)
                        alert('여행국가 선택 모달 (모바일 버전은 추후 구현)');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #ddd',
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
                      <span>{travelCountry || '선택해주세요'}</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>▼</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <button className="calculate-btn-mobile" onClick={handleCalculate}>
                보험료 계산하기
              </button>

              {/* Group Insurance Link */}
              <div className="group-insurance-section-mobile">
                <a href="/group-insurance" className="group-insurance-link-mobile">
                  단체여행자보험(사업자/법인) <span className="link-arrow-mobile">›</span>
                </a>
                <p className="group-insurance-desc-mobile">
                  사업자번호가 있는 <span className="highlight-text-mobile">회사, 학교, 종교단체, 관공서</span> 등<br />
                  단체 전문 플랜
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

