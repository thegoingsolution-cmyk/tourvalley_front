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
  return (
    <ExcelUploadModal
      isOpen={true}
      onClose={onClose}
      onUpload={onUpload}
      currentParticipants={[]}
      excelTemplatePath={excelTemplatePath}
      variant="page"
    />
  );
}
