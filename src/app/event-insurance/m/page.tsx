'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

export default function MobileEventInsurancePage() {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];

  // 현재 시간 + 2시간 계산 (00~23시 형식)
  const getDefaultHour = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 2) % 24; // 24시 넘으면 0시로
    return String(nextHour).padStart(2, '0');
  };

  // 행사주최자 정보
  const [contractorName, setContractorName] = useState('');
  const [resno1, setResno1] = useState('');
  const [resno2, setResno2] = useState('');
  const [resno3, setResno3] = useState('');
  const [incharge, setIncharge] = useState('');
  const [ctelNo, setCtelNo] = useState('');
  const [telNo, setTelNo] = useState('');
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');

  // 행사내용
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState(formattedDate);
  const [startHour, setStartHour] = useState(getDefaultHour());
  const [endDate, setEndDate] = useState(formattedDate);
  const [endHour, setEndHour] = useState(getDefaultHour());
  const [insuredCnt, setInsuredCnt] = useState('');
  const [actionInfo1, setActionInfo1] = useState<string | null>(null);
  const [actionInfo2, setActionInfo2] = useState<string | null>(null);
  const [actionInfo3, setActionInfo3] = useState<string | null>(null);
  const [actionInfo4, setActionInfo4] = useState<string | null>(null);
  const [actionInfo5, setActionInfo5] = useState<string | null>(null);
  const [actionInfo6, setActionInfo6] = useState<string | null>(null);

  // 보험가입조건
  const [inputYn, setInputYn] = useState(false);
  const [meCheck, setMeCheck] = useState(true);

  // 첨부서류
  const [licenseName, setLicenseName] = useState('');
  const [overviewName, setOverviewName] = useState('');

  // 동의
  const [agree, setAgree] = useState(false);

  // 시간 옵션 (00~23시)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  // 휴대폰 번호 포맷팅 (010-1234-5678)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (value.includes('-') && value === ctelNo) {
      return value;
    }
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 사무실 전화번호 포맷팅
  const formatTelNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (value.includes('-') && value === telNo) {
      return value;
    }
    if (numbers.startsWith('02')) {
      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 5) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
      } else {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
      }
    } else {
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
    }
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!contractorName.trim()) {
      alert('법인/단체명을 입력해 주세요.');
      return;
    }

    if (resno1.length < 3 || resno2.length < 2 || resno3.length < 5) {
      alert('사업자 등록번호를 정확히 입력하여 주십시오');
      return;
    }

    if (!incharge) {
      alert('담당자명을 입력해 주세요.');
      return;
    }

    // 휴대폰 번호 체크 (하이픈 제외하고 10~11자리)
    const ctelNoNumbers = ctelNo.replace(/[^0-9]/g, '');
    if (!ctelNo || ctelNoNumbers.length < 10) {
      alert('휴대폰 번호를 정확히 입력해 주세요. (10~11자리)');
      return;
    }

    // 사무실 전화번호 체크 (하이픈 제외하고 9~11자리)
    const telNoNumbers = telNo.replace(/[^0-9]/g, '');
    if (!telNo || telNoNumbers.length < 9) {
      alert('사무실 전화번호를 정확히 입력해 주세요. (9~11자리)');
      return;
    }

    if (!email1 || !email2) {
      alert('이메일 주소를 입력해 주세요.');
      return;
    }

    if (!eventName) {
      alert('행사명을 입력해 주세요.');
      return;
    }

    if (!startDate) {
      alert('시작일을 입력해 주세요.');
      return;
    }

    if (!endDate) {
      alert('종료일을 입력해 주세요.');
      return;
    }

    if (!insuredCnt) {
      alert('참여인원 수를 입력해 주세요.');
      return;
    }

    if (actionInfo1 === null) {
      alert('운동경기 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo2 === null) {
      alert('불꽃놀이 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo3 === null) {
      alert('수상위험 활동 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo4 === null) {
      alert('놀이시설 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo5 === null) {
      alert('드론 유무를 체크해 주세요.');
      return;
    }

    if (actionInfo6 === null) {
      alert('기타 위험활동 유무를 체크해 주세요.');
      return;
    }

    if (!agree) {
      alert('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    // 견적 신청 처리
    try {
      // 로그인한 회원 정보 가져오기
      const memberInfo = localStorage.getItem('memberInfo');
      const memberId = memberInfo ? JSON.parse(memberInfo).id : null;

      const formData = new FormData();
      formData.append('contractor_name', contractorName);
      formData.append('registration_no', `${resno1}${resno2}${resno3}`);
      formData.append('incharge', incharge);
      formData.append('ctel_no', ctelNo);
      formData.append('tel_no', telNo);
      formData.append('email', `${email1}@${email2}`);
      formData.append('event_name', eventName);
      formData.append('start_date', `${startDate} ${startHour}:00:00`);
      formData.append('end_date', `${endDate} ${endHour}:00:00`);
      formData.append('insured_cnt', insuredCnt);
      formData.append('device', '모바일');
      
      // 회원 ID 추가 (로그인한 경우)
      if (memberId) {
        formData.append('member_id', memberId);
      }
      
      // 위험활동 정보 (유인 것만 포함)
      const actionInfoList = [actionInfo1, actionInfo2, actionInfo3, actionInfo4, actionInfo5, actionInfo6]
        .filter(info => info && info !== 'N')
        .join('/');
      formData.append('action_info', actionInfoList);

      // 보험가입조건 - 모바일은 기본값만 사용
      console.log('=== 보험가입조건 전송 데이터 (모바일) ===');
      console.log('  - bi_person: 10000');
      console.log('  - bi_occurence: 20000');
      console.log('  - pi_occurence: 1000');
      console.log('  - dt_occurence: 10');
      console.log('  - meCheck:', meCheck);
      
      formData.append('bi_person', '10000');
      formData.append('bi_occurence', '20000');
      formData.append('pi_occurence', '1000');
      formData.append('dt_occurence', '10');
      
      // 참가자치료비 - 체크박스 상태에 따라 값 전송
      if (meCheck) {
        formData.append('me_person', '100');
        formData.append('me_occurence', '1000');
        console.log('  - me_person: 100');
        console.log('  - me_occurence: 1000');
      } else {
        formData.append('me_person', '0');
        formData.append('me_occurence', '0');
        console.log('  - me_person: 0 (미가입)');
        console.log('  - me_occurence: 0 (미가입)');
      }

      // API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/event-insurance/estimate`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert('견적 신청이 완료되었습니다.\n담당자가 확인 후 연락드리겠습니다.');
        // 폼 초기화
        window.location.reload();
      } else {
        alert(data.message || '견적 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('견적 신청 오류:', error);
      alert('견적 신청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="event-insurance-page-mobile">
      <Header isMobile={true} />

      <main className="event-content-mobile">
        <div className="event-form-container-mobile">
          <h1 className="event-title-mobile">행사주최자 배상책임보험 견적신청</h1>
          <p className="event-subtitle-mobile">
            지역축제, 공연, 콘서트, 박람회, 체육행사 등 안전한 행사 진행을 위해 행사보험을 준비하세요.
          </p>

          {/* 행사주최자 */}
          <section className="event-section-mobile">
            <h2 className="section-title-mobile">행사주최자</h2>
            <div className="form-group-mobile">
              <label>법인단체명</label>
              <input
                type="text"
                placeholder="행사를 주최하는 법인단체명을 입력해 주세요"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
              />
            </div>
            <div className="form-group-mobile">
              <label>사업자번호</label>
              <div className="business-number-inputs">
                <input
                  type="tel"
                  maxLength={3}
                  value={resno1}
                  onChange={(e) => setResno1(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <span>-</span>
                <input
                  type="tel"
                  maxLength={2}
                  value={resno2}
                  onChange={(e) => setResno2(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <span>-</span>
                <input
                  type="tel"
                  maxLength={5}
                  value={resno3}
                  onChange={(e) => setResno3(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
            <div className="form-group-mobile">
              <label>담당자명</label>
              <input
                type="text"
                placeholder="담당자명을 입력해 주세요"
                value={incharge}
                onChange={(e) => setIncharge(e.target.value)}
              />
            </div>
            <div className="form-group-mobile">
              <label>휴대폰 번호</label>
              <input
                type="tel"
                placeholder="숫자만 입력해주세요"
                maxLength={13}
                value={ctelNo}
                onChange={(e) => setCtelNo(formatPhoneNumber(e.target.value))}
              />
            </div>
            <div className="form-group-mobile">
              <label>사무실 전화번호</label>
              <input
                type="tel"
                placeholder="숫자만 입력해주세요 (지역번호 포함)"
                maxLength={13}
                value={telNo}
                onChange={(e) => setTelNo(formatTelNumber(e.target.value))}
              />
            </div>
            <div className="form-group-mobile">
              <label>이메일 주소</label>
              <div className="email-inputs">
                <input
                  type="text"
                  placeholder="이메일"
                  value={email1}
                  onChange={(e) => setEmail1(e.target.value)}
                />
                <span>@</span>
                <input
                  type="text"
                  placeholder="도메인"
                  value={email2}
                  onChange={(e) => setEmail2(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 행사내용 */}
          <section className="event-section-mobile">
            <h2 className="section-title-mobile">행사내용</h2>
            <div className="form-group-mobile">
              <label>행사명</label>
              <input
                type="text"
                placeholder="행사명을 입력해 주세요"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div className="form-group-mobile">
              <label>행사시작일</label>
              <div className="datetime-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <select value={startHour} onChange={(e) => setStartHour(e.target.value)}>
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group-mobile">
              <label>행사종료일</label>
              <div className="datetime-inputs">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <select value={endHour} onChange={(e) => setEndHour(e.target.value)}>
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group-mobile">
              <label>예상참여인원</label>
              <input
                type="tel"
                placeholder="숫자만 입력해주세요"
                value={insuredCnt}
                onChange={(e) => setInsuredCnt(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>

            {/* 위험활동 체크 */}
            <div className="risk-activities-mobile">
              <div className="risk-item-mobile">
                <label>운동경기/체육활동 유무</label>
                <div className="radio-group-mobile">
                  <label>
                    <input
                      type="radio"
                      name="action_info_1"
                      value="AT"
                      checked={actionInfo1 === 'AT'}
                      onChange={(e) => setActionInfo1(e.target.value)}
                    />
                    유
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action_info_1"
                      value="N"
                      checked={actionInfo1 === 'N'}
                      onChange={(e) => setActionInfo1(e.target.value)}
                    />
                    무
                  </label>
                </div>
              </div>
              <div className="risk-item-mobile">
                <label>불꽃놀이 유무</label>
                <div className="radio-group-mobile">
                  <label>
                    <input
                      type="radio"
                      name="action_info_2"
                      value="FW"
                      checked={actionInfo2 === 'FW'}
                      onChange={(e) => setActionInfo2(e.target.value)}
                    />
                    유
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action_info_2"
                      value="N"
                      checked={actionInfo2 === 'N'}
                      onChange={(e) => setActionInfo2(e.target.value)}
                    />
                    무
                  </label>
                </div>
              </div>
              <div className="risk-item-mobile">
                <label>수상위험 유무</label>
                <div className="radio-group-mobile">
                  <label>
                    <input
                      type="radio"
                      name="action_info_3"
                      value="WR"
                      checked={actionInfo3 === 'WR'}
                      onChange={(e) => setActionInfo3(e.target.value)}
                    />
                    유
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action_info_3"
                      value="N"
                      checked={actionInfo3 === 'N'}
                      onChange={(e) => setActionInfo3(e.target.value)}
                    />
                    무
                  </label>
                </div>
              </div>
              <div className="risk-item-mobile">
                <label>놀이시설(에어바운스) 유무</label>
                <div className="radio-group-mobile">
                  <label>
                    <input
                      type="radio"
                      name="action_info_4"
                      value="PF"
                      checked={actionInfo4 === 'PF'}
                      onChange={(e) => setActionInfo4(e.target.value)}
                    />
                    유
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action_info_4"
                      value="N"
                      checked={actionInfo4 === 'N'}
                      onChange={(e) => setActionInfo4(e.target.value)}
                    />
                    무
                  </label>
                </div>
              </div>
              <div className="risk-item-mobile">
                <label>드론 유무</label>
                <div className="radio-group-mobile">
                  <label>
                    <input
                      type="radio"
                      name="action_info_5"
                      value="DR"
                      checked={actionInfo5 === 'DR'}
                      onChange={(e) => setActionInfo5(e.target.value)}
                    />
                    유
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action_info_5"
                      value="N"
                      checked={actionInfo5 === 'N'}
                      onChange={(e) => setActionInfo5(e.target.value)}
                    />
                    무
                  </label>
                </div>
              </div>
              <div className="risk-item-mobile">
                <label>기타 위험활동 유무</label>
                <div className="radio-group-mobile">
                  <label>
                    <input
                      type="radio"
                      name="action_info_6"
                      value="ET"
                      checked={actionInfo6 === 'ET'}
                      onChange={(e) => setActionInfo6(e.target.value)}
                    />
                    유
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action_info_6"
                      value="N"
                      checked={actionInfo6 === 'N'}
                      onChange={(e) => setActionInfo6(e.target.value)}
                    />
                    무
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* 보험가입조건 */}
          <section className="event-section-mobile">
            <h2 className="section-title-mobile">보험가입조건</h2>
            <div className="insurance-info-mobile">
              <p>대인배상: 1인당 1억원 / 1사고당 2억원</p>
              <p>대물배상: 1사고당 1,000만원</p>
              <p>참가자치료비: 1인당 100만원 / 1사고당 1,000만원</p>
              <p>자기부담금: 1사고당 10만원</p>
            </div>
            <div className="form-group-mobile">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inputYn}
                  onChange={(e) => setInputYn(e.target.checked)}
                />
                직접입력
              </label>
            </div>
          </section>

          {/* 첨부서류 */}
          <section className="event-section-mobile">
            <h2 className="section-title-mobile">첨부서류</h2>
            <div className="form-group-mobile">
              <label>사업자등록증(고유번호증)</label>
              <input
                type="text"
                placeholder="업로드해 주세요"
                value={licenseName}
                readOnly
                onClick={() => document.getElementById('license')?.click()}
              />
              <input
                type="file"
                id="license"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setLicenseName(file.name);
                }}
              />
            </div>
            <div className="form-group-mobile">
              <label>행사개요</label>
              <input
                type="text"
                placeholder="업로드해 주세요"
                value={overviewName}
                readOnly
                onClick={() => document.getElementById('overview')?.click()}
              />
              <input
                type="file"
                id="overview"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setOverviewName(file.name);
                }}
              />
            </div>
            <p className="notice-text-mobile">
              ※ 행사주최자 배상책임보험 견적서 발송은 견적신청 후 2시간 정도 걸립니다. (영업시간 기준)
            </p>
          </section>

          {/* 개인정보 동의 */}
          <div className="agree-section-mobile">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              개인정보 수집 및 이용 동의(필수)
            </label>
          </div>

          {/* 제출 버튼 */}
          <button className="submit-button-mobile" onClick={handleSubmit}>
            견적신청하기
          </button>
        </div>
      </main>

      <Footer isMobile={true} />
    </div>
  );
}

