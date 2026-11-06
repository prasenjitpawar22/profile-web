'use client'

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { Check, ChevronRight, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DotStar } from './dot-star'
import {
  ACTIONS,
  Action,
  Answer,
  CodeLine,
  CopyButton,
  Detail,
  IconButton,
  LiveStatus,
  QuestionBubble,
  SENTENCES,
  SettledBadge,
  ease,
  moodOf,
  pagesOpened,
  useRun,
} from './shared'
import './ai-thinking.css'

/* The agent's work, as it happens. Each thing it does becomes a row: the file it read and
   which lines, what it searched the repo for, what it looked up. The row at work shows
   what it's looking at, so nobody has to click to find out, and any finished row opens
   again. A sentence in the answer opens the row it came from. Focus comes from dimming
   what's unrelated, never a highlight. Nothing pops: whatever arrives expands or fades in
   from where it belongs, and space for what's coming is held in advance. */

// Opening responds at once and settles slowly; closing gets out of the way faster
const OPEN = { duration: 0.34, ease: [0.32, 0.72, 0, 1] as const }
const CLOSE = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }
// Content arrives just under full size, never from nothing
const CONTENT_IN = { opacity: 0, y: -6, scale: 0.985 }
const CONTENT_OUT = {
  opacity: 0,
  y: -4,
  scale: 0.99,
  transition: { duration: 0.14 },
}
const SWAP = { duration: 0.24, ease }
const swapIn = (reduce: boolean) =>
  reduce ? { opacity: 0 } : { opacity: 0, y: 4 }
const swapOut = (reduce: boolean) =>
  reduce
    ? { opacity: 0 }
    : { opacity: 0, y: -4, transition: { duration: 0.14 } }

