'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../../m/page.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Contract {
  id: number;
  contract_number: string;
  insurance_type: string;
  departure_date: string;
  arrival_date: string;
  total_premium: number;
  created_at: string;
  participant_count: number;
}

interface Companion {
  name: string;
  resident_number: string;
  gender: string;
  has_illness_history: number;
  has_medical_expense: number;
  plan_type: string;
  premium: number;
  sequence_number: number;
}

export default function LoadHistoryPage() {
  const router = useRouter();
  const [businessNumber1, setBusinessNumber1] = useState('');
  const [businessNumber2, setBusinessNumber2] = useState('');
  const [businessNumber3, setBusinessNumber3] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationArea, setShowVerificationArea] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [timer, setTimer] = useState(180); // 3분 = 180초
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timer]);

  // opener 확인 제거 (팝업창으로 열리지 않아도 사용 가능하도록)
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && !window.opener) {
  //     alert('비정상적인 접근입니다.\n잠시후 다시 시도해주세요.');
  //     window.close();
  //   }
  // }, []);

  const formatTimer = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleSendVerification = async () => {
    // 입력 검증
    if (businessNumber1.length !== 3 || businessNumber2.length !== 2 || businessNumber3.length !== 5) {
      alert('사업자번호를 정확히 입력해 주세요');
      return;
    }
    if (!companyName.trim()) {
      alert('단체(사업자/법인)명을 입력해 주세요');
      return;
    }
    if (!mobilePhone || mobilePhone.length < 10 || mobilePhone.length > 11) {
      alert('휴대폰 번호를 정확히 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      // 계약 확인
      const checkResponse = await fetch(`${API_BASE_URL}/api/travel/group/check-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_number: `${businessNumber1}-${businessNumber2}-${businessNumber3}`,
          company_name: companyName,
          mobile_phone: mobilePhone,
        }),
      });

      const checkData = await checkResponse.json();
      if (!checkData.success) {
        alert(checkData.message || '일치하는 가입정보가 없습니다.');
        return;
      }

      // 인증번호 발송
      const sendResponse = await fetch(`${API_BASE_URL}/api/travel/group/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_number: `${businessNumber1}-${businessNumber2}-${businessNumber3}`,
          company_name: companyName,
          mobile_phone: mobilePhone,
        }),
      });

      const sendData = await sendResponse.json();
      if (sendData.success) {
        alert('인증번호가 발송되었습니다.');
        setShowVerificationArea(true);
        setTimer(180);
        setTimerActive(true);
      } else {
        alert(sendData.message || '인증번호 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Send verification error:', error);
      alert('인증번호 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }

    if (timer <= 0) {
      alert('인증번호 유효시간이 만료되었습니다.\n인증번호를 다시 받아주세요.');
      setShowVerificationArea(false);
      setTimer(180);
      setTimerActive(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/travel/group/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_phone: mobilePhone,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('인증이 완료되었습니다.');
        setIsVerified(true);
        setShowVerificationArea(false);
        setTimerActive(false);
        // 계약 목록 조회
        await loadContractList();
      } else {
        alert(data.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      alert('인증번호 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadContractList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/travel/group/contract-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_number: `${businessNumber1}-${businessNumber2}-${businessNumber3}`,
          company_name: companyName,
          mobile_phone: mobilePhone,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Load contract list error:', error);
    }
  };

  const handleSelectContract = (contractId: number) => {
    // 이미 선택된 계약을 다시 클릭하면 해제
    if (selectedContractId === contractId) {
      setSelectedContractId(null);
    } else {
      setSelectedContractId(contractId);
    }
  };

  const handleLoadData = async () => {
    if (!selectedContractId) {
      alert('불러올 계약건을 선택해주세요.');
      return;
    }

    if (!window.opener) {
      alert('부모 창을 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/travel/group/contract/${selectedContractId}/companions`);
      const data = await response.json();

      if (data.success && data.companions) {
        // 부모 창으로 데이터 전달
        const companions = data.companions.map((c: Companion) => {
          let birthDate = '';
          let gender: 'M' | 'W' = 'M';
          
          // resident_number가 있는 경우 파싱
          if (c.resident_number) {
            // resident_number 형식: YYMMDD + 뒷자리첫번째숫자 (예: 8507301)
            // 또는 YYMMDD + 뒷자리첫번째숫자 + 기타 (예: 85073010)
            const residentNumber = c.resident_number.replace(/[^0-9]/g, ''); // 숫자만 추출
            const length = residentNumber.length;
            
            if (length >= 7) {
              // 앞 6자리는 생년월일 (YYMMDD)
              const yymmdd = residentNumber.substring(0, 6);
              // 7번째 자리는 성별 (1=남자, 2=여자, 3=남자2000년대, 4=여자2000년대)
              const genderDigit = parseInt(residentNumber.substring(6, 7), 10);
              
              // YYMMDD를 YYYYMMDD로 변환
              const yy = parseInt(yymmdd.substring(0, 2), 10);
              const mm = yymmdd.substring(2, 4);
              const dd = yymmdd.substring(4, 6);
              
              // 성별에 따라 연도 결정 (1,2는 1900년대, 3,4는 2000년대)
              const yyyy = (genderDigit === 3 || genderDigit === 4) ? `20${yy.toString().padStart(2, '0')}` : `19${yy.toString().padStart(2, '0')}`;
              birthDate = `${yyyy}${mm}${dd}`;
              
              // 성별 결정 (1,3=남자, 2,4=여자)
              if (genderDigit === 1 || genderDigit === 3) {
                gender = 'M';
              } else if (genderDigit === 2 || genderDigit === 4) {
                gender = 'W';
              }
            }
          }
          
          // gender 필드가 있으면 우선 사용
          if (c.gender) {
            gender = c.gender === '남자' ? 'M' : 'W';
          }
          
          return {
            name: c.name,
            countryType: 'D' as const,
            engName: '',
            birthDate: birthDate,
            gender: gender,
            ssn1: c.resident_number ? c.resident_number.substring(0, 6) : '',
            ssn2: c.resident_number && c.resident_number.length >= 7 ? c.resident_number.substring(6) : '',
            country: '',
            hasIllnessHistory: c.has_illness_history === 1,
            hasMedicalExpense: c.has_medical_expense === 1,
            planType: c.plan_type || '',
            premium: c.premium || 0,
          };
        });

        // 부모 창에 메시지 전송
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'LOAD_INSURED_DATA',
            insuredData: companions,
            participantCount: companions.length,
          }, window.location.origin);
          window.close();
        } else {
          // opener가 없는 경우 localStorage에 저장하고 부모 창에 알림
          try {
            localStorage.setItem('loadHistoryData', JSON.stringify({
              type: 'LOAD_INSURED_DATA',
              insuredData: companions,
              participantCount: companions.length,
            }));
            alert('데이터가 저장되었습니다. 부모 창에서 새로고침해주세요.');
            window.close();
          } catch (error) {
            console.error('데이터 저장 실패:', error);
            alert('데이터를 불러왔지만 부모 창을 찾을 수 없습니다.\n데이터를 복사하여 수동으로 입력해주세요.');
          }
        }
      } else {
        alert('동반자 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Load companions error:', error);
      alert('동반자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bgcolor_white" style={{ minHeight: '100vh' }}>
      <div id="isbwrapper">
        {/* 레이어 헤더 */}
        <header id="header">
          <div className="layer_header prow_01">
            <span className="layer_title" style={{ display: 'block' }}>가입 이력 불러오기</span>
            <a href="javascript:window.close();" className="close">나가기</a>
          </div>
        </header>

        {/* 본문 */}
        <div id="contentWrap">
          <section className="tourGuard_bg ag_center prow_01">
            <div className="tourGuard_Topbg01">
              <form name="inputForm" method="POST">
                {/* 사업자 및 법인정보 */}
                <div className="tourG_mat14">
                  <p className="tour2023_title02">사업자 및 법인정보</p>
                  <div>
                    <section className="tourGuard_Info">
                      {/* 사업자번호 */}
                      <div className="tourGuard_form_tt mag5 tourG_mab03 tourG_line03">
                        <label htmlFor="resno1">사업자번호</label>
                        <div className="business-number-inputs" style={{ display: 'flex', alignItems: 'stretch', gap: '8px', width: '100%', marginTop: '5px' }}>
                          <input
                            type="tel"
                            name="resno1"
                            id="resno1"
                            value={businessNumber1}
                            onChange={(e) => setBusinessNumber1(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength={3}
                            className="tourGuard_input_w01"
                            disabled={isVerified}
                            placeholder="000"
                            style={{ flex: '1', minWidth: '60px', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 2px' }}>-</span>
                          <input
                            type="tel"
                            name="resno2"
                            id="resno2"
                            value={businessNumber2}
                            onChange={(e) => setBusinessNumber2(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            maxLength={2}
                            className="tourGuard_input_w01"
                            disabled={isVerified}
                            placeholder="00"
                            style={{ flex: '0.7', minWidth: '40px', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '18px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 2px' }}>-</span>
                          <input
                            type="tel"
                            name="resno3"
                            id="resno3"
                            value={businessNumber3}
                            onChange={(e) => setBusinessNumber3(e.target.value.replace(/\D/g, '').slice(0, 5))}
                            maxLength={5}
                            className="tourGuard_input_w01"
                            disabled={isVerified}
                            placeholder="00000"
                            style={{ flex: '1.5', minWidth: '80px', textAlign: 'center' }}
                          />
                        </div>
                      </div>
                      {/* 법인(단체)명 */}
                      <div className="tourGuard_form_tt mag5 tourG_mab03">
                        <label htmlFor="contract_company">단체명</label>
                        <input
                          type="text"
                          name="contract_company"
                          id="contract_company"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          maxLength={30}
                          placeholder="단체(사업자/법인)명"
                          className="tourGuard_input_w02"
                          disabled={isVerified}
                        />
                      </div>
                      {/* 담당자 휴대폰번호 */}
                      <div className="tourGuard_form_tt mag5 tourG_mab03">
                        <label htmlFor="ctel_no">담당자 휴대폰번호</label>
                        <input
                          type="tel"
                          name="ctel_no"
                          id="ctel_no"
                          value={mobilePhone}
                          onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          maxLength={11}
                          placeholder="숫자만 입력해주세요."
                          className="tourGuard_input_w02"
                          disabled={isVerified}
                        />
                        {!isVerified && (
                          <div id="signBtn" className="tour2023_event_file">
                            <a
                              href="javascript:void(0);"
                              onClick={handleSendVerification}
                              className="tour2023_btn_b01 tour2023_btn11"
                            >
                              인증받기
                            </a>
                          </div>
                        )}
                      </div>
                      {/* 인증번호 */}
                      {showVerificationArea && (
                        <div id="signArea" className="tourGuard_form_tt mag5 tourG_mab03">
                          <label htmlFor="signNo">인증번호</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                            <input
                              type="tel"
                              name="signNo"
                              id="signNo"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              placeholder="6자리 입력"
                              className="tourGuard_input_w02"
                              style={{ flex: '1', marginTop: '0' }}
                            />
                            <div className="tour2023_timer" style={{ padding: '0', flexShrink: 0 }}>
                              <span id="compare_time" className="tour2023_timeLimit" style={{ fontSize: '14px', color: '#ff4040', fontWeight: '600' }}>
                                {formatTimer(timer)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 확인 버튼 */}
                      {showVerificationArea && !isVerified && (
                        <div id="checkBtn" className="tourG_mat04 tourG_mab02">
                          <a
                            href="javascript:void(0);"
                            onClick={handleVerifyCode}
                            className="tourGuard_btn_b tour2023_btn01"
                          >
                            확인
                          </a>
                        </div>
                      )}
                    </section>
                  </div>

                  {/* 하단 텍스트 */}
                  {!isVerified && (
                    <div id="bot_notice" className="tour2023_txt01 tour2023_grey tourG_mleft04 tourG_mab04 tourG_mat06">
                      <ul className="tourGuard_inline">
                        <li className="tourGuard_inline_t01">※</li>
                        <li className="tourGuard_inline_t02">
                          <span className="tour2023_blue">최근 가입 이력(가입 인원및 정보) 기준</span>으로 불러옵니다.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* 계약 목록 */}
          {isVerified && contracts.length > 0 && (
            <div id="contract_list" className="prow_01" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>가입 이력 목록</h3>
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  style={{
                    border: selectedContractId === contract.id ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '5px',
                    padding: '15px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedContractId === contract.id ? '#f0f8ff' : '#fff',
                  }}
                  onClick={() => handleSelectContract(contract.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedContractId === contract.id}
                    onChange={(e) => {
                      e.stopPropagation(); // 부모 div의 onClick 이벤트와 충돌 방지
                      handleSelectContract(contract.id);
                    }}
                    onClick={(e) => e.stopPropagation()} // 체크박스 클릭 시 부모 div의 onClick 방지
                    style={{ marginRight: '10px' }}
                  />
                  <strong>계약번호:</strong> {contract.contract_number} |{' '}
                  <strong>보험종류:</strong> {contract.insurance_type} |{' '}
                  <strong>가입인원:</strong> {contract.participant_count}명 |{' '}
                  <strong>출발일:</strong> {contract.departure_date} |{' '}
                  <strong>도착일:</strong> {contract.arrival_date}
                </div>
              ))}
            </div>
          )}

          {isVerified && contracts.length === 0 && (
            <div className="prow_01" style={{ padding: '20px', textAlign: 'center' }}>
              <p>가입 이력이 없습니다.</p>
            </div>
          )}
        </div>
        <div className="tourG_mat23 tourG_Wrap"></div>

        {/* 하단 고정버튼 */}
        {isVerified && contracts.length > 0 && (
          <section id="tour2023_fixedBanner">
            <div className="tour2023_bottom_btn">
              <a
                href="javascript:void(0);"
                onClick={selectedContractId ? handleLoadData : (e) => {
                  e.preventDefault();
                  alert('불러올 계약건을 선택해주세요.');
                }}
                className={`tour2023_btn_b ${selectedContractId ? 'tour2023_btn07' : 'tour2023_btn05'}`}
              >
                불러오기
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

