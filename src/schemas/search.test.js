import { describe, expect, it } from "vitest";
import { buildSearchFilters } from "./search.js";

describe("buildSearchFilters", () => {
  it("maps URL params to API filter names", () => {
    const params = new URLSearchParams(
      "q=lunch&type=expense&from=2026-10-01&to=2026-10-31&category=c1&account=a1&min=10&max=250.5",
    );
    expect(buildSearchFilters(params, "INR")).toEqual({
      q: "lunch",
      type: "expense",
      from: "2026-10-01",
      to: "2026-10-31",
      categoryId: "c1",
      accountId: "a1",
      min: 1000,
      max: 25050,
    });
  });

  it("drops empty, unknown or malformed values", () => {
    const params = new URLSearchParams("q=%20&type=all&from=yesterday&min=abc");
    expect(buildSearchFilters(params, "INR")).toEqual({});
  });
});
