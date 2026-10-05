import { describe, expect, it } from "vitest";
import { illustrationCount, illustrationGroups } from "@/lib/question-illustration";

describe("question illustrations", () => {
  it("puts at least one picture in every three questions", () => {
    expect(illustrationCount(10)).toBe(4);
    expect(illustrationCount(20)).toBe(7);
  });
  it("a short quiz still gets one picture", () => {
    expect(illustrationCount(2)).toBe(1);
  });
  it("splits ten questions into evenly spaced groups", () => {
    expect(illustrationGroups(10)).toEqual([
      { start: 0, end: 2, fallbackIndex: 1 },
      { start: 3, end: 5, fallbackIndex: 4 },
      { start: 6, end: 8, fallbackIndex: 7 },
      { start: 9, end: 9, fallbackIndex: 9 },
    ]);
  });
});
