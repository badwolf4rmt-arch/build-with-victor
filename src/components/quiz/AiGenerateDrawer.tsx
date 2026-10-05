import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Info, Loader2, Minus, Paperclip, Plus, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateQuiz } from "@/lib/quiz-ai.functions";
import { MATERIAL_ACCEPT, readMaterialFile, type Material } from "@/lib/material-file";
import { saveDraft } from "@/lib/quiz-store";
import { Modal } from "./Modal";
import { SubjectCombobox } from "./SubjectCombobox";

const MAX_Q = 20;
type Picked = { name: string; data: Material } | null;

function FilePick({ value, onChange, label }: { value: Picked; onChange: (p: Picked) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
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
  return (
    <div>
      <input ref={ref} type="file" accept={MATERIAL_ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="flex h-12 items-center gap-2 rounded-xl border border-border px-3 text-sm">
          <FileText className="size-5 shrink-0 text-primary" />
          <span className="flex-1 truncate">{value.name}</span>
          <button aria-label="Убрать файл" onClick={() => onChange(null)}>
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-semibold hover:border-primary disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
          {label}
        </button>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{err ?? "PDF, DOCX, TXT или фото, до 10 МБ"}</p>
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
  const [subject, setSubject] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [plan, setPlan] = useState<Picked>(null);
  const [text, setText] = useState("");
  const [sourceFile, setSourceFile] = useState<Picked>(null);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSource = !!text.trim() || !!sourceFile;
  const hasInput = !!topic.trim() || !!plan || hasSource;
  const canSubmit = hasInput && count >= 1 && count <= MAX_Q && !loading;
  const mode = hasSource
    ? "Вопросы будут строго по вашему тексту или файлу" + (plan || topic.trim() ? " с учётом темы и плана урока" : "")
    : plan
      ? "Вопросы будут по целям и содержанию плана урока"
      : topic.trim()
        ? "Вопросы будут по теме в рамках школьной программы"
        : "Укажите тему, загрузите план урока или добавьте текст";

  async function submit() {
    setLoading(true);
    try {
      const source = text.trim() || sourceFile ? { text: text.trim() || sourceFile?.data.text, file: sourceFile?.data.file } : undefined;
      const res = await run({
        data: {
          count,
          subject: subject.trim() || undefined,
          grade: grade ? Number(grade) : undefined,
          topic: topic.trim() || undefined,
          plan: plan?.data,
          source: text.trim() && sourceFile?.data.text ? { text: `${text.trim()}\n\n${sourceFile.data.text}` } : source,
        },
      });
      if (!res.ok) return setError(res.error);
      saveDraft(res.quiz);
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
                  <p className="mt-2 text-xs text-muted-foreground">Начните вводить — можно выбрать из списка или вписать своё название</p>
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
                <Label title="План урока" hint="Необязательно — вопросы подстроятся под цели и этапы урока" />
                <FilePick value={plan} onChange={setPlan} label="Загрузить план урока" />
              </div>

              <div className="mt-5">
                <Label title="Учебный текст" hint="Необязательно — тогда вопросы будут строго по нему" />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={30000}
                  placeholder="Вставьте текст из учебника, статьи или презентации"
                  className="h-40 w-full resize-none rounded-2xl border border-border p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <div className="mt-2">
                  <FilePick value={sourceFile} onChange={setSourceFile} label="Или загрузить файл с текстом" />
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

              <div className="mt-4 flex gap-3 rounded-2xl bg-info p-4">
                <Info className="mt-0.5 size-5 shrink-0 fill-primary text-card" />
                <p className="text-sm">{mode}</p>
              </div>
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
                <p className="font-display text-xl font-semibold">ИИ создаёт вопросы…</p>
                <p className="text-sm text-muted-foreground">Это может занять до двух минут</p>
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
