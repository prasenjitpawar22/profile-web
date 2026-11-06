'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { Fragment, ReactNode, useEffect, useRef, useState } from 'react'

// The demo's script: a question about the reader's own project, and the work an agent
// does to answer it. It reads code, searches the repo, then goes to the web.

export const ease = [0.23, 1, 0.32, 1] as const

const QUESTION = 'Why does my accordion jump when it opens?'

export type CodeLine = { n: number; text: string; hit?: boolean }
export type Detail =
  | { kind: 'code'; lines: CodeLine[] }
  | { kind: 'matches'; files: { path: string; lines: CodeLine[] }[] }
  | { kind: 'results'; items: { domain: string; title: string; kept: boolean }[] }
  | { kind: 'page'; title: string; gist: string }

export type Action = {
  id: string
  verb: string
  /** What it acted on. Paths and patterns are set in mono */
  target: string
  mono?: boolean
  meta?: string
  ms: number
  detail?: Detail
}

export const ACTIONS: Action[] = [
  {
    id: 'read-accordion',
    verb: 'Read',
    target: 'components/accordion.tsx',
    mono: true,
    meta: '34–42',
    ms: 3000,
    detail: {
      kind: 'code',
      lines: [
        { n: 34, text: 'export function Panel({ open, children }: PanelProps) {' },
        { n: 35, text: '  return (' },
        { n: 36, text: '    <div' },
        { n: 37, text: '      className="overflow-hidden transition-[max-height] duration-300"' },
        { n: 38, text: '      style={{ maxHeight: open ? 1000 : 0 }}', hit: true },
        { n: 39, text: '    >' },
        { n: 40, text: '      {children}' },
        { n: 41, text: '    </div>' },
        { n: 42, text: '  )' },
      ],
    },
  },
  {
    id: 'search-code',
    verb: 'Search',
    target: 'max-height|maxHeight',
    mono: true,
    meta: '4 matches',
    ms: 2600,
    detail: {
      kind: 'matches',
      files: [
        {
          path: 'components/accordion.tsx',
          lines: [
            { n: 37, text: 'className="overflow-hidden transition-[max-height] duration-300"' },
            { n: 38, text: 'style={{ maxHeight: open ? 1000 : 0 }}' },
          ],
        },
        { path: 'components/faq-item.tsx', lines: [{ n: 21, text: 'style={{ maxHeight: expanded ? 800 : 0 }}' }] },
        { path: 'app/globals.css', lines: [{ n: 129, text: 'transition: max-height 300ms ease;' }] },
      ],
    },
  },
  {
    id: 'read-globals',
    verb: 'Read',
    target: 'app/globals.css',
    mono: true,
    meta: '122–130',
    ms: 2400,
    detail: {
      kind: 'code',
      lines: [
        { n: 122, text: ':root {' },
        { n: 123, text: '  --radius: 0.5rem;' },
        { n: 124, text: '}' },
        { n: 125, text: '' },
        { n: 126, text: '/* Shared by every disclosure */' },
        { n: 127, text: '.collapsible {' },
        { n: 128, text: '  overflow: hidden;' },
        { n: 129, text: '  transition: max-height 300ms ease;', hit: true },
        { n: 130, text: '}' },
      ],
    },
  },
  {
    id: 'web-search',
    verb: 'Web search',
    target: 'animate height auto css',
    meta: '6 results',
    ms: 3000,
    detail: {
      kind: 'results',
      items: [
        { domain: 'developer.mozilla.org', title: 'interpolate-size', kept: true },
        { domain: 'css-tricks.com', title: 'The 0fr to 1fr grid trick', kept: true },
        { domain: 'web.dev', title: 'Animate to height: auto', kept: false },
        { domain: 'stackoverflow.com', title: 'CSS transition height auto', kept: false },
        { domain: 'medium.com', title: 'Smooth accordions in React', kept: false },
        { domain: 'dev.to', title: 'Stop animating max-height', kept: false },
      ],
    },
  },
  {
    id: 'fetch-mdn',
    verb: 'Fetch',
    target: 'MDN: interpolate-size',
    ms: 3000,
    detail: {
      kind: 'page',
      title: 'developer.mozilla.org',
      gist: 'With allow-keywords on the root, transitions can run to and from sizing keywords such as auto.',
    },
  },
  {
    id: 'fetch-tricks',
    verb: 'Fetch',
    target: 'CSS-Tricks: 0fr to 1fr',
    ms: 2400,
    detail: {
      kind: 'page',
      title: 'css-tricks.com',
      gist: 'Transition grid-template-rows on a wrapper. It works where keyword sizes can’t animate yet.',
    },
  },
  { id: 'write', verb: 'Write', target: 'the answer', ms: 1800 },
]

