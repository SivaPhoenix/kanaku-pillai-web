import { describe, it, expect } from "vitest";
import { scorePassword, STRENGTH_LABELS } from "./password-strength.js";

describe("scorePassword", () => {
  it("scores empty as 0", () => {
    expect(scorePassword("")).toBe(0);
  });

  it("gives one point per rule", () => {
    expect(scorePassword("abcdefgh")).toBe(1);
    expect(scorePassword("abcdEFGH")).toBe(2);
    expect(scorePassword("abcdEF12")).toBe(3);
    expect(scorePassword("abcdEF1!")).toBe(4);
  });

  it("does not award length for short passwords", () => {
    expect(scorePassword("aB1!")).toBe(3);
  });

  it("has a label for every score", () => {
    expect(STRENGTH_LABELS).toHaveLength(5);
    expect(STRENGTH_LABELS[0]).toBe("Too weak");
    expect(STRENGTH_LABELS[4]).toBe("Strong");
  });
});
