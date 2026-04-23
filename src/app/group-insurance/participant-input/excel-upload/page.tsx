'use client';

import React, { useEffect, useState } from 'react';
import ExcelUploadPage from '@/components/travel/ExcelUploadPage';
import { Participant } from '@/components/travel/types';
import '../../m/page.css';

export default function ParticipantExcelUploadPage() {
  const [includeEnglishName, setIncludeEnglishName] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    setIncludeEnglishName(tab === 'FS' || tab === 'FL');
  }, []);

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
      <ExcelUploadPage onClose={handleClose} onUpload={handleUpload} includeEnglishName={includeEnglishName} />
    </div>
  );
}
