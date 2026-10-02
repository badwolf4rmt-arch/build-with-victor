import { ChevronsLeft, ChevronsRight, Play, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { DraftQuestion } from "@/lib/quiz-store";

/** Full-screen quiz preview: question card on the left, question list curtain on the right. */
export function PreviewOverlay({
  title,
  items,
  onClose,
  onLaunch,
  launchLabel = "Запустить",
}: {
  title: string;
  items: DraftQuestion[];
  onClose: () => void;
  onLaunch: () => void;
  launchLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const q = items[active];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const answers = useMemo(() => {
    if (!q) return [];
    const list = [...q.incorrect.filter((a) => a.trim()).map((t) => ({ t, ok: false })), { t: q.correct, ok: true }];
    // stable pseudo-shuffle per question so the correct answer isn't always last
    return list.map((a, i) => ({ a, k: (i * 7 + active * 3) % list.length })).sort((x, y) => x.k - y.k).map((x) => x.a);
  }, [q, active]);

  return (
    <div role="dialog" aria-label={`Предпросмотр: ${title}`} className="fixed inset-0 z-50 flex flex-col bg-preview-bar">
      <button onClick={onClose} className="mx-auto flex h-[60px] items-center gap-2 text-sm font-semibold text-card">
        <X className="size-5" /> Закрыть предпросмотр
      </button>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-t-[32px] bg-background">
        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-y-auto p-8">
          {q ? (
            <div className="relative w-full max-w-[1100px] rounded-[40px] bg-card p-10 shadow-card">
              <span className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border-4 border-warning bg-warning px-3 py-1 font-display text-3xl font-bold text-warning-foreground">
                <Star className="size-7 fill-current" />15
              </span>
              <div className={cn("grid items-center gap-8", q.image && "md:grid-cols-2")}>
                <h2 className="text-center font-display text-[28px] font-semibold leading-9 md:text-[32px] md:leading-10">
                  {q.text || "Текст вопроса"}
                </h2>
                {q.image && <img src={q.image.src} alt="" className="aspect-[3/2] w-full rounded-3xl object-cover" />}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {answers.map((a, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex min-h-[92px] items-center justify-center rounded-2xl px-6 py-4 text-center text-lg font-semibold",
                      a.ok ? "bg-success text-success-foreground" : "bg-muted-answer text-card",
                    )}
                  >
                    {a.t || "Вариант ответа"}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">В викторине пока нет вопросов</p>
          )}
          <button
            aria-label={collapsed ? "Показать вопросы" : "Скрыть вопросы"}
            onClick={() => setCollapsed((c) => !c)}
            className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-xl bg-card shadow-card"
          >
            {collapsed ? <ChevronsLeft className="size-5" /> : <ChevronsRight className="size-5" />}
          </button>
        </div>

        {!collapsed && (
          <aside className="flex w-[360px] shrink-0 flex-col rounded-tl-[32px] bg-card">
            <h3 className="px-6 pt-6 font-display text-2xl font-semibold">Вопросы ({items.length})</h3>
            <ol className="mt-5 flex-1 space-y-2 overflow-y-auto px-6">
              {items.map((it, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActive(i)}
                    className={cn(
                      "flex w-full gap-3 rounded-2xl p-3 text-left text-sm font-semibold transition-colors",
                      i === active ? "bg-info" : "bg-secondary hover:bg-muted",
                    )}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-card text-xs">{i + 1}</span>
                    <span className="line-clamp-4">{it.text || "Без текста"}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="p-6">
              <button onClick={onLaunch} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Play className="size-4 fill-current" /> {launchLabel}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
