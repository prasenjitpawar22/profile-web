'use client'

import { cn } from '@/lib/utils'
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from 'motion/react'
import { AlertCircle } from 'lucide-react'
import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react'

/* ============================================================
   Optimistic rollback — changes apply the instant you make them,
   and when the server refuses, the change visibly rewinds and
   says why, with a one-tap retry. A request log underneath shows
   what the server actually did.
   ============================================================ */

type Network = 'reliable' | 'flaky' | 'offline'

const NETWORKS: { id: Network; label: string; hint: string }[] = [
  { id: 'reliable', label: 'Reliable', hint: 'Every request succeeds' },
  { id: 'flaky', label: 'Flaky', hint: 'Every other request fails' },
  { id: 'offline', label: 'Offline', hint: 'Every request fails' },
]

type Task = {
  id: number
  title: string
  /** What the reader sees: updated optimistically, the moment they click */
  done: boolean
  /** What the server last agreed to */
  confirmed: boolean
  inflight: number
  error: { message: string; intended: boolean } | null
  /** Bumped on every rollback, so each one replays the shake */
  rewinds: number
}

type LogEntry = {
  id: number
  taskId: number
  value: boolean
  status: 'pending' | 'ok' | 'failed'
  ms: number
}

const INITIAL: Task[] = [
  { id: 1, title: 'Ship the onboarding flow', done: false },
  { id: 2, title: 'Review the pricing page', done: true },
  { id: 3, title: 'Write the changelog', done: false },
].map((t) => ({ ...t, confirmed: t.done, inflight: 0, error: null, rewinds: 0 }))

const LOG_LIMIT = 4

const ease = [0.23, 1, 0.32, 1] as const

export function OptimisticRollback() {
  const reduceMotion = useReducedMotion() ?? false
  const [network, setNetwork] = useState<Network>('flaky')
  const [tasks, setTasks] = useState(INITIAL)
  const [log, setLog] = useState<LogEntry[]>([])

  // Only the newest request for a task may roll it back; an older failure
  // must not undo a newer change the reader has made since
  const latest = useRef<Record<number, number>>({})
  const flakyCount = useRef(0)
  const nextLogId = useRef(1)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const patch = (id: number, fn: (t: Task) => Task) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? fn(t) : t)))

  function setDone(task: Task, value: boolean) {
    const seq = (latest.current[task.id] ?? 0) + 1
    latest.current[task.id] = seq

    // 1. Apply immediately: no spinner gating the change
    patch(task.id, (t) => ({ ...t, done: value, error: null, inflight: t.inflight + 1 }))

    // 2. Ask the server, with the network as it was when the request left
    const willFail =
      network === 'offline' || (network === 'flaky' && flakyCount.current++ % 2 === 0)
    const reason = network === 'offline' ? "you're offline" : 'the server timed out'
    const ms = Math.round(650 + Math.random() * 450)
    const logId = nextLogId.current++
    setLog((prev) =>
      [{ id: logId, taskId: task.id, value, status: 'pending' as const, ms }, ...prev].slice(
        0,
        LOG_LIMIT,
      ),
    )

    timers.current.push(
      window.setTimeout(() => {
        setLog((prev) =>
          prev.map((e) => (e.id === logId ? { ...e, status: willFail ? 'failed' : 'ok' } : e)),
        )
        patch(task.id, (t) => {
          const settled = { ...t, inflight: t.inflight - 1 }
          if (!willFail) return { ...settled, confirmed: value }
          // 3. Refused: rewind to what the server holds, and say why
          if (latest.current[task.id] !== seq) return settled
          return {
            ...settled,
            done: t.confirmed,
            error: { message: reason, intended: value },
            rewinds: t.rewinds + 1,
          }
        })
      }, ms),
    )
  }

  function dismiss(id: number) {
    patch(id, (t) => ({ ...t, error: null }))
  }

  return (
    <div className='flex w-full max-w-[440px] flex-col gap-3'>
      <div className='rounded-xl border bg-background shadow-sm'>
        <div className='flex items-center justify-between gap-3 border-b px-3 py-2'>
          <span className='text-xs font-medium'>Today</span>
          <NetworkPicker value={network} onChange={setNetwork} />
        </div>

        <ul className='p-1.5'>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              reduceMotion={reduceMotion}
              onToggle={() => setDone(task, !task.done)}
              onRetry={() => task.error && setDone(task, task.error.intended)}
              onDismiss={() => dismiss(task.id)}
            />
          ))}
        </ul>
      </div>

      <RequestLog log={log} tasks={tasks} reduceMotion={reduceMotion} />
    </div>
  )
}

