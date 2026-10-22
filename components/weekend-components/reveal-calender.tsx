"use client"

import { useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

interface CalendarDay {
  date: Date;
  outside: boolean;
}

interface ViewState {
  y: number;
  m: number;
}

export interface RevealCalendarProps {
  /** Date selected on first render. Defaults to today. */
  initialDate?: Date;
  /** Called whenever the user picks a date. */
  onSelect?: (date: Date) => void;
}

// Build 42 cells (6 weeks) starting from the Sunday on/before the 1st
function buildMonth(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d, outside: d.getMonth() !== month };
  });
}

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Border-only mask: the gradient is clipped to a 1px ring around the cell
const ringMask: CSSProperties = {
  padding: 1,
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
};

export default function RevealCalendar({
  initialDate,
  onSelect,
}: RevealCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<ViewState>(() => {
    const base = initialDate ?? today;
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const [selected, setSelected] = useState<Date>(initialDate ?? today);
  const [dir, setDir] = useState<1 | -1>(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const cells = useMemo(() => buildMonth(view.y, view.m), [view]);
  const title = new Date(view.y, view.m).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shift = (delta: 1 | -1) => {
    setDir(delta);
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const pick = (date: Date) => {
    setSelected(date);
    onSelect?.(date);
  };

  // Reveal effect: listen on the whole card, and write the cursor position
  // (relative to each cell) into --x/--y. --o lives on the card, so the glow
  // fades in as soon as the cursor enters it and survives month changes.
  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    const grid = gridRef.current;
    if (!root || !grid) return;
    root.style.setProperty("--o", "1");
    for (const el of Array.from(grid.children) as HTMLElement[]) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - r.left}px`);
      el.style.setProperty("--y", `${e.clientY - r.top}px`);
    }
  };
  const handleLeave = () => rootRef.current?.style.setProperty("--o", "0");

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={[
        "w-[340px] select-none rounded-xl border p-5 shadow-sm [--o:0]",
        "border-neutral-200 bg-white text-neutral-900",
        "dark:border-white/10 dark:bg-background dark:text-white",
        // glow colours read by the hover layers
        "[--glow-fill:rgba(0,0,0,0.04)] [--glow-ring:rgba(0,0,0,0.5)]",
        "dark:[--glow-fill:rgba(255,255,255,0.08)] dark:[--glow-ring:rgba(255,255,255,0.18)]",
      ].join(" ")}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-normal text-neutral-800 dark:text-white/90">
          {title}
        </h2>
        <div className="flex gap-5">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="text-neutral-500 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="text-neutral-500 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"
          >
            ▼
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[13px] text-neutral-700 dark:text-white/90">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${view.y}-${view.m}`}
          initial={{ opacity: 0, y: dir * 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: dir * -16 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <div ref={gridRef} className="grid grid-cols-7 gap-[2px]">
            {cells.map(({ date, outside }) => {
              const isToday = sameDay(date, today);
              const isSelected = sameDay(date, selected);
              return (
                <motion.button
                  type="button"
                  key={date.toISOString()}
                  onClick={() => pick(date)}
                  // whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={[
                    "group relative grid h-11 place-items-center text-[15px] outline-none",
                    isToday
                      ? "bg-[#0078d7] text-white"
                      : outside
                        ? "text-neutral-400 dark:text-white/40"
                        : "text-neutral-900 dark:text-white",
                  ].join(" ")}
                >
                  {/* soft light under the cursor */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-opacity duration-200"
                    style={{
                      opacity: "var(--o)",
                      background:
                        "radial-gradient(70px circle at var(--x) var(--y), var(--glow-fill), transparent 100%)",
                    }}
                  />
                  {/* bright border reveal */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-opacity duration-200"
                    style={{
                      ...ringMask,
                      opacity: "var(--o)",
                      background:
                        "radial-gradient(60px circle at var(--x) var(--y), var(--glow-ring), transparent 100%)",
                    }}
                  />
                  {/* hover border on the cell under the cursor */}
                  <span
                    aria-hidden
                    className={[
                      "pointer-events-none absolute inset-0 border opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                      isToday
                        ? "border-white/70"
                        : "border-neutral-400 dark:border-white/60",
                    ].join(" ")}
                  />
                  {/* selected ring */}
                  {isSelected && (
                    <motion.span
                      // layoutId="selected-ring"
                      className="pointer-events-none absolute inset-0 border-2 border-neutral-900 dark:border-white"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{date.getDate()}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}