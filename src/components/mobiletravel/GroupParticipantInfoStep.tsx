'use client';

import React, { useState, useEffect } from 'react';
import MobileStepIndicator from './StepIndicator';
import { sendVerificationCode, verifyCode } from '@/services/smsService';

export interface GroupInfo {
  businessNumber1: string; // 사업자번호 첫 번째 부분 (3자리)
  businessNumber2: string; // 사업자번호 두 번째 부분 (2자리)
  businessNumber3: string; // 사업자번호 세 번째 부분 (5자리)
  groupName: string; // 단체명
  contactPerson: string; // 담당자명
  email1: string; // 이메일 아이디
  email2: string; // 이메일 도메인
  customEmail: string; // 직접입력 도메인
  phone: string; // 휴대폰 번호
  isVerified: boolean; // 인증 완료 여부
}

interface GroupParticipantInfoStepProps {
  insuranceType: string;
  onApply: (groupInfo: GroupInfo) => void;
}

export default function GroupParticipantInfoStep({
  insuranceType,
  onApply,
}: GroupParticipantInfoStepProps) {
  // "단체여행자보험 - " 부분 제거
  const displayInsuranceType = insuranceType.replace(/^단체여행자보험\s*-\s*/, '');
  const [groupInfo, setGroupInfo] = useState<GroupInfo>({
    businessNumber1: '',
    businessNumber2: '',
    businessNumber3: '',
    groupName: '',
    contactPerson: '',
    email1: '',
    email2: '',
    customEmail: '',
    phone: '',
    isVerified: false,
  });

  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);

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

  // 사업자번호 각 부분 핸들러
  const handleBusinessNumber1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
    setGroupInfo({ ...groupInfo, businessNumber1: value });
    // 3자리 입력되면 다음 필드로 포커스 이동
    if (value.length === 3) {
      const nextInput = document.getElementById('group_business_number_2');
      nextInput?.focus();
    }
  };

  const handleBusinessNumber2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setGroupInfo({ ...groupInfo, businessNumber2: value });
    // 2자리 입력되면 다음 필드로 포커스 이동
    if (value.length === 2) {
      const nextInput = document.getElementById('group_business_number_3');
      nextInput?.focus();
    }
  };

  const handleBusinessNumber3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
    setGroupInfo({ ...groupInfo, businessNumber3: value });
  };

  const handleSendVerification = async () => {
    if (!groupInfo.phone) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }

    try {
      const result = await sendVerificationCode(groupInfo.phone, false);
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

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('인증번호 6자리를 입력해주세요.');
      return;
    }

    try {
      const result = await verifyCode(groupInfo.phone, verificationCode);
      if (result.success) {
        setGroupInfo({ ...groupInfo, isVerified: true });
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

  const handleApply = () => {
    // 필수 필드 검증
    const businessNumber = groupInfo.businessNumber1 + groupInfo.businessNumber2 + groupInfo.businessNumber3;
    if (businessNumber.length !== 10) {
      alert('사업자번호를 올바르게 입력해주세요.');
      return;
    }
    if (!groupInfo.groupName) {
      alert('단체명을 입력해주세요.');
      return;
    }
    if (!groupInfo.contactPerson) {
      alert('담당자명을 입력해주세요.');
      return;
    }
    if (!groupInfo.email1 || !groupInfo.email2) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }
    if (!groupInfo.phone) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }
    if (!groupInfo.isVerified) {
      alert('휴대폰 인증을 완료해주세요.');
      return;
    }

    // 그룹 정보와 함께 다음 단계로 이동
    onApply(groupInfo);
  };

  return (
    <div className="prow_01">
      <div className="tour2023_BWrap tourG_mat13 tourG_mab05">
        <p className="tour2023_title01" style={{ margin: 0, minWidth: 0 }}>
          <span style={{ fontSize: '18px' }}>사업자 및 법인정보</span>
          {/* <br />
          <span className="tour2023_title09">{displayInsuranceType}</span> */}
        </p>
        <div style={{ flexShrink: 0, marginLeft: '12px' }}>
          <MobileStepIndicator currentStep={2} />
        </div>
      </div>

      <div className="tourGuard_Info">
        {/* 사업자번호 */}
        <div className="tourGuard_form_tt mag5 tourG_mab03">
          <label>사업자번호</label>
          <div className="business-number-inputs" style={{ display: 'flex', alignItems: 'stretch', gap: '8px', width: '100%' }}>
            <input
              type="text"
              id="group_business_number_1"
              name="group_business_number_1"
              className="tourGuard_input_w01"
              value={groupInfo.businessNumber1}
              onChange={handleBusinessNumber1Change}
              placeholder="000"
              maxLength={3}
              style={{ flex: '1', minWidth: '60px', textAlign: 'center' }}
            />
            <span style={{ fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 2px', marginTop: '23px' }}>-</span>
            <input
              type="text"
              id="group_business_number_2"
              name="group_business_number_2"
              className="tourGuard_input_w01"
              value={groupInfo.businessNumber2}
              onChange={handleBusinessNumber2Change}
              placeholder="00"
              maxLength={2}
              style={{ flex: '0.7', minWidth: '40px', textAlign: 'center' }}
            />
            <span style={{ fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 2px', marginTop: '23px' }}>-</span>
            <input
              type="text"
              id="group_business_number_3"
              name="group_business_number_3"
              className="tourGuard_input_w01"
              value={groupInfo.businessNumber3}
              onChange={handleBusinessNumber3Change}
              placeholder="00000"
              maxLength={5}
              style={{ flex: '1.5', minWidth: '80px', textAlign: 'center' }}
            />
          </div>
        </div>

        {/* 단체명 */}
        <div className="tourGuard_form_tt mag5 tourG_mab03">
          <label>단체명</label>
          <input
            type="text"
            id="group_name"
            name="group_name"
            className="tourGuard_input_w01"
            value={groupInfo.groupName}
            onChange={(e) => setGroupInfo({ ...groupInfo, groupName: e.target.value })}
            placeholder="단체명"
            style={{ width: '100%' }}
          />
        </div>

        {/* 담당자명 */}
        <div className="tourGuard_form_tt mag5 tourG_mab03">
          <label>담당자명</label>
          <input
            type="text"
            id="group_contact_person"
            name="group_contact_person"
            className="tourGuard_input_w01"
            value={groupInfo.contactPerson}
            onChange={(e) => setGroupInfo({ ...groupInfo, contactPerson: e.target.value })}
            placeholder="담당자명"
            style={{ width: '100%' }}
          />
        </div>

        {/* 이메일 주소 */}
        <div className="participant-form-row mag5 tourG_mab03">
          <div className="participant-form-group-item full-width">
            <label>이메일 주소</label>
            <div className="email-inputs">
              <input
                type="text"
                id="group_email1"
                name="group_email1"
                value={groupInfo.email1}
                onChange={(e) => setGroupInfo({ ...groupInfo, email1: e.target.value })}
                placeholder="아이디"
              />
              <span>@</span>
              {groupInfo.email2 === '직접입력' ? (
                <input
                  type="text"
                  id="group_custom_email"
                  name="group_custom_email"
                  value={groupInfo.customEmail}
                  onChange={(e => setGroupInfo({ ...groupInfo, customEmail: e.target.value }))}
                  placeholder="도메인 직접입력"
                />
              ) : (
                <select
                  id="group_email2"
                  name="group_email2"
                  value={groupInfo.email2}
                  onChange={(e) => {
                    setGroupInfo({ 
                      ...groupInfo, 
                      email2: e.target.value,
                      customEmail: e.target.value !== '직접입력' ? '' : groupInfo.customEmail
                    });
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

        {/* 휴대폰 번호 */}
        <div className="participant-form-row mag5 tourG_mab03">
          <div className="participant-form-group-item full-width">
            <label>휴대폰 번호</label>
            <div className="phone-inputs">
              <input
                type="text"
                id="group_phone"
                name="group_phone"
                value={groupInfo.phone}
                onChange={(e) => setGroupInfo({ ...groupInfo, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="숫자만 입력해주세요."
              />
              <button
                type="button"
                className="verify-btn"
                onClick={handleSendVerification}
              >
                인증받기
              </button>
            </div>
          </div>
        </div>

        {/* 인증번호 입력 필드 */}
        {verificationSent && !groupInfo.isVerified && (
          <div className="participant-form-row mag5 tourG_mab03">
            <div className="participant-form-group-item full-width">
              <label>인증번호</label>
              <div className="verification-inputs">
                <input
                  type="text"
                  id="group_verification_code"
                  name="group_verification_code"
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
                  onClick={handleVerifyCode}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 신청하기 버튼 */}
        <div className="tourG_mat04 tourG_mab02" style={{ marginTop: '30px' }}>
          <a
            href="javascript:void(0);"
            onClick={(e) => {
              e.preventDefault();
              handleApply();
            }}
            className="tourGuard_btn_b tour2023_btn01"
          >
            신청하기
          </a>
        </div>
      </div>
    </div>
  );
}

