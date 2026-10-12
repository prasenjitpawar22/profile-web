'use client'

import { useIsMac } from '@/hooks/use-is-mac'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, RotateCcw, Undo2, X } from 'lucide-react'
import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

/* ============================================================
   AI edit review — an AI rewrite you review change by change,
   inline, instead of having it replace your text wholesale.
   A toolbar follows the active suggestion; Enter accepts,
   Backspace rejects, arrows move, ⌘Z undoes.
   ============================================================ */

type Hunk = { id: string; before: string; after: string; reason: string }
type Decision = 'accepted' | 'rejected'

const SEGMENTS: (string | Hunk)[] = [
  {
    id: 'lead',
    before: 'We are very excited to announce that our new feature is now available for all of the users',
    after: 'Our new export feature is now live for everyone',
    reason: 'Lead with the news',
  },
  '. It ',
  {
    id: 'verb',
    before: 'allows you to be able to export',
    after: 'lets you export',
    reason: 'Cut the filler',
  },
  ' your reports ',
  {
    id: 'speed',
    before: 'in a faster way than before',
    after: 'up to 3× faster',
    reason: 'Be specific',
  },
  ', and it ',
  {
    id: 'csv',
    before: 'also has support for',
    after: 'supports',
    reason: 'Simpler verb',
  },
  ' CSV files.',
]

const HUNKS = SEGMENTS.filter((s): s is Hunk => typeof s !== 'string')

// The losing half fades out first, then the sentence closes up around it
const LEAVE_MS = 160
const BULK_GAP_MS = 90

const ease = [0.23, 1, 0.32, 1] as const

