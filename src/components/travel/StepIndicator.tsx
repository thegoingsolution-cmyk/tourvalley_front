'use client';

import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  stepLabels?: string[];
}

export default function StepIndicator({ 
  currentStep, 
  totalSteps = 3,
  stepLabels = ['여행정보', '가입정보', '신청완료']
}: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <React.Fragment key={stepNumber}>
            <div className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <span className="step-number">{stepNumber}</span>
              <span className="step-label">{stepLabels[index] || `STEP ${stepNumber}`}</span>
            </div>
            {index < totalSteps - 1 && <div className="step-line"></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

