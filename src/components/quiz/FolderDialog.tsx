import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Quiz } from "@/lib/quiz-store";
import { AddQuizzesDialog } from "./AddQuizzesDialog";
import { Modal, ModalActions } from "./Modal";
import { QuizRow } from "./QuizRow";

export function FolderDialog({
  open,
  onOpenChange,
  mode,
  quizzes,
  initialName = "",
  initialQuizIds = [],
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  quizzes: Quiz[];
  initialName?: string;
  initialQuizIds?: string[];
  onSubmit: (name: string, quizIds: string[]) => void;
}) {
  const [name, setName] = useState(initialName);
  const [ids, setIds] = useState<string[]>(initialQuizIds);
  const [adding, setAdding] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setIds(initialQuizIds);
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = ids.map((id) => quizzes.find((q) => q.id === id)).filter(Boolean) as Quiz[];
  const invalid = name.trim().length === 0;

  const submit = () => {
    setTouched(true);
    if (invalid) return;
    onSubmit(name.trim(), ids);
    onOpenChange(false);
  };

  return (
    <>
      <Modal
        open={open && !adding}
        onOpenChange={onOpenChange}
        title={mode === "create" ? "Новая папка" : "Редактирование папки"}
      >
        <div className="mt-8">
          <label htmlFor="folder-name" className="text-base font-semibold">
            Название
          </label>
          <div
            className={
              "mt-3 flex h-12 items-center rounded-xl border px-[14px] focus-within:border-primary " +
              (touched && invalid ? "border-destructive" : "border-border")
            }
          >
            <input
              id="folder-name"
              autoFocus
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Введите название"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {name && (
              <button aria-label="Очистить" onClick={() => setName("")} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            )}
          </div>
          {touched && invalid && (
            <p className="mt-1.5 text-xs text-destructive">Введите название папки</p>
          )}
        </div>

        <div className="mt-8">
          <p className="text-base font-semibold">Викторины</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Plus className="size-5" />
            Добавить викторины
          </button>
          {selected.length > 0 && (
            <ul className="-mr-4 mt-4 flex max-h-[204px] flex-col gap-[7px] overflow-y-auto pr-4">
              {selected.map((q) => (
                <li key={q.id} className="flex items-center gap-3">
                  <QuizRow quiz={q} />
                  <button
                    aria-label="Убрать из папки"
                    onClick={() => setIds((s) => s.filter((x) => x !== q.id))}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ModalActions
          onCancel={() => onOpenChange(false)}
          confirmLabel={mode === "create" ? "Создать" : "Сохранить"}
          onConfirm={submit}
        />
      </Modal>

      <AddQuizzesDialog
        open={open && adding}
        onOpenChange={(o) => !o && setAdding(false)}
        quizzes={quizzes}
        initialSelected={ids}
        onAdd={(next) => setIds(next)}
      />
    </>
  );
}