export function AiEditReview() {
  const reduceMotion = useReducedMotion() ?? false
  const isMac = useIsMac()
  const [decisions, setDecisions] = useState<Partial<Record<string, Decision>>>({})
  // Decided but still fading its losing half out
  const [leaving, setLeaving] = useState<Partial<Record<string, Decision>>>({})
  const [history, setHistory] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(HUNKS[0].id)
  // Bumped per decision so the kept text flashes on each change, not just once
  const [flash, setFlash] = useState<Partial<Record<string, number>>>({})

  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const isPending = useCallback(
    (id: string, d = decisions, l = leaving) => !d[id] && !l[id],
    [decisions, leaving],
  )
  const pendingIds = HUNKS.filter((h) => isPending(h.id)).map((h) => h.id)
  const reviewed = HUNKS.length - pendingIds.length
  const allDone = HUNKS.every((h) => decisions[h.id])
  const acceptedCount = HUNKS.filter((h) => decisions[h.id] === 'accepted').length

  function nextPending(fromId: string, dir: 1 | -1, skip: string[] = []) {
    const ids = HUNKS.map((h) => h.id)
    const start = ids.indexOf(fromId)
    for (let step = 1; step <= ids.length; step++) {
      const id = ids[(start + dir * step + ids.length * 2) % ids.length]
      if (isPending(id) && !skip.includes(id)) return id
    }
    return null
  }

  // Focus requests are applied after the next render, when the target exists:
  // an undone suggestion only becomes focusable once it's pending again
  const pendingFocus = useRef<string | null>(null)
  useEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    const target =
      id === '*'
        ? textRef.current
        : textRef.current?.querySelector<HTMLElement>(`[data-hunk="${id}"]`)
    if (target) {
      target.focus()
      pendingFocus.current = null
    }
  })

  function focusHunk(id: string | null) {
    setActiveId(id)
    // Only move focus if it's already inside the demo; never steal it from the page.
    // With nothing left to review, focus rests on the paragraph instead of falling to <body>.
    if (rootRef.current?.contains(document.activeElement)) pendingFocus.current = id ?? '*'
  }

  function decide(id: string, decision: Decision, moveOn = true) {
    if (!isPending(id)) return
    const commit = () => {
      setLeaving((l) => {
        const next = { ...l }
        delete next[id]
        return next
      })
      setDecisions((d) => ({ ...d, [id]: decision }))
      setFlash((f) => ({ ...f, [id]: (f[id] ?? 0) + 1 }))
    }
    setHistory((h) => [...h, id])
    if (moveOn) focusHunk(nextPending(id, 1, [id]))
    if (reduceMotion) {
      commit()
      return
    }
    setLeaving((l) => ({ ...l, [id]: decision }))
    timers.current.push(window.setTimeout(commit, LEAVE_MS))
  }

  function decideAll(decision: Decision) {
    pendingIds.forEach((id, i) =>
      timers.current.push(window.setTimeout(() => decide(id, decision, false), i * BULK_GAP_MS)),
    )
    setActiveId(null)
  }

  function undo() {
    const id = history[history.length - 1]
    if (!id || !decisions[id]) return
    setHistory((h) => h.slice(0, -1))
    setDecisions((d) => {
      const next = { ...d }
      delete next[id]
      return next
    })
    focusHunk(id)
  }

  function reset() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setDecisions({})
    setLeaving({})
    setHistory([])
    setFlash({})
    setActiveId(HUNKS[0].id)
  }

  function onHunkKeyDown(e: KeyboardEvent<HTMLElement>, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      decide(id, 'accepted')
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      decide(id, 'rejected')
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusHunk(nextPending(id, 1) ?? id)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusHunk(nextPending(id, -1) ?? id)
    }
  }

  function onRootKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      undo()
    }
  }

  // The toolbar follows the active suggestion. Measured from the first line
  // box, so a suggestion that wraps still gets its toolbar at the start.
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const showToolbar = activeId !== null && isPending(activeId)

  useLayoutEffect(() => {
    const measure = () => {
      const text = textRef.current
      const el = activeId
        ? text?.querySelector<HTMLElement>(`[data-hunk="${activeId}"]`)
        : null
      if (!text || !el) return setAnchor(null)
      const box = el.getClientRects()[0]
      const frame = text.getBoundingClientRect()
      const half = (toolbarRef.current?.offsetWidth ?? 0) / 2
      const x = box.left - frame.left + box.width / 2
      setAnchor({
        // Kept inside the card even when the suggestion sits at an edge
        x: Math.min(Math.max(x, half), frame.width - half),
        y: box.top - frame.top,
      })
    }
    measure()
    // Measure again once the toolbar has mounted, so its real width is known
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [activeId, decisions, leaving, showToolbar])

  const activeHunk = HUNKS.find((h) => h.id === activeId)

  return (
    <div
      ref={rootRef}
      onKeyDown={onRootKeyDown}
      className='w-full max-w-[440px] rounded-xl border bg-background shadow-sm'>
      <div className='flex items-center justify-between gap-3 border-b px-3 py-2 text-xs'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <span className='font-medium text-foreground'>Suggested edits</span>
          {/* One pip per suggestion, filling as each is reviewed */}
          <span aria-hidden className='flex gap-1'>
            {HUNKS.map((h) => (
              <span
                key={h.id}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors duration-200',
                  decisions[h.id] === 'accepted' || leaving[h.id] === 'accepted'
                    ? 'bg-grass'
                    : decisions[h.id] || leaving[h.id]
                      ? 'bg-muted-foreground/50'
                      : 'bg-border',
                )}
              />
            ))}
          </span>
          <span className='sr-only' aria-live='polite'>
            {allDone
              ? `Review finished. ${acceptedCount} of ${HUNKS.length} changes applied.`
              : `${reviewed} of ${HUNKS.length} reviewed`}
          </span>
        </div>

        <div className='flex items-center gap-1'>
          {history.length ? (
            <TextButton onClick={undo} label='Undo last decision'>
              <Undo2 />
            </TextButton>
          ) : null}
          {allDone ? (
            <TextButton onClick={reset}>
              <RotateCcw />
              Start over
            </TextButton>
          ) : (
            <>
              <TextButton onClick={() => decideAll('rejected')}>Reject all</TextButton>
              <TextButton onClick={() => decideAll('accepted')}>Accept all</TextButton>
            </>
          )}
        </div>
      </div>

      {/* Top padding leaves room for the toolbar above the first line */}
      <div className='relative px-4 pb-4 pt-12'>
        <div
          ref={textRef}
          role='group'
          tabIndex={-1}
          aria-label='Paragraph with suggested edits'
          className='relative text-sm leading-7 text-foreground outline-none'>
          {SEGMENTS.map((seg, i) =>
            typeof seg === 'string' ? (
              <span key={i}>{seg}</span>
            ) : (
              <HunkView
                key={seg.id}
                hunk={seg}
                decision={decisions[seg.id]}
                leaving={leaving[seg.id]}
                flash={flash[seg.id] ?? 0}
                active={seg.id === activeId}
                onSelect={() => setActiveId(seg.id)}
                onKeyDown={(e) => onHunkKeyDown(e, seg.id)}
              />
            ),
          )}

          <AnimatePresence>
            {showToolbar && anchor && activeHunk ? (
              <motion.div
                key='toolbar'
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, x: anchor.x, y: anchor.y }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{
                  opacity: { duration: 0.15, ease },
                  scale: { duration: 0.15, ease },
                  // Glides between suggestions rather than jumping
                  x: reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0 },
                  y: reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0 },
                }}
                // The box sits at the anchor and the toolbar is drawn above it,
                // so this origin is the toolbar's bottom centre: it grows from
                // the suggestion it points at
                style={{ x: anchor.x, y: anchor.y, transformOrigin: '0px -6px' }}
                className='pointer-events-none absolute left-0 top-0 z-20'>
                <div
                  ref={toolbarRef}
                  className='pointer-events-auto flex -translate-x-1/2 -translate-y-[calc(100%+6px)] items-center gap-1 whitespace-nowrap rounded-lg border bg-popover p-1 text-xs shadow-md'>
                  <span className='relative px-1.5 text-muted-foreground'>
                    <AnimatePresence initial={false} mode='popLayout'>
                      <motion.span
                        key={activeHunk.reason}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className='block'>
                        {activeHunk.reason}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span aria-hidden className='h-4 w-px bg-border' />
                  <ToolbarButton
                    onClick={() => decide(activeHunk.id, 'accepted')}
                    label='Accept'
                    keyHint='⏎'
                    tone='accept'>
                    <Check />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => decide(activeHunk.id, 'rejected')}
                    label='Reject'
                    keyHint='⌫'
                    tone='reject'>
                    <X />
                  </ToolbarButton>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <p className='mt-4 text-xs text-muted-foreground/80'>
          <Kbd>⏎</Kbd> accept · <Kbd>⌫</Kbd> reject · <Kbd>←</Kbd>
          <Kbd>→</Kbd> move · <Kbd>{isMac ? '⌘Z' : 'Ctrl Z'}</Kbd> undo
        </p>
      </div>
    </div>
  )
}

