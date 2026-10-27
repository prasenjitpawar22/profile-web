'use client'

import { cn } from '@/lib/utils'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Cookie,
  Minus,
  MoonStar,
  Plus,
  Search,
  Sun,
  Sunrise,
  X,
  type LucideIcon,
} from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FOODS, MEALS, type Diet, type Food, type Meal } from './foods'

/* ============================================================
   Protein tracker — log Indian meals from a searchable list or
   by hand, then zoom out from a single day to the week, month
   and year. Everything lives in this browser's localStorage.
   ============================================================ */

type Period = 'day' | 'week' | 'month' | 'year'

export type Entry = {
  id: string
  /** Local calendar day, YYYY-MM-DD */
  date: string
  meal: Meal
  name: string
  serving?: string
  servings: number
  /** Grams for the whole entry, servings already applied */
  protein: number
  diet?: Diet
}

export type Store = { goal: number; entries: Entry[] }

/** Keeps the log somewhere other than localStorage. The tracker renders
    whatever subscribe hands it and calls the rest when someone edits */
export type ProteinSync = {
  subscribe: (onChange: (store: Store) => void) => () => void
  add: (entries: Entry[]) => void
  remove: (id: string) => void
  setGoal: (goal: number) => void
}

const STORAGE_KEY = 'protein-tracker:v3'
const DEFAULT_GOAL = 100

const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
]

/* Each meal reads as a time of day: sunrise, midday sun, night, and a snack in between */
const MEAL_STYLE: Record<Meal, { Icon: LucideIcon; tile: string; text: string; bar: string }> = {
  breakfast: {
    Icon: Sunrise,
    tile: 'bg-amber-500/15 dark:bg-amber-400/15',
    text: 'text-amber-600 dark:text-amber-300',
    bar: 'bg-amber-400',
  },
  lunch: {
    Icon: Sun,
    tile: 'bg-orange-500/15 dark:bg-orange-400/15',
    text: 'text-orange-600 dark:text-orange-300',
    bar: 'bg-orange-500',
  },
  dinner: {
    Icon: MoonStar,
    tile: 'bg-indigo-500/15 dark:bg-indigo-400/15',
    text: 'text-indigo-600 dark:text-indigo-300',
    bar: 'bg-indigo-500 dark:bg-indigo-400',
  },
  snacks: {
    Icon: Cookie,
    tile: 'bg-rose-500/15 dark:bg-rose-400/15',
    text: 'text-rose-600 dark:text-rose-300',
    bar: 'bg-rose-400',
  },
}

const ease = [0.23, 1, 0.32, 1] as const
const easeDrawer = [0.32, 0.72, 0, 1] as const

/* ---------- dates, always local, never UTC ---------- */

const pad = (n: number) => String(n).padStart(2, '0')
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))
const sameDay = (a: Date, b: Date) => toKey(a) === toKey(b)

function shift(d: Date, period: Period, dir: 1 | -1) {
  if (period === 'day') return addDays(d, dir)
  if (period === 'week') return addDays(d, dir * 7)
  if (period === 'month') return new Date(d.getFullYear(), d.getMonth() + dir, 1)
  return new Date(d.getFullYear() + dir, 0, 1)
}

function periodStart(d: Date, period: Period) {
  if (period === 'day') return d
  if (period === 'week') return startOfWeek(d)
  if (period === 'month') return new Date(d.getFullYear(), d.getMonth(), 1)
  return new Date(d.getFullYear(), 0, 1)
}

