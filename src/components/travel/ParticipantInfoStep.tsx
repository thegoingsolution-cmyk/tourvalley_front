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
  /** 모바일 등 상단에서 이미 단계 인디케이터를 보여줄 때 true → form-header(타이틀+단계) 생략 */
  hideFormHeader?: boolean;
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
  hideFormHeader = false,
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
          {!hideFormHeader && (
            <div className="form-header">
              <h1 className="form-title"></h1>
              <StepIndicator currentStep={2} />
            </div>
          )}

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
                  가입자{index + 1}{index === 0 ? '(대표)' : ''}
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
                <section className="tourGuard_Info">
                  <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                    <label htmlFor={`insured_name_${index + 1}`}>이름</label>
                    <input
                      type="text"
                      id={`insured_name_${index + 1}`}
                      name="insured_name"
                      value={participant.name}
                      maxLength={8}
                      placeholder="이름"
                      className="tourGuard_input_w01"
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      style={{
                        height: '32px',
                        paddingLeft: '10px',
                        color: '#000',
                        fontSize: '18px',
                        letterSpacing: '0px',
                        marginTop: '23px',
                        marginLeft: '10px',
                        paddingTop: '0px',
                      }}
                    />
                    <div className="tourG_rdo_area">
                      <label htmlFor={`inp-phone2-${index}`}>국적</label>
                      <span className="tourG_inp_rdo">
                        <input
                          type="radio"
                          id={`country_type_D_${index + 1}`}
                          value="내국인"
                          name={`country_type_${index + 1}`}
                          checked={participant.nationality === '내국인'}
                          onChange={(e) => handleParticipantChange(index, 'nationality', '내국인')}
                        />
                        <label htmlFor={`country_type_D_${index + 1}`}>내국인</label>
                      </span>
                      <span className="tourG_inp_rdo">
                        <input
                          type="radio"
                          id={`country_type_F_${index + 1}`}
                          value="외국인"
                          name={`country_type_${index + 1}`}
                          checked={participant.nationality === '외국인'}
                          onChange={(e) => handleParticipantChange(index, 'nationality', '외국인')}
                        />
                        <label htmlFor={`country_type_F_${index + 1}`} className="one_line0">외국인</label>
                      </span>
                    </div>
                  </div>
                </section>

                {/* 영문이름 - 해외장기체류보험인 경우에만 표시 */}
                {insuranceType === '해외장기체류보험' && (
                  <div className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor={`english_name_${index}`}>영문이름</label>
                    <input
                      type="text"
                      id={`english_name_${index}`}
                      value={participant.englishName || ''}
                      onChange={(e) => handleParticipantChange(index, 'englishName', e.target.value)}
                      placeholder="예)HONG GIL DONG"
                      className="tourGuard_input_w01"
                      style={{
                        height: '32px',
                        paddingLeft: '10px',
                        color: '#000',
                        fontSize: '18px',
                        letterSpacing: '0px',
                        marginTop: '23px',
                        marginLeft: '10px',
                        paddingTop: '0px',
                      }}
                    />
                  </div>
                )}

                {/* 생년월일, 성별 */}
                {participant.nationality === '내국인' && (
                  <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line" id={`birth_area_${index + 1}`}>
                    <label>생년월일 8자리</label>
                    <input
                      type="tel"
                      id={`birth_${index + 1}`}
                      name="birth"
                      value={participant.birthDate}
                      maxLength={8}
                      placeholder={index === 0 ? "19881212" : "예)19981022"}
                      className="tourGuard_input_w01"
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 8) {
                          handleParticipantChange(index, 'birthDate', value);
                        }
                      }}
                      style={{
                        height: '32px',
                        paddingLeft: '10px',
                        color: '#000',
                        fontSize: '18px',
                        letterSpacing: '0px',
                        marginTop: '23px',
                        marginLeft: '10px',
                        paddingTop: '0px',
                      }}
                    />
                    <div className="tourG_rdo_area">
                      <label htmlFor={`inp-phone2-gender-${index}`}>성별</label>
                      <span className="tourG_inp_rdo">
                        <input
                          type="radio"
                          id={`gender_M_${index + 1}`}
                          value="남자"
                          name={`gender_${index + 1}`}
                          checked={participant.gender === '남자'}
                          onChange={() => handleParticipantChange(index, 'gender', '남자')}
                        />
                        <label htmlFor={`gender_M_${index + 1}`}>남자</label>
                      </span>
                      <span className="tourG_inp_rdo">
                        <input
                          type="radio"
                          id={`gender_W_${index + 1}`}
                          value="여자"
                          name={`gender_${index + 1}`}
                          checked={participant.gender === '여자'}
                          onChange={() => handleParticipantChange(index, 'gender', '여자')}
                        />
                        <label htmlFor={`gender_W_${index + 1}`} className="one_line0">여자</label>
                      </span>
                    </div>
                  </div>
                )}

                {/* 이메일 주소 - 가입자 1(대표)만 */}
                {index === 0 && (
                  <div className="tourGuard_form_tt mag5 tourG_mab03">
                    <label htmlFor={`email1_${index}`}>이메일 주소</label>
                    <input
                      type="text"
                      id={`email1_${index}`}
                      name="email1"
                      maxLength={20}
                      placeholder="아이디"
                      className="tourGuard_input_w01"
                      value={participant.email1}
                      onChange={(e) => handleParticipantChange(index, 'email1', e.target.value)}
                      style={{
                        height: '32px',
                        paddingLeft: '10px',
                        color: '#000',
                        fontSize: '18px',
                        letterSpacing: '0px',
                        marginTop: '23px',
                        marginLeft: '10px',
                        paddingTop: '0px',
                      }}
                    />
                    <div 
                      className="tourGuard_txt03"
                      style={{
                        marginTop: '23px',
                        marginLeft: '10px',
                      }}
                    >@</div>
                    <input
                      type="text"
                      id={`email2_${index}`}
                      name="email2"
                      maxLength={20}
                      className="tourGuard_input_w01"
                      value={participant.email2 === '직접입력' ? (participant.customEmail || '') : (participant.email2 || '')}
                      onChange={(e) => {
                        if (participant.email2 === '직접입력') {
                          handleParticipantChange(index, 'customEmail', e.target.value);
                        }
                      }}
                      readOnly={participant.email2 !== '직접입력' && participant.email2 !== ''}
                      style={{
                        height: '32px',
                        paddingLeft: '10px',
                        color: '#000',
                        fontSize: '18px',
                        letterSpacing: '0px',
                        marginTop: '23px',
                        marginLeft: '10px',
                        paddingTop: '0px',
                      }}
                    />
                    <div 
                      className="tourGuard_input_cell08 tourGuard_input_cell09 tourGuard"
                      style={{
                        marginTop: '23px',
                        marginLeft: '10px',
                        marginRight: '15px',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                    >
                      <span className="tourGuard_ps_box" style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '32px',
                        lineHeight: '32px',
                      }}>
                        <select
                          className="tourGuard_sel"
                          id={`select_email_${index}`}
                          name="select_email"
                          value={participant.email2 || ''}
                          onChange={(e) => {
                            const updated = [...participants];
                            updated[index] = { 
                              ...updated[index], 
                              email2: e.target.value,
                              customEmail: e.target.value !== '직접입력' ? '' : updated[index].customEmail
                            };
                            onParticipantsChange(updated);
                          }}
                          style={{
                            flex: 1,
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                          }}
                        >
                          <option value="">선택</option>
                          <option value="gmail.com">gmail.com</option>
                          <option value="naver.com">naver.com</option>
                          <option value="hanmail.net">hanmail.net</option>
                          <option value="daum.net">daum.net</option>
                          <option value="nate.com">nate.com</option>
                          <option value="hotmail.com">hotmail.com</option>
                          <option value="직접입력">직접입력</option>
                        </select>
                        <img src="/icons/icon_sel.png" alt="선택" style={{ width: 'auto', height: '7px', marginLeft: '8px', pointerEvents: 'none' }} />
                      </span>
                    </div>
                  </div>
                )}

                {/* 휴대폰 번호 - 가입자 1(대표)만 */}
                {index === 0 && (
                  <div className="tourGuard_form_tt mag5 tourG_mab03" style={{ paddingRight: '20px', position: 'relative' }}>
                    <label htmlFor={`phone_${index}`}>휴대폰 번호</label>
                    <input
                      type="text"
                      id={`phone_${index}`}
                      value={participant.phone}
                      onChange={(e) => handleParticipantChange(index, 'phone', e.target.value.replace(/\D/g, ''))}
                      placeholder="숫자만 입력해주세요."
                      className="tourGuard_input_w01"
                      style={{
                        width: '70%',
                        height: '32px',
                        paddingLeft: '10px',
                        color: '#000',
                        fontSize: '18px',
                        letterSpacing: '0px',
                        marginTop: '23px',
                        marginLeft: '10px',
                        paddingTop: '0px',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      right: '20px',
                      marginTop: '11.5px',
                    }}>
                      <button
                        type="button"
                        className="verify-btn"
                        onClick={() => handleSendVerification(participant.phone)}
                        style={{
                          padding: '0',
                          backgroundColor: '#eef0fc',
                          color: '#4d60d6',
                          border: '1px solid #4d60d6',
                          borderRadius: '5px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          width: '93px',
                          height: '37px',
                          lineHeight: '37px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                        }}
                      >
                        인증받기
                      </button>
                    </div>
                  </div>
                )}

                {/* 인증번호 입력 필드 */}
                {index === 0 && verificationSent && !participant.isVerified && (
                  <div className="tourGuard_form_tt mag5 tourG_mab03" style={{ paddingRight: '20px', position: 'relative' }}>
                    <label htmlFor={`verification_code_${index}`}>인증번호</label>
                    <input
                      type="text"
                      id={`verification_code_${index}`}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6자리 입력"
                      maxLength={6}
                      className="tourGuard_input_w01"
                      style={{
                        height: '32px',
                        paddingLeft: '10px',
                        color: '#000',
                        fontSize: '18px',
                        letterSpacing: '0px',
                        marginTop: '23px',
                        marginLeft: '10px',
                        paddingTop: '0px',
                      }}
                    />
                    {remainingTime > 0 && (
                      <span className="verification-timer" style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f15a24',
                        marginLeft: '8px',
                        marginTop: '23px',
                        marginRight: '100px',
                        verticalAlign: 'middle',
                        display: 'inline-block',
                        lineHeight: '32px',
                        position: 'relative',
                        zIndex: 1,
                      }}>
                        {Math.floor(remainingTime / 60).toString().padStart(2, '0')}:
                        {(remainingTime % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                    <div style={{
                      position: 'absolute',
                      right: '20px',
                      marginTop: '11.5px',
                    }}>
                      <button
                        type="button"
                        className="verify-confirm-btn"
                        onClick={() => handleVerifyCode(participant.phone, verificationCode)}
                        style={{
                          padding: '0',
                          backgroundColor: '#2c3fb3',
                          color: '#fff',
                          border: '1px solid #2c3fb3',
                          borderRadius: '5px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          width: '93px',
                          height: '37px',
                          lineHeight: '37px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                        }}
                      >
                        확인
                      </button>
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
            style={{ marginTop: participantCount === 1 ? '0px' : '24px' }}
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

