'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventInsuranceWizard from '@/components/eventInsurance/EventInsuranceWizard';
import './page.css';

export default function MobileEventInsurancePage() {
  return (
    <div className="event-insurance-mobile">
      <Header isMobile={true} />

      <main className="event-insurance-m-main">
        <EventInsuranceWizard device="모바일" />
      </main>

      <Footer isMobile={true} />
    </div>
  );
}
