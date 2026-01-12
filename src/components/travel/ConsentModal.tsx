'use client';

import React, { useState } from 'react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pdfPath?: string;
  insuranceType?: string; // '해외여행보험' 또는 '국내여행보험'
}

export default function ConsentModal({
  isOpen,
  onClose,
  onConfirm,
  pdfPath,
  insuranceType = '국내여행보험',
}: ConsentModalProps) {
  // 보험 타입에 따라 PDF 경로와 텍스트 결정
  const isOverseas = insuranceType === '해외여행보험' || insuranceType === '해외여행자보험';
  const isLongTermStay = insuranceType === '해외장기체류보험';
  const defaultPdfPath = isLongTermStay
    ? '/pdf/해외장기체류보험_약관.pdf'
    : isOverseas
    ? '/pdf/ACE손해_해외여행보험약관.pdf'
    : '/pdf/ACE손해_국내여행보험약관.pdf';
  const finalPdfPath = pdfPath || defaultPdfPath;
  const pdfFileName = isLongTermStay 
    ? '해외장기체류보험_약관.pdf'
    : isOverseas 
    ? '해외여행보험_약관.pdf' 
    : '국내여행보험_약관.pdf';
  const pdfButtonText = isLongTermStay
    ? '해외장기체류보험 약관보기'
    : isOverseas 
    ? '해외여행보험 약관보기' 
    : '국내여행보험 약관보기';
  const [consentAll, setConsentAll] = useState(false);
  const [consentItems, setConsentItems] = useState({
    siteUse: false,
    personalInfo: false,
    sensitiveInfo: false,
    terms: false,
  });

  if (!isOpen) return null;

  const handleConsentAllChange = (checked: boolean) => {
    setConsentAll(checked);
    setConsentItems({
      siteUse: checked,
      personalInfo: checked,
      sensitiveInfo: checked,
      terms: checked,
    });
  };

  const handleConfirm = () => {
    if (!consentAll) {
      alert('전체동의를 선택해주세요.');
      return;
    }
    onConfirm();
  };

  const handlePdfDownload = () => {
    const link = document.createElement('a');
    link.href = finalPdfPath;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openConsentPopup = (url: string, name: string) => {
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            보험가입을 위한 개인(신용)정보 수집, 이용, 조회제공 동의서
          </h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="tour2023_limit_state">
            <div className="tourG_mat06">
              <div className="">
                <div className="in_wrap pb5">
                  <ul className="tourG_agree">
                    <li className="tourG_cir tourG_chk">
                      <input
                        type="checkbox"
                        id="all_agree"
                        checked={consentAll}
                        onChange={(e) => handleConsentAllChange(e.target.checked)}
                      />
                      <label htmlFor="all_agree">
                        <span className="tourGuard_txt06 tourG_mleft05">전체동의</span>
                      </label>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="tourG_line02 tourG_mat07 tourG_mab05"></div>

              {/* 동의 01 */}
              <div className="in_wrap tourG_mab03">
                <ul className="tourG_agree">
                  <li className="tourG_cir tourG_chk">
                    <label htmlFor="a01">
                      <span className="tourGuard_txt04">여행보험 사이트 이용동의</span>
                    </label>
                    <a 
                      href="javascript:void(0);" 
                      className="tourG_more"
                      onClick={() => openConsentPopup('/terms/consent-01.html', 'consent01')}
                    ></a>
                  </li>
                </ul>
              </div>

              {/* 동의 02 */}
              <div className="in_wrap tourG_mab03">
                <ul className="tourG_agree">
                  <li className="tourG_cir tourG_chk">
                    <label htmlFor="a02">
                      <span className="tourGuard_txt04">개인(신용)정보의 수집, 이용, 조회, 제공 동의</span>
                    </label>
                    <a 
                      href="javascript:void(0);" 
                      className="tourG_more"
                      onClick={() => openConsentPopup('/terms/consent-02.html', 'consent02')}
                    ></a>
                  </li>
                </ul>
              </div>

              {/* 동의 03 */}
              <div className="in_wrap tourG_mab03">
                <ul className="tourG_agree">
                  <li className="tourG_cir tourG_chk">
                    <label htmlFor="a05">
                      <span className="tourGuard_txt04">민감정보 및 고유식별정보처리</span>
                    </label>
                    <a 
                      href="javascript:void(0);" 
                      className="tourG_more"
                      onClick={() => openConsentPopup('/terms/consent-03.html', 'consent03')}
                    ></a>
                  </li>
                </ul>
              </div>

              {/* 동의 04 */}
              <div className="in_wrap tourG_mab04">
                <ul className="tourG_agree">
                  <li className="tourG_cir tourG_chk">
                    <label htmlFor="a06">
                      <span className="tourGuard_txt04">여행보험 가입시 알아두어야 할 사항</span>
                    </label>
                    <a 
                      href="javascript:void(0);" 
                      className="tourG_more"
                      onClick={() => openConsentPopup('/terms/consent-04.html', 'consent04')}
                    ></a>
                  </li>
                </ul>
              </div>

              <div className="tourG_mat12">
                <a
                  href="javascript:void(0);"
                  className="tourGuard_btn_b tour2023_btn06_gray"
                  onClick={handlePdfDownload}
                >
                  {pdfButtonText}<span className="tour2023_arr01"></span>
                </a>
              </div>
              <div className="tourG_mat07 tourG_mab02">
                <a
                  href="javascript:void(0);"
                  className="tourGuard_btn_b tourGuard_btn01"
                  onClick={handleConfirm}
                >
                  확인
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

