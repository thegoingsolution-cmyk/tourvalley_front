'use client';

import React from 'react';

/**
 * PDF 다운로드 테스트 페이지
 * 알리고 알림톡에서 사용할 URL 예시
 */
export default function PDFDownloadPage() {
  const pdfFiles = [
    { type: 'domestic', title: 'ACE손해 국내여행보험 약관' },
    { type: 'overseas', title: 'ACE손해 해외여행보험 약관' },
    { type: 'longterm', title: '해외장기체류보험 약관' },
  ];

  const handleDownload = (type: string) => {
    // 백엔드 API를 통한 다운로드
    const downloadUrl = `/api/pdf/download/${type}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>약관 다운로드</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>📱 알림톡에서 사용할 URL</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          아래 URL을 알리고 알림톡 버튼에 설정하세요.
        </p>
        
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', marginBottom: '10px' }}>
          <strong>국내여행보험:</strong>
          <pre style={{ fontSize: '12px', wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginTop: '5px' }}>
{`https://your-domain.com/api/pdf/download/domestic`}
          </pre>
        </div>
        
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', marginBottom: '10px' }}>
          <strong>해외여행보험:</strong>
          <pre style={{ fontSize: '12px', wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginTop: '5px' }}>
{`https://your-domain.com/api/pdf/download/overseas`}
          </pre>
        </div>
        
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', marginBottom: '10px' }}>
          <strong>해외장기체류보험:</strong>
          <pre style={{ fontSize: '12px', wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginTop: '5px' }}>
{`https://your-domain.com/api/pdf/download/longterm`}
          </pre>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>📄 다운로드 가능한 약관</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pdfFiles.map((file) => (
            <li 
              key={file.type}
              style={{
                marginBottom: '10px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div>{file.title}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  타입: {file.type}
                </div>
              </div>
              <button
                onClick={() => handleDownload(file.type)}
                style={{
                  padding: '8px 16px',
                  background: '#2843e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                다운로드
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#fff3cd', borderRadius: '4px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>💡 사용 방법</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>알리고 알림톡 템플릿에서 버튼 추가</li>
          <li>버튼 타입: 웹 링크(WL)</li>
          <li>버튼 링크: <code>https://your-domain.com/api/pdf/download/타입</code></li>
          <li>타입: <code>domestic</code> (국내) / <code>overseas</code> (해외) / <code>longterm</code> (장기체류)</li>
          <li>버튼을 클릭하면 PDF가 자동으로 다운로드됩니다</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#d1ecf1', borderRadius: '4px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>🔗 API 엔드포인트</h3>
        <p><strong>GET</strong> /api/pdf/download/:type</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          파라미터: type (보험 타입)
        </p>
        <ul style={{ fontSize: '14px', color: '#666', marginTop: '10px', paddingLeft: '20px' }}>
          <li><code>domestic</code> - 국내여행보험</li>
          <li><code>overseas</code> - 해외여행보험</li>
          <li><code>longterm</code> - 해외장기체류보험</li>
        </ul>
      </div>
    </div>
  );
}

