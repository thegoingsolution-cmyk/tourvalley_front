'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './GiftCardExchangeModal.css';

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
      className="gift-card-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="gift-card-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gift-card-modal-header">
          <h2 className="gift-card-modal-title">문화상품권 전환신청</h2>
          <button 
            className="gift-card-modal-close"
            onClick={onClose}
            type="button"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        
        <div className="gift-card-modal-content">
          <h3 className="gift-card-modal-section-title">
            회원 마일리지 문화상품권 전환신청
          </h3>
          
          <form name="mileageForm" method="POST" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {/* 사용가능 마일리지 */}
            <div className="gift-card-form-field">
              <label htmlFor="available_mileage" className="gift-card-form-label">
                사용가능 마일리지
              </label>
              <div className="gift-card-form-input-wrapper">
                <input
                  type="text"
                  id="available_mileage"
                  maxLength={7}
                  value={availableMileage.toLocaleString()}
                  className="gift-card-form-input"
                  readOnly
                />
                <span className="gift-card-form-unit">P</span>
              </div>
            </div>

            {/* 상품권 선택 */}
            <div className="gift-card-form-field">
              <label htmlFor="gift_type" className="gift-card-form-label">
                상품권 선택
              </label>
              <div className="gift-card-form-input-wrapper">
                <div className="gift-card-form-select-wrapper">
                  <select
                    className="gift-card-form-select"
                    name="gift_type"
                    id="gift_type"
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
                </div>
              </div>
            </div>

            {/* 매수 선택 */}
            <div className="gift-card-form-field">
              <label htmlFor="quantity" className="gift-card-form-label">
                매수 선택
              </label>
              <div className="gift-card-form-input-wrapper">
                <div className="gift-card-form-select-wrapper">
                  <select
                    className="gift-card-form-select"
                    name="quantity"
                    id="quantity"
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
                </div>
              </div>
            </div>

            {/* 금액 */}
            <div className="gift-card-form-field">
              <label htmlFor="tot_amount" className="gift-card-form-label">
                금액
              </label>
              <div className="gift-card-form-input-wrapper">
                <input
                  type="text"
                  id="tot_amount"
                  name="tot_amount"
                  value={totalAmount.toLocaleString()}
                  className="gift-card-form-input"
                  readOnly
                />
                <span className="gift-card-form-unit">원</span>
              </div>
            </div>

            {/* 사용 후 남은 마일리지 */}
            <div className="gift-card-remaining-mileage">
              <p className="gift-card-remaining-mileage-text">
                사용 후 남은 마일리지
              </p>
              <p className="gift-card-remaining-mileage-amount">
                {restMileage.toLocaleString()}P
              </p>
            </div>

            {/* 신청 버튼 */}
            <button
              type="submit"
              className="gift-card-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : '신청'}
            </button>

            <input type="hidden" name="gift_cd" value={giftType} />
            <input type="hidden" name="tot_mileage" value={totalAmount} />
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default GiftCardExchangeModal;

