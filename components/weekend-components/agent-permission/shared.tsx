'use client'

import { ChevronRight, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { AgentOrb, ORB_LOCKUP } from '../agent-states/agent-orb'
import { useRunOrbState } from '../agent-states/use-run-orb-state'
import { ICON_STROKE, TaskIcon } from './task-icon'
import {
  ButtonHTMLAttributes,
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

const ease = [0.23, 1, 0.32, 1] as const
const OPEN = { duration: 0.34, ease: [0.32, 0.72, 0, 1] as const }
const CLOSE = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }

const QUESTION = 'Fix the accordion jump and ship it.'

export type Ask = {
  risk: 'low' | 'high'
  why: string
  command: string
  allow: string
  always?: string
  deny: string
  result: string
}

export type CodeLine = { n: number; text: string; hit?: boolean }
export type DiffLine = { kind: ' ' | '+' | '-'; text: string }

/** What a task is looking at or producing, shown under its row */
export type Detail =
  | { kind: 'code'; lines: CodeLine[] }
  | { kind: 'matches'; files: { path: string; lines: CodeLine[] }[] }
  | { kind: 'diff'; lines: DiffLine[] }
  | { kind: 'output'; lines: string[] }

export type Step = {
  id: string
  verb: string
  target: string
  meta?: string
  ms: number
  ask?: Ask
  detail?: Detail
}

export const COMMITS = [
  { sha: 'a91f3c2', message: 'Transition height instead of max-height' },
  { sha: '7bd04e1', message: 'Enable interpolate-size on :root' },
  {
    sha: 'e20c9aa',
    message:
      'Add a grid fallback for older browsers and keep the accordion from jumping on first open',
  },
]

export const STEPS: Step[] = [
  {
    id: 'read',
    verb: 'Read',
    target: 'components/accordion.tsx',
    meta: '34–42',
    ms: 2400,
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
    id: 'search',
    verb: 'Search',
    target: 'max-height|maxHeight',
    meta: '4 matches',
    ms: 2200,
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
    id: 'edit-a',
    verb: 'Edit',
    target: 'components/accordion.tsx',
    meta: '+3 −2',
    ms: 2400,
    detail: {
      kind: 'diff',
      lines: [
        { kind: '-', text: 'className="overflow-hidden transition-[max-height] duration-300"' },
        { kind: '-', text: 'style={{ maxHeight: open ? 1000 : 0 }}' },
        { kind: '+', text: 'className="grid transition-[grid-template-rows] duration-300"' },
        { kind: '+', text: "style={{ gridTemplateRows: open ? '1fr' : '0fr' }}" },
        { kind: ' ', text: '>' },
        { kind: '+', text: '  <div className="overflow-hidden">{children}</div>' },
      ],
    },
  },
  {
    id: 'edit-b',
    verb: 'Edit',
    target: 'app/globals.css',
    meta: '+2 −1',
    ms: 1800,
    detail: {
      kind: 'diff',
      lines: [
        { kind: ' ', text: '.collapsible {' },
        { kind: '-', text: '  transition: max-height 300ms ease;' },
        { kind: '+', text: '  display: grid;' },
        { kind: '+', text: '  transition: grid-template-rows 300ms ease;' },
        { kind: ' ', text: '}' },
      ],
    },
  },
  {
    id: 'test',
    verb: 'Run',
    target: 'pnpm test accordion',
    ms: 2600,
    detail: {
      kind: 'output',
      lines: [
        'PASS  components/accordion.test.tsx',
        '  ✓ opens to the height of its content (41 ms)',
        '  ✓ closes without jumping (38 ms)',
        '  ✓ keeps focus on the trigger (12 ms)',
        'Tests:  24 passed, 24 total',
      ],
    },
    ask: {
      risk: 'low',
      why: 'Runs your tests on this machine. Nothing leaves it.',
      command:
        'pnpm test --filter @acme/ui -- components/accordion.test.tsx --runInBand --coverage=false',
      allow: 'Run once',
      always: 'Always allow',
      deny: 'Skip',
      result: '24 passed',
    },
  },
  {
    id: 'push',
    verb: 'Run',
    target: 'git push origin main',
    ms: 2200,
    detail: {
      kind: 'output',
      lines: [
        'Enumerating objects: 9, done.',
        'Writing objects: 100% (9/9), 1.24 KiB | 1.24 MiB/s, done.',
        'To github.com:acme/ui.git',
        '   d9ec7db..e20c9aa  main -> main',
      ],
    },
    ask: {
      risk: 'high',
      why: 'Sends 3 commits to main. Vercel deploys main to production straight away.',
      command: 'git push origin main',
      allow: 'Push to main',
      deny: 'Don’t push',
      result: '3 commits',
    },
  },
]

export type Decision = 'once' | 'always' | 'deny'
type Status = 'done' | 'denied' | 'running' | 'waiting'

// The Lab is one long page of demos: a key press only belongs to this one if you're in it
const engaged = (root: HTMLElement | null) =>
  !!root && (root.contains(document.activeElement) || root.matches(':hover'))

export function useAgent({
  started,
  quickAllow = () => true,
}: {
  started: boolean
  quickAllow?: (ask: Ask) => boolean
}) {
  const [i, setI] = useState(-1)
  const [stage, setStage] = useState<'ask' | 'run'>('run')
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  // What you typed, by the step it replaced
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [steps, setSteps] = useState(STEPS)
  const stepsRef = useRef(STEPS)
  const [elapsed, setElapsed] = useState(0)
  const [waited, setWaited] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const enter = useCallback((n: number) => {
    setI(n)
    setWaited(0)
    setStage(stepsRef.current[n]?.ask ? 'ask' : 'run')
  }, [])

  const phase =
    i < 0 ? 'starting' : i >= steps.length ? 'done' : stage === 'ask' ? 'waiting' : 'working'
  const waiting = phase === 'waiting' ? steps[i] : null

  // A panel that's collapsing still shows its buttons for a moment; they must do nothing
  const live = useRef<{ i: number; step: Step | null }>({ i, step: waiting })
  live.current = { i, step: waiting }

  useEffect(() => {
    if (!started || phase === 'done' || phase === 'waiting') return
    const next = i + 1
    const t = window.setTimeout(() => enter(next), i < 0 ? 500 : stepsRef.current[i].ms)
    return () => clearTimeout(t)
  }, [started, i, phase, enter])

  useEffect(() => {
    if (phase === 'done' || phase === 'starting') return
    const id = window.setInterval(() => {
      if (phase === 'waiting') setWaited((w) => w + 0.25)
      else setElapsed((e) => e + 0.25)
    }, 250)
    return () => clearInterval(id)
  }, [phase])

  const decide = useCallback(
    (d: Decision, text = '') => {
      const { i: at, step } = live.current
      if (!step) return
      setDecisions((was) => ({ ...was, [step.id]: d }))
      if (text) {
        // What you typed becomes the agent's next piece of work, in the trace like any other
        setNotes((was) => ({ ...was, [step.id]: text }))
        const next = [...stepsRef.current]
        next.splice(at + 1, 0, { id: `instead-${step.id}`, verb: 'Instead', target: text, meta: 'Your call', ms: 1500 })
        stepsRef.current = next
        setSteps(next)
      }
      // The button that had focus is about to go away
      rootRef.current?.focus({ preventScroll: true })
      if (d === 'deny') enter(at + 1)
      else setStage('run')
    },
    [enter],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey || !engaged(rootRef.current)) return
      const ask = live.current.step?.ask
      if (!ask) return
      const k = e.key.toLowerCase()
      if (k === 'n') decide('deny')
      else if (k === 'y' && quickAllow(ask)) decide('once')
      else if (k === 'a' && ask.always) decide('always')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [decide, quickAllow])

  const statusOf = (n: number): Status => {
    if (n === i) return stage === 'ask' ? 'waiting' : 'running'
    return decisions[steps[n].id] === 'deny' ? 'denied' : 'done'
  }

  return { rootRef, started, i, phase, steps, waiting, decisions, notes, elapsed, waited, decide, statusOf }
}

