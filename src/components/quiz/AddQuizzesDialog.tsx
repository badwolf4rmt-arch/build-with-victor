import { Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Quiz } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { Modal, ModalActions } from "./Modal";
import { QuizRow } from "./QuizRow";

export function AddQuizzesDialog({
  open,
  onOpenChange,
  quizzes,
  initialSelected,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  quizzes: Quiz[];
  initialSelected: string[];
  onAdd: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(initialSelected);
    }
  }, [open, initialSelected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? quizzes.filter((x) => x.title.toLowerCase().includes(q)) : quizzes;
  }, [quizzes, query]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Добавление викторин">
      <label
        className={cn(
          "mt-6 flex h-12 items-center gap-2.5 rounded-xl border px-[14px] transition-colors",
          query ? "border-primary" : "border-border",
        )}
      >
        <Search className="size-5 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button aria-label="Очистить" onClick={() => setQuery("")} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        )}
      </label>

      <div className="-mr-4 mt-4 h-[340px] overflow-y-auto pr-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Ничего не найдено</p>
        ) : (
          <ul className="flex flex-col gap-[7px]">
            {filtered.map((q) => {
              const checked = selected.includes(q.id);
              return (
                <li key={q.id}>
                  <button
                    onClick={() => toggle(q.id)}
                    className="flex w-full items-center gap-3 rounded-xl py-1 text-left"
                    aria-pressed={checked}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                      )}
                    >
                      {checked && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <QuizRow quiz={q} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ModalActions
        onCancel={() => onOpenChange(false)}
        confirmLabel="Добавить"
        onConfirm={() => {
          onAdd(selected);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
