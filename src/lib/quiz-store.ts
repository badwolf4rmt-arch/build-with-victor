import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import leaf from "@/assets/quiz-leaf.jpg";
import recycle from "@/assets/quiz-recycle.jpg";
import globe from "@/assets/quiz-globe.jpg";
import { AIVAZOVSKY, ECO_ORGS, ESG, FOREIGN_PAINTERS, RECYCLING, RUSSIAN_PAINTERS } from "./seed-questions";

export type Quiz = {
  id: string;
  title: string;
  questions: number;
  image?: string | undefined; // undefined → gradient cover
  grade?: string;
  subject?: string;
  topic?: string;
  mine: boolean;
  createdAt: number;
  items?: DraftQuestion[];
};

export type Folder = {
  id: string;
  name: string;
  quizIds: string[];
};

export const SEED_QUIZZES: Quiz[] = [
  { id: "q1", title: "Картины русских живописцев.", questions: 10, items: RUSSIAN_PAINTERS, mine: true, createdAt: 10 },
  {
    id: "q3",
    title: "Хранители Земли: экологические организации мира",
    questions: 10,
    image: leaf,
    items: ECO_ORGS,
    grade: "9–11 класс",
    mine: false,
    createdAt: 8,
  },
  {
    id: "q4",
    title: "Утилизирируй это: вся правда о сортировке",
    questions: 12,
    image: recycle,
    items: RECYCLING,
    grade: "5–8 класс",
    mine: false,
    createdAt: 7,
  },
  {
    id: "q5",
    title: "В мире ESG: что значит «зелёное мышление»",
    questions: 10,
    image: globe,
    items: ESG,
    grade: "9–11 класс",
    mine: false,
    createdAt: 6,
  },
  { id: "q6", title: "Картины иностранных живописцев", questions: 10, items: FOREIGN_PAINTERS, image: leaf, mine: true, createdAt: 5 },
  { id: "q7", title: "Айвазовский: картины", questions: 8, items: AIVAZOVSKY, mine: true, createdAt: 4 },
];

export const SEED_FOLDERS: Folder[] = [
  { id: "f-drafts", name: "Черновики", quizIds: ["q1", "q2", "q3", "q5"] },
  { id: "f-9a", name: "История 9А", quizIds: ["q1", "q2", "q3", "q4", "q5"] },
  { id: "f-8b", name: "8Б для тестов", quizIds: ["q6", "q7"] },
];

/** Legacy browser-only storage; its quizzes are uploaded to the cloud once and then removed. */
const KEY = "quiz-builder-state-v1";

type State = { quizzes: Quiz[]; folders: Folder[] };
type Stored = { folders: Folder[]; custom?: Quiz[] };
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type FolderRow = Database["public"]["Tables"]["folders"]["Row"];

