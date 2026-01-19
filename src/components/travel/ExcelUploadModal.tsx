'use client';

import React, { useState } from 'react';
import { Participant } from './types';

// xlsx 라이브러리 동적 import
let XLSX: any;
if (typeof window !== 'undefined') {
  try {
    XLSX = require('xlsx');
  } catch (e) {
    console.warn('xlsx 라이브러리가 설치되지 않았습니다. npm install xlsx를 실행해주세요.');
  }
}

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (participants: Participant[], startId: number) => void;
  excelTemplatePath?: string;
  currentParticipants?: Participant[]; // 기존 참가자 목록 (ID 계산용)
}

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onUpload,
  excelTemplatePath = '/excel/sample_insured_ssn.xls',
  currentParticipants = [],
}: ExcelUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const parseExcelFile = async (file: File): Promise<Participant[]> => {
    return new Promise((resolve, reject) => {
      if (!XLSX) {
        reject(new Error('xlsx 라이브러리가 설치되지 않았습니다. npm install xlsx를 실행해주세요.'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('파일을 읽을 수 없습니다.'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          // 헤더 행 제거 (첫 번째 행)
          if (jsonData.length === 0) {
            reject(new Error('파일이 비어있습니다.'));
            return;
          }

          // 헤더 검증 (선택적)
          const headers = jsonData[0];
          const expectedHeaders = ['이름', '성별', '생년월일'];
          const hasValidHeaders = expectedHeaders.every(header => 
            headers.some((h: any) => String(h).trim() === header)
          );

          if (!hasValidHeaders) {
            console.warn('헤더 형식이 예상과 다를 수 있습니다. 계속 진행합니다.');
          }

          // 데이터 파싱
          const participants: Participant[] = [];
          const startId = currentParticipants.length > 0 
            ? Math.max(...currentParticipants.map(p => p.id)) + 1 
            : 1;

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 3) continue;

            const name = String(row[0] || '').trim();
            const genderStr = String(row[1] || '').trim();
            let birthDateStr = String(row[2] || '').trim().replace(/[^0-9]/g, '');

            // 유효성 검증
            if (!name || !genderStr || !birthDateStr) continue;
            
            // 주민번호 형태(13자리)인 경우 생년월일(앞 6자리)만 추출
            if (birthDateStr.length === 13) {
              const yy = birthDateStr.substring(0, 2);
              const mm = birthDateStr.substring(2, 4);
              const dd = birthDateStr.substring(4, 6);
              // 주민번호 앞자리가 50 이상이면 1900년대, 아니면 2000년대
              const yearPrefix = parseInt(yy) >= 50 ? '19' : '20';
              birthDateStr = `${yearPrefix}${yy}${mm}${dd}`;
            } else if (birthDateStr.length > 8) {
              // 8자리보다 긴 경우 앞 8자리만 사용
              birthDateStr = birthDateStr.substring(0, 8);
            }
            
            // 최종 검증: 8자리가 아니면 건너뜀
            if (birthDateStr.length !== 8) continue;

            // 성별 변환: "남" -> "남자", "여" -> "여자"
            let gender: '남자' | '여자' = '남자';
            if (genderStr === '여' || genderStr === '여자' || genderStr.toLowerCase() === 'f' || genderStr.toLowerCase() === 'female') {
              gender = '여자';
            } else if (genderStr === '남' || genderStr === '남자' || genderStr.toLowerCase() === 'm' || genderStr.toLowerCase() === 'male') {
              gender = '남자';
            } else {
              continue; // 유효하지 않은 성별은 건너뜀
            }

            participants.push({
              id: startId + participants.length,
              name: name,
              nationality: '내국인', // 기본값
              birthDate: birthDateStr,
              gender: gender,
              email1: '',
              email2: '',
              phone: '',
              isVerified: false,
            });
          }

          if (participants.length === 0) {
            reject(new Error('유효한 데이터를 찾을 수 없습니다. 파일 형식을 확인해주세요.'));
            return;
          }

          resolve(participants);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = excelTemplatePath;
    link.download = 'sample_insured_ssn.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const participants = await parseExcelFile(selectedFile);
      const startId = currentParticipants.length > 0 
        ? Math.max(...currentParticipants.map(p => p.id)) + 1 
        : 1;

      if (onUpload) {
        onUpload(participants, startId);
        alert(`${participants.length}명의 가입자 정보가 등록되었습니다.`);
        setSelectedFile(null);
        onClose();
      } else {
        alert('파일 업로드 기능이 설정되지 않았습니다.');
      }
    } catch (error) {
      console.error('Excel 파싱 오류:', error);
      alert(error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">엑셀 등록하기</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            엑셀 파일을 이용하여 가입자를 쉽게 등록할 수 있습니다.<br />
            아래 양식을 다운로드하여 작성 후 업로드해주세요.
          </p>

          <button
            className="excel-download-btn"
            onClick={handleDownload}
          >
            Excel양식 파일받기
          </button>

          <div className="excel-example-table">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>성별</th>
                  <th>생년월일(8자리)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>홍길동</td>
                  <td>남</td>
                  <td>19950101</td>
                </tr>
                <tr>
                  <td>홍길녀</td>
                  <td>여</td>
                  <td>20010305</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="excel-notes">
            <ul>
              <li>- 반드시 피보험자 전체리스트를 업로드 해주셔야 합니다.(개인)</li>
              <li>- 대표가입자(피보험자)를 제외한 동반가입자(피보험자) 리스트를 업로드해야 합니다.(단체)</li>
              <li>- 외국인은 외국인 등록번호가 있는 사람만 가입이 가능합니다.</li>
            </ul>
          </div>

          <div className="file-upload-section">
            <h3>파일 업로드</h3>
            <div className="file-upload-controls">
              <input
                type="file"
                id="excel-file-input"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <button
                className="file-select-btn"
                onClick={() => document.getElementById('excel-file-input')?.click()}
              >
                파일선택
              </button>
              <div className="file-selected-info">
                {selectedFile ? selectedFile.name : '선택된 파일 없음'}
              </div>
            </div>
            <button
              className="file-upload-submit-btn"
              onClick={handleUpload}
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? '처리 중...' : '파일 업로드 하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