function HunkView({
  hunk,
  decision,
  leaving,
  flash,
  active,
  onSelect,
  onKeyDown,
}: {
  hunk: Hunk
  decision?: Decision
  leaving?: Decision
  flash: number
  active: boolean
  onSelect: () => void
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void
}) {
  if (decision) {
    const kept = decision === 'accepted' ? hunk.after : hunk.before
    return (
      // Keyed by the flash count so the highlight replays on every decision
      <span
        key={flash}
        className={decision === 'accepted' ? 'flash-accept rounded-[3px]' : 'flash-reject rounded-[3px]'}>
        {kept}
      </span>
    )
  }

  // Inline span, not a button: a button is an atomic box and would refuse to wrap
  return (
    <span
      role='button'
      tabIndex={active ? 0 : -1}
      data-hunk={hunk.id}
      aria-label={`Suggestion: replace “${hunk.before}” with “${hunk.after}”. Enter to accept, Backspace to reject.`}
      onClick={onSelect}
      onFocus={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'cursor-pointer rounded-[4px] outline-none transition-shadow duration-150 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
        active
          ? 'shadow-[0_0_0_2px_hsl(var(--ring)/0.45)]'
          : 'hover:shadow-[0_0_0_1px_hsl(var(--border))]',
      )}>
      <del
        className={cn(
          'rounded-[3px] bg-red-500/10 px-0.5 text-muted-foreground decoration-red-500/50 transition-[opacity,filter] duration-150 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
          leaving === 'accepted' && 'opacity-0 blur-[2px]',
        )}>
        {hunk.before}
      </del>{' '}
      <ins
        className={cn(
          'rounded-[3px] bg-grass/15 px-0.5 no-underline transition-[opacity,filter] duration-150 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
          leaving === 'rejected' && 'opacity-0 blur-[2px]',
        )}>
        {hunk.after}
      </ins>
    </span>
  )
}

function ToolbarButton({
  onClick,
  label,
  keyHint,
  tone,
  children,
}: {
  onClick: () => void
  label: string
  keyHint: string
  tone: 'accept' | 'reject'
  children: ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      // Mouse users keep focus on the suggestion, so the keys keep working
      onMouseDown={(e) => e.preventDefault()}
      tabIndex={-1}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none [&_svg]:h-3.5 [&_svg]:w-3.5',
        tone === 'accept'
          ? 'text-grass hover:bg-grass/10'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}>
      {children}
      {label}
      <span aria-hidden className='text-[10px] text-muted-foreground/70'>
        {keyHint}
      </span>
    </button>
  )
}

function TextButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label?: string
  children: ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
      className='inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none [&_svg]:h-3.5 [&_svg]:w-3.5'>
      {children}
    </button>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className='mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground'>
      {children}
    </kbd>
  )
}
