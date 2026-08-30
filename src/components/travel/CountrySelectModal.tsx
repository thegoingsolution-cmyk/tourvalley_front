'use client';

import React, { useEffect, useState } from 'react';
import { allCountries, frequentCountries } from '@/components/travel/utils/countries';

interface CountrySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (countryCode: string, countryName: string) => void;
  selectedCountry?: string;
}

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
    if (countryName.includes('(가입불가)')) {
      alert('해외여행 보험 가입 불가 지역입니다.');
      return;
    }
    onSelect(countryCode, countryName);
    onClose();
  };

  const filteredAllCountries = allCountries.filter((country) =>
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
