'use client';

import React, { useEffect, useState } from 'react';

interface Country {
  code: string;
  name: string;
}

interface CountrySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (countryCode: string, countryName: string) => void;
  selectedCountry?: string;
}

// 자주가는 국가 목록
const frequentCountries: Country[] = [
  { code: 'JP', name: '일본' },
  { code: 'VN', name: '베트남' },
  { code: 'TH', name: '태국' },
  { code: 'TW', name: '대만' },
  { code: 'PH', name: '필리핀' },
  { code: 'GU', name: '괌' },
  { code: 'SG', name: '싱가포르' },
  { code: 'US', name: '미국' },
  { code: 'MY', name: '말레이시아' },
];

// 전체 국가 목록
const allCountries: Country[] = [
  { code: 'GH', name: '가나' },
  { code: 'GA', name: '가봉' },
  { code: 'GY', name: '가이아나' },
  { code: 'GM', name: '감비아' },
  { code: 'GP', name: '과들루프' },
  { code: 'GT', name: '과테말라' },
  { code: 'GU', name: '괌' },
  { code: 'GD', name: '그레나다' },
  { code: 'GE', name: '그루지아' },
  { code: 'GR', name: '그리스' },
  { code: 'GL', name: '그린란드' },
  { code: 'GN', name: '기니(가입불가)' },
  { code: 'GW', name: '기니비소' },
  { code: 'GF', name: '기아나' },
  { code: 'CV', name: '까뽀베르데' },
  { code: 'NA', name: '나미비아' },
  { code: 'NR', name: '나우루' },
  { code: 'NG', name: '나이지리아(가입불가)' },
  { code: 'ZA', name: '남아공화국' },
  { code: 'NL', name: '네덜란드' },
  { code: 'NP', name: '네팔' },
  { code: 'NO', name: '노르웨이' },
  { code: 'NF', name: '노퍽아일랜드' },
  { code: 'NZ', name: '뉴질랜드' },
  { code: 'NC', name: '뉴칼레도니아' },
  { code: 'NU', name: '니웨(니우에)' },
  { code: 'NE', name: '니제르(가입불가)' },
  { code: 'NI', name: '니카라과' },
  { code: 'TW', name: '대만' },
  { code: 'DK', name: '덴마크' },
  { code: 'DM', name: '도미니카' },
  { code: 'DO', name: '도미니카공화국' },
  { code: 'DE', name: '독일' },
  { code: 'TL', name: '동티모르' },
  { code: 'LA', name: '라오스' },
  { code: 'LV', name: '라트비아' },
  { code: 'RU', name: '러시아(가입불가)' },
  { code: 'LB', name: '레바논(가입불가)' },
  { code: 'LS', name: '레소토' },
  { code: 'RE', name: '레위니옹' },
  { code: 'RO', name: '루마니아' },
  { code: 'LU', name: '룩셈부르크' },
  { code: 'RW', name: '르완다' },
  { code: 'LR', name: '리베리아' },
  { code: 'LY', name: '리비아(가입불가)' },
  { code: 'LT', name: '리투아니아' },
  { code: 'LI', name: '리히텐스타인' },
  { code: 'MG', name: '마다가스카르' },
  { code: 'MQ', name: '마르티니크' },
  { code: 'MH', name: '마샬군도' },
  { code: 'FM', name: '마이크로네시아' },
  { code: 'MO', name: '마카오' },
  { code: 'MK', name: '마케도니아' },
  { code: 'MW', name: '말라워' },
  { code: 'MY', name: '말레이시아' },
  { code: 'ML', name: '말리(가입불가)' },
  { code: 'MX', name: '멕시코' },
  { code: 'MC', name: '모나코' },
  { code: 'MA', name: '모로코' },
  { code: 'MU', name: '모리셔스' },
  { code: 'MR', name: '모리타니아' },
  { code: 'MZ', name: '모잠비크' },
  { code: 'MS', name: '몬트세랫' },
  { code: 'MD', name: '몰도바(가입불가)' },
  { code: 'MV', name: '몰디브' },
  { code: 'MT', name: '몰타' },
  { code: 'MN', name: '몽골' },
  { code: 'US', name: '미국' },
  { code: 'VI', name: '미국령 버진 아일랜드' },
  { code: 'UM', name: '미국령 작은 섬' },
  { code: 'MI', name: '미드웨이' },
  { code: 'MM', name: '미얀마(가입불가)' },
  { code: 'PM', name: '미클롱 섬' },
  { code: 'VU', name: '바누아투' },
  { code: 'BH', name: '바레인' },
  { code: 'BB', name: '바베이도스' },
  { code: 'BS', name: '바하마' },
  { code: 'BD', name: '방글라데시' },
  { code: 'BM', name: '버뮤다' },
  { code: 'VG', name: '버어진 아일랜드' },
  { code: 'VE', name: '베네수엘라(가입불가)' },
  { code: 'BJ', name: '베넹' },
  { code: 'VN', name: '베트남' },
  { code: 'BE', name: '벨기에' },
  { code: 'BY', name: '벨라루스(가입불가)' },
  { code: 'BZ', name: '벨리즈' },
  { code: 'BA', name: '보니스아 헤르체코비나' },
  { code: 'BW', name: '보츠와나' },
  { code: 'BO', name: '볼리비아' },
  { code: 'BI', name: '부룬디' },
  { code: 'BF', name: '부르키나파소(가입불가)' },
  { code: 'BT', name: '부탄' },
  { code: 'MP', name: '북마리아나제도(사이판섬,티니안섬,로타섬 등)' },
  { code: 'KP', name: '북한(가입불가)' },
  { code: 'BG', name: '불가리아' },
  { code: 'BR', name: '브라질' },
  { code: 'BN', name: '브루나이' },
  { code: 'VA', name: '비티칸' },
  { code: 'SA', name: '사우디아라비아' },
  { code: 'SP', name: '사이판' },
  { code: 'CY', name: '사이프러스' },
  { code: 'SM', name: '산마리노' },
  { code: 'ST', name: '생 토메 프린시페' },
  { code: 'WS', name: '서사모아' },
  { code: 'EH', name: '서사하라' },
  { code: 'SN', name: '세네갈' },
  { code: 'RS', name: '세르비아' },
  { code: 'SC', name: '세이쉘' },
  { code: 'KN', name: '세인트 키츠 네비스' },
  { code: 'LC', name: '세인트루시아' },
  { code: 'VC', name: '세인트빈센트그레나딘' },
  { code: 'SO', name: '소말리아(가입불가)' },
  { code: 'SB', name: '솔로몬군도' },
  { code: 'SD', name: '수단(가입불가)' },
  { code: 'SR', name: '수리남' },
  { code: 'LK', name: '스리랑카' },
  { code: 'SJ', name: '스발바르 얀마위엔섬' },
  { code: 'SZ', name: '스와질랜드' },
  { code: 'SE', name: '스웨덴' },
  { code: 'CH', name: '스위스' },
  { code: 'ES', name: '스페인' },
  { code: 'SK', name: '슬로바키아' },
  { code: 'SI', name: '슬로베니아' },
  { code: 'SY', name: '시리아(가입불가)' },
  { code: 'SL', name: '시에라리온' },
  { code: 'SG', name: '싱가포르' },
  { code: 'AE', name: '아랍에미리트' },
  { code: 'AW', name: '아루바' },
  { code: 'AM', name: '아르메니아' },
  { code: 'AR', name: '아르헨티나' },
  { code: 'AC', name: '아센션 섬' },
  { code: 'IS', name: '아이슬란드' },
  { code: 'HT', name: '아이티(가입불가)' },
  { code: 'IE', name: '아일랜드' },
  { code: 'AZ', name: '아제르바이젠' },
  { code: 'AF', name: '아프카니스탄(가입불가)' },
  { code: 'AD', name: '안도라' },
  { code: 'AG', name: '안티구아 바부다' },
  { code: 'AL', name: '알바니아' },
  { code: 'DZ', name: '알제리' },
  { code: 'AI', name: '앙갈라' },
  { code: 'AO', name: '앙골라' },
  { code: 'ER', name: '에리트리아' },
  { code: 'EE', name: '에스토니아' },
  { code: 'EC', name: '에콰도르' },
  { code: 'ET', name: '에티오피아' },
  { code: 'SV', name: '엘살바도르' },
  { code: 'GB', name: '영국' },
  { code: 'YE', name: '예멘(가입불가)' },
  { code: 'OM', name: '오만' },
  { code: 'AT', name: '오스트리아' },
  { code: 'HN', name: '온두라스' },
  { code: 'JO', name: '요르단' },
  { code: 'UG', name: '우간다' },
  { code: 'UY', name: '우르과이' },
  { code: 'UZ', name: '우즈베키스탄' },
  { code: 'UA', name: '우크라이나(가입불가)' },
  { code: 'WF', name: '월리스푸투나제도' },
  { code: 'YU', name: '유고슬라비아' },
  { code: 'IQ', name: '이라크(가입불가)' },
  { code: 'IR', name: '이란(가입불가)' },
  { code: 'IL', name: '이스라엘(가입불가)' },
  { code: 'EG', name: '이집트' },
  { code: 'IT', name: '이탈리아' },
  { code: 'IN', name: '인도' },
  { code: 'ID', name: '인도네시아' },
  { code: 'JP', name: '일본' },
  { code: 'JM', name: '자메이카' },
  { code: 'ZR', name: '자이레(가입불가)' },
  { code: 'ZM', name: '잠비아' },
  { code: 'GQ', name: '적도기네' },
  { code: 'CN', name: '중국' },
  { code: 'CF', name: '중앙아프리카(가입불가)' },
  { code: 'DJ', name: '지부티' },
  { code: 'GI', name: '지브롤터' },
  { code: 'ZW', name: '짐바브웨' },
  { code: 'TD', name: '챠드(가입불가)' },
  { code: 'CZ', name: '체코' },
  { code: 'CL', name: '칠레' },
  { code: 'CM', name: '카메룬' },
  { code: 'KZ', name: '카자흐스탄' },
  { code: 'QA', name: '카타르' },
  { code: 'KH', name: '캄보디아' },
  { code: 'CA', name: '캐나다' },
  { code: 'KE', name: '케냐' },
  { code: 'KY', name: '케이만' },
  { code: 'KM', name: '코모로' },
  { code: 'CR', name: '코스타리카' },
  { code: 'CC', name: '코코스섬' },
  { code: 'CI', name: '코트디브와르(가입불가)' },
  { code: 'CO', name: '콜롬비아' },
  { code: 'CG', name: '콩고(가입불가)' },
  { code: 'CD', name: '콩고(자이레)(가입불가)' },
  { code: 'CU', name: '쿠바(가입불가)' },
  { code: 'KW', name: '쿠웨이트' },
  { code: 'CK', name: '쿡아일랜드' },
  { code: 'HR', name: '크로아티아' },
  { code: 'CX', name: '크리스마스섬' },
  { code: 'KG', name: '키르키즈스탄' },
  { code: 'KI', name: '키리바시' },
  { code: 'TJ', name: '타지키스탄' },
  { code: 'TZ', name: '탄자니아' },
  { code: 'TH', name: '태국' },
  { code: 'TR', name: '터어키' },
  { code: 'TC', name: '터크스 케이커스 제도' },
  { code: 'TG', name: '토고' },
  { code: 'TK', name: '토켈라우' },
  { code: 'TO', name: '통가' },
  { code: 'TN', name: '투니시아(튀니지)' },
  { code: 'TM', name: '투르크메니스탄' },
  { code: 'TV', name: '투발루' },
  { code: 'TT', name: '트리니다드 토바고' },
  { code: 'TI', name: '티모르' },
  { code: 'PA', name: '파나마' },
  { code: 'PY', name: '파라과이' },
  { code: 'PK', name: '파키스탄(가입불가)' },
  { code: 'PG', name: '파푸아뉴기니아' },
  { code: 'PW', name: '팔라우' },
  { code: 'PS', name: '팔레스타인 자치구(가입불가)' },
  { code: 'FO', name: '페로스제도' },
  { code: 'PE', name: '페루' },
  { code: 'PT', name: '포르투칼' },
  { code: 'FK', name: '포클랜드' },
  { code: 'PL', name: '폴란드' },
  { code: 'PF', name: '폴리네시아(프랑스령)' },
  { code: 'PR', name: '푸에르토리코' },
  { code: 'FR', name: '프랑스' },
  { code: 'TF', name: '프랑스령 남부지역' },
  { code: 'FJ', name: '피지' },
  { code: 'FI', name: '핀란드' },
  { code: 'PH', name: '필리핀' },
  { code: 'HU', name: '헝가리' },
  { code: 'AU', name: '호주' },
  { code: 'HK', name: '홍콩' },
];

