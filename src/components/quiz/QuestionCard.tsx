import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScorePlate } from "./GameArt";

export type AnswerState = "idle" | "correct" | "wrong" | "dim";

/** The big question card (Figma «Card» 1390px): shared by the preview page and the live game so both look the same. */
export function QuestionCard({
  text,
  image,
  points,
  answers,
  onAnswer,
  footer,
  body,
}: {
  text: string;
  image?: string | undefined;
  points: number;
  answers: { t: string; state: AnswerState }[];
  onAnswer?: ((i: number) => void) | undefined;
  footer?: ReactNode;
  /** Replaces the answer buttons (ordering / typed-answer mechanics). */
  body?: ReactNode;
}) {
  return (
    <div className="relative mt-[27px] min-h-[620px] w-full rounded-[40px] bg-card px-6 py-10 sm:rounded-[64px] md:px-12">
      <ScorePlate points={points} className="!absolute -top-[27px] left-1/2 -translate-x-1/2" />
      <div className="grid min-h-[540px] grid-rows-[minmax(180px,1fr)_auto_128px] gap-6 pt-10">
        <div className={cn("grid w-full items-center gap-8", image && "md:grid-cols-2")}>
          <h2 className="text-center font-display text-[28px] font-semibold leading-9 md:text-[40px] md:leading-[48px]">{text || "Текст вопроса"}</h2>
          {image && <img src={image} alt="" className="aspect-[3/2] w-full rounded-3xl object-cover" />}
        </div>
        {body ?? <div className="grid w-full gap-4 md:grid-cols-2">
          {answers.map((a, i) => (
            <button
              key={i}
              type="button"
              disabled={!onAnswer}
              onClick={() => onAnswer?.(i)}
              className={cn(
                "flex min-h-20 items-center justify-center rounded-[24px] border-2 p-3 text-center font-display text-xl font-semibold leading-6 transition-colors disabled:cursor-default",
                a.state === "idle" && "border-answer-border enabled:hover:bg-info",
                a.state === "correct" && "border-success bg-success text-success-foreground",
                a.state === "wrong" && "border-destructive bg-destructive text-destructive-foreground",
                a.state === "dim" && "border-muted text-muted-foreground",
              )}
            >
              {a.t || "Вариант ответа"}
            </button>
          ))}
        </div>}
        <div className="flex min-h-32 w-full flex-col justify-end gap-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function GradientButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-action-gradient flex h-20 items-center justify-center rounded-[24px] p-6 font-display text-xl font-semibold text-primary-foreground hover:opacity-95">
      {children}
    </button>
  );
}
