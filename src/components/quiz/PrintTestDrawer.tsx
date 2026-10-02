import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2, Loader2, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { DraftQuestion } from "@/lib/quiz-store";
import errorImg from "@/assets/error-question.png";

const MAX_QUESTIONS = 20;
const MAX_VARIANTS = 10;

type Phase = "settings" | "loading" | "error";

export function PrintTestDrawer({
  open,
  onOpenChange,
  title,
  items,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  items: DraftQuestion[];
}) {
  const usable = items.filter((q) => q.text.trim() && q.correct.trim());
  const maxQ = Math.min(MAX_QUESTIONS, usable.length);
  const [variants, setVariants] = useState(1);
  const [count, setCount] = useState(maxQ);
  const [answers, setAnswers] = useState(false);
  const [phase, setPhase] = useState<Phase>("settings");

  useEffect(() => {
    if (open) {
      setPhase("settings");
      setCount(maxQ);
    }
  }, [open, maxQ]);

  const download = () => {
    // open the tab synchronously inside the click so browsers don't block it
    const win = window.open("", "_blank");
    setPhase("loading");
    setTimeout(() => {
      try {
        if (!win) throw new Error("popup blocked");
        win.document.open();
        win.document.write(buildTestHtml(title, usable, variants, count, answers));
        win.document.close();
        onOpenChange(false);
        toast.custom((id) => (
          <div className="flex w-[348px] items-start gap-3 rounded-2xl bg-success-soft p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 fill-success text-card" />
            <div className="flex-1">
              <p className="text-base font-semibold">Тест скачивается</p>
              <p className="mt-1 text-sm text-muted-foreground">Немного подождите. Тест откроется в новой вкладке</p>
            </div>
            <button aria-label="Закрыть" onClick={() => toast.dismiss(id)}><X className="size-5 text-muted-foreground" /></button>
          </div>
        ), { duration: 5000, position: "top-right" });
      } catch {
        win?.close();
        setPhase("error");
      }
    }, 900);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[720px] flex-col rounded-l-[32px] bg-card outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-between px-8 pt-8">
            <DialogPrimitive.Title className={phase === "error" ? "sr-only" : "font-display text-[32px] font-semibold leading-10"}>
              Подготовка теста
            </DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Закрыть" className="ml-auto"><X className="size-6" /></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Настройки печатного теста</DialogPrimitive.Description>

          {phase === "settings" && (
            <div className="flex-1 space-y-10 overflow-y-auto px-8 pt-8">
              <Row title="Количество вариантов" text="Перемешаем вопросы и ответы в каждом — так сложнее списать">
                <Stepper value={variants} min={1} max={MAX_VARIANTS} onChange={setVariants} />
              </Row>
              <Row title="Количество вопросов" text="Укажите, сколько вопросов из викторины использовать в тесте">
                <Stepper value={count} min={maxQ ? 1 : 0} max={maxQ} onChange={setCount} />
              </Row>
              <Row title="Ответы для проверки" text="Соберём правильные ответы для каждого варианта на отдельной странице">
                <Switch checked={answers} onCheckedChange={setAnswers} />
              </Row>
              {maxQ === 0 && <p className="rounded-2xl bg-info px-5 py-4 text-sm">Заполните хотя бы один вопрос с правильным ответом</p>}
            </div>
          )}

          {phase === "loading" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm">Готовим тест к скачиванию</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <img src={errorImg} alt="" width={200} height={200} className="size-[200px] drop-shadow-[0_0_40px_rgba(255,90,90,0.45)]" />
              <h3 className="mt-6 font-display text-[32px] font-semibold leading-10">Не получилось скачать тест</h3>
              <p className="mt-2 max-w-[360px] text-sm">
                Попробуйте ещё раз, если не сработает — <a href="mailto:support@example.com" className="text-primary">напишите в поддержку</a>
              </p>
              <button onClick={() => setPhase("settings")} className="mt-8 h-12 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Попробовать ещё раз
              </button>
            </div>
          )}

          {phase !== "error" && (
            <div className="flex justify-center py-3">
              <button
                onClick={download}
                disabled={phase === "loading" || count === 0}
                className="h-12 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                Скачать тест
              </button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Row({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-5">
      <div>
        <p className="text-xl font-semibold leading-6">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex h-12 w-[132px] shrink-0 items-center justify-between rounded-xl border border-border p-1">
      <button aria-label="Меньше" disabled={value <= min} onClick={() => onChange(value - 1)} className="flex size-10 items-center justify-center rounded-lg bg-secondary disabled:opacity-40">
        <Minus className="size-5" />
      </button>
      <span className="text-sm">{value}</span>
      <button aria-label="Больше" disabled={value >= max} onClick={() => onChange(value + 1)} className="flex size-10 items-center justify-center rounded-lg bg-secondary disabled:opacity-40">
        <Plus className="size-5" />
      </button>
    </div>
  );
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const LETTERS = "АБВГДЕЖЗ";

function buildTestHtml(title: string, items: DraftQuestion[], variants: number, count: number, withAnswers: boolean) {
  const keys: string[][] = [];
  const pages = Array.from({ length: variants }, (_, v) => {
    const qs = (variants > 1 ? shuffle(items) : items).slice(0, count);
    const key: string[] = [];
    const body = qs
      .map((q, i) => {
        const opts = shuffle([q.correct, ...q.incorrect.filter((x) => x.trim())]);
        key.push(`${i + 1} — ${LETTERS[opts.indexOf(q.correct)]}`);
        return `<li><p class="q">${esc(q.text)}</p>${q.image ? `<img src="${q.image.src}">` : ""}<ol type="А">${opts.map((o) => `<li>${esc(o)}</li>`).join("")}</ol></li>`;
      })
      .join("");
    keys.push(key);
    return `<section><h1>${esc(title)}</h1><p class="meta">${variants > 1 ? `Вариант ${v + 1} · ` : ""}Фамилия, имя: ____________________ Класс: ______</p><ol class="qs">${body}</ol></section>`;
  }).join("");
  const answers = withAnswers
    ? `<section><h1>Ответы для проверки</h1>${keys.map((k, i) => `<h2>${variants > 1 ? `Вариант ${i + 1}` : "Ответы"}</h2><p>${k.join(", ")}</p>`).join("")}</section>`
    : "";
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(title)} — тест</title><style>
body{font-family:Arial,sans-serif;color:#111;margin:0}section{padding:32px 40px;page-break-after:always}h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:18px 0 4px}
.meta{color:#555;font-size:13px;margin-bottom:20px}.qs>li{margin-bottom:16px;break-inside:avoid}.q{font-weight:bold;margin:0 0 6px}ol[type="А"]{margin:0;padding-left:22px}
ol[type="А"] li{list-style-type:none;counter-increment:o}ol[type="А"]{counter-reset:o}ol[type="А"] li::before{content:counter(o,cyrillic-lower) ") "}img{max-width:260px;max-height:160px;display:block;margin:4px 0 8px;border-radius:8px}
</style></head><body>${pages}${answers}<script>setTimeout(()=>print(),300)</script></body></html>`;
}
