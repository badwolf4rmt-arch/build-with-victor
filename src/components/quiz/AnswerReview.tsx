import { Check, X } from "lucide-react";
import type { GameQuestion } from "@/lib/game";
import { kindOf, ORDER_SEP, orderSteps } from "@/lib/question-kinds";
import { cn } from "@/lib/utils";
import { RichText } from "./RichText";

export function AnswerReview({ q, answer, correct, showExplanation = false }: { q: GameQuestion; answer?: string | undefined; correct: boolean; showExplanation?: boolean }) {
  const kind = kindOf(q);
  const expected = kind === "order" ? orderSteps(q) : [q.correct];
  const choices = kind === "choice" ? [q.correct, ...q.incorrect.filter(Boolean)] : expected;
  return <div className="flex flex-col gap-3">
    {answer && !correct && <div className="rounded-2xl border-2 border-destructive p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive"><X className="size-4" /> Ваш ответ</p>
      <RichText text={answer.split(ORDER_SEP).join(" → ")} className="text-base font-semibold" />
    </div>}
    <p className="text-sm font-semibold">{kind === "order" ? "Правильный порядок" : correct && kind === "input" ? "Ваш ответ — верно" : "Правильный ответ"}</p>
    {choices.map((choice, i) => {
      const right = kind !== "choice" || choice === q.correct;
      return <div key={`${i}-${choice}`} className={cn("flex min-h-14 items-center gap-3 rounded-2xl border-2 p-3", right ? "border-success bg-success-soft text-foreground" : "border-border text-muted-foreground")}>
        {kind === "order" ? <span className="font-semibold">{i + 1}.</span> : right ? <Check className="size-5 shrink-0 text-success" /> : null}
        <RichText text={choice} className="flex-1 text-base font-semibold" />
      </div>;
    })}
    {showExplanation && q.explanation?.trim() && <div className="border-t border-border pt-4">
      <p className="mb-2 text-sm font-semibold">Комментарий к ответу</p>
      <RichText text={q.explanation} className="text-base leading-6" />
    </div>}
  </div>;
}