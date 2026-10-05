import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { answerPoints, joinGame, optionsFor, submitAnswer, TIME_LIMIT, useLiveGame, type LivePlayer } from "@/lib/live";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "Присоединиться к викторине" },
      { name: "description", content: "Введите имя и отвечайте на вопросы викторины со своего устройства." },
      { property: "og:title", content: "Присоединиться к викторине" },
      { property: "og:description", content: "Отвечайте на вопросы викторины со своего телефона." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { code } = Route.useParams();
  const { session, players, answers } = useLiveGame(code);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const storeKey = `live-player-${code}`;
  useEffect(() => setPlayerId(localStorage.getItem(storeKey)), [storeKey]);

  const me = players.find((p) => p.id === playerId);
  const myAnswers = answers.filter((a) => a.player_id === playerId);

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md rounded-[32px] bg-card p-6">{children}</div>
    </div>
  );

  if (session === undefined) return shell(<p className="text-center">Загрузка…</p>);
  if (!session) return shell(<p className="text-center">Игра с кодом {code} не найдена</p>);

  if (!playerId || (!me && players.length > 0 && !busy)) {
    return shell(
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          try {
            const p = await joinGame(code, name);
            localStorage.setItem(storeKey, p.id);
            setPlayerId(p.id);
          } finally {
            setBusy(false);
          }
        }}
        className="flex flex-col gap-4"
      >
        <p className="font-display text-2xl font-semibold">{session.title}</p>
        <input
          autoFocus
          value={name}
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          className="h-14 rounded-xl border border-border bg-card px-4 text-lg outline-none focus:border-primary"
        />
        <button disabled={busy || !name.trim()} className="h-14 rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-50">
          Войти в игру
        </button>
      </form>,
    );
  }
  if (!me) return shell(<p className="text-center">Подключаемся…</p>);

  const total = session.items.length;
  const header = (
    <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
      <span className="truncate font-semibold text-foreground">{me.name}</span>
      <span>⭐ {me.score}</span>
    </div>
  );

  if (session.state === "lobby") return shell(<>{header}<p className="py-8 text-center font-display text-xl font-semibold">Вы в игре! Ждём, когда учитель начнёт</p></>);

  if (session.state === "finished" || (session.mode === "self" && myAnswers.length >= total)) {
    const place = [...players].sort((a, b) => b.score - a.score).findIndex((p) => p.id === me.id) + 1;
    return shell(
      <>
        {header}
        <p className="text-center font-display text-3xl font-semibold">Готово!</p>
        <p className="mt-2 text-center">Верных ответов: {myAnswers.filter((a) => a.correct).length} из {total}</p>
        <p className="mt-1 text-center">Баллы: {me.score}{session.state === "finished" ? ` · место ${place}` : ""}</p>
      </>,
    );
  }

  const index = session.mode === "sync" ? session.current : myAnswers.length;
  const q = session.items[index];
  if (!q) return shell(<p className="text-center">Ждём следующий вопрос…</p>);
  const done = myAnswers.find((a) => a.question === index);

  if (session.state === "reveal") {
    return shell(
      <>
        {header}
        <p className="py-8 text-center font-display text-2xl font-semibold">
          {!done ? "Время вышло" : done.correct ? `Верно! +${done.points}` : "Неверно"}
        </p>
        <p className="text-center text-muted-foreground">Правильный ответ: {q.correct}</p>
      </>,
    );
  }

  return shell(
    <>
      {header}
      <Question
        key={`${index}`}
        code={code}
        player={me}
        index={index}
        total={total}
        q={q}
        speed={session.speed_scoring}
        startedAt={session.mode === "sync" ? (session.question_started_at ?? Date.now()) : null}
        showFeedback={session.mode === "self"}
        initialAnswer={done?.answer}
      />
    </>
  );
}

function Question(props: {
  code: string;
  player: LivePlayer;
  index: number;
  total: number;
  q: { text: string; correct: string; incorrect: string[]; image?: string | undefined };
  speed: boolean;
  startedAt: number | null;
  showFeedback: boolean;
  initialAnswer: string | undefined;
}) {
  const { q, index } = props;
  const options = useMemo(() => optionsFor(q, index), [q, index]);
  const shownAt = useRef(Date.now());
  const [picked, setPicked] = useState<string | null>(props.initialAnswer ?? null);
  const [points, setPoints] = useState(0);
  const [busy, setBusy] = useState(false);

  const pick = async (o: string) => {
    if (busy || (picked && props.showFeedback)) return;
    setPicked(o);
    setBusy(true);
    const elapsed = Date.now() - (props.startedAt ?? shownAt.current);
    const correct = o === q.correct;
    const pts = answerPoints(correct, props.speed, elapsed);
    setPoints(pts);
    
    const send = () => void submitAnswer({ code: props.code, player: props.player, question: index, answer: o, correct, points: pts });
    
    if (props.showFeedback) {
      setTimeout(() => {
        send();
        setBusy(false);
      }, 1500);
    } else {
      await submitAnswer({ code: props.code, player: props.player, question: index, answer: o, correct, points: pts });
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground flex justify-between">
        <span>Вопрос {index + 1} из {props.total}{props.startedAt ? ` · ${TIME_LIMIT} с` : ""}</span>
        {picked && !props.showFeedback && <span className="text-primary font-semibold">Ответ сохранён</span>}
      </p>
      <p className="font-display text-xl font-semibold leading-7">{q.text}</p>
      {q.image && <img src={q.image} alt="" className="aspect-[3/2] w-full rounded-2xl object-cover" />}
      <div className="flex flex-col gap-3">
        {options.map((o) => {
          const state = !picked || !props.showFeedback ? (picked === o ? "picked" : "idle") : o === q.correct ? "correct" : o === picked ? "wrong" : "dim";
          return (
            <button
              key={o}
              disabled={busy || (!!picked && props.showFeedback)}
              onClick={() => pick(o)}
              className={cn(
                "min-h-14 rounded-2xl border-2 p-3 text-left text-base font-semibold transition-colors",
                state === "idle" && "border-answer-border hover:bg-info",
                state === "picked" && "border-primary bg-primary text-primary-foreground",
                state === "correct" && "border-success bg-success text-success-foreground",
                state === "wrong" && "border-destructive bg-destructive text-destructive-foreground",
                state === "dim" && "border-muted text-muted-foreground",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked && props.showFeedback && (
        <p className="text-center font-display text-lg font-semibold">{picked === q.correct ? `Верно! +${points}` : "Неверно"}</p>
      )}
    </div>
  );
}
