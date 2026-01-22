'use client';

import React from 'react';
import StepIndicator from './StepIndicator';

interface RiskActivityStepProps {
  insuranceType: string;
  hasDangerousActivity: boolean | null;
  travelPurpose: string;
  onDangerousActivityChange: (value: boolean | null) => void;
  onTravelPurposeChange: (purpose: string) => void;
  onShowDangerousActivityModal: () => void;
  onNext: () => void;
  // 해외여행보험용 추가 질문들
  isOverseas?: boolean; // 해외여행보험 여부
  isCurrentlyAbroad?: boolean | null; // 현재 출국/해외 체류 중 여부
  hasRestrictedCountry?: boolean | null; // 제한국가 포함 여부
  onCurrentlyAbroadChange?: (value: boolean | null) => void;
  onRestrictedCountryChange?: (value: boolean | null) => void;
  onShowRestrictedCountryModal?: () => void;
  // 해외장기체류보험용
  travelPurposeOptions?: string[]; // 여행목적 옵션 (해외장기체류보험용)
  isLongTermStay?: boolean; // 해외장기체류보험 여부
}

export default function RiskActivityStep({
  insuranceType,
  hasDangerousActivity,
  travelPurpose,
  onDangerousActivityChange,
  onTravelPurposeChange,
  onShowDangerousActivityModal,
  onNext,
  isOverseas = false,
  isCurrentlyAbroad = null,
  hasRestrictedCountry = null,
  onCurrentlyAbroadChange,
  onRestrictedCountryChange,
  onShowRestrictedCountryModal,
  travelPurposeOptions,
  isLongTermStay = false,
}: RiskActivityStepProps) {
  const handleTravelPurposeChange = (purpose: string) => {
    onTravelPurposeChange(purpose);
  };

  return (
    <section className="form-section">
      <div className="form-container">
        <div className="form-card">
          <div className="form-header">
            {/* <h1 className="form-title">{insuranceType}</h1> */}
            <h1 className="form-title"></h1>
            <StepIndicator currentStep={2} />
          </div>

          {/* 해외여행보험일 경우: 현재 출국/해외 체류 중 질문 */}
          {isOverseas && onCurrentlyAbroadChange && (
            <div className="step2-1-section">
              <div className="step2-1-question">
                <span className="question-number">1.</span>
                <span className="question-text">현재 출국하였거나 해외 체류 중이십니까?</span>
              </div>
              <div className="step2-1-options">
                <button
                  type="button"
                  className={`step2-1-option-btn ${isCurrentlyAbroad === true ? 'active' : ''}`}
                  onClick={() => {
                    onCurrentlyAbroadChange(true);
                    alert('죄송합니다. 고객님.\n해외여행보험에 가입하실 수 없습니다.\n\n해외장기체류보험 또는 워킹홀리데이플랜인 경우 당사갱신이나 타사갱신인 경우에는 보험가입이 가능합니다.\n\n고객센터로 연락주시기 바랍니다.\n1599-2541');
                    onCurrentlyAbroadChange(null);
                  }}
                >
                  예
                </button>
                <button
                  type="button"
                  className={`step2-1-option-btn ${isCurrentlyAbroad === false ? 'active' : ''}`}
                  onClick={() => onCurrentlyAbroadChange(false)}
                >
                  아니요
                </button>
              </div>
            </div>
          )}

          {/* 위험활동 확인 */}
          <div className="step2-1-section">
            <div className="step2-1-question">
              <span className="question-number">{isOverseas ? '2.' : '1.'}</span>
              <span className="question-text">여행기간 중 위험한 활동이 포함되어 있습니까?</span>
              <button
                type="button"
                className="dangerous-activity-check-btn"
                onClick={onShowDangerousActivityModal}
              >
                위험활동 확인
              </button>
            </div>
            <div className="step2-1-options">
              <button
                type="button"
                className={`step2-1-option-btn ${hasDangerousActivity === true ? 'active' : ''}`}
                onClick={() => {
                  onDangerousActivityChange(true);
                  alert('죄송합니다. 고객님\n여행기간중 위험한 활동이 포함된 경우 여행보험에 가입할 수 없습니다.');
                  onDangerousActivityChange(null);
                }}
              >
                예
              </button>
              <button
                type="button"
                className={`step2-1-option-btn ${hasDangerousActivity === false ? 'active' : ''}`}
                onClick={() => onDangerousActivityChange(false)}
              >
                아니요
              </button>
            </div>
          </div>

          {/* 해외여행보험일 경우: 제한국가 확인 질문 */}
          {isOverseas && onRestrictedCountryChange && onShowRestrictedCountryModal && (
            <div className="step2-1-section">
              <div className="step2-1-question">
                <span className="question-number">3.</span>
                <span className="question-text">여행하려는 나라(목적지, 경유지 포함)에 보험인수 제한국가가 포함되어 있습니까?</span>
                <button
                  type="button"
                  className="dangerous-activity-check-btn"
                  onClick={onShowRestrictedCountryModal}
                >
                  제한국가 확인
                </button>
              </div>
              <div className="step2-1-options">
                <button
                  type="button"
                  className={`step2-1-option-btn ${hasRestrictedCountry === true ? 'active' : ''}`}
                  onClick={() => {
                    onRestrictedCountryChange(true);
                    alert('죄송합니다. 고객님\n여행목적지 및 경유지에 인수제한 국가가 포함된 경우 여행보험에 가입할 수 없습니다.');
                    onRestrictedCountryChange(null);
                  }}
                >
                  예
                </button>
                <button
                  type="button"
                  className={`step2-1-option-btn ${hasRestrictedCountry === false ? 'active' : ''}`}
                  onClick={() => onRestrictedCountryChange(false)}
                >
                  아니요
                </button>
              </div>
            </div>
          )}

          {/* 여행목적 선택 */}
          {!isLongTermStay && (
            <div className="step2-1-section">
              <div className="step2-1-question">
                <span className="question-number">{isOverseas ? '4.' : '2.'}</span>
                <span className="question-text">여행목적</span>
              </div>
              <div className="step2-1-select-wrapper">
                <select
                  className="step2-1-select"
                  value={travelPurpose}
                  onChange={(e) => handleTravelPurposeChange(e.target.value)}
                >
                  <option value="">선택해 주세요</option>
                  {travelPurposeOptions && travelPurposeOptions.length > 0 ? (
                    travelPurposeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))
                  ) : (
                    <>
                      <option value="일반관광">일반관광</option>
                      <option value="출장/연수/교육">출장/연수/교육</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* 다음 버튼 */}
          <button
            type="button"
            className="step2-1-next-btn"
            onClick={onNext}
            disabled={
              (isOverseas && onCurrentlyAbroadChange && isCurrentlyAbroad === null) ||
              hasDangerousActivity === null || 
              hasDangerousActivity === true || 
              (isOverseas && onRestrictedCountryChange && hasRestrictedCountry === null) ||
              (isOverseas && onRestrictedCountryChange && hasRestrictedCountry === true) ||
              (!isLongTermStay && !travelPurpose)
            }
          >
            다음
          </button>
        </div>
      </div>
    </section>
  );
}

