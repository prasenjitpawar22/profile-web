'use client'

import { cn } from '@/lib/utils'
import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AgentOrb } from './agent-orb'
import type { StateId } from './sim'

const GROUPS: { id: StateId; label: string }[][] = [
  [
    { id: 'idle', label: 'Idle' },
    { id: 'composing', label: 'Composing' },
    { id: 'thinking', label: 'Thinking' },
  ],
  [
    { id: 'queued', label: 'Queued' },
    { id: 'planning', label: 'Planning' },
    { id: 'acting', label: 'Acting' },
    { id: 'responding', label: 'Responding' },
  ],
  [
    { id: 'waiting', label: 'Waiting for you' },
    { id: 'paused', label: 'Paused' },
    { id: 'backgrounded', label: 'Backgrounded' },
  ],
  [
    { id: 'compacting', label: 'Compacting' },
    { id: 'recovering', label: 'Recovering' },
    { id: 'ended', label: 'Ended' },
  ],
]

// One agent session, start to finish
const RUN: [StateId, number][] = [
  ['idle', 1800],
  ['composing', 5600],
  ['queued', 3400],
  ['thinking', 4600],
  ['planning', 4200],
  ['acting', 3400],
  ['waiting', 3800],
  ['acting', 2400],
  ['paused', 2600],
  ['acting', 2000],
  ['backgrounded', 4400],
  ['compacting', 4200],
  ['recovering', 4600],
  ['responding', 4400],
  ['ended', 4400],
]

const PRESS =
  'transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none'

export function AgentStates() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState<StateId>('idle')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (reduce) setPlaying(false)
  }, [reduce])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(root)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || !inView || reduce) return
    const [state, ms] = RUN[step]
    setCurrent(state)
    const timer = setTimeout(() => setStep((s) => (s + 1) % RUN.length), ms)
    return () => clearTimeout(timer)
  }, [playing, inView, step, reduce])

  const select = (state: StateId) => {
    setPlaying(false)
    setCurrent(state)
  }

  const toggleRun = () => {
    if (!playing) setStep(0)
    setPlaying(!playing)
  }

  return (
    <div
      ref={rootRef}
      className='flex w-full flex-col items-center justify-center gap-6 md:flex-row md:gap-16'>
      <AgentOrb state={current} className='w-[280px] max-w-full shrink-0' />

      <div className='flex flex-col gap-2 md:gap-3'>
        {GROUPS.map((group) => (
          <div key={group[0].id} className='flex flex-wrap justify-center gap-1 md:justify-start'>
            {group.map(({ id, label }) => (
              <button
                key={id}
                type='button'
                aria-pressed={id === current}
                onClick={() => select(id)}
                className={cn(
                  'min-h-10 rounded-md px-2.5 text-sm md:min-h-8',
                  PRESS,
                  id === current
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground [@media(hover:hover)]:hover:text-foreground',
                )}>
                {label}
              </button>
            ))}
          </div>
        ))}

        <div className='flex justify-center md:justify-start'>
          <button
            type='button'
            onClick={toggleRun}
            className={cn(
              'grid min-h-10 rounded-md px-2.5 text-xs text-muted-foreground md:min-h-8 [@media(hover:hover)]:hover:text-foreground',
              PRESS,
            )}>
            {/* Both labels share one cell, so the swap fades and moves nothing */}
            <span
              aria-hidden={playing}
              className={cn(
                'col-start-1 row-start-1 self-center transition-opacity duration-150 motion-reduce:transition-none',
                playing && 'opacity-0',
              )}>
              Play a run
            </span>
            <span
              aria-hidden={!playing}
              className={cn(
                'col-start-1 row-start-1 self-center text-center transition-opacity duration-150 motion-reduce:transition-none',
                !playing && 'opacity-0',
              )}>
              Stop
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
