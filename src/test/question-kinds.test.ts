import { describe, expect, it } from "vitest";
import { isInputCorrect, isOrderCorrect, scrambled } from "@/lib/question-kinds";

describe("ordering questions", () => {
  const steps = ["a", "b", "c", "d"];
  it("scramble never shows the correct order and keeps all steps", () => {
    for (let s = 0; s < 30; s++) {
      const r = scrambled(steps, s);
      expect(r).not.toEqual(steps);
      expect([...r].sort()).toEqual(steps);
    }
  });
  it("only the exact order is correct", () => {
    expect(isOrderCorrect(["a", "b", "c", "d"], steps)).toBe(true);
    expect(isOrderCorrect(["b", "a", "c", "d"], steps)).toBe(false);
  });
});

describe("typed answers", () => {
  it("compares plain student input with simple formatted math answers", () => {
    expect(isInputCorrect("-1", "$-1$")).toBe(true);
    expect(isInputCorrect("1/2", String.raw`\(\frac{1}{2}\)`)).toBe(true);
    expect(isInputCorrect("2", "$-1$")).toBe(false);
  });
  it("match ignoring case, ё and punctuation", () => expect(isInputCorrect("  Ёжик.", "ежик")).toBe(true));
  it("different word does not match", () => expect(isInputCorrect("заяц", "ежик")).toBe(false));
  it("empty answer is never correct", () => expect(isInputCorrect("", "")).toBe(false));
});
