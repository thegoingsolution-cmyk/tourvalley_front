'use client';

import React, { useState } from 'react';

export default function RefundTestPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const [form, setForm] = useState({
    paymentId: '',
    orderId: '',
    tid: '',
    cancelAmt: '',
    refundBankCode: '',
    refundAccount: '',
    refundHolder: '',
    reason: '관리자 환불',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const submitRefund = async () => {
    setLoading(true);
    setResult('');
    try {
      const payload: any = {
        refundBankCode: form.refundBankCode.trim(),
        refundAccount: form.refundAccount.trim(),
        refundHolder: form.refundHolder.trim(),
        reason: form.reason.trim() || '관리자 환불',
      };

      if (form.paymentId.trim()) payload.payment_id = Number(form.paymentId.trim());
      if (form.orderId.trim()) payload.orderId = form.orderId.trim();
      if (form.tid.trim()) payload.tid = form.tid.trim();
      if (form.cancelAmt.trim()) payload.cancelAmt = Number(form.cancelAmt.trim());

      const response = await fetch(`${API_BASE_URL}/api/payments/nicepay/vbank-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || '환불 요청 실패');
      }

      setResult(`성공: ${data.message || '환불 요청 완료'}`);
    } catch (error: any) {
      setResult(`실패: ${error.message || '오류 발생'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>가상계좌 환불 (임시 페이지)</h2>
      <div style={{ color: '#666', marginBottom: 20 }}>
        사용 후 제거 예정. payment_id 또는 orderId 또는 tid 중 하나는 넣어주세요.
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <input
          placeholder="payment_id (선택)"
          value={form.paymentId}
          onChange={(e) => handleChange('paymentId', e.target.value)}
        />
        <input
          placeholder="orderId (선택)"
          value={form.orderId}
          onChange={(e) => handleChange('orderId', e.target.value)}
        />
        <input
          placeholder="tid (선택)"
          value={form.tid}
          onChange={(e) => handleChange('tid', e.target.value)}
        />
        <input
          placeholder="환불금액 (선택, 비우면 전액)"
          value={form.cancelAmt}
          onChange={(e) => handleChange('cancelAmt', e.target.value)}
        />
        <input
          placeholder="환불은행코드 (예: 088)"
          value={form.refundBankCode}
          onChange={(e) => handleChange('refundBankCode', e.target.value)}
        />
        <input
          placeholder="환불계좌번호"
          value={form.refundAccount}
          onChange={(e) => handleChange('refundAccount', e.target.value)}
        />
        <input
          placeholder="환불예금주"
          value={form.refundHolder}
          onChange={(e) => handleChange('refundHolder', e.target.value)}
        />
        <input
          placeholder="환불사유"
          value={form.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
        />
      </div>

      <button
        onClick={submitRefund}
        disabled={loading}
        style={{ marginTop: 16, padding: '10px 16px' }}
      >
        {loading ? '처리 중...' : '가상계좌 환불 요청'}
      </button>

      {result && (
        <div style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{result}</div>
      )}
    </div>
  );
}
