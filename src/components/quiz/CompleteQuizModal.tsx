import { isPlayable, kindOf } from "@/lib/question-kinds";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Minus, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { completeQuiz } from "@/lib/quiz-ai.functions";
import type { Draft } from "@/lib/quiz-store";
import { Modal } from "./Modal";

const blank = (s?: string) => !s || !s.trim();

export function CompleteQuizModal({ open, onOpenChange, quiz, onApply }: { open: boolean; onOpenChange: (o: boolean) => void; quiz: Draft; onApply: (q: Draft) => void }) {
  const run = useServerFn(completeQuiz);
  const [source, setSource] = useState("");
  const [add, setAdd] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partial = quiz.questions.filter((q) => {
    const any = !blank(q.text) || !blank(q.correct) || q.incorrect.some((x) => !blank(x));
    const full = kindOf(q) !== "choice" ? isPlayable(q) : !blank(q.text) && !blank(q.correct) && q.incorrect.filter((x) => !blank(x)).length >= 3;
    return any && !full;
  }).length;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await run({
        data: {
          title: quiz.title,
          source: source.trim() || undefined,
          add,
          questions: quiz.questions.map((q) => ({ text: q.text, correct: q.correct, incorrect: q.incorrect })),
        },
      });
      if (!res.ok) return setError(res.error);
      // keep everything the user typed; only fill empty fields
      const questions = quiz.questions.map((q, i) => {
        const f = res.filled.find((x) => x.index === i);
        if (!f || kindOf(q) !== "choice") return q;
        const inc = [0, 1, 2].map((k) => (blank(q.incorrect[k]) ? (f.incorrect[k] ?? "") : q.incorrect[k]!));
        return { ...q, text: blank(q.text) ? f.text : q.text, correct: blank(q.correct) ? f.correct : q.correct, incorrect: inc };
      });
      // drop completely empty placeholder questions before appending
      const kept = questions.filter((q) => !blank(q.text) || !blank(q.correct) || q.image);
      onApply({ ...quiz, questions: [...kept, ...res.added.map((a) => ({ text: a.text, correct: a.correct, incorrect: a.incorrect.slice(0, 3) }))] });
      onOpenChange(false);
    } catch {
      setError("Не удалось дополнить викторину");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => !loading && onOpenChange(o)} title="Дополнить с ИИ" description="Ваши вопросы, ответы и картинки останутся без изменений — ИИ заполнит только пустые поля и добавит новые вопросы.">
      <div className="mt-5 flex flex-col gap-4">
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          maxLength={20000}
          placeholder="Необязательно: вставьте текст, по которому дополнять вопросы. Без текста ИИ опирается на название и ваши вопросы"
          className="h-32 w-full resize-none rounded-2xl border border-border p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Новых вопросов</p>
            <p className="text-xs text-muted-foreground">{partial ? `И заполнить пустые поля в ${partial} вопр.` : "От 0 до 20"}</p>
          </div>
          <div className="flex h-12 items-center gap-2 rounded-xl border border-border px-1">
            <button aria-label="Меньше" onClick={() => setAdd((n) => Math.max(0, n - 1))} className="flex size-10 items-center justify-center rounded-lg bg-secondary"><Minus className="size-4" /></button>
            <span className="w-6 text-center text-sm">{add}</span>
            <button aria-label="Больше" onClick={() => setAdd((n) => Math.min(20, n + 1))} className="flex size-10 items-center justify-center rounded-lg bg-secondary"><Plus className="size-4" /></button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={loading || (add === 0 && partial === 0)}
          onClick={submit}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          {loading ? "Дополняем…" : "Сгенерировать"}
        </button>
      </div>
    </Modal>
  );
}
