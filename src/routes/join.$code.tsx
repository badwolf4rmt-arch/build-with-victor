import { FruitAvatar } from "@/components/quiz/FruitAvatar";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { RichText } from "@/components/quiz/RichText";
import { AnswerReview } from "@/components/quiz/AnswerReview";
import { LiveResults } from "@/components/quiz/LiveResults";
import { AVATARS, type GameQuestion } from "@/lib/game";
import { cn } from "@/lib/utils";
import { InputAnswer, OrderAnswer } from "@/components/quiz/AnswerArea";
import { isInputCorrect, kindOf, ORDER_SEP, orderSteps } from "@/lib/question-kinds";
import { remainingSeconds, answerPoints, joinGame, sessionTeams, teamScores, optionsFor, submitAnswer, TIME_LIMIT, useLiveGame, type LivePlayer } from "@/lib/live";

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
  const [avatar, setAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]!);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [team, setTeam] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selfIndex, setSelfIndex] = useState<number | null>(null);
  const storeKey = `live-player-${code}`;
  useEffect(() => setPlayerId(localStorage.getItem(storeKey)), [storeKey]);

  const me = players.find((p) => p.id === playerId);
  const myAnswers = answers.filter((a) => a.player_id === playerId);
  useEffect(() => {
    if (session?.mode === "self" && me && selfIndex === null) setSelfIndex(myAnswers.length);
  }, [session?.mode, me, selfIndex, myAnswers.length]);

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md rounded-[32px] bg-card p-6">{children}</div>
    </div>
  );

  if (session === undefined) return shell(<p className="text-center">Загрузка…</p>);
  if (!session) return shell(<p className="text-center">Игра с кодом {code} не найдена</p>);

  const teams = sessionTeams(session);
  if (!playerId || (!me && players.length > 0 && !busy)) {
    return shell(
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || (teams.length > 0 && !team)) return;
          setBusy(true);
          try {
            const p = await joinGame(code, name, team, avatar);
            localStorage.setItem(storeKey, p.id);
            setPlayerId(p.id);
          } finally {
            setBusy(false);
          }
        }}
        className="flex flex-col gap-4"
      >
        <p className="font-display text-2xl font-semibold">{session.title}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPickingAvatar((v) => !v)}
            aria-label="Выбрать значок"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-3xl transition-transform hover:scale-105"
          >
            <FruitAvatar value={avatar} className="size-full" />
          </button>
          <input
            autoFocus
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя ученика"
            className="h-14 min-w-0 flex-1 rounded-full border border-border bg-card px-5 text-lg outline-none focus:border-primary"
          />
        </div>
        {pickingAvatar && (
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => { setAvatar(a); setPickingAvatar(false); }}
                className={cn("flex size-14 items-center justify-center rounded-full text-3xl hover:bg-secondary", a === avatar ? "bg-accent ring-2 ring-primary" : "bg-secondary/50")}
              >
                <FruitAvatar value={a} className="size-12" />
              </button>
            ))}
          </div>
        )}
        {teams.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Выберите команду</p>
            <div className="grid grid-cols-2 gap-2">
              {teams.map((t) => (
                <button type="button" key={t} onClick={() => setTeam(t)} className={cn("min-h-12 rounded-xl border-2 px-3 text-sm font-semibold", team === t ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{t}</button>
              ))}
            </div>
          </div>
        )}
        <button disabled={busy || !name.trim() || (teams.length > 0 && !team)} className="h-14 rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-50">
          Войти в игру
        </button>
      </form>,
    );
  }
  if (!me) return shell(<p className="text-center">Подключаемся…</p>);

  const total = session.items.length;
  const header = (
    <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
      <span className="truncate font-semibold text-foreground">{me.avatar && <FruitAvatar value={me.avatar} className="mr-1 inline-block size-6 align-middle" />}{me.name}{me.team ? ` · ${me.team}` : ""}</span>
      <span>⭐ {me.score}</span>
    </div>
  );

  if (session.state === "lobby") return shell(<>{header}<p className="py-8 text-center font-display text-xl font-semibold">Вы в игре! Ждём, когда учитель начнёт</p></>);

  if (session.state === "finished" || (session.mode === "self" && (selfIndex ?? myAnswers.length) >= total)) {
    return <div className="min-h-screen bg-secondary p-4 sm:p-8"><div className="mx-auto max-w-[1100px] rounded-[32px] bg-card p-5 sm:p-8">
      <LiveResults title={session.title} cover={session.cover_url} players={players} answers={answers} total={total} playerId={me.id} teams={teams} finished={session.state === "finished"} />
    </div></div>;
  }

  const index = session.mode === "sync" ? session.current : (selfIndex ?? myAnswers.length);
  const q = session.items[index];
  if (!q) return shell(<p className="text-center">Ждём следующий вопрос…</p>);
  const done = myAnswers.find((a) => a.question === index);

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
        showFeedback={session.mode === "self" && session.auto_reveal}
        initialAnswer={done?.answer}
        revealed={session.state === "reveal"}
        showExplanation={session.show_explanations}
        selfPaced={session.mode === "self"}
        onNext={() => setSelfIndex(index + 1)}
      />
    </>
  );
}

