'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './page.css';

function PCCoverageDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasMedicalExpense = searchParams.get('hasMedicalExpense') === 'true';

  return (
    <div className="domestic-page-pc">
      <Header />
      <div className="domestic-content-pc">
        <div className="form-section">
          <div className="form-container">
            <div className="form-card">
              <div className="modal-header">
                <h2 className="modal-title">보장 상세보기</h2>
                <button
                  className="modal-close-btn"
                  onClick={() => router.back()}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="coverage-plan-title">기준플랜</div>
                
                {/* 상해보장 */}
                <div className="coverage-section">
                  <div className="coverage-section-header">
                    <span className="coverage-section-icon">?</span>
                    <h3 className="coverage-section-title">상해보장</h3>
                  </div>
                  <div className="coverage-items">
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">상해사망</span>
                      <span className="coverage-item-amount">1억원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">상해후유장해</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                  </div>
                </div>

                {/* 질병보장 */}
                <div className="coverage-section">
                  <div className="coverage-section-header">
                    <span className="coverage-section-icon">?</span>
                    <h3 className="coverage-section-title">질병보장</h3>
                  </div>
                  <div className="coverage-items">
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">해외의료비</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">입원(급여/비급여)</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">통원(급여/비급여)</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">사망 및 80%이상 고도후유장해</span>
                      <span className="coverage-item-amount">1,000만원</span>
                    </div>
                  </div>
                </div>

                {/* 상해질병 3대 비급여 국내의료비 */}
                <div className="coverage-section">
                  <div className="coverage-section-header">
                    <span className="coverage-section-icon">?</span>
                    <h3 className="coverage-section-title">상해질병 3대 비급여 국내의료비</h3>
                  </div>
                  <div className="coverage-items">
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">도수, 체외충격파, 증식치료</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">주사치료</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">자기공명진단(MRA/MRI)</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                  </div>
                </div>

                {/* 기타보장 */}
                <div className="coverage-section">
                  <div className="coverage-section-header">
                    <span className="coverage-section-icon">?</span>
                    <h3 className="coverage-section-title">기타보장</h3>
                  </div>
                  <div className="coverage-items">
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">휴대품손해(본인부담금 1만원)</span>
                      <span className="coverage-item-amount">50만원</span>
                    </div>
                    <div className="coverage-item-note">
                      1개 20만원한도, 이동통신단말기 보상제외
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">골절(치아파절제외)진단비</span>
                      <span className="coverage-item-amount">10만원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">화상진단비</span>
                      <span className="coverage-item-amount">10만원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">배상책임(본인부담금 1만원)</span>
                      <span className="coverage-item-amount">1,000만원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">상해입원일당(4일이상 30일한도)</span>
                      <span className="coverage-item-amount">2만원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">상해응급실내원(응급)의료비</span>
                      <span className="coverage-item-amount">3만원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">상해응급실내원(비응급)의료비</span>
                      <span className="coverage-item-amount">-</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">골절수술비(동일사고 1회한)</span>
                      <span className="coverage-item-amount">20만원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">상해수술비(동일사고 1회한)</span>
                      <span className="coverage-item-amount">20만원</span>
                    </div>
                    <div className="coverage-item-row">
                      <span className="coverage-item-name">깁스치료비(동일사고 또는 질병 1회한)</span>
                      <span className="coverage-item-amount">20만원</span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="confirm-btn"
                    onClick={() => router.back()}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function PCCoverageDetailPage() {
  return (
    <Suspense fallback={
      <div className="domestic-page-pc">
        <Header />
        <div className="domestic-content-pc" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>로딩 중...</div>
        </div>
        <Footer />
      </div>
    }>
      <PCCoverageDetailContent />
    </Suspense>
  );
}

