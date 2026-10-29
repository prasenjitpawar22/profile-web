'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CalendarClock, Check } from 'lucide-react'
import {
  KeyboardEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/* ============================================================
   Natural-language date — type "next fri 3pm" or "in 2 weeks".
   The words it understood light up inside the field, and a live
   preview spells out exactly when that is, so there's never a
   surprise about what the machine decided.
   ============================================================ */

type Parsed = {
  date: Date
  /** False when no time was given and the 9:00 default was used */
  hasTime: boolean
  /** Character ranges of the input that were understood */
  ranges: [number, number][]
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  'a couple of': 2,
}

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_RE = '(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\\.?'

const DEFAULT_HOUR = 9

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/**
 * A small, honest parser: it only claims the words it understood and
 * reports their positions, so the field can show exactly what it read.
 */
function parseWhen(input: string, now: Date): Parsed | null {
  const s = input.toLowerCase()
  const ranges: [number, number][] = []
  let day: Date | null = null
  let time: { h: number; m: number } | null = null
  let exact: Date | null = null

  const find = (pattern: string) => {
    const re = new RegExp(pattern, 'g')
    for (let m = re.exec(s); m; m = re.exec(s)) {
      const start = m.index
      const end = start + m[0].length
      // Each stretch of text can only mean one thing
      if (!ranges.some(([a, b]) => start < b && end > a)) {
        ranges.push([start, end])
        return m
      }
    }
    return null
  }

  const today = startOfDay(now)

  // Relative offsets: "in 20 minutes", "in a couple of weeks"
  const rel = find(
    `\\bin (\\d+|a couple of|an?|one|two|three|four|five|six|seven|eight|nine|ten) (min(?:ute)?s?|hours?|hrs?|days?|weeks?|months?)\\b`,
  )
  if (rel) {
    const n = /^\d+$/.test(rel[1]) ? Number(rel[1]) : NUMBER_WORDS[rel[1]]
    const unit = rel[2]
    if (unit.startsWith('min')) exact = new Date(now.getTime() + n * 60_000)
    else if (unit.startsWith('h')) exact = new Date(now.getTime() + n * 3_600_000)
    else if (unit.startsWith('d')) day = addDays(today, n)
    else if (unit.startsWith('w')) day = addDays(today, n * 7)
    else day = new Date(today.getFullYear(), today.getMonth() + n, today.getDate())
  }

  if (!day && !exact) {
    const offsets: Record<string, number> = {
      today: 0,
      tonight: 0,
      tomorrow: 1,
      tmrw: 1,
      tmr: 1,
      'day after tomorrow': 2,
    }
    const m = find('\\b(day after tomorrow|today|tonight|tomorrow|tmrw|tmr)\\b')
    if (m) {
      day = addDays(today, offsets[m[1]])
      // "Tonight" is 8 PM, or the next full hour once 8 PM has passed
      if (m[1] === 'tonight') time = { h: Math.max(20, now.getHours() + 1), m: 0 }
    }
  }

  if (!day && !exact) {
    const m = find('\\b(next week|next month|(?:this )?weekend|end of (?:the )?(?:week|month))\\b')
    if (m) {
      const phrase = m[1]
      const dow = today.getDay()
      if (phrase === 'next week') day = addDays(today, ((8 - dow) % 7) || 7)
      else if (phrase === 'next month') day = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      else if (phrase.includes('weekend')) day = addDays(today, (6 - dow + 7) % 7)
      else if (phrase.includes('week')) day = addDays(today, (5 - dow + 7) % 7)
      else day = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }
  }

  if (!day && !exact) {
    const m = find(`\\b(?:(next|this|on) )?(${Object.keys(WEEKDAYS).sort((a, b) => b.length - a.length).join('|')})\\b`)
    if (m) {
      const diff = (WEEKDAYS[m[2]] - today.getDay() + 7) % 7
      // "fri" is the coming Friday; "next fri" is the one in the week after
      const offset = m[1] === 'next' ? (diff === 0 ? 7 : diff + 7) : m[1] === 'this' ? diff : diff || 7
      day = addDays(today, offset)
    }
  }

  if (!day && !exact) {
    const m =
      find(`\\b${MONTH_RE} (\\d{1,2})(?:st|nd|rd|th)?\\b`) ??
      find(`\\b(\\d{1,2})(?:st|nd|rd|th)? (?:of )?${MONTH_RE}`)
    if (m) {
      const monthFirst = isNaN(Number(m[1]))
      const month = MONTHS.indexOf((monthFirst ? m[1] : m[2]).slice(0, 3))
      const date = Number(monthFirst ? m[2] : m[1])
      let candidate = new Date(today.getFullYear(), month, date)
      // A date that has already passed this year means next year's
      if (candidate < today) candidate = new Date(today.getFullYear() + 1, month, date)
      if (candidate.getDate() === date) day = candidate
    }
  }

  if (!exact && !time) {
    const ampm = find('\\b(?:at )?(\\d{1,2})(?::(\\d{2}))? ?(am|pm|a\\.m\\.|p\\.m\\.)')
    const clock = ampm ? null : find('\\b(?:at )?([01]?\\d|2[0-3]):([0-5]\\d)\\b')
    const named = ampm || clock ? null : find('\\b(noon|midday|midnight|morning|afternoon|evening|night)\\b')
    const bare = ampm || clock || named ? null : find('\\bat (\\d{1,2})\\b')
    if (ampm) {
      const h = Number(ampm[1]) % 12
      if (Number(ampm[1]) <= 12) time = { h: ampm[3].startsWith('p') ? h + 12 : h, m: Number(ampm[2] ?? 0) }
    } else if (clock) {
      time = { h: Number(clock[1]), m: Number(clock[2]) }
    } else if (named) {
      const hours: Record<string, number> = { noon: 12, midday: 12, midnight: 0, morning: 9, afternoon: 14, evening: 18, night: 21 }
      time = { h: hours[named[1]], m: 0 }
    } else if (bare) {
      // "at 5" almost always means the afternoon
      const h = Number(bare[1])
      if (h <= 12) time = { h: h < 8 ? h + 12 : h, m: 0 }
    }
  }

  if (exact) return { date: exact, hasTime: true, ranges }
  if (!day && !time) return null

  const base = day ?? today
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), time?.h ?? DEFAULT_HOUR, time?.m ?? 0)
  // A bare time that has already gone by today means tomorrow
  if (!day && date <= now) date.setDate(date.getDate() + 1)
  return { date, hasTime: !!time, ranges: ranges.sort((a, b) => a[0] - b[0]) }
}

const dayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const yearFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function describe(date: Date, now: Date) {
  const dayDiff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000)
  let when: string
  if (dayDiff === 0) {
    const minutes = Math.round((date.getTime() - now.getTime()) / 60_000)
    when = Math.abs(minutes) < 60 ? relative.format(minutes, 'minute') : relative.format(Math.round(minutes / 60), 'hour')
  } else if (Math.abs(dayDiff) < 14) {
    when = relative.format(dayDiff, 'day')
  } else if (Math.abs(dayDiff) < 60) {
    when = relative.format(Math.round(dayDiff / 7), 'week')
  } else {
    when = relative.format(Math.round(dayDiff / 30), 'month')
  }
  return {
    day: (date.getFullYear() === now.getFullYear() ? dayFormat : yearFormat).format(date),
    time: timeFormat.format(date),
    when,
    past: date.getTime() < now.getTime(),
  }
}

const SUGGESTIONS = ['tomorrow 9am', 'next fri 3pm', 'in 2 weeks', 'tonight', 'dec 24 noon']

const ease = [0.23, 1, 0.32, 1] as const

export function NaturalDateInput() {
  const reduceMotion = useReducedMotion() ?? false
  const previewId = useId()
  const [value, setValue] = useState('')
  const [now, setNow] = useState<Date | null>(null)
  const [confirmed, setConfirmed] = useState<{ text: string; n: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  // "Now" only exists on the client, and stays fresh so "in 5 minutes" stays true
  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const parsed = useMemo(
    () => (now && value.trim() ? parseWhen(value, now) : null),
    [value, now],
  )
  const info = parsed && now ? describe(parsed.date, now) : null

  // Keep the highlight layer scrolled with the input once the text overflows
  const syncScroll = () => {
    if (mirrorRef.current && inputRef.current)
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft
  }
  useLayoutEffect(syncScroll, [value])

  function commit() {
    if (!info) return
    setConfirmed((c) => ({ text: `${info.day} at ${info.time}`, n: (c?.n ?? 0) + 1 }))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape' && value) {
      e.preventDefault()
      setValue('')
    }
  }

  function suggest(text: string) {
    setValue(text)
    setConfirmed(null)
    const input = inputRef.current
    if (!input) return
    input.focus()
    requestAnimationFrame(() => input.setSelectionRange(text.length, text.length))
  }

  // The input's text drawn again underneath it, transparent, with the
  // understood stretches tinted. Same font and padding, so they line up.
  const highlighted = useMemo(() => {
    const parts: React.ReactNode[] = []
    let cursor = 0
    for (const [start, end] of parsed?.ranges ?? []) {
      if (start > cursor) parts.push(value.slice(cursor, start))
      parts.push(
        <span key={start} className='mark-in rounded-[3px] bg-grass/20 [box-shadow:0_0_0_2px_hsl(var(--grass)/0.2)]'>
          {value.slice(start, end)}
        </span>,
      )
      cursor = end
    }
    parts.push(value.slice(cursor))
    return parts
  }, [parsed, value])

  const previewKey = info ? `${info.day}-${info.time}-${info.when}` : value.trim() ? 'unknown' : 'empty'
  const swap = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 3, filter: 'blur(2px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -3, filter: 'blur(2px)' },
      }

  return (
    <div className='w-full max-w-[400px] rounded-xl border bg-background p-3 shadow-sm'>
      <label htmlFor={`${previewId}-input`} className='text-xs text-muted-foreground'>
        Remind me
      </label>

      <div className='mt-1.5 flex gap-2'>
        <div className='relative min-w-0 flex-1 rounded-lg bg-background'>
          <div
            ref={mirrorRef}
            aria-hidden
            className='pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre rounded-lg border border-transparent px-3 text-base text-transparent sm:text-sm'>
            <span>{highlighted}</span>
          </div>
          <input
            ref={inputRef}
            id={`${previewId}-input`}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setConfirmed(null)
            }}
            onScroll={syncScroll}
            onKeyDown={onKeyDown}
            placeholder='e.g. next fri 3pm'
            autoComplete='off'
            spellCheck={false}
            aria-describedby={previewId}
            className='relative h-10 w-full rounded-lg border bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground/60 sm:text-sm focus-visible:ring-2 focus-visible:ring-ring'
          />
        </div>
        <button
          type='button'
          onClick={commit}
          disabled={!info}
          className='h-10 shrink-0 rounded-lg bg-foreground px-3.5 text-sm font-medium text-background transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background enabled:active:scale-[0.97] disabled:opacity-40 motion-reduce:transition-none'>
          Set
        </button>
      </div>

      {/* The preview always says exactly what will be saved */}
      <div
        id={previewId}
        aria-live='polite'
        className='mt-3 flex h-14 items-center gap-3 rounded-lg bg-muted/50 px-3'>
        <CalendarClock
          aria-hidden
          className={cn(
            'h-4 w-4 shrink-0 transition-colors duration-200',
            info ? (info.past ? 'text-amber-500' : 'text-grass') : 'text-muted-foreground/60',
          )}
        />
        <div className='relative min-w-0 flex-1'>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.div
              key={previewKey}
              {...swap}
              transition={{ duration: 0.18, ease }}
              className='min-w-0'>
              {info ? (
                <>
                  <p className='truncate text-sm font-medium'>
                    {info.day}
                    <span className='text-muted-foreground'> · </span>
                    <span
                      className={parsed?.hasTime ? undefined : 'font-normal text-muted-foreground'}
                      title={parsed?.hasTime ? undefined : 'No time given, so it defaults to 9:00 AM'}>
                      {info.time}
                    </span>
                  </p>
                  <p
                    className={cn(
                      'truncate text-xs',
                      info.past ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                    )}>
                    {info.past ? `That's in the past (${info.when})` : info.when}
                    {parsed?.hasTime ? '' : ' · default time'}
                  </p>
                </>
              ) : (
                <p className='truncate text-sm text-muted-foreground'>
                  {value.trim() ? 'Not sure when that is yet' : 'Type a time in your own words'}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className='mt-3 flex flex-wrap items-center gap-1.5'>
        <span className='text-xs text-muted-foreground/80'>Try</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type='button'
            onClick={() => suggest(s)}
            className='rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none'>
            {s}
          </button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {confirmed ? (
          <motion.div
            key='confirmed'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15, ease } }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease }}
            className='overflow-hidden'>
            <p role='status' className='flex items-center gap-2 pt-3 text-xs text-foreground'>
              <span className='grid h-4 w-4 place-items-center rounded-full bg-grass text-background'>
                <Check aria-hidden className='h-2.5 w-2.5' strokeWidth={3} />
              </span>
              Reminder set for {confirmed.text}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
