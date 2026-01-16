'use client';

import React, { useRef, useEffect, useState } from 'react';
import StepIndicator from './StepIndicator';
import PlanSelection from './PlanSelection';
import CountrySelectModal from './CountrySelectModal';
import { PlanType, PlanInfo } from './types';

interface TravelInfoStepProps {
  // Form data
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  birthDate: string;
  gender: 'male' | 'female';
  hasMedicalExpense: boolean;
  selectedPlan: PlanType | null;
  planInfo: Record<string, PlanInfo> | null;
  participantCount: 1 | 2;
  isCalculating: boolean;
  showPlanSelection: boolean;
  
  // Handlers
  onDepartureDateChange: (date: string) => void;
  onDepartureTimeChange: (time: string) => void;
  onArrivalDateChange: (date: string) => void;
  onArrivalTimeChange: (time: string) => void;
  onBirthDateChange: (date: string) => void;
  onGenderChange: (gender: 'male' | 'female') => void;
  onMedicalExpenseChange: (value: boolean) => void;
  onPlanSelect: (plan: PlanType) => void;
  onParticipantCountChange: (count: 1 | 2) => void;
  onCalculate: () => void;
  onAddParticipant?: () => void;
  
  // Insurance type specific
  insuranceType: string;
  timeOptions?: number[];
  
  // 해외여행보험용 여행국가 필드
  travelCountry?: string;
  travelCountries?: Array<{ id: number; country_name: string }>;
  onTravelCountryChange?: (country: string) => void;
  showCountryModal?: boolean;
  onShowCountryModal?: (show: boolean) => void;
  
  // 해외장기체류보험용 여행목적 필드
  travelPurpose?: string;
  onTravelPurposeChange?: (purpose: string) => void;
  longTermPurposeOptions?: Array<{ value: string; label: string }>;
  
  // 해외장기체류보험용 통화 플랜 필드
  currencyPlan?: '원화' | '외화';
  onCurrencyPlanChange?: (plan: '원화' | '외화') => void;
}

