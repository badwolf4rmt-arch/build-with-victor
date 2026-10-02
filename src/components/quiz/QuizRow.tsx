import { pluralQuestions, type Quiz } from "@/lib/quiz-store";
import { QuizCover } from "./QuizCover";

export function QuizRow({ quiz }: { quiz: Quiz }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <QuizCover quiz={quiz} className="size-11 shrink-0 rounded-lg" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{quiz.title}</p>
        <p className="text-xs text-muted-foreground">{pluralQuestions(quiz.questions)}</p>
      </div>
    </div>
  );
}
