import { describe, expect, it } from "vitest";
import {
  daysInMonth,
  formatLocalDate,
  formatMonth,
  formatTime,
  groupByLocalDate,
  shiftDay,
  shiftMonth,
  toInstant,
  toLocalParts,
} from "./ledger-format.js";

describe("ledger-format", () => {
  it("shifts days and months across boundaries", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(daysInMonth("2028-02")).toBe(29);
  });

  it("formats calendar dates without shifting the day", () => {
    expect(formatLocalDate("2026-10-22", { locale: "en-GB" })).toBe("Thu 22 Oct");
    expect(formatMonth("2026-10", { locale: "en-GB" })).toBe("October 2026");
  });

  it("shows times in the zone the entry was recorded in", () => {
    expect(
      formatTime("2026-10-22T07:50:00.000Z", { locale: "en-GB", timeZone: "Asia/Kolkata" }),
    ).toBe("13:20");
  });

  it("converts wall-clock time in a zone to an instant and back", () => {
    expect(toInstant("2026-10-22", "13:20", "Asia/Kolkata")).toBe("2026-10-22T07:50:00.000Z");
    expect(toInstant("2026-07-01", "09:00", "America/New_York")).toBe("2026-07-01T13:00:00.000Z");
    expect(toLocalParts("2026-10-21T20:00:00.000Z", "Asia/Kolkata")).toEqual({
      localDate: "2026-10-22",
      localTime: "01:30",
    });
  });

  it("groups entries by day with a net that ignores transfers", () => {
    const groups = groupByLocalDate([
      { localDate: "2026-10-22", type: "expense", amountMinor: 24000 },
      { localDate: "2026-10-22", type: "transfer", amountMinor: 500000 },
      { localDate: "2026-10-21", type: "income", amountMinor: 600000 },
    ]);
    expect(groups).toEqual([
      { localDate: "2026-10-22", items: expect.any(Array), netMinor: -24000 },
      { localDate: "2026-10-21", items: expect.any(Array), netMinor: 600000 },
    ]);
  });
});
