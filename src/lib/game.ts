export const AVATARS = ["🍓", "🥝", "🍇", "🍒", "🍏", "🍋", "🍎", "🍌"];

export type BonusId = "generosity" | "like" | "magnet" | "theft" | "eraser" | "double" | "trap" | "rocket";

export const BONUSES: { id: BonusId; name: string; text: string; icon: string }[] = [
  { id: "generosity", name: "Щедрость", text: "Команда отдаёт баллы следующей по порядку", icon: "🎁" },
  { id: "like", name: "Лайк", text: "Все команды получают по 5 баллов", icon: "👍" },
  { id: "magnet", name: "Магнит", text: "Команда получает по 5 баллов от других", icon: "🧲" },
  { id: "theft", name: "Похищение", text: "Баллы всех команд обнуляются", icon: "🦹" },
  { id: "eraser", name: "Ластик", text: "Команда теряет 15 баллов", icon: "🩹" },
  { id: "double", name: "Дубль", text: "Баллы команды удваиваются", icon: "✖️" },
  { id: "trap", name: "Ловушка", text: "Команда переходит на последнее место", icon: "⚠️" },
  { id: "rocket", name: "Ракета", text: "Команда переходит на первое место", icon: "🚀" },
];

export type Team = { name: string; avatar: string; score: number };
export type GameQuestion = { text: string; correct: string; incorrect: string[]; image?: string };
export type GameSetup = { quizId: string; title: string; questions: number; items: GameQuestion[]; teams: Team[]; bonuses: BonusId[] };

const KEY = "quiz-game-setup";
export const HIDE_RULES_KEY = "quiz-hide-rules";

export function saveSetup(s: GameSetup) {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}
export function loadSetup(): GameSetup | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameSetup) : null;
  } catch {
    return null;
  }
}

/** Applies a bonus to scores; returns new teams array. */
export function applyBonus(teams: Team[], idx: number, b: BonusId): Team[] {
  const t = teams.map((x) => ({ ...x }));
  const me = t[idx]!;
  const max = Math.max(...t.map((x) => x.score));
  const min = Math.min(...t.map((x) => x.score));
  switch (b) {
    case "generosity": {
      const next = t[(idx + 1) % t.length]!;
      if (next !== me) { next.score += me.score; me.score = 0; }
      break;
    }
    case "like": t.forEach((x) => (x.score += 5)); break;
    case "magnet": t.forEach((x, i) => { if (i !== idx) { const g = Math.min(5, x.score); x.score -= g; me.score += g; } }); break;
    case "theft": t.forEach((x) => (x.score = 0)); break;
    case "eraser": me.score = Math.max(0, me.score - 15); break;
    case "double": me.score *= 2; break;
    case "trap": me.score = Math.max(0, min - 1); break;
    case "rocket": me.score = max + 1; break;
  }
  return t;
}
