import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { GradientButton, QuestionCard } from "@/components/quiz/QuestionCard";
import { FitToScreen } from "@/components/quiz/FitToScreen";
import { optionsFor, TIME_LIMIT, updateSession, useLiveGame, type LiveAnswer, type LivePlayer } from "@/lib/live";
import { QUESTION_POINTS } from "@/lib/game";
import bg from "@/assets/game-bg.jpg";

export const Route = createFileRoute("/host/$code")({
  head: () => ({
    meta: [
      { title: "Игра по QR-коду — Конструктор викторин" },
      { name: "description", content: "Ученики сканируют QR-код и отвечают со своих устройств, учитель видит результаты." },
      { property: "og:title", content: "Игра по QR-коду — Конструктор викторин" },
      { property: "og:description", content: "Викторина на устройствах учеников с результатами для учителя." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HostPage,
});

/** The editor preview asks for a Lovable login, so students always get the public published address. */
const PUBLISHED_ORIGIN = "https://build-with-victor.lovable.app";
function publicOrigin() {
  const h = window.location.hostname;
  return h.includes("preview") || h.endsWith("lovableproject.com") || h === "localhost" ? PUBLISHED_ORIGIN : window.location.origin;
}

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function HostPage() {
  const { code } = Route.useParams();
  const { session, players, answers } = useLiveGame(code);
  const [joinUrl, setJoinUrl] = useState("");
  useEffect(() => setJoinUrl(`${publicOrigin()}/join/${code}`), [code]);
  const now = useNow(session?.state === "question" && session.mode === "sync");

  const current = session?.current ?? 0;
  const currentAnswers = answers.filter((a) => a.question === current);
  const left = session?.question_started_at ? Math.max(0, TIME_LIMIT - Math.floor((now - session.question_started_at) / 1000)) : TIME_LIMIT;

  // Sync mode: reveal automatically when time is up or everyone answered.
  useEffect(() => {
    if (!session || session.mode !== "sync" || session.state !== "question" || !session.auto_reveal) return;
    if (left === 0 || (players.length > 0 && currentAnswers.length >= players.length)) void updateSession(code, { state: "reveal" });
  }, [session, left, players.length, currentAnswers.length, code]);

  if (session === undefined) return null;
  if (!session)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Игра не найдена</p>
        <Link to="/" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">К викторинам</Link>
      </div>
    );

  const total = session.items.length;
  const ranking = [...players].sort((a, b) => b.score - a.score);
  const startQuestion = (i: number) => updateSession(code, { state: "question", current: i, question_started_at: Date.now() });
  const finish = () => updateSession(code, { state: "finished" });

  return (
    <div className="relative flex min-h-screen flex-col">
      <img src={bg} alt="" className="fixed inset-0 -z-10 h-full w-full object-cover" />
      <header className="flex items-center justify-between gap-4 rounded-b-[32px] bg-card px-6 py-4">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold">{session.title}</p>
          <p className="text-sm text-muted-foreground">
            Код игры <b className="text-foreground">{code}</b> · {session.mode === "sync" ? "все вместе" : "в своём темпе"} · участников: {players.length}
          </p>
        </div>
        {session.state !== "finished" ? (
          <button onClick={finish} className="flex h-12 items-center gap-2.5 rounded-2xl bg-secondary pl-3.5 pr-[18px] text-sm font-semibold hover:bg-muted">
            <X className="size-5" /> Завершить
          </button>
        ) : (
          <Link to="/" className="flex h-12 items-center rounded-2xl bg-secondary px-5 text-sm font-semibold hover:bg-muted">К викторинам</Link>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col p-6">
        {session.state === "lobby" && (
          <div className="mx-auto grid w-full max-w-[1100px] gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-4 rounded-[32px] bg-card p-8">
              {joinUrl && <QRCodeSVG value={joinUrl} size={300} />}
              <p className="text-center text-sm text-muted-foreground">Отсканируйте камерой телефона<br />или откройте {joinUrl.replace(/^https?:\/\//, "")}</p>
              <p className="font-display text-5xl font-semibold tracking-widest">{code}</p>
            </div>
            <div className="flex flex-col rounded-[32px] bg-card p-8">
              <p className="font-display text-2xl font-semibold">Подключились: {players.length}</p>
              <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
                {players.map((p) => (
                  <span key={p.id} className="rounded-full bg-secondary px-4 py-2 text-base font-semibold">{p.name}</span>
                ))}
                {!players.length && <p className="text-muted-foreground">Ждём учеников…</p>}
              </div>
              <button
                disabled={!players.length}
                onClick={() => void startQuestion(0)}
                className="mt-6 h-14 rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Начать викторину
              </button>
            </div>
          </div>
        )}

        {session.mode === "sync" && (session.state === "question" || session.state === "reveal") && session.items[current] && (
          <SyncQuestion
            index={current}
            total={total}
            q={session.items[current]!}
            reveal={session.state === "reveal"}
            left={left}
            answered={currentAnswers.length}
            players={players}
            answers={currentAnswers}
            ranking={ranking}
            onReveal={() => void updateSession(code, { state: "reveal" })}
            onNext={() => void (current + 1 < total ? startQuestion(current + 1) : finish())}
          />
        )}

        {session.mode === "self" && session.state === "question" && <ResultsTable players={ranking} answers={answers} total={total} />}

        {session.state === "finished" && (
          <div className="mx-auto w-full max-w-[1100px]">
            <p className="mb-4 text-center font-display text-4xl font-semibold text-card">Итоги</p>
            <ResultsTable players={ranking} answers={answers} total={total} />
          </div>
        )}
      </main>
    </div>
  );
}

function SyncQuestion(props: {
  index: number;
  total: number;
  q: { text: string; correct: string; incorrect: string[]; image?: string | undefined };
  reveal: boolean;
  left: number;
  answered: number;
  players: LivePlayer[];
  answers: LiveAnswer[];
  ranking: LivePlayer[];
  onReveal: () => void;
  onNext: () => void;
}) {
  const { q, reveal, index } = props;
  const options = useMemo(() => optionsFor(q, index), [q, index]);
  const count = (o: string) => props.answers.filter((a) => a.answer === o).length;
  return (
    <div className="mx-auto flex w-full max-w-[1438px] flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4 text-card">
        <p className="font-display text-2xl font-semibold">Вопрос {index + 1} из {props.total}</p>
        <p className="font-display text-2xl font-semibold">
          {reveal ? "Правильный ответ" : `⏱ ${props.left} с`} · ответили {props.answered}/{props.players.length}
        </p>
      </div>
      <FitToScreen className="flex-1">
        <QuestionCard
          text={q.text}
          image={q.image}
          points={QUESTION_POINTS}
          answers={options.map((o) => ({ t: reveal ? `${o} — ${count(o)}` : o, state: !reveal ? "idle" : o === q.correct ? "correct" : "dim" }))}
          footer={
            reveal ? (
              <>
                <div className="flex flex-wrap justify-center gap-2">
                  {props.ranking.slice(0, 5).map((p, i) => (
                    <span key={p.id} className="rounded-full bg-secondary px-4 py-2 font-semibold">{i + 1}. {p.name} — {p.score}</span>
                  ))}
                </div>
                <GradientButton onClick={props.onNext}>{index + 1 < props.total ? "Следующий вопрос" : "Итоги"}</GradientButton>
              </>
            ) : (
              <GradientButton onClick={props.onReveal}>Показать ответ</GradientButton>
            )
          }
        />
      </FitToScreen>
    </div>
  );
}

function ResultsTable({ players, answers, total }: { players: LivePlayer[]; answers: LiveAnswer[]; total: number }) {
  return (
    <div className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-[32px] bg-card">
      <table className="w-full text-left text-base">
        <thead className="bg-secondary text-sm text-muted-foreground">
          <tr><th className="px-6 py-3">#</th><th className="px-6 py-3">Ученик</th><th className="px-6 py-3">Ответил</th><th className="px-6 py-3">Верно</th><th className="px-6 py-3">Баллы</th></tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const mine = answers.filter((a) => a.player_id === p.id);
            return (
              <tr key={p.id} className="border-t border-border">
                <td className="px-6 py-3 font-semibold">{i + 1}</td>
                <td className="px-6 py-3">{p.name}</td>
                <td className="px-6 py-3">{mine.length}/{total}</td>
                <td className="px-6 py-3">{mine.filter((a) => a.correct).length}</td>
                <td className="px-6 py-3 font-bold">{p.score}</td>
              </tr>
            );
          })}
          {!players.length && <tr><td colSpan={5} className="px-6 py-6 text-center text-muted-foreground">Пока никто не подключился</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
