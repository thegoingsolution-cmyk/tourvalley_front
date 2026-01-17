'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { getImagePath } from '@/utils/path';
import '@/app/contracts/pc/page.css';

interface GiftCardExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMileage: number;
  memberId?: number;
  onSuccess?: () => void;
}

const GiftCardExchangeModal: React.FC<GiftCardExchangeModalProps> = ({
  isOpen,
  onClose,
  availableMileage,
  memberId,
  onSuccess,
}) => {
  const [giftType, setGiftType] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [restMileage, setRestMileage] = useState<number>(availableMileage);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setGiftType('');
      setQuantity(0);
      setTotalAmount(0);
      setRestMileage(availableMileage);
    }
  }, [isOpen, availableMileage]);

  const setAmount = () => {
    const giftPrice = giftType === 'CO10000' || giftType === 'CM10000' ? 10000 : 0;
    const calculatedAmount = giftPrice * quantity;
    setTotalAmount(calculatedAmount);
    setRestMileage(availableMileage - calculatedAmount);
  };

  useEffect(() => {
    setAmount();
  }, [giftType, quantity, availableMileage]);

  const handleSubmit = async () => {
    if (!giftType) {
      alert('상품권을 선택해주세요.');
      return;
    }

    if (quantity <= 0) {
      alert('매수를 선택해주세요.');
      return;
    }

    if (totalAmount > availableMileage) {
      alert('사용 가능한 마일리지가 부족합니다.');
      return;
    }

    if (totalAmount < 10000) {
      alert('최소 10,000원 이상 신청 가능합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/mileage/exchange-gift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gift_type: giftType,
          quantity: quantity,
          total_amount: totalAmount,
          total_mileage: totalAmount, // 1P = 1원
          member_id: memberId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('문화상품권 전환신청이 완료되었습니다.');
        // onSuccess가 Promise를 반환할 수 있으므로 await
        if (onSuccess) {
          await Promise.resolve(onSuccess());
        }
        onClose();
      } else {
        alert(data.message || '신청 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('문화상품권 전환신청 오류:', error);
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="contract-page-pc tour2023_pcBox_Wrap" 
      style={{ 
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        margin: 0,
        padding: 0
      }}
      onClick={onClose}
    >
      <div 
        className="tour2023_pcBox_Layer" 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="tour2023_pc_layer tour2023_pcBox_plan"
        >
          <div className="tour2023_pcBox_top">
            <p className="tour2023_pcBox_tit">문화상품권 전환신청</p>
            <a className="close" href="javascript:void(0);" onClick={onClose}>
              닫기
            </a>
          </div>
          <div className="tour2023_plan">
            <section className="scroll_box01">
              <div className="tour2023_plan_prow_01">
                <form name="mileageForm" method="POST">
                  <div id="contentWrap">
                    <section className="tourGuard_bg ag_center">
                      <div className="tourGuard_Topbg01">
                        <div className="prow_01">
                          <div className="tourG_mat13 tourG_mab04 tour2023_title10">
                            회원 마일리지 문화상품권 전환신청
                          </div>
                          <div className="tourGuard_form_tt mag5 tourG_mab03">
                            <label htmlFor="available_mileage">사용가능 마일리지</label>
                            <input
                              type="text"
                              id="available_mileage"
                              maxLength={7}
                              value={availableMileage.toLocaleString()}
                              className="tourGuard_input_w02"
                              readOnly
                            />
                            <div className="tourGuard_txt21">P</div>
                          </div>
                          <div className="tourGuard_form_tt mag5 tourG_mab03">
                            <label htmlFor="gift_type">상품권 선택</label>
                            <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                              <span className="tourGuard_ps_box">
                                <select
                                  className="tourGuard_sel"
                                  name="gift_type"
                                  value={giftType}
                                  onChange={(e) => {
                                    setGiftType(e.target.value);
                                    setAmount();
                                  }}
                                >
                                  <option value="">선택</option>
                                  <option value="CO10000">문화상품권 10,000원권(온라인)</option>
                                  <option value="CM10000">문화상품권 10,000원권(모바일)</option>
                                </select>
                              </span>
                            </div>
                          </div>
                          <div className="tourGuard_form_tt mag5 tourG_mab03">
                            <label htmlFor="quantity">매수 선택</label>
                            <div className="tourGuard_bg_join tourGuard_input_cell tourGuard_input_cell01 tourGuard" style={{ marginRight: 0 }}>
                              <span className="tourGuard_ps_box">
                                <select
                                  className="tourGuard_sel"
                                  name="quantity"
                                  value={quantity}
                                  onChange={(e) => {
                                    setQuantity(Number(e.target.value));
                                    setAmount();
                                  }}
                                >
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <option key={num} value={num}>
                                      {num}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </div>
                          </div>
                          <div className="tourGuard_form_tt mag5 tourG_mab03">
                            <label htmlFor="tot_amount">금액</label>
                            <input
                              type="text"
                              id="tot_amount"
                              name="tot_amount"
                              value={totalAmount.toLocaleString()}
                              className="tourGuard_input_w02"
                              readOnly
                            />
                            <div className="tourGuard_txt21">원</div>
                          </div>
                          <div className="tour2023_mileC_Wrap">
                            <p className="tour2023_mileC_tt tourG_mab05">
                              사용 후 남은 마일리지{' '}
                              <span id="restMileage" className="tour2023_mileC_tt01">
                                <b>{restMileage.toLocaleString()}P</b>
                              </span>
                            </p>
                          </div>
                          <div className="tourG_mat12 tourG_mab15 tourG_mab05">
                            <a
                              href="javascript:void(0);"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSubmit();
                              }}
                              className="tourGuard_btn_b tour2023_btn01"
                              style={{ pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.6 : 1 }}
                            >
                              {isSubmitting ? '처리 중...' : '신청'}
                            </a>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                  <input type="hidden" name="gift_cd" value={giftType} />
                  <input type="hidden" name="tot_mileage" value={totalAmount} />
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GiftCardExchangeModal;

