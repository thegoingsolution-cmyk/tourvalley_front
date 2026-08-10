export type EventDocSupplementFile = {
  id: number;
  originalName: string;
  url: string;
  createdAt: string;
};

export type EventDocSupplementItem = {
  id: number;
  contractId: number;
  quoteNumericId: number;
  memberId: number | null;
  requestedDocuments: string;
  status: 'requested' | 'submitted' | 'cancelled';
  requestedAt: string;
  submittedAt: string | null;
  eventName: string | null;
  companyName: string | null;
  files: EventDocSupplementFile[];
};

export function splitRequestedDocuments(raw: string): string[] {
  return String(raw || '')
    .split(/\n/)
    .map((line) => line.replace(/^[-·•\s]+/, '').trim())
    .filter(Boolean);
}

/** 제출 시 관리자가 서류 종류를 구분할 수 있도록 파일명에 라벨을 붙입니다. */
export function fileWithDocumentLabel(file: File, label: string): File {
  const safe = label.replace(/[/\\?%*:|"<>]/g, '').trim() || '서류';
  const prefix = `[${safe}] `;
  if (file.name.startsWith(prefix)) return file;
  return new File([file], `${prefix}${file.name}`, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

export function collectLabeledUploadFiles(
  requestedDocuments: string,
  filesByLabel: Record<string, File | undefined>,
  fallbackFiles: File[] = [],
): File[] | null {
  const labels = splitRequestedDocuments(requestedDocuments);
  if (labels.length === 0) {
    return fallbackFiles.length > 0 ? fallbackFiles : null;
  }
  const out: File[] = [];
  for (const label of labels) {
    const file = filesByLabel[label];
    if (!file) return null;
    out.push(fileWithDocumentLabel(file, label));
  }
  return out;
}

export async function fetchCurrentEventDocSupplement(
  memberId: number,
): Promise<{ success: boolean; message?: string; item: EventDocSupplementItem | null }> {
  const res = await fetch(`/api/event-document-supplement/current?memberId=${memberId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = (await res.json()) as {
    success?: boolean;
    message?: string;
    item?: EventDocSupplementItem | null;
  };
  if (!res.ok) {
    return { success: false, message: data.message || '조회에 실패했습니다.', item: null };
  }
  return { success: true, item: data.item ?? null };
}

export async function lookupGuestEventDocSupplement(params: {
  quoteRef: string;
  businessNumber: string;
}): Promise<{ success: boolean; message?: string; item?: EventDocSupplementItem }> {
  const res = await fetch('/api/event-document-supplement/guest/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as {
    success?: boolean;
    message?: string;
    item?: EventDocSupplementItem;
  };
  if (!res.ok || !data.success || !data.item) {
    return { success: false, message: data.message || '조회에 실패했습니다.' };
  }
  return { success: true, item: data.item };
}

export async function uploadMemberEventDocSupplement(params: {
  memberId: number;
  requestId: number;
  files: File[];
}): Promise<{ success: boolean; message: string; item?: EventDocSupplementItem }> {
  const form = new FormData();
  form.append('memberId', String(params.memberId));
  form.append('requestId', String(params.requestId));
  params.files.forEach((f) => form.append('files', f));
  const res = await fetch('/api/event-document-supplement/member/upload', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as {
    success?: boolean;
    message?: string;
    item?: EventDocSupplementItem;
  };
  if (!res.ok || !data.success) {
    return { success: false, message: data.message || '제출에 실패했습니다.' };
  }
  return { success: true, message: data.message || '서류가 제출되었습니다.', item: data.item };
}

export async function uploadGuestEventDocSupplement(params: {
  requestId: number;
  quoteRef: string;
  businessNumber: string;
  files: File[];
}): Promise<{ success: boolean; message: string; item?: EventDocSupplementItem }> {
  const form = new FormData();
  form.append('requestId', String(params.requestId));
  form.append('quoteRef', params.quoteRef);
  form.append('businessNumber', params.businessNumber);
  params.files.forEach((f) => form.append('files', f));
  const res = await fetch('/api/event-document-supplement/guest/upload', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as {
    success?: boolean;
    message?: string;
    item?: EventDocSupplementItem;
  };
  if (!res.ok || !data.success) {
    return { success: false, message: data.message || '제출에 실패했습니다.' };
  }
  return { success: true, message: data.message || '서류가 제출되었습니다.', item: data.item };
}
