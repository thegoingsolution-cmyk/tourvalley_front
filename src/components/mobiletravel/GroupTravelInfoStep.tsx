'use client';

import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import type { ReactDatePickerCustomHeaderProps } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ko', ko);

/** 이전/다음 달 버튼이 포커스를 받지 않도록 → 실제 폰에서 2번째 클릭 시 z-index 밀림 방지 */
function CalendarHeaderNoFocus(props: ReactDatePickerCustomHeaderProps) {
  const { monthDate, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled } = props;
  const monthLabel = format(monthDate, 'yyyy년 MM월', { locale: ko });
  const stopFocus = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div className="react-datepicker__header-wrapper">
      {!prevMonthButtonDisabled && (
        <button
          type="button"
          tabIndex={-1}
          className="react-datepicker__navigation react-datepicker__navigation--previous"
          onClick={decreaseMonth}
          onMouseDown={stopFocus}
          aria-label="이전 달"
        >
          <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--previous" />
        </button>
      )}
      <button
        type="button"
        tabIndex={-1}
        className={`react-datepicker__navigation react-datepicker__navigation--next ${nextMonthButtonDisabled ? 'react-datepicker__navigation--next--disabled' : ''}`}
        onClick={increaseMonth}
        onMouseDown={stopFocus}
        disabled={nextMonthButtonDisabled}
        aria-label="다음 달"
      >
        <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--next" />
      </button>
      <div className="react-datepicker__header">
        <h2 className="react-datepicker__current-month">{monthLabel}</h2>
      </div>
    </div>
  );
}

// 날짜 포맷 함수
const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// 날짜 파싱 함수
const parseDate = (dateString: string): Date | null => {
  try {
    return parse(dateString, 'yyyy-MM-dd', new Date());
  } catch {
    return null;
  }
};

interface GroupTravelInfoStepProps {
  // Form data
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  birthDate: string;
  gender: 'M' | 'W';
  travelCountry: string;
  travelPurpose?: string; // 장기여행일 때만 사용
  type?: 'short' | 'long' | 'group'; // 여행 타입
  participantCount?: string; // 가입자 수
  
  // Handlers
  onDepartureDateChange: (date: string) => void;
  onDepartureTimeChange: (time: string) => void;
  onArrivalDateChange: (date: string) => void;
  onArrivalTimeChange: (time: string) => void;
  onBirthDateChange: (date: string) => void;
  onGenderChange: (gender: 'M' | 'W') => void;
  onTravelCountryChange: (country: string) => void;
  onTravelPurposeChange?: (purpose: string) => void;
  onParticipantCountChange?: (count: string) => void;
  onInputButtonClick?: () => void;
  hasGroupParticipants?: boolean; // 입력 완료 여부
  
  // Options
  travelCountries?: Array<{ code: string; name: string }>;
  frequentCountries?: Array<{ code: string; name: string }>;
  travelPurposeOptions?: Array<{ value: string; label: string }>;
  timeOptions?: number[];
}