export type Agent = ReturnType<typeof useAgent>

function metaFor(step: Step, status: Status, decision?: Decision, redirected?: boolean) {
  if (!step.ask) return step.meta
  if (status === 'waiting') return 'Needs you'
  if (status === 'denied') return redirected ? 'You changed this' : 'You denied this'
  const allowed = decision === 'always' ? 'Always allowed' : 'You allowed this'
  return status === 'running' ? allowed : `${decision === 'always' ? 'Always allowed' : 'Allowed'} · ${step.ask.result}`
}

/** The answer, one sentence at a time, each tied to the work behind it */
function sentencesFor(agent: Agent): { text: string; from: string[] }[] {
  const { decisions, notes } = agent
  const tests =
    decisions.test !== 'deny'
      ? 'All 24 tests pass.'
      : notes.test
        ? `I didn’t run the tests. Instead, as you asked: “${notes.test}”.`
        : 'I didn’t run the tests, because you skipped them.'
  const push =
    decisions.push !== 'deny'
      ? 'The 3 commits are on main and deploying.'
      : notes.push
        ? `I didn’t push, so nothing went to production. Instead, as you asked: “${notes.push}”.`
        : 'The 3 commits are still local. Nothing went to production.'
  return [
    {
      text: 'The accordion now animates grid rows instead of a fixed max-height, so it no longer runs out of motion early.',
      from: ['edit-a', 'edit-b', 'read', 'search'],
    },
    { text: tests, from: ['test', 'instead-test'] },
    { text: push, from: ['push', 'instead-push'] },
  ]
}

