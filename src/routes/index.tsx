import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowDownWideNarrow, Check, Pencil, Sparkles, SquarePlus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/quiz/Header";
import { QuizCard } from "@/components/quiz/QuizCard";
import { AiGenerateDrawer } from "@/components/quiz/AiGenerateDrawer";
import { FolderDialog } from "@/components/quiz/FolderDialog";
import { Modal, ModalActions } from "@/components/quiz/Modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { clearDraft, useQuizStore } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Конструктор викторин — мои викторины и папки" },
      {
        name: "description",
        content: "Создавайте викторины, раскладывайте их по папкам и запускайте уроки в один клик.",
      },
      { property: "og:title", content: "Конструктор викторин — мои викторины и папки" },
      {
        property: "og:description",
        content: "Создавайте викторины, раскладывайте их по папкам и запускайте уроки в один клик.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type SortKey = "new" | "old" | "az";
const SORT_LABELS: Record<SortKey, string> = {
  new: "Сначала новые",
  old: "Сначала старые",
  az: "По названию",
};

const BASE_TABS = [
  { id: "all", label: "Все викторины" },
  { id: "mine", label: "Созданные мной" },
  { id: "ready", label: "Готовые" },
] as const;

function Index() {
  const { quizzes, folders, loaded, createFolder, updateFolder, deleteFolder, deleteQuiz } = useQuizStore();
  const [tab, setTab] = useState<string>("all");
  const search = "";
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>("new");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const folder = folders.find((f) => f.id === tab);
  const activeTab = folder || BASE_TABS.some((t) => t.id === tab) ? tab : "all";

  const title = folder?.name ?? BASE_TABS.find((t) => t.id === activeTab)!.label;

  const visible = useMemo(() => {
    let list = quizzes;
    if (folder) list = folder.quizIds.map((id) => quizzes.find((q) => q.id === id)).filter((q) => !!q) as typeof quizzes;
    else if (activeTab === "mine") list = quizzes.filter((q) => q.mine);
    else if (activeTab === "ready") list = quizzes.filter((q) => !q.mine);
    const s = search.trim().toLowerCase();
    if (s) list = list.filter((q) => q.title.toLowerCase().includes(s));
    const sorted = [...list];
    if (sort === "new") sorted.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "old") sorted.sort((a, b) => a.createdAt - b.createdAt);
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    return sorted;
  }, [quizzes, folder, activeTab, search, sort]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />

      <main className="mx-auto max-w-[1126px] px-4 pt-10 xl:px-0">
        <div className="mb-8 flex flex-wrap gap-5">
          <button
            onClick={() => {
              clearDraft();
              void navigate({ to: "/quiz/new" });
            }}
            className="flex h-14 items-center gap-3 rounded-2xl bg-primary px-4 pr-5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <SquarePlus className="size-6" />
            Создать викторину
          </button>
          <button
            onClick={() => setAiOpen(true)}
            className="flex h-14 items-center gap-3 rounded-2xl bg-quiz-gradient px-5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Sparkles className="size-6" />
            Сгенерировать викторину с ИИ
          </button>
        </div>
        <div className="flex items-end gap-6 border-b border-border">
          <nav className="-mb-px flex flex-1 gap-8 overflow-x-auto" aria-label="Разделы">
            {[...BASE_TABS, ...folders.map((f) => ({ id: f.id, label: f.name }))].map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "h-11 shrink-0 whitespace-nowrap border-b-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
          <div className="mb-[7px] flex shrink-0 gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="h-10 rounded-xl bg-card px-[18px] text-sm font-semibold transition-colors hover:bg-card/70"
            >
              Создать папку
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Сортировка"
                className="flex size-10 items-center justify-center rounded-xl bg-card outline-none"
              >
                <ArrowDownWideNarrow className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <DropdownMenuItem key={k} onClick={() => setSort(k)} className="gap-2">
                    <Check className={cn("size-4", sort === k ? "opacity-100" : "opacity-0")} />
                    {SORT_LABELS[k]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-5">
          <h1 className="font-display text-[32px] font-semibold leading-10">{title}</h1>
          {folder && (
            <div className="flex gap-5">
              <button aria-label="Редактировать папку" onClick={() => setEditOpen(true)}>
                <Pencil className="size-5" />
              </button>
              <button aria-label="Удалить папку" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {!loaded &&
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} aria-hidden className="h-[180px] animate-pulse rounded-2xl bg-card" />
            ))}
          {visible.map((q) => (
            <QuizCard key={q.id} quiz={q} onDelete={deleteQuiz} />
          ))}
        </div>

        {loaded && visible.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            {search
              ? "По вашему запросу ничего не найдено"
              : folder
                ? "В папке пока нет викторин — добавьте их через редактирование папки"
                : "Здесь пока пусто"}
          </p>
        )}
      </main>

      <AiGenerateDrawer open={aiOpen} onOpenChange={setAiOpen} />

      <FolderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        quizzes={quizzes}
        onSubmit={(name, ids) => {
          const id = createFolder(name, ids);
          setTab(id);
          toast.success(`Папка «${name}» создана`);
        }}
      />

      {folder && (
        <FolderDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          quizzes={quizzes}
          initialName={folder.name}
          initialQuizIds={folder.quizIds}
          onSubmit={(name, ids) => {
            updateFolder(folder.id, name, ids);
            toast.success("Изменения сохранены");
          }}
        />
      )}

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить папку?"
        description="Её не получится восстановить, но всегда можно создать новую. Викторины из папки останутся"
      >
        <ModalActions
          onCancel={() => setDeleteOpen(false)}
          confirmLabel="Удалить"
          onConfirm={() => {
            if (folder) {
              deleteFolder(folder.id);
              toast(`Папка «${folder.name}» удалена`);
            }
            setDeleteOpen(false);
            setTab("all");
          }}
        />
      </Modal>
    </div>
  );
}
