import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { QUESTION_POINTS } from "@/lib/game";
import type { DraftQuestion } from "@/lib/quiz-store";
import { ScorePlate, ScoreStar } from "./GameArt";

/** Full-page quiz preview (Figma «1920 Полная страница»): question card, pagination and the list of questions. */
export function PreviewOverlay({
  title,
  items,
  onClose,
  onLaunch,
  onEdit,
  launchLabel = "Запустить",
}: {
  title: string;
  items: DraftQuestion[];
  onClose: () => void;
  onLaunch: () => void;
  onEdit?: () => void;
  launchLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const q = items[active];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  function go(d: number) {
    const n = active + d;
    if (n < 0 || n >= items.length) return;
    setActive(n);
    setReveal(false);
  }

  function pick(i: number) {
    setActive(i);
    setReveal(false);
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const answers = useMemo(() => {
    if (!q) return [];
    const list = [...q.incorrect.filter((a) => a.trim()).map((t) => ({ t, ok: false })), { t: q.correct, ok: true }];
    // stable pseudo-shuffle per question so the correct answer isn't always last
    return list.map((a, i) => ({ a, k: (i * 7 + active * 3) % list.length })).sort((x, y) => x.k - y.k).map((x) => x.a);
  }, [q, active]);

  return (
    <div ref={scroller} role="dialog" aria-label={`Предпросмотр: ${title}`} className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 flex h-[88px] items-center justify-between rounded-b-[32px] bg-card p-6">
        <button onClick={onClose} className="flex h-12 items-center gap-2.5 rounded-2xl bg-secondary pl-3.5 pr-[18px] text-sm font-semibold hover:bg-muted">
          <ArrowLeft className="size-5" /> Все викторины
        </button>
        <div className="flex items-center gap-5">
          {onEdit && (
            <button onClick={onEdit} className="flex h-12 items-center gap-2.5 rounded-2xl bg-secondary pl-3.5 pr-[18px] text-sm font-semibold hover:bg-muted">
              <Pencil className="size-5" /> Редактировать
            </button>
          )}
          <button onClick={onLaunch} className="flex h-12 items-center gap-2.5 rounded-2xl bg-primary pl-3.5 pr-[18px] text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Play className="size-5 fill-current" /> {launchLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1438px] flex-col gap-20 px-6 pb-16 pt-6">
        <section className="flex flex-col gap-8">
          <h1 className="font-display text-[32px] font-semibold leading-10">{title}</h1>
          <div className="flex flex-col gap-10">
            {q ? (
              <div className="relative mt-[27px] rounded-[64px] bg-card px-6 py-10 md:px-12">
                <ScorePlate points={QUESTION_POINTS} className="absolute -top-[27px] left-1/2 -translate-x-1/2" />
                <div className="flex flex-col items-center gap-10 pt-14">
                  <div className={cn("grid w-full items-center gap-8", q.image && "md:grid-cols-2")}>
                    <h2 className="text-center font-display text-[28px] font-semibold leading-9 md:text-[40px] md:leading-[48px]">
                      {q.text || "Текст вопроса"}
                    </h2>
                    {q.image && <img src={q.image.src} alt="" className="aspect-[3/2] w-full rounded-3xl object-cover" />}
                  </div>
                  <div className="flex w-full flex-col gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {answers.map((a, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex min-h-20 items-center justify-center rounded-[24px] border-2 p-3 text-center font-display text-xl font-semibold leading-6 transition-colors",
                            !reveal && "border-answer-border",
                            reveal && a.ok && "border-success bg-success text-success-foreground",
                            reveal && !a.ok && "border-muted text-muted-foreground",
                          )}
                        >
                          {a.t || "Вариант ответа"}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setReveal((r) => !r)}
                      className="bg-action-gradient flex h-20 items-center justify-center rounded-[24px] p-6 font-display text-xl font-semibold text-primary-foreground hover:opacity-95"
                    >
                      {reveal ? "Скрыть правильный ответ" : "Показать правильный ответ"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded-[64px] bg-card p-16 text-center text-muted-foreground">В викторине пока нет вопросов</p>
            )}

            {items.length > 0 && (
              <div className="flex items-center justify-center gap-2.5">
                <button aria-label="Предыдущий вопрос" disabled={active === 0} onClick={() => go(-1)} className="flex size-14 items-center justify-center rounded-2xl bg-card disabled:opacity-40">
                  <ChevronLeft className="size-6" />
                </button>
                <span className="min-w-[63px] text-center text-sm">{active + 1} из {items.length}</span>
                <button aria-label="Следующий вопрос" disabled={active === items.length - 1} onClick={() => go(1)} className="flex size-14 items-center justify-center rounded-2xl bg-card disabled:opacity-40">
                  <ChevronRight className="size-6" />
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold leading-8">Вопросы</h2>
            <label className="flex items-center gap-3 text-base">
              <Switch checked={showAnswers} onCheckedChange={setShowAnswers} />
              Показать правильные ответы
            </label>
          </div>
          <ol className="flex flex-col gap-4">
            {items.map((it, i) => (
              <li key={i}>
                <button
                  onClick={() => pick(i)}
                  className={cn(
                    "flex min-h-[160px] w-full flex-col justify-between gap-6 rounded-3xl bg-card py-6 pl-6 pr-4 text-left transition-shadow",
                    i === active ? "ring-2 ring-primary" : "hover:shadow-card",
                  )}
                >
                  <span className="flex flex-col gap-3">
                    <span className="font-display text-xl font-semibold leading-6">{it.text || "Без текста"}</span>
                    {showAnswers && it.correct && <span className="text-base leading-5">{it.correct}</span>}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <ScoreStar className="size-6 text-score-star" /> {QUESTION_POINTS}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