export function Question(props: {
  code: string; player: LivePlayer; index: number; total: number; q: GameQuestion;
  speed: boolean; startedAt: number | null; showFeedback: boolean; initialAnswer: string | undefined;
  revealed: boolean; showExplanation: boolean; selfPaced: boolean; onNext: () => void;
}) {
  const { q, index } = props;
  const options = useMemo(() => optionsFor(q, index), [q, index]);
  const shownAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [draftChoice, setDraftChoice] = useState(props.initialAnswer ?? "");
  const [picked, setPicked] = useState<string | null>(props.initialAnswer ?? null);
  const [points, setPoints] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(false);
  const [ok, setOk] = useState(false);
  const kind = kindOf(q);
  const reveal = props.revealed || feedback;
  const reviewedCorrect = props.revealed
    ? kind === "input" ? isInputCorrect(picked ?? "", q.correct) : kind === "order" ? picked === orderSteps(q).join(ORDER_SEP) : picked === q.correct
    : ok;
  const left = remainingSeconds(props.startedAt, now);
  const locked = busy || reveal || left === 0;
  useEffect(() => {
    if (props.startedAt === null || reveal) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [props.startedAt, reveal]);

  const send = async (answer: string, correct: boolean) => {
    if (locked) return;
    setBusy(true); setError("");
    const pts = answerPoints(correct, props.speed, Date.now() - (props.startedAt ?? shownAt.current));
    try {
      const saved = await submitAnswer({ code: props.code, player: props.player, question: index, answer, correct, points: pts });
      if (!saved) { setError("Ответ не сохранён. Попробуйте ещё раз."); return; }
      setPicked(answer); setOk(correct); setPoints(pts);
      if (props.showFeedback) setFeedback(true);
    } catch { setError("Не удалось отправить ответ. Проверьте соединение."); }
    finally { setBusy(false); }
  };
  const label = busy ? "Отправляем…" : picked ? "Изменить ответ" : "Ответить";
  return <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>Вопрос {index + 1} из {props.total}</span>
      {left !== null && !reveal && <span role="timer" className={cn("flex items-center gap-1 font-semibold tabular-nums", left <= 5 ? "text-destructive" : "text-primary")}><Clock className="size-4" />{left} с</span>}
    </div>
    <RichText text={q.text} className="font-display text-xl font-semibold leading-7" />
    {q.image && <img src={q.image} alt="" className="aspect-[3/2] w-full rounded-2xl object-cover" />}
    {reveal ? <>
      <p className={cn("font-display text-xl font-semibold", reviewedCorrect ? "text-success" : "text-destructive")}>
        {!picked ? "Нет ответа" : reviewedCorrect ? "Верно!" : "Неверно"}{feedback && ok ? ` · +${points}` : ""}
      </p>
      <AnswerReview q={q} index={index} answer={picked ?? undefined} correct={reviewedCorrect} showExplanation={props.showExplanation} />
    </> : <>
      {kind === "order" && <OrderAnswer steps={orderSteps(q)} seed={index} size="sm" reveal={false} initial={picked ? picked.split(ORDER_SEP) : undefined} disabled={locked} checkLabel={label} onCheck={(o,c) => void send(o.join(ORDER_SEP),c)} />}
      {kind === "input" && <InputAnswer correct={q.correct} size="sm" reveal={false} initial={picked ?? undefined} disabled={locked} checkLabel={label} onCheck={(a,c) => void send(a.trim(),c)} />}
      {kind === "choice" && <><div className="flex flex-col gap-3">{options.map((o) => <Button key={o} variant="outline" disabled={locked} aria-pressed={draftChoice === o} onClick={() => setDraftChoice(o)} className={cn("h-auto min-h-14 justify-start whitespace-normal rounded-2xl border-2 p-3 text-left text-base font-semibold", draftChoice === o ? "answer-hover hover:text-primary-foreground" : "answer-standard hover:text-primary-foreground hover:opacity-90")}><RichText text={o} className="flex-1" />{draftChoice === o && <Check className="size-5 shrink-0" />}</Button>)}</div>
      <Button disabled={locked || !draftChoice} onClick={() => void send(draftChoice, draftChoice === q.correct)} className="h-auto min-h-14 whitespace-normal rounded-2xl text-base font-semibold">{label}</Button></>}
      {picked && <p role="status" className="text-sm text-primary">Ответ сохранён{left === 0 ? ". Время вышло — ждём учителя." : props.selfPaced ? ". Можно изменить до перехода дальше." : ". Можно изменить, пока вопрос открыт."}</p>}
      {left === 0 && !picked && <p role="status" className="text-sm text-muted-foreground">Время вышло. Ждём учителя.</p>}
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {props.selfPaced && picked && <Button onClick={props.onNext} className="h-auto min-h-14 whitespace-normal rounded-2xl text-base font-semibold">{index + 1 < props.total ? "Следующий вопрос" : "Посмотреть итоги"}</Button>}
    {props.revealed && <p className="text-sm text-muted-foreground">Ждём следующий вопрос от учителя</p>}
  </div>;
}
