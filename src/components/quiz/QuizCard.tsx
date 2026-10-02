import { Eye, Play, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { LaunchFlow } from "./LaunchFlow";
import { toast } from "sonner";
import { pluralQuestions, type Quiz } from "@/lib/quiz-store";
import { QuizCover } from "./QuizCover";

export function CreateQuizCard() {
  return (
    <button
      onClick={() => toast("Создание викторины откроется в редакторе")}
      className="flex min-h-[220px] flex-col items-center justify-center gap-[26px] rounded-2xl border-2 border-dashed border-placeholder-dashed bg-muted transition-colors hover:bg-muted/70"
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-card">
        <Plus className="size-6" />
      </span>
      <span className="text-base font-semibold">Создать викторину</span>
    </button>
  );
}

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const [launch, setLaunch] = useState(false);
  return (
    <article className="flex min-h-[220px] flex-col justify-between gap-6 rounded-2xl bg-card p-5 shadow-card">
      <LaunchFlow quiz={quiz} open={launch} onOpenChange={setLaunch} />
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="font-display text-xl font-semibold leading-6">{quiz.title}</h3>
          <p className="text-sm text-muted-foreground">{pluralQuestions(quiz.questions)}</p>
        </div>
        <div className="relative h-[124px] w-[152px] shrink-0 overflow-hidden rounded-xl">
          <QuizCover quiz={quiz} className="h-full w-full" />
          {quiz.grade && (
            <span className="absolute bottom-2 left-2 rounded-md bg-card px-2 py-1 text-xs font-medium">
              {quiz.grade}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setLaunch(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-launch px-3 text-xs font-semibold text-launch-foreground transition-opacity hover:opacity-90"
          >
            <Play className="size-4 fill-current" />
            Запустить
          </button>
          <button
            onClick={() => toast(`Предпросмотр: ${quiz.title}`)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold transition-colors hover:bg-secondary"
          >
            <Eye className="size-4" />
            Предпросмотр
          </button>
        </div>
        {quiz.mine && (
          <button
            aria-label="Настройки викторины"
            onClick={() => toast("Настройки викторины")}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
          >
            <Settings className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}
