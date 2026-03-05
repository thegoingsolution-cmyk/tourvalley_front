/**
 * B2C 보험기간 등 날짜/시간 표시용 유틸
 * 한국시간(KST) 기준, 00:00은 전날 24시로 표시.
 */

const KST_FORMAT_DATE = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const KST_FORMAT_DATETIME = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatDateTimePart(value: string): string {
  const raw = String(value).trim();
  const isUtcOrTz = /Z|[+-]\d{2}:?\d{2}$/.test(raw);
  if (!isUtcOrTz) {
    const withTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (withTime) {
      const [, y, m, d, h, min] = withTime;
      const hour = parseInt(h, 10);
      const minute = parseInt(min, 10);
      if (hour === 0 && minute === 0) {
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 0, 0, 0);
        date.setDate(date.getDate() - 1);
        const py = date.getFullYear(),
          pm = String(date.getMonth() + 1).padStart(2, '0'),
          pd = String(date.getDate()).padStart(2, '0');
        return `${py}.${pm}.${pd} 24시`;
      }
      return `${y}.${m}.${d} ${hour}시`;
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = KST_FORMAT_DATETIME.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const y = get('year'),
    month = get('month'),
    day = get('day'),
    h = get('hour'),
    min = get('minute');
  const hourNum = parseInt(h, 10);
  const minNum = parseInt(min, 10);
  if (hourNum === 0 && minNum === 0) {
    const prevDay = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const prevParts = KST_FORMAT_DATE.formatToParts(prevDay);
    const py = prevParts.find((p) => p.type === 'year')?.value ?? '';
    const pm = prevParts.find((p) => p.type === 'month')?.value ?? '';
    const pd = prevParts.find((p) => p.type === 'day')?.value ?? '';
    return `${py}.${pm}.${pd} 24시`;
  }
  return `${y}.${month}.${day} ${hourNum}시`;
}

/** 한국시간(KST) 기준 YYYY.MM.DD N시 표시, 00:00은 전날 24시. 빈 값이면 '-' */
export function formatInsuranceDateTime(value?: string | null): string {
  if (!value) return '-';
  return formatDateTimePart(value);
}

/** 보험기간: start ~ end (동일 형식). 빈 값이면 emptyValue */
export function formatInsurancePeriod(
  start?: string | null,
  end?: string | null,
  emptyValue: string = '-'
): string {
  if (!start || !end) return emptyValue;
  return `${formatDateTimePart(start)} ~ ${formatDateTimePart(end)}`;
}
