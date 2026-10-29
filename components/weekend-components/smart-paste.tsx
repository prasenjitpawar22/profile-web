'use client'

import { cn } from '@/lib/utils'
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react'
import { ClipboardPaste, X } from 'lucide-react'
import { ClipboardEvent, ReactNode, useEffect, useId, useRef, useState } from 'react'

/* ============================================================
   Smart paste — paste a messy block of text (an email signature,
   a contact card) and every detail it recognises lifts out of the
   text and flies into its own field. Guesses are flagged, never
   silently trusted.
   ============================================================ */

type FieldKey = 'name' | 'company' | 'email' | 'phone' | 'website'

const FIELDS: { key: FieldKey; label: string; wide?: boolean }[] = [
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website', wide: true },
]

const EXAMPLE = `Thanks again for the call, talk soon!

Maya Okafor
Design Engineer at Northwind
maya@northwind.design
+1 (415) 555-0132
northwind.design/careers`

type Detection = {
  key: FieldKey
  value: string
  start: number
  end: number
  /** Found by a weaker rule, so the reader should check it */
  guessed: boolean
}

/**
 * Plain pattern matching, strongest signals first. Each character of the
 * source can feed at most one field, so an email's domain is never also
 * read as the website.
 */
function detect(text: string): Detection[] {
  const found: Detection[] = []
  const overlaps = (start: number, end: number) =>
    found.some((f) => start < f.end && end > f.start)
  const add = (key: FieldKey, value: string, start: number, guessed = false) => {
    const end = start + value.length
    if (found.some((f) => f.key === key) || overlaps(start, end)) return false
    found.push({ key, value, start, end, guessed })
    return true
  }
  const each = (re: RegExp, fn: (m: RegExpExecArray) => boolean | void) => {
    for (let m = re.exec(text); m; m = re.exec(text)) if (fn(m)) break
  }

  each(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, (m) => add('email', m[0], m.index))

  // Spaces and tabs only: \s would let a number run on into the next line
  each(/\+?\d[\d \t().-]{6,}\d/g, (m) => {
    if (m[0].replace(/\D/g, '').length < 7) return
    return add('phone', m[0], m.index)
  })

  each(
    /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/[^\s]*)?/gi,
    (m) => add('website', m[0], m.index),
  )

  // Line-based rules need each line's offset into the full text
  let offset = 0
  const lines = text.split('\n').map((raw) => {
    const line = { raw, start: offset }
    offset += raw.length + 1
    return line
  })

  for (const { raw, start } of lines) {
    const trimmed = raw.trim()
    // Two to four capitalised words, Latin letters with accents included
    if (/^[A-ZÀ-Ö][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?: [A-ZÀ-Ö][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,3}$/.test(trimmed)) {
      if (add('name', trimmed, start + raw.indexOf(trimmed))) break
    }
  }

  // A legal or studio suffix is a strong signal; "… at Something" is only a hint
  for (const { raw, start } of lines) {
    const strong =
      /\b[A-Z][\w&'’.-]*(?: [A-Z][\w&'’.-]*)* (?:Inc\.?|LLC|Ltd\.?|Labs|Studio|GmbH|Group)\b/.exec(raw)
    if (strong && add('company', strong[0], start + strong.index)) break
  }
  for (const { raw, start } of lines) {
    const hint = /\b(?:at|@) ([A-Z][\w&'’.-]*(?: [A-Z][\w&'’.-]*)*)/.exec(raw)
    if (!hint) continue
    const value = hint[1]
    if (add('company', value, start + hint.index + hint[0].length - value.length, true)) break
  }

  return found.sort((a, b) => a.start - b.start)
}

type Phase = 'empty' | 'scanning' | 'filling' | 'done'

// Beat lengths: marks light up in reading order, then fields fill in that same order
const MARK_GAP_MS = 110
const FILL_DELAY_MS = 250
const FLY_GAP_MS = 170
// Upper bound for a flight, in case its layout animation is interrupted
const FLIGHT_MS = 900

const ease = [0.23, 1, 0.32, 1] as const
const flight = { type: 'spring', duration: 0.55, bounce: 0.15 } as const