function TaskRow({
  task,
  reduceMotion,
  onToggle,
  onRetry,
  onDismiss,
}: {
  task: Task
  reduceMotion: boolean
  onToggle: () => void
  onRetry: () => void
  onDismiss: () => void
}) {
  const [scope, animate] = useAnimate()
  const errorId = useId()

  // A short head-shake as the change rewinds: the row is saying "no"
  useEffect(() => {
    if (task.rewinds === 0 || reduceMotion || !scope.current) return
    animate(scope.current, { x: [0, -4, 4, -3, 2, 0] }, { duration: 0.4, ease: 'easeOut' })
  }, [task.rewinds, reduceMotion, animate, scope])

  // Rolling back runs a touch slower than a normal toggle, so it reads as a rewind
  const rewinding = task.error !== null
  const checkTransition = reduceMotion
    ? { duration: 0 }
    : { duration: rewinding ? 0.35 : 0.2, ease }

  return (
    <li>
      <div ref={scope} className='flex items-center gap-2.5 rounded-lg px-2 py-2'>
        <button
          type='button'
          role='checkbox'
          aria-checked={task.done}
          aria-describedby={task.error ? errorId : undefined}
          onClick={onToggle}
          className='group flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'>
          <span
            className={cn(
              'grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-[background-color,border-color] duration-200',
              task.done ? 'border-foreground bg-foreground' : 'bg-background group-hover:border-muted-foreground',
              rewinding && !task.done && 'border-red-500/70',
            )}>
            <svg viewBox='0 0 16 16' aria-hidden className='h-3 w-3'>
              <motion.path
                d='M3.5 8.5l3 3 6-6.5'
                fill='none'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='stroke-background'
                initial={false}
                animate={{ pathLength: task.done ? 1 : 0 }}
                transition={checkTransition}
              />
            </svg>
          </span>

          <span
            className={cn(
              'relative truncate transition-colors duration-200',
              task.done ? 'text-muted-foreground' : 'text-foreground',
            )}>
            {task.title}
            {/* Drawn left to right; a rollback retracts it the way it came */}
            <motion.span
              aria-hidden
              initial={false}
              animate={{ scaleX: task.done ? 1 : 0 }}
              transition={checkTransition}
              className='absolute left-0 top-1/2 h-px w-full origin-left bg-muted-foreground'
            />
          </span>
        </button>

        <span className='grid h-4 w-4 shrink-0 place-items-center'>
          <AnimatePresence initial={false} mode='popLayout'>
            {task.inflight > 0 ? (
              <motion.span
                key='saving'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label='Saving'
                className='h-3 w-3 animate-spin rounded-full border-[1.5px] border-muted-foreground/30 border-t-muted-foreground [animation-duration:0.7s] motion-reduce:animate-none'
              />
            ) : task.error ? (
              <motion.span
                key='error'
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease }}
                className='grid place-items-center text-red-500'>
                <AlertCircle aria-hidden className='h-4 w-4' />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </div>

      <AnimatePresence initial={false}>
        {task.error ? (
          <motion.div
            key='error'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15, ease } }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease }}
            className='overflow-hidden'>
            <div
              id={errorId}
              role='alert'
              className='mx-2 mb-2 flex items-center justify-between gap-3 rounded-md bg-red-500/[0.07] py-1.5 pl-2.5 pr-1 text-xs text-red-700 dark:text-red-300'>
              <span className='min-w-0'>
                Couldn&apos;t {task.error.intended ? 'mark it done' : 'reopen it'}:{' '}
                {task.error.message}. Reverted.
              </span>
              <span className='flex shrink-0 items-center gap-0.5'>
                <InlineButton onClick={onRetry}>Retry</InlineButton>
                <InlineButton onClick={onDismiss} quiet>
                  Dismiss
                </InlineButton>
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

function NetworkPicker({
  value,
  onChange,
}: {
  value: Network
  onChange: (n: Network) => void
}) {
  const id = useId()

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const i = NETWORKS.findIndex((n) => n.id === value)
    const next = NETWORKS[(i + dir + NETWORKS.length) % NETWORKS.length]
    onChange(next.id)
    e.currentTarget.querySelector<HTMLElement>(`[data-network="${next.id}"]`)?.focus()
  }

  return (
    <div
      role='radiogroup'
      aria-label='Simulated network'
      onKeyDown={onKeyDown}
      className='flex items-center gap-0.5 rounded-lg bg-muted p-0.5 text-xs'>
      {NETWORKS.map((n) => {
        const selected = n.id === value
        return (
          <button
            key={n.id}
            type='button'
            role='radio'
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-network={n.id}
            title={n.hint}
            onClick={() => onChange(n.id)}
            className={cn(
              'relative rounded-md px-2 py-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}>
            {selected ? (
              <motion.span
                layoutId={`${id}-network`}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
                className='absolute inset-0 rounded-md bg-background shadow-sm'
              />
            ) : null}
            <span className='relative'>{n.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function RequestLog({
  log,
  tasks,
  reduceMotion,
}: {
  log: LogEntry[]
  tasks: Task[]
  reduceMotion: boolean
}) {
  return (
    <div className='rounded-xl border bg-background/60 px-3 py-2 font-mono text-[11px] leading-5'>
      <div className='mb-1 flex items-center justify-between font-sans text-xs text-muted-foreground'>
        <span>Server</span>
        <span className='text-muted-foreground/60'>latest first</span>
      </div>
      {log.length === 0 ? (
        <p className='py-1 font-sans text-xs text-muted-foreground/70'>
          No requests yet. Tick a task.
        </p>
      ) : (
        <ul className='relative'>
          <AnimatePresence initial={false} mode='popLayout'>
            {log.map((entry) => {
              const task = tasks.find((t) => t.id === entry.taskId)
              return (
                <motion.li
                  key={entry.id}
                  layout={reduceMotion ? false : 'position'}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.2, ease }}
                  className='flex items-center gap-2 text-muted-foreground'>
                  <span className='text-foreground/80'>PATCH</span>
                  <span className='min-w-0 flex-1 truncate'>
                    /tasks/{entry.taskId}{' '}
                    <span className='text-muted-foreground/70'>done={String(entry.value)}</span>
                    <span className='sr-only'> ({task?.title})</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 tabular-nums transition-colors duration-200',
                      entry.status === 'ok' && 'text-grass',
                      entry.status === 'failed' && 'text-red-500',
                    )}>
                    {entry.status === 'pending'
                      ? 'pending…'
                      : `${entry.status === 'ok' ? '200' : 'failed'} · ${entry.ms}ms`}
                  </span>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

function InlineButton({
  onClick,
  quiet,
  children,
}: {
  onClick: () => void
  quiet?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded px-1.5 py-0.5 font-medium transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none',
        quiet && 'font-normal opacity-70',
      )}>
      {children}
    </button>
  )
}
