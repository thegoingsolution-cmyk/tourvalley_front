'use client';

import React, { useEffect, useState, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import '../../popup/page.css';

// 한국어 locale 등록
registerLocale('ko', ko);

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

export default function DomesticInsurancePopupPage() {
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('01');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('01');
  const [tourGoal, setTourGoal] = useState('');
  const [tourNum, setTourNum] = useState('1');
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [hasSelectedEndDate, setHasSelectedEndDate] = useState(false);
  /** 달력에서 날짜를 한 번이라도 선택했으면 true (초기값과 같아도) → CSS 적용용 */
  const [userHasInteractedWithStartDate, setUserHasInteractedWithStartDate] = useState(false);
  const [userHasInteractedWithEndDate, setUserHasInteractedWithEndDate] = useState(false);
  const initialStartDateRef = useRef('');
  const initialEndDateRef = useRef('');

  useEffect(() => {
    const now = new Date();
    
    // 현재 시간 + 2시간 계산
    const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2시간 추가
    
    // 로컬 시간 기준으로 날짜 포맷 (YYYY-MM-DD)
    const year = futureTime.getFullYear();
    const month = String(futureTime.getMonth() + 1).padStart(2, '0');
    const day = String(futureTime.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // 시간 계산 (1~24 형식)
    let calculatedHour = futureTime.getHours();
    if (calculatedHour === 0) {
      calculatedHour = 24;
    }
    
    const defaultHour = String(calculatedHour).padStart(2, '0');

    setStartDate(formattedDate);
    setEndDate(formattedDate);
    setStartHour(defaultHour);
    setEndHour(defaultHour);
    initialStartDateRef.current = formattedDate;
    initialEndDateRef.current = formattedDate;
    setHasSelectedStartDate(false);
    setHasSelectedEndDate(false);
  }, []);

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      alert('출발일과 도착일을 입력해주세요.');
      return;
    }
    if (!tourGoal) {
      alert('여행목적을 선택해주세요.');
      return;
    }
    if (tourGoal === '013' || tourGoal === '006') {
      alert(
        '일정 중 전문등반, 글라이더조정, 스카이다이빙, 스쿠버다이빙, 행글라이딩, 래프팅, 제트스키, 번지점프, 스키/스노보드, 수상스키 활동이 포함될 경우 보험가입이 불가능합니다.'
      );
      return;
    }

    // 입력한 정보를 localStorage에 저장
    const formData = {
      startDate,
      startHour,
      endDate,
      endHour,
      tourGoal,
      tourNum
    };
    localStorage.setItem('domesticInsuranceStep1', JSON.stringify(formData));
    
    // 2단계 페이지로 이동
    window.location.href = '/group-insurance/domestic/step2';
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
            <span className="menu on"><a href="javascript:void(0);">국내여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/longstay/popup">해외장기체류보험</a></span>
          </div>

          <ul>
            <li className="tour2023_pc_SpeedTop_title03">
              보험기간은 최대 1개월이고 <span className="tour2023_pc_SpeedTop_title04">여행, 체험학습, 연수, 출장 등</span>으로 대한민국 국내에서 여행을 떠나실 때 가입하는 보험입니다.
            </li>
            <li className="tour2023_pc_SpeedTop_title03">(운동경기 참여 및 기타 위험한 활동인 경우 가입불가)</li>
          </ul>
        </div>

        <div className="con02">
          <div className="tour2023_pc_SpeedTop_line01">
            <span className="tour2023_pc_SpeedTop_title05">국내여행자보험 기본정보 입력</span>
          </div>
          <div className="detailView01 bgcolor_white ps_ab">
            <form name="inputForm" method="post">
              <table className="specialB" border={1} cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                <caption>최근 여행보험 가입내역</caption>
                <colgroup>
                  <col width="20%" />
                  <col width="*" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="sName_m ag_left main_font bgcolor_white line_none01">출발일시</td>
                    <td className="dd ag_left box02 line_none01">
                      <div className="in_wrap01">
                        <div className="bg_join input_cell_01 wd_55" style={{ position: 'relative', overflow: 'visible' }}>
                          <DatePicker
                            selected={startDate ? parseDate(startDate) : null}
                            onChange={(date: Date | null) => {
                              if (date) {
                                const formattedDate = formatDate(date);
                                setStartDate(formattedDate);
                                setHasSelectedStartDate(formattedDate !== initialStartDateRef.current);
                                setUserHasInteractedWithStartDate(true);
                              } else {
                                setStartDate('');
                                setHasSelectedStartDate(false);
                              }
                            }}
                            onSelect={(date: Date | null) => {
                              if (date) {
                                const formattedDate = formatDate(date);
                                setStartDate(formattedDate);
                                setHasSelectedStartDate(formattedDate !== initialStartDateRef.current);
                                setUserHasInteractedWithStartDate(true);
                              }
                            }}
                            dateFormat="yyyy-MM-dd"
                            formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                            locale="ko"
                            placeholderText="출발일"
                            dateFormatCalendar="yyyy년 MM월"
                            className={`tf_g dicon ${(hasSelectedStartDate || userHasInteractedWithStartDate) ? 'has-value user-selected' : ''}`}
                            wrapperClassName="date-picker-wrapper"
                            calendarClassName="custom-calendar"
                            popperClassName="custom-popper"
                            minDate={new Date()}
                            showPopperArrow={false}
                            popperPlacement="bottom-start"
                            popperProps={{
                              strategy: 'fixed',
                            }}
                            shouldCloseOnSelect={true}
                            strictParsing
                          />
                        </div>
                        <div className="bg_join input_cell_01 wd_40 ml10">
                          <span className="ps_box02 wd_100">
                            <select
                              className="sel01"
                              value={startHour}
                              onChange={(e) => setStartHour(e.target.value)}
                            >
                              {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}시</option>
                              ))}
                            </select>
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="sName_m ag_left main_font bgcolor_white line_none">도착일시</td>
                    <td className="dd ag_left box02 line_none">
                      <div className="in_wrap01">
                        <div className="bg_join input_cell_01 wd_55" style={{ position: 'relative', overflow: 'visible' }}>
                          <DatePicker
                            selected={endDate ? parseDate(endDate) : null}
                            onChange={(date: Date | null) => {
                              if (date) {
                                const formattedDate = formatDate(date);
                                setEndDate(formattedDate);
                                setHasSelectedEndDate(formattedDate !== initialEndDateRef.current);
                                setUserHasInteractedWithEndDate(true);
                              } else {
                                setEndDate('');
                                setHasSelectedEndDate(false);
                              }
                            }}
                            onSelect={(date: Date | null) => {
                              if (date) {
                                const formattedDate = formatDate(date);
                                setEndDate(formattedDate);
                                setHasSelectedEndDate(formattedDate !== initialEndDateRef.current);
                                setUserHasInteractedWithEndDate(true);
                              }
                            }}
                            dateFormat="yyyy-MM-dd"
                            formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                            locale="ko"
                            placeholderText="도착일"
                            dateFormatCalendar="yyyy년 MM월"
                            className={`tf_g dicon ${(hasSelectedEndDate || userHasInteractedWithEndDate) ? 'has-value user-selected' : ''}`}
                            wrapperClassName="date-picker-wrapper"
                            calendarClassName="custom-calendar"
                            popperClassName="custom-popper"
                            minDate={startDate ? (parseDate(startDate) || new Date()) : new Date()}
                            showPopperArrow={false}
                            popperPlacement="bottom-start"
                            popperProps={{
                              strategy: 'fixed',
                            }}
                            shouldCloseOnSelect={true}
                            strictParsing
                          />
                        </div>
                        <div className="bg_join input_cell_01 wd_40 ml10">
                          <span className="ps_box02 wd_100">
                            <select
                              className="sel01"
                              value={endHour}
                              onChange={(e) => setEndHour(e.target.value)}
                            >
                              {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                                <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}시</option>
                              ))}
                            </select>
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="sName_m ag_left main_font bgcolor_white line_none">여&nbsp;&nbsp;행&nbsp;&nbsp;지</td>
                    <td className="dd ag_left box02 line_none">전국일원</td>
                  </tr>
                  <tr>
                    <td className="sName_m ag_left main_font bgcolor_white line_none">여행목적</td>
                    <td className="dd ag_left box02 line_none">
                      <div className="in_wrap01">
                        <div className="bg_join input_cell_01 wd_50">
                          <span className="ps_box02 wd_100">
                            <select
                              className="sel01"
                              value={tourGoal}
                              onChange={(e) => setTourGoal(e.target.value)}
                            >
                              <option value="">선택해 주세요</option>
                              <option value="001">일반관광</option>
                              <option value="013">래프팅</option>
                              <option value="006">스키/스노보드</option>
                              <option value="002">출장/연수/교육(체험학습)</option>
                            </select>
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="sName_m ag_left main_font bgcolor_white line_none">인&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;원</td>
                    <td className="dd ag_left box02 line_none">
                      <div className="in_wrap01">
                        <div className="bg_join input_cell_01 wd_50">
                          <span className="ps_box02 wd_100">
                            <select
                              className="sel01"
                              value={tourNum}
                              onChange={(e) => setTourNum(e.target.value)}
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
            </form>
          </div>
        </div>

        <div className="con03">
          <div>
            <span className="con3Tit">GUIDE</span>
            <ul>
              <li>- 국내여행보험은 지역에 관계없이 대한민국내에서 여행하는 경우 가입하실 수 있습니다.</li>
              <li>- 스키(스노보드), 래프팅, 스쿠버다이빙, 행글라이딩, 패러글라이딩, 스카이다이빙, 수상스키, 자동차, 오토바이 경주, 번지점프, 빙벽, 암벽등반, 제트스키를 목적으로 하는 여행은 국내 여행보험에 가입하실 수 없습니다.</li>
              <li>- 국내여행보험의 최대 보험기간은 1개월입니다.</li>
              <li>
                <br />
                <span style={{ color: 'red', fontWeight: 'bold' }}>※ 휴대품손해 약관변경 안내</span> (2020년5월)<br />
                - 휴대품손해에서 <span style={{ color: 'red' }}>이동통신단말기(핸드폰 등, 공단말기 포함)은 보상하지 않습니다.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="con_btnWrap mb40">
          <a href="#" onClick={(e) => { e.preventDefault(); handleSubmit(); }}>설계하기</a>
        </div>

        <section className="tour2023_pc_insuBox">
          <div className="tour2023_pc_insuBox01">
            <span className="tour2023_pc_txt01">투어밸리 회원님은 회원 로그인후 이용하세요. (마일리지 적립)</span>
          </div>
          <a href="/login" className="tour2023PC_btn_b tour2023_pc_btnLogin">회원 LOGIN</a>
        </section>

        <section className="tour2023_pc_joinBox">
          <div className="tour2023_pc_joinBox01">
            <span className="tour2023_pc_joinTxt">
              아직 투어밸리 회원이 아니신가요? 투어밸리 법인단체 회원에 가입하세요.<br />
              보다 편리하게 여행자보험을 관리할 수 있습니다.
            </span>
          </div>
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              if (window.opener) {
                window.opener.location.href = '/signup';
                window.close();
              } else {
                window.location.href = '/signup';
              }
            }}
          >
            <span className="tour2023_pc_joinTxt01">회원가입&nbsp;&gt;</span>
          </a>
        </section>

        <div className="Box_line01 mtb20">
          <p className="txt">
            <span className="font_blue">※ 알아두세요.</span>
          </p>
          <div className="login_Btxt">
            <dl>
              <dd className="font_gray">라이나손해보험의 국내여행보험 상품입니다.</dd>
              <dd className="font_gray">국내여행보험의 주계약은 상해사망 및 후유장해이며 그 외에는 기타특약입니다. 기타특약은 해당특약 가입시에만 보상받으실 수 있습니다.</dd>
              <dd className="font_gray">배상책임, 휴대품손해는 자기부담금 각 1만원입니다.</dd>
              <dd className="font_gray">
                휴대품손해에서 <span className="font_red">휴대품 1개(1조 또는 1쌍)의 보상한도는 20만원</span>입니다. <span className="font_red">이동통신단말기(핸드폰, 공단말기 포함)은 보상하지 않습니다.</span>
              </dd>
              <dd className="font_gray">
                <span className="font_red">(비례보상)실손의료비, 특별비용, 배상책임, 휴대품손해를 보상하는 상품</span>은 2개 이상의 보험에 가입하더라도 중복 보상되지 않고 <span className="font_red">비례보상됩니다.</span>
              </dd>
              <dd className="font_gray">상법 제732조에 따라 15세 미만의 경우 사망에 대해서는 보장하지않습니다.(후유장해)</dd>
              <dd className="font_gray">가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</dd>
            </dl>
          </div>
        </div>

        <div className="Box_line01 mtb20" style={{ marginBottom: '30px' }}>
          <p className="txt">※ 실손의료비 본인부담금 안내</p>
          <div className="login_Btxt pb10">
            <dl>
              <dd className="font_gray">실손의료보험은 급여(건강보험의 본인부담금)과 비급여를 보상하는 상품으로 보상대상 의료비에 대해 일정금액의 자기부담금이 있습니다.(4세대 실손의료보험 개정 2021년 8월 1일 적용)</dd>
              <dd className="font_gray">가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</dd>
            </dl>
          </div>
          <table className="Pslist" border={1} cellSpacing="0">
            <caption></caption>
            <colgroup>
              <col width="30%" />
              <col width="70%" />
            </colgroup>
            <tbody>
              <tr>
                <td className="ag_left sName">상해/질병<br />급여 국내입원</td>
                <td className="sName">본인부담금(본인이 실제로 부담한 금액)의 20%</td>
              </tr>
              <tr>
                <td className="ag_left">상해/질병<br />급여 국내통원</td>
                <td className="">
                  보건소, 병원, 의원급에서의 외래 및 그에 따른 약국에서의 처방조제<br />
                  - 1만원과 보장대상의료비의 20％중 큰 금액<br />
                  전문요양기관, 상급종합병원, 종합병원에서의 외래 및 그에 따른 약국에서의 처방조제<br />
                  - 2만원과 보장대상의료비의 20％중 큰 금액
                </td>
              </tr>
              <tr>
                <td className="ag_left">상해/질병<br />비급여 국내입원</td>
                <td className="">
                  1. 본인부담금(본인이 실제로 부담한 금액)의 30%<br />
                  2. 상급병실료차액<br />
                  : 비급여 병실료의 50％ (1일 평균금액 10만원 한도)
                </td>
              </tr>
              <tr>
                <td className="ag_left">상해/질병<br />비급여 국내통원</td>
                <td className="">
                  통원 1회당(외래 처방조제 합산) :3만원과 보장대상의료비의 30％중 큰 금액<br />
                  (단, 3대 비급여 및 상급병실료차액 제외) ※ 연간 통원 100회까지 보상
                </td>
              </tr>
            </tbody>
          </table>
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

