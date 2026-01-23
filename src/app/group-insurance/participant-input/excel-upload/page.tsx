'use client';

import React from 'react';
import ExcelUploadPage from '@/components/travel/ExcelUploadPage';
import { Participant } from '@/components/travel/types';
import '../../m/page.css';

export default function ParticipantExcelUploadPage() {
  const handleClose = () => {
    window.close();
  };

  const handleUpload = (participants: Participant[]) => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: 'EXCEL_UPLOAD',
          participants,
        },
        window.location.origin
      );
      window.close();
    } else {
      alert('부모 창을 찾을 수 없습니다.');
    }
  };

  return (
    <div className="bgcolor_white">
      <ExcelUploadPage onClose={handleClose} onUpload={handleUpload} />
    </div>
  );
}
