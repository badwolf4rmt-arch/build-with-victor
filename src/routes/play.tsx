import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { Modal } from "@/components/quiz/Modal";
import { CardOrnament, ScoreStar } from "@/components/quiz/GameArt";
import { GradientButton, QuestionCard } from "@/components/quiz/QuestionCard";
import { FitToScreen } from "@/components/quiz/FitToScreen";
import { InputAnswer, OrderAnswer } from "@/components/quiz/AnswerArea";
import { kindOf, orderSteps } from "@/lib/question-kinds";
import { cn } from "@/lib/utils";
import { getQuizItems, saveDraft, useQuizStore } from "@/lib/quiz-store";
import { applyBonus, BONUSES, loadSetup, QUESTION_POINTS, type BonusId, type GameSetup, type Team } from "@/lib/game";
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

type Cell = { n: number; q?: number; bonus?: BonusId; done: boolean };

function PlayPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<GameSetup | null | undefined>(undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [turn, setTurn] = useState(0);
  const [cells, setCells] = useState<Cell[]>([]);
  const [open, setOpen] = useState<Cell | null>(null);
  const [finished, setFinished] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const { quizzes } = useQuizStore();

  useEffect(() => {
    const s = loadSetup();
    setSetup(s);
    if (!s) return;
    setTeams(s.teams);
    const items = s.items ?? [];
    const total = items.length;
    const bonusCount = s.bonuses.length ? Math.min(s.bonuses.length, Math.floor(total / 3) || 1) : 0;
    const extra = Array.from({ length: bonusCount }, (_, i) => s.bonuses[Math.floor(Math.random() * s.bonuses.length)]!).slice(0, bonusCount);
    const list: Cell[] = Array.from({ length: total }, (_, i) => ({ n: i + 1, q: i, done: false }));
    extra.forEach((b) => list.push({ n: 0, bonus: b, done: false }));
    list.sort(() => Math.random() - 0.5);
    setCells(list.map((c, i) => ({ ...c, n: i + 1 })));
  }, []);

  const cols = useMemo(() => (cells.length <= 10 ? 5 : cells.length <= 18 ? 6 : 8), [cells.length]);

  if (setup === undefined) return null;
  if (!setup || !(setup.items ?? []).length)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{setup ? "В викторине нет вопросов" : "Игра не настроена"}</p>
        <Link to="/" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">К викторинам</Link>
      </div>
    );

  const resolve = (correct: boolean | null) => {
    if (!open) return;
    let next = teams;
    if (open.bonus) next = applyBonus(teams, turn, open.bonus);
    else if (correct) next = teams.map((t, i) => (i === turn ? { ...t, score: t.score + QUESTION_POINTS } : t));
    setTeams(next);
    const nextCells = cells.map((c) => (c.n === open.n ? { ...c, done: true } : c));
    setCells(nextCells);
    setOpen(null);
    setPicked(null);
    setTurn((t) => (t + 1) % teams.length);
    if (nextCells.every((c) => c.done)) setFinished(true);
  };

  const question = open && open.q !== undefined ? setup.items[open.q] : undefined;
  const options = question ? shuffled(open!.n, [question.correct, ...question.incorrect.filter((x) => x.trim())]) : [];
  const bonus = open?.bonus ? BONUSES.find((b) => b.id === open.bonus) : undefined;
  const ranking = [...teams].sort((a, b) => b.score - a.score);

  const rows = Math.ceil(cells.length / cols);

  function editQuiz() {
    const quiz = quizzes.find((q) => q.id === setup?.quizId);
    if (!quiz) return;
    const items = getQuizItems(quiz);
    saveDraft({ title: quiz.title, questions: items.length ? items : [{ text: "", correct: "", incorrect: ["", "", ""] }], cover: quiz.image, id: quiz.id });
    void navigate({ to: "/quiz/new" });
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden">
      <img src={bg} alt="" className="fixed inset-0 -z-10 h-full w-full object-cover" />
      <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-b-[24px] bg-card px-3 py-2.5 sm:rounded-b-[32px] sm:px-6 sm:py-3 lg:grid-cols-[177px_minmax(0,1fr)_auto]">
        <div className="hidden w-[177px] lg:block" />
        <div className="flex min-w-0 justify-start gap-2 overflow-x-auto lg:justify-center lg:gap-3">
          {teams.map((t, i) => (
            <div
              key={i}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border-[3px] border-team-chip py-1.5 pl-1.5 pr-3 lg:w-[230px] lg:py-2 lg:pl-2 lg:pr-4",
                i === turn ? "bg-team-chip" : "bg-card",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-team-chip text-2xl lg:size-14 lg:text-3xl">{t.avatar}</span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-display text-lg font-semibold leading-6 lg:text-2xl lg:leading-8">
                  <ScoreStar className="size-6 text-score-star lg:size-8" />
                  {t.score}
                </p>
                <p className="truncate text-sm leading-4 lg:text-base lg:leading-5">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button onClick={editQuiz} aria-label="Редактировать викторину" className="flex size-10 items-center justify-center rounded-xl bg-secondary hover:bg-muted sm:size-12 sm:rounded-2xl">
            <Pencil className="size-5" />
          </button>
          <button onClick={() => setFinished(true)} aria-label="Завершить викторину" className="flex size-10 items-center justify-center rounded-xl bg-secondary text-sm font-semibold hover:bg-muted sm:h-12 sm:w-auto sm:gap-2.5 sm:rounded-2xl sm:pl-3.5 sm:pr-[18px]">
            <X className="size-5" /> <span className="hidden sm:inline">Завершить</span>
          </button>
        </div>
      </header>

      <Board cells={cells} cols={cols} rows={rows} onOpen={setOpen} />

      {question && open && (
        <div role="dialog" aria-label={`Вопрос ${open.n}`} className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm">
          <div className="mx-auto flex h-dvh min-h-0 w-full max-w-[1438px] flex-col gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-4">
            <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-card">
              <p className="min-w-0 truncate font-display text-lg font-semibold sm:text-2xl">Вопрос {open.n} · отвечает «{teams[turn]?.name}»</p>
              {!picked && (
                <button onClick={() => setOpen(null)} aria-label="Закрыть вопрос" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-sm font-semibold text-foreground hover:bg-secondary sm:h-12 sm:w-auto sm:gap-2.5 sm:rounded-2xl sm:pl-3.5 sm:pr-[18px]">
                  <X className="size-5" /> <span className="hidden sm:inline">Закрыть</span>
                </button>
              )}
            </div>
            <FitToScreen className="flex-1">
            <QuestionCard
              text={question.text}
              image={question.image}
              points={QUESTION_POINTS}
              answers={options.map((opt) => ({
                t: opt,
                state: !picked ? "idle" : opt === question.correct ? "correct" : opt === picked ? "wrong" : "dim",
              }))}
              onAnswer={picked ? undefined : (i) => { setPicked(options[i]!); setOk(options[i] === question.correct); }}
              body={
                kindOf(question) === "order" ? (
                  <OrderAnswer key={open.n} steps={orderSteps(question)} seed={open.n} reveal={!!picked} onCheck={(o, c) => { setPicked(o.join("|")); setOk(c); }} />
                ) : kindOf(question) === "input" ? (
                  <InputAnswer key={open.n} correct={question.correct} reveal={!!picked} onCheck={(a, c) => { setPicked(a); setOk(c); }} />
                ) : undefined
              }
              footer={
                picked ? (
                  <>
                    <p className="text-center font-display text-xl font-semibold">
                      {ok ? `Верно! +${QUESTION_POINTS} баллов` : "Неверно — правильный ответ выделен зелёным"}
                    </p>
                    <GradientButton onClick={() => resolve(ok)}>Дальше</GradientButton>
                  </>
                ) : null
              }
            />
            </FitToScreen>
          </div>
        </div>
      )}

      <Modal open={!!bonus} onOpenChange={() => {}} title={bonus ? `Бонус: ${bonus.name}` : ""} description={bonus?.text ?? ""}>
        {bonus && (
          <div className="mt-6 flex flex-col items-center gap-6">
            <span className="text-7xl">{bonus.icon}</span>
            <button onClick={() => resolve(null)} className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Применить</button>
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

function shuffled(seed: number, list: string[]) {
  const arr = [...list];
  let x = seed * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Card proportions from Figma «Игровое поле»: 361×464 at 1920×1080 — cards stay portrait rectangles on any screen. */
const CARD_RATIO = 361 / 464;
const GAP = 16;

function Board({ cells, cols, rows, onOpen }: { cells: Cell[]; cols: number; rows: number; onOpen: (c: Cell) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e!.contentRect;
      const byHeight = (height - GAP * (rows - 1)) / rows;
      const byWidth = (width - GAP * (cols - 1)) / cols / CARD_RATIO;
      const h = Math.max(100, Math.min(byHeight, byWidth));
      setSize({ w: h * CARD_RATIO, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, rows]);

  return (
    <main ref={ref} className="flex min-h-0 flex-1 items-center justify-center p-6">
      {size.w > 0 && (
        <div className="grid" style={{ gap: GAP, gridTemplateColumns: `repeat(${cols}, ${size.w}px)`, gridAutoRows: `${size.h}px` }}>
          {cells.map((c) => (
            <button
              key={c.n}
              disabled={c.done}
              onClick={() => onOpen(c)}
              style={{ borderRadius: Math.round(size.h * 0.1) }}
              aria-label={c.done ? `Карточка ${c.n} открыта` : `Карточка ${c.n}`}
              className={cn(
                "relative overflow-hidden transition-transform",
                "bg-game-card-gradient shadow-game-card",
                c.done ? "opacity-55" : "hover:-rotate-3 hover:scale-[1.04] hover:brightness-95",
              )}
            >
              {(
                <>
                  <CardOrnament className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" style={{ width: size.w * 1.25, height: size.h * 0.91 }} />
                  <span className="relative font-display font-semibold leading-none text-primary-foreground" style={{ fontSize: Math.round(size.h * 0.17) }}>{c.n}</span>
                </>
              )}
            </button>
          ))}
          {Array.from({ length: (cols - (cells.length % cols)) % cols }, (_, i) => (
            <div key={`empty-${i}`} aria-hidden className="bg-game-card-empty backdrop-blur-md" style={{ borderRadius: Math.round(size.h * 0.1) }} />
          ))}
        </div>
      )}
    </main>
  );
}
