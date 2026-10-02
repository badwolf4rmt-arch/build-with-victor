import type { Quiz } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";

export function QuizCover({ quiz, className }: { quiz: Quiz; className?: string }) {
  if (quiz.image) {
    return (
      <img
        src={quiz.image}
        alt=""
        loading="lazy"
        className={cn("object-cover", className)}
      />
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-quiz-gradient", className)}>
      <div className="absolute -left-1/4 top-1/3 h-[140%] w-[160%] rotate-[-12deg] rounded-[50%] bg-card/10" />
    </div>
  );
}
