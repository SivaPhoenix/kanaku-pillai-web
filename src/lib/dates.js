// Calendar dates are Date objects fixed at 12:00 UTC, so their year/month/day never shift with the
// viewer's zone. Use todayInZone() for "today" in the user's time zone and format with the default UTC.

const DAY_MS = 24 * 60 * 60 * 1000;

function utcNoon(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

function partsOf(date, timeZone, options, locale) {
  const parts = new Intl.DateTimeFormat(locale, { timeZone, ...options }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

// Current calendar date in the given IANA zone, as a UTC-noon Date.
export function todayInZone(timeZone, now = new Date()) {
  const p = partsOf(now, timeZone, { year: "numeric", month: "numeric", day: "numeric" }, "en-US");
  return utcNoon(Number(p.year), Number(p.month) - 1, Number(p.day));
}

export function formatMonthYear(date, { locale = "en-IN", timeZone = "UTC" } = {}) {
  const p = partsOf(date, timeZone, { month: "long", year: "numeric" }, locale);
  return `${p.month} ${p.year}`;
}

function formatDay(date, weekday, { locale = "en-IN", timeZone = "UTC" } = {}) {
  const p = partsOf(date, timeZone, { weekday, day: "numeric", month: "short" }, locale);
  return `${p.weekday}, ${p.day} ${p.month}`;
}

export function formatDayLong(date, options) {
  return formatDay(date, "long", options);
}

export function formatDayShort(date, options) {
  return formatDay(date, "short", options);
}

export function formatWeekdayShort(date, { locale = "en-IN", timeZone = "UTC" } = {}) {
  return partsOf(date, timeZone, { weekday: "short" }, locale).weekday;
}

export function formatDayNumber(date, { locale = "en-IN", timeZone = "UTC" } = {}) {
  return partsOf(date, timeZone, { day: "numeric" }, locale).day;
}

// 7 dates of the week containing `date`. weekStart: "mon" (default) or "sun".
export function weekDays(date, weekStart = "mon") {
  const startsOnSunday = weekStart === "sun" || weekStart === "sunday" || weekStart === 0;
  const dow = date.getUTCDay();
  const offset = startsOnSunday ? dow : (dow + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => addDays(date, i - offset));
}

export function addDays(date, n) {
  return new Date(date.getTime() + n * DAY_MS);
}

// Keeps the day of month where possible and clamps to the last day (31 Jan + 1 month = 28/29 Feb).
export function addMonths(date, n) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1, 12));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

export function startOfMonth(date) {
  return utcNoon(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function isSameDay(a, b, timeZone = "UTC") {
  const key = (d) =>
    partsOf(d, timeZone, { year: "numeric", month: "numeric", day: "numeric" }, "en-US");
  const x = key(a);
  const y = key(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

const pad = (n) => String(n).padStart(2, "0");

export function toMonthParam(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function toDayParam(date) {
  return `${toMonthParam(date)}-${pad(date.getUTCDate())}`;
}

// Returns the first day of the month at UTC noon, or null for anything that is not YYYY-MM.
export function parseMonthParam(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value ?? "");
  return match ? utcNoon(Number(match[1]), Number(match[2]) - 1, 1) : null;
}

export function parseDayParam(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const date = utcNoon(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toDayParam(date) === value ? date : null;
}
