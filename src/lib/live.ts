import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { GameQuestion } from "./game";
import { QUESTION_POINTS } from "./game";

export type LiveMode = "sync" | "self";
export type LiveState = "lobby" | "question" | "reveal" | "finished";
export type LiveSession = Omit<Database["public"]["Tables"]["live_sessions"]["Row"], "items" | "mode" | "state"> & {
  items: GameQuestion[];
  mode: LiveMode;
  state: LiveState;
};
export type LivePlayer = Database["public"]["Tables"]["live_players"]["Row"];
export type LiveAnswer = Database["public"]["Tables"]["live_answers"]["Row"];

/** Seconds a student has for one question in the synchronous (Kahoot-like) mode; also the cap for speed scoring. */
export const TIME_LIMIT = 20;

/**
 * Points for one answer. Wrong → 0. Without speed scoring → QUESTION_POINTS.
 * With speed scoring: QUESTION_POINTS for an instant answer, falling linearly to half at TIME_LIMIT (never below half).
 */
export function answerPoints(correct: boolean, speedScoring: boolean, elapsedMs: number): number {
  if (!correct) return 0;
  if (!speedScoring) return QUESTION_POINTS;
  const t = Math.min(Math.max(elapsedMs / 1000, 0), TIME_LIMIT) / TIME_LIMIT;
  return Math.max(Math.ceil(QUESTION_POINTS / 2), Math.round(QUESTION_POINTS * (1 - t / 2)));
}

/** Same option order on the teacher screen and every student device. */
export function optionsFor(q: GameQuestion, index: number): string[] {
  const arr = [q.correct, ...q.incorrect.filter((x) => x.trim())];
  let x = (index + 1) * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export async function createLiveSession(input: { quizId: string; title: string; items: GameQuestion[]; mode: LiveMode; speedScoring: boolean }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { error } = await supabase.from("live_sessions").insert({
      code,
      quiz_id: input.quizId,
      title: input.title,
      items: input.items as never,
      mode: input.mode,
      speed_scoring: input.speedScoring,
    });
    if (!error) return code;
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Не удалось создать игру");
}

export async function updateSession(code: string, patch: Partial<Pick<LiveSession, "state" | "current" | "question_started_at">>) {
  await supabase.from("live_sessions").update(patch).eq("code", code);
}

/** Session, players and answers for one game code, kept live through realtime updates. */
export function useLiveGame(code: string) {
  const [session, setSession] = useState<LiveSession | null | undefined>(undefined);
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [answers, setAnswers] = useState<LiveAnswer[]>([]);

  const refresh = useCallback(async () => {
    const [s, p, a] = await Promise.all([
      supabase.from("live_sessions").select("*").eq("code", code).maybeSingle(),
      supabase.from("live_players").select("*").eq("session_code", code).order("joined_at"),
      supabase.from("live_answers").select("*").eq("session_code", code),
    ]);
    if (!s.error) setSession((s.data as unknown as LiveSession) ?? null);
    if (p.data) setPlayers(p.data);
    if (a.data) setAnswers(a.data);
  }, [code]);

  useEffect(() => {
    void refresh();
    const filter = `session_code=eq.${code}`;
    const ch = supabase
      .channel(`live-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions", filter: `code=eq.${code}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "live_players", filter }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "live_answers", filter }, () => void refresh())
      .subscribe();
    const poll = setInterval(() => void refresh(), 4000); // safety net if realtime drops on school wi-fi
    return () => {
      clearInterval(poll);
      void supabase.removeChannel(ch);
    };
  }, [code, refresh]);

  return { session, players, answers, refresh };
}

export async function joinGame(code: string, name: string) {
  const { data, error } = await supabase.from("live_players").insert({ session_code: code, name: name.trim().slice(0, 30) }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function submitAnswer(p: { code: string; player: LivePlayer; question: number; answer: string; correct: boolean; points: number }) {
  const { error } = await supabase.from("live_answers").insert({
    session_code: p.code,
    player_id: p.player.id,
    question: p.question,
    answer: p.answer,
    correct: p.correct,
    points: p.points,
  });
  if (error) return false;
  const { data } = await supabase.from("live_answers").select("points").eq("player_id", p.player.id);
  const score = (data ?? []).reduce((s, r) => s + r.points, 0);
  await supabase.from("live_players").update({ score }).eq("id", p.player.id);
  return true;
}