type Sentence = ReturnType<typeof sentencesFor>[number]

function TracedAnswer({
  sentences,
  pinned,
  inFocus,
  onHover,
  onPick,
  onReplay,
}: {
  sentences: Sentence[]
  pinned: number | null
  inFocus: (s: number) => boolean
  onHover: (s: number | null) => void
  onPick: (s: number) => void
  onReplay: () => void
}) {
  return (
    <div className='mt-4 flex flex-col gap-3 border-t pt-4'>
      <p className='perm-t-body break-words [text-wrap:pretty]'>
        {sentences.map((sentence, s) => (
          <Fragment key={s}>
            {s > 0 ? ' ' : null}
            <span
              role='button'
              tabIndex={0}
              aria-pressed={pinned === s}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') onHover(s)
              }}
              onPointerLeave={() => onHover(null)}
              onClick={() => {
                // Selecting text to copy it isn't a pick
                if (window.getSelection()?.isCollapsed !== false) onPick(s)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPick(s)
                }
              }}
              className={`cursor-pointer rounded-[3px] transition-colors duration-150 [box-decoration-break:clone] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                inFocus(s) ? '' : 'text-muted-foreground'
              }`}>
              {sentence.text}
            </span>
          </Fragment>
        ))}
      </p>
      <div className='-ml-1.5 flex h-7 items-center gap-2'>
        <button
          type='button'
          onClick={onReplay}
          aria-label='Replay'
          title='Replay'
          className='relative grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out before:absolute before:-inset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] motion-reduce:active:scale-100 [@media(hover:hover)]:hover:bg-foreground/[0.06] [@media(hover:hover)]:hover:text-foreground'>
          <RotateCcw aria-hidden strokeWidth={ICON_STROKE} className='h-3.5 w-3.5' />
        </button>
        <span className='perm-t-small grid text-muted-foreground'>
          <Swap id={pinned !== null ? 'clear' : 'trace'}>
            {pinned !== null ? 'Select it again to clear' : 'Select a sentence to trace it'}
          </Swap>
        </span>
      </div>
    </div>
  )
}

// ---- things that arrive -------------------------------------------------------------