/** Where each action sits in the star's four moods, and how many pages it has opened */
export const moodOf = (step: number) => [0, 0, 1, 1, 2, 2, 3][Math.min(Math.max(step, 0), 6)]
export const pagesOpened = (step: number) => ACTIONS.slice(0, Math.max(step, 0)).filter((a) => a.detail?.kind === 'page').length

const STARTS = ACTIONS.reduce<number[]>((acc, a, i) => [...acc, i === 0 ? 0 : acc[i - 1] + ACTIONS[i - 1].ms], [])
const TOTAL_MS = ACTIONS.reduce((sum, a) => sum + a.ms, 0)

// The answer, one sentence at a time, each tied to the work behind it.
// Backticks mark inline code; a code span streams in as one token
export const SENTENCES: { text: string; from: string[] }[] = [
  {
    text: 'It jumps because `maxHeight: 1000` in `accordion.tsx` animates toward a height your content never reaches, so the motion runs out early.',
    from: ['read-accordion', 'search-code'],
  },
  {
    text: 'Add `interpolate-size: allow-keywords` to `:root` in `globals.css`, then transition `height` to `auto` instead.',
    from: ['fetch-mdn', 'read-globals'],
  },
  {
    text: 'Where that isn’t supported yet, transition `grid-template-rows` from `0fr` to `1fr` on a wrapper.',
    from: ['fetch-tricks'],
  },
]
const ANSWER_PLAIN = SENTENCES.map((s) => s.text.replace(/`/g, '')).join(' ')

type Part = { text: string; code: boolean }
type Token = { parts: Part[]; s: number }
const TOKENS: Token[] = (() => {
  const out: Token[] = []
  SENTENCES.forEach((sent, s) => {
    let first = true
    sent.text.replace(/(\s*)(`[^`]+`|[^\s`]+)/g, (_, ws: string, raw: string) => {
      const part = { text: raw.replace(/`/g, ''), code: raw.startsWith('`') }
      if (ws.length > 0 || first) out.push({ parts: [part], s })
      else out[out.length - 1].parts.push(part)
      first = false
      return ''
    })
  })
  return out
})()
const tokenText = (t: Token) => t.parts.map((p) => p.text).join('')

type Phase = 'idle' | 'thinking' | 'answering' | 'complete'

/** The run's clock: actions start and finish in turn, then the answer may start */
export function useRun(started: boolean) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState(-1)
  const [elapsed, setElapsed] = useState(0)
  const [thoughtFor, setThoughtFor] = useState(0)
  const startedAt = useRef(0)

  useEffect(() => {
    if (!started) return
    const timers: number[] = []
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    const lead = 450
    // Time for the star to close before the answer starts
    const answerDelayMs = 700
    later(lead, () => {
      startedAt.current = performance.now()
      setPhase('thinking')
      setStep(0)
    })
    const clock = window.setInterval(() => {
      if (startedAt.current) setElapsed((performance.now() - startedAt.current) / 1000)
    }, 100)
    ACTIONS.forEach((a, i) => later(lead + STARTS[i] + a.ms, () => setStep(i + 1)))
    later(lead + TOTAL_MS, () => {
      window.clearInterval(clock)
      setThoughtFor(Math.max(1, Math.round((performance.now() - startedAt.current) / 1000)))
    })
    later(lead + TOTAL_MS + answerDelayMs, () => setPhase('answering'))
    return () => {
      timers.forEach(clearTimeout)
      window.clearInterval(clock)
    }
  }, [started])

  const settled = step >= ACTIONS.length
  return {
    phase,
    step,
    elapsed,
    thoughtFor,
    settled,
    finish: () => setPhase('complete'),
  }
}

