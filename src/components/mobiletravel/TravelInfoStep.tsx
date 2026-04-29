'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import type { ReactDatePickerCustomHeaderProps } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { parseInsuranceDateHourToInstant } from '@/utils/dateTime';

registerLocale('ko', ko);

const MS_PER_HOUR = 60 * 60 * 1000;

function isDepartureAtLeastHoursFromNow(dateStr: string, timeStr: string, hours: number): boolean {
  const dep = parseInsuranceDateHourToInstant(dateStr, timeStr);
  if (Number.isNaN(dep.getTime())) return false;
  const now = new Date();
  const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
  return dep.getTime() >= currentHourStart + hours * MS_PER_HOUR;
}

/**
 * 커스텀 헤더: 이전/다음 달 버튼이 포커스를 받지 않도록 처리.
 * 실제 폰에서 2번째 클릭 시 버튼에 포커스가 가면 레이어 순서가 바뀌어 달력이 뒤로 가는 현상 방지.
 */
function CalendarHeaderNoFocus(props: ReactDatePickerCustomHeaderProps) {
  const { monthDate, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled } = props;
  const monthLabel = format(monthDate, 'yyyy년 MM월', { locale: ko });

  const stopFocus = (e: React.MouseEvent) => {
    e.preventDefault();
  };

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

interface TravelInfoStepProps {
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
  
  // Handlers
  onDepartureDateChange: (date: string) => void;
  onDepartureTimeChange: (time: string) => void;
  onArrivalDateChange: (date: string) => void;
  onArrivalTimeChange: (time: string) => void;
  onBirthDateChange: (date: string) => void;
  onGenderChange: (gender: 'M' | 'W') => void;
  onTravelCountryChange: (country: string) => void;
  onTravelPurposeChange?: (purpose: string) => void;
  
  // Options
  travelCountries?: Array<{ code: string; name: string }>;
  frequentCountries?: Array<{ code: string; name: string }>;
  travelPurposeOptions?: Array<{ value: string; label: string }>;
  timeOptions?: number[];
  /** 출발일시가 가입 시점(현재) 기준 최소 N시간 이후인지 검사. 0이면 검사 안 함. 기본 2. */
  minDepartureLeadFromNow?: number;
}

export default function MobileTravelInfoStep({
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  birthDate,
  gender,
  travelCountry,
  travelPurpose = 'N010001',
  type = 'short',
  onDepartureDateChange,
  onDepartureTimeChange,
  onArrivalDateChange,
  onArrivalTimeChange,
  onBirthDateChange,
  onGenderChange,
  onTravelCountryChange,
  onTravelPurposeChange,
  travelCountries = [],
  frequentCountries = [],
  travelPurposeOptions,
  timeOptions = Array.from({ length: 24 }, (_, i) => i + 1),
  minDepartureLeadFromNow = 2,
}: TravelInfoStepProps) {
  const [hasSelectedDepartureDate, setHasSelectedDepartureDate] = useState(false);
  const [hasSelectedArrivalDate, setHasSelectedArrivalDate] = useState(false);
  /** 달력에서 날짜를 한 번이라도 선택했으면 true (오늘 선택 포함) → CSS 적용용 */
  const [userHasInteractedWithDepartureDate, setUserHasInteractedWithDepartureDate] = useState(false);
  const [userHasInteractedWithArrivalDate, setUserHasInteractedWithArrivalDate] = useState(false);
  const initialDepartureDateRef = useRef(departureDate);
  const initialArrivalDateRef = useRef(arrivalDate);

  const handleDepartureDateInput = useCallback(
    (date: string): boolean => {
      if (date && minDepartureLeadFromNow > 0 && !isDepartureAtLeastHoursFromNow(date, departureTime, minDepartureLeadFromNow)) {
        alert('출발시간은 가입시점 2시간 뒤부터 설정 가능합니다');
        return false;
      }
      onDepartureDateChange(date);
      return true;
    },
    [departureTime, minDepartureLeadFromNow, onDepartureDateChange]
  );

  const handleDepartureTimeInput = useCallback(
    (time: string): boolean => {
      if (departureDate && minDepartureLeadFromNow > 0 && !isDepartureAtLeastHoursFromNow(departureDate, time, minDepartureLeadFromNow)) {
        alert('출발시간은 가입시점 2시간 뒤부터 설정 가능합니다');
        return false;
      }
      onDepartureTimeChange(time);
      return true;
    },
    [departureDate, minDepartureLeadFromNow, onDepartureTimeChange]
  );

  const handleBirthDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 8) {
      onBirthDateChange(value);
    }
  };

  return (
    <form name="inputForm" method="POST">
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
                  if (!handleDepartureDateInput(formattedDate)) return;
                  setHasSelectedDepartureDate(formattedDate !== initialDepartureDateRef.current);
                  setUserHasInteractedWithDepartureDate(true);
                } else {
                  if (!handleDepartureDateInput('')) return;
                  setHasSelectedDepartureDate(false);
                }
              }}
              onSelect={(date: Date | null) => {
                if (date) {
                  const formattedDate = formatDate(date);
                  if (!handleDepartureDateInput(formattedDate)) return;
                  setHasSelectedDepartureDate(formattedDate !== initialDepartureDateRef.current);
                  setUserHasInteractedWithDepartureDate(true);
                }
              }}
              dateFormat="yyyy-MM-dd"
              formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
              locale="ko"
              placeholderText="날짜 선택"
              dateFormatCalendar="yyyy년 MM월"
              className={`tourGuard_input_w01 ${(hasSelectedDepartureDate || userHasInteractedWithDepartureDate) ? 'has-value user-selected' : ''}`}
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
                id="start_hour"
                name="start_hour"
                value={departureTime}
                onChange={(e) => handleDepartureTimeInput(e.target.value)}
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
                  setHasSelectedArrivalDate(formattedDate !== initialArrivalDateRef.current);
                  setUserHasInteractedWithArrivalDate(true);
                } else {
                  onArrivalDateChange('');
                  setHasSelectedArrivalDate(false);
                }
              }}
              onSelect={(date: Date | null) => {
                if (date) {
                  const formattedDate = formatDate(date);
                  onArrivalDateChange(formattedDate);
                  setHasSelectedArrivalDate(formattedDate !== initialArrivalDateRef.current);
                  setUserHasInteractedWithArrivalDate(true);
                }
              }}
              dateFormat="yyyy-MM-dd"
              formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
              locale="ko"
              placeholderText="날짜 선택"
              dateFormatCalendar="yyyy년 MM월"
              className={`tourGuard_input_w01 ${(hasSelectedArrivalDate || userHasInteractedWithArrivalDate) ? 'has-value user-selected' : ''}`}
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
                id="end_hour"
                name="end_hour"
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

        {/* 생년월일 / 성별 */}
        <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
          <label>생년월일 8자리</label>
          <input
            type="tel"
            name="birth"
            maxLength={8}
            placeholder="예)19981022"
            value={birthDate}
            className="tourGuard_input_w01"
            onInput={handleBirthDateInput}
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
            <label htmlFor="inp-phone2">성별</label>
            <span className="tourG_inp_rdo">
              <input
                type="radio"
                id="rad_mw01"
                value="M"
                name="sex_cd"
                checked={gender === 'M'}
                onChange={() => onGenderChange('M')}
              />
              <label htmlFor="rad_mw01">남자</label>
            </span>
            <span className="tourG_inp_rdo">
              <input
                type="radio"
                id="rad_mw02"
                value="W"
                name="sex_cd"
                checked={gender === 'W'}
                onChange={() => onGenderChange('W')}
                className="one_line0"
              />
              <label htmlFor="rad_mw02">여자</label>
            </span>
          </div>
        </div>

        {/* 여행국가 - 해외여행보험 및 해외장기체류보험일 때만 표시 */}
        {travelCountries && travelCountries.length > 0 && (
          <div className="tourGuard_form_tt mag5 tourG_mab03">
            <label>여행국가</label>
            <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
              <span className="tourGuard_ps_box">
                <select
                  className="tourGuard_sel"
                  id="tour_place"
                  name="tour_place"
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
                  id="tour_long_goal"
                  name="tour_long_goal"
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

        {/* 안내문 - 해외여행보험 및 해외장기체류보험일 때만 표시 */}
        {travelCountries && travelCountries.length > 0 && (
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
