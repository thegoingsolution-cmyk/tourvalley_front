'use client';

import React, { useState, useEffect, useRef } from 'react';
import StepIndicator from './StepIndicator';
import { Participant, CalculatedPremiums, PlanType } from './types';
import { sendVerificationCode, verifyCode } from '@/services/smsService';

interface ParticipantInfoStepProps {
  insuranceType: string;
  participants: Participant[];
  calculatedPremiums: CalculatedPremiums | null;
  hasMedicalExpense: boolean;
  isCalculating: boolean;
  participantCount: 1 | 2;
  onParticipantsChange: (participants: Participant[]) => void;
  onCalculatedPremiumsChange: (premiums: CalculatedPremiums | null) => void;
  onCalculate: () => Promise<void>;
  onApply: () => void;
  onExcelUpload: () => void;
  // For premium calculation
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  selectedPlan: PlanType | null;
  calculateAgeFromBirthDate: (birthDate: string) => number | null;
  // STEP1에서 입력한 생년월일
  birthDate?: string;
  gender?: 'male' | 'female';
}

export default function ParticipantInfoStep({
  insuranceType,
  participants,
  calculatedPremiums,
  hasMedicalExpense,
  isCalculating,
  participantCount,
  onParticipantsChange,
  onCalculatedPremiumsChange,
  onCalculate,
  onApply,
  onExcelUpload,
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  selectedPlan,
  calculateAgeFromBirthDate,
  birthDate,
  gender,
}: ParticipantInfoStepProps) {
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const premiumSummaryRef = useRef<HTMLDivElement>(null);

  // STEP1에서 입력한 생년월일과 성별을 가입자 1(대표)에 자동 세팅
  useEffect(() => {
    if (!isInitialized && participants.length > 0 && birthDate) {
      const updated = [...participants];
      updated[0] = {
        ...updated[0],
        birthDate: birthDate,
        gender: gender === 'male' ? '남자' : gender === 'female' ? '여자' : updated[0].gender,
      };
      onParticipantsChange(updated);
      setIsInitialized(true);
    }
  }, [birthDate, gender, participants, onParticipantsChange, isInitialized]);

  // 보험료 계산 결과가 표시되면 해당 위치로 스크롤
  useEffect(() => {
    if (calculatedPremiums && premiumSummaryRef.current) {
      premiumSummaryRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }
  }, [calculatedPremiums]);

  // 인증번호 타이머
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const handleParticipantChange = (index: number, field: keyof Participant, value: any) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    onParticipantsChange(updated);
  };

  const handleDeleteParticipant = (id: number) => {
    onParticipantsChange(participants.filter((p) => p.id !== id));
  };

  const handleAddParticipant = () => {
    const newId = Math.max(...participants.map((p) => p.id), 0) + 1;
    onParticipantsChange([
      ...participants,
      {
        id: newId,
        name: '',
        englishName: '',
        nationality: '내국인',
        birthDate: '',
        gender: '남자',
        email1: '',
        email2: '',
        phone: '',
        isVerified: false,
      },
    ]);
  };

  const handleSendVerification = async (phone: string) => {
    if (!phone) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }

    try {
      const result = await sendVerificationCode(phone, false);
      if (result.success) {
        setVerificationSent(true);
        setRemainingTime(180);
        setVerificationCode('');
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('인증번호 발송에 실패했습니다.');
    }
  };

  const handleVerifyCode = async (phone: string, code: string) => {
    if (!code || code.length !== 6) {
      alert('인증번호 6자리를 입력해주세요.');
      return;
    }

    try {
      const result = await verifyCode(phone, code);
      if (result.success) {
        const updated = [...participants];
        updated[0].isVerified = true;
        onParticipantsChange(updated);
        setVerificationSent(false);
        setVerificationCode('');
        setRemainingTime(0);
        alert('인증이 완료되었습니다.');
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('인증 확인에 실패했습니다.');
    }
  };

  return (
    <section className="form-section">
      <div className="form-container">
        <div className="form-card">
          <div className="form-header">
            <h1 className="form-title">{insuranceType}</h1>
            <StepIndicator currentStep={2} />
          </div>

          {/* 가입자 정보 입력 폼 */}
          {participants.map((participant, index) => (
            <div 
              key={participant.id} 
              className="participant-form-group"
              style={participantCount === 1 ? {
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: 'none'
              } : undefined}
            >
              <div className="participant-form-header">
                <h3 className="participant-form-subtitle">
                  가입자 {index + 1}{index === 0 ? '(대표)' : ''}
                </h3>
                {index > 0 && (
                  <button
                    className="participant-delete-btn"
                    onClick={() => handleDeleteParticipant(participant.id)}
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="participant-form-fields">
                {/* 이름, 국적 */}
                <div className="participant-form-row">
                  <div className="participant-form-group-item">
                    <label>이름</label>
                    <input
                      type="text"
                      value={participant.name}
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      placeholder="이름"
                    />
                  </div>
                  <span className="participant-form-separator">/</span>
                  <div className="participant-form-group-item">
                    <label>국적</label>
                    <div className="radio-group">
                      <label>
                        <input
                          type="radio"
                          name={`nationality_${participant.id}`}
                          value="내국인"
                          checked={participant.nationality === '내국인'}
                          onChange={(e) => handleParticipantChange(index, 'nationality', e.target.value)}
                        />
                        내국인
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`nationality_${participant.id}`}
                          value="외국인"
                          checked={participant.nationality === '외국인'}
                          onChange={(e) => handleParticipantChange(index, 'nationality', e.target.value)}
                        />
                        외국인
                      </label>
                    </div>
                  </div>
                </div>

                {/* 영문이름 - 해외장기체류보험인 경우에만 표시 */}
                {insuranceType === '해외장기체류보험' && (
                  <div className="participant-form-row">
                    <div className="participant-form-group-item full-width">
                      <label>영문이름</label>
                      <input
                        type="text"
                        value={participant.englishName || ''}
                        onChange={(e) => handleParticipantChange(index, 'englishName', e.target.value)}
                        placeholder="예)HONG GIL DONG"
                      />
                    </div>
                  </div>
                )}

                {/* 생년월일, 성별 */}
                <div className="participant-form-row">
                  <div className="participant-form-group-item">
                    <label>생년월일 8자리</label>
                    <input
                      type="text"
                      value={participant.birthDate}
                      onChange={(e) => handleParticipantChange(index, 'birthDate', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder={index === 0 ? "19881212" : "예)19981022"}
                      maxLength={8}
                    />
                  </div>
                  <span className="participant-form-separator">/</span>
                  <div className="participant-form-group-item">
                    <label>성별</label>
                    <div className="radio-group">
                      <label>
                        <input
                          type="radio"
                          name={`gender_${participant.id}`}
                          value="남자"
                          checked={participant.gender === '남자'}
                          onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                        />
                        남자
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`gender_${participant.id}`}
                          value="여자"
                          checked={participant.gender === '여자'}
                          onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                        />
                        여자
                      </label>
                    </div>
                  </div>
                </div>

                {/* 이메일 주소 - 가입자 1(대표)만 */}
                {index === 0 && (
                  <div className="participant-form-row">
                    <div className="participant-form-group-item full-width">
                      <label>이메일 주소</label>
                      <div className="email-inputs">
                        <input
                          type="text"
                          value={participant.email1}
                          onChange={(e) => handleParticipantChange(index, 'email1', e.target.value)}
                          placeholder="아이디"
                        />
                        <span>@</span>
                        {participant.email2 === '직접입력' ? (
                          <input
                            type="text"
                            value={participant.customEmail || ''}
                            onChange={(e) => handleParticipantChange(index, 'customEmail', e.target.value)}
                            placeholder="도메인 직접입력"
                          />
                        ) : (
                          <select
                            value={participant.email2}
                            onChange={(e) => {
                              handleParticipantChange(index, 'email2', e.target.value);
                              if (e.target.value !== '직접입력') {
                                handleParticipantChange(index, 'customEmail', '');
                              }
                            }}
                          >
                            <option value="">선택</option>
                            <option value="gmail.com">gmail.com</option>
                            <option value="naver.com">naver.com</option>
                            <option value="daum.net">daum.net</option>
                            <option value="nate.com">nate.com</option>
                            <option value="hotmail.com">hotmail.com</option>
                            <option value="직접입력">직접입력</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 휴대폰 번호 - 가입자 1(대표)만 */}
                {index === 0 && (
                  <div className="participant-form-row">
                    <div className="participant-form-group-item full-width">
                      <label>휴대폰 번호</label>
                      <div className="phone-inputs">
                        <input
                          type="text"
                          value={participant.phone}
                          onChange={(e) => handleParticipantChange(index, 'phone', e.target.value.replace(/\D/g, ''))}
                          placeholder="숫자만 입력해주세요."
                        />
                        <button
                          type="button"
                          className="verify-btn"
                          onClick={() => handleSendVerification(participant.phone)}
                        >
                          인증받기
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 인증번호 입력 필드 */}
                {index === 0 && verificationSent && !participant.isVerified && (
                  <div className="participant-form-row">
                    <div className="participant-form-group-item full-width">
                      <label>인증번호</label>
                      <div className="verification-inputs">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6자리 입력"
                          maxLength={6}
                        />
                        {remainingTime > 0 && (
                          <span className="verification-timer">
                            {Math.floor(remainingTime / 60).toString().padStart(2, '0')}:
                            {(remainingTime % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                        <button
                          type="button"
                          className="verify-confirm-btn"
                          onClick={() => handleVerifyCode(participant.phone, verificationCode)}
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 액션 버튼들 - 2인 이상 가입일 때만 표시 */}
          {participantCount === 2 && (
            <div className="participant-form-actions">
              <button
                type="button"
                className="add-participant-btn"
                onClick={handleAddParticipant}
              >
                + 인원추가
              </button>
              <button
                type="button"
                className="excel-upload-btn"
                onClick={onExcelUpload}
              >
                <img 
                  src="/images/excel-icon.png" 
                  alt="엑셀 아이콘" 
                  className="excel-icon"
                />
                엑셀로 등록하기
              </button>
            </div>
          )}

          <button
            type="button"
            className={`calculate-final-btn ${calculatedPremiums ? 'calculated' : ''}`}
            onClick={onCalculate}
            disabled={isCalculating || !!calculatedPremiums}
            style={{ marginTop: participantCount === 1 ? '12px' : '24px' }}
          >
            {isCalculating ? '계산 중...' : '보험료 계산하기'}
          </button>

          {/* 보험료 계산 결과 */}
          {calculatedPremiums && (
            <div ref={premiumSummaryRef} className="premium-summary">
              <div className="premium-detail-section">
                <span className="premium-participant-count">가입자 {calculatedPremiums.participants.length}명</span>
                <button
                  className="premium-detail-link"
                  onClick={() => {
                    const data = {
                      participants: calculatedPremiums.participants,
                      totalPremium: calculatedPremiums.totalPremium,
                      hasMedicalExpense: hasMedicalExpense,
                    };
                    localStorage.setItem('premiumDetailData', JSON.stringify(data));
                    const width = 650;
                    const height = 700;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    window.open(
                      '/premium-detail',
                      'premiumDetail',
                      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
                    );
                  }}
                >
                  자세히보기
                </button>
              </div>
              <div className="premium-total">
                합계보험료 <span className="premium-amount">{calculatedPremiums.totalPremium.toLocaleString()}원</span>
              </div>
            </div>
          )}

          {/* 신청하기 버튼 */}
          {calculatedPremiums && (
            <button
              type="button"
              className="apply-btn"
              onClick={onApply}
            >
              신청하기
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

