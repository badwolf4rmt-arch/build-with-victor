export function Logo() {
  return (
    <a href="/" className="flex items-center gap-2" aria-label="Конструктор викторин">
      <svg width="40" height="36" viewBox="0 0 40 36" fill="none" aria-hidden="true">
        <path
          d="M20 2C9.5 2 2 8.6 2 16.5c0 4.4 2.3 8.3 6 10.9L6.5 34l7.4-3.9c1.9.5 3.9.8 6.1.8 10.5 0 18-6.6 18-14.4S30.5 2 20 2Z"
          fill="var(--brand-green)"
        />
        <circle cx="13.5" cy="16" r="5.5" fill="var(--card)" />
        <circle cx="26.5" cy="16" r="5.5" fill="var(--card)" />
        <circle cx="14.5" cy="17" r="2.6" fill="var(--brand-teal)" />
        <circle cx="27.5" cy="17" r="2.6" fill="var(--brand-teal)" />
      </svg>
      <span className="flex flex-col text-[19px] font-bold leading-[18px] tracking-tight text-brand-teal">
        <span>конструктор</span>
        <span>викторин</span>
      </span>
    </a>
  );
}
