'use client';

import { useEffect } from 'react';
import { getImagePath } from '@/utils/path';

export default function Favicon() {
  useEffect(() => {
    // favicon 경로 동적 설정
    const faviconPath = getImagePath('/favicon.ico');
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconPath;
    } else {
      // link 태그가 없으면 생성
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = faviconPath;
      document.head.appendChild(newLink);
    }
  }, []);

  return null;
}