export default function MobileGroupTravelInfoStep({
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  birthDate,
  gender,
  travelCountry,
  travelPurpose = 'N010001',
  type = 'short',
  participantCount = '',
  onDepartureDateChange,
  onDepartureTimeChange,
  onArrivalDateChange,
  onArrivalTimeChange,
  onBirthDateChange,
  onGenderChange,
  onTravelCountryChange,
  onTravelPurposeChange,
  onParticipantCountChange,
  onInputButtonClick,
  hasGroupParticipants = false,
  travelCountries = [],
  frequentCountries = [],
  travelPurposeOptions,
  timeOptions = Array.from({ length: 24 }, (_, i) => i + 1),
}: GroupTravelInfoStepProps) {
  const [hasSelectedDepartureDate, setHasSelectedDepartureDate] = useState(false);
  const [hasSelectedArrivalDate, setHasSelectedArrivalDate] = useState(false);

  // 날짜가 이미 선택되어 있을 때 상태 초기화
  useEffect(() => {
    if (departureDate) {
      setHasSelectedDepartureDate(true);
    }
  }, [departureDate]);

  useEffect(() => {
    if (arrivalDate) {
      setHasSelectedArrivalDate(true);
    }
  }, [arrivalDate]);

  const handleParticipantCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 2) {
      onParticipantCountChange && onParticipantCountChange(value);
    }
  };

  return (
    <form name="groupInputForm" method="POST">
      <div className="tourGuard_Info">
        {/* 출발일 */}
        <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line departure-date-field">
          <label>출발일</label>
          <div className="date-picker-wrapper" style={{ width: '45%', display: 'inline-block' }}>
            <DatePicker
              selected={departureDate ? parseDate(departureDate) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  const formattedDate = formatDate(date);
                  onDepartureDateChange(formattedDate);
                  setHasSelectedDepartureDate(true);
                } else {
                  onDepartureDateChange('');
                  setHasSelectedDepartureDate(false);
                }
              }}
              onSelect={(date: Date | null) => {
                if (date) {
                  const formattedDate = formatDate(date);
                  onDepartureDateChange(formattedDate);
                  setHasSelectedDepartureDate(true);
                }
              }}
              dateFormat="yyyy-MM-dd"
              formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
              locale="ko"
              placeholderText="날짜 선택"
              dateFormatCalendar="yyyy년 MM월"
              className={`tourGuard_input_w01 ${hasSelectedDepartureDate ? 'has-value' : ''}`}
              wrapperClassName="date-picker-wrapper"
              calendarClassName="custom-calendar"
              popperClassName="custom-popper"
              minDate={new Date()}
              showPopperArrow={false}
              popperPlacement="bottom-start"
              shouldCloseOnSelect={true}
              renderCustomHeader={(p) => <CalendarHeaderNoFocus {...p} />}
              strictParsing
            />
          </div>
          {/* 시간 */}
          <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell02 tourGuard" style={{ marginRight: 0 }}>
            <span className="tourGuard_ps_box">
              <select
                className="tourGuard_sel07"
                id="group_start_hour"
                name="group_start_hour"
                value={departureTime}
                onChange={(e) => onDepartureTimeChange(e.target.value)}
              >
                {timeOptions.map((hour) => (
                  <option key={hour} value={String(hour).padStart(2, '0')}>
                    {String(hour).padStart(2, '0')}시
                  </option>
                ))}
              </select>
            </span>
          </div>
        </div>

        {/* 도착일 */}
        <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line arrival-date-field">
          <label>도착일</label>
          <div className="date-picker-wrapper" style={{ width: '45%', display: 'inline-block' }}>
            <DatePicker
              selected={arrivalDate ? parseDate(arrivalDate) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  const formattedDate = formatDate(date);
                  onArrivalDateChange(formattedDate);
                  setHasSelectedArrivalDate(true);
                } else {
                  onArrivalDateChange('');
                  setHasSelectedArrivalDate(false);
                }
              }}
              onSelect={(date: Date | null) => {
                if (date) {
                  const formattedDate = formatDate(date);
                  onArrivalDateChange(formattedDate);
                  setHasSelectedArrivalDate(true);
                }
              }}
              dateFormat="yyyy-MM-dd"
              formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
              locale="ko"
              placeholderText="날짜 선택"
              dateFormatCalendar="yyyy년 MM월"
              className={`tourGuard_input_w01 ${hasSelectedArrivalDate ? 'has-value' : ''}`}
              wrapperClassName="date-picker-wrapper"
              calendarClassName="custom-calendar"
              popperClassName="custom-popper"
              minDate={departureDate ? (parseDate(departureDate) || new Date()) : new Date()}
              showPopperArrow={false}
              popperPlacement="bottom-start"
              shouldCloseOnSelect={true}
              renderCustomHeader={(p) => <CalendarHeaderNoFocus {...p} />}
              strictParsing
            />
          </div>
          <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell02 tourGuard" style={{ marginRight: 0 }}>
            <span className="tourGuard_ps_box">
              <select
                className="tourGuard_sel07"
                id="group_end_hour"
                name="group_end_hour"
                value={arrivalTime}
                onChange={(e) => onArrivalTimeChange(e.target.value)}
              >
                {timeOptions.map((hour) => (
                  <option key={hour} value={String(hour).padStart(2, '0')}>
                    {String(hour).padStart(2, '0')}시
                  </option>
                ))}
              </select>
            </span>
          </div>
        </div>

        {/* 가입자 수 */}
        <div className="tourGuard_form_tt mag5 tourG_mab03">
          <label>가입자</label>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', marginLeft: '10px' }}>
            <input
              type="tel"
              name="group_participant_count"
              id="group_participant_count"
              maxLength={2}
              placeholder="피보험자수"
              value={participantCount}
              className="tourGuard_input_w05"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInputButtonClick && onInputButtonClick();
              }}
              onFocus={(e) => {
                e.preventDefault();
                e.target.blur();
                onInputButtonClick && onInputButtonClick();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInputButtonClick && onInputButtonClick();
              }}
              onKeyDown={(e) => {
                e.preventDefault();
                onInputButtonClick && onInputButtonClick();
              }}
              readOnly={true}
              style={{
                height: '32px',
                paddingLeft: '10px',
                color: '#000',
                fontSize: '18px',
                letterSpacing: '0px',
                paddingTop: '0px',
                marginTop: '0',
                marginLeft: '0',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
              }}
            />
            <span className="member_txt" style={{ color: '#000', marginLeft: '55px', lineHeight: '1', display: 'flex', alignItems: 'center' }}>명</span>
          </div>
          <div className="tour2023_event_file" style={{ display: 'flex', alignItems: 'center' }}>
            <a
              href="#"
              id="group_insuredBtn"
              className="tour2023_btn_b01 tour2023_btn11"
              onClick={(e) => {
                e.preventDefault();
                onInputButtonClick && onInputButtonClick();
              }}
            >
              {hasGroupParticipants ? '자세히보기' : '입력'}
            </a>
          </div>
        </div>

        {/* 여행국가 - 해외여행일 때만 표시 */}
        {travelCountries.length > 0 && (
          <div className="tourGuard_form_tt mag5 tourG_mab03">
            <label>여행국가</label>
            <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
              <span className="tourGuard_ps_box">
                <select
                  className="tourGuard_sel"
                  id="group_tour_place"
                  name="group_tour_place"
                  value={travelCountry}
                  onChange={(e) => onTravelCountryChange(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {frequentCountries.length > 0 ? (
                    <>
                      <optgroup label="자주가는 국가">
                        {frequentCountries.map((country) => (
                          <option key={`frequent-${country.code}`} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="전체 국가">
                        {travelCountries.map((country) => (
                          <option key={country.code} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    travelCountries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))
                  )}
                </select>
              </span>
            </div>
          </div>
        )}

        {/* 여행목적 - 장기여행일 때만 표시 */}
        {type === 'long' && (
          <div className="tourGuard_form_tt mag5 tourG_mab03">
            <label>여행목적</label>
            <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
              <span className="tourGuard_ps_box">
                <select
                  className="tourGuard_sel"
                  id="group_tour_long_goal"
                  name="group_tour_long_goal"
                  value={travelPurpose}
                  onChange={(e) => onTravelPurposeChange && onTravelPurposeChange(e.target.value)}
                >
                  {(travelPurposeOptions ?? [
                    { value: 'N010001', label: '유학/어학연수' },
                    { value: 'N010003_1', label: '해외출장/주재원' },
                    { value: 'N010003_2', label: '교환교수' },
                    { value: 'N010002', label: '워킹홀리데이' },
                  ]).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </div>
        )}

        {/* 안내문 - 해외여행일 때만 표시 */}
        {travelCountries.length > 0 && (
          <div className="tour2023_txt01 tour2023_grey tourG_mleft04" style={{ marginTop: '30px', marginBottom: '30px' }}>
            <ul className="tourGuard_inline">
              <li className="tourGuard_inline_t01">※</li>
              <li className="tourGuard_inline_t02">
                여러국가를 여행하는 경우 <span className="tour2023_blue">최초 방문국가를</span> 선택하세요.<br />
                단, <span className="tour2023_blue">체코</span>가 포함된 여행인 경우 여행국가는 꼭 체코로 선택하시기 바랍니다.
              </li>
            </ul>
          </div>
        )}
        
      </div>
    </form>
  );
}