/** How far a raised card's edge and shadow reach past its box: 10px down + 24px blur − 8px spread */
const SHADOW_REACH = 26

// Clips only the edge that's growing. overflow-hidden would also cut anything painted outside
// the box, like a card's ring and shadow, at the sides
const clipBelow = (bleed: number) => `inset(0px -${SHADOW_REACH}px ${-bleed}px -${SHADOW_REACH}px)`

/**
 * Grows from zero so what's below starts where it is. Its content arrives nearly full size.
 * `raised` is for a card with a shadow: the bottom clip opens as it grows, so the shadow lands
 * with the card instead of appearing when it's done.
 */
export function Collapse({ raised = false, children }: { raised?: boolean; children: ReactNode }) {
  const reduce = useReducedMotion() ?? false
  const closed = clipBelow(0)
  const open = clipBelow(raised ? SHADOW_REACH : 0)
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { height: 0, clipPath: closed }}
      animate={reduce ? { opacity: 1 } : { height: 'auto', clipPath: open }}
      exit={reduce ? { opacity: 0 } : { height: 0, clipPath: closed, transition: CLOSE }}
      transition={OPEN}
      // flow-root keeps the content's margins inside the height being animated
      className='flow-root'
      style={{ clipPath: open }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -6, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.14 } }}
        transition={{ duration: 0.28, ease }}
        style={{ transformOrigin: 'top left' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

/** One line of text standing in for another */
export function Swap({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion() ?? false
  return (
    <AnimatePresence mode='popLayout' initial={false}>
      <motion.span
        key={id}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, transition: { duration: 0.14 } }}
        transition={{ duration: 0.24, ease }}
        className={className}>
        {children}
      </motion.span>
    </AnimatePresence>
  )
}

// ---- the transcript ----------------------------------------------------------------

/** Lines arrive one after another while the task runs, all at once when reopened */
function Arrive({ i, live, children }: { i: number; live: boolean; children: ReactNode }) {
  const reduce = useReducedMotion() ?? false
  if (!live || reduce) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease, delay: i * 0.16 }}>
      {children}
    </motion.div>
  )
}

function CodeRow({ line }: { line: CodeLine }) {
  return (
    <div className={`flex gap-3 whitespace-pre ${line.hit ? 'text-foreground' : 'text-muted-foreground'}`}>
      <span aria-hidden className='w-7 shrink-0 select-none text-right tabular-nums'>
        {line.n}
      </span>
      <span>{line.text || ' '}</span>
    </div>
  )
}

function DiffRow({ line }: { line: DiffLine }) {
  const look = line.kind === '+' ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground'
  return (
    <div className={`flex gap-2 whitespace-pre pr-2 ${look}`}>
      <span aria-hidden className='w-3 shrink-0 select-none text-center'>
        {line.kind === '+' ? '+' : line.kind === '-' ? '−' : ''}
      </span>
      <span className={line.kind === '-' ? 'line-through decoration-foreground/30' : undefined}>{line.text || ' '}</span>
    </div>
  )
}

function DetailView({ detail, live }: { detail: Detail; live: boolean }) {
  // Long lines scroll sideways rather than wrap, as code should
  const label =
    detail.kind === 'code'
      ? 'Lines it read'
      : detail.kind === 'matches'
        ? 'Matches it found'
        : detail.kind === 'diff'
          ? 'Changes it made'
          : 'Command output'
  return (
    <div
      tabIndex={0}
      role='group'
      aria-label={label}
      className='max-h-[188px] overflow-auto py-1 font-mono text-xs leading-5 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'>
      <div className={`w-max min-w-full ${detail.kind === 'matches' ? 'flex flex-col gap-2' : ''}`}>
        {detail.kind === 'code'
          ? detail.lines.map((line, i) => (
              <Arrive key={line.n} i={i} live={live}>
                <CodeRow line={line} />
              </Arrive>
            ))
          : null}
        {detail.kind === 'matches'
          ? detail.files.map((file, i) => (
              <Arrive key={file.path} i={i * 2} live={live}>
                <div>
                  <div className='text-foreground'>{file.path}</div>
                  {file.lines.map((line) => (
                    <CodeRow key={line.n} line={line} />
                  ))}
                </div>
              </Arrive>
            ))
          : null}
        {detail.kind === 'diff'
          ? detail.lines.map((line, i) => (
              <Arrive key={i} i={i} live={live}>
                <DiffRow line={line} />
              </Arrive>
            ))
          : null}
        {detail.kind === 'output'
          ? detail.lines.map((text, i) => (
              <Arrive key={i} i={i * 2} live={live}>
                <div className='whitespace-pre text-muted-foreground'>{text}</div>
              </Arrive>
            ))
          : null}
      </div>
    </div>
  )
}

