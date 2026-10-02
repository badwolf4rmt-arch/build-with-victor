import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addQuizToLibrary, loadDraft, type Draft } from "@/lib/quiz-store";

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

  useEffect(() => {
    const d = loadDraft();
    if (d) setQuiz(d);
  }, []);

  const updateQ = (i: number, patch: Partial<Draft["questions"][number]>) =>
    setQuiz((q) => ({ ...q, questions: q.questions.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  function save() {
    if (!quiz.title.trim()) return toast.error("Введите название викторины");
    addQuizToLibrary(quiz.title.trim(), quiz.questions.length);
    toast.success("Викторина сохранена");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="flex h-[88px] items-center justify-between rounded-b-[32px] bg-card px-6">
        <Link to="/" className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold">
          <ArrowLeft className="size-5" /> Назад
        </Link>
        <button
          onClick={save}
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Save className="size-5" /> Сохранить
        </button>
      </header>

      <main className="mx-auto mt-6 max-w-[1278px] px-4 xl:px-0">
        <section className="overflow-hidden rounded-[32px] bg-card">
          <div className="h-[220px] bg-quiz-gradient md:h-[340px]" />
          <div className="-mt-12 rounded-t-[32px] bg-card p-8">
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
              <textarea
                value={q.text}
                maxLength={100}
                onChange={(e) => updateQ(i, { text: e.target.value })}
                placeholder="Текст вопроса"
                className="mt-4 h-[106px] w-full max-w-[848px] resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
              />
              <p className="max-w-[848px] text-right text-xs text-muted-foreground">{q.text.length}/100</p>

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
    </div>
  );
}
