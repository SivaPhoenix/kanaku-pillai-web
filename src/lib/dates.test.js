import { describe, it, expect } from "vitest";
import {
  addDays,
  addMonths,
  formatDayLong,
  formatDayShort,
  formatMonthYear,
  isSameDay,
  parseDayParam,
  parseMonthParam,
  toDayParam,
  toMonthParam,
  todayInZone,
  weekDays,
} from "./dates.js";

const thu = parseDayParam("2026-10-22");

describe("formatting", () => {
  it("formats month, long day and short day", () => {
    expect(formatMonthYear(thu)).toBe("October 2026");
    expect(formatDayLong(thu)).toBe("Thursday, 22 Oct");
    expect(formatDayShort(thu)).toBe("Thu, 22 Oct");
  });
});

describe("weekDays", () => {
  it("starts on Monday", () => {
    const days = weekDays(thu, "mon").map(toDayParam);
    expect(days[0]).toBe("2026-10-19");
    expect(days[6]).toBe("2026-10-25");
  });
  it("starts on Sunday", () => {
    const days = weekDays(thu, "sun").map(toDayParam);
    expect(days[0]).toBe("2026-10-18");
    expect(days[6]).toBe("2026-10-24");
  });
});

describe("arithmetic", () => {
  it("adds days across a month end", () => {
    expect(toDayParam(addDays(parseDayParam("2026-10-31"), 1))).toBe("2026-11-01");
  });
  it("adds months and clamps the day", () => {
    expect(toDayParam(addMonths(parseDayParam("2026-01-31"), 1))).toBe("2026-02-28");
    expect(toMonthParam(addMonths(parseMonthParam("2026-12"), 1))).toBe("2027-01");
    expect(toMonthParam(addMonths(parseMonthParam("2026-01"), -1))).toBe("2025-12");
  });
});

describe("params", () => {
  it("round-trips and rejects bad input", () => {
    expect(toMonthParam(parseMonthParam("2026-10"))).toBe("2026-10");
    expect(parseMonthParam("2026-13")).toBeNull();
    expect(parseMonthParam(null)).toBeNull();
    expect(parseDayParam("2026-02-30")).toBeNull();
  });
});

describe("zones", () => {
  it("isSameDay compares in the given zone", () => {
    const a = new Date("2026-10-22T20:00:00Z");
    const b = new Date("2026-10-22T17:00:00Z");
    expect(isSameDay(a, b, "UTC")).toBe(true);
    expect(isSameDay(a, b, "Asia/Kolkata")).toBe(false);
  });
  it("todayInZone follows the zone", () => {
    const now = new Date("2026-10-22T20:00:00Z");
    expect(toDayParam(todayInZone("UTC", now))).toBe("2026-10-22");
    expect(toDayParam(todayInZone("Asia/Kolkata", now))).toBe("2026-10-23");
  });
});
