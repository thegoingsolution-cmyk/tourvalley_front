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

/**
 * 가입 화면의 날짜(YYYY-MM-DD) + 시(1~24)를 절대 시각으로 변환.
 * 24시는 "해당 날짜의 끝"이므로 다음날 00:00으로 두어, `new Date('...T24:00:00')`처럼
 * 월이 밀리며 최대기간이 잘못 계산되는 것을 막음.
 */
export function parseInsuranceDateHourToInstant(dateStr: string, hourStr: string): Date {
  const normalizedDate = String(dateStr).trim().replace(/\./g, '-');
  const h = parseInt(String(hourStr).trim(), 10);
  if (Number.isNaN(h)) {
    return new Date(NaN);
  }
  if (h === 24) {
    const d = new Date(`${normalizedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return d;
    d.setDate(d.getDate() + 1);
    return d;
  }
  const hh = String(h).padStart(2, '0');
  return new Date(`${normalizedDate}T${hh}:00:00`);
}

const MIN_DEPARTURE_LEAD_MS = 2 * 60 * 60 * 1000;

/** 출발일시가 가입(결제) 시점 기준 현재 시 0분 + 2시간 이후인지 */
export function isDepartureAtLeastTwoHoursFromNow(dateStr: string, timeStr: string): boolean {
  const dep = parseInsuranceDateHourToInstant(dateStr, timeStr);
  if (Number.isNaN(dep.getTime())) return false;
  const now = new Date();
  const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
  return dep.getTime() >= currentHourStart + MIN_DEPARTURE_LEAD_MS;
}

/**
 * 피커 날짜(YYYY-MM-DD)·시(1~24) 기준으로 달력 월을 `monthsToAdd`만큼 더한 시각.
 * - 같은 '일'이 목표 월에 없으면 해당 월 말일로 맞춤 (예: 1/31 + 1개월 → 2/28).
 * - `new Date(y, m+n, day)` 오버플로우(예: 1/31+1→3월)에 의존하지 않음.
 * 해외 단기 최대·국내 최대·국내/해외 장기 등에 사용.
 */
export function addInsuranceCalendarMonthsToPickedInstant(
  dateStr: string,
  hourStr: string,
  monthsToAdd: number
): Date {
  const segs = dateStr.split('-');
  if (segs.length !== 3) return new Date(NaN);
  const y0 = parseInt(segs[0], 10);
  const mo = parseInt(segs[1], 10);
  const day = parseInt(segs[2], 10);
  const h = parseInt(String(hourStr).trim(), 10);
  if ([y0, mo, day, h].some((n) => Number.isNaN(n))) return new Date(NaN);

  const monthZeroIndex = mo - 1;
  const targetFirstOfMonth = new Date(y0, monthZeroIndex + monthsToAdd, 1);
  const lastDayInTargetMonth = new Date(
    targetFirstOfMonth.getFullYear(),
    targetFirstOfMonth.getMonth() + 1,
    0
  ).getDate();
  const dayClamped = Math.min(day, lastDayInTargetMonth);
  const d = new Date(
    targetFirstOfMonth.getFullYear(),
    targetFirstOfMonth.getMonth(),
    dayClamped
  );

  if (h === 24) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  }
  d.setHours(h, 0, 0, 0);
  return d;
}

/** 국내여행보험 최대 도착 시각 (날짜+시 피커 기준, 출발일 + 1달) */
export function getDomesticInsuranceMaxArrivalFromPickedDate(
  dateStr: string,
  hourStr: string
): Date {
  return addInsuranceCalendarMonthsToPickedInstant(dateStr, hourStr, 1);
}

/** 해외여행(단기) 최대 도착 시각 (날짜+시 피커 기준, 출발일 + 3달) */
export function getOverseasShortTripMaxArrivalFromPickedDate(
  dateStr: string,
  hourStr: string
): Date {
  return addInsuranceCalendarMonthsToPickedInstant(dateStr, hourStr, 3);
}
