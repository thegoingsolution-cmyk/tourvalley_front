'use client';

import { useEffect, useState } from 'react';
import { isMobileDevice } from '@/utils/device';
import DocumentUploadPC from './pc/page';
import DocumentUploadMobile from './m/page';

export default function MyPageUploadPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return <DocumentUploadMobile />;
  }

  return <DocumentUploadPC />;
}
