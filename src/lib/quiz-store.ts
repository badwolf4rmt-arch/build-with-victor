import { useCallback, useEffect, useState } from "react";
import leaf from "@/assets/quiz-leaf.jpg";
import recycle from "@/assets/quiz-recycle.jpg";
import globe from "@/assets/quiz-globe.jpg";

export type Quiz = {
  id: string;
  title: string;
  questions: number;
  image?: string | undefined; // undefined → gradient cover
  grade?: string;
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
  { id: "q1", title: "Картины русских живописцев.", questions: 10, mine: true, createdAt: 10 },
  {
    id: "q2",
    title:
      "Картины русских живописцев. Угадай автора Картины русских живописцев. Угадай автора Картины русских",
    questions: 10,
    mine: true,
    createdAt: 9,
  },
  {
    id: "q3",
    title: "Хранители Земли: экологические организации мира",
    questions: 10,
    image: leaf,
    grade: "9–11 класс",
    mine: false,
    createdAt: 8,
  },
  {
    id: "q4",
    title: "Утилизирируй это: вся правда о сортировке",
    questions: 12,
    image: recycle,
    grade: "5–8 класс",
    mine: false,
    createdAt: 7,
  },
  {
    id: "q5",
    title: "В мире ESG: что значит «зелёное мышление»",
    questions: 10,
    image: globe,
    grade: "9–11 класс",
    mine: false,
    createdAt: 6,
  },
  { id: "q6", title: "Картины иностранных живописцев", questions: 10, image: leaf, mine: true, createdAt: 5 },
  { id: "q7", title: "Айвазовский: картины", questions: 8, mine: true, createdAt: 4 },
  { id: "q8", title: "Картины русских живописцев", questions: 8, mine: true, createdAt: 3 },
];

export const SEED_FOLDERS: Folder[] = [
  { id: "f-drafts", name: "Черновики", quizIds: ["q1", "q2", "q3", "q5"] },
  { id: "f-9a", name: "История 9А", quizIds: ["q1", "q2", "q3", "q4", "q5"] },
  { id: "f-8b", name: "8Б для тестов", quizIds: ["q6", "q7"] },
];

const KEY = "quiz-builder-state-v1";

type State = { quizzes: Quiz[]; folders: Folder[] };
type Stored = { folders: Folder[]; custom?: Quiz[] };

export function useQuizStore() {
  const [state, setState] = useState<State>({ quizzes: SEED_QUIZZES, folders: SEED_FOLDERS });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Stored>;
        setState((s) => ({
          quizzes: Array.isArray(parsed.custom) ? [...parsed.custom, ...s.quizzes] : s.quizzes,
          folders: Array.isArray(parsed.folders) ? parsed.folders : s.folders,
        }));
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const custom = state.quizzes.filter((q) => q.id.startsWith("ai-"));
    localStorage.setItem(KEY, JSON.stringify({ folders: state.folders, custom }));
  }, [state.folders, state.quizzes, loaded]);

  const createFolder = useCallback((name: string, quizIds: string[]) => {
    const id = `f-${Date.now()}`;
    setState((s) => ({ ...s, folders: [...s.folders, { id, name, quizIds }] }));
    return id;
  }, []);

  const updateFolder = useCallback((id: string, name: string, quizIds: string[]) => {
    setState((s) => ({
      ...s,
      folders: s.folders.map((f) => (f.id === id ? { ...f, name, quizIds } : f)),
    }));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setState((s) => ({ ...s, folders: s.folders.filter((f) => f.id !== id) }));
  }, []);

  return { ...state, createFolder, updateFolder, deleteFolder };
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
export type Draft = { title: string; questions: DraftQuestion[]; cover?: string };
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
/** Saves (or updates, when `id` is given) a quiz in the library; returns the saved quiz. */
export function addQuizToLibrary(title: string, items: DraftQuestion[], image?: string, id?: string): Quiz {
  const raw = localStorage.getItem(KEY);
  const stored: Stored = raw ? JSON.parse(raw) : { folders: SEED_FOLDERS };
  const prev = stored.custom?.find((q) => q.id === id);
  const quiz: Quiz = { id: prev?.id ?? `ai-${Date.now()}`, title, questions: items.length, items, image, mine: true, createdAt: prev?.createdAt ?? Date.now() };
  stored.custom = [quiz, ...(stored.custom ?? []).filter((q) => q.id !== quiz.id)];
  stored.folders ??= SEED_FOLDERS;
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // storage full — keep the quiz without images
    quiz.image = undefined;
    quiz.items = items.map(({ image: _img, ...q }) => q);
    localStorage.setItem(KEY, JSON.stringify(stored));
  }
  return quiz;
}

/** Demo questions shown for library quizzes that have no stored content yet. */
const DEMO_ITEMS: DraftQuestion[] = [
  { text: "В каком году состоялся самый первый полёт человека в космос и кто стал первым, побывавшим в космосе?", correct: "1961 — Юрий Гагарин стал первым космонавтом в Советском Союзе", incorrect: ["1956 — Валентина Терешкова стала первым космонавтом в СССР", "1965 — Герман Титов стал первым космонавтом в Советском Союзе", "1960 — Владимир Комаров стал первым космонавтом в СССР"] },
  { text: "Сколько длился первый космический полёт?", correct: "108 минут", incorrect: ["30 минут", "5 часов", "Одни сутки"] },
  { text: "Кто первым вышел в открытый космос?", correct: "Алексей Леонов", incorrect: ["Юрий Гагарин", "Нил Армстронг", "Герман Титов"] },
  { text: "Кто был главным конструктором первых космических кораблей?", correct: "Сергей Королёв", incorrect: ["Константин Циолковский", "Андрей Туполев", "Михаил Калашников"] },
];
export function getQuizItems(quiz: Quiz): DraftQuestion[] {
  return quiz.items?.length ? quiz.items : DEMO_ITEMS;
}
