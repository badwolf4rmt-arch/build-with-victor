import { useEffect, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { isInputCorrect, isOrderCorrect, scrambled } from "@/lib/question-kinds";

/**
 * Drag-to-order answer. `reveal` shows the correct sequence and colours each step;
 * `onCheck` (optional) adds a «Проверить» button; without it the list is still draggable for practice.
 */
export function OrderAnswer({
  steps,
  seed,
  reveal,
  onCheck,
  onChange,
  initial,
  size = "lg",
  checkLabel = "Проверить",
}: {
  steps: string[];
  seed: number;
  reveal: boolean;
  onCheck?: ((order: string[], correct: boolean) => void) | undefined;
  onChange?: ((order: string[]) => void) | undefined;
  initial?: string[] | undefined;
  size?: "lg" | "sm";
  checkLabel?: string;
}) {
  const [order, setOrder] = useState<string[]>(() => (initial?.length === steps.length ? initial : scrambled(steps, seed)));
  useEffect(() => setOrder(initial?.length === steps.length ? initial : scrambled(steps, seed)), [steps.join("|"), seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(order, order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id)));
    setOrder(next);
    onChange?.(next);
  };
  const shown = reveal ? steps : order;
  return (
    <div className="flex w-full flex-col gap-3">
      {!reveal && <p className={cn("text-center text-muted-foreground", size === "lg" ? "text-base" : "text-sm")}>Перетащите карточки в правильном порядке</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={shown} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {shown.map((s, i) => (
              <Step key={s} id={s} n={i + 1} size={size} disabled={reveal} state={!reveal ? "idle" : order[i] === s ? "correct" : "fixed"} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {onCheck && !reveal && (
        <button type="button" onClick={() => onCheck(order, isOrderCorrect(order, steps))} className="h-12 rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:opacity-90">
          {checkLabel}
        </button>
      )}
    </div>
  );
}

function Step({ id, n, size, disabled, state }: { id: string; n: number; size: "lg" | "sm"; disabled: boolean; state: "idle" | "correct" | "fixed" }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "flex touch-none select-none items-center gap-3 rounded-2xl border-2 bg-card px-3 font-semibold",
        size === "lg" ? "min-h-14 font-display text-lg" : "min-h-12 text-base",
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "relative z-10 shadow-card",
        state === "idle" && "border-answer-border",
        state === "correct" && "border-success bg-success text-success-foreground",
        state === "fixed" && "border-info bg-info",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-foreground">{n}</span>
      <span className="flex-1 py-2">{id}</span>
      {!disabled && <GripVertical className="size-5 shrink-0 text-muted-foreground" />}
    </div>
  );
}

/** Typed answer: the student writes an answer and presses «Проверить»; `reveal` shows the right answer. */
export function InputAnswer({
  correct,
  reveal,
  onCheck,
  initial,
  size = "lg",
  checkLabel = "Проверить",
}: {
  correct: string;
  reveal: boolean;
  onCheck?: ((answer: string, ok: boolean) => void) | undefined;
  initial?: string | undefined;
  size?: "lg" | "sm";
  checkLabel?: string;
}) {
  const [value, setValue] = useState(initial ?? "");
  const ok = isInputCorrect(value, correct);
  return (
    <div className="flex w-full flex-col gap-3">
      {onCheck && (
        <input
          value={value}
          disabled={reveal}
          maxLength={200}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && value.trim() && onCheck(value, ok)}
          placeholder="Впишите ответ"
          className={cn(
            "rounded-2xl border-2 bg-card px-4 text-center font-semibold outline-none focus:border-primary",
            size === "lg" ? "h-20 font-display text-xl" : "h-14 text-base",
            !reveal && "border-answer-border",
            reveal && (ok ? "border-success bg-success text-success-foreground" : "border-destructive bg-destructive text-destructive-foreground"),
          )}
        />
      )}
      {reveal ? (
        <div className={cn("flex items-center justify-center rounded-2xl border-2 border-success bg-success p-3 text-center font-semibold text-success-foreground", size === "lg" ? "min-h-20 font-display text-xl" : "min-h-14 text-base")}>
          {correct}
        </div>
      ) : onCheck ? (
        <button type="button" disabled={!value.trim()} onClick={() => onCheck(value, ok)} className="h-12 rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {checkLabel}
        </button>
      ) : (
        <div className={cn("flex items-center justify-center rounded-2xl border-2 border-dashed border-answer-border p-3 text-center text-muted-foreground", size === "lg" ? "min-h-20 font-display text-xl" : "min-h-14 text-base")}>
          Ответ вписывают ученики
        </div>
      )}
    </div>
  );
}
