import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getQuizItems, type Quiz } from "@/lib/quiz-store";
import { AVATARS, BONUSES, HIDE_RULES_KEY, saveSetup, type BonusId } from "@/lib/game";
import { createLiveSession, TIME_LIMIT, type LiveMode } from "@/lib/live";
import classroom from "@/assets/rules-classroom.jpg";
import { useIsMobile } from "@/hooks/use-mobile";
import { Modal } from "./Modal";

export function LaunchFlow({ quiz, open, onOpenChange }: { quiz: Quiz; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<"rules" | "setup">("rules");
  const isPhone = useIsMobile();
  useEffect(() => {
    if (open) setStep(localStorage.getItem(HIDE_RULES_KEY) ? "setup" : "rules");
  }, [open]);

  // Figma: «На телефоне запуск недоступен» — the game board needs a computer, tablet or classroom screen.
  if (isPhone)
    return (
      <Modal open={open} onOpenChange={onOpenChange} title="Запуск недоступен на телефоне" description="Откройте викторину на компьютере, планшете или интерактивной доске, чтобы провести игру.">
        <button onClick={() => onOpenChange(false)} className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          Понятно
        </button>
      </Modal>
    );

  return step === "rules" ? (
    <RulesModal
      open={open}
      onClose={() => onOpenChange(false)}
      onContinue={(hide) => {
        if (hide) localStorage.setItem(HIDE_RULES_KEY, "1");
        setStep("setup");
      }}
    />
  ) : (
    <SetupCurtain quiz={quiz} open={open} onClose={() => onOpenChange(false)} />
  );
}

function RulesModal({ open, onClose, onContinue }: { open: boolean; onClose: () => void; onContinue: (hide: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] bg-card outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-95">
          <div className="p-8 pb-8">
            <img src={classroom} alt="" width={1216} height={544} className="h-[250px] w-full rounded-2xl object-cover" />
            <DialogPrimitive.Title className="mt-5 font-display text-[32px] font-semibold leading-10">
              Как проходит викторина
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-base leading-5">
              В викторине могут участвовать до пяти команд. Они по очереди выбирают карточки с вопросами, отвечают и получают
              баллы за правильные ответы. Вместо вопроса команде может попасться бонус — он принесёт или отнимет баллы
            </DialogPrimitive.Description>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button onClick={() => onContinue(true)} className="h-12 rounded-xl bg-secondary text-sm font-semibold hover:bg-muted">
                Больше не показывать
              </button>
              <button onClick={() => onContinue(false)} className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90">
                Продолжить
              </button>
            </div>
          </div>
          <DialogPrimitive.Close aria-label="Закрыть" className="absolute -right-10 top-0 hidden text-card sm:block">
            <X className="size-6" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SetupCurtain({ quiz, open, onClose }: { quiz: Quiz; open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [count, setCount] = useState(1);
  const [names, setNames] = useState(["Команда 1", "Команда 2", "Команда 3", "Команда 4", "Команда 5"]);
  const [avatars, setAvatars] = useState(AVATARS.slice(0, 5));
  const [picker, setPicker] = useState<number | null>(null);
  const [bonuses, setBonuses] = useState<BonusId[]>([]);
  const [way, setWay] = useState<"board" | "qr">("board");
  const [advanced, setAdvanced] = useState(false);
  const [liveMode, setLiveMode] = useState<LiveMode>("sync");
  const [speed, setSpeed] = useState(true);
  const [creating, setCreating] = useState(false);
  const all = bonuses.length === BONUSES.length;
  const singleTeam = count === 1;

  const toggle = (id: BonusId, on: boolean) => setBonuses((b) => (on ? [...b, id] : b.filter((x) => x !== id)));
  const gameItems = () => getQuizItems(quiz).map((it) => ({ text: it.text, correct: it.correct, incorrect: it.incorrect.filter((x) => x.trim()), image: it.image?.src }));

  const start = async () => {
    if (way === "qr") {
      setCreating(true);
      try {
        const code = await createLiveSession({ quizId: quiz.id, title: quiz.title, items: gameItems(), mode: liveMode, speedScoring: speed });
        void navigate({ to: "/host/$code", params: { code } });
      } catch {
        toast.error("Не удалось создать игру. Проверьте интернет и попробуйте ещё раз.");
      } finally {
        setCreating(false);
      }
      return;
    }
    saveSetup({
      quizId: quiz.id,
      title: quiz.title,
      questions: getQuizItems(quiz).length,
      items: gameItems(),
      teams: Array.from({ length: count }, (_, i) => ({ name: names[i]!.trim() || `Команда ${i + 1}`, avatar: avatars[i]!, score: 0 })),
      bonuses: singleTeam ? [] : bonuses,
    });
    void navigate({ to: "/play" });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[720px] flex-col rounded-l-[32px] bg-card outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center justify-between px-8 pt-8">
            <DialogPrimitive.Title className="font-display text-[32px] font-semibold leading-10">Пара настроек и начнём</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Закрыть"><X className="size-6" /></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Настройка команд и бонусов</DialogPrimitive.Description>

          <div className="flex-1 overflow-y-auto px-8 pb-6 pt-8">
            <p className="text-xl font-semibold leading-6">Как проводим?</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([["board", "На доске командами", "Команды по очереди выбирают карточки"], ["qr", "На устройствах учеников", "Ученики сканируют QR-код и отвечают с телефонов"]] as const).map(([id, t, d]) => (
                <button key={id} onClick={() => setWay(id)} className={cn("rounded-2xl border-2 p-4 text-left", way === id ? "border-primary bg-accent" : "border-border hover:bg-secondary")}>
                  <p className="text-base font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </button>
              ))}
            </div>

            {way === "qr" ? (
              <div className="mt-8">
                <button onClick={() => setAdvanced((a) => !a)} className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Settings className="size-4" /> {advanced ? "Скрыть расширенные настройки" : "Показать расширенные настройки"}
                </button>
                {advanced && (
                  <div className="mt-5 flex flex-col gap-6">
                    <div>
                      <p className="text-base font-semibold">Темп</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {([["sync", "Все вместе", `Вопрос на экране, ${TIME_LIMIT} секунд на ответ`], ["self", "Каждый в своём темпе", "Ученик проходит вопросы сам"]] as const).map(([id, t, d]) => (
                          <button key={id} onClick={() => setLiveMode(id)} className={cn("rounded-2xl border-2 p-4 text-left", liveMode === id ? "border-primary bg-accent" : "border-border hover:bg-secondary")}>
                            <p className="text-sm font-semibold">{t}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center justify-between gap-6">
                      <span>
                        <span className="block text-base font-semibold">Учитывать скорость ответа</span>
                        <span className="block text-sm text-muted-foreground">Кто ответил быстрее, получает больше баллов</span>
                      </span>
                      <Switch checked={speed} onCheckedChange={setSpeed} />
                    </label>
                  </div>
                )}
              </div>
            ) : (
            <>
            <div className="mt-10 flex items-start justify-between gap-5">

              <div>
                <p className="text-xl font-semibold leading-6">Сколько команд участвует?</p>
                <p className="mt-2 text-sm text-muted-foreground">Не забудьте придумать им названия</p>
              </div>
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={cn("size-11 rounded-xl text-base font-semibold transition-colors", n === count ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted")}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {Array.from({ length: count }, (_, i) => (
                <div key={i} className="relative flex items-center gap-3">
                  <button
                    aria-label="Сменить аватар"
                    onClick={() => setPicker(picker === i ? null : i)}
                    className="group relative flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary text-4xl"
                  >
                    {avatars[i]}
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/70 text-base text-card opacity-0 transition-opacity group-hover:opacity-100">✎</span>
                  </button>
                  <input
                    value={names[i]}
                    maxLength={30}
                    onChange={(e) => setNames((n) => n.map((x, j) => (j === i ? e.target.value : x)))}
                    className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
                  />
                  {picker === i && (
                    <div className="absolute left-0 top-[72px] z-10 grid grid-cols-3 gap-3 rounded-2xl bg-card p-4 shadow-card">
                      {AVATARS.map((a) => (
                        <button
                          key={a}
                          onClick={() => { setAvatars((v) => v.map((x, j) => (j === i ? a : x))); setPicker(null); }}
                          className={cn("flex size-16 items-center justify-center rounded-full text-4xl hover:bg-secondary", a === avatars[i] && "bg-accent")}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12">
              <p className="text-xl font-semibold leading-6">Если хотите, добавьте бонусы</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Бонусы случайным образом выпадают командам во время викторины, могут добавить или забрать баллы — так викторина становится интереснее
              </p>
              {singleTeam ? (
                <div className="mt-5 rounded-2xl bg-accent px-5 py-4 text-sm">Бонусы доступны, если участвуют две команды и больше</div>
              ) : (
                <label className="mt-7 flex items-center gap-8 text-base font-semibold">
                  Использовать все бонусы
                  <Switch checked={all} onCheckedChange={(on) => setBonuses(on ? BONUSES.map((b) => b.id) : [])} />
                </label>
              )}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {BONUSES.map((b) => (
                  <div key={b.id} className={cn("flex items-center gap-3 rounded-2xl border border-border p-4", singleTeam && "opacity-50")}>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl">{b.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-5">{b.name}</p>
                      <p className="mt-1 text-sm leading-[18px] text-muted-foreground">{b.text}</p>
                    </div>
                    <Switch disabled={singleTeam} checked={bonuses.includes(b.id)} onCheckedChange={(on) => toggle(b.id, on)} />
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </div>

          <div className="flex justify-center py-3">
            <button disabled={creating} onClick={() => void start()} className="h-12 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {way === "qr" ? "Создать игру и показать QR-код" : "Начать викторину"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
