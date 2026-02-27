'use client';

import React from 'react';
import ExcelUploadModal from './ExcelUploadModal';
import { Participant } from './types';

interface ExcelUploadPageProps {
  onUpload: (participants: Participant[]) => void;
  onClose: () => void;
  excelTemplatePath?: string;
}

export default function ExcelUploadPage({
  onUpload,
  onClose,
  excelTemplatePath,
}: ExcelUploadPageProps) {
  const handleUpload = (participants: Participant[], startId: number) => {
    // startId는 무시하고 participants만 전달
    onUpload(participants);
  };

  return (
    <ExcelUploadModal
      isOpen={true}
      onClose={onClose}
      onUpload={handleUpload}
      currentParticipants={[]}
      excelTemplatePath={excelTemplatePath}
      variant="page"
    />
  );
}