function TraceRow({
  step,
  status,
  decision,
  redirected,
  dim,
  expand,
  byHand,
  onToggle,
  onHover,
}: {
  step: Step
  status: Status
  decision?: Decision
  redirected: boolean
  dim: boolean
  expand: ReactNode
  byHand: boolean
  onToggle: () => void
  onHover: (id: string | null) => void
}) {
  const reduce = useReducedMotion() ?? false
  const running = status === 'running'
  const waiting = status === 'waiting'
  const meta = metaFor(step, status, decision, redirected)
  // A denied step never ran, so it has nothing to show
  const hasDetail = !!step.detail && status !== 'denied' && !waiting
  const canOpen = hasDetail && !running
  // The task at work is always open; anything else opens by hand
  const showDetail = hasDetail && (running || byHand)
  const detailId = useId()
  const slash = step.target.lastIndexOf('/') + 1
  const isFile = slash > 0 && !step.target.includes(' ')
  return (
    <motion.li
      data-asking={expand ? '' : undefined}
      data-detail={showDetail || undefined}
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease }}
      className='scroll-mb-24 scroll-mt-6'>
      <button
        type='button'
        disabled={!canOpen}
        onClick={onToggle}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse' && canOpen) onHover(step.id)
        }}
        onPointerLeave={() => onHover(null)}
        aria-expanded={hasDetail ? showDetail : undefined}
        aria-controls={showDetail ? detailId : undefined}
        // Bleeds past the column so the hover shape has room without moving the row's contents
        className={`group/row -mx-2 flex h-10 w-[calc(100%+1rem)] touch-manipulation select-none items-center gap-2 rounded-lg px-2 text-left transition-[color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring enabled:active:bg-foreground/[0.07] md:h-8 [@media(hover:hover)]:enabled:hover:bg-foreground/[0.04] [@media(hover:hover)]:enabled:hover:text-foreground ${
          dim ? 'text-muted-foreground' : running || waiting || byHand ? 'text-foreground' : 'text-foreground/85'
        }`}>
        <TaskIcon
          verb={step.verb}
          running={running}
          denied={status === 'denied'}
          className={`h-3.5 w-3.5 shrink-0 transition-colors duration-200 ${
            running || waiting ? 'text-foreground' : 'text-muted-foreground'
          }`}
        />
        <span className={`perm-t-label w-[60px] shrink-0 font-medium ${running ? 'text-shimmer' : ''}`}>
          {step.verb}
        </span>
        <span
          className={`min-w-0 flex-1 truncate font-mono text-xs leading-[18px] ${status === 'denied' ? 'line-through decoration-foreground/40' : ''}`}
          title={step.target}>
          {isFile ? (
            <>
              {/* The filename is the part worth keeping when there's no room for the folder */}
              <span className='max-md:hidden'>{step.target.slice(0, slash)}</span>
              {step.target.slice(slash)}
            </>
          ) : (
            step.target
          )}
        </span>
        {meta ? (
          <span className='perm-t-small grid shrink-0 justify-items-end tabular-nums'>
            <Swap id={meta}>{meta}</Swap>
          </span>
        ) : null}
        {/* Always in the layout, so a row that becomes openable doesn't shift */}
        {/* Says what the row is doing now: pointing down whenever it's open, by hand or at work */}
        <ChevronRight
          aria-hidden
          strokeWidth={ICON_STROKE}
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-[opacity,transform,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none [@media(hover:hover)]:group-enabled/row:group-hover/row:text-foreground ${
            canOpen ? 'opacity-100' : running && hasDetail ? 'opacity-40' : 'opacity-0'
          } ${showDetail ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence>
        {showDetail && step.detail ? (
          <Collapse key='detail'>
            {/* The guide runs down from the centre of the row's icon; its contents line up with the verb */}
            <div id={detailId} className='mb-1.5 ml-[6.5px] border-l pl-[14.5px]'>
              <DetailView detail={step.detail} live={running} />
            </div>
          </Collapse>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {expand ? (
          <Collapse key='ask' raised>
            {expand}
          </Collapse>
        ) : null}
      </AnimatePresence>
    </motion.li>
  )
}

export function Frame({
  agent,
  renderWaiting,
  dim = false,
  onReplay,
}: {
  agent: Agent
  renderWaiting?: (step: Step) => ReactNode
  dim?: boolean
  onReplay: () => void
}) {
  const { phase, waiting, i } = agent
  const rows = agent.steps.slice(0, Math.max(i + 1, 0))
  const done = phase === 'done'
  const orb = useRunOrbState({ started: agent.started, phase, verb: agent.steps[i]?.verb })
  const reduce = useReducedMotion() ?? false
  // A finished row opened by hand
  const [openId, setOpenId] = useState<string | null>(null)

  // The sentence being traced, and what the cursor is resting on
  const [pinned, setPinned] = useState<number | null>(null)
  const [hoverS, setHoverS] = useState<number | null>(null)
  const [hoverRow, setHoverRow] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const sentences = done ? sentencesFor(agent) : []

  useEffect(() => {
    if (openId === null && pinned === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !engaged(agent.rootRef.current)) return
      setOpenId(null)
      setPinned(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openId, pinned, agent.rootRef])

  const toggleRow = (id: string) => {
    setPinned(null)
    setOpenId((was) => (was === id ? null : id))
  }
  const traceSentence = (s: number) => {
    if (pinned === s) {
      setPinned(null)
      setOpenId(null)
      return
    }
    setPinned(s)
    // A step that was denied never ran, so there may be nothing to open
    const row = sentences[s].from.find((id) => {
      const n = agent.steps.findIndex((step) => step.id === id)
      return n >= 0 && agent.steps[n].detail && agent.statusOf(n) !== 'denied'
    })
    setOpenId(row ?? null)
    // A long answer can push the row it came from out of view
    listRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }

  // One sentence or row in focus: whatever it doesn't touch steps back
  const sentenceInFocus = (s: number) => {
    const from = sentences[s].from
    if (pinned !== null) return pinned === s
    if (hoverS !== null) return hoverS === s
    if (hoverRow) return from.includes(hoverRow)
    if (openId) return from.includes(openId)
    return true
  }
  const rowInFocus = (id: string) => {
    if (!done) return true
    if (pinned !== null) return sentences[pinned].from.includes(id)
    if (hoverS !== null) return sentences[hoverS].from.includes(id)
    return true
  }

  const inView = useInView(agent.rootRef, { amount: 0.2 })
  const inViewRef = useRef(inView)
  inViewRef.current = inView
  const waitingId = waiting?.id

  // The wait can last an hour, on another tab: the tab itself says so. Only if you were here,
  // or a demo you scrolled past would keep the page's title forever
  const asking = !!waitingId && inView
  useEffect(() => {
    if (!asking) return
    const was = document.title
    document.title = 'Needs your OK'
    return () => {
      document.title = was
    }
  }, [asking])

  // A question you can't see is one nobody answers. Scroll once it has finished opening, but
  // never pull the page away from someone reading another demo
  useEffect(() => {
    if (!waitingId) return
    const t = window.setTimeout(() => {
      if (!inViewRef.current) return
      agent.rootRef.current
        ?.querySelector('[data-asking]')
        ?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
    }, 360)
    return () => clearTimeout(t)
  }, [waitingId, reduce, agent.rootRef])

  return (
    <div
      ref={agent.rootRef}
      tabIndex={-1}
      className='perm-root mx-auto flex min-h-[620px] w-full max-w-[640px] flex-col gap-5 outline-none md:min-h-[550px]'>
      <p className='perm-t-title relative max-w-[85%] self-end rounded-2xl rounded-br-md border bg-background px-3.5 py-2 shadow-sm'>
        {QUESTION}
      </p>
      <span className='sr-only' role='status'>
        {waiting ? `Needs your approval: ${waiting.verb} ${waiting.target}` : ''}
      </span>
      <div className='flex min-w-0 flex-col'>
        <div className='perm-t-label flex h-[38px] items-center'>
          <AgentOrb state={orb} {...ORB_LOCKUP} />
          <div className='relative flex min-w-0 flex-col'>
          <Swap id={phase} className={`font-medium ${phase === 'working' || phase === 'starting' ? 'text-shimmer' : ''}`}>
            {done ? 'Finished' : phase === 'waiting' ? 'Waiting for you' : phase === 'starting' ? 'Starting' : 'Working'}
          </Swap>
          <Swap id={phase === 'waiting' ? 'w' : done ? 'd' : 'e'} className='perm-t-small tabular-nums text-muted-foreground'>
            {done
              ? `Worked for ${Math.floor(agent.elapsed)}s`
              : phase === 'waiting'
                ? `Paused ${Math.floor(agent.waited)}s`
                : `${Math.floor(agent.elapsed)}s`}
          </Swap>
          </div>
        </div>
        <ul ref={listRef} className='mt-1.5 flex scroll-mt-6 flex-col'>
          {rows.map((step, n) => {
            const status = agent.statusOf(n)
            return (
              <TraceRow
                key={step.id}
                step={step}
                status={status}
                decision={agent.decisions[step.id]}
                redirected={!!agent.notes[step.id]}
                dim={(dim && status !== 'waiting') || !rowInFocus(step.id)}
                expand={status === 'waiting' ? renderWaiting?.(step) : null}
                byHand={openId === step.id}
                onToggle={() => toggleRow(step.id)}
                onHover={setHoverRow}
              />
            )
          })}
        </ul>
        <AnimatePresence>
          {done ? (
            <Collapse key='answer'>
              <TracedAnswer
                sentences={sentences}
                pinned={pinned}
                inFocus={sentenceInFocus}
                onHover={setHoverS}
                onPick={traceSentence}
                onReplay={onReplay}
              />
            </Collapse>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---- controls ----------------------------------------------------------------------

export function Btn({
  kind = 'ghost',
  hint,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'ghost' | 'text'; hint?: string }) {
  const look =
    kind === 'primary'
      ? 'bg-foreground text-background [@media(hover:hover)]:hover:bg-foreground/85'
      : kind === 'ghost'
        ? 'bg-foreground/[0.06] text-foreground [@media(hover:hover)]:hover:bg-foreground/10'
        : 'text-muted-foreground [@media(hover:hover)]:hover:text-foreground'
  return (
    <button
      type='button'
      className={`relative inline-flex h-11 touch-manipulation select-none items-center gap-1.5 whitespace-nowrap rounded-[var(--perm-inner)] px-3 perm-t-label font-medium transition-[transform,background-color,color] duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] motion-reduce:active:scale-100 md:h-9 ${look} ${className}`}
      {...props}>
      {children}
      {hint ? (
        <kbd className='perm-t-hint font-sans opacity-55 [@media(hover:none)]:hidden'>{hint}</kbd>
      ) : null}
    </button>
  )
}

export function Command({ text }: { text: string }) {
  return <code className='block font-mono text-xs leading-5 text-foreground [overflow-wrap:anywhere]'>{text}</code>
}
