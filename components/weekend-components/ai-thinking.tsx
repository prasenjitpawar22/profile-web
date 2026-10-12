'use client'

import { cn } from '@/lib/utils'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { Check, ChevronDown, Copy, RotateCcw, Search } from 'lucide-react'
import { Fragment, ReactNode, useEffect, useId, useRef, useState } from 'react'
import useMeasure from 'react-use-measure'

/* ============================================================
   Thinking indicator — an AI reasoning trace.

   The run is choreographed in four beats, never overlapping:
   1. Think   — steps land one by one; sources pop in as they're read
   2. Settle  — the header becomes "Thought for Ns" with a check
   3. Fold    — the trace tucks away to make room
   4. Stream  — the answer arrives in uneven bursts, like real tokens
   ============================================================ */

type Source = { name: string; mark: string }

type Step = {
  title: string
  /** How long the step runs before it ticks off */
  ms: number
  query?: string
  meta?: string
  sources?: Source[]
}

type Phase = 'idle' | 'thinking' | 'answering' | 'complete'

const QUESTION = 'How do I animate height: auto in CSS?'

// Backticks mark inline code; each code span streams in as one token
const ANSWER =
  "Add `interpolate-size: allow-keywords` to `:root`, and a regular height transition will run all the way to `auto`. Where that isn't supported yet, transition `grid-template-rows` from `0fr` to `1fr` on a wrapper instead. Both land in the same place without measuring anything in JavaScript."

const ANSWER_PLAIN = ANSWER.replace(/`/g, '')

const STEPS: Step[] = [
  { title: 'Reading the question', ms: 1100 },
  {
    title: 'Searching the web',
    ms: 1900,
    query: 'animate height auto css',
    meta: '6 results',
  },
  {
    title: 'Reading sources',
    ms: 1800,
    sources: [
      { name: 'MDN', mark: 'M' },
      { name: 'web.dev', mark: 'W' },
      { name: 'CSS-Tricks', mark: 'C' },
    ],
  },
  { title: 'Drafting an answer', ms: 1200 },
]

// Sources arrive one at a time while their step runs, as if being opened
const SOURCE_LEAD_MS = 300
const SOURCE_GAP_MS = 450

// A beat to see the final tick, then fold, then stream once the fold has cleared
const FOLD_DELAY_MS = 700
const STREAM_DELAY_MS = 350

const ease = [0.23, 1, 0.32, 1] as const
// Folding is an on-screen morph rather than an entrance, so it gets the drawer curve
const foldEase = [0.32, 0.72, 0, 1] as const

type Part = { text: string; code: boolean }

/**
 * One streamed unit: a word plus anything glued to it, such as a code span
 * followed by its comma. Parts stay in one box, so punctuation never drifts
 * from its word or wraps onto the next line alone.
 */
type Token = Part[]

const TOKENS: Token[] = (() => {
  const tokens: Token[] = []
  ANSWER.replace(/(\s*)(`[^`]+`|[^\s`]+)/g, (_, ws: string, raw: string) => {
    const part = { text: raw.replace(/`/g, ''), code: raw.startsWith('`') }
    if (ws.length > 0 || tokens.length === 0) tokens.push([part])
    else tokens[tokens.length - 1].push(part)
    return ''
  })
  return tokens
})()

const tokenText = (t: Token) => t.map((p) => p.text).join('')