/**
 * The answer, streamed in uneven bursts of one to three tokens with pauses
 * at punctuation. Every token is laid out from the start, so nothing
 * reflows. Sentences are their own spans, so each can be traced to its work.
 */
export function Answer({
  reduceMotion,
  onDone,
  sentenceClass,
  onSentenceHover,
  pickable,
  pinned,
  onSentencePick,
}: {
  reduceMotion: boolean
  onDone: () => void
  sentenceClass?: (s: number) => string | undefined
  onSentenceHover?: (s: number | null) => void
  /** Once the answer is whole, its sentences can be traced */
  pickable: boolean
  pinned: number | null
  onSentencePick: (s: number) => void
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
      {count === 0 ? <Caret /> : null}
      {SENTENCES.map((_, s) => (
        <Fragment key={s}>
          {s > 0 ? ' ' : null}
          <span
            {...(pickable
              ? {
                  role: 'button',
                  tabIndex: 0,
                  'aria-pressed': pinned === s,
                  onMouseEnter: () => onSentenceHover?.(s),
                  onMouseLeave: () => onSentenceHover?.(null),
                  onClick: () => {
                    // Selecting text to copy it isn't a pick
                    if (window.getSelection()?.isCollapsed !== false) onSentencePick(s)
                  },
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSentencePick(s)
                    }
                  },
                }
              : {})}
            className={cn(
              'rounded-[3px] transition-colors duration-150 [box-decoration-break:clone]',
              pickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              sentenceClass?.(s),
            )}>
            {TOKENS.map((token, i) =>
              token.s !== s ? null : (
                <Fragment key={i}>
                  {i > 0 && TOKENS[i - 1].s === s ? ' ' : null}
                  <span className={cn('inline-block', i < count ? 'word-in' : 'opacity-0')}>
                    {token.parts.map((part, j) =>
                      part.code ? (
                        <code key={j} className='rounded-[5px] bg-muted px-1 py-px font-mono text-[0.8125rem]'>
                          {part.text}
                        </code>
                      ) : (
                        <Fragment key={j}>{part.text}</Fragment>
                      ),
                    )}
                  </span>
                  {streaming && i === count - 1 ? <Caret /> : null}
                </Fragment>
              ),
            )}
          </span>
        </Fragment>
      ))}
    </p>
  )
}

/** Rides at the end of the streamed text. Zero width, so it never reflows a line */
function Caret() {
  return (
    <span aria-hidden className='relative inline-block h-[1em] w-0 align-[-0.15em]'>
      <span className='absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-foreground' />
    </span>
  )
}

/** The one accent moment in the run: thinking is done */
export function SettledBadge({ draw }: { draw: boolean }) {
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

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
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

export function CopyButton({ reduceMotion }: { reduceMotion: boolean }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])
  return (
    <>
      <IconButton
        label={copied ? 'Copied' : 'Copy answer'}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(ANSWER_PLAIN)
            setCopied(true)
          } catch {
            // Clipboard can be blocked; stay quiet
          }
        }}>
        <span className='relative grid h-3.5 w-3.5 place-items-center'>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.span
              key={copied ? 'copied' : 'copy'}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: 'blur(2px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: 'blur(2px)' }}
              transition={{ duration: 0.15, ease }}
              className='grid place-items-center'>
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

/** One clean announcement per beat for screen readers, whatever the visuals do */
export function LiveStatus({ phase, step, settled, thoughtFor }: { phase: Phase; step: number; settled: boolean; thoughtFor: number }) {
  const now = ACTIONS[Math.min(Math.max(step, 0), ACTIONS.length - 1)]
  const text =
    phase === 'complete' ? 'Answer ready' : settled ? `Thought for ${thoughtFor} seconds` : step >= 0 ? `${now.verb} ${now.target}` : ''
  return (
    <span className='sr-only' aria-live='polite'>
      {text}
    </span>
  )
}

export function QuestionBubble() {
  return (
    <p className='relative max-w-[85%] self-end rounded-2xl rounded-br-md border bg-background px-3.5 py-2 text-sm shadow-sm'>{QUESTION}</p>
  )
}
