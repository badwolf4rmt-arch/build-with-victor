import { describe, expect, it } from "vitest";
import { mergeLibrary, SEED_QUIZZES } from "@/lib/quiz-store";

const row = (over: Partial<Parameters<typeof mergeLibrary>[0][number]>) => ({
  id: "x",
  title: "T",
  items: [],
  cover_url: null,
  grade: null,
  mine: true,
  deleted: false,
  created_at: 1,
  updated_at: "",
  ...over,
});

describe("shared quiz library", () => {
  it("a cover saved in the cloud replaces the demo quiz cover instead of adding a copy", () => {
    const list = mergeLibrary([row({ id: "q1", title: "Картины русских живописцев.", cover_url: "data:image/jpeg;base64,AAA" })], SEED_QUIZZES);
    expect(list.filter((q) => q.id === "q1")).toHaveLength(1);
    expect(list.find((q) => q.id === "q1")?.image).toBe("data:image/jpeg;base64,AAA");
    expect(list).toHaveLength(SEED_QUIZZES.length);
  });

  it("a demo quiz deleted by anyone is hidden for everyone", () => {
    const list = mergeLibrary([row({ id: "q3", deleted: true })], SEED_QUIZZES);
    expect(list.some((q) => q.id === "q3")).toBe(false);
  });

  it("editing a demo quiz keeps its grade label", () => {
    const list = mergeLibrary([row({ id: "q3", grade: null })], SEED_QUIZZES);
    expect(list.find((q) => q.id === "q3")?.grade).toBe("9–11 класс");
  });

  it("new quizzes from the cloud appear in the library", () => {
    const list = mergeLibrary([row({ id: "ai-1", title: "Новая" })], SEED_QUIZZES);
    expect(list.some((q) => q.id === "ai-1")).toBe(true);
  });
});
