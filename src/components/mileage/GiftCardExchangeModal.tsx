'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './GiftCardExchangeModal.css';

/** DB·API와 동일한 코드 */
export const GIFT_EXCHANGE_TYPE = {
  CULTURE_POST: 'CC10K_POST',
  SK_GAS_ALIM: 'SK10K_ALIM',
  STARBUCKS_ALIM: 'SB10K_ALIM',
} as const;

type KakaoAddressDoc = {
  address?: { address_name?: string } | null;
  road_address?: { address_name?: string; zone_no?: string } | null;
};

function kakaoAddressDocToLine(d: KakaoAddressDoc): string {
  const r = d.road_address;
  const j = d.address;
  if (r?.address_name) {
    return r.zone_no
      ? `${r.address_name} (우편번호 ${r.zone_no})`
      : r.address_name;
  }
  return j?.address_name ?? '';
}

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
  /** 주소 검색에서만 설정, 직접 수정 불가 */
  const [shippingBaseAddress, setShippingBaseAddress] = useState<string>('');
  /** 동·호수 등, 사용자가 입력. 저장 시 base와 합쳐짐 */
  const [shippingDetailAddress, setShippingDetailAddress] = useState<string>('');
  const [notifyPhone, setNotifyPhone] = useState<string>('');
  const [addressQuery, setAddressQuery] = useState<string>('');
  const [addressHits, setAddressHits] = useState<{ id: string; line: string }[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [addressKakaoError, setAddressKakaoError] = useState<string | null>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressAbortRef = useRef<AbortController | null>(null);

  const isPostalGift = giftType === GIFT_EXCHANGE_TYPE.CULTURE_POST;
  const isAlimtalkGift =
    giftType === GIFT_EXCHANGE_TYPE.SK_GAS_ALIM || giftType === GIFT_EXCHANGE_TYPE.STARBUCKS_ALIM;

  useEffect(() => {
    if (isOpen) {
      setGiftType('');
      setQuantity(0);
      setTotalAmount(0);
      setRestMileage(availableMileage);
      setShippingBaseAddress('');
      setShippingDetailAddress('');
      setNotifyPhone('');
      setAddressQuery('');
      setAddressHits([]);
      setAddressMenuOpen(false);
      setAddressKakaoError(null);
    }
  }, [isOpen, availableMileage]);

  const searchKakaoAddress = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setAddressHits([]);
      return;
    }
    addressAbortRef.current?.abort();
    const ac = new AbortController();
    addressAbortRef.current = ac;
    setAddressSearchLoading(true);
    setAddressKakaoError(null);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(
        `${API_BASE_URL}/api/address/kakao-search?query=${encodeURIComponent(trimmed)}`,
        { credentials: 'include', signal: ac.signal }
      );
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        documents?: KakaoAddressDoc[];
      };
      if (!res.ok || !data.success) {
        setAddressHits([]);
        setAddressKakaoError(
          data.message || (res.status === 502 ? '주소 검색 API 오류' : '주소 검색에 실패했습니다.')
        );
        return;
      }
      const docs = (data.documents as KakaoAddressDoc[]) || [];
      const hits = docs
        .map((d, i) => ({ id: `kakao-addr-${i}`, line: kakaoAddressDocToLine(d) }))
        .filter((h) => h.line.length > 0);
      setAddressHits(hits);
      setAddressMenuOpen(hits.length > 0);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setAddressHits([]);
      setAddressKakaoError('주소 검색 중 오류가 발생했습니다.');
    } finally {
      setAddressSearchLoading(false);
    }
  }, []);

  const setAmount = () => {
    const giftPrice =
      giftType === GIFT_EXCHANGE_TYPE.CULTURE_POST ||
      giftType === GIFT_EXCHANGE_TYPE.SK_GAS_ALIM ||
      giftType === GIFT_EXCHANGE_TYPE.STARBUCKS_ALIM
        ? 10000
        : 0;
    const calculatedAmount = giftPrice * quantity;
    setTotalAmount(calculatedAmount);
    setRestMileage(availableMileage - calculatedAmount);
  };

  useEffect(() => {
    setAmount();
  }, [giftType, quantity, availableMileage]);

  useEffect(() => {
    if (!isPostalGift) {
      setAddressQuery('');
      setAddressHits([]);
      setAddressMenuOpen(false);
      setAddressKakaoError(null);
      setShippingBaseAddress('');
      setShippingDetailAddress('');
    }
  }, [isPostalGift]);

  const buildPostalAddressForSubmit = () => {
    const base = shippingBaseAddress.trim();
    const det = shippingDetailAddress.trim();
    if (!base) return '';
    return det ? `${base} ${det}` : base;
  };

  useEffect(() => {
    return () => {
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
      addressAbortRef.current?.abort();
    };
  }, []);

  const onAddressQueryChange = (value: string) => {
    setAddressQuery(value);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(() => {
      searchKakaoAddress(value);
    }, 400);
  };

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

    if (isPostalGift) {
      if (!shippingBaseAddress.trim()) {
        alert('주소 검색에서 기본 주소를 선택해주세요.');
        return;
      }
      const full = buildPostalAddressForSubmit();
      if (full.length < 5) {
        alert('우편 수령 주소를 확인해주세요.');
        return;
      }
    }
    if (isAlimtalkGift) {
      const digits = notifyPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        alert('받으실 핸드폰 번호를 올바르게 입력해주세요.');
        return;
      }
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
          shipping_address: isPostalGift ? buildPostalAddressForSubmit() : undefined,
          notify_phone: isAlimtalkGift ? notifyPhone.replace(/\D/g, '') : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('상품권 전환신청이 완료되었습니다.');
        // onSuccess가 Promise를 반환할 수 있으므로 await
        if (onSuccess) {
          await Promise.resolve(onSuccess());
        }
        onClose();
      } else {
        alert(data.message || '신청 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('상품권 전환신청 오류:', error);
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const original = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = original.overflow;
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.width = original.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!isOpen) return;

    const updateViewportHeight = () => {
      const vv = window.visualViewport;
      const nextHeight = vv?.height ? Math.round(vv.height) : window.innerHeight;
      setViewportHeight(nextHeight);
    };

    updateViewportHeight();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateViewportHeight);
    vv?.addEventListener('scroll', updateViewportHeight);
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      vv?.removeEventListener('resize', updateViewportHeight);
      vv?.removeEventListener('scroll', updateViewportHeight);
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="gift-card-modal-overlay"
      style={
        {
          '--gift-modal-vvh': viewportHeight > 0 ? `${viewportHeight}px` : undefined,
        } as React.CSSProperties
      }
      onClick={onClose}
    >
      <div 
        className="gift-card-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gift-card-modal-header">
          <h2 className="gift-card-modal-title">상품권 전환신청</h2>
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
            회원 마일리지 상품권 전환신청
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
                    <option value={GIFT_EXCHANGE_TYPE.CULTURE_POST}>
                      문화상품권 10,000원권(우편)
                    </option>
                    <option value={GIFT_EXCHANGE_TYPE.SK_GAS_ALIM}>
                      SK주유상품권 10,000원권(알림톡)
                    </option>
                    <option value={GIFT_EXCHANGE_TYPE.STARBUCKS_ALIM}>
                      스타벅스상품권 10,000원권(알림톡)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {isPostalGift && (
              <div className="gift-card-form-field">
                <label htmlFor="addr_search" className="gift-card-form-label">
                  주소 검색
                </label>
                <div className="gift-card-address-search-wrap">
                  <div className="gift-card-form-input-wrapper">
                    <input
                      id="addr_search"
                      type="search"
                      className="gift-card-form-input"
                      placeholder="도로명·지번·건물명을 입력하세요 (2자 이상)"
                      value={addressQuery}
                      onChange={(e) => onAddressQueryChange(e.target.value)}
                      onFocus={() => addressHits.length > 0 && setAddressMenuOpen(true)}
                      autoComplete="off"
                    />
                    {addressSearchLoading && (
                      <span className="gift-card-address-search-loading" aria-hidden>
                        …
                      </span>
                    )}
                  </div>
                  {addressMenuOpen && addressHits.length > 0 && (
                    <ul className="gift-card-address-hits" role="listbox">
                      {addressHits.map((h) => (
                        <li key={h.id} role="option">
                          <button
                            type="button"
                            className="gift-card-address-hit-btn"
                            onClick={() => {
                              setShippingBaseAddress(h.line);
                              setAddressQuery('');
                              setAddressHits([]);
                              setAddressMenuOpen(false);
                            }}
                          >
                            {h.line}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {addressKakaoError && (
                  <p className="gift-card-address-error" role="alert">
                    {addressKakaoError}
                  </p>
                )}
                <p className="gift-card-address-hint">
                  목록에서 기본 주소를 선택하면 아래에만 반영됩니다. 동·호수는 상세 주소에 입력해주세요.
                </p>
                <p id="shipping_base_label" className="gift-card-form-label">
                  우편받을 주소 (기본)
                </p>
                <div
                  className="gift-card-address-readonly"
                  role="status"
                  aria-labelledby="shipping_base_label"
                >
                  {shippingBaseAddress ? (
                    shippingBaseAddress
                  ) : (
                    <span className="gift-card-address-placeholder">검색 결과에서 주소를 선택하세요 (직접 입력 불가)</span>
                  )}
                </div>
                <label htmlFor="shipping_detail" className="gift-card-form-label">
                  상세 주소
                </label>
                <div className="gift-card-form-textarea-outer">
                  <textarea
                    id="shipping_detail"
                    className="gift-card-form-textarea"
                    rows={2}
                    placeholder="동·호수, 건물명 등 (선택)"
                    value={shippingDetailAddress}
                    onChange={(e) => setShippingDetailAddress(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {isAlimtalkGift && (
              <div className="gift-card-form-field">
                <label htmlFor="notify_phone" className="gift-card-form-label">
                  받으실 핸드폰 번호
                </label>
                <div className="gift-card-form-input-wrapper">
                  <input
                    type="tel"
                    id="notify_phone"
                    className="gift-card-form-input"
                    inputMode="numeric"
                    placeholder="01012345678"
                    value={notifyPhone}
                    onChange={(e) => setNotifyPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

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
            <div className="gift-card-submit-sticky">
              <button
                type="submit"
                className="gift-card-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : '신청'}
              </button>
            </div>

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

