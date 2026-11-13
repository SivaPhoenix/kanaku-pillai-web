export function minorDigits(currencyCode) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
    }).resolvedOptions().maximumFractionDigits;
  } catch {
    return 2;
  }
}

export function formatMoney(minor, { currencyCode = "INR", locale = "en-IN", type } = {}) {
  const digits = minorDigits(currencyCode);
  const signed = type === "income" || type === "expense";
  const value = (signed ? Math.abs(minor) : minor) / 10 ** digits;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(value);
  if (type === "income") return `+${formatted}`;
  if (type === "expense") return `\u2212${formatted}`;
  return formatted;
}

// String math only: never parseFloat(x) * 100.
export function parseAmountToMinor(text, currencyCode) {
  if (typeof text !== "string") return null;
  const cleaned = text.trim().replace(/,/g, "");
  const match = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match) return null;
  const whole = match[1] ?? "";
  const fraction = match[2] ?? "";
  if (whole === "" && fraction === "") return null;
  const digits = minorDigits(currencyCode);
  if (fraction.length > digits) return null;
  const minor = Number(`${whole || "0"}${fraction.padEnd(digits, "0")}`);
  return Number.isSafeInteger(minor) ? minor : null;
}