export function AiThinking() {
  const rootRef = useRef<HTMLDivElement>(null)
  // Start once the demo is properly on screen, so the opening isn't missed
  const inView = useInView(rootRef, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion() ?? false
  const panelId = useId()

  const [run, setRun] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  // -1 before starting, i while step i runs, STEPS.length once all have landed
  const [step, setStep] = useState(-1)
  const [sourcesShown, setSourcesShown] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [thoughtFor, setThoughtFor] = useState(0)
  const [open, setOpen] = useState(true)
  // Once the reader has used the toggle, stop folding the trace for them
  const userToggled = useRef(false)
  const [traceRef, { height: traceHeight }] = useMeasure()

  useEffect(() => {
    if (!inView) return

    const timers: number[] = []
    const later = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms))

    const start = performance.now()
    const seconds = () => (performance.now() - start) / 1000
    const clock = window.setInterval(() => setElapsed(Math.floor(seconds())), 250)

    setPhase('thinking')
    setStep(0)

    let at = 0
    STEPS.forEach((s, i) => {
      s.sources?.forEach((_, j) =>
        later(at + SOURCE_LEAD_MS + j * SOURCE_GAP_MS, () => setSourcesShown(j + 1)),
      )
      at += s.ms
      later(at, () => setStep(i + 1))
    })

    later(at, () => {
      window.clearInterval(clock)
      setThoughtFor(Math.max(1, Math.round(seconds())))
    })
    later(at + FOLD_DELAY_MS, () => {
      if (!userToggled.current) setOpen(false)
    })
    later(at + FOLD_DELAY_MS + STREAM_DELAY_MS, () => setPhase('answering'))

    return () => {
      timers.forEach(clearTimeout)
      window.clearInterval(clock)
    }
  }, [inView, run])

  function toggle() {
    userToggled.current = true
    setOpen((o) => !o)
  }

  function replay() {
    userToggled.current = false
    setOpen(true)
    setPhase('idle')
    setStep(-1)
    setSourcesShown(0)
    setElapsed(0)
    setRun((r) => r + 1)
  }

  const settled = step >= STEPS.length
  const thinking = step >= 0 && !settled
  const current = STEPS[Math.min(Math.max(step, 0), STEPS.length - 1)]

  // Open, the trace shows every step, so the header stays generic.
  // Folded mid-run, the header carries the current step instead.
  const label = settled
    ? `Thought for ${thoughtFor}s`
    : thinking && !open
      ? current.title
      : 'Thinking'

  // Text hand-offs rise through a soft blur; reduced motion keeps only the fade
  const swap = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -4, filter: 'blur(2px)' },
      }
  const swapTransition = { duration: 0.2, ease }

  const announcement =
    phase === 'complete'
      ? 'Answer ready'
      : settled
        ? label
        : thinking
          ? current.title
          : ''

  return (
    <div
      ref={rootRef}
      className='flex min-h-[320px] w-full max-w-[400px] flex-col gap-4'>
      <p className='max-w-[85%] self-end rounded-2xl rounded-br-md border bg-background px-3.5 py-2 text-sm shadow-sm'>
        {QUESTION}
      </p>

      <div>
        <button
          type='button'
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className='group -mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
          <span className='relative grid h-4 w-4 shrink-0 place-items-center'>
            <AnimatePresence initial={false} mode='popLayout'>
              <motion.span
                key={settled ? 'settled' : 'thinking'}
                {...swap}
                transition={swapTransition}
                className='grid place-items-center'>
                {settled ? (
                  <SettledBadge draw={!reduceMotion} />
                ) : (
                  <Sparkle active={thinking} />
                )}
              </motion.span>
            </AnimatePresence>
          </span>

          {/* popLayout lifts the outgoing label out of flow, so the two
              overlap for the hand-off instead of stacking */}
          <span className='relative min-w-0 flex-1'>
            <AnimatePresence initial={false} mode='popLayout'>
              <motion.span
                key={label}
                {...swap}
                transition={swapTransition}
                className={cn(
                  'block truncate',
                  thinking && !open && 'text-shimmer',
                )}>
                {label}
              </motion.span>
            </AnimatePresence>
          </span>

          <AnimatePresence initial={false}>
            {thinking ? (
              <motion.span
                key='clock'
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, ease }}
                className='shrink-0 text-xs tabular-nums text-muted-foreground/70'>
                {elapsed}s
              </motion.span>
            ) : null}
          </AnimatePresence>

          <ChevronDown
            aria-hidden
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
              open && 'rotate-180',
            )}
          />
        </button>

        {/* The animated label crossfades through duplicates; screen readers
            get one clean announcement per beat instead */}
        <span className='sr-only' aria-live='polite'>
          {announcement}
        </span>

        {/* Height follows the measured trace, so it grows smoothly as steps
            and sources are added, not only when the panel opens and closes */}
        <motion.div
          id={panelId}
          initial={false}
          animate={{ height: open ? traceHeight : 0, opacity: open ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: foldEase }}
          aria-hidden={!open}
          className='overflow-hidden'>
          <ol ref={traceRef} className='flex flex-col gap-3 pb-1 pt-2.5'>
            <AnimatePresence initial={false}>
              {STEPS.slice(0, Math.min(step + 1, STEPS.length)).map((s, i) => {
                const stepDone = step > i
                const hasNext = i + 1 <= Math.min(step, STEPS.length - 1)
                return (
                  <motion.li
                    key={`${run}-${i}`}
                    {...swap}
                    transition={swapTransition}
                    className='relative flex items-start gap-2.5 text-sm'>
                    {hasNext ? (
                      // Connector down to the next step's icon, drawn as it appears
                      <motion.span
                        aria-hidden
                        initial={reduceMotion ? false : { scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.25, ease }}
                        className='absolute -bottom-[11px] left-[7.5px] top-[21px] w-px origin-top bg-border'
                      />
                    ) : null}

                    <span className='relative mt-0.5 grid h-4 w-4 shrink-0 place-items-center'>
                      <AnimatePresence initial={false} mode='popLayout'>
                        <motion.span
                          key={stepDone ? 'done' : 'busy'}
                          {...swap}
                          transition={swapTransition}
                          className='grid place-items-center'>
                          {stepDone ? <StepCheck draw={!reduceMotion} /> : <Spinner />}
                        </motion.span>
                      </AnimatePresence>
                    </span>

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-baseline justify-between gap-3'>
                        <span
                          className={stepDone ? 'text-muted-foreground' : 'text-shimmer'}>
                          {s.title}
                        </span>
                        <AnimatePresence>
                          {stepDone && s.meta ? (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2, ease }}
                              className='shrink-0 text-xs tabular-nums text-muted-foreground/70'>
                              {s.meta}
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </div>

                      {s.query ? (
                        <div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground/80'>
                          <Search aria-hidden className='h-3 w-3 shrink-0' />
                          <span className='truncate'>{s.query}</span>
                        </div>
                      ) : null}

                      {s.sources ? (
                        <div className='mt-1.5 flex min-h-[22px] flex-wrap gap-1.5'>
                          <AnimatePresence initial={false}>
                            {s.sources.slice(0, sourcesShown).map((src) => (
                              <motion.span
                                key={src.name}
                                initial={
                                  reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, scale: 0.9, filter: 'blur(2px)' }
                                }
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 0.2, ease }}
                                className='inline-flex items-center gap-1.5 rounded-full border bg-background py-0.5 pl-0.5 pr-2 text-xs text-muted-foreground'>
                                <span
                                  aria-hidden
                                  className='grid h-4 w-4 place-items-center rounded-full bg-foreground text-[9px] font-semibold text-background'>
                                  {src.mark}
                                </span>
                                {src.name}
                              </motion.span>
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : null}
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ol>
        </motion.div>
      </div>

      <AnimatePresence>
        {phase === 'answering' || phase === 'complete' ? (
          <motion.div
            key={`answer-${run}`}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <StreamedAnswer
              reduceMotion={reduceMotion}
              onDone={() => setPhase('complete')}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'complete' ? (
          <motion.div
            key='actions'
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2, ease }}
            className='-ml-1.5 -mt-2 flex items-center gap-0.5'>
            <CopyButton text={ANSWER_PLAIN} reduceMotion={reduceMotion} />
            <IconButton label='Replay' onClick={replay}>
              <RotateCcw />
            </IconButton>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/**
 * Reveals the answer in uneven bursts of one to three tokens, pausing at
 * commas and full stops the way a model's output actually arrives. Every
 * token is laid out from the start, so the paragraph never reflows.
 */
function StreamedAnswer({
  reduceMotion,
  onDone,
}: {
  reduceMotion: boolean
  onDone: () => void
}) {
  const [count, setCount] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (reduceMotion) {
      setCount(TOKENS.length)
      onDoneRef.current()
      return
    }

    let shown = 0
    let timer = 0
    const tick = () => {
      const burst = 1 + (Math.random() < 0.4 ? 1 : 0) + (Math.random() < 0.12 ? 1 : 0)
      shown = Math.min(shown + burst, TOKENS.length)
      setCount(shown)

      if (shown >= TOKENS.length) {
        timer = window.setTimeout(() => onDoneRef.current(), 250)
        return
      }
      const last = tokenText(TOKENS[shown - 1])
      const pause = /[.!?]$/.test(last) ? 260 : /[,;:]$/.test(last) ? 120 : 0
      timer = window.setTimeout(tick, 55 + Math.random() * 55 + pause)
    }
    timer = window.setTimeout(tick, 150)
    return () => window.clearTimeout(timer)
  }, [reduceMotion])

  const streaming = count < TOKENS.length

  return (
    <p aria-busy={streaming} className='text-sm leading-relaxed text-foreground'>
      {streaming && count === 0 ? <Caret /> : null}
      {TOKENS.map((token, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : null}
          <span className={cn('inline-block', i < count ? 'word-in' : 'opacity-0')}>
            {token.map((part, j) =>
              part.code ? (
                <code
                  key={j}
                  className='rounded-[5px] bg-muted px-1 py-px font-mono text-[0.8125rem]'>
                  {part.text}
                </code>
              ) : (
                <Fragment key={j}>{part.text}</Fragment>
              ),
            )}
          </span>
          {streaming && i === count - 1 ? <Caret /> : null}
        </Fragment>
      ))}
    </p>
  )
}

/** Rides at the end of the streamed text. Zero width, so it never reflows a line. */
function Caret() {
  return (
    <span aria-hidden className='relative inline-block h-[1em] w-0 align-[-0.15em]'>
      <span className='absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-foreground' />
    </span>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
      className='grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none [&_svg]:h-3.5 [&_svg]:w-3.5'>
      {children}
    </button>
  )
}

function CopyButton({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard can be blocked (insecure origin, denied permission); stay quiet
    }
  }

  return (
    <>
      <IconButton label={copied ? 'Copied' : 'Copy answer'} onClick={copy}>
        <span className='relative grid h-3.5 w-3.5 place-items-center'>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.span
              key={copied ? 'copied' : 'copy'}
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: 'blur(2px)' }
              }
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={
                reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: 'blur(2px)' }
              }
              transition={{ duration: 0.15, ease }}
              className={cn('grid place-items-center', copied && 'text-grass')}>
              {copied ? <Check /> : <Copy />}
            </motion.span>
          </AnimatePresence>
        </span>
      </IconButton>
      <span className='sr-only' aria-live='polite'>
        {copied ? 'Answer copied to clipboard' : ''}
      </span>
    </>
  )
}

