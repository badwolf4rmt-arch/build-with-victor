import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Eye, ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddImageFlow, formatSize, ReplaceImageModal } from "@/components/quiz/QuestionImageDialogs";
import { PreviewOverlay } from "@/components/quiz/PreviewOverlay";
import { addQuizToLibrary, loadDraft, saveDraft, type Draft } from "@/lib/quiz-store";

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
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Draft>(EMPTY);
  const [imageFor, setImageFor] = useState<number | null>(null);
  const [replaceFor, setReplaceFor] = useState<number | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const d = loadDraft();
    if (d) setQuiz(d);
  }, []);

  useEffect(() => {
    if (quiz !== EMPTY) saveDraft(quiz);
  }, [quiz]);

  const updateQ = (i: number, patch: Partial<Draft["questions"][number]>) =>
    setQuiz((q) => ({ ...q, questions: q.questions.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  function save() {
    if (!quiz.title.trim()) {
      toast.error("Введите название викторины");
      return;
    }
    addQuizToLibrary(quiz.title.trim(), quiz.questions, quiz.cover);
    toast.success("Викторина сохранена");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="flex h-[88px] items-center justify-between rounded-b-[32px] bg-card px-6">
        <Link to="/" className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold">
          <ArrowLeft className="size-5" /> Назад
        </Link>
        <div className="flex items-center gap-3">
        <button
          onClick={() => setPreview(true)}
          className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-5 text-sm font-semibold hover:bg-muted"
        >
          <Eye className="size-5" /> Предпросмотр
        </button>
        <button
          onClick={save}
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Save className="size-5" /> Сохранить
        </button>
        </div>
      </header>
      {preview && (
        <PreviewOverlay
          title={quiz.title}
          items={quiz.questions}
          onClose={() => setPreview(false)}
          launchLabel="Сохранить"
          onLaunch={() => { setPreview(false); save(); }}
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
          </div>
          <div className="relative z-10 -mt-12 rounded-t-[32px] bg-card p-8">
            <input
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              maxLength={60}
              aria-label="Название викторины"
              className="w-full bg-transparent font-display text-[32px] font-semibold leading-10 outline-none"
            />
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-5 rounded-[32px] bg-card p-8">
          {quiz.questions.map((q, i) => (
            <div key={i} className="rounded-3xl bg-secondary p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Вопрос {i + 1}</h2>
                <button
                  aria-label="Удалить вопрос"
                  disabled={quiz.questions.length === 1}
                  onClick={() => setQuiz({ ...quiz, questions: quiz.questions.filter((_, j) => j !== i) })}
                  className="text-muted-foreground disabled:opacity-40"
                >
                  <Trash2 className="size-5" />
                </button>
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
            </div>
          ))}
          <button
            onClick={() =>
              setQuiz({ ...quiz, questions: [...quiz.questions, { text: "", correct: "", incorrect: ["", "", ""] }] })
            }
            className="flex h-12 w-[224px] items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold"
          >
            <Plus className="size-5" /> Добавить вопрос
          </button>
        </section>
      </main>

      <AddImageFlow
        open={coverOpen}
        onOpenChange={setCoverOpen}
        title="Изменение обложки"
        cropTitle="Установка обложки"
        cropDescription="Выберите область, которая будет видна на обложке"
        aspect={1278 / 340}
        onDone={(img) => setQuiz((q) => ({ ...q, cover: img.src }))}
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
