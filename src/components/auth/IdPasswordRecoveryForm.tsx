'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendVerificationCode, verifyCode } from '@/services/smsService';
import { confirmResetPassword, findMemberId, verifyResetPassword } from '@/services/authService';
import './IdPasswordRecoveryForm.css';

type RecoveryMode = 'ID' | 'PASSWORD';
type DeviceType = 'pc' | 'm';
type MemberType = 'I' | 'C';
type Gender = '1' | '2';

const TIMER_SECONDS = 180;

interface IdPasswordRecoveryFormProps {
  mode: RecoveryMode;
  device: DeviceType;
}

export default function IdPasswordRecoveryForm({
  mode,
  device,
}: IdPasswordRecoveryFormProps) {
  const router = useRouter();
  const [view, setView] = useState<'form' | 'id-result' | 'password-change'>('form');
  const [memberType, setMemberType] = useState<MemberType>('I');
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('1');
  const [resno1, setResno1] = useState('');
  const [resno2, setResno2] = useState('');
  const [resno3, setResno3] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signNo, setSignNo] = useState('');
  const [foundUsername, setFoundUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [hasSentCode, setHasSentCode] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const resno2Ref = useRef<HTMLInputElement>(null);
  const resno3Ref = useRef<HTMLInputElement>(null);
  const ctelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  useEffect(() => {
    setSignNo('');
    setHasSentCode(false);
    setIsVerified(false);
    setTimerSeconds(0);
    setView('form');
    setFoundUsername('');
    setNewPassword('');
    setNewPasswordConfirm('');
  }, [memberType, mode]);

  const timerText = useMemo(() => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timerSeconds]);

  const handleClose = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (window.opener) {
      window.close();
      return;
    }
    router.push('/login');
  };

  const handleSwitchMode = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (mode === 'ID') {
      router.push('/reset-password');
    } else {
      router.push('/find-id');
    }
  };

  const normalizeNumberInput = (value: string, maxLength: number) =>
    value.replace(/\D/g, '').slice(0, maxLength);

  const validateInputs = () => {
    if (mode === 'PASSWORD' && !memberId.trim()) {
      alert('아이디를 입력해 주세요.');
      return false;
    }
    if (!name.trim()) {
      alert(`${memberType === 'C' ? '회사명' : '이름'}을 입력해 주세요.`);
      return false;
    }
    if (memberType === 'I') {
      if (birthDate.length !== 8) {
        alert('생년월일을 8자리로 입력해 주세요.');
        return false;
      }
      if (!gender) {
        alert('성별을 선택해 주세요.');
        return false;
      }
    } else {
      if (resno1.length !== 3 || resno2.length !== 2 || resno3.length !== 5) {
        alert('사업자번호를 정확히 입력해 주세요.');
        return false;
      }
    }
    if (phoneNumber.length < 10 || phoneNumber.length > 11) {
      alert('휴대폰 번호를 정확히 입력해 주세요.');
      return false;
    }
    return true;
  };

  const handleSendCode = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!validateInputs()) return;
    if (hasSentCode && timerSeconds > 0) {
      alert('이미 인증번호가 발송되었습니다.');
      return;
    }
    setIsSubmitting(true);
    sendVerificationCode(phoneNumber)
      .then((result) => {
        if (!result.success) {
          alert(result.message);
          return;
        }
        setHasSentCode(true);
        setIsVerified(false);
        setTimerSeconds(TIMER_SECONDS);
        alert(result.message);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleVerifyCode = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (timerSeconds <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      setHasSentCode(false);
      setSignNo('');
      return;
    }
    if (signNo.length !== 6) {
      alert('인증번호를 확인해 주세요. 인증번호는 6자리입니다.');
      return;
    }
    setIsSubmitting(true);
    verifyCode(phoneNumber, signNo)
      .then((result) => {
        if (!result.success) {
          alert(result.message);
          return;
        }
        setIsVerified(true);
        alert(result.message);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleConfirm = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!validateInputs()) return;
    if (!isVerified) {
      alert('휴대폰 인증을 먼저해 주세요.');
      return;
    }
    if (isSubmitting) return;

    if (mode === 'ID') {
      setIsSubmitting(true);
      const result = await findMemberId({
        memberType,
        name: memberType === 'I' ? name : undefined,
        companyName: memberType === 'C' ? name : undefined,
        businessNumber: memberType === 'C' ? `${resno1}-${resno2}-${resno3}` : undefined,
        birthDate: memberType === 'I' ? birthDate : undefined,
        gender: memberType === 'I' ? gender : undefined,
        phoneNumber,
      });
      setIsSubmitting(false);

      if (!result.success || !result.username) {
        alert(result.message);
        return;
      }
      setFoundUsername(result.username);
      setView('id-result');
      return;
    }

    setIsSubmitting(true);
    const verifyResult = await verifyResetPassword({
      memberType,
      username: memberId,
      name: memberType === 'I' ? name : undefined,
      companyName: memberType === 'C' ? name : undefined,
      businessNumber: memberType === 'C' ? `${resno1}-${resno2}-${resno3}` : undefined,
      birthDate: memberType === 'I' ? birthDate : undefined,
      gender: memberType === 'I' ? gender : undefined,
      phoneNumber,
    });
    setIsSubmitting(false);
    if (!verifyResult.success) {
      alert(verifyResult.message);
      return;
    }
    setView('password-change');
  };

  const handlePasswordUpdate = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!newPassword || !newPasswordConfirm) {
      alert('비밀번호를 입력해 주세요.');
      return;
    }
    if (newPassword.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      alert('비밀번호 확인이 틀렸습니다. 다시 입력하십시오.');
      return;
    }

    setIsSubmitting(true);
    const result = await confirmResetPassword({
      memberType,
      username: memberId,
      name: memberType === 'I' ? name : undefined,
      companyName: memberType === 'C' ? name : undefined,
      businessNumber: memberType === 'C' ? `${resno1}-${resno2}-${resno3}` : undefined,
      birthDate: memberType === 'I' ? birthDate : undefined,
      gender: memberType === 'I' ? gender : undefined,
      phoneNumber,
      newPassword,
    });
    setIsSubmitting(false);

    if (!result.success) {
      alert(result.message);
      return;
    }
    alert('비밀번호가 재설정 되었습니다.');
    if (window.opener) {
      window.close();
    } else {
      router.push('/login');
    }
  };

  return (
    <div className={`idpass-page idpass-page--${device} bgcolor_white`}>
      <div id="isbwrapper">
        <header id="header">
          <div className="layer_header prow_01">
            <span className="layer_title">아이디 찾기/비밀번호 재발급</span>
            <a className="close" href="#" onClick={handleClose}>
              닫기
            </a>
          </div>
        </header>
        <div id="contentWrap">
          <section className="tourGuard_bg ag_center">
            {view === 'id-result' ? (
              <form name="resultForm">
                <div className="tourGuard_Topbg01">
                  <div className="prow_01 tourG_mat14">
                    <p className="idpass-result-text">
                      고객님의 아이디는 <span className="idpass-result-id">{foundUsername}</span> 입니다.
                    </p>
                    <div className="tourG_mat04 tourG_mab15 tourG_mab05">
                      <a href="#" className="tourGuard_btn_b tour2023_btn01" onClick={handleClose}>
                        닫기
                      </a>
                    </div>
                  </div>
                </div>
              </form>
            ) : view === 'password-change' ? (
              <form name="passwordForm">
                <div className="tourGuard_Topbg01">
                  <div className="prow_01 tourG_mat14">
                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="password1">변경할 비밀번호</label>
                      <input
                        type="password"
                        id="password1"
                        value={newPassword}
                        placeholder="변경할 비밀번호를 입력해주세요."
                        className="tourGuard_input_w02"
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                    </div>
                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label htmlFor="password2">비밀번호 확인</label>
                      <input
                        type="password"
                        id="password2"
                        value={newPasswordConfirm}
                        placeholder="비밀번호를 한 번 더 입력해주세요."
                        className="tourGuard_input_w02"
                        onChange={(event) => setNewPasswordConfirm(event.target.value)}
                      />
                    </div>
                    <div className="tourG_mat04 tourG_mab15 tourG_mab05">
                      <a href="#" className="tourGuard_btn_b tour2023_btn01" onClick={handlePasswordUpdate}>
                        확인
                      </a>
                    </div>
                    <p className="tour2023_txt24">
                      위 방법으로 확인이 안될시 02-1599-2541로 문의주시면
                      <br />
                      본인 확인 후 처리 해드리겠습니다.
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              <form name="searchForm">
                <div id="searchIdPassDiv" className="tourGuard_Topbg01">
                  <div className="prow_01">
                    <div className="tour2023_bottom_btn tourG_mat14">
                      <a
                        href="#"
                        className={`tour2023_btn_b ${
                          mode === 'ID' ? 'tour2023_ttap01_ov' : 'tour2023_ttap01'
                        }`}
                        onClick={mode === 'ID' ? undefined : handleSwitchMode}
                      >
                        아이디 찾기
                      </a>
                      <a
                        href="#"
                        className={`tour2023_btn_b ${
                          mode === 'PASSWORD' ? 'tour2023_ttap01_ov' : 'tour2023_ttap01'
                        }`}
                        onClick={mode === 'PASSWORD' ? undefined : handleSwitchMode}
                      >
                        비밀번호 재발급
                      </a>
                    </div>
                    <p className="tour2023_txt36 tourG_mat06 tourG_mab01">
                      ※ 사용자 본인확인을 위해 회원정보에 등록한 정보를 입력해 주세요.
                    </p>

                    <div className="tour2023_ra_Wrap tourG_mab04">
                      <ul className="tour2023_ra_Wrap01">
                        <li className="tour2023_rdo_area">
                          <span className="tour2023_inp_rdo001">
                            <input
                              type="radio"
                              id="one_pgood01"
                              value="I"
                              name="member_type"
                              checked={memberType === 'I'}
                              onChange={() => setMemberType('I')}
                            />
                            <label htmlFor="one_pgood01">개인</label>
                          </span>
                          <span className="tour2023_inp_rdo001">
                            <input
                              type="radio"
                              id="one_pgood02"
                              value="C"
                              name="member_type"
                              checked={memberType === 'C'}
                              onChange={() => setMemberType('C')}
                            />
                            <label htmlFor="one_pgood02">법인단체</label>
                          </span>
                        </li>
                      </ul>
                    </div>

                    {mode === 'PASSWORD' && (
                      <div className="tourGuard_form_tt mag5 tourG_mab03">
                        <label htmlFor="member_id">아이디</label>
                        <input
                          type="text"
                          id="member_id"
                          value={memberId}
                          placeholder="아이디 입력"
                          className="tourGuard_input_w02"
                          onChange={(event) => setMemberId(event.target.value)}
                        />
                      </div>
                    )}

                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label id="title_name" htmlFor="name">
                        {memberType === 'C' ? '회사명' : '이름'}
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        placeholder={memberType === 'C' ? '회사명 입력' : '이름 입력'}
                        className="tourGuard_input_w02"
                        onChange={(event) => setName(event.target.value)}
                      />
                    </div>

                    {memberType === 'I' ? (
                      <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line">
                        <label htmlFor="birth_date">생년월일</label>
                        <input
                          type="tel"
                          name="birth_date"
                          id="birth_date"
                          maxLength={8}
                          value={birthDate}
                          placeholder="예)19990515"
                          className="tourGuard_input_w01"
                          onChange={(event) =>
                            setBirthDate(normalizeNumberInput(event.target.value, 8))
                          }
                        />
                        <div className="tourG_rdo_area">
                          <label htmlFor="rad_mw01">성별</label>
                          <span className="tourG_inp_rdo">
                            <input
                              type="radio"
                              id="rad_mw01"
                              value="1"
                              name="gender"
                              checked={gender === '1'}
                              onChange={() => setGender('1')}
                            />
                            <label htmlFor="rad_mw01">남자</label>
                          </span>
                          <span className="tourG_inp_rdo">
                            <input
                              type="radio"
                              id="rad_mw02"
                              value="2"
                              name="gender"
                              checked={gender === '2'}
                              onChange={() => setGender('2')}
                            />
                            <label htmlFor="rad_mw02" className="one_line0">
                              여자
                            </label>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="tourGuard_form_tt mag5 tourG_mab03 idpass-business-number">
                        <label htmlFor="resno1">사업자번호</label>
                        <div className="idpass-business-number-row">
                          <input
                            type="tel"
                            id="resno1"
                            name="resno1"
                            maxLength={3}
                            value={resno1}
                            onChange={(event) => {
                              const v = normalizeNumberInput(event.target.value, 3);
                              setResno1(v);
                              if (v.length === 3) resno2Ref.current?.focus();
                            }}
                          />
                          <span className="idpass-business-number-sep" aria-hidden />
                          <input
                            ref={resno2Ref}
                            type="tel"
                            id="resno2"
                            name="resno2"
                            maxLength={2}
                            value={resno2}
                            onChange={(event) => {
                              const v = normalizeNumberInput(event.target.value, 2);
                              setResno2(v);
                              if (v.length === 2) resno3Ref.current?.focus();
                            }}
                          />
                          <span className="idpass-business-number-sep" aria-hidden />
                          <input
                            ref={resno3Ref}
                            type="tel"
                            id="resno3"
                            name="resno3"
                            maxLength={5}
                            value={resno3}
                            onChange={(event) => {
                              const v = normalizeNumberInput(event.target.value, 5);
                              setResno3(v);
                              if (v.length === 5) ctelRef.current?.focus();
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="tourGuard_form_tt mag5 tourG_mab03">
                      <label id="ctel_label" htmlFor="ctel_no">
                        {memberType === 'C' ? '담당자 휴대폰 번호' : '휴대폰 번호'}
                      </label>
                      <input
                        ref={ctelRef}
                        type="tel"
                        id="ctel_no"
                        name="ctel_no"
                        maxLength={11}
                        value={phoneNumber}
                        placeholder="숫자만 입력해주세요."
                        className="tourGuard_input_w02"
                        onChange={(event) =>
                          setPhoneNumber(normalizeNumberInput(event.target.value, 11))
                        }
                        readOnly={hasSentCode && timerSeconds > 0}
                      />
                      <div className="tour2023_event_file">
                        <a href="#" className="tour2023_btn_b01 tour2023_btn11" onClick={handleSendCode}>
                          인증받기
                        </a>
                      </div>
                    </div>

                    {hasSentCode && (
                      <div className="tourGuard_form_tt mag5 tourG_mab03">
                        <label htmlFor="signNo">인증번호</label>
                        <input
                          type="tel"
                          id="signNo"
                          name="signNo"
                          maxLength={6}
                          value={signNo}
                          placeholder="6자리 입력"
                          className="tourGuard_input_w02"
                          onChange={(event) =>
                            setSignNo(normalizeNumberInput(event.target.value, 6))
                          }
                        />
                        <div className="tour2023_timer01">
                          <span className="tour2023_timeLimit">{timerText}</span>
                        </div>
                        <div className="tour2023_event_file01">
                          <a href="#" className="tour2023_btn_b01 tour2023_btn18" onClick={handleVerifyCode}>
                            확인
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="tourG_mat04 tourG_mab15 tourG_mab05">
                      <a href="#" className="tourGuard_btn_b tour2023_btn01" onClick={handleConfirm}>
                        확인
                      </a>
                    </div>
                    <p className="tour2023_txt24">
                      위 방법으로 확인이 안될시 02-1599-2541로 문의주시면
                      <br />
                      본인 확인 후 처리 해드리겠습니다.
                    </p>
                  </div>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
