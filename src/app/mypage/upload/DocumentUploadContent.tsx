'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  type EventDocSupplementItem,
  collectLabeledUploadFiles,
  fetchCurrentEventDocSupplement,
  lookupGuestEventDocSupplement,
  splitRequestedDocuments,
  uploadGuestEventDocSupplement,
  uploadMemberEventDocSupplement,
} from '@/services/eventDocumentSupplementService';

const UPLOAD_PATH = '/mypage/upload';

function formatKstDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso.slice(0, 16);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(d)
    .replace(/\./g, '-')
    .replace(/,\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function RequestDetail({
  item,
  filesByLabel,
  fallbackFiles,
  onFileForLabelChange,
  onFallbackFilesChange,
  onSubmit,
  submitting,
  error,
  submitLabel,
}: {
  item: EventDocSupplementItem;
  filesByLabel: Record<string, File | undefined>;
  fallbackFiles: File[];
  onFileForLabelChange: (label: string, file: File | undefined) => void;
  onFallbackFilesChange: (files: File[]) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
}) {
  const docLines = splitRequestedDocuments(item.requestedDocuments);
  const ready =
    docLines.length > 0
      ? docLines.every((label) => Boolean(filesByLabel[label]))
      : fallbackFiles.length > 0;

  return (
    <>
      <ul className="doc-upload-meta">
        <li>견적번호: {item.quoteNumericId}</li>
        {item.companyName ? <li>계약자: {item.companyName}</li> : null}
        {item.eventName ? <li>행사명: {item.eventName}</li> : null}
        <li>요청 일시: {formatKstDate(item.requestedAt)}</li>
      </ul>
      <h2>요청 서류</h2>
      {item.status === 'requested' ? (
        <>
          {docLines.length > 0 ? (
            <div className="doc-upload-slots">
              {docLines.map((label, index) => {
                const inputId = `doc-upload-${item.id}-${index}`;
                const selected = filesByLabel[label];
                return (
                  <div key={`${label}-${index}`} className="doc-upload-slot">
                    <label className="doc-upload-slot-label" htmlFor={inputId}>
                      {label}
                    </label>
                    <input
                      id={inputId}
                      type="file"
                      className="doc-upload-file-input"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) =>
                        onFileForLabelChange(label, e.target.files?.[0] ?? undefined)
                      }
                    />
                    {selected ? (
                      <p className="doc-upload-slot-file">{selected.name}</p>
                    ) : (
                      <p className="doc-upload-hint">이 서류를 업로드해 주세요.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <p className="doc-upload-empty">
                {item.requestedDocuments || '요청 서류 내용이 없습니다.'}
              </p>
              <input
                type="file"
                className="doc-upload-file-input"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                multiple
                onChange={(e) => onFallbackFilesChange(Array.from(e.target.files ?? []))}
              />
            </>
          )}
          <p className="doc-upload-hint">PDF, JPG, PNG · 파일당 20MB 이하</p>
          {error ? <p className="doc-upload-error">{error}</p> : null}
          <button
            type="button"
            className="doc-upload-btn"
            disabled={submitting || !ready}
            onClick={onSubmit}
          >
            {submitting ? '제출 중…' : submitLabel}
          </button>
        </>
      ) : docLines.length > 0 ? (
        <ul className="doc-upload-docs">
          {docLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="doc-upload-empty">{item.requestedDocuments || '요청 서류 내용이 없습니다.'}</p>
      )}
    </>
  );
}

function DocumentUploadContentInner() {
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading, member } = useAuth();
  const [memberItem, setMemberItem] = useState<EventDocSupplementItem | null>(null);
  const [guestItem, setGuestItem] = useState<EventDocSupplementItem | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberFilesByLabel, setMemberFilesByLabel] = useState<Record<string, File | undefined>>({});
  const [memberFallbackFiles, setMemberFallbackFiles] = useState<File[]>([]);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberDone, setMemberDone] = useState(false);

  const [quoteRef, setQuoteRef] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [guestLookupError, setGuestLookupError] = useState<string | null>(null);
  const [guestLookupLoading, setGuestLookupLoading] = useState(false);
  const [guestFilesByLabel, setGuestFilesByLabel] = useState<Record<string, File | undefined>>({});
  const [guestFallbackFiles, setGuestFallbackFiles] = useState<File[]>([]);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestDone, setGuestDone] = useState(false);
  const [guestSubmitError, setGuestSubmitError] = useState<string | null>(null);

  const loadMemberRequest = useCallback(async () => {
    if (!member?.id) return;
    setLoadingMember(true);
    setMemberError(null);
    try {
      const result = await fetchCurrentEventDocSupplement(member.id);
      if (!result.success) {
        setMemberError(result.message || '조회에 실패했습니다.');
        setMemberItem(null);
        return;
      }
      setMemberItem(result.item);
      setMemberFilesByLabel({});
      setMemberFallbackFiles([]);
    } catch {
      setMemberError('조회 중 오류가 발생했습니다.');
      setMemberItem(null);
    } finally {
      setLoadingMember(false);
    }
  }, [member?.id]);

  useEffect(() => {
    if (isLoading || !isLoggedIn || !member?.id) return;
    void loadMemberRequest();
  }, [isLoading, isLoggedIn, member?.id, loadMemberRequest]);

  useEffect(() => {
    const ref = searchParams.get('ref')?.trim();
    if (!ref) return;
    setQuoteRef(ref);
  }, [searchParams]);

  const handleMemberSubmit = async () => {
    if (!member?.id || !memberItem) return;
    const files = collectLabeledUploadFiles(
      memberItem.requestedDocuments,
      memberFilesByLabel,
      memberFallbackFiles,
    );
    if (!files || files.length === 0) return;
    setMemberSubmitting(true);
    setMemberError(null);
    try {
      const result = await uploadMemberEventDocSupplement({
        memberId: member.id,
        requestId: memberItem.id,
        files,
      });
      if (!result.success) {
        setMemberError(result.message);
        return;
      }
      setMemberDone(true);
      setMemberItem(result.item ?? { ...memberItem, status: 'submitted' });
      setMemberFilesByLabel({});
      setMemberFallbackFiles([]);
    } catch {
      setMemberError('제출 중 오류가 발생했습니다.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleGuestLookup = async () => {
    setGuestLookupLoading(true);
    setGuestLookupError(null);
    setGuestItem(null);
    setGuestDone(false);
    setGuestFilesByLabel({});
    setGuestFallbackFiles([]);
    try {
      const result = await lookupGuestEventDocSupplement({
        quoteRef: quoteRef.trim(),
        businessNumber: businessNumber.trim(),
      });
      if (!result.success || !result.item) {
        setGuestLookupError(result.message || '조회에 실패했습니다.');
        return;
      }
      setGuestItem(result.item);
    } catch {
      setGuestLookupError('조회 중 오류가 발생했습니다.');
    } finally {
      setGuestLookupLoading(false);
    }
  };

  const handleGuestSubmit = async () => {
    if (!guestItem) return;
    const files = collectLabeledUploadFiles(
      guestItem.requestedDocuments,
      guestFilesByLabel,
      guestFallbackFiles,
    );
    if (!files || files.length === 0) return;
    setGuestSubmitting(true);
    setGuestSubmitError(null);
    try {
      const result = await uploadGuestEventDocSupplement({
        requestId: guestItem.id,
        quoteRef: quoteRef.trim(),
        businessNumber: businessNumber.trim(),
        files,
      });
      if (!result.success) {
        setGuestSubmitError(result.message);
        return;
      }
      setGuestDone(true);
      setGuestItem(result.item ?? { ...guestItem, status: 'submitted' });
      setGuestFilesByLabel({});
      setGuestFallbackFiles([]);
    } catch {
      setGuestSubmitError('제출 중 오류가 발생했습니다.');
    } finally {
      setGuestSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="doc-upload-loading">로딩 중...</div>;
  }

  return (
    <>
      <p className="doc-upload-lead">
        {isLoggedIn
          ? `${member?.name || '고객'}님, 투어밸리에서 요청드린 행사보험 보완 서류를 이 페이지에서 제출해 주세요.`
          : '투어밸리에서 요청드린 행사보험 보완 서류를 제출해 주세요. 회원이시면 로그인 후 제출하거나, 비회원은 견적번호·사업자번호로 조회해 주세요.'}
      </p>
      {!isLoggedIn ? (
        <p className="doc-upload-hint" style={{ textAlign: 'center', marginTop: -12, marginBottom: 20 }}>
          <Link className="doc-upload-link" href={`/login?returnUrl=${encodeURIComponent(UPLOAD_PATH)}`}>
            로그인
          </Link>
          후 회원 제출이 가능합니다.
        </p>
      ) : null}

      {memberDone || guestDone ? (
        <div className="doc-upload-success">
          서류 제출이 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.
        </div>
      ) : null}

      {isLoggedIn ? (
        <section className="doc-upload-card">
          <h2>회원 제출</h2>
          {loadingMember ? (
            <p className="doc-upload-empty">요청 내역을 불러오는 중입니다…</p>
          ) : memberItem && memberItem.status === 'requested' ? (
            <RequestDetail
              item={memberItem}
              filesByLabel={memberFilesByLabel}
              fallbackFiles={memberFallbackFiles}
              onFileForLabelChange={(label, file) =>
                setMemberFilesByLabel((prev) => ({ ...prev, [label]: file }))
              }
              onFallbackFilesChange={setMemberFallbackFiles}
              onSubmit={() => void handleMemberSubmit()}
              submitting={memberSubmitting}
              error={memberError}
              submitLabel="서류 제출하기"
            />
          ) : memberItem?.status === 'submitted' && !memberDone ? (
            <p className="doc-upload-empty">이미 제출 완료된 서류보완 요청입니다.</p>
          ) : (
            <p className="doc-upload-empty">
              현재 제출 가능한 서류보완 요청이 없습니다.
              <br />
              알림톡을 받으신 뒤 다시 시도해 주세요.
            </p>
          )}
          {memberError && !memberItem ? <p className="doc-upload-error">{memberError}</p> : null}
          <button
            type="button"
            className="doc-upload-btn doc-upload-btn--secondary"
            onClick={() => void loadMemberRequest()}
          >
            새로고침
          </button>
        </section>
      ) : null}

      <section className="doc-upload-card">
        <h2>비회원 조회 · 제출</h2>
        <p className="doc-upload-hint">알림톡에 안내된 견적번호와 사업자등록번호로 조회합니다.</p>
        <div className="doc-upload-form-group">
          <label htmlFor="quoteRef">견적번호</label>
          <input
            id="quoteRef"
            className="doc-upload-input"
            value={quoteRef}
            onChange={(e) => setQuoteRef(e.target.value)}
            placeholder="예: 2078"
          />
        </div>
        <div className="doc-upload-form-group">
          <label htmlFor="bizNo">사업자등록번호</label>
          <input
            id="bizNo"
            className="doc-upload-input"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value.replace(/[^0-9-]/g, ''))}
            placeholder="숫자만 입력"
          />
        </div>
        <button
          type="button"
          className="doc-upload-btn"
          disabled={guestLookupLoading || !quoteRef.trim() || !businessNumber.trim()}
          onClick={() => void handleGuestLookup()}
        >
          {guestLookupLoading ? '조회 중…' : '요청 조회'}
        </button>
        {guestLookupError ? <p className="doc-upload-error">{guestLookupError}</p> : null}

        {guestItem ? (
          <div style={{ marginTop: 20 }}>
            <RequestDetail
              item={guestItem}
              filesByLabel={guestFilesByLabel}
              fallbackFiles={guestFallbackFiles}
              onFileForLabelChange={(label, file) =>
                setGuestFilesByLabel((prev) => ({ ...prev, [label]: file }))
              }
              onFallbackFilesChange={setGuestFallbackFiles}
              onSubmit={() => void handleGuestSubmit()}
              submitting={guestSubmitting}
              error={guestSubmitError}
              submitLabel="서류 제출하기"
            />
          </div>
        ) : null}
      </section>
    </>
  );
}

export default function DocumentUploadContent() {
  return (
    <Suspense fallback={<div className="doc-upload-loading">로딩 중...</div>}>
      <DocumentUploadContentInner />
    </Suspense>
  );
}
