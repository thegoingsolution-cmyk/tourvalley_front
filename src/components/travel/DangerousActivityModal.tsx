'use client';

import React from 'react';

interface DangerousActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DangerousActivityModal({
  isOpen,
  onClose,
}: DangerousActivityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">보험가입제한 위험한 활동</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="tour2023_limit_state">
            <p className="tour2023_pcBox_txt10">
              ① 스쿠버다이빙<br />
              ② 행글라이딩,패러글라이딩<br />
              ③ 스카이다이빙<br />
              ④ 수상스키<br />
              ⑤ 자동차,오토바이 경주<br />
              ⑥ 번지점프<br />
              ⑦ 빙벽,암벽등반<br />
              ⑧ 제트스키<br />
              ⑨ 래프팅<br />
              ⑩ 스키(스노보드)<br />
              ⑪ 운동경기참여(전지훈련,대회,시합)<br />
              ⑫ 바다낚시 동호회의 정기여행<br />
              ⑬ 산악자전거
            </p>
            <div className="tourG_mat13 tourG_mab01">
              <a href="javascript:void(0);" className="btn_b tour2023PC_btn04" onClick={onClose}>확인</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

