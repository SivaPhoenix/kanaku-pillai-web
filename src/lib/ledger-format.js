// Formatting and calendar helpers for ledger data. Dates from the API are "YYYY-MM-DD" (localDate) or "YYYY-MM" (month)
// strings in the user's calendar; instants are ISO strings shown in the zone the entry was recorded in.

const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" → a Date at 12:00 UTC, so formatting with timeZone "UTC" never shifts the day.
function noonUtc(localDate) {
  const [y, m, d] = localDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function todayLocalDate(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function currentMonth(timeZone) {
  return todayLocalDate(timeZone).slice(0, 7);
}

export function shiftDay(localDate, days) {
  const date = noonUtc(localDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shiftMonth(month, months) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, 1, 12));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function daysInMonth(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// "Thu, 22 Oct"
export function formatLocalDate(localDate, { locale = "en-IN", style = "short" } = {}) {
  const options =
    style === "long"
      ? { weekday: "long", day: "numeric", month: "short" }
      : style === "full"
        ? { weekday: "short", day: "numeric", month: "short", year: "numeric" }
        : { weekday: "short", day: "numeric", month: "short" };
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
    noonUtc(localDate),
  );
}

// "October 2026"
export function formatMonth(month, { locale = "en-IN" } = {}) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(noonUtc(`${month}-01`));
}

// "Oct"
export function formatMonthShort(month, { locale = "en-IN" } = {}) {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(
    noonUtc(`${month}-01`),
  );
}

// "1:20 PM" in the zone the entry was recorded in.
export function formatTime(isoInstant, { locale = "en-IN", timeZone = "UTC" } = {}) {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(
    new Date(isoInstant),
  );
}

function wallClockParts(instantMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instantMs));
  const get = (type) => Number(parts.find((part) => part.type === type).value);
  return Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
}

// Wall-clock date + time in a zone → ISO instant (handles DST by re-checking the offset once).
export function toInstant(localDate, localTime, timeZone) {
  const [y, m, d] = localDate.split("-").map(Number);
  const [hh, mm] = localTime.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let utc = wall - (wallClockParts(wall, timeZone) - wall);
  utc = wall - (wallClockParts(utc, timeZone) - utc);
  return new Date(utc).toISOString();
}

// ISO instant → { localDate, localTime } as seen in a zone (for prefilling date/time inputs).
export function toLocalParts(isoInstant, timeZone) {
  const wall = new Date(wallClockParts(new Date(isoInstant).getTime(), timeZone));
  return {
    localDate: wall.toISOString().slice(0, 10),
    localTime: `${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}`,
  };
}

// Newest-first entries → [{ localDate, items, netMinor }] where net counts income minus expense (transfers excluded).
export function groupByLocalDate(items) {
  const groups = [];
  for (const item of items) {
    let group = groups.at(-1);
    if (!group || group.localDate !== item.localDate) {
      group = { localDate: item.localDate, items: [], netMinor: 0 };
      groups.push(group);
    }
    group.items.push(item);
    if (item.type === "income") group.netMinor += item.amountMinor;
    if (item.type === "expense") group.netMinor -= item.amountMinor;
  }
  return groups;
}

// Short axis label for a large amount: 15000 rupees → "15k" (input in minor units).
export function compactAmount(minor, { currencyCode = "INR", locale = "en-IN" } = {}) {
  const digits = new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
  }).resolvedOptions().maximumFractionDigits;
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    minor / 10 ** digits,
  );
}
