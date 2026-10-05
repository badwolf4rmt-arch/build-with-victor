import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Shrinks its content (never enlarges) so it always fits the visible area without scrolling — like a slide on a classroom screen. */
export function FitToScreen({ children, className }: { children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const availableHeight = Math.max(0, o.clientHeight - 2);
      const availableWidth = Math.max(0, o.clientWidth - 2);
      const s = Math.min(1, availableHeight / i.scrollHeight, availableWidth / i.scrollWidth);
      setScale(Number.isFinite(s) && s > 0 ? s : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden ${className ?? ""}`}>
      <div ref={inner} className="w-full shrink-0" style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        {children}
      </div>
    </div>
  );
}
