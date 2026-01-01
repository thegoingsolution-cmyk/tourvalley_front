import React from 'react';

interface AccidentFreeCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccidentFreeCashModal: React.FC<AccidentFreeCashModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content accident-free-cash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tour2023_pcBox_top">
          <p className="tour2023_pcBox_tit">투어밸리 무사고캐시 서비스</p>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="tour2023_pcBox_txt03">
          <p className="tour2023_pcBox_txt01">보험료의 10% 적립</p>
          <p className="tour2023_pcBox_txt02">(최대 30,000원)</p>
          <p className="tour2023_pcBox_txt03_content">
            사고없이 다녀오셨다면<br />
            투어밸리 무사고캐시를 적립하세요.<br />
            재가입할 때 그만큼 보험료를 아낄 수 있습니다.
          </p>
          <p className="tour2023_pcBox_txt04">(개인고객에 한함)</p>
          <p className="tour2023PC_cash_icon">
            <img src="/images/cash01.png" alt="무사고캐시" className="cash_icon_pc" />
          </p>
          <div>
            <a 
              href="/tour/tourvalley/rainbow/my/cash/listCash.jsp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn_b tour2023PC_btn01"
            >
              무사고캐시 조회/적립하기
            </a>
          </div>
        </div>
        
        <div className="tour2023PC_bg01">
          <section className="tour2023PC_txt01">
            <ul className="tour2023PC_cash_info">
              <li className="tour2023PC_cash_info_w">1.</li>
              <li>무사고캐시는 사고없이 안전하게 여행을 다녀오신 고객님께 투어밸리에서 제공하는 적립포인트입니다. (단, 개인고객에 한합니다.)</li>
            </ul>
            <ul className="tour2023PC_cash_info">
              <li className="tour2023PC_cash_info_w">2.</li>
              <li>무사고캐시는 투어밸리 사이트에서 직접 적립하셔야 합니다.</li>
            </ul>
            <ul className="tour2023PC_cash_info">
              <li className="tour2023PC_cash_info_w">3.</li>
              <li>무사고캐시는 보험료의 10%가 적립되며 1계약당 최대 30,000원까지 적립하실 수 있습니다.</li>
            </ul>
            <ul className="tour2023PC_cash_info">
              <li className="tour2023PC_cash_info_w">4.</li>
              <li>무사고캐시의 적립가능기간은 보험기간 종료 후 1년까지입니다. (무사고캐시 적립 후 보험금을 청구하는 경우 적립된 무사고캐시는 소멸되며 이미 사용하신 무사고캐시는 반환하셔야 합니다.)</li>
            </ul>
            <ul className="tour2023PC_cash_info">
              <li className="tour2023PC_cash_info_w">5.</li>
              <li>무사고캐시는 여행자보험(해외여행보험, 국내여행보험에 한함)에 재가입하는 경우 할인쿠폰으로 사용가능하며 현금 또는 기타 다른 방법으로 교환될 수 없습니다.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccidentFreeCashModal;

