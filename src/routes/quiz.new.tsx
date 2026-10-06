import { compressImage } from "@/lib/image-compress";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Loader2, Shuffle, Download, Eye, Play, ImagePlus, Pencil, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateQuestionImage } from "@/lib/quiz-image.functions";
import { regenerateQuestion } from "@/lib/quiz-ai.functions";
import { KINDS, kindOf, switchKind, type QuestionKind } from "@/lib/question-kinds";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AddImageFlow, formatSize, ReplaceImageModal } from "@/components/quiz/QuestionImageDialogs";
import { LaunchFlow } from "@/components/quiz/LaunchFlow";
import { PrintTestDrawer } from "@/components/quiz/PrintTestDrawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CompleteQuizModal } from "@/components/quiz/CompleteQuizModal";
import { PreviewOverlay } from "@/components/quiz/PreviewOverlay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectCombobox } from "@/components/quiz/SubjectCombobox";
import { addQuizToLibrary, gradeNumber, loadDraft, saveDraft, type Draft, type Quiz } from "@/lib/quiz-store";

export const Route = createFileRoute("/quiz/new")({
  head: () => ({
    meta: [
      { title: "Редактор викторины — Конструктор викторин" },
      { name: "description", content: "Проверьте и отредактируйте вопросы, созданные ИИ, и сохраните викторину." },
      { property: "og:title", content: "Редактор викторины — Конструктор викторин" },
      { property: "og:description", content: "Проверьте и отредактируйте вопросы, созданные ИИ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Editor,
});

const EMPTY: Draft = { title: "Новая викторина", questions: [{ text: "", correct: "", incorrect: ["", "", ""] }] };

function Editor() {
  const [quiz, setQuiz] = useState<Draft>(EMPTY);
  const [imageFor, setImageFor] = useState<number | null>(null);
  const [replaceFor, setReplaceFor] = useState<number | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState<Quiz | null>(null);
  const [launch, setLaunch] = useState(false);
  const [print, setPrint] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setQuiz(d);
      if (d.id) setSaved({ id: d.id, title: d.title, questions: d.questions.length, items: d.questions, image: d.cover, mine: true, createdAt: 0 });
    }
  }, []);

  useEffect(() => {
    if (quiz !== EMPTY) saveDraft(quiz);
  }, [quiz]);

  const runCover = useServerFn(generateQuestionImage);
  const [coverLoading, setCoverLoading] = useState(false);

  async function generateCover() {
    const qs = quiz.questions.map((q) => q.text.trim()).filter(Boolean).slice(0, 8);
    const prompt = `Название: ${quiz.title.trim() || "Викторина"}${qs.length ? `\nВопросы: ${qs.join("; ")}` : ""}`.slice(0, 1500);
    setCoverLoading(true);
    try {
      const res = await runCover({ data: { prompt, kind: "cover" } });
      if (res.ok) {
        const cover = await compressImage(res.dataUrl);
        setQuiz((q) => ({ ...q, cover }));
        toast.success("Обложка создана");
      } else toast.error(res.error);
    } catch {
      toast.error("Не удалось создать обложку");
    } finally {
      setCoverLoading(false);
    }
  }

  const moveQ = (i: number, d: -1 | 1) =>
    setQuiz((q) => {
      const j = i + d;
      if (j < 0 || j >= q.questions.length) return q;
      const arr = [...q.questions];
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      return { ...q, questions: arr };
    });

  function shuffleQ() {
    setQuiz((q) => {
      const arr = [...q.questions];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      }
      return { ...q, questions: arr };
    });
    toast.success("Порядок вопросов перемешан");
  }

  const updateQ = (i: number, patch: Partial<Draft["questions"][number]>) =>
    setQuiz((q) => ({ ...q, questions: q.questions.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  const runRegen = useServerFn(regenerateQuestion);
  const [regenFor, setRegenFor] = useState<number | null>(null);
  async function regen(i: number, what: "text" | "kind", kind: QuestionKind) {
    const q = quiz.questions[i];
    if (!q) return;
    setRegenFor(i);
    try {
      const res = await runRegen({
        data: { what, kind, question: { text: q.text, correct: q.correct, incorrect: q.incorrect }, title: quiz.title, subject: quiz.subject, grade: quiz.grade, topic: quiz.topic },
      });
      if (!res.ok) return void toast.error(res.error);
      updateQ(i, res.question);
      toast.success(what === "text" ? "Формулировка обновлена" : `Вопрос переделан: ${KINDS.find((k) => k.id === kind)?.name}`);
    } catch {
      toast.error("Не удалось перегенерировать вопрос");
    } finally {
      setRegenFor(null);
    }
  }

  const [saving, setSaving] = useState(false);
  async function save() {
    if (!quiz.title.trim()) {
      toast.error("Введите название викторины");
      return;
    }
    setSaving(true);
    try {
      const s = await addQuizToLibrary(quiz.title.trim(), quiz.questions, quiz.cover, saved?.id ?? quiz.id, {
        subject: quiz.subject ?? "",
        grade: quiz.grade,
        topic: quiz.topic ?? "",
      });
      setSaved(s);
      if (quiz.id !== s.id) setQuiz((q) => ({ ...q, id: s.id }));
      toast.success("Викторина сохранена — изменения видны всем");
    } catch {
      toast.error("Не удалось сохранить викторину. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="flex h-[88px] items-center justify-between rounded-b-[32px] bg-card px-6">
        <Link to="/" className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold">
          <ArrowLeft className="size-5" /> Назад
        </Link>
        <div className="flex items-center gap-4">
          <HeaderAction disabled={!saved} onClick={() => setPreview(true)} icon={<Eye className="size-5" />} label="Предпросмотр" />
          <HeaderAction disabled={!saved} onClick={() => setPrint(true)} icon={<Download className="size-5" />} label="Скачать в виде теста" />
          <HeaderAction disabled={!saved} onClick={() => setLaunch(true)} icon={<Play className="size-5 fill-current" />} label="Запустить" filled />
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-70"
          >
            {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </header>
      {saved && <LaunchFlow quiz={saved} open={launch} onOpenChange={setLaunch} />}
      {saved && <PrintTestDrawer open={print} onOpenChange={setPrint} title={saved.title} items={saved.items ?? quiz.questions} />}
      {preview && (
        <PreviewOverlay
          title={quiz.title}
          items={quiz.questions}
          onClose={() => setPreview(false)}
          onEdit={() => setPreview(false)}
          onLaunch={() => { setPreview(false); setLaunch(true); }}
        />
      )}

      <main className="mx-auto mt-6 max-w-[1278px] px-4 xl:px-0">
        <section className="overflow-hidden rounded-[32px] bg-card">
          <div className="relative h-[220px] bg-quiz-gradient md:h-[340px]">
            {quiz.cover && <img src={quiz.cover} alt="Обложка викторины" className="h-full w-full object-cover" />}
            <button
              onClick={() => setCoverOpen(true)}
              className="absolute right-4 top-4 flex h-12 items-center gap-2 rounded-xl bg-card px-4 text-sm font-semibold shadow-card hover:bg-secondary"
            >
              <Pencil className="size-5" /> Изменить обложку
            </button>
            <button
              onClick={generateCover}
              disabled={coverLoading}
              className="absolute right-4 top-20 flex h-12 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90 disabled:opacity-70"
            >
              {coverLoading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
              {coverLoading ? "Создаём обложку…" : "Сгенерировать обложку"}
            </button>
          </div>
          <div className="relative z-10 -mt-12 rounded-t-[32px] bg-card p-8">
            <input
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              maxLength={60}
              aria-label="Название викторины"
              className="w-full bg-transparent font-display text-[32px] font-semibold leading-10 outline-none"
            />
            <div className="mt-6 grid grid-cols-[1fr_160px] gap-4">
              <div>
                <p className="mb-2 font-display text-lg font-semibold">Предмет</p>
                <SubjectCombobox value={quiz.subject ?? ""} onChange={(v) => setQuiz({ ...quiz, subject: v })} />
              </div>
              <div>
                <p className="mb-2 font-display text-lg font-semibold">Класс</p>
                <Select value={gradeNumber(quiz.grade)} onValueChange={(g) => setQuiz({ ...quiz, grade: `${g} класс` })}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Класс" />
                  </SelectTrigger>
                  <SelectContent>
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
              <p className="mb-2 font-display text-lg font-semibold">Тема</p>
              <input
                value={quiz.topic ?? ""}
                onChange={(e) => setQuiz({ ...quiz, topic: e.target.value })}
                maxLength={200}
                placeholder="Например: Фотосинтез"
                aria-label="Тема викторины"
                className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-5 rounded-[32px] bg-card p-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Все поля можно редактировать. Меняйте порядок стрелками.</p>
            <button
              onClick={shuffleQ}
              disabled={quiz.questions.length < 2}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold disabled:opacity-40"
            >
              <Shuffle className="size-4" /> Перемешать вопросы
            </button>
          </div>
          {quiz.questions.map((q, i) => (
            <div key={i} className="rounded-3xl bg-secondary p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-xl font-semibold">Вопрос {i + 1}</h2>
                  <Select value={kindOf(q)} onValueChange={(k) => setQuiz((s) => ({ ...s, questions: s.questions.map((x, j) => (j === i ? switchKind(x, k as QuestionKind) : x)) }))}>
                    <SelectTrigger aria-label="Механика вопроса" className="h-9 w-[190px] rounded-xl bg-card text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDS.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <label className="flex h-9 items-center gap-1.5 rounded-xl bg-card px-3 text-sm">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      aria-label="Баллы за вопрос"
                      value={q.points ?? QUESTION_POINTS}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(100, Math.round(Number(e.target.value) || QUESTION_POINTS)));
                        setQuiz((s) => ({ ...s, questions: s.questions.map((x, j) => (j === i ? { ...x, points: v } : x)) }));
                      }}
                      className="w-10 bg-transparent text-center font-semibold outline-none"
                    />
                    <span className="text-muted-foreground">баллов</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger disabled={regenFor !== null} className="flex h-9 items-center gap-1.5 rounded-xl bg-card px-3 text-sm font-semibold text-primary disabled:opacity-50">
                    {regenFor === i ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Перегенерировать
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => void regen(i, "text", kindOf(q))}>Формулировку вопроса</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Сменить механику</DropdownMenuLabel>
                    {KINDS.filter((k) => k.id !== kindOf(q)).map((k) => (
                      <DropdownMenuItem key={k.id} onSelect={() => void regen(i, "kind", k.id)}>{k.name}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button aria-label="Переместить вверх" disabled={i === 0} onClick={() => moveQ(i, -1)} className="text-muted-foreground disabled:opacity-30">
                  <ArrowUp className="size-5" />
                </button>
                <button aria-label="Переместить вниз" disabled={i === quiz.questions.length - 1} onClick={() => moveQ(i, 1)} className="text-muted-foreground disabled:opacity-30">
                  <ArrowDown className="size-5" />
                </button>
                <button
                  aria-label="Удалить вопрос"
                  disabled={quiz.questions.length === 1}
                  onClick={() => setQuiz({ ...quiz, questions: quiz.questions.filter((_, j) => j !== i) })}
                  className="text-muted-foreground disabled:opacity-40"
                >
                  <Trash2 className="size-5" />
                </button>
                </div>
              </div>
              <div className="mt-4 flex max-w-[884px] items-start gap-4">
                <div className="min-w-0 flex-1">
                  <textarea
                    value={q.text}
                    maxLength={100}
                    onChange={(e) => updateQ(i, { text: e.target.value })}
                    placeholder="Текст вопроса"
                    className="h-[106px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
                  />
                  <div className="flex items-start justify-between gap-4">
                    {q.image ? (
                      <div className="flex items-center gap-1.5">
                        <img src={q.image.src} alt="" className="size-8 rounded-md object-cover" />
                        <div className="leading-4">
                          <p className="max-w-[160px] truncate text-xs font-semibold">{q.image.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {q.image.type} · {formatSize(q.image.size)}
                          </p>
                        </div>
                        <button
                          aria-label="Удалить изображение"
                          onClick={() => updateQ(i, { image: undefined })}
                          className="ml-6 text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-muted-foreground">{q.text.length}/100</p>
                  </div>
                </div>
                <button
                  aria-label={q.image ? "Заменить изображение" : "Добавить изображение"}
                  onClick={() => (q.image ? setReplaceFor(i) : setImageFor(i))}
                  className="mt-2 text-muted-foreground hover:text-foreground"
                >
                  <ImagePlus className="size-5" />
                </button>
              </div>

              {kindOf(q) === "choice" && (<>
              <h3 className="mt-4 font-display text-xl font-semibold">Варианты ответов</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ученики увидят варианты в случайном порядке
              </p>
              <div className="mt-6 max-w-[850px]">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Check className="size-5 text-success" /> Правильный ответ
                </p>
                <input
                  value={q.correct}
                  onChange={(e) => updateQ(i, { correct: e.target.value })}
                  className="mt-3 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
                />
                <div className="mt-5 flex items-center gap-5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <X className="size-5 text-destructive" /> Неправильные ответы
                  </p>
                  {q.incorrect.length < 5 && (
                    <button
                      onClick={() => updateQ(i, { incorrect: [...q.incorrect, ""] })}
                      className="flex items-center gap-1 text-sm font-semibold text-primary"
                    >
                      <Plus className="size-4" /> Добавить вариант
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-col gap-3">
                  {q.incorrect.map((a, k) => (
                    <div key={k} className="flex items-center gap-2">
                      <input
                        value={a}
                        onChange={(e) =>
                          updateQ(i, { incorrect: q.incorrect.map((x, m) => (m === k ? e.target.value : x)) })
                        }
                        className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
                      />
                      {q.incorrect.length > 1 && (
                        <button
                          aria-label="Удалить вариант"
                          onClick={() => updateQ(i, { incorrect: q.incorrect.filter((_, m) => m !== k) })}
                          className="text-muted-foreground"
                        >
                          <X className="size-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              </>)}
              {kindOf(q) === "order" && (
                <div className="mt-4 max-w-[850px]">
                  <h3 className="font-display text-xl font-semibold">Элементы в правильном порядке</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Ученики увидят их перемешанными и будут перетаскивать</p>
                  <div className="mt-4 flex flex-col gap-3">
                    {[q.correct, ...q.incorrect].map((a, k, all) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-sm font-semibold">{k + 1}</span>
                        <input
                          value={a}
                          onChange={(e) => {
                            const next = all.map((x, m) => (m === k ? e.target.value : x));
                            updateQ(i, { correct: next[0]!, incorrect: next.slice(1) });
                          }}
                          className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
                        />
                        {all.length > 2 && k > 0 && (
                          <button aria-label="Удалить элемент" onClick={() => updateQ(i, { incorrect: q.incorrect.filter((_, m) => m !== k - 1) })} className="text-muted-foreground">
                            <X className="size-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {q.incorrect.length < 5 && (
                    <button onClick={() => updateQ(i, { incorrect: [...q.incorrect, ""] })} className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
                      <Plus className="size-4" /> Добавить элемент
                    </button>
                  )}
                </div>
              )}
              {kindOf(q) === "input" && (
                <div className="mt-4 max-w-[850px]">
                  <h3 className="font-display text-xl font-semibold">Правильный ответ</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Ученик вписывает ответ сам. Регистр, буква «ё» и знаки препинания не учитываются</p>
                  <input
                    value={q.correct}
                    onChange={(e) => updateQ(i, { correct: e.target.value })}
                    className="mt-3 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
                  />
                </div>
              )}
              <label className="mt-6 block max-w-[850px] text-sm font-semibold">
                Комментарий к правильному ответу (необязательно)
                <textarea value={q.explanation ?? ""} onChange={(e) => updateQ(i, { explanation: e.target.value })} rows={3} className="mt-3 w-full rounded-xl border border-border bg-card p-4 text-base font-normal outline-none focus:border-primary" />
              </label>
            </div>
          ))}
          <button
            onClick={() =>
              setQuiz({ ...quiz, questions: [...quiz.questions, { text: "", correct: "", incorrect: ["", "", ""] }] })
            }
            className="inline-flex h-12 w-[224px] items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold"
          >
            <Plus className="size-5" /> Добавить вопрос
          </button>
          <button
            onClick={() => setComplete(true)}
            className="ml-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="size-5" /> Сгенерировать
          </button>
          <CompleteQuizModal open={complete} onOpenChange={setComplete} quiz={quiz} onApply={(q) => { setQuiz(q); toast.success("Викторина дополнена — проверьте новые вопросы"); }} />
        </section>
      </main>

      <AddImageFlow
        open={coverOpen}
        onOpenChange={setCoverOpen}
        title="Изменение обложки"
        cropTitle="Установка обложки"
        cropDescription="Выберите область, которая будет видна на обложке"
        aspect={1278 / 340}
        onDone={(img) => void compressImage(img.src, 1280).then((cover) => setQuiz((q) => ({ ...q, cover })))}
      />
      <AddImageFlow
        open={imageFor !== null}
        onOpenChange={(o) => !o && setImageFor(null)}
        onDone={(image) => imageFor !== null && updateQ(imageFor, { image })}
      />
      <ReplaceImageModal
        open={replaceFor !== null}
        image={replaceFor !== null ? quiz.questions[replaceFor]?.image : undefined}
        onOpenChange={(o) => !o && setReplaceFor(null)}
        onReplace={() => {
          setImageFor(replaceFor);
          setReplaceFor(null);
        }}
      />
    </div>
  );
}

function HeaderAction({ disabled, onClick, icon, label, filled }: { disabled: boolean; onClick: () => void; icon: ReactNode; label: string; filled?: boolean }) {
  const btn = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-12 items-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40",
        filled ? "bg-secondary px-5 hover:bg-muted" : "px-1 hover:text-primary",
      )}
    >
      {icon} {label}
    </button>
  );
  if (!disabled) return btn;
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild><span tabIndex={0}>{btn}</span></TooltipTrigger>
        <TooltipContent>Сначала сохраните викторину</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
