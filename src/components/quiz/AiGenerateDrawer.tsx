import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, FileText, Loader2, Minus, Plus, Settings, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateQuiz } from "@/lib/quiz-ai.functions";
import { MATERIAL_ACCEPT, readMaterialFile, type Material } from "@/lib/material-file";
import { saveDraft, type DraftQuestion } from "@/lib/quiz-store";
import { illustrateQuestions } from "@/lib/quiz-illustrate.functions";
import { compressImage } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { KINDS, type QuestionKind } from "@/lib/question-kinds";
import { Modal } from "./Modal";
import { SubjectCombobox } from "./SubjectCombobox";

const MAX_Q = 20;
const MAX_TEXT = 20000;
type Picked = { name: string; data: Material } | null;

function FilePick({ value, onChange }: { value: Picked; onChange: (p: Picked) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function pick(f?: File) {
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      onChange({ name: f.name, data: await readMaterialFile(f) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось прочитать файл");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm">
        <FileText className="size-5 shrink-0 text-primary" />
        <span className="flex-1 truncate">{value.name}</span>
        <button aria-label="Убрать файл" onClick={() => onChange(null)}>
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input ref={ref} type="file" accept={MATERIAL_ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <div
        onClick={() => !busy && ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex min-h-[190px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed bg-secondary px-6 py-8 text-center transition-colors",
          drag ? "border-primary bg-info" : "border-placeholder-dashed",
        )}
      >
        <p className="font-display text-lg font-semibold">Перетащите сюда файл или выберите на компьютере</p>
        <p className="text-sm text-muted-foreground">файл не должен весить больше 10 МБ.</p>
        <p className="text-sm text-muted-foreground">Формат — DOCX, PDF, TXT, JPG, PNG</p>
        <button
          type="button"
          disabled={busy}
          className="mt-4 flex h-11 items-center gap-2 rounded-xl bg-info px-6 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          Выбрать файл
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}

const Label = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="mb-2">
    <p className="font-display text-lg font-semibold">{title}</p>
    {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
  </div>
);

export function AiGenerateDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const run = useServerFn(generateQuiz);
  const illustrate = useServerFn(illustrateQuestions);
  const [subject, setSubject] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [plan, setPlan] = useState<Picked>(null);
  const [text, setText] = useState("");
  const [sourceFile, setSourceFile] = useState<Picked>(null);
  const [advanced, setAdvanced] = useState(false);
  const [count, setCount] = useState(10);
  const [kinds, setKinds] = useState<QuestionKind[]>(["choice"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSource = !!text.trim() || !!sourceFile;
  const hasInput = !!topic.trim() || !!plan || hasSource;
  const canSubmit = hasInput && kinds.length > 0 && count >= 1 && count <= MAX_Q && !loading;

  async function submit() {
    setLoading(true);
    try {
      const source = text.trim() || sourceFile ? { text: text.trim() || sourceFile?.data.text, file: sourceFile?.data.file } : undefined;
      const res = await run({
        data: {
          count,
          kinds,
          subject: subject.trim() || undefined,
          grade: grade ? Number(grade) : undefined,
          topic: topic.trim() || undefined,
          plan: plan?.data,
          source: text.trim() && sourceFile?.data.text ? { text: `${text.trim()}\n\n${sourceFile.data.text}` } : source,
        },
      });
      if (!res.ok) return setError(res.error);
      let questions: DraftQuestion[] = res.quiz.questions;
      try {
        const ill = await illustrate({
          data: {
            subject: subject.trim() || undefined,
            grade: grade ? Number(grade) : undefined,
            topic: topic.trim() || undefined,
            questions: questions.map((q) => ({ text: q.text, correct: q.correct })),
          },
        });
        if (ill.ok) {
          const imgs = await Promise.all(ill.images.map(async (i) => ({ index: i.index, src: await compressImage(i.dataUrl, 900, 0.8) })));
          questions = questions.map((q, idx) => {
            const im = imgs.find((x) => x.index === idx);
            if (!im) return q;
            const size = Math.round(((im.src.length - im.src.indexOf(",") - 1) * 3) / 4);
            return { ...q, image: { src: im.src, name: "иллюстрация", type: "JPG", size } };
          });
        }
      } catch {
        // картинки необязательны — викторина остаётся без них
      }
      saveDraft({
        ...res.quiz,
        questions,
        subject: subject.trim() || undefined,
        grade: grade ? `${grade} класс` : undefined,
        topic: topic.trim() || undefined,
      });
      onOpenChange(false);
      navigate({ to: "/quiz/new" });
    } catch {
      setError("Не удалось сгенерировать викторину");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[720px] flex-col rounded-l-[32px] bg-card outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex items-start justify-between gap-4">
                <DialogPrimitive.Title className="font-display text-[32px] font-semibold leading-10">
                  Генерация викторины с ИИ
                </DialogPrimitive.Title>
                <DialogPrimitive.Close aria-label="Закрыть" disabled={loading}>
                  <X className="size-6" />
                </DialogPrimitive.Close>
              </div>
              <DialogPrimitive.Description className="sr-only">
                Укажите предмет, класс, тему, план урока или учебный текст
              </DialogPrimitive.Description>

              <div className="mt-6 grid grid-cols-[1fr_160px] gap-4">
                <div>
                  <Label title="Предмет" />
                  <SubjectCombobox value={subject} onChange={setSubject} />
                </div>
                <div>
                  <Label title="Класс" />
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Класс" />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      {Array.from({ length: 11 }, (_, i) => String(i + 1)).map((g) => (
                        <SelectItem key={g} value={g}>
                          {g} класс
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-5">
                <Label title="Тема" />
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  placeholder="Например: Фотосинтез"
                  className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="mt-5">
                <Label title="Механики вопросов" hint={kinds.length > 1 ? "ИИ распределит вопросы по смыслу: каждая механика встретится хотя бы раз" : "Все вопросы будут одной механики"} />
                <div className="grid gap-2 sm:grid-cols-3">
                  {KINDS.map((k) => {
                    const on = kinds.includes(k.id);
                    return (
                      <label key={k.id} className={cn("flex cursor-pointer gap-3 rounded-2xl border-2 p-3", on ? "border-primary bg-accent" : "border-border hover:bg-secondary")}>
                        <Checkbox checked={on} onCheckedChange={(c) => setKinds((v) => (c ? [...v, k.id] : v.filter((x) => x !== k.id)))} className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-semibold">{k.name}</span>
                          <span className="block text-xs text-muted-foreground">{k.text}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <Label title="План урока" />
                <FilePick value={plan} onChange={setPlan} />
              </div>

              <button
                type="button"
                onClick={() => setAdvanced((a) => !a)}
                aria-expanded={advanced}
                className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                <Settings className="size-5" strokeWidth={2.2} />
                {advanced ? "Скрыть расширенные настройки" : "Показать расширенные настройки"}
                <ChevronDown className={`size-4 transition-transform ${advanced ? "rotate-180" : ""}`} />
              </button>

              {advanced && (
                <>
                  <div className="mt-5">
                    <Label title="Учебный текст" />
                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={MAX_TEXT}
                        placeholder="Вставьте текст из учебника, статьи или презентации"
                        className="h-40 w-full resize-none rounded-2xl border border-border p-4 pb-8 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                      />
                      <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-muted-foreground">
                        {text.length}/{MAX_TEXT}
                      </span>
                    </div>
                    <div className="mt-2">
                      <FilePick value={sourceFile} onChange={setSourceFile} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-5">
                    <Label title="Количество вопросов" hint="Не больше 20 вопросов" />
                    <div className="flex h-12 w-[132px] items-center justify-between rounded-xl border border-border px-1">
                      <button
                        aria-label="Меньше"
                        onClick={() => setCount((c) => Math.max(1, c - 1))}
                        className="flex size-10 items-center justify-center rounded-lg bg-secondary disabled:opacity-40"
                        disabled={count <= 1}
                      >
                        <Minus className="size-4" />
                      </button>
                      <input
                        value={count}
                        inputMode="numeric"
                        onChange={(e) => setCount(Math.min(MAX_Q, Number(e.target.value.replace(/\D/g, "")) || 0))}
                        className="w-8 bg-transparent text-center text-sm outline-none"
                        aria-label="Количество вопросов"
                      />
                      <button
                        aria-label="Больше"
                        onClick={() => setCount((c) => Math.min(MAX_Q, c + 1))}
                        className="flex size-10 items-center justify-center rounded-lg bg-secondary disabled:opacity-40"
                        disabled={count >= MAX_Q}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

            </div>
            <div className="flex justify-center py-3">
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="h-12 min-w-[160px] rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Сгенерировать
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-l-[32px] bg-card">
                <div className="relative flex size-28 items-center justify-center rounded-full bg-info">
                  <Sparkles className="size-12 text-primary" />
                  <Loader2 className="absolute size-28 animate-spin text-primary/40" strokeWidth={1} />
                </div>
                <p className="font-display text-xl font-semibold">ИИ создаёт вопросы и иллюстрации…</p>
                <p className="text-sm text-muted-foreground">Это может занять до трёх минут</p>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <Modal open={!!error} onOpenChange={(o) => !o && setError(null)} title="Не получилось сгенерировать">
        <div className="mt-2 flex flex-col items-center gap-4 text-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-destructive/10 font-display text-5xl font-bold text-destructive">
            ?
          </span>
          <p className="text-sm text-foreground/80">{error}. Попробуйте ещё раз или измените данные.</p>
          <button
            onClick={() => setError(null)}
            className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Понятно
          </button>
        </div>
      </Modal>
    </>
  );
}