const norm = (t: string) => t.trim().replace(/[.\s]+$/, "").toLowerCase();
/** Custom entries override seeds with the same id; old saved copies of seeds (same title) are dropped. */
function mergeQuizzes(custom: Quiz[], seeds: Quiz[]): Quiz[] {
  const seedTitles = new Set(seeds.map((q) => norm(q.title)));
  const seen = new Set<string>();
  const extra = custom.filter((q) => {
    if (seeds.some((x) => x.id === q.id)) return false;
    const t = norm(q.title);
    if (seedTitles.has(t) || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
  return [...extra, ...seeds.map((q) => custom.find((c) => c.id === q.id) ?? q)];
}

function rowToQuiz(r: QuizRow, seed?: Quiz): Quiz {
  const items = Array.isArray(r.items) ? (r.items as unknown as DraftQuestion[]) : [];
  return {
    id: r.id,
    title: r.title,
    questions: items.length,
    items,
    image: r.cover_url ?? undefined,
    ...(r.grade ? { grade: r.grade } : seed?.grade ? { grade: seed.grade } : {}),
    ...(r.subject ? { subject: r.subject } : seed?.subject ? { subject: seed.subject } : {}),
    ...(r.topic ? { topic: r.topic } : seed?.topic ? { topic: seed.topic } : {}),
    mine: r.mine,
    createdAt: Number(r.created_at),
  };
}

/** Cloud rows override demo quizzes with the same id; a `deleted` row hides that quiz for everyone. */
export function mergeLibrary(rows: QuizRow[], seeds: Quiz[]): Quiz[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const fromSeeds = seeds.flatMap((s) => {
    const r = byId.get(s.id);
    if (!r) return [s];
    return r.deleted ? [] : [rowToQuiz(r, s)];
  });
  const seedIds = new Set(seeds.map((s) => s.id));
  const extra = rows.filter((r) => !r.deleted && !seedIds.has(r.id)).map((r) => rowToQuiz(r));
  return [...extra, ...fromSeeds];
}

function quizToRow(q: Quiz) {
  return {
    id: q.id,
    title: q.title,
    items: (q.items ?? []) as unknown as Json,
    cover_url: q.image ?? null,
    grade: q.grade ?? null,
    subject: q.subject ?? null,
    topic: q.topic ?? null,
    mine: q.mine,
    created_at: q.createdAt,
    deleted: false,
  };
}

/** One-time upload of quizzes saved only in this browser; never overwrites cloud edits made elsewhere. */
async function migrateLocalQuizzes() {
  let stored: Partial<Stored> | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    stored = raw ? (JSON.parse(raw) as Partial<Stored>) : null;
  } catch {
    stored = null;
  }
  if (!stored) return;
  const custom = Array.isArray(stored.custom) ? stored.custom : [];
  const ids = new Set(custom.map((q) => q.id));
  const toUpload = mergeQuizzes(custom, SEED_QUIZZES).filter((q) => ids.has(q.id));
  for (const q of toUpload) {
    const { error } = await supabase.from("quizzes").upsert(quizToRow(q), { onConflict: "id", ignoreDuplicates: true });
    if (error) return; // try again next visit
  }
  localStorage.removeItem(KEY);
}

async function fetchLibrary(): Promise<State | null> {
  const [qs, fs] = await Promise.all([
    supabase.from("quizzes").select("*"),
    supabase.from("folders").select("*").order("position"),
  ]);
  if (qs.error || fs.error) return null;
  return {
    quizzes: mergeLibrary(qs.data, SEED_QUIZZES),
    folders: (fs.data as FolderRow[]).map((f) => ({ id: f.id, name: f.name, quizIds: f.quiz_ids })),
  };
}

const fail = () => toast.error("Не удалось сохранить изменения в облаке. Проверьте интернет и попробуйте ещё раз.");

/** Shared library: everyone sees the same quizzes, covers and folders; live-updates when someone changes them. */
export function useQuizStore() {
  const [state, setState] = useState<State>({ quizzes: SEED_QUIZZES, folders: SEED_FOLDERS });

  const refresh = useCallback(async () => {
    const next = await fetchLibrary();
    if (next) setState(next);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 300);
    };
    void migrateLocalQuizzes().finally(() => void refresh());
    const channel = supabase
      .channel("quiz-library")
      .on("postgres_changes", { event: "*", schema: "public", table: "quizzes" }, later)
      .on("postgres_changes", { event: "*", schema: "public", table: "folders" }, later)
      .subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const createFolder = useCallback((name: string, quizIds: string[]) => {
    const id = `f-${Date.now()}`;
    setState((s) => ({ ...s, folders: [...s.folders, { id, name, quizIds }] }));
    void supabase.from("folders").insert({ id, name, quiz_ids: quizIds, position: Date.now() }).then(({ error }) => error && fail());
    return id;
  }, []);

  const updateFolder = useCallback((id: string, name: string, quizIds: string[]) => {
    setState((s) => ({
      ...s,
      folders: s.folders.map((f) => (f.id === id ? { ...f, name, quizIds } : f)),
    }));
    void supabase.from("folders").update({ name, quiz_ids: quizIds }).eq("id", id).then(({ error }) => error && fail());
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setState((s) => ({ ...s, folders: s.folders.filter((f) => f.id !== id) }));
    void supabase.from("folders").delete().eq("id", id).then(({ error }) => error && fail());
  }, []);

  const deleteQuiz = useCallback(
    (id: string) => {
      const affected = state.folders.filter((f) => f.quizIds.includes(id));
      setState((s) => ({
        quizzes: s.quizzes.filter((q) => q.id !== id),
        folders: s.folders.map((f) => ({ ...f, quizIds: f.quizIds.filter((qid) => qid !== id) })),
      }));
      void (async () => {
        const { error } = await supabase.from("quizzes").upsert({ id, deleted: true }, { onConflict: "id" });
        if (error) {
          fail();
          return;
        }
        for (const f of affected) {
          await supabase.from("folders").update({ quiz_ids: f.quizIds.filter((q) => q !== id) }).eq("id", f.id);
        }
      })();
    },
    [state.folders],
  );

  return { ...state, createFolder, updateFolder, deleteFolder, deleteQuiz };
}

export function pluralQuestions(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} вопрос`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} вопроса`;
  return `${n} вопросов`;
}

export type QuestionImage = { src: string; name: string; type: string; size: number };
export type DraftQuestion = { text: string; correct: string; incorrect: string[]; image?: QuestionImage | undefined };
export type Draft = {
  title: string;
  questions: DraftQuestion[];
  cover?: string | undefined;
  id?: string | undefined;
  subject?: string | undefined;
  grade?: string | undefined;
  topic?: string | undefined;
};
const DRAFT_KEY = "quiz-builder-draft";
export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
export function saveDraft(d: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* storage full — draft stays in memory only */
  }
}
export function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}
/** Class number taken from a stored label like "5 класс" or "9–11 класс"; empty when there is none. */
export function gradeNumber(grade?: string): string {
  return grade?.match(/^\d+/)?.[0] ?? "";
}

