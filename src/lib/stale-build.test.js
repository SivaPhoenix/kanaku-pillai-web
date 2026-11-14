import { beforeEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError, reloadOnceForStaleBuild } from "./stale-build.js";

describe("isChunkLoadError", () => {
  it("recognises the browsers' failed lazy-import messages", () => {
    for (const message of [
      "Failed to fetch dynamically imported module: https://x.app/assets/AddTransactionPage-abc.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "'text/html' is not a valid JavaScript MIME type.",
    ]) {
      expect(isChunkLoadError(new TypeError(message))).toBe(true);
    }
  });

  it("ignores ordinary errors", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe("reloadOnceForStaleBuild", () => {
  beforeEach(() => sessionStorage.clear());

  it("reloads once, then refuses again within 30 seconds so a real error is shown", () => {
    const reload = vi.fn();
    expect(reloadOnceForStaleBuild({ now: 1_000_000, reload })).toBe(true);
    expect(reloadOnceForStaleBuild({ now: 1_010_000, reload })).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);

    expect(reloadOnceForStaleBuild({ now: 1_040_000, reload })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
