'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

const WEEKDAYS = [
  ['Su', 'Sunday'],
  ['Mo', 'Monday'],
  ['Tu', 'Tuesday'],
  ['We', 'Wednesday'],
  ['Th', 'Thursday'],
  ['Fr', 'Friday'],
  ['Sa', 'Saturday'],
] as const

const ease = [0.23, 1, 0.32, 1] as const

interface CalendarDay {
  date: Date
  outside: boolean
}

interface ViewState {
  y: number
  m: number
}

export interface RevealCalendarProps {
  /** Date selected on first render. Defaults to today. */
  initialDate?: Date
  /** Called whenever the user picks a date. */
  onSelect?: (date: Date) => void
}

// Build 42 cells (6 weeks) starting from the Sunday on/before the 1st
function buildMonth(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, 1 - first.getDay() + i)
    return { date: d, outside: d.getMonth() !== month }
  })
}

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth()
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

// Same day of the neighbouring month, clamped so the 31st can't spill over
function addMonths(d: Date, n: number) {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate()
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last))
}

const longDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

// Border-only mask: the gradient is clipped to a 1px ring around the cell
const ringMask: CSSProperties = {
  padding: 1,
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
}

// The month slides the way you paged. `custom` reaches the outgoing grid
// too, so it leaves in the new direction rather than the one it arrived by.
const monthVariants = {
  enter: (dir: number) => ({ opacity: 0, y: dir * 16 }),
  shown: { opacity: 1, y: 0 },
  exit: (dir: number) => ({ opacity: 0, y: dir * -16 }),
}

const ICON_BUTTON =
  'grid h-8 w-8 touch-manipulation place-items-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.94] motion-reduce:transition-none [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground'

export default function RevealCalendar({ initialDate, onSelect }: RevealCalendarProps) {
  // "Today" is only known on the client: the server's clock sits in another
  // time zone, and a mismatched highlight would survive hydration.
  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => setToday(new Date()), [])

  if (!today) return <div className='h-[404px] w-full max-w-[340px]' />
  return <Calendar today={today} initialDate={initialDate} onSelect={onSelect} />
}

