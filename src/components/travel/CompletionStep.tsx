'use client';

import React from 'react';
import { Participant } from './types';

interface CompletionStepProps {
  participantName: string;
  onViewDetails?: () => void;
  onGoHome?: () => void;
}

export default function CompletionStep({
  participantName,
  onViewDetails,
  onGoHome,
}: CompletionStepProps) {
  return (
    <section className="form-section">
      <div className="form-container">
        <div className="form-card">
          <div className="completion-section">
            <div className="completion-icon">✓</div>
            <div className="completion-message">감사합니다.</div>
            <div className="completion-name">{participantName} 고객님의 여행자보험</div>
            <div className="completion-submessage">가입신청이 완료되었습니다.</div>
            <button
              type="button"
              className="view-details-btn"
              onClick={onViewDetails || (() => alert('가입내역 확인 기능은 추후 구현 예정입니다.'))}
            >
              가입내역 확인 ›
            </button>
          </div>

          <div className="accident-free-cash-promo">
            <div className="promo-title">보험료의 10% (최대 30,000원)</div>
            <div className="promo-subtitle">무사고캐시 적립서비스</div>
            <div className="promo-description">
              사고없이 다녀오셨다면<br />
              투어밸리 무사고캐시를 적립하세요.<br />
              재가입할 때 그만큼 보험료를 아낄 수 있습니다.
            </div>
            <div className="promo-illustration">
              <div className="piggy-bank-placeholder">🐷</div>
            </div>
            <button
              type="button"
              className="promo-info-btn"
              onClick={() => alert('무사고캐시 설명 기능은 추후 구현 예정입니다.')}
            >
              ▶ 무사고캐시란?
            </button>
          </div>

          <div className="completion-notes">
            <h3>※ 알아두세요</h3>
            <ul>
              <li>고객센터 근무시간: 월~금 10:00~17:00 (토,일 공휴일 휴무)</li>
              <li>주말 공휴일 등 고객센터 업무시간 이외에 여행보험을 신청하는 경우 보험료 결제가 된 경우에는 설계하신 보험기간으로 보험을 받으실 수 있습니다.</li>
            </ul>
          </div>

          <button
            type="button"
            className="completion-next-btn"
            onClick={onGoHome || (() => { window.location.href = '/'; })}
          >
            다음
          </button>
        </div>
      </div>
    </section>
  );
}

