import { describe, expect, it } from "vitest";
import { answerPoints, canReplaceAnswer, optionsFor, teamScores, remainingSeconds, playerPlace } from "@/lib/live";

describe("live game scoring", () => {
  it("counts down from 20 seconds and stops at zero", () => {
    expect(remainingSeconds(1000, 1000)).toBe(20);
    expect(remainingSeconds(1000, 6000)).toBe(15);
    expect(remainingSeconds(1000, 50000)).toBe(0);
    expect(remainingSeconds(null, 50000)).toBeNull();
  });
  it("ranks equal scores equally", () => {
    expect(playerPlace([{ score: 34 }, { score: 34 }, { score: 21 }], 34)).toBe(1);
    expect(playerPlace([{ score: 34 }, { score: 34 }, { score: 21 }], 21)).toBe(3);
  });
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

describe("team scoring", () => {
  it("sums member scores per team and ranks teams", () => {
    const r = teamScores(["A", "B"], [{ team: "A", score: 5 }, { team: "B", score: 4 }, { team: "B", score: 3 }, { team: null, score: 9 }]);
    expect(r).toEqual([{ name: "B", score: 7, members: 2 }, { name: "A", score: 5, members: 1 }]);
  });
});
