import { describe, expect, it } from "vitest";
import { illustrationCount } from "@/lib/question-illustration";

describe("question illustrations", () => {
  it("about 30% of questions get a picture", () => {
    expect(illustrationCount(10)).toBe(3);
    expect(illustrationCount(20)).toBe(6);
  });
  it("a short quiz still gets one picture", () => {
    expect(illustrationCount(2)).toBe(1);
  });
});
