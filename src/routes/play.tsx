import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { Modal } from "@/components/quiz/Modal";
import { cn } from "@/lib/utils";
import { applyBonus, BONUSES, loadSetup, type BonusId, type GameSetup, type Team } from "@/lib/game";
import bg from "@/assets/game-bg.jpg";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Игровое поле — Конструктор викторин" },
      { name: "description", content: "Командная викторина: выбирайте карточки, отвечайте и набирайте баллы." },
      { property: "og:title", content: "Игровое поле — Конструктор викторин" },
      { property: "og:description", content: "Командная викторина с бонусами." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayPage,
});

type Cell = { n: number; bonus?: BonusId; done: boolean };

function PlayPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<GameSetup | null | undefined>(undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [turn, setTurn] = useState(0);
  const [cells, setCells] = useState<Cell[]>([]);
  const [open, setOpen] = useState<Cell | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const s = loadSetup();
    setSetup(s);
    if (!s) return;
    setTeams(s.teams);
    const total = Math.max(1, s.questions);
    const bonusCount = s.bonuses.length ? Math.min(s.bonuses.length, Math.floor(total / 3) || 1) : 0;
    const extra = Array.from({ length: bonusCount }, (_, i) => s.bonuses[Math.floor(Math.random() * s.bonuses.length)]!).slice(0, bonusCount);
    const list: Cell[] = Array.from({ length: total }, (_, i) => ({ n: i + 1, done: false }));
    extra.forEach((b) => list.push({ n: 0, bonus: b, done: false }));
    list.sort(() => Math.random() - 0.5);
    setCells(list.map((c, i) => ({ ...c, n: i + 1 })));
  }, []);

  const cols = useMemo(() => (cells.length <= 10 ? 5 : cells.length <= 18 ? 6 : 8), [cells.length]);

  if (setup === undefined) return null;
  if (!setup)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Игра не настроена</p>
        <Link to="/" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">К викторинам</Link>
      </div>
    );

  const resolve = (correct: boolean | null) => {
    if (!open) return;
    let next = teams;
    if (open.bonus) next = applyBonus(teams, turn, open.bonus);
    else if (correct) next = teams.map((t, i) => (i === turn ? { ...t, score: t.score + 5 } : t));
    setTeams(next);
    const nextCells = cells.map((c) => (c.n === open.n ? { ...c, done: true } : c));
    setCells(nextCells);
    setOpen(null);
    setTurn((t) => (t + 1) % teams.length);
    if (nextCells.every((c) => c.done)) setFinished(true);
  };

  const bonus = open?.bonus ? BONUSES.find((b) => b.id === open.bonus) : undefined;
  const ranking = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="relative flex min-h-screen flex-col">
      <img src={bg} alt="" className="fixed inset-0 -z-10 h-full w-full object-cover" />
      <header className="flex items-center justify-between gap-4 rounded-b-[32px] bg-card px-6 py-5">
        <div className="w-10" />
        <div className="flex flex-wrap justify-center gap-3">
          {teams.map((t, i) => (
            <div key={i} className={cn("flex items-center gap-2 rounded-full border-2 px-2 py-1 pr-5", i === turn ? "border-accent bg-accent" : "border-accent bg-card")}>
              <span className="flex size-10 items-center justify-center rounded-full bg-card text-2xl">{t.avatar}</span>
              <div>
                <p className="flex items-center gap-1 text-lg font-bold leading-5"><Star className="size-5 fill-amber-400 text-amber-400" />{t.score}</p>
                <p className="text-xs">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setFinished(true)} className="flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold hover:bg-muted">
          <X className="size-4" /> Завершить
        </button>
      </header>

      <main className="grid flex-1 auto-rows-[minmax(140px,240px)] content-start gap-4 p-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cells.map((c) => (
          <button
            key={c.n}
            disabled={c.done}
            onClick={() => setOpen(c)}
            className={cn(
              "min-h-[140px] rounded-[28px] font-display text-6xl font-semibold transition-transform",
              c.done ? "bg-card/30 backdrop-blur-md" : "bg-primary/70 text-primary-foreground shadow-card hover:scale-[1.02]",
            )}
          >
            {!c.done && c.n}
          </button>
        ))}
      </main>

      <Modal open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={bonus ? `Бонус: ${bonus.name}` : `Вопрос ${open?.n ?? ""}`} description={bonus ? bonus.text : `Отвечает «${teams[turn]?.name}». Ответила ли команда верно?`}>
        {bonus ? (
          <div className="mt-6 flex flex-col items-center gap-6">
            <span className="text-7xl">{bonus.icon}</span>
            <button onClick={() => resolve(null)} className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Применить</button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => resolve(false)} className="h-12 rounded-xl bg-secondary text-sm font-semibold hover:bg-muted">Неверно</button>
            <button onClick={() => resolve(true)} className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Верно, +5</button>
          </div>
        )}
      </Modal>

      <Modal open={finished} onOpenChange={setFinished} title="Итоги викторины">
        <ol className="mt-5 flex flex-col gap-3">
          {ranking.map((t, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
              <span className="w-5 font-semibold">{i + 1}</span>
              <span className="text-2xl">{t.avatar}</span>
              <span className="flex-1">{t.name}</span>
              <span className="font-bold">{t.score}</span>
            </li>
          ))}
        </ol>
        <button onClick={() => void navigate({ to: "/" })} className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">К викторинам</button>
      </Modal>
    </div>
  );
}
