'use client';

import React, { useEffect, useState, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '@/contexts/AuthContext';
import { getCorporateMemberInfo } from '@/services/authService';
import {
  getOverseasShortTripMaxArrivalFromPickedDate,
  parseInsuranceDateHourToInstant,
} from '@/utils/dateTime';
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

export default function OverseasInsurancePopupPage() {
  const { isLoggedIn, member, isLoading } = useAuth();
  const [corporateName, setCorporateName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startHour, setStartHour] = useState('01');
  const [endDate, setEndDate] = useState('');
  const [endHour, setEndHour] = useState('01');
  const [tourContinent, setTourContinent] = useState('');
  const [tourPlace, setTourPlace] = useState('');
  const [tourGoal, setTourGoal] = useState('');
  const [tourNum, setTourNum] = useState('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);
  const [hasSelectedEndDate, setHasSelectedEndDate] = useState(false);
  /** 달력에서 날짜를 한 번이라도 선택했으면 true (초기값과 같아도) → CSS 적용용 */
  const [userHasInteractedWithStartDate, setUserHasInteractedWithStartDate] = useState(false);
  const [userHasInteractedWithEndDate, setUserHasInteractedWithEndDate] = useState(false);
  const initialStartDateRef = useRef('');
  const initialEndDateRef = useRef('');

  useEffect(() => {
    if (isLoggedIn && member?.member_type === '법인') {
      getCorporateMemberInfo(member.id)
        .then((result) => {
          if (result.success && result.corporate) setCorporateName(result.corporate.company_name);
        })
        .catch(() => setCorporateName(null));
    } else {
      setCorporateName(null);
    }
  }, [isLoggedIn, member]);

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
    if (!tourPlace) {
      alert('여행지를 선택해주세요.');
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

    // 출발/도착 일시 검증 (해외 단체여행보험: 출발 기준 최대 3개월 미만)
    const departure = parseInsuranceDateHourToInstant(startDate, String(startHour));
    const arrival = parseInsuranceDateHourToInstant(endDate, String(endHour));

    if (arrival <= departure) {
      alert('도착일시는 출발일시보다 이후여야 합니다.');
      return;
    }

    const maxArrival = getOverseasShortTripMaxArrivalFromPickedDate(startDate, String(startHour));
    if (arrival > maxArrival) {
      alert('해외여행보험은 최대 3개월까지 가능합니다.');
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
    localStorage.setItem('overseasInsuranceStep1', JSON.stringify(formData));
    
    // 2단계 페이지로 이동
    window.location.href = '/group-insurance/overseas/step2';
  };

  const continentPlaces: { [key: string]: { value: string; label: string }[] } = {
    SA: [
      { value: 'GY', label: '가이아나' },
      { value: 'GP', label: '과들루프' },
      { value: 'GF', label: '기아나' },
      { value: 'MQ', label: '마르티니크' },
      { value: 'MS', label: '몬트세랫' },
      { value: 'BS', label: '바하마' },
      { value: 'VE', label: '베네수엘라(가입불가)' },
      { value: 'BO', label: '볼리비아' },
      { value: 'BR', label: '브라질' },
      { value: 'SR', label: '수리남' },
      { value: 'AR', label: '아르헨티나' },
      { value: 'HT', label: '아이티(가입불가)' },
      { value: 'EC', label: '에콰도르' },
      { value: 'UY', label: '우루과이' },
      { value: 'CO', label: '콜롬비아' },
      { value: 'TC', label: '터크스 케이커스 제도' },
      { value: 'PY', label: '파라과이' },
      { value: 'PE', label: '페루' },
      { value: 'PR', label: '푸에리토리코' },
      { value: 'GS', label: 'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS' },
    ],
    NA: [
      { value: 'GT', label: '과테말라' },
      { value: 'GD', label: '그레나다' },
      { value: 'NI', label: '니카라과' },
      { value: 'DM', label: '도미니카' },
      { value: 'DO', label: '도미니카공화국' },
      { value: 'MX', label: '멕시코' },
      { value: 'US', label: '미국' },
      { value: 'VI', label: '버진 아일랜드(미국령)' },
      { value: 'UM', label: '미국령 작은 섬' },
      { value: 'MI', label: '미드웨이' },
      { value: 'BB', label: '바베이도스' },
      { value: 'VG', label: '버진 아일랜드(영국령)' },
      { value: 'BZ', label: '벨리즈' },
      { value: 'KN', label: '세인트 키츠 네비스' },
      { value: 'LC', label: '세인트루시아' },
      { value: 'VC', label: '세인트빈센트그레나딘' },
      { value: 'AG', label: '안티구아 바부다' },
      { value: 'AI', label: '앙갈라' },
      { value: 'SV', label: '엘살바도르' },
      { value: 'HN', label: '온두라스' },
      { value: 'JM', label: '자메이카' },
      { value: 'CL', label: '칠레' },
      { value: 'CA', label: '캐나다' },
      { value: 'CR', label: '코스타리카' },
      { value: 'CU', label: '쿠바(가입불가)' },
      { value: 'TT', label: '트리니다드 토바고' },
      { value: 'PA', label: '파나마' },
      { value: 'JT', label: 'JOHNSTON IS' },
      { value: 'WK', label: 'WAKE ISLAND' },
    ],
    AS: [
      { value: 'NP', label: '네팔' },
      { value: 'TW', label: '대만(타이완)' },
      { value: 'TL', label: '동티모르' },
      { value: 'LA', label: '라오스' },
      { value: 'LB', label: '레바논(가입불가)' },
      { value: 'MO', label: '마카오' },
      { value: 'MY', label: '말레이시아' },
      { value: 'MV', label: '몰디브' },
      { value: 'MN', label: '몽골' },
      { value: 'MM', label: '미얀마(가입불가)' },
      { value: 'BH', label: '바레인(가입불가)' },
      { value: 'BD', label: '방글라데시' },
      { value: 'VN', label: '베트남' },
      { value: 'BT', label: '부탄' },
      { value: 'KP', label: '북한(가입불가)' },
      { value: 'BN', label: '브루나이' },
      { value: 'SA', label: '사우디아라비아(가입불가)' },
      { value: 'CY', label: '사이프러스' },
      { value: 'LK', label: '스리랑카' },
      { value: 'SY', label: '시리아(가입불가)' },
      { value: 'SG', label: '싱가포르' },
      { value: 'AE', label: '아랍에미리트공화국(가입불가)' },
      { value: 'AM', label: '아르메니아' },
      { value: 'AZ', label: '아제르바이젠' },
      { value: 'AF', label: '아프가니스탄(가입불가)' },
      { value: 'YE', label: '예멘(가입불가)' },
      { value: 'OM', label: '오만' },
      { value: 'JO', label: '요르단(가입불가)' },
      { value: 'UZ', label: '우즈베키스탄' },
      { value: 'IQ', label: '이라크(가입불가)' },
      { value: 'IR', label: '이란(가입불가)' },
      { value: 'IL', label: '이스라엘(가입불가)' },
      { value: 'IN', label: '인도' },
      { value: 'ID', label: '인도네시아' },
      { value: 'JP', label: '일본' },
      { value: 'GE', label: '조지아' },
      { value: 'CN', label: '중국' },
      { value: 'KZ', label: '카자흐스탄' },
      { value: 'QA', label: '카타르(가입불가)' },
      { value: 'KH', label: '캄보디아' },
      { value: 'KW', label: '쿠웨이트(가입불가)' },
      { value: 'KG', label: '키르키즈스탄' },
      { value: 'TJ', label: '타지키스탄' },
      { value: 'TH', label: '태국(타이)' },
      { value: 'TM', label: '투르크메니스탄' },
      { value: 'TR', label: '튀르키예(터키)' },
      { value: 'TI', label: '티모르' },
      { value: 'PK', label: '파키스탄(가입불가)' },
      { value: 'PS', label: '팔레스타인 자치구(가입불가)' },
      { value: 'PH', label: '필리핀' },
      { value: 'HK', label: '홍콩' },
    ],
    AF: [
      { value: 'GH', label: '가나' },
      { value: 'GA', label: '가봉' },
      { value: 'GM', label: '감비아' },
      { value: 'GN', label: '기니(가입불가)' },
      { value: 'GW', label: '기니비소' },
      { value: 'CV', label: '까뽀베르데' },
      { value: 'NA', label: '나미비아' },
      { value: 'NG', label: '나이지리아(가입불가)' },
      { value: 'ZA', label: '남아프리카공화국' },
      { value: 'NE', label: '니제르(가입불가)' },
      { value: 'LS', label: '레소토' },
      { value: 'RW', label: '르완다' },
      { value: 'LR', label: '라이베리아' },
      { value: 'LY', label: '리비아(가입불가)' },
      { value: 'MG', label: '마다가스카르' },
      { value: 'MW', label: '말라위' },
      { value: 'ML', label: '말리(가입불가)' },
      { value: 'MA', label: '모로코' },
      { value: 'MU', label: '모리셔스' },
      { value: 'MR', label: '모리타니아' },
      { value: 'MZ', label: '모잠비크' },
      { value: 'BJ', label: '베넹' },
      { value: 'BW', label: '보츠와나' },
      { value: 'BI', label: '부룬디' },
      { value: 'BF', label: '부르키나파소(가입불가)' },
      { value: 'ST', label: '생 토메 프린시페' },
      { value: 'EH', label: '서사하라' },
      { value: 'SN', label: '세네갈' },
      { value: 'SC', label: '세이쉘' },
      { value: 'SO', label: '소말리아(가입불가)' },
      { value: 'SD', label: '수단(가입불가)' },
      { value: 'SZ', label: '스와질랜드' },
      { value: 'SL', label: '시에라리온' },
      { value: 'AC', label: '아센션 섬' },
      { value: 'DZ', label: '알제리' },
      { value: 'AO', label: '앙골라' },
      { value: 'ER', label: '에리트리아' },
      { value: 'UG', label: '우간다' },
      { value: 'ET', label: '에티오피아' },
      { value: 'EG', label: '이집트' },
      { value: 'ZR', label: '자이레(가입불가)' },
      { value: 'ZM', label: '잠비아' },
      { value: 'GQ', label: '적도기니' },
      { value: 'CF', label: '중앙아프리카(가입불가)' },
      { value: 'DJ', label: '지부티' },
      { value: 'ZW', label: '짐바브웨' },
      { value: 'TD', label: '챠드(가입불가)' },
      { value: 'CM', label: '카메룬' },
      { value: 'KE', label: '케냐' },
      { value: 'KY', label: '케이멘군도' },
      { value: 'KM', label: '코모로' },
      { value: 'CI', label: '코트디브와르(가입불가)' },
      { value: 'CG', label: '콩고(가입불가)' },
      { value: 'CD', label: '콩고(자이레)(가입불가)' },
      { value: 'TZ', label: '탄자니아' },
      { value: 'TG', label: '토고' },
      { value: 'TN', label: '튀니지' },
      { value: 'TF', label: '프랑스령 남부지역' },
    ],
    AU: [
      { value: 'GU', label: '괌' },
      { value: 'NR', label: '나우루' },
      { value: 'NF', label: '노퍽아일랜드' },
      { value: 'NZ', label: '뉴질랜드' },
      { value: 'NC', label: '뉴칼레도니아' },
      { value: 'NU', label: '니웨(니우에)' },
      { value: 'MH', label: '마샬군도' },
      { value: 'FM', label: '미크로네시아' },
      { value: 'VU', label: '바누아투' },
      { value: 'MP', label: '북마리아나제도(사이판섬,티니안섬,로타섬 등)' },
      { value: 'WS', label: '서사모아' },
      { value: 'SB', label: '솔로몬군도' },
      { value: 'AW', label: '아루바' },
      { value: 'CC', label: '코코스섬' },
      { value: 'CK', label: '쿡아일랜드' },
      { value: 'CX', label: '크리스마스섬' },
      { value: 'KI', label: '키리바시' },
      { value: 'TK', label: '토켈라우' },
      { value: 'TO', label: '통가' },
      { value: 'TV', label: '투발루' },
      { value: 'PG', label: '파푸아뉴기니' },
      { value: 'PW', label: '팔라우' },
      { value: 'PF', label: '폴리네시아(프랑스령)' },
      { value: 'FJ', label: '피지' },
      { value: 'AU', label: '호주' },
      { value: 'CT', label: 'CANTON ENDERBURY' },
      { value: 'PC', label: 'CAROLINE IS' },
      { value: 'HM', label: 'HEARD AND MC DONALD ISLANDS' },
    ],
    EU: [
      { value: 'GR', label: '그리스' },
      { value: 'GL', label: '그린란드' },
      { value: 'NL', label: '네덜란드' },
      { value: 'NO', label: '노르웨이' },
      { value: 'DK', label: '덴마크' },
      { value: 'DE', label: '독일' },
      { value: 'LV', label: '라트비아' },
      { value: 'RU', label: '러시아(가입불가)' },
      { value: 'RE', label: '레위니옹' },
      { value: 'RO', label: '루마니아' },
      { value: 'LU', label: '룩셈부르크' },
      { value: 'LT', label: '리투아니아' },
      { value: 'LI', label: '리히텐슈타인' },
      { value: 'MK', label: '마케도니아' },
      { value: 'MC', label: '모나코' },
      { value: 'MD', label: '몰도바(가입불가)' },
      { value: 'MT', label: '몰타' },
      { value: 'PM', label: '미클롱 섬' },
      { value: 'VA', label: '바티칸' },
      { value: 'BM', label: '버뮤다' },
      { value: 'BE', label: '벨기에' },
      { value: 'BY', label: '벨라루스(가입불가)' },
      { value: 'BA', label: '보니스아 헤르체코비나' },
      { value: 'BG', label: '불가리아' },
      { value: 'SM', label: '산마리노' },
      { value: 'RS', label: '세르비아' },
      { value: 'SJ', label: '스발바르 얀마위엔섬' },
      { value: 'SE', label: '스웨덴' },
      { value: 'CH', label: '스위스' },
      { value: 'ES', label: '스페인' },
      { value: 'SK', label: '슬로바키아' },
      { value: 'SI', label: '슬로베니아' },
      { value: 'IS', label: '아이슬란드' },
      { value: 'IE', label: '아일랜드' },
      { value: 'AD', label: '안도라' },
      { value: 'AL', label: '알바니아' },
      { value: 'EE', label: '에스토니아' },
      { value: 'GB', label: '영국' },
      { value: 'AT', label: '오스트리아' },
      { value: 'UA', label: '우크라이나(가입불가)' },
      { value: 'WF', label: '월리스푸투나제도' },
      { value: 'YU', label: '유고' },
      { value: 'IT', label: '이탈리아' },
      { value: 'GI', label: '지브롤터' },
      { value: 'CZ', label: '체코' },
      { value: 'HR', label: '크로아티아' },
      { value: 'FO', label: '페로제도' },
      { value: 'PT', label: '포르투갈' },
      { value: 'FK', label: '포클랜드' },
      { value: 'PL', label: '폴란드' },
      { value: 'FR', label: '프랑스' },
      { value: 'FI', label: '핀란드' },
      { value: 'HU', label: '헝가리' },
      { value: 'BV', label: 'BOUVET ISLAND' },
      { value: 'IO', label: 'BRITISH INDIAN OCEAN TERRITORY' },
      { value: 'FX', label: 'FRANCE METROPOLITAN' },
      { value: 'YT', label: 'MAYOTTE' },
      { value: 'PN', label: 'PITCAIRN' },
    ],
  };

  return (
    <div className="speed_Wrap" style={{ background: '#fff' }}>
      <section className="tour2023_pc_SpeedTop_w">
        <div className="tour2023_pc_SpeedTop">
          <p className="tour2023_pc_SpeedTop_icon"></p>
          <p className="tour2023_pc_SpeedTop01">
            <span
              className="tour2023_pc_SpeedTop_title"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}
            >
              <span>단체여행자보험<em className="tour2023_pc_SpeedTop_title01">(법인/단체)</em></span>
              {!isLoading && isLoggedIn && member && (
                <span className="tour2023_pc_SpeedTop_loginUser" style={{ fontSize: 14, color: '#4d60d6', fontWeight: 500 }}>
                  {member.member_type === '법인' && corporateName ? corporateName : member.name}님
                </span>
              )}
            </span>
            <span className="tour2023_pc_SpeedTop_title02">
              사업자등록증(고유번호증) 있는 법인/단체 포괄회원 가입으로 보다 편리하게 이용하실 수 있습니다.
            </span>
          </p>
          <a className="close" href="#" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ top: 8 }}>닫기</a>
        </div>
      </section>

      <div className="speed_content">
        <div className="con01">
          <div className="tour2023_pc_menu_wrap tourG_mat05 tourG_mab05">
            <span className="menu"><a href="/group-insurance/domestic/popup">국내여행자보험</a></span>
            <span className="menu on"><a href="javascript:void(0);">해외여행자보험</a></span>
            <span className="menu"><a href="/group-insurance/longstay/popup">해외장기체류보험</a></span>
          </div>

          <ul>
            <li className="tour2023_pc_SpeedTop_title03">- 기간 : 1일-3개월 (4개월 초과는 해외장기체류보험으로 가입 가능)</li>
            <li className="tour2023_pc_SpeedTop_title03">- 목적 : 여행, 관광, 연수, 출장, 단기어학연수 등 (운동경기 및 기타 위험한 활동 가입불가)</li>
          </ul>
        </div>

        <div className="con02">
          <div className="tour2023_pc_SpeedTop_line01">
            <span className="tour2023_pc_SpeedTop_title05">해외여행자보험 기본정보 입력</span>
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
                              <option value="SA">남아메리카</option>
                              <option value="NA">북아메리카</option>
                              <option value="AS">아시아</option>
                              <option value="AF">아프리카</option>
                              <option value="AU">오세아니아</option>
                              <option value="EU">유럽</option>
                            </select>
                          </span>
                        </div>
                        <div className="bg_join input_cell_01 wd_48 ml10">
                          <span className="ps_box02 wd_100">
                            <select
                              className="sel01"
                              value={tourPlace}
                              onChange={(e) => {
                                const selectedValue = e.target.value;
                                const selectedPlace = continentPlaces[tourContinent]?.find((p) => p.value === selectedValue);
                                if (selectedPlace?.label?.includes('(가입불가)')) {
                                  alert('해외여행 보험 가입 불가 지역입니다.');
                                  return;
                                }
                                setTourPlace(selectedValue);
                              }}
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
                              <option value="">선택하세요</option>
                              <option value="001">일반관광</option>
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
            {currentPage === 1 ? (
              <>
                <span className="con3Tit">GUIDE</span>
                <ul>
                  <li>- 해외여행보험의 보험기간은 최대 3개월입니다.<br />3개월이 넘는 경우에는 목적에 따라 해외장기체류 보험의 유학생플랜, 어학연수 플랜, 교환교수(학생)플랜, 해외장기출장(주재원)플랜을 선택하시기 바랍니다.</li>
                  <li>- 이미 출국하셨거나 해외에 거주하는 경우 여행보험에 가입하실 수 없습니다.</li>
                  <li>- 2개 이상의 국가를 여행하는 경우 최초 방문하는 국가를 선택하시기 바랍니다.(단, 여행국가 중에 체코가 포함되는 경우 체코를 선택하시기 바랍니다.)</li>
                  <li>- 여행예정인 국가 중 보험인수 제한 국가가 포함되어 있을 경우 여행 보험 가입이 불가능합니다.</li>
                </ul>
              </>
            ) : (
              <>
                <span className="con3Tit">중복가입 유의사항</span>
                <ul>
                  <li>- 이미 실손 의료보험에 가입하셨다면 해외여행보험의 <span style={{ color: 'red' }}>국내의료비를 중복 가입하는 것은 권장하지 않습니다.</span></li>
                  <li>- 국내의료비를 중복가입 하더라도 보험금은 실제 발생한 손해액을 기준으로 지급하므로 중복가입의 실익이 낮을 수 있습니다.</li>
                  <li>- <span style={{ color: 'red' }}>실손 의료보험 가입자는 국내의료비 부담보 플랜을 선택하시기 바랍니다.</span></li>
                  <li>- 실손 의료보험 계약보유여부 확인방법<br />한국신용정보원보험신용정보(<span style={{ color: '#15aefd' }}>www.credit4u.or.kr</span>)<br />에서 이미 가입한 실손의료보험을 조회하실 수 있습니다.</li>
                </ul>
              </>
            )}
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: '#16569a', fontSize: '14px', fontWeight: 'bold' }}>
              <span 
                onClick={() => setCurrentPage(1)} 
                style={{ cursor: 'pointer', marginRight: '10px', color: currentPage === 1 ? '#16569a' : '#999' }}
              >
                1
              </span>
              <span 
                onClick={() => setCurrentPage(2)} 
                style={{ cursor: 'pointer', color: currentPage === 2 ? '#16569a' : '#999' }}
              >
                2
              </span>
            </div>
          </div>
        </div>

        <div className="con_btnWrap mb40">
          <a href="#" onClick={(e) => { e.preventDefault(); handleSubmit(); }}>설계하기</a>
        </div>

        <section className="tour2023_pc_insuBox">
          <div className="tour2023_pc_insuBox01">
            <span className="tour2023_pc_txt01">투어밸리 회원님은 회원 로그인후 이용하세요. (마일리지 적립)</span>
          </div>
          <a href="/login?from=group-insurance&returnTo=overseas" className="tour2023PC_btn_b tour2023_pc_btnLogin">회원 LOGIN</a>
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
              <dd className="font_gray">라이나손해보험의 해외여행보험 상품입니다.</dd>
              <dd className="font_gray">해외여햄보험의 주계약은 상해사망 및 후유장해이며 그 외에는 기타특약입니다. 기타특약은 해당특약 가입시에만 보상받으실 수 있습니다.</dd>
              <dd className="font_gray">배상책임, 휴대품손해는 자기부담금 각 1만원입니다.</dd>
              <dd className="font_blue">
                휴대품손해에서 휴대품 1개(1조 또는 1쌍)의 보상한도는 20만원입니다. <span className="font_red">단, 이동통신단말기의 보상한도는 10만입니다. (2020년 1월 약관 개정)</span>
              </dd>
              <dd className="font_gray">
                <span className="font_red">(비례보상)실손의료비, 특별비용, 배상책임, 휴대품손해를 보상하는 상품</span>은 2개 이상의 보험에 가입하더라도 중복 보상되지 않고 <span className="font_red">비례보상됩니다.</span>
              </dd>
              <dd className="font_gray">상법 제732조에 따라 15세 미만의 경우 사망에 대해서는 보장하지않습니다.(후유장해)</dd>
              <dd className="font_gray">가입 전 알아두실 사항 및 보장내용에 관한 자세한 사항은 해당약관을 참조하시기 바랍니다.</dd>
            </dl>
          </div>
        </div>

        <section className="ss_number_w">
          <div className="ss_number">
            ※ 본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.<br />
            준법감시필 제2026-광고T-002(2026.03.04-2027-03.03)
          </div>
        </section>
      </div>
    </div>
  );
}