export default function CountrySelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedCountry,
}: CountrySelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSearchTerm(''); // 모달이 열릴 때 검색어 초기화
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCountryClick = (countryCode: string, countryName: string) => {
    onSelect(countryCode, countryName);
    onClose();
  };

  const filteredAllCountries = allCountries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFrequentCountries = frequentCountries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSearchTerm = searchTerm.trim().length > 0;

  return (
    <div className="country-modal-overlay" onClick={onClose}>
      <div className="tour2023_pcBox_Layer country-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tour2023_pc_layer tour2023_pcBox_country">
          <div className="tour2023_pcBox_top">
            <p className="tour2023_pcBox_tit">여행 국가 선택</p>
            <button className="close" onClick={onClose}>
              ×
            </button>
          </div>
          
          <section className="tour2023_country">
            <div className="scroll_box">
              {/* 검색 입력창 */}
              <div style={{ marginBottom: '20px', padding: '0' }}>
                <input
                  type="text"
                  placeholder="국가명 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 검색어가 없을 때만 자주가는 국가 표시 */}
              {!hasSearchTerm && (
                <>
                  <p className="tour2023_pcBox_txt05">자주가는 국가</p>
                  <ul>
                    {frequentCountries.map((country) => (
                      <li key={country.code} className="tour2023_pcBox_txt06">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCountryClick(country.code, country.name);
                          }}
                          className={selectedCountry === country.name ? 'selected' : ''}
                        >
                          {country.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* 검색어가 있을 때는 검색 결과만 표시 */}
              {hasSearchTerm ? (
                <>
                  <p className="tour2023_pcBox_txt05">검색 결과</p>
                  {filteredAllCountries.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      검색 결과가 없습니다.
                    </div>
                  ) : (
                    <ul>
                      {filteredAllCountries.map((country) => (
                        <li key={country.code} className="tour2023_pcBox_txt06">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleCountryClick(country.code, country.name);
                            }}
                            className={selectedCountry === country.name ? 'selected' : ''}
                          >
                            {country.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <p className="tour2023_pcBox_txt05 tourG_mat05">전체국가</p>
                  <ul>
                    {allCountries.map((country) => (
                      <li key={country.code} className="tour2023_pcBox_txt06">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCountryClick(country.code, country.name);
                          }}
                          className={selectedCountry === country.name ? 'selected' : ''}
                        >
                          {country.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

