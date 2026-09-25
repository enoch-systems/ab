/**
 * Deterministic date / time formatting.
 *
 * Anything that is rendered on the server *and* on the client must format
 * identically in both environments, otherwise React 19 aborts hydration with
 * "Hydration failed because the server rendered text didn't match the client".
 *
 * `Date#toLocaleString` and `Intl.DateTimeFormat` are not safe for that job:
 *
 *   1. the *pattern* is contributed by the engine's bundled CLDR data, so the
 *      separator and the 12/24-hour shape are not guaranteed to agree between
 *      runtimes (we measured JavaScriptCore printing "Sep 24, 2026 at 01:44 AM"
 *      for options that Node prints as "Sep 24, 2026, 01:44 AM");
 *   2. the output follows the runtime's time zone unless `timeZone` is pinned,
 *      and Next renders on the server (Node, e.g. Africa/Lagos) while the
 *      browser renders in the visitor's zone;
 *   3. the pattern for a given locale can change with the bundled ICU/CLDR
 *      version, so even a pinned `en-US` is not guaranteed byte stable.
 *
 * These helpers therefore never call Intl. They read the UTC components of the
 * instant with `getUTC*` and assemble the string from fixed tables, so Node,
 * V8, JavaScriptCore and SpiderMonkey all return the exact same characters.
 *
 * Timestamps are displayed in UTC on purpose: shipment events are recorded as
 * UTC ISO strings, so every surface (customer, admin, tracking) shows the same
 * wall clock for the same event no matter where it is opened.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Placeholder used everywhere a timestamp is missing or unparseable. */
export const DATE_PLACEHOLDER = '—';

interface UtcParts {
  year: number;
  monthIndex: number;
  day: number;
  weekdayIndex: number;
  /** 0–23 */
  hour: number;
  minute: number;
}

/** UTC calendar parts of `iso`, or `null` when it is not a valid date. */
function utcParts(iso: string | number | Date | null | undefined): UtcParts | null {
  if (iso === null || iso === undefined || iso === '') return null;
  const date = iso instanceof Date ? iso : new Date(iso);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate(),
    weekdayIndex: date.getUTCDay(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

/** `01` … `12` plus the meridiem, matching `hour: '2-digit'` + `hour12: true`. */
function clock(hour24: number, minute: number): { time: string; dayPeriod: string } {
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    time: `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    dayPeriod: hour24 < 12 ? 'AM' : 'PM',
  };
}

/** `Sep 24, 2026` — the compact date used in lists and cards. */
export function formatDate(iso: string | number | Date | null | undefined): string {
  const p = utcParts(iso);
  if (!p) return DATE_PLACEHOLDER;
  return `${MONTHS_SHORT[p.monthIndex]} ${p.day}, ${p.year}`;
}

/** `September 24, 2026` — the long date used on invoices-style surfaces. */
export function formatLongDate(iso: string | number | Date | null | undefined): string {
  const p = utcParts(iso);
  if (!p) return DATE_PLACEHOLDER;
  return `${MONTHS_LONG[p.monthIndex]} ${p.day}, ${p.year}`;
}

/** `01:44 AM` — clock time only. */
export function formatTime(iso: string | number | Date | null | undefined): string {
  const p = utcParts(iso);
  if (!p) return DATE_PLACEHOLDER;
  const { time, dayPeriod } = clock(p.hour, p.minute);
  return `${time} ${dayPeriod}`;
}

/** `Sep 24, 2026, 01:44 AM` — the combined stamp used on tracking surfaces. */
export function formatDateTime(iso: string | number | Date | null | undefined): string {
  const p = utcParts(iso);
  if (!p) return DATE_PLACEHOLDER;
  const { time, dayPeriod } = clock(p.hour, p.minute);
  return `${MONTHS_SHORT[p.monthIndex]} ${p.day}, ${p.year}, ${time} ${dayPeriod}`;
}

/** `September 2026` — month granularity, e.g. "Member since". */
export function formatMonthYear(iso: string | number | Date | null | undefined): string {
  const p = utcParts(iso);
  if (!p) return DATE_PLACEHOLDER;
  return `${MONTHS_LONG[p.monthIndex]} ${p.year}`;
}

/** `Thursday, September 24` — weekday first, for "today" style captions. */
export function formatWeekdayDate(iso: string | number | Date | null | undefined): string {
  const p = utcParts(iso);
  if (!p) return DATE_PLACEHOLDER;
  return `${WEEKDAYS_LONG[p.weekdayIndex]}, ${MONTHS_LONG[p.monthIndex]} ${p.day}`;
}

/**
 * `3 min ago` / `in 2 days` — distance between `iso` and the caller supplied
 * `nowMs` (epoch milliseconds), computed with plain arithmetic so Node and the
 * browser always agree on the wording.
 *
 * `nowMs` is an explicit argument on purpose: live surfaces must read the clock
 * from a client effect (`useLiveNow`) rather than `Date.now()` during render,
 * otherwise the server text and the first client text differ and React aborts
 * hydration.
 */
export function formatRelative(
  iso: string | number | Date | null | undefined,
  nowMs: number,
): string {
  const date = iso === null || iso === undefined || iso === '' ? null : iso instanceof Date ? iso : new Date(iso);
  const time = date?.getTime();
  if (time === undefined || !Number.isFinite(time)) return DATE_PLACEHOLDER;

  const deltaSeconds = Math.round((nowMs - time) / 1000);
  const seconds = Math.abs(deltaSeconds);

  if (seconds < 45) return deltaSeconds >= 0 ? 'just now' : 'in a moment';

  /* Minutes are abbreviated without a plural ("2 min ago"), the rest read as words. */
  const value = (unitSeconds: number) => Math.max(1, Math.round(seconds / unitSeconds));
  let phrase: string;
  if (seconds < 3600) phrase = `${value(60)} min`;
  else if (seconds < 86400) phrase = `${value(3600)} ${value(3600) === 1 ? 'hour' : 'hours'}`;
  else if (seconds < 2592000) phrase = `${value(86400)} ${value(86400) === 1 ? 'day' : 'days'}`;
  else if (seconds < 31536000) phrase = `${value(2592000)} ${value(2592000) === 1 ? 'month' : 'months'}`;
  else phrase = `${value(31536000)} ${value(31536000) === 1 ? 'year' : 'years'}`;

  return deltaSeconds >= 0 ? `${phrase} ago` : `in ${phrase}`;
}

/**
 * Calendar parts of the visitor's *local* time, built without Intl so the text
 * is engine independent. Used for "today" captions that would otherwise change
 * between the server render and the client render.
 */
export function formatLocalWeekdayDate(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}
