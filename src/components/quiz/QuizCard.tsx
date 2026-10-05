import { Eye, Pencil, Play, Plus, Settings, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LaunchFlow } from "./LaunchFlow";
import { toast } from "sonner";
import { PreviewOverlay } from "./PreviewOverlay";
import { saveDraft, getQuizItems, pluralQuestions, type Quiz } from "@/lib/quiz-store";
import { QuizCover } from "./QuizCover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function QuizCard({ quiz, onDelete }: { quiz: Quiz; onDelete?: (id: string) => void }) {
  const [launch, setLaunch] = useState(false);
  const [preview, setPreview] = useState(false);
  const navigate = useNavigate();
  function edit() {
    const items = getQuizItems(quiz);
    saveDraft({
      title: quiz.title,
      questions: items.length ? items : [{ text: "", correct: "", incorrect: ["", "", ""] }],
      cover: quiz.image,
      id: quiz.id,
    });
    navigate({ to: "/quiz/new" });
  }
  return (
    <article className="flex min-h-[220px] flex-col justify-between gap-6 rounded-2xl bg-card p-5 shadow-card">
      <LaunchFlow quiz={quiz} open={launch} onOpenChange={setLaunch} />
      {preview && (
        <PreviewOverlay
          title={quiz.title}
          items={getQuizItems(quiz)}
          onClose={() => setPreview(false)}
          onEdit={() => { setPreview(false); edit(); }}
          onLaunch={() => { setPreview(false); setLaunch(true); }}
        />
      )}
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="font-display text-xl font-semibold leading-6">{quiz.title}</h3>
          <p className="text-sm text-muted-foreground">{pluralQuestions(quiz.questions)}</p>
        </div>
        <button type="button" onClick={edit} aria-label="Изменить обложку" className="relative h-[124px] w-[152px] shrink-0 overflow-hidden rounded-xl">
          <QuizCover quiz={quiz} className="h-full w-full" />
          {quiz.grade && (
            <span className="absolute bottom-2 left-2 rounded-md bg-card px-2 py-1 text-xs font-medium">
              {quiz.grade}
            </span>
          )}
        </button>
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
            onClick={() => setPreview(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold transition-colors hover:bg-secondary"
          >
            <Eye className="size-4" />
            Предпросмотр
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Настройки викторины"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
            >
              <Settings className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={edit} className="gap-2">
              <Pencil className="size-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onDelete?.(quiz.id);
                toast(`Викторина «${quiz.title}» удалена`);
              }}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
