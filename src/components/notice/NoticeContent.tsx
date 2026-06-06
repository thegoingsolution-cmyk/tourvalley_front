'use client';

import React, { useRef, useCallback, useEffect, useMemo } from 'react';

const IFRAME_FIT_STYLE =
  '<style id="notice-iframe-fit">html,body{margin:0;padding:0;overflow:visible!important;height:auto!important;max-height:none!important;}</style>';

function buildNoticeSrcDoc(html: string): string {
  if (html.includes('</head>')) {
    return html.replace('</head>', `${IFRAME_FIT_STYLE}</head>`);
  }
  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${IFRAME_FIT_STYLE}</head>`);
  }
  return `${IFRAME_FIT_STYLE}${html}`;
}

export type NoticeContentType = 'editor' | 'html_file';

interface NoticeContentProps {
  content: string;
  contentType?: NoticeContentType | string | null;
  className?: string;
}

function getIframeDocumentHeight(doc: Document): number {
  const el = doc.documentElement;
  const body = doc.body;
  return Math.max(
    el?.scrollHeight ?? 0,
    body?.scrollHeight ?? 0,
    el?.offsetHeight ?? 0,
    body?.offsetHeight ?? 0
  );
}

export default function NoticeContent({
  content,
  contentType,
  className = 'notice-content',
}: NoticeContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const srcDoc = useMemo(
    () => (contentType === 'html_file' ? buildNoticeSrcDoc(content) : ''),
    [content, contentType]
  );

  const fitIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!doc) return;

      const height = getIframeDocumentHeight(doc);
      if (height > 0) {
        iframe.style.height = `${height}px`;
      }
    } catch {
      // 접근 불가 시 기본 높이 유지
    }
  }, []);

  const bindIframeResize = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    fitIframeHeight();

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc?.body) return;

    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = new ResizeObserver(fitIframeHeight);
    resizeObserverRef.current.observe(doc.body);
    if (doc.documentElement !== doc.body) {
      resizeObserverRef.current.observe(doc.documentElement);
    }

    doc.querySelectorAll('img').forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', fitIframeHeight, { once: true });
      }
    });
  }, [fitIframeHeight]);

  useEffect(() => {
    if (contentType !== 'html_file') return;
    bindIframeResize();
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [content, contentType, bindIframeResize]);

  if (contentType === 'html_file') {
    return (
      <iframe
        ref={iframeRef}
        title="공지사항 내용"
        srcDoc={srcDoc}
        className={`${className} notice-html-iframe`}
        sandbox="allow-same-origin"
        scrolling="no"
        onLoad={bindIframeResize}
      />
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: content || '' }}
    />
  );
}
