'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PCContractPage from '../pc/page';

export default function MobileContractPage() {
  // 모바일도 동일한 컴포넌트 사용 (반응형으로 처리)
  return <PCContractPage />;
}

