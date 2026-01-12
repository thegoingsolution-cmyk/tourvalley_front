'use client';

import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  stepLabels?: string[];
}

export default function MobileStepIndicator({ 
  currentStep, 
  stepLabels = ['여행정보', '가입정보', '신청완료']
}: StepIndicatorProps) {
  return (
    <section className="tour2023_step_w">
      <div className="tour2023_step_line tour">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          
          return (
            <ul key={stepNumber} className={`tour2023_step ${isActive ? 'on' : ''}`}>
              <li className="tour2023_step01">
                <div className="tour2023_step_num">
                  <span className="tour2023_step_num01">{stepNumber}</span>
                </div>
                <div className="tour2023_step_txt">{label}</div>
              </li>
            </ul>
          );
        })}
      </div>
    </section>
  );
}
