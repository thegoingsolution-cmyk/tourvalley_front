'use client';

import React from 'react';

interface FixedBottomButtonsProps {
  canProceed?: boolean;
  onTwoOrMoreClick?: () => void;
  onSingleClick?: () => void;
}

export default function FixedBottomButtons({
  canProceed = false,
  onTwoOrMoreClick,
  onSingleClick,
}: FixedBottomButtonsProps) {
  return (
    <section id="tour2023_fixedBanner">
      <div className="tour2023_bottom_btn" id="nextBtn2" style={{ display: canProceed ? 'none' : 'inline-flex' }}>
        <div className="tour2023_btn_b tour2023_btn02">2인 이상 가입</div>
        <div className="tour2023_btn_b tour2023_btn03">1인 가입</div>
      </div>
      <div className="tour2023_bottom_btn" id="nextBtn" style={{ display: canProceed ? 'inline-flex' : 'none' }}>
        <a
          href="javascript:void(0);"
          onClick={(e) => {
            e.preventDefault();
            if (onTwoOrMoreClick) onTwoOrMoreClick();
          }}
          className="tour2023_btn_b tour2023_btn02_ov"
        >
          2인 이상 가입
        </a>
        <a
          href="javascript:void(0);"
          onClick={(e) => {
            e.preventDefault();
            if (onSingleClick) onSingleClick();
          }}
          className="tour2023_btn_b tour2023_btn03_ov"
        >
          1인 가입
        </a>
      </div>
    </section>
  );
}