export function SmartPaste() {
  const reduceMotion = useReducedMotion() ?? false
  // Scoped so the shared-element ids never collide with another demo
  const scope = useId()

  const [draft, setDraft] = useState('')
  const [source, setSource] = useState('')
  const [phase, setPhase] = useState<Phase>('empty')
  const [detections, setDetections] = useState<Detection[]>([])
  const [marked, setMarked] = useState(0)
  const [flown, setFlown] = useState(0)
  const [landed, setLanded] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({})
  const [guessed, setGuessed] = useState<Partial<Record<FieldKey, boolean>>>({})

  const timers = useRef<number[]>([])
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  function land(d: Detection) {
    setLanded((prev) => (prev[d.key] ? prev : { ...prev, [d.key]: true }))
    setValues((prev) => ({ ...prev, [d.key]: d.value }))
    setGuessed((prev) => ({ ...prev, [d.key]: d.guessed }))
  }

  function extract(text: string) {
    clearTimers()
    const found = detect(text)
    const later = (ms: number, fn: () => void) =>
      timers.current.push(window.setTimeout(fn, ms))

    setSource(text)
    setDetections(found)
    setMarked(0)
    setFlown(0)
    setLanded({})
    setValues({})
    setGuessed({})
    setPhase('scanning')

    found.forEach((_, i) => later(150 + i * MARK_GAP_MS, () => setMarked(i + 1)))

    const fillAt = 150 + found.length * MARK_GAP_MS + FILL_DELAY_MS
    later(fillAt, () => setPhase('filling'))
    found.forEach((d, i) => {
      const at = fillAt + i * FLY_GAP_MS
      later(at, () => {
        setFlown(i + 1)
        // Nothing to fly under reduced motion: the value simply appears
        if (reduceMotion) land(d)
      })
      later(at + FLIGHT_MS, () => land(d))
    })
    later(fillAt + Math.max(found.length - 1, 0) * FLY_GAP_MS + FLIGHT_MS, () =>
      setPhase('done'),
    )
  }

  function reset() {
    clearTimers()
    setDraft('')
    setSource('')
    setDetections([])
    setMarked(0)
    setFlown(0)
    setLanded({})
    setValues({})
    setGuessed({})
    setPhase('empty')
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text')
    if (!text.trim()) return
    e.preventDefault()
    extract(text)
  }

  const layoutId = (key: FieldKey) => `${scope}-${key}`
  const order = (key: FieldKey) => detections.findIndex((d) => d.key === key)
  const checkCount = FIELDS.filter((f) => landed[f.key] && guessed[f.key]).length

  const status =
    phase === 'empty'
      ? 'Paste a signature, a contact card, anything'
      : phase === 'scanning'
        ? 'Reading…'
        : phase === 'filling'
          ? `Filling ${detections.length} ${detections.length === 1 ? 'field' : 'fields'}`
          : detections.length === 0
            ? 'Nothing recognisable in that text'
            : `Filled ${detections.length} of ${FIELDS.length}` +
              (checkCount ? ` · ${checkCount} to check` : '')

  return (
    <LayoutGroup id={scope}>
      <div className='flex w-full max-w-[440px] flex-col gap-5'>
        <div className='rounded-xl border bg-background shadow-sm'>
          {phase === 'empty' ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onPaste={onPaste}
              aria-label='Text to extract contact details from'
              placeholder='Paste text here…'
              className='block h-[184px] w-full resize-none rounded-t-xl bg-transparent p-3 text-base leading-relaxed sm:text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
            />
          ) : (
            <p
              aria-label='Pasted text'
              className='h-[184px] overflow-y-auto whitespace-pre-wrap p-3 text-base leading-relaxed text-muted-foreground sm:text-sm'>
              <SourceText
                text={source}
                detections={detections}
                marked={marked}
                flown={flown}
                layoutId={layoutId}
                animate={!reduceMotion}
              />
            </p>
          )}

          <div className='flex items-center justify-between gap-3 border-t px-3 py-2'>
            <span className='relative min-w-0 flex-1 text-xs text-muted-foreground'>
              <AnimatePresence initial={false} mode='popLayout'>
                <motion.span
                  key={status}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -3, filter: 'blur(2px)' }}
                  transition={{ duration: 0.2, ease }}
                  className={cn('block truncate', phase === 'scanning' && 'text-shimmer')}>
                  {status}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className='sr-only' aria-live='polite'>
              {phase === 'done' ? status : ''}
            </span>

            {phase === 'empty' ? (
              draft.trim() ? (
                <ActionButton onClick={() => extract(draft)}>
                  <ClipboardPaste />
                  Extract
                </ActionButton>
              ) : (
                <ActionButton onClick={() => extract(EXAMPLE)}>
                  <ClipboardPaste />
                  Paste an example
                </ActionButton>
              )
            ) : (
              <ActionButton onClick={reset}>
                <X />
                Clear
              </ActionButton>
            )}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-x-3 gap-y-3'>
          {FIELDS.map(({ key, label, wide }) => {
            const i = order(key)
            const detection = detections[i]
            const inFlight = i >= 0 && i < flown && !landed[key] && !reduceMotion
            const needsCheck = landed[key] && guessed[key]
            const inputId = `${scope}-${key}-input`
            return (
              <div key={key} className={cn('flex flex-col gap-1.5', wide && 'col-span-2')}>
                <label htmlFor={inputId} className='flex items-center justify-between text-xs text-muted-foreground'>
                  {label}
                  <AnimatePresence>
                    {needsCheck ? (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease }}
                        className='text-amber-600 dark:text-amber-400'>
                        Guessed — check this
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </label>
                <div className='relative'>
                  <input
                    id={inputId}
                    value={values[key] ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setValues((prev) => ({ ...prev, [key]: value }))
                      // Once the reader has touched it, it's theirs, not a guess
                      setGuessed((prev) => ({ ...prev, [key]: false }))
                    }}
                    placeholder={phase === 'done' && i < 0 ? 'Not found' : undefined}
                    className={cn(
                      'h-9 w-full rounded-lg border bg-background px-3 text-base shadow-sm sm:text-sm outline-none transition-[border-color] duration-200 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring',
                      landed[key] && 'field-absorb',
                      needsCheck && 'border-amber-500/60',
                    )}
                  />
                  {/* The value travels here from the pasted text, then hands
                      over to the real input as it lands */}
                  {inFlight && detection ? (
                    <span className='pointer-events-none absolute inset-y-0 left-3 right-3 flex items-center'>
                      <motion.span
                        layoutId={layoutId(key)}
                        transition={flight}
                        onLayoutAnimationComplete={() => land(detection)}
                        className='relative z-20 -mx-0.5 whitespace-nowrap rounded bg-grass/20 px-0.5 text-base text-foreground sm:text-sm'>
                        {detection.value}
                      </motion.span>
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </LayoutGroup>
  )
}

/** The pasted text, with each recognised value marked where it was found. */
function SourceText({
  text,
  detections,
  marked,
  flown,
  layoutId,
  animate,
}: {
  text: string
  detections: Detection[]
  marked: number
  flown: number
  layoutId: (key: FieldKey) => string
  animate: boolean
}) {
  const parts: ReactNode[] = []
  let cursor = 0
  detections.forEach((d, i) => {
    if (d.start > cursor) parts.push(text.slice(cursor, d.start))
    const lit = i < marked
    const gone = i < flown
    parts.push(
      gone || !animate ? (
        // Left behind once its copy has flown: quiet, but still traceable
        <span
          key={d.key}
          className={cn(
            '-mx-0.5 rounded px-0.5 transition-colors duration-300',
            gone ? 'bg-grass/10 text-muted-foreground' : lit ? 'bg-grass/20 text-foreground' : '',
          )}>
          {d.value}
        </span>
      ) : (
        <motion.span
          key={d.key}
          layoutId={layoutId(d.key)}
          className={cn(
            'relative -mx-0.5 rounded px-0.5 transition-colors duration-300',
            lit ? 'bg-grass/20 text-foreground' : 'bg-transparent',
          )}>
          {d.value}
        </motion.span>
      ),
    )
    cursor = d.end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}

function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none [&_svg]:h-3.5 [&_svg]:w-3.5'>
      {children}
    </button>
  )
}