export function AiThinking() {
  const rootRef = useRef<HTMLDivElement>(null)
  // Start once the demo is properly on screen, so the opening isn't missed
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const [run, setRun] = useState(0)
  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className='flex w-full justify-center outline-none'
    >
      {/* A replay fades through rather than cutting to an empty card */}
      <AnimatePresence mode='wait' initial={false}>
        <motion.div
          key={run}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.2 }}
          className='w-full'
        >
          <Trace
            started={inView}
            onReplay={() => {
              setRun((r) => r + 1)
              // The replay button goes away with the old run, so keep focus nearby
              rootRef.current?.focus({ preventScroll: true })
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Trace({
  started,
  onReplay,
}: {
  started: boolean
  onReplay: () => void
}) {
  const reduce = useReducedMotion() ?? false
  const r = useRun(started)
  const textRef = useRef<HTMLDivElement>(null)
  const complete = r.phase === 'complete'
  const answering = r.phase === 'answering' || complete

  // A row opened by hand. While none is, the row at work shows itself
  const [openId, setOpenId] = useState<string | null>(null)
  // The sentence being traced
  const [pinned, setPinned] = useState<number | null>(null)
  const [hoverS, setHoverS] = useState<number | null>(null)
  const [hoverRow, setHoverRow] = useState<string | null>(null)
  const badgeDrawn = useRef(false)
  useEffect(() => {
    if (r.settled) badgeDrawn.current = true
  }, [r.settled])

  const activeId = !r.settled && r.step >= 0 ? ACTIONS[r.step].id : null
  const shownId = openId ?? activeId
  const rows = ACTIONS.slice(0, r.settled ? ACTIONS.length : r.step + 1)

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
    setOpenId(SENTENCES[s].from[0])
    // A long answer can push the row it came from out of view
    textRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    })
  }
  useEffect(() => {
    if (openId === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenId(null)
      setPinned(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openId])

  // One sentence or row in focus: whatever it doesn't touch steps back
  const sentenceInFocus = (i: number) => {
    const from = SENTENCES[i].from
    if (pinned !== null) return pinned === i
    if (hoverS !== null) return hoverS === i
    if (hoverRow) return from.includes(hoverRow)
    if (openId) return from.includes(openId)
    return true
  }
  const rowInFocus = (id: string) => {
    if (pinned !== null) return SENTENCES[pinned].from.includes(id)
    if (hoverS !== null) return SENTENCES[hoverS].from.includes(id)
    return true
  }

  return (
    <div className='thinking-root relative w-full'>
      {/* Behind everything: a field of dots across the card */}
      <DotStar
        text={textRef}
        step={moodOf(r.step)}
        sources={pagesOpened(r.step)}
        leaving={r.settled}
        resting={complete}
        reduce={reduce}
      />
      <LiveStatus
        phase={r.phase}
        step={r.step}
        settled={r.settled}
        thoughtFor={r.thoughtFor}
      />

      {/* One column, like a transcript. Its minimum holds the card's height through the
          run, and the dots keep their strength anywhere the text hasn't reached */}
      <div className='pointer-events-none relative mx-auto flex min-h-[620px] w-full max-w-[640px] flex-col gap-5 md:min-h-[486px]'>
        <QuestionBubble />
        <div
          ref={textRef}
          className='pointer-events-auto flex min-w-0 flex-col'
        >
          <aside aria-label='What it did' className='min-w-0'>
            <div className='flex h-7 items-center justify-between gap-3 text-[13px] leading-[18px]'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={r.settled ? 'done' : r.step < 0 ? 'starting' : 'working'}
                  initial={swapIn(reduce)}
                  animate={{ opacity: 1, y: 0 }}
                  exit={swapOut(reduce)}
                  transition={SWAP}
                  className={`font-medium ${r.settled ? 'flex items-center gap-2' : 'text-shimmer'}`}
                >
                  {r.settled ? (
                    <>
                      <SettledBadge draw={!reduce && !badgeDrawn.current} />
                      Thought for {r.thoughtFor}s
                    </>
                  ) : r.step < 0 ? (
                    'Starting'
                  ) : (
                    'Working'
                  )}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={r.settled ? 'steps' : 'timer'}
                  initial={swapIn(reduce)}
                  animate={{ opacity: 1, y: 0 }}
                  exit={swapOut(reduce)}
                  transition={SWAP}
                  className='text-xs tabular-nums text-muted-foreground'
                >
                  {r.settled
                    ? `${ACTIONS.length} steps`
                    : `${Math.floor(r.elapsed)}s`}
                </motion.span>
              </AnimatePresence>
            </div>

            <ul className='mt-1.5 flex flex-col'>
              {rows.map((action) => (
                <Row
                  key={action.id}
                  action={action}
                  active={action.id === activeId}
                  open={shownId === action.id}
                  byHand={openId === action.id}
                  dim={!rowInFocus(action.id)}
                  reduce={reduce}
                  onToggle={() => toggleRow(action.id)}
                  onHover={setHoverRow}
                />
              ))}
            </ul>
          </aside>

          {/* The answer opens out of the trace, with its full height already laid out */}
          <AnimatePresence initial={false}>
            {answering ? (
              <motion.div
                key='answer'
                initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={
                  reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }
                }
                transition={OPEN}
                className='-mx-1 overflow-hidden px-1 pb-1'
              >
                <div className='mt-4 flex flex-col gap-3 border-t pt-4'>
                  <Answer
                    reduceMotion={reduce}
                    onDone={r.finish}
                    onSentenceHover={setHoverS}
                    pickable={complete}
                    pinned={pinned}
                    onSentencePick={traceSentence}
                    sentenceClass={(i) =>
                      complete && !sentenceInFocus(i)
                        ? 'text-muted-foreground'
                        : undefined
                    }
                  />
                  {/* Its space is held from the start, so arriving moves nothing */}
                  <div className='h-7'>
                    <AnimatePresence>
                      {complete ? (
                        <motion.div
                          initial={swapIn(reduce)}
                          animate={{ opacity: 1, y: 0 }}
                          transition={SWAP}
                          className='-ml-1.5 flex items-center gap-0.5'
                        >
                          <CopyButton reduceMotion={reduce} />
                          <IconButton label='Replay' onClick={onReplay}>
                            <RotateCcw />
                          </IconButton>
                          <span className='ml-2 grid text-xs text-muted-foreground'>
                            <AnimatePresence mode='popLayout' initial={false}>
                              <motion.span
                                key={pinned !== null ? 'clear' : 'trace'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{
                                  opacity: 0,
                                  transition: { duration: 0.1 },
                                }}
                                transition={{ duration: 0.16 }}
                              >
                                {pinned !== null
                                  ? 'Select it again to clear'
                                  : 'Select a sentence to trace it'}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ---- a row ---------------------------------------------------------------------

function Row({
  action,
  active,
  open,
  byHand,
  dim,
  reduce,
  onToggle,
  onHover,
}: {
  action: Action
  active: boolean
  open: boolean
  byHand: boolean
  dim: boolean
  reduce: boolean
  onToggle: () => void
  onHover: (id: string | null) => void
}) {
  const canOpen = !active && !!action.detail
  const isFile = action.detail?.kind === 'code'
  const slash = action.target.lastIndexOf('/') + 1
  const folder = action.target.slice(0, slash)
  const file = action.target.slice(slash)
  const face = (
    <>
      <span
        aria-hidden
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'breathe bg-foreground' : 'bg-foreground/30'}`}
      />
      <span
        className={`w-[72px] shrink-0 text-[13px] font-medium ${active ? 'text-shimmer' : ''}`}
      >
        {action.verb}
      </span>
      <span
        className={`min-w-0 flex-1 truncate ${action.mono ? 'font-mono text-xs' : 'text-[13px]'}`}
        title={action.target}
      >
        {isFile ? (
          <>
            {/* The filename is the part worth keeping when there's no room for the folder */}
            <span className='max-md:hidden'>{folder}</span>
            {file}
          </>
        ) : (
          action.target
        )}
      </span>
      {action.meta ? (
        <span className='shrink-0 text-xs tabular-nums'>{action.meta}</span>
      ) : null}
      <ChevronRight
        aria-hidden
        className={`h-3.5 w-3.5 shrink-0 transition-[opacity,transform] duration-200 motion-reduce:transition-none ${canOpen ? 'opacity-100' : 'opacity-0'} ${byHand ? 'rotate-90' : ''}`}
      />
    </>
  )
  const rowClass = `flex h-10 w-full items-center gap-2 text-left transition-colors duration-150 md:h-8 ${
    dim
      ? 'text-muted-foreground'
      : active || byHand
        ? 'text-foreground'
        : 'text-foreground/85'
  }`

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease }}
    >
      <button
        type='button'
        disabled={!canOpen}
        onClick={onToggle}
        onMouseEnter={() => canOpen && onHover(action.id)}
        onMouseLeave={() => onHover(null)}
        aria-expanded={canOpen ? byHand : undefined}
        className={`${rowClass} rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:enabled:hover:text-foreground`}
      >
        {face}
      </button>
      {/* Not skipped on first render: the row at work opens its detail as it arrives */}
      <AnimatePresence>
        {open && action.detail ? (
          <motion.div
            key='detail'
            // The rows below have to start from where they are, so this box grows from
            // nothing. What's inside it doesn't: that arrives at nearly full size
            initial={reduce ? false : { height: 0 }}
            animate={reduce ? undefined : { height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { height: 0, transition: CLOSE }}
            transition={OPEN}
            className='overflow-hidden'
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : CONTENT_IN}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : CONTENT_OUT}
              transition={{ duration: 0.28, ease }}
              style={{ transformOrigin: 'top left' }}
              // A guide line down from the row's dot; nothing here is a card
              className='mb-1.5 ml-[2.5px] border-l pl-[13px]'
            >
              <DetailView
                detail={action.detail}
                live={active}
                reduce={reduce}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  )
}

// ---- what a row looked at ----------------------------------------------------------

/** Lines arrive one after another while it's working, all at once when reopened */
function Arrive({
  i,
  live,
  reduce,
  children,
}: {
  i: number
  live: boolean
  reduce: boolean
  children: React.ReactNode
}) {
  if (!live || reduce) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease, delay: i * 0.16 }}
    >
      {children}
    </motion.div>
  )
}

function CodeRow({ line }: { line: CodeLine }) {
  return (
    <div
      className={`flex gap-3 whitespace-pre ${line.hit ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      <span
        aria-hidden
        className='w-7 shrink-0 select-none text-right tabular-nums'
      >
        {line.n}
      </span>
      <span>{line.text || ' '}</span>
    </div>
  )
}

function DetailView({
  detail,
  live,
  reduce,
}: {
  detail: Detail
  live: boolean
  reduce: boolean
}) {
  // Long lines scroll sideways rather than wrap, as code should
  const scroller =
    'scroll-thin max-h-[180px] overflow-auto py-1 font-mono text-[11.5px] leading-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

  if (detail.kind === 'code')
    return (
      <div
        tabIndex={0}
        role='group'
        aria-label='Lines it read'
        className={scroller}
      >
        <div className='w-max min-w-full'>
          {detail.lines.map((line, i) => (
            <Arrive key={line.n} i={i} live={live} reduce={reduce}>
              <CodeRow line={line} />
            </Arrive>
          ))}
        </div>
      </div>
    )

  if (detail.kind === 'matches')
    return (
      <div
        tabIndex={0}
        role='group'
        aria-label='Matches it found'
        className={scroller}
      >
        <div className='flex w-max min-w-full flex-col gap-2'>
          {detail.files.map((file, i) => (
            <Arrive key={file.path} i={i * 2} live={live} reduce={reduce}>
              <div>
                <div className='text-foreground'>{file.path}</div>
                {file.lines.map((line) => (
                  <CodeRow key={line.n} line={line} />
                ))}
              </div>
            </Arrive>
          ))}
        </div>
      </div>
    )

  if (detail.kind === 'results')
    return (
      <ul className='flex flex-col gap-1 py-1'>
        {detail.items.map((item, i) => (
          <Arrive key={item.domain} i={i} live={live} reduce={reduce}>
            <li
              className={`flex items-center gap-2 text-xs ${item.kept ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <span className='w-[132px] shrink-0 truncate'>{item.domain}</span>
              <span className='min-w-0 flex-1 truncate'>{item.title}</span>
              {item.kept ? (
                <Check aria-label='Opened' className='h-3.5 w-3.5 shrink-0' />
              ) : (
                <span className='h-3.5 w-3.5 shrink-0' />
              )}
            </li>
          </Arrive>
        ))}
      </ul>
    )

  return (
    <div className='py-1 text-xs'>
      <Arrive i={0} live={live} reduce={reduce}>
        <p className='text-foreground'>{detail.title}</p>
      </Arrive>
      <Arrive i={2} live={live} reduce={reduce}>
        <p className='mt-1 leading-snug text-muted-foreground'>{detail.gist}</p>
      </Arrive>
    </div>
  )
}
