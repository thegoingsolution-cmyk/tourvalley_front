'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AccidentFreeCashModal from './travel/AccidentFreeCashModal';
import './ServiceModal.css';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccidentFreeCashModal?: () => void;
}

export default function ServiceModal({ isOpen, onClose, onOpenAccidentFreeCashModal }: ServiceModalProps) {
  const router = useRouter();
  const [showCashModal, setShowCashModal] = useState(false);

  if (!isOpen && !showCashModal) return null;

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path);
  };

  const openGroupInsurancePopup = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      '/group-insurance/domestic/popup',
      'groupInsurancePopup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    onClose();
  };

  const handleAccidentFreeCashClick = () => {
    onClose();
    // 부모에서 제공한 함수가 있으면 사용, 없으면 자체 모달 사용
    if (onOpenAccidentFreeCashModal) {
      onOpenAccidentFreeCashModal();
    } else {
      setShowCashModal(true);
    }
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="service-modal-overlay" onClick={onClose}>
          <div className="service-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="service-modal-header">
              <h2 className="service-modal-title">투어밸리 서비스 전체보기</h2>
              <button className="service-modal-close" onClick={onClose} aria-label="닫기">
                ×
              </button>
            </div>
            
            <div className="service-modal-body">
              {/* 1줄 */}
              <div className="service-modal-row">
                <div className="service-category">
                  <h3 className="service-category-title">여행자보험</h3>
                  <ul className="service-list">
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/domestic'); }}>- 국내여행자보험</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/overseas'); }}>- 해외여행자보험</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/long-term-stay'); }}>- 해외장기체류보험</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); openGroupInsurancePopup(); }}>- 법인/단체여행자보험</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/estimate/step1'); }}>- 여행자보험 견적신청</a></li>
                  </ul>
                </div>

                <div className="service-category">
                  <h3 className="service-category-title">고객센터</h3>
                  <ul className="service-list">
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/notice'); }}>- 공지사항</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/customer-center?view=qna'); }}>- Q&A 게시판</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/claim-guide'); }}>- 보험금 청구안내 (CHUBB에이스)</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/claim-guide-db'); }}>- 보험금 청구안내 (DB손해보험)</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/claim-guide-hyundai'); }}>- 보험금 청구안내 (현대해상)</a></li>
                  </ul>
                </div>
              </div>

              {/* 2줄 */}
              <div className="service-modal-row">
                <div className="service-category">
                  <h3 className="service-category-title">계약 및 무사고캐시</h3>
                  <ul className="service-list">
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/contracts'); }}>- 계약(가입내역)조회</a></li>
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleAccidentFreeCashClick(); }}>- 무사고캐시 조회</a></li>
                  </ul>
                </div>

                <div className="service-category">
                  <h3 className="service-category-title">행사보험 견적</h3>
                  <ul className="service-list">
                    <li><a href="#" className="service-link" onClick={(e) => { e.preventDefault(); handleNavigation('/event-insurance'); }}>- 행사주최자 배상책임보험</a></li>
                  </ul>
                </div>
              </div>

              {/* 3줄 */}
              <div className="service-modal-row">
                <div className="service-category">
                  <h3 className="service-category-title" style={{ cursor: 'pointer' }} onClick={() => handleExternalLink('https://b2b.tourvalley.net/')}>여행사전용 여행보험센터</h3>
                  {/* <ul className="service-list">
                    <li><a href="#" className="service-link">- 여행사전용 여행보험센터</a></li>
                  </ul> */}
                </div>

                {/* <div className="service-category">
                  <h3 className="service-category-title">무역협회 회원사 전용</h3>
                </div> */}
              </div>
            </div>

            <div className="service-modal-footer">
              <button className="service-modal-close-btn" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 무사고캐시 모달 */}
      <AccidentFreeCashModal 
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
      />
    </>
  );
}

