'use client';

import React, { useEffect, useState } from 'react';
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

export default function LongStayInsurancePopupPage() {
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('01');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('01');
  const [tourContinent, setTourContinent] = useState('');
  const [tourPlace, setTourPlace] = useState('');
  const [tourGoal, setTourGoal] = useState('003');
  const [tourNum, setTourNum] = useState('1');
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [hasSelectedEndDate, setHasSelectedEndDate] = useState(false);

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
    setHasSelectedStartDate(true);
    setHasSelectedEndDate(true);
  }, []);

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      alert('출발일과 도착일을 입력해주세요.');
      return;
    }
    if (!tourPlace) {
      alert('여행지를 선택해주세요.');
      return;
    }
    if (!tourGoal) {
      alert('여행목적을 선택해주세요.');
      return;
    }
    
    // 입력한 정보를 localStorage에 저장
    const formData = {
      startDate,
      startHour,
      endDate,
      endHour,
      tourContinent,
      tourPlace,
      tourGoal,
      tourNum
    };
    localStorage.setItem('longstayInsuranceStep1', JSON.stringify(formData));
    
    // 2단계 페이지로 이동
    window.location.href = '/group-insurance/longstay/step2';
  };

  const continentPlaces: { [key: string]: { value: string; label: string }[] } = {
    EU: [
      { value: 'DE', label: '독일' },
      { value: 'FR', label: '프랑스' },
      { value: 'GB', label: '영국' },
      { value: 'IT', label: '이탈리아' },
      { value: 'ES', label: '스페인' },
      { value: 'NL', label: '네덜란드' },
      { value: 'BE', label: '벨기에' },
      { value: 'CH', label: '스위스' },
      { value: 'AT', label: '오스트리아' },
      { value: 'GR', label: '그리스' },
      { value: 'PT', label: '포르투갈' },
      { value: 'CZ', label: '체코' },
      { value: 'PL', label: '폴란드' },
      { value: 'HU', label: '헝가리' },
      { value: 'SE', label: '스웨덴' },
      { value: 'NO', label: '노르웨이' },
      { value: 'DK', label: '덴마크' },
      { value: 'FI', label: '핀란드' },
      { value: 'RU', label: '러시아' },
    ],
    AS: [
      { value: 'JP', label: '일본' },
      { value: 'CN', label: '중국' },
      { value: 'TW', label: '대만' },
      { value: 'HK', label: '홍콩' },
      { value: 'SG', label: '싱가포르' },
      { value: 'TH', label: '태국' },
      { value: 'VN', label: '베트남' },
      { value: 'PH', label: '필리핀' },
      { value: 'ID', label: '인도네시아' },
      { value: 'MY', label: '말레이시아' },
      { value: 'IN', label: '인도' },
      { value: 'MN', label: '몽골' },
      { value: 'KZ', label: '카자흐스탄' },
      { value: 'UZ', label: '우즈베키스탄' },
    ],
    AF: [
      { value: 'ZA', label: '남아프리카공화국' },
      { value: 'EG', label: '이집트' },
      { value: 'MA', label: '모로코' },
      { value: 'KE', label: '케냐' },
      { value: 'TZ', label: '탄자니아' },
    ],
    AU: [
      { value: 'AU', label: '호주' },
      { value: 'NZ', label: '뉴질랜드' },
      { value: 'FJ', label: '피지' },
      { value: 'PG', label: '파푸아뉴기니' },
    ],
    NA: [
      { value: 'US', label: '미국' },
      { value: 'CA', label: '캐나다' },
      { value: 'MX', label: '멕시코' },
      { value: 'CU', label: '쿠바' },
    ],
    SA: [
      { value: 'BR', label: '브라질' },
      { value: 'AR', label: '아르헨티나' },
      { value: 'CL', label: '칠레' },
      { value: 'PE', label: '페루' },
      { value: 'CO', label: '콜롬비아' },
    ],
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
            <span className="menu"><a href="/group-insurance/domestic/popup">국내여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/overseas/popup">해외여행자보험</a></span>
            <span className="menu on"><a href="javascript:void(0);">해외장기체류보험</a></span>
          </div>

          <ul>
            <li className="tour2023_pc_SpeedTop_title03">- 기간 : 4개월-1년 (갱신가능)</li>
            <li className="tour2023_pc_SpeedTop_title03">- 목적 : 어학연수, 해외장기출장, 주재원, 교환교수 등</li>
          </ul>
        </div>

        <div className="con02">
          <div className="tour2023_pc_SpeedTop_line01">
            <span className="tour2023_pc_SpeedTop_title05">해외장기체류보험 기본정보 입력</span>
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
                                setHasSelectedStartDate(true);
                              } else {
                                setStartDate('');
                                setHasSelectedStartDate(false);
                              }
                            }}
                            onSelect={(date: Date | null) => {
                              if (date) {
                                const formattedDate = formatDate(date);
                                setStartDate(formattedDate);
                                setHasSelectedStartDate(true);
                              }
                            }}
                            dateFormat="yyyy-MM-dd"
                            formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                            locale="ko"
                            placeholderText="출발일"
                            dateFormatCalendar="yyyy년 MM월"
                            className={`tf_g dicon ${hasSelectedStartDate ? 'has-value' : ''}`}
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
                                setHasSelectedEndDate(true);
                              } else {
                                setEndDate('');
                                setHasSelectedEndDate(false);
                              }
                            }}
                            onSelect={(date: Date | null) => {
                              if (date) {
                                const formattedDate = formatDate(date);
                                setEndDate(formattedDate);
                                setHasSelectedEndDate(true);
                              }
                            }}
                            dateFormat="yyyy-MM-dd"
                            formatWeekDay={(nameOfDay: string) => nameOfDay.substring(0, 1)}
                            locale="ko"
                            placeholderText="도착일"
                            dateFormatCalendar="yyyy년 MM월"
                            className={`tf_g dicon ${hasSelectedEndDate ? 'has-value' : ''}`}
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
                    <td className="dd ag_left box02 line_none">
                      <div className="in_wrap01">
                        <div className="bg_join input_cell_01 wd_48">
                          <span className="ps_box02 wd_100">
                            <select
                              className="sel01"
                              value={tourContinent}
                              onChange={(e) => {
                                setTourContinent(e.target.value);
                                setTourPlace('');
                              }}
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
                              value={tourPlace}
                              onChange={(e) => setTourPlace(e.target.value)}
                              disabled={!tourContinent}
                            >
                              <option value="">선택</option>
                              {tourContinent && continentPlaces[tourContinent]?.map(place => (
                                <option key={place.value} value={place.value}>{place.label}</option>
                              ))}
                            </select>
                          </span>
                        </div>
                      </div>
                    </td>
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
                              <option value="003">유학/어학연수</option>
                              <option value="002">해외출장/주재원/교환교수</option>
                              <option value="001">워킹홀리데이</option>
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
              <li>- 해외장기체류보험의 보험기간은 3개월 초과-1년까지입니다.(갱신가능). 여행목적과 관계없이 보험기간이 3개월이 넘지 않는 경우 해외여행보험으로 가입하실 수 있습니다.</li>
              <li>- 이미 출국하셨거나 해외에 거주하는 경우 보험에 가입하실 수 없습니다. (단, 만기가 도래하여 갱신하는 경우에는 가입이 가능 합니다.)</li>
              <li>- 미국의 대학교는 특정 담보 및 보장금액에서 일정금액 이상을 요구하는 경우가 많습니다. 학교보험  waiver 조건을 확인한 후 가입절차를 진행하여 주시기 바랍니다.</li>
              <li>- J1, J2 비자인 경우 달러플랜 고급플랜으로 가입하시기 바랍니다</li>
            </ul>
          </div>
        </div>

        <div className="con_btnWrap mb40">
          <a href="#" onClick={(e) => { e.preventDefault(); handleSubmit(); }}>설계하기</a>
        </div>

        {/* <section className="tour2023_pc_insuBox">
          <div className="tour2023_pc_insuBox01">
            <span className="tour2023_pc_txt01">투어밸리 회원님은 회원 로그인후 이용하세요. (마일리지 적립)</span>
          </div>
          <a href="#" className="tour2023PC_btn_b tour2023_pc_btnLogin">회원 LOGIN</a>
        </section>

        <section className="tour2023_pc_joinBox">
          <div className="tour2023_pc_joinBox01">
            <span className="tour2023_pc_joinTxt">
              아직 투어밸리 회원이 아니신가요? 투어밸리 법인단체 회원에 가입하세요.<br />
              보다 편리하게 여행자보험을 관리할 수 있습니다.
            </span>
          </div>
          <a href="#"><span className="tour2023_pc_joinTxt01">회원가입&nbsp;&gt;</span></a>
        </section> */}

        <div className="Box_line01 mtb20">
          <p className="txt">
            <span className="font_blue">※ 알아두세요.</span>
          </p>
          <div className="login_Btxt">
            <dl>
              <dd className="font_gray">메리츠화재보험의 전문인 해외장기체류보험 상품입니다.</dd>
              <dd className="font_gray">전문인 해외장기체류보험의 주계약은 상해사망 및 후유장해이며 그 외에는 기타특약입니다. 기타특약은 해당특약 가입시에만 보상받으실 수 있습니다.</dd>
              <dd className="font_gray">
                <span className="font_red">(비례보상)실손의료비, 특별비용, 배상책임을 보상하는 상품</span>은 2개 이상의 보험에 가입하더라도 중복 보상되지 않고 <span className="font_red">비례보상됩니다.</span>
              </dd>
              <dd className="font_gray">상법 제732조에 따라 15세 미만의 경우 사망에 대해서는 보장하지않습니다.(후유장해)</dd>
              <dd className="font_gray">가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</dd>
            </dl>
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

