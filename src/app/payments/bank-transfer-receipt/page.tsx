'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type ContractDetail = {
  insuranceType?: string;
  totalPremium?: number;
  paidAmount?: number;
  paymentDate?: string | null;
  depositorName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const formatAmount = (amount?: number | null) => {
  const numeric = amount ?? 0;
  return `${Math.floor(numeric).toLocaleString()}원`;
};

const getInsuranceTypeDisplay = (insuranceType?: string) => {
  if (!insuranceType) return '-';
  const longTermTypes = ['유학/어학연수', '해외출장/주재원/교환교수', '워킹홀리데이'];
  if (longTermTypes.includes(insuranceType)) {
    return '해외장기체류보험';
  }
  return insuranceType;
};

function BankTransferReceiptContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');
  const { isLoggedIn, member, isLoading: authLoading } = useAuth();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!contractId) {
        setLoading(false);
        return;
      }
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        if (authLoading) return;
        if (!isLoggedIn || !member?.id) return;
        const response = await fetch(
          `${API_BASE_URL}/api/contracts/detail/${contractId}?member_id=${encodeURIComponent(
            String(member.id)
          )}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (data?.success && data?.contract) {
          setDetail(data.contract as ContractDetail);
        }
      } catch (error) {
        console.error('입금확인증 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [contractId]);

  useEffect(() => {
    const updateScale = () => {
      if (typeof window === 'undefined') return;
      const availableWidth = Math.max(0, window.innerWidth - 24);
      const nextScale = Math.min(1, availableWidth / 900);
      setScale(nextScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        로딩 중...
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        입금확인증 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const accountInfo = [
    detail.bankName || '-',
    detail.accountNumber || '-',
  ].join(' ');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <table width="900" border={0} cellSpacing={0} cellPadding={0} align="center">
        <tbody>
          <tr>
            <td width="620" align="center">
              <table width="620" cellSpacing={0} cellPadding={0}>
                <tbody>
                  <tr><td height="30px"></td></tr>
                  <tr>
                    <td
                      height="70px"
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '32px',
                        color: '#000000',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        boxSizing: 'border-box',
                        paddingTop: '10px',
                        letterSpacing: '-0.8px',
                      }}
                      align="left"
                      width="590"
                    >
                      <strong>입금확인증(고객용)</strong>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <img src="/images/logo.png" width="170" height="50" alt="투어밸리 로고" />
                    </td>
                  </tr>
                  <tr>
                    <td
                      width="620px"
                      height="5px"
                      colSpan={2}
                      style={{
                        width: '620px',
                        height: '5px',
                        border: '3px solid #000000',
                        boxSizing: 'border-box',
                        position: 'relative',
                      }}
                    ></td>
                  </tr>
                  <tr>
                    <td
                      align="right"
                      width="620px"
                      height="40px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '13px',
                        color: '#000000',
                      }}
                    >
                      https://www.tourvalley.net / T.1599-2541
                    </td>
                  </tr>
                  <tr><td height="20px" colSpan={2}></td></tr>

                  <tr>
                    <td
                      align="left"
                      width="620px"
                      height="25px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '18px',
                        color: '#000000',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      보험종목: {getInsuranceTypeDisplay(detail.insuranceType)}
                    </td>
                  </tr>
                  <tr><td height="5px" colSpan={2}></td></tr>
                  <tr>
                    <td
                      align="left"
                      width="620px"
                      height="25px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '17px',
                        color: '#000000',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      계좌정보: {accountInfo}{detail.depositorName ? `, 예금주 ${detail.depositorName}` : ''}
                    </td>
                  </tr>
                  <tr><td height="5px" colSpan={2}></td></tr>
                  <tr>
                    <td
                      align="left"
                      width="620px"
                      height="25px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '17px',
                        color: '#000000',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      입 금 일: {formatDate(detail.paymentDate)}
                    </td>
                  </tr>
                  <tr><td height="5px" colSpan={2}></td></tr>
                  <tr>
                    <td
                      align="left"
                      width="620px"
                      height="25px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '17px',
                        color: '#000000',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      입금자명: {detail.depositorName || '-'}
                    </td>
                  </tr>
                  <tr><td height="5px" colSpan={2}></td></tr>
                  <tr>
                    <td
                      align="left"
                      width="620px"
                      height="25px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '17px',
                        color: '#000000',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      입금금액: {formatAmount(detail.paidAmount ?? detail.totalPremium)}
                    </td>
                  </tr>
                  <tr><td height="30px" colSpan={2}></td></tr>
                  <tr>
                    <td
                      align="center"
                      width="620px"
                      height="25px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '17px',
                        color: '#000000',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      <strong>위 보험료(금액)가 입금되었음이 확인되었습니다.</strong>
                    </td>
                  </tr>
                  <tr><td height="15px" colSpan={2}></td></tr>
                  <tr>
                    <td align="right" colSpan={2}>
                      <img src="/images/stamp.png" width="254" height="86" alt="투어밸리 도장" />
                    </td>
                  </tr>
                  <tr><td height="15px" colSpan={2}></td></tr>
                  <tr>
                    <td
                      align="left"
                      width="620px"
                      height="25px"
                      colSpan={2}
                      style={{
                        fontFamily: '맑은 고딕, Apple SD Gothic Neo, Arial, Helvetic, Verdana, sans-serif',
                        fontSize: '14px',
                        color: '#666666',
                        paddingLeft: '10px',
                        lineHeight: '100%',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      ※ TourValley는 주식회사 빨주노초파남보에서 운영하는 여행보험전문몰 입니다.
                    </td>
                  </tr>
                  <tr><td height="15px" colSpan={2}></td></tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BankTransferReceiptPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>}>
      <BankTransferReceiptContent />
    </Suspense>
  );
}
