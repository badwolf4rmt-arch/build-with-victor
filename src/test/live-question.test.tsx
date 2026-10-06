import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Question } from "@/routes/join.$code";
const { submit } = vi.hoisted(() => ({ submit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/live", async (original) => ({ ...await original<typeof import("@/lib/live")>(), submitAnswer: submit }));
afterEach(() => { cleanup(); submit.mockClear(); vi.useRealTimers(); });
const player = { id: "p", name: "Ученик", score: 0, team: null, session_code: "123456", joined_at: "" };
const base = { code: "123456", player, index: 0, total: 3, speed: false, startedAt: null, initialAnswer: undefined, revealed: false, showExplanation: false, selfPaced: true, onNext: vi.fn() };
describe("student confirmation", () => {
  it("selection does not submit; confirmation saves and keeps feedback until next", async () => {
    render(<Question {...base} showFeedback q={{ text: "2 + 2?", correct: "4", incorrect: ["3", "5"] }} />);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ответить" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0]?.[0]).toMatchObject({ answer: "4", correct: true, points: 5 });
    expect(await screen.findByRole("button", { name: "Следующий вопрос" })).toBeEnabled();
    expect(base.onNext).not.toHaveBeenCalled();
  });
  it("keeps a changing countdown after a submitted answer", async () => {
    vi.useFakeTimers(); vi.setSystemTime(10000);
    render(<Question {...base} selfPaced={false} showFeedback={false} startedAt={10000} initialAnswer="4" q={{ text: "2 + 2?", correct: "4", incorrect: ["3"] }} />);
    expect(screen.getByRole("timer")).toHaveTextContent("20 с");
    await vi.advanceTimersByTimeAsync(3000);
    expect(screen.getByRole("timer")).toHaveTextContent("17 с");
  });
});