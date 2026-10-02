import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Info, Loader2, Minus, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateQuiz, SUBJECTS } from "@/lib/quiz-ai.functions";
import { saveDraft } from "@/lib/quiz-store";
import { Modal } from "./Modal";

const MIN_TEXT = 200;
const MAX_Q = 20;

export function AiGenerateDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const run = useServerFn(generateQuiz);
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [subject, setSubject] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = text.trim().length < MIN_TEXT;
  const canSubmit = !tooShort && count >= 1 && count <= MAX_Q && !loading;

  async function submit() {
    setLoading(true);
    try {
      const res = await run({ data: { text: text.trim(), count, subject: subject || undefined } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      saveDraft(res.quiz);
      onOpenChange(false);
      navigate({ to: "/quiz/new" });
    } catch {
      setError("Не удалось сгенерировать викторину");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[720px] flex-col rounded-l-[32px] bg-card outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex items-start justify-between gap-4">
                <DialogPrimitive.Title className="font-display text-[32px] font-semibold leading-10">
                  Генерация викторины с ИИ
                </DialogPrimitive.Title>
                <DialogPrimitive.Close aria-label="Закрыть" disabled={loading}>
                  <X className="size-6" />
                </DialogPrimitive.Close>
              </div>
              <DialogPrimitive.Description className="sr-only">
                Вставьте текст, выберите количество вопросов и предмет
              </DialogPrimitive.Description>

              <div className="mt-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Вставьте текст из учебника, статьи или презентации длиннее 200 символов"
                  className="h-[306px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {text.trim().length < MIN_TEXT
                    ? `Ещё ${MIN_TEXT - text.trim().length} символов`
                    : `${text.trim().length} символов`}
                </p>
              </div>

              <div className="mt-4 flex gap-3 rounded-2xl bg-info p-4">
                <Info className="mt-0.5 size-5 shrink-0 fill-primary text-card" />
                <div>
                  <p className="text-sm font-semibold">Больше текста — лучше вопросы</p>
                  <p className="mt-1 text-sm text-foreground/80">
                    Для создания разнообразных и содержательных вопросов ИИ нужно достаточно информации. В текстах
                    короче 200 символов обычно не хватает нужных деталей
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-5">
                <div>
                  <p className="font-display text-xl font-semibold">Количество вопросов</p>
                  <p className="mt-1 text-sm text-muted-foreground">Не больше 20 вопросов</p>
                </div>
                <div className="flex h-12 w-[132px] items-center justify-between rounded-xl border border-border px-1">
                  <button
                    aria-label="Меньше"
                    onClick={() => setCount((c) => Math.max(1, c - 1))}
                    className="flex size-10 items-center justify-center rounded-lg bg-secondary disabled:opacity-40"
                    disabled={count <= 1}
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    value={count}
                    inputMode="numeric"
                    onChange={(e) => setCount(Math.min(MAX_Q, Number(e.target.value.replace(/\D/g, "")) || 0))}
                    className="w-8 bg-transparent text-center text-sm outline-none"
                    aria-label="Количество вопросов"
                  />
                  <button
                    aria-label="Больше"
                    onClick={() => setCount((c) => Math.min(MAX_Q, c + 1))}
                    className="flex size-10 items-center justify-center rounded-lg bg-secondary disabled:opacity-40"
                    disabled={count >= MAX_Q}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-5">
                <div>
                  <p className="font-display text-xl font-semibold">Предмет</p>
                  <p className="mt-1 text-sm text-muted-foreground">ИИ сможет точнее подобрать термины и вопросы</p>
                </div>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-12 w-[232px] rounded-xl">
                    <SelectValue placeholder="Выберите предмет" />
                  </SelectTrigger>
                  <SelectContent className="z-[60]">
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center py-3">
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="h-12 min-w-[160px] rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Сгенерировать
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-l-[32px] bg-card">
                <div className="relative flex size-28 items-center justify-center rounded-full bg-info">
                  <Sparkles className="size-12 text-primary" />
                  <Loader2 className="absolute size-28 animate-spin text-primary/40" strokeWidth={1} />
                </div>
                <p className="font-display text-xl font-semibold">ИИ создаёт вопросы…</p>
                <p className="text-sm text-muted-foreground">Это может занять до минуты</p>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <Modal open={!!error} onOpenChange={(o) => !o && setError(null)} title="Не получилось сгенерировать">
        <div className="mt-2 flex flex-col items-center gap-4 text-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-destructive/10 font-display text-5xl font-bold text-destructive">
            ?
          </span>
          <p className="text-sm text-foreground/80">{error}. Попробуйте ещё раз или измените текст.</p>
          <button
            onClick={() => setError(null)}
            className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Понятно
          </button>
        </div>
      </Modal>
    </>
  );
}
