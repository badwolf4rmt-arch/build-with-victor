/** Question mechanics. Stored on each question as `kind`; missing kind means "choice". */
export type QuestionKind = "choice" | "order" | "input";

export const KINDS: { id: QuestionKind; name: string; text: string }[] = [
  { id: "choice", name: "Выбор ответа", text: "Один правильный вариант среди неправильных" },
  { id: "order", name: "Упорядочивание", text: "Все варианты верные — нужно перетащить их в правильном порядке" },
  { id: "input", name: "Ввод ответа", text: "Ученик вписывает ответ, затем видит правильный" },
];

type Q = { kind?: QuestionKind | undefined; correct: string; incorrect: string[] };

export const kindOf = (q: { kind?: QuestionKind | undefined }): QuestionKind => q.kind ?? "choice";

/** For "order" the correct sequence is stored as [correct, ...incorrect]. */
export const orderSteps = (q: Q) => [q.correct, ...q.incorrect].map((s) => s.trim()).filter(Boolean);

/** Deterministic scramble that never returns the correct order (same on teacher screen and phones). */
export function scrambled(steps: string[], seed: number): string[] {
  const arr = [...steps];
  if (arr.length < 2) return arr;
  let x = (seed + 1) * 7919 + 104729;
  for (let i = arr.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  if (arr.every((s, i) => s === steps[i])) arr.push(arr.shift()!);
  return arr;
}

export const ORDER_SEP = " → ";
export const isOrderCorrect = (answer: string[], steps: string[]) => answer.length === steps.length && answer.every((s, i) => s === steps[i]);

/** Typed answers match ignoring case, ё/е, extra spaces and end punctuation. */
export function normalizeAnswer(s: string) {
  return s.replace(/\\[()[\]]/g, "").replace(/\$/g, "").replace(/\*\*|__/g, "")
    .replace(/\\(?:dfrac|tfrac|frac)\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\(?:text|mathrm|mathbf)\{([^{}]+)\}/g, "$1")
    .replace(/\\(?:left|right)/g, "").replace(/\^\{([^{}]+)\}/g, "^$1")
    .toLowerCase().replace(/ё/g, "е").replace(/[.,!?;:«»"']/g, "").replace(/\s+/g, " ").trim();
}
export const isInputCorrect = (answer: string, correct: string) => !!normalizeAnswer(answer) && normalizeAnswer(answer) === normalizeAnswer(correct);

/** A question is complete enough to play for its mechanic. */
export function isPlayable(q: Q & { text: string }) {
  if (!q.text.trim() || !q.correct.trim()) return false;
  const k = kindOf(q);
  if (k === "order") return orderSteps(q).length >= 2;
  if (k === "choice") return q.incorrect.some((x) => x.trim());
  return true;
}

/** Default empty fields when the teacher switches a question to another mechanic. */
export function switchKind<T extends Q>(q: T, kind: QuestionKind): T {
  if (kind === "input") return { ...q, kind, incorrect: [] };
  const need = kind === "order" ? 2 : 3;
  const incorrect = [...q.incorrect];
  while (incorrect.length < need) incorrect.push("");
  return { ...q, kind, incorrect };
}
