import { ArrowUpRight, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="rounded-b-3xl bg-card">
      <div className="mx-auto flex h-[88px] max-w-[1366px] items-center gap-6 px-6">
        <div className="w-[228px] shrink-0">
          <Logo />
        </div>
        <div className="flex-1" />
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