/** Four-point star that breathes while the model is working. */
function Sparkle({ active }: { active: boolean }) {
  return (
    <svg
      viewBox='0 0 16 16'
      aria-hidden
      className={cn('h-4 w-4 text-foreground', active && 'breathe')}>
      <path
        d='M8 1.5C8.6 5.2 10.8 7.4 14.5 8 10.8 8.6 8.6 10.8 8 14.5 7.4 10.8 5.2 8.6 1.5 8 5.2 7.4 7.4 5.2 8 1.5Z'
        fill='currentColor'
      />
    </svg>
  )
}

/** The one accent moment in the run: thinking is done. */
function SettledBadge({ draw }: { draw: boolean }) {
  return (
    <svg viewBox='0 0 16 16' aria-hidden className='h-4 w-4'>
      <circle cx='8' cy='8' r='7' className='fill-grass' />
      <motion.path
        d='M5 8.25l2 2 4-4.5'
        fill='none'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='stroke-background'
        initial={{ pathLength: draw ? 0 : 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease, delay: 0.05 }}
      />
    </svg>
  )
}

/** A quiet check that draws itself in when a step lands. */
function StepCheck({ draw }: { draw: boolean }) {
  return (
    <svg viewBox='0 0 16 16' aria-hidden className='h-4 w-4 text-muted-foreground'>
      <motion.path
        d='M3.5 8.5l3 3 6-6.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        initial={{ pathLength: draw ? 0 : 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease }}
      />
    </svg>
  )
}

/** A quick, thin arc. A faster spinner makes the same wait feel shorter. */
function Spinner() {
  return (
    <svg
      viewBox='0 0 16 16'
      aria-hidden
      className='h-4 w-4 animate-spin text-muted-foreground [animation-duration:0.7s] motion-reduce:animate-none'>
      <circle cx='8' cy='8' r='6' fill='none' strokeWidth='2' className='stroke-current opacity-25' />
      <path
        d='M8 2a6 6 0 0 1 6 6'
        fill='none'
        strokeWidth='2'
        strokeLinecap='round'
        className='stroke-foreground'
      />
    </svg>
  )
}
