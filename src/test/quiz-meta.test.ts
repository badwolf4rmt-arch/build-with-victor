import { describe, expect, it } from "vitest";
import { gradeNumber } from "@/lib/quiz-store";

describe("gradeNumber", () => {
  it("reads the class number from a label chosen in the editor", () => {
    expect(gradeNumber("5 класс")).toBe("5");
  });

  it("reads the first class of a demo range label", () => {
    expect(gradeNumber("9–11 класс")).toBe("9");
  });

  it("has no class when nothing was stored", () => {
    expect(gradeNumber(undefined)).toBe("");
    expect(gradeNumber("")).toBe("");
  });
});