export default function TravelInfoStep({
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  birthDate,
  gender,
  hasMedicalExpense,
  selectedPlan,
  planInfo,
  participantCount,
  isCalculating,
  showPlanSelection,
  onDepartureDateChange,
  onDepartureTimeChange,
  onArrivalDateChange,
  onArrivalTimeChange,
  onBirthDateChange,
  onGenderChange,
  onMedicalExpenseChange,
  onPlanSelect,
  onParticipantCountChange,
  onCalculate,
  onAddParticipant,
  insuranceType,
  timeOptions = Array.from({ length: 24 }, (_, i) => i + 1),
  travelCountry,
  travelCountries,
  onTravelCountryChange,
  showCountryModal = false,
  onShowCountryModal,
  travelPurpose,
  onTravelPurposeChange,
  longTermPurposeOptions,
  currencyPlan,
  onCurrencyPlanChange,
}: TravelInfoStepProps) {
  const planSelectionRef = useRef<HTMLDivElement>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [hasSelectedDepartureDate, setHasSelectedDepartureDate] = useState(false);
  const [hasSelectedArrivalDate, setHasSelectedArrivalDate] = useState(false);

  // 보험료 계산 결과가 표시되면 해당 위치로 스크롤
  useEffect(() => {
    if (showPlanSelection && planSelectionRef.current) {
      planSelectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }
  }, [showPlanSelection]);

  // 해외장기체류보험: travelPurpose가 비어있을 때 디폴트 값 설정
  useEffect(() => {
    if (onTravelPurposeChange && !travelPurpose) {
      onTravelPurposeChange('유학/어학연수');
    }
  }, [onTravelPurposeChange, travelPurpose]);

  return (
    <section className="form-section">
      <div className="form-container">
        <div className="form-card">
          {/* Header with title and steps */}
          <div className="form-header tourG_mat13 tourG_mab05">
            <p className="form-title tour2023_title01">{insuranceType}</p>
            <StepIndicator currentStep={1} />
          </div>

          {/* Form Fields */}
          <div className="form-fields">
            {/* 출발일 */}
            <div className="field-row tourG_line">
              <div className="field-group date-field">
                <label className="field-label">출발일</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => {
                    onDepartureDateChange(e.target.value);
                    setHasSelectedDepartureDate(true);
                  }}
                  onClick={(e) => {
                    // 달력을 열 때 이미 값이 있으면 선택된 것으로 간주
                    if (e.currentTarget.value) {
                      setHasSelectedDepartureDate(true);
                    }
                  }}
                  onBlur={(e) => {
                    // 달력에서 날짜를 선택한 후 포커스가 벗어날 때
                    if (e.target.value) {
                      setHasSelectedDepartureDate(true);
                    }
                  }}
                  className={`field-input date-input ${hasSelectedDepartureDate ? 'has-value' : ''}`}
                />
              </div>
              <span className="field-separator">/</span>
              <div className="field-group time-field">
                <select
                  value={departureTime}
                  onChange={(e) => onDepartureTimeChange(e.target.value)}
                  className="field-input time-select"
                >
                  {timeOptions.map((hour) => (
                    <option key={hour} value={String(hour).padStart(2, '0')}>
                      {String(hour).padStart(2, '0')}시
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 도착일 */}
            <div className="field-row tourG_line">
              <div className="field-group date-field">
                <label className="field-label">도착일</label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => {
                    onArrivalDateChange(e.target.value);
                    setHasSelectedArrivalDate(true);
                  }}
                  onClick={(e) => {
                    // 달력을 열 때 이미 값이 있으면 선택된 것으로 간주
                    if (e.currentTarget.value) {
                      setHasSelectedArrivalDate(true);
                    }
                  }}
                  onBlur={(e) => {
                    // 달력에서 날짜를 선택한 후 포커스가 벗어날 때
                    if (e.target.value) {
                      setHasSelectedArrivalDate(true);
                    }
                  }}
                  className={`field-input date-input ${hasSelectedArrivalDate ? 'has-value' : ''}`}
                />
              </div>
              <span className="field-separator">/</span>
              <div className="field-group time-field">
                <select
                  value={arrivalTime}
                  onChange={(e) => onArrivalTimeChange(e.target.value)}
                  className="field-input time-select"
                >
                  {timeOptions.map((hour) => (
                    <option key={hour} value={String(hour).padStart(2, '0')}>
                      {String(hour).padStart(2, '0')}시
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 생년월일 & 성별 */}
            <div className="field-row tourG_line">
              <div className="field-group birth-field">
                <label className="field-label">생년월일 8자리</label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => onBirthDateChange(e.target.value)}
                  placeholder="예)19981022"
                  className="field-input birth-input"
                  maxLength={8}
                />
              </div>
              <span className="field-separator">/</span>
              <div className="field-group gender-field">
                <label className="field-label">성별</label>
                <div className="gender-options">
                  <label className={`gender-option ${gender === 'male' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => onGenderChange(e.target.value as 'male' | 'female')}
                      className="gender-radio"
                    />
                    <span className="gender-text">남자</span>
                  </label>
                  <label className={`gender-option ${gender === 'female' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => onGenderChange(e.target.value as 'male' | 'female')}
                      className="gender-radio"
                    />
                    <span className="gender-text">여자</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 여행국가 (해외여행보험용) */}
            {onTravelCountryChange && (
              <>
                <div className="field-row">
                  <div className="field-group country-field" style={{ width: '100%' }}>
                    <label className="field-label">여행국가</label>
                    <div
                      onClick={() => {
                        setIsCountryModalOpen(true);
                        if (onShowCountryModal) {
                          onShowCountryModal(true);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0 10px',
                        paddingRight: '25px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: travelCountry ? '#000' : '#dddddd',
                        fontWeight: 'normal',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '25px',
                        marginLeft: '10px',
                        height: '32px',
                        lineHeight: '32px',
                      }}
                    >
                      <span>{travelCountry || ''}</span>
                      <img src="/icons/icon_sel.png" alt="선택" style={{ width: 'auto', height: '10px', marginLeft: '8px' }} />
                    </div>
                  </div>
                </div>
                {/* 해외여행보험인 경우에만 안내 문구 표시 (해외장기체류보험 제외) */}
                {!onTravelPurposeChange && (
                  <div className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mab04 tourG_mat06" style={{ marginLeft: '5px', marginTop: '15px', marginBottom: '35px', color: '#a5a5a5', fontWeight: 'normal' }}>
                    <ul className="tourGuard_inline">
                      <li className="tourGuard_inline_t01">※</li>
                      <li className="tourGuard_inline_t02">
                        여러국가를 여행하는 경우 <span className="tour2023_blue">최초 방문국가를</span> 선택하세요.<br />
                        단, <span className="tour2023_blue">체코</span>가 포함된 여행인 경우 여행국가는 꼭 체코로 선택하시기 바랍니다.
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* 여행목적 (해외장기체류보험용) */}
            {onTravelPurposeChange && longTermPurposeOptions && (
              <>
                <div className="field-row">
                  <div className="field-group purpose-field" style={{ width: '100%' }}>
                    <label className="field-label">여행목적</label>
                    <div
                      style={{
                        width: '100%',
                        padding: '0 10px',
                        paddingRight: '25px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: travelPurpose ? '#000' : '#dddddd',
                        fontWeight: 'normal',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '25px',
                        marginLeft: '10px',
                        height: '32px',
                        lineHeight: '32px',
                      }}
                    >
                      <select
                        value={travelPurpose || '유학/어학연수'}
                        onChange={(e) => onTravelPurposeChange(e.target.value)}
                        className="purpose-select"
                        style={{
                          flex: 1,
                          height: '32px',
                          padding: '0',
                          border: '0',
                          color: (travelPurpose || '유학/어학연수') ? '#000' : '#dddddd',
                          fontSize: '18px',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontWeight: 'normal',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          lineHeight: '32px',
                        }}
                      >
                        {longTermPurposeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <img src="/icons/icon_sel.png" alt="선택" style={{ width: 'auto', height: '10px', marginLeft: '8px', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>
                {/* 해외장기체류보험인 경우 여행목적 필드 아래에 안내 문구 표시 */}
                <div className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mab04 tourG_mat06" style={{ marginLeft: '5px', marginTop: '15px', marginBottom: '35px', color: '#a5a5a5', fontWeight: 'normal' }}>
                  <ul className="tourGuard_inline">
                    <li className="tourGuard_inline_t01">※</li>
                    <li className="tourGuard_inline_t02">
                      여러국가를 여행하는 경우 <span className="tour2023_blue">최초 방문국가를</span> 선택하세요.<br />
                      단, <span className="tour2023_blue">체코</span>가 포함된 여행인 경우 여행국가는 꼭 체코로 선택하시기 바랍니다.
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Calculate Button */}
          <button 
            className="calculate-btn"
            onClick={onCalculate}
            disabled={isCalculating || showPlanSelection}
          >
            {isCalculating ? '계산 중...' : '보험료 계산하기'}
          </button>

          {/* Group Insurance Link - 보험료 계산 결과가 없을 때만 표시 */}
          {/* 
            주의: 인라인 스타일 사용 (CSS 파일 대신)
            이유: Next.js 프로덕션 빌드 시 CSS 우선순위 충돌 방지
            배경: #ffffff으로 배경 이미지 투과 방지
            마이너스 마진: 카드 전체 영역으로 확장
          */}
          {!showPlanSelection && (
            <div 
              className="group-insurance-section"
              style={{
                marginTop: '32px',
                paddingTop: '24px',
                paddingBottom: '16px',
                borderTop: '1px solid #eee',
                textAlign: 'center',
                overflow: 'visible',
                position: 'relative',
                zIndex: 9999,
                width: '100%',
                background: '#ffffff',
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}
            >
              <a 
                href="/group-insurance" 
                className="group-insurance-link"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '18px',
                  background: '#fff',
                  color: '#2843e5',
                  textDecoration: 'none',
                  border: '1px solid #2843e5',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '12px',
                  position: 'relative',
                  zIndex: 10000,
                  visibility: 'visible',
                  opacity: 1,
                  textAlign: 'center',
                  transition: 'border 0.2s, color 0.2s'
                }}
              >
                단체여행자보험(사업자/법인) <span style={{ marginLeft: '4px' }}>›</span>
              </a>
              <p 
                className="group-insurance-desc"
                style={{
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.6',
                  margin: 0,
                  position: 'relative',
                  zIndex: 10000,
                  wordBreak: 'keep-all',
                  whiteSpace: 'normal',
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1,
                  textAlign: 'center'
                }}
              >
                사업자번호가 있는 <span style={{ color: '#2843e5', fontWeight: 600 }}>회사, 학교, 종교단체, 관공서</span> 등<br />
                단체 전문 플랜
              </p>
            </div>
          )}

          {/* 보험료 계산 결과 화면 */}
          {showPlanSelection && planInfo && (
            <div ref={planSelectionRef}>
              <PlanSelection
                planInfo={planInfo}
                selectedPlan={selectedPlan}
                onPlanSelect={onPlanSelect}
                hasMedicalExpense={hasMedicalExpense}
                onMedicalExpenseChange={onMedicalExpenseChange}
                participantCount={participantCount}
                onParticipantCountChange={onParticipantCountChange}
                onAddParticipant={onAddParticipant}
                insuranceType={insuranceType}
                currencyPlan={currencyPlan}
                onCurrencyPlanChange={onCurrencyPlanChange}
                travelCountry={travelCountry}
                travelPurpose={travelPurpose}
              />
            </div>
          )}
        </div>
      </div>

      {/* 여행국가 선택 모달 */}
      {onTravelCountryChange && (
        <CountrySelectModal
          isOpen={isCountryModalOpen}
          onClose={() => {
            setIsCountryModalOpen(false);
            if (onShowCountryModal) {
              onShowCountryModal(false);
            }
          }}
          onSelect={(countryCode, countryName) => {
            onTravelCountryChange(countryName);
            setIsCountryModalOpen(false);
            if (onShowCountryModal) {
              onShowCountryModal(false);
            }
          }}
          selectedCountry={travelCountry}
        />
      )}
    </section>
  );
}

