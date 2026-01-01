'use client';

import React from 'react';
import './ServiceModal.css';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceModal({ isOpen, onClose }: ServiceModalProps) {
  if (!isOpen) return null;

  return (
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
                <li><a href="#" className="service-link">- 국내여행자보험</a></li>
                <li><a href="#" className="service-link">- 해외여행자보험</a></li>
                <li><a href="#" className="service-link">- 해외장기체류보험</a></li>
                <li><a href="#" className="service-link">- 법인/단체여행자보험</a></li>
                <li><a href="#" className="service-link">- 여행자보험 견적신청</a></li>
              </ul>
            </div>

            <div className="service-category">
              <h3 className="service-category-title">고객센터</h3>
              <ul className="service-list">
                <li><a href="#" className="service-link">- 공지사항</a></li>
                <li><a href="#" className="service-link">- Q&A 게시판</a></li>
                <li><a href="#" className="service-link">- 보험금 청구안내 (CHUBB에이스)</a></li>
                <li><a href="#" className="service-link">- 보험금 청구안내 (DB손해보험)</a></li>
                <li><a href="#" className="service-link">- 보험금 청구안내 (현대해상)</a></li>
              </ul>
            </div>
          </div>

          {/* 2줄 */}
          <div className="service-modal-row">
            <div className="service-category">
              <h3 className="service-category-title">계약 및 무사고캐시</h3>
              <ul className="service-list">
                <li><a href="#" className="service-link">- 계약(가입내역)조회</a></li>
                <li><a href="#" className="service-link">- 무사고캐시 조회</a></li>
              </ul>
            </div>

            <div className="service-category">
              <h3 className="service-category-title">행사보험 견적</h3>
              <ul className="service-list">
                <li><a href="#" className="service-link">- 행사주최자 배상책임보험</a></li>
              </ul>
            </div>
          </div>

          {/* 3줄 */}
          <div className="service-modal-row">
            <div className="service-category">
              <h3 className="service-category-title">여행사전용 여행보험센터</h3>
              {/* <ul className="service-list">
                <li><a href="#" className="service-link">- 여행사전용 여행보험센터</a></li>
              </ul> */}
            </div>

            <div className="service-category">
              <h3 className="service-category-title">무역협회 회원사 전용</h3>
              {/* <ul className="service-list">
                <li><a href="#" className="service-link">- 무역협회 회원사 전용</a></li>
              </ul> */}
            </div>
          </div>
        </div>

        <div className="service-modal-footer">
          <button className="service-modal-close-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

