import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { SUBJECTS } from "@/lib/quiz-ai.functions";

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е").trim();

/** Bolds the typed part of a subject name. Indexes line up because normalize never changes length. */
function highlight(label: string, q: string) {
  const i = q ? normalize(label).indexOf(q) : -1;
  if (i < 0) return label;
  return (
    <>
      {label.slice(0, i)}
      <span className="font-semibold text-primary">{label.slice(i, i + q.length)}</span>
      {label.slice(i + q.length)}
    </>
  );
}

/** Subjects whose name contains the typed fragment (case-insensitive, ё treated as е). Empty query lists all. */
export function filterSubjects(query: string): string[] {
  const q = normalize(query);
  return q ? SUBJECTS.filter((s) => normalize(s).includes(q)) : [...SUBJECTS];
}

/** Subject picker: type to filter the list, or keep your own name when it is not in the list. */
export function SubjectCombobox({
  value,
  onChange,
  placeholder = "Выберите или введите предмет",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const q = normalize(value);
  const matches = useMemo(() => filterSubjects(value), [value]);
  const exact = useMemo(() => SUBJECTS.some((s) => normalize(s) === q), [q]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function select(s: string) {
    onChange(s);
    setOpen(false);
    input.current?.blur();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (matches.length) {
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((a) => Math.min(Math.max(a + step, 0), matches.length - 1));
      }
    } else if (e.key === "Enter") {
      if (open && matches[active]) {
        e.preventDefault();
        select(matches[active]);
      } else setOpen(false);
    } else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={wrap} className="relative">
      <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={input}
          value={value}
          onChange={(e) => {
            onChange(e.target.value.slice(0, 80));
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="subject-listbox"
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `subject-option-${active}` : undefined}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            aria-label="Очистить предмет"
            onClick={() => {
              onChange("");
              setOpen(false);
              input.current?.focus();
            }}
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
        {!value && <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />}
      </div>

      {open && (
        <div
          id="subject-listbox"
          role="listbox"
          aria-label="Список предметов"
          className="absolute inset-x-0 top-full z-[60] mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          {matches.length === 0 && <p className="px-3 py-3 text-sm text-muted-foreground">В списке такого предмета нет — оставьте введённое название.</p>}
          {matches.map((s, i) => (
            <div
              key={s}
              id={`subject-option-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(s)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === active ? "bg-secondary" : ""}`}
            >
              {highlight(s, q)}
            </div>
          ))}
          {q && !exact && (
            <div
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-muted-foreground"
            >
              Оставить «{value.trim()}»
            </div>
          )}
        </div>
      )}
    </div>
  );
}
