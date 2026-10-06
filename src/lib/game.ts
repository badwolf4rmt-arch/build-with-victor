import generosityImg from "@/assets/bonuses/generosity.png.asset.json";
import likeImg from "@/assets/bonuses/like.png.asset.json";
import magnetImg from "@/assets/bonuses/magnet.png.asset.json";
import theftImg from "@/assets/bonuses/theft.png.asset.json";
import eraserImg from "@/assets/bonuses/eraser.png.asset.json";
import doubleImg from "@/assets/bonuses/double.png.asset.json";
import trapImg from "@/assets/bonuses/trap.png.asset.json";
import rocketImg from "@/assets/bonuses/rocket.png.asset.json";
import type { QuestionKind } from "./question-kinds";
export const AVATARS = ["fruit:dragonfruit", "fruit:durian", "fruit:lemon", "fruit:lychee", "fruit:strawberry", "fruit:mangosteen", "fruit:pear"];

export type BonusId = "generosity" | "like" | "magnet" | "theft" | "eraser" | "double" | "trap" | "rocket";

export const BONUSES: { id: BonusId; name: string; text: string; icon: string; image: string }[] = [
  { id: "generosity", name: "Щедрость", text: "Команда отдаёт баллы следующей по порядку", icon: "🎁", image: generosityImg.url },
  { id: "like", name: "Лайк", text: "Все команды получают по 5 баллов", icon: "👍", image: likeImg.url },
  { id: "magnet", name: "Магнит", text: "Команда получает по 5 баллов от других", icon: "🧲", image: magnetImg.url },
  { id: "theft", name: "Похищение", text: "Баллы всех команд обнуляются", icon: "🦹", image: theftImg.url },
  { id: "eraser", name: "Ластик", text: "Команда теряет 15 баллов", icon: "🩹", image: eraserImg.url },
  { id: "double", name: "Дубль", text: "Баллы команды удваиваются", icon: "✖️", image: doubleImg.url },
  { id: "trap", name: "Ловушка", text: "Команда переходит на последнее место", icon: "⚠️", image: trapImg.url },
  { id: "rocket", name: "Ракета", text: "Команда переходит на первое место", icon: "🚀", image: rocketImg.url },
];

export type Team = { name: string; avatar: string; score: number };
export type GameQuestion = { text: string; correct: string; incorrect: string[]; image?: string | undefined; kind?: QuestionKind | undefined; explanation?: string | undefined };
export type GameSetup = { quizId: string; title: string; questions: number; items: GameQuestion[]; teams: Team[]; bonuses: BonusId[] };

const KEY = "quiz-game-setup";
export const HIDE_RULES_KEY = "quiz-hide-rules";

export function saveSetup(s: GameSetup) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // too large with pictures — keep the questions without images
    sessionStorage.setItem(KEY, JSON.stringify({ ...s, items: s.items.map(({ image: _i, ...q }) => q) }));
  }
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

/** Points a team earns for a correct answer; shown on the preview card and the question list. */
export const QUESTION_POINTS = 5;