function Calendar({
  today,
  initialDate,
  onSelect,
}: RevealCalendarProps & { today: Date }) {
  const start = initialDate ?? today
  const [view, setView] = useState<ViewState>({
    y: start.getFullYear(),
    m: start.getMonth(),
  })
  const [selected, setSelected] = useState(start)
  // The one day in the tab order; arrow keys move it
  const [focusDate, setFocusDate] = useState(start)
  // Bumped only when a month change should slide. The grid is keyed on it,
  // so any other change swaps the days in place.
  const [slide, setSlide] = useState({ id: 0, dir: 1 })
  const reduceMotion = useReducedMotion()
  const ringId = useId()

  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const pendingFocus = useRef(false)
  const frame = useRef(0)

  const cells = useMemo(() => buildMonth(view.y, view.m), [view])
  const title = new Date(view.y, view.m).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const viewIndex = view.y * 12 + view.m
  const awayFromToday = viewIndex !== monthIndex(today)

  // Show the month `date` is in. Keyboard moves skip the slide: the old grid
  // would take focus with it on the way out, and an arrow key held down
  // shouldn't wait on an animation at every month edge.
  function showMonthOf(date: Date, instant = false) {
    const delta = monthIndex(date) - viewIndex
    if (delta === 0) return false
    if (!instant && !reduceMotion) {
      setSlide((s) => ({ id: s.id + 1, dir: delta > 0 ? 1 : -1 }))
    }
    setView({ y: date.getFullYear(), m: date.getMonth() })
    return true
  }

  function page(delta: 1 | -1) {
    const next = new Date(view.y, view.m + delta, 1)
    showMonthOf(next)
    // Keep a tab stop in the visible month
    setFocusDate(
      monthIndex(selected) === monthIndex(next) ? selected
      : monthIndex(today) === monthIndex(next) ? today
      : next,
    )
  }

  function pick(date: Date) {
    setSelected(date)
    setFocusDate(date)
    showMonthOf(date)
    onSelect?.(date)
  }

  function goToToday() {
    setFocusDate(today)
    showMonthOf(today)
  }

  const focusCell = (date: Date) =>
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${dayKey(date)}"]`)
      ?.focus()

  function onGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const from = focusDate
    const next =
      e.key === 'ArrowLeft' ? addDays(from, -1)
      : e.key === 'ArrowRight' ? addDays(from, 1)
      : e.key === 'ArrowUp' ? addDays(from, -7)
      : e.key === 'ArrowDown' ? addDays(from, 7)
      : e.key === 'Home' ? addDays(from, -from.getDay())
      : e.key === 'End' ? addDays(from, 6 - from.getDay())
      : e.key === 'PageUp' ? addMonths(from, -1)
      : e.key === 'PageDown' ? addMonths(from, 1)
      : null
    if (!next) return
    e.preventDefault()
    setFocusDate(next)
    // A new month's cells don't exist until the next render
    if (showMonthOf(next, true)) pendingFocus.current = true
    else focusCell(next)
  }

  useLayoutEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    focusCell(focusDate)
  })

  // Reveal effect: one listener on the card writes the cursor position,
  // relative to each cell, into --x/--y. --o lives on the card, so the glow
  // fades in as the cursor enters and survives month changes.
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    // A finger has no hover, and the glow would stick where it last tapped
    if (e.pointerType === 'touch') return
    const { clientX, clientY } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const root = rootRef.current
      const grid = gridRef.current
      if (!root || !grid) return
      root.style.setProperty('--o', '1')
      // Read every box first, then write: interleaving the two would
      // force a layout per cell
      const cellEls = Array.from(grid.children) as HTMLElement[]
      const rects = cellEls.map((el) => el.getBoundingClientRect())
      cellEls.forEach((el, i) => {
        el.style.setProperty('--x', `${clientX - rects[i].left}px`)
        el.style.setProperty('--y', `${clientY - rects[i].top}px`)
      })
    })
  }

  function onPointerLeave() {
    cancelAnimationFrame(frame.current)
    rootRef.current?.style.setProperty('--o', '0')
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={[
        'w-full max-w-[340px] select-none rounded-xl border bg-background p-4 text-foreground shadow-sm [--o:0] sm:p-5',
        // glow colours read by the hover layers
        '[--glow-fill:rgba(0,0,0,0.05)] [--glow-ring:rgba(0,0,0,0.45)]',
        'dark:[--glow-fill:rgba(255,255,255,0.08)] dark:[--glow-ring:rgba(255,255,255,0.3)]',
      ].join(' ')}>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <div aria-live='polite' className='pl-1.5 text-[15px] font-medium'>
          {title}
        </div>
        <div className='flex items-center gap-0.5'>
          {/* Only there once you've paged away, as the way back */}
          <button
            type='button'
            onClick={goToToday}
            tabIndex={awayFromToday ? 0 : -1}
            aria-hidden={!awayFromToday}
            className={[
              'mr-1 h-8 touch-manipulation rounded-md px-2 text-xs text-muted-foreground transition-[color,opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none [@media(hover:hover)]:hover:text-foreground',
              awayFromToday ? 'opacity-100' : 'pointer-events-none opacity-0',
            ].join(' ')}>
            Today
          </button>
          <button
            type='button'
            onClick={() => page(-1)}
            aria-label='Previous month'
            className={ICON_BUTTON}>
            <ChevronUp aria-hidden className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={() => page(1)}
            aria-label='Next month'
            className={ICON_BUTTON}>
            <ChevronDown aria-hidden className='h-4 w-4' />
          </button>
        </div>
      </div>

      <div className='mb-1 grid grid-cols-7 text-center text-xs text-muted-foreground'>
        {WEEKDAYS.map(([short, long]) => (
          <abbr key={short} title={long} className='py-2 no-underline'>
            {short}
          </abbr>
        ))}
      </div>

      {/* Clipped, so the month slides in from behind the weekday row */}
      <div className='-m-1 overflow-hidden p-1'>
        <AnimatePresence mode='wait' initial={false} custom={slide.dir}>
          <motion.div
            key={slide.id}
            custom={slide.dir}
            variants={monthVariants}
            initial='enter'
            animate='shown'
            exit='exit'
            transition={{ duration: 0.15, ease }}>
            <div
              ref={gridRef}
              role='group'
              aria-label={title}
              onKeyDown={onGridKeyDown}
              className='grid grid-cols-7 gap-[2px]'>
              {cells.map(({ date, outside }) => {
                const isToday = sameDay(date, today)
                const isSelected = sameDay(date, selected)
                return (
                  <button
                    type='button'
                    key={dayKey(date)}
                    data-date={dayKey(date)}
                    onClick={() => pick(date)}
                    tabIndex={sameDay(date, focusDate) ? 0 : -1}
                    aria-label={longDate.format(date)}
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    className={[
                      'group relative grid h-10 touch-manipulation place-items-center text-sm tabular-nums outline-none transition-colors duration-150 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-11 sm:text-[15px]',
                      isSelected ? 'text-background'
                      : outside ? 'text-muted-foreground/60'
                      : 'text-foreground',
                    ].join(' ')}>
                    {/* soft light under the cursor */}
                    <span
                      aria-hidden
                      className='pointer-events-none absolute inset-0 transition-opacity duration-200'
                      style={{
                        opacity: 'var(--o)',
                        background:
                          'radial-gradient(70px circle at var(--x) var(--y), var(--glow-fill), transparent 100%)',
                      }}
                    />
                    {/* bright border reveal */}
                    <span
                      aria-hidden
                      className='pointer-events-none absolute inset-0 transition-opacity duration-200'
                      style={{
                        ...ringMask,
                        opacity: 'var(--o)',
                        background:
                          'radial-gradient(60px circle at var(--x) var(--y), var(--glow-ring), transparent 100%)',
                      }}
                    />
                    {/* hover border on the cell under the cursor */}
                    <span
                      aria-hidden
                      className='pointer-events-none absolute inset-0 border border-foreground/40 opacity-0 transition-opacity duration-150 [@media(hover:hover)]:group-hover:opacity-100'
                    />
                    {/* One fill shared by the whole month: it travels to the
                        day you pick rather than blinking off and on */}
                    {isSelected ? (
                      <motion.span
                        aria-hidden
                        layoutId={ringId}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', duration: 0.3, bounce: 0.15 }
                        }
                        className='pointer-events-none absolute inset-0 bg-foreground'
                      />
                    ) : null}
                    <span className='relative'>{date.getDate()}</span>
                    {isToday ? (
                      <span
                        aria-hidden
                        className={[
                          'absolute bottom-1.5 h-1 w-1 rounded-full transition-colors duration-150',
                          isSelected ? 'bg-background' : 'bg-foreground',
                        ].join(' ')}
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
