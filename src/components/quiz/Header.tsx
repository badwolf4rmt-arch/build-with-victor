import { ArrowUpRight, CircleHelp, Search } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";

export function Header({ search, onSearch }: { search: string; onSearch: (v: string) => void }) {
  return (
    <header className="rounded-b-3xl bg-card">
      <div className="mx-auto flex h-[88px] max-w-[1366px] items-center gap-6 px-6">
        <div className="w-[228px] shrink-0">
          <Logo />
        </div>
        <div className="flex flex-1 justify-center">
          <label className="flex h-12 w-full max-w-[466px] items-center gap-2.5 rounded-xl bg-secondary px-[18px]">
            <Search className="size-5 shrink-0 text-foreground" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Поиск по названию"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => toast("Ассистент преподавателя скоро будет доступен")}
            className="hidden h-12 items-center gap-2 rounded-2xl bg-secondary px-4 md:flex"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-quiz-gradient text-[10px] font-bold text-primary-foreground">
              АП
            </span>
            <span className="text-left text-[11px] font-semibold leading-[13px]">
              Ассистент
              <br />
              Преподавателя
            </span>
            <ArrowUpRight className="size-5" />
          </button>
          <button
            aria-label="Помощь"
            onClick={() => toast("Раздел помощи в разработке")}
            className="flex size-12 items-center justify-center rounded-2xl bg-secondary"
          >
            <CircleHelp className="size-5" />
          </button>
          <button
            onClick={() => toast("Вы вышли из аккаунта (демо)")}
            className="h-12 rounded-2xl bg-secondary px-[18px] text-sm font-semibold"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
