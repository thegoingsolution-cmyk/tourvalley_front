'use client';

import React from 'react';

interface RestrictedCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RestrictedCountryModal({
  isOpen,
  onClose,
}: RestrictedCountryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">보험인수 제한국가 확인</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="tour2023_limit_state">
            <p className="tour2023_pcBox_txt10">
              여행예정인 국가 중 보험인수 제한 국가가 포함되어 있을 경우 보험가입이 불가능합니다.
            </p>
            <p className="tour2023_pcBox_txt10" style={{ marginTop: '16px' }}>
              <a 
                href="https://www.0404.go.kr/dev/country.mofa?idx=&hash=&chkvalue=no2&stext=&group_idx=&alert_level=0" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#2843e5', textDecoration: 'underline' }}
              >
                외교부 해외안전여행 여행제한 및 금지구역 확인
              </a>
            </p>
            <div style={{ marginTop: '24px' }}>
              <p className="tour2023_pcBox_txt10" style={{ fontWeight: 600, marginBottom: '8px' }}>
                아시아
              </p>
              <p className="tour2023_pcBox_txt10">
                레바논, 미얀마, 북한, 시리아, 아프가니스탄, 예멘, 이라크, 이란, 이스라엘, 파키스탄, 팔레스타인 자치구
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p className="tour2023_pcBox_txt10" style={{ fontWeight: 600, marginBottom: '8px' }}>
                아프리카
              </p>
              <p className="tour2023_pcBox_txt10">
                기니, 나이지리아, 니제르, 리비아, 말리, 부르키나파소, 소말리아, 수단, 자이레, 중앙아프리카, 챠드, 코트디브와르, 콩고, 콩고(자이레)
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p className="tour2023_pcBox_txt10" style={{ fontWeight: 600, marginBottom: '8px' }}>
                유럽
              </p>
              <p className="tour2023_pcBox_txt10">
                러시아, 몰도바, 벨라루스, 우크라이나, 크림반도
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p className="tour2023_pcBox_txt10" style={{ fontWeight: 600, marginBottom: '8px' }}>
                북아메리카
              </p>
              <p className="tour2023_pcBox_txt10">
                쿠바
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p className="tour2023_pcBox_txt10" style={{ fontWeight: 600, marginBottom: '8px' }}>
                남아메리카
              </p>
              <p className="tour2023_pcBox_txt10">
                베네수엘라, 아이티
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p className="tour2023_pcBox_txt10" style={{ fontWeight: 600, marginBottom: '8px' }}>
                기타
              </p>
              <p className="tour2023_pcBox_txt10">
                남극
              </p>
            </div>
            <div className="tourG_mat13 tourG_mab01">
              <a href="javascript:void(0);" className="btn_b tour2023PC_btn04" onClick={onClose}>확인</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