function periodLabel(d: Date, period: Period, today: Date) {
  if (period === 'day') {
    if (sameDay(d, today)) return 'Today'
    if (sameDay(d, addDays(today, -1))) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  if (period === 'week') {
    const s = startOfWeek(d)
    const e = addDays(s, 6)
    const sameMonth = s.getMonth() === e.getMonth()
    const left = s.toLocaleDateString('en-IN', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })
    return `${left} – ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
  }
  if (period === 'month') return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  return String(d.getFullYear())
}

const fmt = (n: number) => {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

/** "1 roti" × 2 reads as "2 roti"; anything else, like "2 eggs" × 1.5, keeps the multiplier */
export function servingLabel(serving: string, servings: number) {
  if (servings === 1) return serving
  const single = serving.match(/^1 ([^,\d]+)$/)
  return single ? `${fmt(servings)} ${single[1]}` : `${fmt(servings)} × ${serving}`
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/* ---------- dummy history, so every view has a shape on first visit ---------- */

function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sampleHistory(today: Date): Entry[] {
  const rand = seeded(42)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const byMeal = (m: Meal) => FOODS.filter((f) => f.meals.includes(m) && f.id !== 'roti' && f.id !== 'rice')
  const entry = (date: string, meal: Meal, food: Food, servings = 1): Entry => ({
    id: uid(), date, meal, name: food.name, serving: food.serving, servings,
    protein: food.protein * servings, diet: food.diet,
  })
  const food = (id: string) => FOODS.find((f) => f.id === id)!
  const roti = food('roti')
  const whey = food('whey')
  const milk = food('milk')

  // Today is a day in progress: breakfast, lunch and a snack in, dinner still to come
  const t = toKey(today)
  const out: Entry[] = [
    entry(t, 'breakfast', food('moong-chilla')),
    entry(t, 'breakfast', milk),
    entry(t, 'lunch', roti, 2),
    entry(t, 'lunch', food('palak-paneer')),
    entry(t, 'lunch', food('dal-tadka')),
    entry(t, 'snacks', food('roasted-chana')),
  ]

  // Every day back to 1 January last year, so this year and last year are both full
  const first = new Date(today.getFullYear() - 1, 0, 1)
  const span = Math.round((today.getTime() - first.getTime()) / 86_400_000)

  for (let i = 1; i <= span; i++) {
    const date = toKey(addDays(today, -i))
    // Habits improve over time: older days lean lighter, recent days hit the goal more
    const progress = 1 - i / span
    out.push(entry(date, 'breakfast', pick(byMeal('breakfast'))))
    if (rand() < 0.35 + progress * 0.3) out.push(entry(date, 'breakfast', milk))
    out.push(entry(date, 'lunch', roti, 2 + Math.floor(rand() * 2)))
    out.push(entry(date, 'lunch', pick(byMeal('lunch'))))
    out.push(entry(date, 'dinner', pick(byMeal('dinner'))))
    if (rand() < 0.5) out.push(entry(date, 'dinner', roti, 2))
    if (rand() < 0.6) out.push(entry(date, 'snacks', pick(byMeal('snacks'))))
    if (rand() < 0.3 + progress * 0.5) out.push(entry(date, 'snacks', whey))
  }
  return out
}

/* ---------- the component ---------- */

const startOfToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/* 'card' is the boxed demo on the Craft page; 'page' fills the screen, with a
   sticky header and a sheet pinned to the viewport, for real daily logging */
type Variant = 'card' | 'page'

export function ProteinTracker({
  variant = 'card',
  storageKey = STORAGE_KEY,
  sample = true,
  sync,
}: {
  variant?: Variant
  storageKey?: string
  /** Seed a first visit with dummy history, so the demo has a shape */
  sample?: boolean
  /** Store the log here instead of this browser's localStorage */
  sync?: ProteinSync
} = {}) {
  const reduceMotion = useReducedMotion() ?? false
  const page = variant === 'page'

  // Dates and storage only exist in the browser, so nothing renders until mount
  const [today, setToday] = useState<Date | null>(null)
  const [store, setStore] = useState<Store>({ goal: DEFAULT_GOAL, entries: [] })
  const [period, setPeriod] = useState<Period>('day')
  const [cursor, setCursor] = useState<Date | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [sheet, setSheet] = useState<{ meal: Meal } | null>(null)
  const todayRef = useRef<Date | null>(null)
  todayRef.current = today

  useEffect(() => {
    const t = startOfToday()
    setToday(t)
    setCursor(t)
    if (sync) return sync.subscribe(setStore)
    let saved: Store | null = null
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) saved = JSON.parse(raw)
    } catch {}
    setStore(saved ?? { goal: DEFAULT_GOAL, entries: sample ? sampleHistory(t) : [] })
  }, [storageKey, sample, sync])

  // A phone keeps the tab alive for days: when it comes back after midnight,
  // roll today forward, and follow it if the view was sitting on the old today
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const prev = todayRef.current
      const t = startOfToday()
      if (!prev || sameDay(prev, t)) return
      setToday(t)
      setCursor((c) => (c && sameDay(c, prev) ? t : c))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (!today || sync) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(store))
    } catch {}
  }, [store, today, storageKey, sync])

  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of store.entries) map.set(e.date, (map.get(e.date) ?? 0) + e.protein)
    return map
  }, [store.entries])

  const meals = useMemo(() => {
    const map = new Map<string, MealTotals>()
    for (const e of store.entries) {
      let day = map.get(e.date)
      if (!day) map.set(e.date, (day = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 }))
      day[e.meal] += e.protein
    }
    return map
  }, [store.entries])

  if (!today || !cursor) return <div className={page ? 'flex-1' : 'h-[600px] w-full max-w-[520px]'} />

  const canGoNext = shift(cursor, period, 1) <= today
  const atToday = periodStart(cursor, period).getTime() === periodStart(today, period).getTime()

  function go(dir: 1 | -1) {
    setDirection(dir)
    setCursor((c) => (c ? shift(c, period, dir) : c))
  }

  function zoomTo(p: Period, d: Date) {
    setDirection(1)
    setPeriod(p)
    setCursor(d > today! ? today : d)
  }

  function addEntries(es: Omit<Entry, 'id' | 'date'>[]) {
    const date = toKey(cursor!)
    const added = es.map((e) => ({ ...e, id: uid(), date }))
    // Show it straight away; a synced store confirms it on its next snapshot
    setStore((s) => ({ ...s, entries: [...s.entries, ...added] }))
    sync?.add(added)
  }

  function removeEntry(id: string) {
    setStore((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }))
    sync?.remove(id)
  }

  function setGoal(goal: number) {
    setStore((s) => ({ ...s, goal }))
    sync?.setGoal(goal)
  }

  const dayKey = toKey(cursor)
  const viewKey = `${period}-${toKey(periodStart(cursor, period))}`

  return (
    <div
      className={cn(
        'relative w-full',
        page
          ? 'mx-auto flex max-w-[560px] flex-1 flex-col'
          : 'max-w-[520px] overflow-hidden rounded-2xl border bg-background shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_8px_24px_-12px_hsl(var(--foreground)/0.12)]',
      )}
    >
      <div
        className={cn(
          'flex flex-col',
          page ? 'flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+32px)] sm:px-5' : 'min-h-[600px] p-4 sm:p-5',
        )}
      >
        {/* Period switch + date navigation. On a phone the tabs take their own
            full-width row; on the full page the header also sticks under the notch */}
        <div
          className={cn(
            'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3',
            page &&
              'sticky top-0 z-[5] -mx-4 bg-background/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-md sm:-mx-5 sm:px-5 sm:pt-8',
          )}
        >
          <PeriodTabs value={period} onChange={(p) => zoomTo(p, cursor)} />

          <div className='flex items-center gap-1'>
            {!atToday && (
              <button
                onClick={() => zoomTo(period, today)}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:py-2',
                  'order-last ml-1 max-sm:-mr-2 sm:order-none sm:ml-0 sm:mr-1',
                )}
              >
                Today
              </button>
            )}
            <IconButton label='Previous' onClick={() => go(-1)}>
              <ChevronLeft className='h-4 w-4' />
            </IconButton>
            <span className='min-w-[104px] text-center text-sm font-medium tabular-nums max-sm:flex-1'>
              {periodLabel(cursor, period, today)}
            </span>
            <IconButton label='Next' onClick={() => go(1)} disabled={!canGoNext}>
              <ChevronRight className='h-4 w-4' />
            </IconButton>
          </div>
        </div>

        <div className={cn('relative flex flex-1 flex-col', page ? 'mt-2' : 'mt-5')}>
          <AnimatePresence mode='wait' initial={false} custom={direction}>
            <motion.div
              key={viewKey}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, transform: `translateX(${reduceMotion ? 0 : d * 12}px)`, filter: 'blur(2px)' }),
                center: { opacity: 1, transform: 'translateX(0px)', filter: 'blur(0px)' },
                exit: (d: number) => ({ opacity: 0, transform: `translateX(${reduceMotion ? 0 : d * -12}px)`, filter: 'blur(2px)' }),
              }}
              initial='enter'
              animate='center'
              exit='exit'
              transition={{ duration: 0.16, ease }}
              className='flex flex-1 flex-col'
            >
              {period === 'day' && (
                <DayView
                  stackBelow={page ? 360 : 480}
                  entries={store.entries.filter((e) => e.date === dayKey)}
                  goal={store.goal}
                  onGoal={setGoal}
                  onRemove={removeEntry}
                  onAdd={(meal) => setSheet({ meal })}
                />
              )}
              {period === 'week' && (
                <WeekView cursor={cursor} today={today} totals={totals} meals={meals} goal={store.goal} onPick={(d) => zoomTo('day', d)} />
              )}
              {period === 'month' && (
                <MonthView cursor={cursor} today={today} totals={totals} meals={meals} goal={store.goal} onPick={(d) => zoomTo('day', d)} />
              )}
              {period === 'year' && (
                <YearView cursor={cursor} today={today} totals={totals} meals={meals} goal={store.goal} onPick={(d) => zoomTo('month', d)} onDay={(d) => zoomTo('day', d)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AddSheet
        variant={variant}
        open={sheet !== null}
        meal={sheet?.meal ?? 'breakfast'}
        dayLabel={periodLabel(cursor, 'day', today)}
        onClose={() => setSheet(null)}
        onAdd={(es) => {
          addEntries(es)
          setSheet(null)
        }}
      />
    </div>
  )
}

/* ---------- period tabs ---------- */

/* The tab list is drawn twice. Underneath: muted labels, the real buttons.
   On top: an inert copy in the active style (pill background, full-contrast
   text), clipped to the active tab. Moving the clip slides the pill, and any
   label it passes over turns active exactly where the pill covers it, instead
   of being hidden under it or snapping colour when it lands. */
function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const reduceMotion = useReducedMotion() ?? false
  const list = useRef<HTMLDivElement>(null)
  const tabs = useRef<Partial<Record<Period, HTMLButtonElement | null>>>({})
  const [clip, setClip] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const measure = () => {
      const box = list.current
      const tab = tabs.current[value]
      if (!box || !tab) return
      const right = box.offsetWidth - tab.offsetLeft - tab.offsetWidth
      const bottom = box.offsetHeight - tab.offsetTop - tab.offsetHeight
      setClip(`inset(${tab.offsetTop}px ${right}px ${bottom}px ${tab.offsetLeft}px round 6px)`)
    }
    measure()
    // Labels change width when the web font arrives; keep the clip on the tab
    const ro = new ResizeObserver(measure)
    if (list.current) ro.observe(list.current)
    return () => ro.disconnect()
  }, [value])

  // Place the clip without animating, then let later changes transition
  useEffect(() => {
    if (clip && !ready) requestAnimationFrame(() => setReady(true))
  }, [clip, ready])

  const tabClass =
    'rounded-md px-2.5 py-1 text-center text-[13px] font-medium max-sm:flex-1 max-sm:px-1.5 [@media(pointer:coarse)]:py-1.5'

  return (
    <div ref={list} role='tablist' aria-label='Range' className='relative flex rounded-lg bg-muted p-0.5'>
      {PERIODS.map((p) => (
        <button
          key={p.id}
          ref={(el) => {
            tabs.current[p.id] = el
          }}
          role='tab'
          aria-selected={value === p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            tabClass,
            'text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {p.label}
        </button>
      ))}

      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 flex rounded-lg bg-background p-0.5'
        style={{
          clipPath: clip ?? 'inset(50%)',
          transition: ready && !reduceMotion ? 'clip-path 260ms cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
        }}
      >
        {PERIODS.map((p) => (
          <span key={p.id} className={cn(tabClass, 'text-foreground')}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- day ---------- */

function DayView({
  stackBelow,
  entries,
  goal,
  onGoal,
  onRemove,
  onAdd,
}: {
  /** Viewport width under which the ring sits above the numbers instead of beside them */
  stackBelow: 360 | 480
  entries: Entry[]
  goal: number
  onGoal: (g: number) => void
  onRemove: (id: string) => void
  onAdd: (meal: Meal) => void
}) {
  const total = entries.reduce((s, e) => s + e.protein, 0)
  const left = goal - total
  const byMeal = MEALS.map((m) => {
    const list = entries.filter((e) => e.meal === m.id)
    return { ...m, list, total: list.reduce((s, e) => s + e.protein, 0) }
  })

  return (
    <div className='flex flex-1 flex-col'>
      <div
        className={cn(
          'flex items-center gap-5',
          // Full class names, so Tailwind sees both variants
          stackBelow === 360 ? 'max-[359px]:flex-col max-[359px]:items-stretch' : 'max-[479px]:flex-col max-[479px]:items-stretch',
        )}
      >
        <div className='shrink-0 self-center'>
          <Ring value={total} goal={goal} />
        </div>

        <div className='min-w-0 flex-1'>
          <p className='text-sm text-muted-foreground'>
            {left > 0 ? (
              <>
                <span className='font-medium tabular-nums text-foreground'>{fmt(left)}g</span> to go
              </>
            ) : (
              <span className='inline-flex items-center gap-1 font-medium text-grass'>
                <Check className='h-3.5 w-3.5' strokeWidth={2.5} />
                Goal reached{left < 0 && <span className='font-normal tabular-nums text-muted-foreground'>, {fmt(-left)}g over</span>}
              </span>
            )}
          </p>

          {/* Where the day's protein came from */}
          <div className='mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted'>
            {byMeal.map((m) =>
              m.total > 0 ? (
                <div
                  key={m.id}
                  style={{ width: `${(m.total / Math.max(total, goal)) * 100}%` }}
                  className={cn('h-full transition-[width] duration-500 [&+&]:ml-px', MEAL_STYLE[m.id].bar)}
                />
              ) : null,
            )}
          </div>
          <dl className='mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-4 sm:gap-1'>
            {byMeal.map((m) => (
              <div key={m.id} className='min-w-0'>
                <dt className='flex items-center gap-1 truncate text-[11px] text-muted-foreground'>
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', MEAL_STYLE[m.id].bar)} />
                  {m.label}
                </dt>
                <dd className='text-sm font-medium tabular-nums'>{fmt(m.total)}g</dd>
              </div>
            ))}
          </dl>

          <GoalEditor goal={goal} onGoal={onGoal} />
        </div>
      </div> 

      <div className='mt-5 flex flex-col gap-3'>
        {byMeal.map((m) => (
          <section key={m.id} className='rounded-xl border bg-muted/30 px-3 py-2'>
            <div className='flex items-center justify-between'>
              <h3 className='flex items-center gap-2 text-[13px] font-medium'>
                <MealIcon meal={m.id} />
                {m.label}
                {m.total > 0 && <span className='-ml-0.5 font-normal tabular-nums text-muted-foreground'>{fmt(m.total)}g</span>}
              </h3>
              <button
                onClick={() => onAdd(m.id)}
                aria-label={`Add to ${m.label}`}
                className='-mr-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium [@media(pointer:coarse)]:-my-1 [@media(pointer:coarse)]:px-2.5 [@media(pointer:coarse)]:py-2 text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <Plus className='h-3.5 w-3.5' />
                Add
              </button>
            </div>
            <ul>
              <AnimatePresence initial={false}>
                {m.list.map((e) => (
                  <motion.li
                    key={e.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease }}
                    className='overflow-hidden'
                  >
                    <div className='group flex items-center gap-2 py-1.5 text-sm'>
                      <DietMark diet={e.diet} />
                      <span className='min-w-0 flex-1 truncate'>
                        {e.name}
                        {e.serving && (
                          <span className='ml-1.5 text-xs text-muted-foreground'>
                            {servingLabel(e.serving, e.servings)}
                          </span>
                        )}
                      </span>
                      <span className='tabular-nums text-muted-foreground'>{fmt(e.protein)}g</span>
                      <button
                        onClick={() => onRemove(e.id)}
                        aria-label={`Remove ${e.name}`}
                        className='-mr-1 rounded p-0.5 text-muted-foreground opacity-0 transition-[opacity,color] duration-150 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 [@media(hover:none)]:opacity-100 [@media(pointer:coarse)]:-my-1 [@media(pointer:coarse)]:-mr-2 [@media(pointer:coarse)]:p-2'
                      >
                        <X className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function Ring({ value, goal }: { value: number; goal: number }) {
  const reduceMotion = useReducedMotion() ?? false
  const pct = Math.min(value / goal, 1)
  const R = 52
  const C = 2 * Math.PI * R
  const hit = value >= goal

  return (
    <div className='relative h-[128px] w-[128px] shrink-0'>
      <svg viewBox='0 0 128 128' className='h-full w-full -rotate-90'>
        <circle cx={64} cy={64} r={R} fill='none' strokeWidth={10} className='stroke-muted' />
        <motion.circle
          cx={64}
          cy={64}
          r={R}
          fill='none'
          strokeWidth={10}
          strokeLinecap='round'
          strokeDasharray={C}
          className='stroke-grass'
          initial={false}
          animate={{ strokeDashoffset: C * (1 - pct), opacity: value > 0 ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease }}
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className='text-[28px] font-semibold leading-none tracking-tight tabular-nums'>
          <AnimatedNumber value={value} />
          <span className='ml-0.5 text-base font-medium text-muted-foreground'>g</span>
        </span>
        <span className={cn('mt-1 text-[11px] transition-colors duration-300', hit ? 'text-grass' : 'text-muted-foreground')}>
          protein
        </span>
      </div>
    </div>
  )
}

function AnimatedNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion() ?? false
  // Critically damped: it rolls to the number and stops, no overshoot
  const spring = useSpring(value, { stiffness: 170, damping: 28 })
  const display = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    if (reduceMotion) spring.jump(value)
    else spring.set(value)
  }, [value, reduceMotion, spring])

  return <motion.span>{display}</motion.span>
}

function GoalEditor({ goal, onGoal }: { goal: number; onGoal: (g: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(goal))
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) input.current?.select()
  }, [editing])

  function commit() {
    const n = Math.round(Number(draft))
    if (n >= 10 && n <= 400) onGoal(n)
    else setDraft(String(goal))
    setEditing(false)
  }

  return (
    <div className='mt-2 flex h-6 items-center whitespace-nowrap text-xs text-muted-foreground'>
      Daily goal
      {editing ? (
        <span className='ml-1.5 inline-flex items-center'>
          <input
            ref={input}
            value={draft}
            inputMode='numeric'
            aria-label='Daily goal in grams'
            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(String(goal))
                setEditing(false)
              }
            }}
            className='w-12 rounded border bg-background px-1 py-0.5 text-base font-medium tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring sm:w-10 sm:text-[13px]'
          />
          <span className='ml-0.5'>g</span>
        </span>
      ) : (
        <button
          onClick={() => {
            setDraft(String(goal))
            setEditing(true)
          }}
          className='ml-1.5 rounded px-1 py-0.5 font-medium tabular-nums text-foreground underline decoration-dashed decoration-border underline-offset-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          {goal}g
        </button>
      )}
    </div>
  )
}

/* ---------- week / month / year ---------- */

type RangeProps = {
  cursor: Date
  today: Date
  totals: Map<string, number>
  meals: Map<string, MealTotals>
  goal: number
  onPick: (d: Date) => void
}

function summarise(days: Date[], totals: Map<string, number>, goal: number) {
  const values = days.map((d) => totals.get(toKey(d)) ?? 0)
  const logged = values.filter((v) => v > 0)
  const total = logged.reduce((s, v) => s + v, 0)
  return {
    total,
    avg: logged.length ? total / logged.length : 0,
    hits: values.filter((v) => v >= goal).length,
    logged: logged.length,
  }
}

type StatItem = { label: string; value: string; hint: string }

function Stats({ s, goal, last }: { s: ReturnType<typeof summarise>; goal: number; last?: StatItem }) {
  const items: StatItem[] = [
    { label: 'Daily average', value: `${fmt(Math.round(s.avg))}g`, hint: s.avg >= goal ? 'on target' : `goal ${goal}g` },
    { label: 'Goal hit', value: `${s.hits}`, hint: `of ${s.logged} logged ${s.logged === 1 ? 'day' : 'days'}` },
    last ?? { label: 'Total', value: s.total >= 1000 ? `${fmt(s.total / 1000)}kg` : `${fmt(Math.round(s.total))}g`, hint: 'protein' },
  ]
  return (
    <dl className='grid grid-cols-3 gap-2'>
      {items.map((it) => (
        <div key={it.label} className='rounded-xl border bg-muted/30 px-3 py-2.5'>
          <dt className='text-[11px] text-muted-foreground'>{it.label}</dt>
          <dd className='mt-0.5 text-lg font-semibold leading-tight tracking-tight tabular-nums'>{it.value}</dd>
          <dd className='text-[11px] text-muted-foreground'>{it.hint}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ---------- day tooltip ---------- */

type MealTotals = Record<Meal, number>
type TipState = { date: Date; x: number; top: number; bottom: number; width: number }

const TIP_W = 176

/* One tooltip per chart that follows the pointer from cell to cell. The first
   one waits a beat so a pointer passing through doesn't flash it; after that,
   neighbours open instantly, so scanning a row of days feels immediate. */
function useDayTip() {
  const box = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<TipState | null>(null)
  const warm = useRef(false)
  const openTimer = useRef<number>()
  const hideTimer = useRef<number>()
  const coolTimer = useRef<number>()

  useEffect(
    () => () => [openTimer, hideTimer, coolTimer].forEach((t) => clearTimeout(t.current)),
    [],
  )

  function show(date: Date, el: HTMLElement) {
    if (!box.current) return
    const b = box.current.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const next = { date, x: r.left + r.width / 2 - b.left, top: r.top - b.top, bottom: r.bottom - b.top, width: b.width }
    ;[openTimer, hideTimer, coolTimer].forEach((t) => clearTimeout(t.current))
    if (warm.current) return setTip(next)
    openTimer.current = window.setTimeout(() => {
      warm.current = true
      setTip(next)
    }, 250)
  }

  function hide() {
    clearTimeout(openTimer.current)
    // A short grace period, so the gap between two cells doesn't blink the tooltip
    hideTimer.current = window.setTimeout(() => setTip(null), 80)
    coolTimer.current = window.setTimeout(() => (warm.current = false), 400)
  }

  const bind = (date: Date) => ({
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => e.pointerType === 'mouse' && show(date, e.currentTarget),
    onPointerLeave: hide,
  })

  return { box, tip, bind }
}

function DayTip({
  tip,
  totals,
  meals,
  goal,
}: {
  tip: TipState | null
  totals: Map<string, number>
  meals: Map<string, MealTotals>
  goal: number
}) {
  const reduceMotion = useReducedMotion() ?? false
  // Leaving is instant; only the first appearance animates, moving between days just jumps
  if (!tip) return null

  const key = toKey(tip.date)
  const total = totals.get(key) ?? 0
  const split = meals.get(key)
  const left = Math.min(Math.max(tip.x - TIP_W / 2, 0), tip.width - TIP_W)
  // Sit above the cell, unless that would run off the top of the chart
  const below = tip.top < 104
  const hit = total >= goal

  return (
    <div
      className='pointer-events-none absolute z-30'
      style={{
        left,
        top: below ? tip.bottom + 8 : tip.top - 8,
        width: TIP_W,
        transform: below ? undefined : 'translateY(-100%)',
      }}
    >
      <motion.div
        key='tip'
        initial={{ opacity: 0, transform: reduceMotion ? 'none' : 'scale(0.97)' }}
        animate={{ opacity: 1, transform: 'scale(1)' }}
        transition={{ duration: 0.125, ease }}
        style={{ transformOrigin: `${tip.x - left}px ${below ? '0%' : '100%'}` }}
        className='relative rounded-lg border bg-popover p-2.5 text-popover-foreground shadow-[0_8px_24px_-8px_hsl(var(--foreground)/0.25)]'
      >
        {/* Caret pointing at the hovered day */}
        <span
          className={cn(
            'absolute h-2 w-2 rotate-45 border bg-popover',
            below ? '-top-[5px] border-b-0 border-r-0' : '-bottom-[5px] border-l-0 border-t-0',
          )}
          style={{ left: tip.x - left - 4 }}
        />

        <p className='text-[11px] text-muted-foreground'>
          {tip.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        {total === 0 ? (
          <p className='mt-1 text-[13px] font-medium'>Nothing logged</p>
        ) : (
          <>
            <div className='mt-0.5 flex items-baseline justify-between gap-2'>
              <p className='text-[15px] font-semibold tabular-nums tracking-tight'>
                {fmt(Math.round(total))}g
                <span className='ml-1 text-[11px] font-normal text-muted-foreground'>of {goal}g</span>
              </p>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums',
                  hit ? 'text-grass' : 'text-muted-foreground',
                )}
              >
                {hit ? (
                  <>
                    <Check className='h-3 w-3' strokeWidth={2.75} />
                    Goal
                  </>
                ) : (
                  `${fmt(Math.round(goal - total))}g short`
                )}
              </span>
            </div>

            {/* Where it came from, in the same meal colours as the day view */}
            <div className='mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted'>
              {MEALS.map((m) =>
                split && split[m.id] > 0 ? (
                  <div
                    key={m.id}
                    className={cn('h-full [&+&]:ml-px', MEAL_STYLE[m.id].bar)}
                    style={{ width: `${(split[m.id] / Math.max(total, goal)) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className='mt-2 grid grid-cols-4 gap-1'>
              {MEALS.map((m) => {
                const { Icon, text } = MEAL_STYLE[m.id]
                const g = split?.[m.id] ?? 0
                return (
                  <span key={m.id} className={cn('flex items-center gap-0.5 text-[10px] tabular-nums', g === 0 && 'opacity-40')}>
                    <Icon className={cn('h-2.5 w-2.5 shrink-0', text)} strokeWidth={2.5} />
                    {Math.round(g)}
                  </span>
                )
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

const EMPTY_MEALS: MealTotals = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 }

/* A week as seven columns, each stacked by meal in the day view's colours,
   breakfast at the bottom and snacks on top, so a day reads in order. No grey
   tracks behind them: the goal line gives the scale, and days still to come
   are a short dashed stub instead of an empty column. */
function WeekView({ cursor, today, totals, meals, goal, onPick }: RangeProps) {
  const reduceMotion = useReducedMotion() ?? false
  const start = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const elapsed = days.filter((d) => d <= today)
  const { box, tip, bind } = useDayTip()

  const values = days.map((d) => totals.get(toKey(d)) ?? 0)
  const scale = Math.max(goal * 1.2, ...values.map((v) => v * 1.05))

  // The week's protein by meal, for the breakdown underneath
  const logged = elapsed.filter((d) => (totals.get(toKey(d)) ?? 0) > 0)
  const byMeal = MEALS.map((m) => ({
    ...m,
    total: logged.reduce((s, d) => s + (meals.get(toKey(d))?.[m.id] ?? 0), 0),
  }))
  const weekTotal = byMeal.reduce((s, m) => s + m.total, 0)
  const topMeal = weekTotal > 0 ? byMeal.reduce((a, b) => (b.total > a.total ? b : a)) : null

  return (
    <div ref={box} className='relative'>
      <Stats s={summarise(elapsed, totals, goal)} goal={goal} />
      <DayTip tip={tip} totals={totals} meals={meals} goal={goal} />

      <div className='relative mt-6'>
        {/* Goal line, behind the bars */}
        <div className='pointer-events-none absolute inset-x-0 top-0 h-40'>
          <div className='absolute inset-x-0 border-t border-dashed border-grass/50' style={{ bottom: `${(goal / scale) * 100}%` }}>
            <span className='absolute -top-4 right-0 text-[10px] font-medium tabular-nums text-grass'>{goal}g</span>
          </div>
        </div>

        <div className='relative flex h-40 items-end gap-2'>
          {days.map((d, i) => {
            const v = values[i]
            const future = d > today
            const split = meals.get(toKey(d)) ?? EMPTY_MEALS
            const pct = Math.min(v / scale, 1)
            const label = `${d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}: ${fmt(v)}g`

            if (future) {
              return (
                <div key={i} className='flex h-full flex-1 items-end' aria-hidden>
                  <div className='h-1 w-full rounded-full border border-dashed border-muted-foreground/25' />
                </div>
              )
            }

            return (
              <button
                key={i}
                onClick={() => onPick(d)}
                aria-label={label}
                {...bind(d)}
                className='group relative flex h-full flex-1 items-end rounded-md transition-transform duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                {/* Hover column, so the whole day is the target, not just the bar */}
                <span className='absolute inset-x-[-3px] inset-y-0 rounded-md bg-foreground/[0.04] opacity-0 transition-opacity duration-150 group-hover:opacity-100' />

                {v === 0 ? (
                  <div className='relative h-1 w-full rounded-full bg-muted' />
                ) : (
                  /* The stack slides up inside a clipped box, so its rounded top never stretches */
                  <div className='relative w-full overflow-hidden rounded-md' style={{ height: `${pct * 100}%` }}>
                    <motion.div
                      initial={{ transform: reduceMotion ? 'none' : 'translateY(100%)' }}
                      animate={{ transform: 'translateY(0%)' }}
                      transition={{ duration: reduceMotion ? 0 : 0.5, ease, delay: reduceMotion ? 0 : i * 0.04 }}
                      className='flex h-full flex-col-reverse gap-px'
                    >
                      {MEALS.map((m) =>
                        split[m.id] > 0 ? (
                          <div key={m.id} className={MEAL_STYLE[m.id].bar} style={{ flexGrow: split[m.id], flexBasis: 0 }} />
                        ) : null,
                      )}
                    </motion.div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Day labels, grams, and a tick for every day that hit the goal */}
        <div className='mt-2 flex gap-2'>
          {days.map((d, i) => {
            const v = values[i]
            const future = d > today
            return (
              <div key={i} className={cn('flex-1 text-center tabular-nums', future && 'opacity-40')}>
                <span
                  className={cn(
                    'block text-[11px]',
                    sameDay(d, today) ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <span
                  className={cn(
                    'mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium',
                    v >= goal ? 'text-grass' : 'text-foreground/80',
                    (future || v === 0) && 'opacity-0',
                  )}
                >
                  {v >= goal && <Check className='h-2.5 w-2.5' strokeWidth={3} />}
                  {Math.round(v)}g
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Where the week's protein came from */}
      <div className='mt-5 rounded-xl border bg-muted/30 px-3 py-2.5'>
        <div className='flex items-baseline justify-between'>
          <h3 className='text-[13px] font-medium'>This week by meal</h3>
          {topMeal && (
            <span className='text-[11px] text-muted-foreground'>
              Most from <span className='font-medium text-foreground'>{topMeal.label.toLowerCase()}</span>
            </span>
          )}
        </div>
        <ul className='mt-2 flex flex-col gap-2'>
          {byMeal.map((m) => {
            const share = weekTotal > 0 ? m.total / weekTotal : 0
            const avg = logged.length ? m.total / logged.length : 0
            return (
              <li key={m.id} className='grid grid-cols-[auto_64px_minmax(0,1fr)_auto] items-center gap-2.5'>
                <MealIcon meal={m.id} size='sm' />
                <span className='text-xs'>{m.label}</span>
                <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
                  <motion.div
                    initial={{ transform: reduceMotion ? 'none' : 'scaleX(0)' }}
                    animate={{ transform: 'scaleX(1)' }}
                    transition={{ duration: reduceMotion ? 0 : 0.5, ease, delay: reduceMotion ? 0 : 0.1 }}
                    className={cn('h-full origin-left rounded-full', MEAL_STYLE[m.id].bar)}
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
                <span className='w-[92px] text-right text-[11px] tabular-nums text-muted-foreground'>
                  <span className='font-medium text-foreground'>{Math.round(avg)}g</span> a day · {Math.round(share * 100)}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function MonthView({ cursor, today, totals, meals, goal, onPick }: RangeProps) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: count }, (_, i) => addDays(first, i))
  const lead = (first.getDay() + 6) % 7
  const { box, tip, bind } = useDayTip()

  return (
    <div ref={box} className='relative'>
      <Stats s={summarise(days.filter((d) => d <= today), totals, goal)} goal={goal} />
      <DayTip tip={tip} totals={totals} meals={meals} goal={goal} />
      <div className='mt-5 grid grid-cols-7 gap-1.5'>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className='pb-0.5 text-center text-[11px] text-muted-foreground'>
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((d) => {
          const v = totals.get(toKey(d)) ?? 0
          const ratio = Math.min(v / goal, 1)
          const future = d > today
          const strong = ratio >= 0.7
          return (
            <button
              key={toKey(d)}
              disabled={future}
              onClick={() => onPick(d)}
              {...(future ? {} : bind(d))}
              aria-label={`${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}, ${fmt(v)} grams`}
              style={v > 0 ? { backgroundColor: heat(v, goal) } : undefined}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] tabular-nums transition-transform duration-150 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                v === 0 && !future && 'bg-muted',
                future && 'border border-dashed text-muted-foreground/50',
                strong ? 'text-background' : 'text-foreground',
                sameDay(d, today) && 'ring-2 ring-foreground ring-offset-1 ring-offset-background',
              )}
            >
              <span className='leading-none opacity-70'>{d.getDate()}</span>
              {v > 0 && <span className='mt-0.5 hidden text-[10px] font-semibold leading-none sm:block'>{Math.round(v)}</span>}
            </button>
          )
        })}
      </div>
      <HeatLegend />
    </div>
  )
}

/** Longest run of back-to-back days at or over the goal */
function bestStreak(days: Date[], totals: Map<string, number>, goal: number) {
  let best = 0
  let run = 0
  for (const d of days) {
    run = (totals.get(toKey(d)) ?? 0) >= goal ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

const DAY_TICKS = new Set([1, 10, 20, 31])
// Fixed three-letter labels: en-IN shortens September to "Sept", which breaks the column
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* A year as twelve strips: each row a month, each cell a day, shaded like the
   month calendar. Consistency and streaks read at a glance, which twelve
   near-identical average bars never showed. */
function YearView({ cursor, today, totals, meals, goal, onPick, onDay }: RangeProps & { onDay: (d: Date) => void }) {
  const reduceMotion = useReducedMotion() ?? false
  const { box, tip, bind } = useDayTip()
  const year = cursor.getFullYear()
  const months = Array.from({ length: 12 }, (_, m) => {
    const all = Array.from({ length: new Date(year, m + 1, 0).getDate() }, (_, i) => new Date(year, m, i + 1))
    const elapsed = all.filter((d) => d <= today)
    return { m, all, elapsed, s: summarise(elapsed, totals, goal) }
  })
  const allDays = months.flatMap((x) => x.elapsed)
  const streak = bestStreak(allDays, totals, goal)

  const cols = 'grid grid-cols-[26px_minmax(0,1fr)_32px] items-center gap-x-2'
  const days = 'grid grid-cols-[repeat(31,minmax(0,1fr))] gap-px sm:gap-[3px]'

  return (
    <div ref={box} className='relative'>
      <DayTip tip={tip} totals={totals} meals={meals} goal={goal} />
      <Stats
        s={summarise(allDays, totals, goal)}
        goal={goal}
        last={{ label: 'Best streak', value: `${streak}`, hint: streak === 1 ? 'day on goal' : 'days on goal' }}
      />

      <div className='mt-5'>
        {/* Day-of-month ticks */}
        <div className={cn(cols, 'mb-1')}>
          <span />
          <div className={days}>
            {Array.from({ length: 31 }, (_, i) => (
              <span key={i} className='text-center text-[9px] leading-none tabular-nums text-muted-foreground'>
                {DAY_TICKS.has(i + 1) ? i + 1 : ''}
              </span>
            ))}
          </div>
          <span className='text-right text-[9px] leading-none text-muted-foreground'>avg</span>
        </div>

        <div className='flex flex-col gap-px sm:gap-[3px]'>
          {months.map(({ m, all, elapsed, s }, row) => {
            const first = new Date(year, m, 1)
            const started = elapsed.length > 0
            return (
              <motion.div
                key={m}
                initial={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(4px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                transition={{ duration: 0.3, ease, delay: reduceMotion ? 0 : row * 0.025 }}
                className={cols}
              >
                <button
                  onClick={() => onPick(first)}
                  disabled={!started}
                  className={cn(
                    'rounded-sm text-left text-[11px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                    started ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/40',
                  )}
                >
                  {MONTH_SHORT[m]}
                </button>

                <div className={days}>
                  {all.map((d) => {
                    const v = totals.get(toKey(d)) ?? 0
                    const future = d > today
                    return (
                      <div
                        key={d.getDate()}
                        role={future ? undefined : 'button'}
                        tabIndex={-1}
                        onClick={future ? undefined : () => onDay(d)}
                        aria-label={future ? undefined : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}, ${fmt(v)} grams`}
                        {...(future ? {} : bind(d))}
                        style={v > 0 ? { backgroundColor: heat(v, goal) } : undefined}
                        className={cn(
                          'aspect-square rounded-[2px] sm:rounded-[3px]',
                          future ? 'bg-muted/30' : 'cursor-pointer transition-shadow duration-150 hover:ring-1 hover:ring-foreground/70',
                          !future && v === 0 && 'bg-muted',
                          sameDay(d, today) && 'ring-1 ring-foreground',
                        )}
                      />
                    )
                  })}
                </div>

                <span
                  className={cn(
                    'text-right text-[11px] font-medium tabular-nums',
                    !started ? 'text-muted-foreground/40' : s.avg >= goal ? 'text-grass' : 'text-foreground/80',
                  )}
                >
                  {started ? `${Math.round(s.avg)}g` : '–'}
                </span>
              </motion.div>
            )
          })}
        </div>

        <HeatLegend />
      </div>
    </div>
  )
}

/** Shared shading for the month calendar and the year strips: fuller green, closer to goal */
const heat = (v: number, goal: number) => `hsl(var(--grass) / ${0.12 + Math.min(v / goal, 1) * 0.88})`

function HeatLegend() {
  return (
    <div className='mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground'>
      Less
      {[0.12, 0.34, 0.56, 0.78, 1].map((a) => (
        <span key={a} className='h-2.5 w-2.5 rounded-[3px]' style={{ backgroundColor: `hsl(var(--grass) / ${a})` }} />
      ))}
      Goal
    </div>
  )
}

/* ---------- add sheet ---------- */

function AddSheet({
  variant,
  open,
  meal: initialMeal,
  dayLabel,
  onClose,
  onAdd,
}: {
  variant: Variant
  open: boolean
  meal: Meal
  dayLabel: string
  onClose: () => void
  onAdd: (entries: Omit<Entry, 'id' | 'date'>[]) => void
}) {
  const reduceMotion = useReducedMotion() ?? false
  const [mode, setMode] = useState<'list' | 'manual'>('list')
  const [meal, setMeal] = useState<Meal>(initialMeal)
  const [query, setQuery] = useState('')
  const [diet, setDiet] = useState<Diet | 'all'>('all')
  // In the order they were picked, so the tray reads like the plate was built
  const [picked, setPicked] = useState<{ food: Food; servings: number }[]>([])
  const [manual, setManual] = useState({ name: '', protein: '' })
  const search = useRef<HTMLInputElement>(null)

  const pickedTotal = picked.reduce((s, p) => s + p.food.protein * p.servings, 0)
  const isPicked = (id: string) => picked.some((p) => p.food.id === id)

  function toggle(food: Food) {
    setPicked((ps) => (ps.some((p) => p.food.id === food.id) ? ps.filter((p) => p.food.id !== food.id) : [...ps, { food, servings: 1 }]))
  }

  function setServings(id: string, delta: number) {
    setPicked((ps) =>
      ps.map((p) => (p.food.id === id ? { ...p, servings: Math.min(10, Math.max(0.5, p.servings + delta)) } : p)),
    )
  }

  // Fresh sheet every time it opens, pointed at the meal it was opened for
  useEffect(() => {
    if (!open) return
    setMeal(initialMeal)
    setQuery('')
    setPicked([])
    setManual({ name: '', protein: '' })
    // Only grab focus where it won't throw a keyboard over the sheet
    if (window.matchMedia('(pointer: fine)').matches) {
      const t = window.setTimeout(() => search.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open, initialMeal])

  // Pinned to the viewport, the page behind shouldn't scroll under the sheet
  useEffect(() => {
    if (!open || variant !== 'page') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, variant])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FOODS.filter((f) => (diet === 'all' ? true : f.diet === diet))
      .filter((f) => (q ? `${f.name} ${f.aka ?? ''}`.toLowerCase().includes(q) : f.meals.includes(meal)))
      .sort((a, b) => (q ? Number(b.meals.includes(meal)) - Number(a.meals.includes(meal)) : 0))
  }, [query, diet, meal])

  const manualProtein = Number(manual.protein)
  const manualValid = manual.protein !== '' && manualProtein > 0 && manualProtein <= 300

  function submitManual(e: FormEvent) {
    e.preventDefault()
    if (!manualValid) return
    onAdd([{ meal, name: manual.name.trim() || 'Custom food', servings: 1, protein: manualProtein }])
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key='scrim'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={cn('inset-0', variant === 'page' ? 'fixed z-40 bg-foreground/20' : 'absolute z-10 bg-foreground/10')}
          />
          <motion.div
            key='sheet'
            role='dialog'
            aria-modal='true'
            aria-label='Add food'
            initial={{ transform: reduceMotion ? 'translateY(0%)' : 'translateY(100%)', opacity: reduceMotion ? 0 : 1 }}
            animate={{ transform: 'translateY(0%)', opacity: 1 }}
            exit={{ transform: reduceMotion ? 'translateY(0%)' : 'translateY(100%)', opacity: reduceMotion ? 0 : 1, transition: { duration: 0.2, ease } }}
            transition={{ duration: 0.4, ease: easeDrawer }}
            className={cn(
              'inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t bg-background shadow-[0_-8px_32px_-12px_hsl(var(--foreground)/0.2)]',
              variant === 'page'
                ? 'fixed z-50 mx-auto h-[min(88dvh,760px)] max-w-[560px] pb-[env(safe-area-inset-bottom)] sm:border-x'
                : 'absolute top-8 z-20',
            )}
          >
            <div className='flex items-center justify-between px-4 pb-2 pt-3'>
              <div>
                <h3 className='text-sm font-medium'>Add food</h3>
                <p className='text-xs text-muted-foreground'>{dayLabel}</p>
              </div>
              <div className='flex items-center gap-2'>
                <div className='flex rounded-lg bg-muted p-0.5 text-xs'>
                  {(['list', 'manual'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        'rounded-md px-2 py-1 font-medium transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        mode === m ? 'bg-background text-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.08)]' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {m === 'list' ? 'Foods' : 'Manual'}
                    </button>
                  ))}
                </div>
                <IconButton label='Close' onClick={onClose}>
                  <X className='h-4 w-4' />
                </IconButton>
              </div>
            </div>

            {/* Meal */}
            <div className='flex flex-wrap gap-1.5 px-4 pb-3'>
              {MEALS.map((m) => {
                const { Icon, text } = MEAL_STYLE[m.id]
                return (
                  <Chip key={m.id} active={meal === m.id} onClick={() => setMeal(m.id)}>
                    <Icon className={cn('-ml-0.5 h-3.5 w-3.5 transition-colors duration-150', meal !== m.id && text)} strokeWidth={2.25} />
                    {m.label}
                  </Chip>
                )
              })}
            </div>

            {mode === 'list' ? (
              <>
                <div className='px-4'>
                  <label className='flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 transition-[border-color,box-shadow] duration-150 focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/20'>
                    <Search className='h-4 w-4 shrink-0 text-muted-foreground' />
                    <input
                      ref={search}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && results[0]) toggle(results[0])
                      }}
                      placeholder='Search paneer, dal, anda…'
                      aria-label='Search foods'
                      className='h-9 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm'
                    />
                    {query && (
                      <button onClick={() => setQuery('')} aria-label='Clear search' className='rounded p-0.5 text-muted-foreground hover:text-foreground'>
                        <X className='h-3.5 w-3.5' />
                      </button>
                    )}
                  </label>
                  <div className='mt-2 flex gap-1.5'>
                    {(['all', 'veg', 'egg', 'nonveg'] as const).map((d) => (
                      <Chip key={d} small active={diet === d} onClick={() => setDiet(d)}>
                        {d !== 'all' && <DietMark diet={d} />}
                        {d === 'all' ? 'All' : d === 'veg' ? 'Veg' : d === 'egg' ? 'Egg' : 'Non-veg'}
                      </Chip>
                    ))}
                  </div>
                </div>

                <ul className='mt-2 scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2'>
                  {results.length === 0 && (
                    <li className='px-2 py-8 text-center text-sm text-muted-foreground'>
                      Nothing called “{query}”.{' '}
                      <button
                        onClick={() => {
                          setManual({ name: query, protein: '' })
                          setMode('manual')
                        }}
                        className='font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground'
                      >
                        Add it manually
                      </button>
                    </li>
                  )}
                  {results.map((f) => {
                    const active = isPicked(f.id)
                    return (
                      <li key={f.id}>
                        <button
                          onClick={() => toggle(f)}
                          role='checkbox'
                          aria-checked={active}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-[background-color,transform] duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                            active ? 'bg-grass/10' : 'hover:bg-muted',
                          )}
                        >
                          <DietMark diet={f.diet} />
                          <span className='min-w-0 flex-1'>
                            <span className='block truncate'>{f.name}</span>
                            <span className='block truncate text-xs text-muted-foreground'>{f.serving}</span>
                          </span>
                          <span className='font-medium tabular-nums'>
                            {f.protein}
                            <span className='text-muted-foreground'>g</span>
                          </span>
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-[5px] border transition-[background-color,border-color] duration-150',
                              active ? 'border-grass bg-grass text-background' : 'border-border',
                            )}
                          >
                            <Check className={cn('h-2.5 w-2.5 transition-opacity duration-150', active ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>

                {/* The plate: everything picked so far, each with its own servings */}
                <AnimatePresence initial={false}>
                  {picked.length > 0 && (
                    <motion.div
                      key='tray'
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease }}
                      className='shrink-0 overflow-hidden border-t bg-muted/30'
                    >
                      <div className='flex items-center justify-between px-4 pt-2.5 text-xs'>
                        <span className='font-medium'>
                          {picked.length} {picked.length === 1 ? 'food' : 'foods'}
                          <span className='ml-1 font-normal text-muted-foreground'>selected</span>
                        </span>
                        <button
                          onClick={() => setPicked([])}
                          className='rounded px-1 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        >
                          Clear
                        </button>
                      </div>
                      <ul className='scroll-thin max-h-[118px] overflow-y-auto overscroll-contain px-2 pt-1'>
                        <AnimatePresence initial={false}>
                          {picked.map(({ food, servings }) => (
                            <motion.li
                              key={food.id}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18, ease }}
                              className='overflow-hidden'
                            >
                              <div className='flex items-center gap-2 px-2 py-1'>
                                <DietMark diet={food.diet} />
                                <span className='min-w-0 flex-1 truncate text-[13px]'>
                                  {food.name}
                                  <span className='ml-1.5 text-[11px] text-muted-foreground'>{food.serving}</span>
                                </span>
                                <div className='flex items-center rounded-md border bg-background'>
                                  <IconButton small label={`Fewer servings of ${food.name}`} onClick={() => setServings(food.id, -0.5)} disabled={servings <= 0.5}>
                                    <Minus className='h-3 w-3' />
                                  </IconButton>
                                  <span className='w-7 text-center text-xs font-medium tabular-nums' aria-live='polite'>
                                    {fmt(servings)}
                                  </span>
                                  <IconButton small label={`More servings of ${food.name}`} onClick={() => setServings(food.id, 0.5)} disabled={servings >= 10}>
                                    <Plus className='h-3 w-3' />
                                  </IconButton>
                                </div>
                                <span className='w-10 text-right text-[13px] font-medium tabular-nums'>{fmt(food.protein * servings)}g</span>
                              </div>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                      <div className='px-4 pb-3 pt-2'>
                        <PrimaryButton
                          className='w-full'
                          onClick={() =>
                            onAdd(
                              picked.map(({ food, servings }) => ({
                                meal,
                                name: food.name,
                                serving: food.serving,
                                servings,
                                protein: food.protein * servings,
                                diet: food.diet,
                              })),
                            )
                          }
                        >
                          Add to {MEALS.find((m) => m.id === meal)!.label.toLowerCase()}
                          <span className='tabular-nums opacity-60'>· {fmt(pickedTotal)}g</span>
                        </PrimaryButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <form onSubmit={submitManual} className='flex flex-1 flex-col gap-3 px-4 pb-4'>
                <Field label='What did you eat?'>
                  <input
                    value={manual.name}
                    onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
                    placeholder='Ghar ka rajma chawal'
                    className='h-10 w-full rounded-lg border bg-muted/40 px-3 text-base outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus:border-ring/60 focus:ring-2 focus:ring-ring/20 sm:text-sm'
                  />
                </Field>
                <Field label='Protein'>
                  <div className='flex h-10 items-center rounded-lg border bg-muted/40 pr-3 transition-[border-color,box-shadow] duration-150 focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/20'>
                    <input
                      value={manual.protein}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.]/g, '')
                        if (/^\d{0,3}(\.\d?)?$/.test(v)) setManual((m) => ({ ...m, protein: v }))
                      }}
                      inputMode='decimal'
                      placeholder='0'
                      className='h-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none placeholder:text-muted-foreground sm:text-sm'
                    />
                    <span className='text-sm text-muted-foreground'>grams</span>
                  </div>
                </Field>
                <p className='text-xs text-muted-foreground'>
                  Check the label, or roughly: 100 g paneer ≈ 18 g, one egg ≈ 6 g, a bowl of dal ≈ 9 g.
                </p>
                <div className='mt-auto'>
                  <PrimaryButton type='submit' disabled={!manualValid} className='w-full'>
                    Add to {MEALS.find((m) => m.id === meal)!.label.toLowerCase()}
                  </PrimaryButton>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ---------- small parts ---------- */

function MealIcon({ meal, size = 'md' }: { meal: Meal; size?: 'sm' | 'md' }) {
  const { Icon, tile, text } = MEAL_STYLE[meal]
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        size === 'md' ? 'h-6 w-6 rounded-md' : 'h-4 w-4 rounded',
        tile,
        text,
      )}
    >
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'} strokeWidth={2.25} />
    </span>
  )
}

/** The marks printed on Indian food packets: a dot for veg, a triangle for non-veg */
function DietMark({ diet }: { diet?: Diet }) {
  if (!diet) return <span className='h-3 w-3 shrink-0 rounded-[3px] border border-dashed border-muted-foreground/50' aria-hidden />
  const color = diet === 'veg' ? '#1a8f3c' : diet === 'egg' ? '#d48a1c' : '#b3261e'
  return (
    <span
      className='flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]'
      style={{ borderColor: color }}
      aria-label={diet === 'veg' ? 'Vegetarian' : diet === 'egg' ? 'Contains egg' : 'Non-vegetarian'}
      role='img'
    >
      {diet === 'nonveg' ? (
        <span className='h-0 w-0 border-x-[3px] border-b-[5px] border-x-transparent' style={{ borderBottomColor: color }} />
      ) : (
        <span className='h-1.5 w-1.5 rounded-full' style={{ backgroundColor: color }} />
      )}
    </span>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  small,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  small?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(small ? 'h-6 w-6 [@media(pointer:coarse)]:h-8 [@media(pointer:coarse)]:w-8' : 'h-7 w-7 [@media(pointer:coarse)]:h-9 [@media(pointer:coarse)]:w-9', 'inline-flex items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30')}
    >
      {children}
    </button>
  )
}

function Chip({
  active,
  small,
  onClick,
  children,
}: {
  active: boolean
  small?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        active ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function PrimaryButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3.5 text-sm font-medium text-background transition-[transform,opacity] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    />
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className='flex flex-col gap-1.5'>
      <span className='text-xs font-medium text-muted-foreground'>{label}</span>
      {children}
    </label>
  )
}
