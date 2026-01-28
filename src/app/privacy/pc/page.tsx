'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import './page.css';

export default function PCPrivacyPage() {
  const router = useRouter();

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      router.push('/main');
    }
  };

  return (
    <div id="insLayer" className="privacy-layer">
      <header className="layer_header prow_01">
        <span className="layer_title">개인정보 수집 동의</span>
        <a href="#" onClick={(e) => { e.preventDefault(); handleClose(); }} className="close" aria-label="닫기">
          <img src="/icons/ico_btn_close_bl.png" alt="닫기" className="close-icon" />
        </a>
      </header>

      <section className="bgcolor_white pb30 prow_01 privacy-section">
        <div className="privacy ptb20">
          <table className="txt">
            <tbody>
              <tr>
                <td className="txt">
                  <span className="txt01"><strong>1. 개인(신용)정보의 수집 및 이용에 관한 사항  (전문)</strong></span><br /><br />
                  당사는 보험회사의 보험대리점으로서 「개인정보보호법」 및 「신용정보의 이용 및 보호에 관한 법률」에 따라 여행자보험 계약과 관련하여 귀하의 개인(신용)정보를 수집 이용하고자 합니다. 이에 대하여 동의하십니까?<br /><br />
                  ① 보험회사[]<br />
                  ② 개인(신용)정보의 수집·이용 목적<br />
                  <span className="pad13">- 보험계약의 인수심사·체결·유지·관리(부활 및 갱신 포함)</span><br />
                  <span className="pad13">- 보험금 지급 심사</span><br />
                  <span className="pad13">- 순보험요율의 산출·검증</span><br />
                  <span className="pad13">- 민원처리 및 분쟁 대응</span><br />
                  <span className="pad13">- 사고조사(보험사기 조사 포함)</span><br />
                  <span className="pad13">- 보험모집질서의 유지</span><br />
                  <span className="pad13">- 기존 계약자에 대한 보험계약 상담(보험회사 및 설계사에 한함)</span><br />
                  <span className="pad13">- 금융거래 관련 업무(금융거래 신청, 자동이체 등)</span><br />
                  <span className="pad13">- 보험계약 관련 분쟁 대응, 고객 이력 관리</span><br />
                  ③ 수집·이용할 개인(신용)정보의 내용<br />
                  <span className="pad13">- 개인 식별정보(성명, 주민등록번호, 외국인등록번호, 주소, 성별,</span> <br />
                  <span className="pad03">직업, 전화번호, 휴대전화번호, 전자우편주소)</span><br />
                  <span className="pad13">- 보험회사, 신용정보집중기관(생명·손해보험협회) 및 보험개발원</span><br />
                  <span className="pad03">(보험요율산출기관)에서 수집·관리하는 보험계약정보, 피보험자의</span><br />
                  <span className="pad03">질병 및 상해에 대한 정보, 보험금지급 관련 정보(사고정보, 본인의</span><br />
                  <span className="pad03">위임을 받아 취득한 각종 조사서, 판결문, 증명서, 확인서, 진료기록</span><br />
                  <span className="pad03">등)</span><br />
                  <span className="pad13">- 계약전 알릴 의무 사항</span><br />
                  <span className="pad13">- 법률 및 국제협약 등의 의무이행을 위한 정보</span><br />
                  <span className="pad13">- 금융거래 업무(보험료 및 보험금 등 출·수납)</span><br />
                  ④ 개인(신용)정보의 보유·이용 기간<br />
                  <span className="pad13">- 수집·이용 동의일로부터 거래종료 후 5년까지(단, 거래종료 후</span><br />
                  <span className="pad03">5년이 경과한 경우에는 보험금 지급, 금융사고 조사, 보험사기</span><br />
                  <span className="pad03">방지·적발, 민원처리, 법령상 의무이행을 위한 경우에 한하여</span><br />
                  <span className="pad03">보유·이용하며, 별도 보관)</span><br /><br /><br /><br /><br />

                  <span className="txt01"><strong>2. 개인정보의 조회에 관한 사항 (전문)</strong></span><br /><br />
                  당사는 보험회사의 보험대리점으로서 「신용정보의 이용 및 보호에 관한 법률」에 따라 귀하의 개인(신용)정보를 다음과 같이 신용정보 집중기관으로부터 조회하고자 합니다. 이에 대하여 동의하십니까?<br /><br />
                  ① 보험회사[]<br />
                  ② 개인(신용)정보의 조회 목적<br />
                  <span className="pad13">- 보험계약의 인수심사·체결·유지·관리(부활 및 갱신 포함), 보험금</span><br />
                  <span className="pad03">등 지급·심사, 보험사고조사(보험사기 조사 포함)</span><br />
                  ③ 조회할 개인(신용)정보<br />
                  <span className="pad13">- 신용정보집중기관(생명·손해보험협회) 및 보험개발원(보험</span><br />
                  <span className="pad03">요율산출기관)에서 수집·관리하는 보험계약정보, 보험금지급</span><br />
                  <span className="pad03">관련 정보(사고정보 포함), 피보험자의 질병 침 상해 관련 정보</span><br />
                  ④ 조회동의 유효 기간 및 조회자(제공받는 자)의 개인(신용)<br />
                  <span className="pad13">정보의 보유·이용 기간</span><br />
                  <span className="pad13">- 수집·이용 동의일로부터 거래종료 후 5년까지(단, 거래종료 후</span><br />
                  <span className="pad03">5년이 경과한 경우에는 보험금 지급, 금융사고 조사, 보험사기</span><br />
                  <span className="pad03">방지·적발, 민원처리, 법령상 의무이행을 위한 경우에 한하여</span><br />
                  <span className="pad03">보유·이용하며, 별도 보관)</span><br /><br /><br /><br /><br />

                  <span className="txt01"><strong>3. 개인(신용)정보의 제공에 관한 사항 (전문)</strong></span><br /><br />
                  당사는 보험회사의 보험대리점으로서「개인정보보호법 및 신용정보의 이용 및 보호에 관한 법률」에 따라 귀하의 개인(신용)정보를 다음과 같이 제3자에게 제공하고자 합니다. 이에 대하여 동의하십니까?<br /><br />
                  ① 보험회사[]<br />
                  ② 개인(신용)정보를 제공받는 자<br />
                  <span className="pad13">- 신용정보 집중기관 : 생명보험협회, 손해보험협회, 은행연합회</span><br />
                  <span className="pad03">등 신용정보 집중기관</span><br />
                  <span className="pad13">- 공공기관 등 : 금융위원회, 금융감독원, 보험요율산출기관 등</span><br />
                  <span className="pad03">공공기관, 법령상 업무 수행기관(위탁사업자 포함)</span><br />
                  <span className="pad13">- 보험회사 등 : 생명보험회사, 손해보험회사, 국내/국외 재보험사,</span><br />
                  <span className="pad03">공제사업자, 체신관서(우체국보험), 금융거래 관련 계좌계설 금융</span><br />
                  <span className="pad03">기관, 금융결제원</span><br />
                  <span className="pad13">- 업무수탁자 등 : 보험회사와 모집위탁계약을 체결한 자(설계사,</span><br />
                  <span className="pad03">대리점 등), 보험중개사, 계약 체결 및 이행 등에 필요한 업무를</span><br />
                  <span className="pad03">위탁받은 자(보험사고조사업체, 손해사정업체, 의료기관, 의사,</span><br />
                  <span className="pad03">변호사, 위탁 콜센타, 건강보험 심사평가원, 건강진단업체, 계약적</span><br />
                  <span className="pad03">부조사업체 등)</span><br />
                  ③ 개인(신용)정보를 제공받는 자의 이용목적 <br />
                  <span className="pad13">- 신용정보 집중기관 : 보험계약 및 보험금지급 관련 정보의 집중</span><br />
                  <span className="pad03">관리 및 활용 등 신용정보 집중기관의 업무</span><br />
                  <span className="pad13">- 공공기관 등 : 보험업법 및 자동차손해배상보장법 등 법령에 따른</span><br />
                  <span className="pad03">업무수행(위탁업무 포함)</span><br />
                  <span className="pad13">- 보험회사 등 : 중복보험 확인 및 비례보상, 재보험 가입 및 재보험금</span><br />
                  <span className="pad03">청구, 보험계약 공동인수, 금융거래 업무(보험료 및 보험금 등</span><br />
                  <span className="pad03">출·수납</span><br />
                  <span className="pad13">- 업무수탁자 등 : 본 계약의 체결·이행 관련 위탁업무 수행, 진료비</span><br />
                  <span className="pad03">심사, 의료심사 및 자문업무</span><br />
                  ④ 제공할 개인(신용)정보의 내용<br />
                  <span className="pad13">- 「 1. 개인(신용)정보의 수집·이용에 관한 사항」의 정보내용</span><br />
                  <span className="pad03">(단, 각 제공받는 자의 이용목적을 위해 필요한 정보에 한함)</span><br />
                  ⑤ 제공받는 자의 개인(신용)정보 보유/이용기간<br />
                  <span className="pad13">- 개인(신용)정보를 제공받는 자의 이용목적을 달성할 때까지</span><br />
                  <span className="pad03">(최대 거래종료 휴 5년까지)</span><br /><br /><br />

                  ※ 각 제공대상기관 및 이용목적의 구체적인 정보는 보험회사<br />
                  홈페이지(<a href="/" target="_blank" className="t_blue">/</a>)에서 확인할 수 있습니다.<br /><br /><br /><br /><br />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
