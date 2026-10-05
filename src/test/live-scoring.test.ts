import { describe, expect, it } from "vitest";
import { answerPoints, canReplaceAnswer, optionsFor } from "@/lib/live";

describe("live game scoring", () => {
  it("wrong answer gives 0", () => expect(answerPoints(false, true, 0)).toBe(0));
  it("fixed scoring ignores time", () => expect(answerPoints(true, false, 19000)).toBe(5));
  it("speed scoring: instant answer gets full points", () => expect(answerPoints(true, true, 0)).toBe(5));
  it("speed scoring: slow answer gets half (rounded up)", () => expect(answerPoints(true, true, 60000)).toBe(3));
});

describe("option order", () => {
  it("is the same for teacher and student and keeps all answers", () => {
    const q = { text: "?", correct: "a", incorrect: ["b", "c", "d"] };
    expect(optionsFor(q, 2)).toEqual(optionsFor(q, 2));
    expect([...optionsFor(q, 2)].sort()).toEqual(["a", "b", "c", "d"]);
  });
});

describe("answer changes", () => {
  it("allows replacing an answer while the question is open and the correct answer is hidden", () => {
    expect(canReplaceAnswer("question", false)).toBe(true);
  });

  it("locks the answer once the student has seen the correct answer", () => {
    expect(canReplaceAnswer("reveal", true)).toBe(false);
  });
});
