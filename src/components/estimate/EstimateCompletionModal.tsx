'use client';

import React from 'react';
import { getImagePath } from '@/utils/path';
import './EstimateCompletionModal.css';

interface EstimateCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EstimateCompletionModal({
  isOpen,
  onClose,
}: EstimateCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="estimate-completion-modal-overlay" onClick={onClose}>
      <div className="estimate-completion-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tour2023_pcBox_Box">
          <div className="tour2023_pcBox_top">
            <p className="tour2023_pcBox_tit">여행자보험 견적신청</p>
            <a className="close" href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
              <img 
                src={getImagePath('/icons/ico_btn_close_bl.png')} 
                alt="닫기"
              />
            </a>
          </div>
          <div className="prow_01">
            <div className="tourG_mat04">
              <div>
                <section className="tourGuard_bg ag_center">
                  <div className="tourGuard_Topbg01">
                    <div className="prow_01">
                      <p className="tour2023_end tourG_mat10 tourG_mab05">
                        <span className="icon_end" style={{
                          display: 'inline-block',
                          width: '80px',
                          height: '80px',
                          backgroundImage: `url(${getImagePath('/images/icon_end.png')})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }}></span>
                      </p>
                      <p className="tourG_mat02 tourG_mab01 tourGuard_txt28">
                        <span className="tourGuard_blue">견적서비스 신청접수</span>
                      </p>
                      <p className="tourG_mat02 tourG_mab08 tourGuard_txt27">
                        안녕하세요. 고객님!<br />
                        고객님의 견적서비스 신청이 접수되었습니다.<br /><br />
                        견적서는 메일로 발송되며<br />
                        메일에 첨부된 견적서 출력하기를 클릭하시면<br />
                        인쇄하여 사용하실 수 있습니다. <br />
                        감사합니다. <br /><br />
                        항상 고객님의 안전여행과 함께 하겠습니다.
                      </p>
                      <div className="tourG_mat02 tourG_mab12">
                        <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }} className="tourGuard_btn_b tour2023_btn01">
                          확인
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

