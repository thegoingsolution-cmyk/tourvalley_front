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
  const h = parseInt(String(hourStr).trim(), 10);
  if (Number.isNaN(h)) {
    return new Date(NaN);
  }
  if (h === 24) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return d;
    d.setDate(d.getDate() + 1);
    return d;
  }
  const hh = String(h).padStart(2, '0');
  return new Date(`${dateStr}T${hh}:00:00`);
}

/**
 * 달력상 `dateStr`이 속한 월을 기준으로, 그로부터 `monthOffset`개월 뒤 달의 말일까지 허용되는
 * 마지막 시각(같은 시 표기). 24시인 경우 그 말일의 24시(= 다음날 00:00 instant).
 * monthOffset: 국내 1, 해외 단기 3
 */
function getInsuranceMaxArrivalInstantFromPickedCalendar(
  dateStr: string,
  hourStr: string,
  monthOffset: number
): Date {
  const h = parseInt(String(hourStr).trim(), 10);
  const segs = dateStr.split('-');
  if (segs.length !== 3) return new Date(NaN);
  const y0 = parseInt(segs[0], 10);
  const mCal = parseInt(segs[1], 10);
  if ([y0, mCal, h].some((n) => Number.isNaN(n))) return new Date(NaN);
  const monthIndex = mCal - 1;
  const targetFirst = new Date(y0, monthIndex + monthOffset, 1);
  const lastDay = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0);
  if (h === 24) {
    return new Date(
      lastDay.getFullYear(),
      lastDay.getMonth(),
      lastDay.getDate() + 1,
      0,
      0,
      0,
      0
    );
  }
  lastDay.setHours(h, 0, 0, 0);
  return lastDay;
}

/** 국내여행보험 최대 도착 시각 (날짜+시 피커 기준) */
export function getDomesticInsuranceMaxArrivalFromPickedDate(
  dateStr: string,
  hourStr: string
): Date {
  return getInsuranceMaxArrivalInstantFromPickedCalendar(dateStr, hourStr, 1);
}

/** 해외여행(단기) 최대 도착 시각 (날짜+시 피커 기준) */
export function getOverseasShortTripMaxArrivalFromPickedDate(
  dateStr: string,
  hourStr: string
): Date {
  return getInsuranceMaxArrivalInstantFromPickedCalendar(dateStr, hourStr, 3);
}

/**
 * 피커 날짜(YYYY-MM-DD)·시(1~24) 기준으로 달력 월을 `monthsToAdd`만큼 더한 시각.
 * 해외장기체류 최소(3개월 초과)·최대(1년) 등에 사용. setMonth/setFullYear 누적 오차·말일 보정에 의존하지 않음.
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
  const d = new Date(y0, mo - 1 + monthsToAdd, day);
  if (h === 24) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  }
  d.setHours(h, 0, 0, 0);
  return d;
}