export type QuizMeta = { subject?: string | undefined; grade?: string | undefined; topic?: string | undefined };

/** Saves (or updates, when `id` is given) a quiz in the shared cloud library; returns the saved quiz or throws. */
export async function addQuizToLibrary(
  title: string,
  items: DraftQuestion[],
  image?: string,
  id?: string,
  meta?: QuizMeta,
): Promise<Quiz> {
  const seed = SEED_QUIZZES.find((q) => q.id === id);
  const { data: prev } = id
    ? await supabase.from("quizzes").select("created_at, grade, mine, subject, topic").eq("id", id).maybeSingle()
    : { data: null };
  // A field the editor sent wins (an empty one clears it); otherwise keep what the cloud or the demo already had.
  const keep = (value: string | undefined, ...fallbacks: Array<string | null | undefined>) =>
    value !== undefined ? value || undefined : fallbacks.find((f) => !!f) ?? undefined;
  const grade = keep(meta?.grade, prev?.grade, seed?.grade);
  const subject = keep(meta?.subject, prev?.subject, seed?.subject);
  const topic = keep(meta?.topic, prev?.topic, seed?.topic);
  const quiz: Quiz = {
    id: id ?? `ai-${Date.now()}`,
    title,
    questions: items.length,
    items,
    image,
    ...(grade ? { grade } : {}),
    ...(subject ? { subject } : {}),
    ...(topic ? { topic } : {}),
    mine: prev?.mine ?? seed?.mine ?? true,
    createdAt: prev ? Number(prev.created_at) : (seed?.createdAt ?? Date.now()),
  };
  const { error } = await supabase.from("quizzes").upsert(quizToRow(quiz), { onConflict: "id" });
  if (error) throw new Error(error.message);
  return quiz;
}

export function getQuizItems(quiz: Quiz): DraftQuestion[] {
  return quiz.items ?? [];
}
