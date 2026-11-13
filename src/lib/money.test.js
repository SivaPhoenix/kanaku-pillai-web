import { describe, it, expect } from "vitest";
import { formatMoney, minorDigits, parseAmountToMinor } from "./money.js";

describe("minorDigits", () => {
  it("knows zero, two and three digit currencies", () => {
    expect(minorDigits("JPY")).toBe(0);
    expect(minorDigits("KRW")).toBe(0);
    expect(minorDigits("INR")).toBe(2);
    expect(minorDigits("KWD")).toBe(3);
  });
});

describe("formatMoney", () => {
  const inr = { currencyCode: "INR", locale: "en-IN" };

  it("groups INR the Indian way", () => {
    expect(formatMoney(12345650, inr)).toBe("₹1,23,456.50");
  });

  it("prefixes income with a plus", () => {
    expect(formatMoney(600000, { ...inr, type: "income" })).toBe("+₹6,000.00");
  });

  it("prefixes expense with U+2212, not a hyphen", () => {
    const out = formatMoney(24000, { ...inr, type: "expense" });
    expect(out).toBe("\u2212₹240.00");
    expect(out.startsWith("-")).toBe(false);
  });

  it("shows transfers without a sign", () => {
    expect(formatMoney(987000, { ...inr, type: "transfer" })).toBe("₹9,870.00");
  });

  it("uses zero decimals for JPY", () => {
    expect(formatMoney(1500, { currencyCode: "JPY", locale: "ja-JP" })).toMatch(/1,500$/);
    expect(formatMoney(1500, { currencyCode: "JPY", locale: "en-US" })).toBe("¥1,500");
  });
});

describe("parseAmountToMinor", () => {
  it("parses grouped decimals", () => {
    expect(parseAmountToMinor("1,234.50", "INR")).toBe(123450);
  });

  it("parses whole numbers and short fractions", () => {
    expect(parseAmountToMinor("12", "INR")).toBe(1200);
    expect(parseAmountToMinor("0.5", "INR")).toBe(50);
    expect(parseAmountToMinor("1500", "JPY")).toBe(1500);
  });

  it("avoids float drift", () => {
    expect(parseAmountToMinor("19.99", "INR")).toBe(1999);
    expect(parseAmountToMinor("1.005", "KWD")).toBe(1005);
  });

  it("rejects too many decimals", () => {
    expect(parseAmountToMinor("1.234", "INR")).toBeNull();
    expect(parseAmountToMinor("1.5", "JPY")).toBeNull();
  });

  it("rejects letters and empty input", () => {
    expect(parseAmountToMinor("12a", "INR")).toBeNull();
    expect(parseAmountToMinor("abc", "INR")).toBeNull();
    expect(parseAmountToMinor("", "INR")).toBeNull();
    expect(parseAmountToMinor("-5", "INR")).toBeNull();
  });
});
