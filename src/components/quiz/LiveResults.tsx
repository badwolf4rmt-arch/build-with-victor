import { playerPlace, teamScores, type LiveAnswer, type LivePlayer } from "@/lib/live";
import { cn } from "@/lib/utils";
import { RichText } from "./RichText";

export function LiveResults({ title, cover, players, answers, total, playerId, teams = [], finished = true }: { title: string; cover?: string | null; players: LivePlayer[]; answers: LiveAnswer[]; total: number; playerId?: string; teams?: string[]; finished?: boolean }) {
  const ranking = [...players].sort((a, b) => b.score - a.score);
  const me = players.find((p) => p.id === playerId);
  const mine = answers.filter((a) => a.player_id === playerId);
  const teamRanking = teamScores(teams, players);
  return <section className="mx-auto w-full max-w-[1100px] space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {cover && <img src={cover} alt="Обложка викторины" className="aspect-[3/2] w-full rounded-2xl object-cover sm:w-40" />}
      <div className="min-w-0"><RichText text={title} className="font-display text-2xl font-semibold" /><p className="mt-2 text-sm text-muted-foreground">{finished ? "Итоги викторины" : "Текущие результаты · игра продолжается"} · участников: {players.length}</p></div>
    </div>
    {me && <div className="grid grid-cols-3 gap-2 border-y border-border py-5 text-center">
      <div><p className="font-display text-2xl font-semibold">{playerPlace(players, me.score)} <span className="text-sm text-muted-foreground">из {players.length}</span></p><p className="text-sm text-muted-foreground">Место</p></div>
      <div><p className="font-display text-2xl font-semibold">{mine.filter((a) => a.correct).length}/{total}</p><p className="text-sm text-muted-foreground">Верно</p></div>
      <div><p className="font-display text-2xl font-semibold">{me.score}</p><p className="text-sm text-muted-foreground">Баллы</p></div>
    </div>}
    {teamRanking.length > 0 && <div className="space-y-2"><h2 className="text-lg font-semibold">Команды</h2>{teamRanking.map((t, i) => <div key={t.name} className="flex flex-wrap justify-between gap-2 border-b border-border py-3"><span>{i + 1}. {t.name}{me?.team === t.name ? " · ваша команда" : ""}</span><span className="font-semibold">{t.score} · {t.members} уч.</span></div>)}</div>}
    <h2 className="text-lg font-semibold">Результаты участников</h2>
    <div className="space-y-1 sm:hidden">{ranking.map((p) => {
      const a = answers.filter((a) => a.player_id === p.id);
      return <div key={p.id} className={cn("flex items-start gap-3 border-b border-border p-3", p.id === playerId && "bg-info")}>
        <span className="w-5 shrink-0 font-semibold">{playerPlace(players, p.score)}</span>
        <div className="min-w-0 flex-1"><p className="break-words font-semibold">{p.name}{p.id === playerId ? " (вы)" : ""}</p>{p.team && <p className="text-sm text-muted-foreground">{p.team}</p>}<p className="mt-1 text-sm text-muted-foreground">Ответы {a.length}/{total} · верно {a.filter((a) => a.correct).length}</p></div>
        <div className="shrink-0 text-right"><p className="font-semibold">{p.score}</p><p className="text-xs text-muted-foreground">баллы</p></div>
      </div>;
    })}</div>
    <div className="hidden overflow-x-auto sm:block"><table className="w-full text-left text-sm">
      <thead className="bg-secondary text-muted-foreground"><tr><th className="p-3">Место</th><th className="p-3">Ученик</th><th className="p-3">Ответы</th><th className="p-3">Верно</th><th className="p-3">Баллы</th></tr></thead>
      <tbody>{ranking.map((p) => { const a = answers.filter((a) => a.player_id === p.id); return <tr key={p.id} className={cn("border-b border-border", p.id === playerId && "bg-info")}><td className="p-3 font-semibold">{playerPlace(players, p.score)}</td><td className="p-3"><span className="font-semibold">{p.name}{p.id === playerId ? " (вы)" : ""}</span>{p.team && <span className="block text-muted-foreground">{p.team}</span>}</td><td className="p-3">{a.length}/{total}</td><td className="p-3">{a.filter((a) => a.correct).length}</td><td className="p-3 font-semibold">{p.score}</td></tr>; })}</tbody>
    </table></div>
  </section>;
}