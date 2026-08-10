'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DocumentUploadContent from '../DocumentUploadContent';
import './page.css';

export default function DocumentUploadMobile() {
  return (
    <div className="doc-upload-m">
      <Header isMobile />
      <div className="doc-upload-m-wrapper">
        <h1 className="doc-upload-title">서류 업로드</h1>
        <DocumentUploadContent />
      </div>
      <Footer />
    </div>
  );
}
