'use client'

import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Agent, Ask, Btn, COMMITS, Command, Frame, Swap, useAgent } from './shared'
import './agent-permission.css'

/* An agent at work that stops before anything risky. A harmless ask is a click. A serious one
   shows what will happen and has to be held. Either way you can say what to do instead, right
   where the question is. The task at work is always open, finished ones reopen, and each
   sentence of the answer leads back to the task behind it. */

const HOLD_MS = 900
const allowOnlyIfLow = (ask: Ask) => ask.risk === 'low'
const INSTEAD = 'Or tell it what to do instead'

function HoldButton({ label, onDone }: { label: string; onDone: () => void }) {
  const [holding, setHolding] = useState(false)
  // A quick tap does nothing by design, so it has to say why
  const [nudge, setNudge] = useState(false)
  const timer = useRef(0)
  const nudgeTimer = useRef(0)
  const pressed = useRef(false)
  const fired = useRef(false)
  const lastInput = useRef(0)

  const start = () => {
    lastInput.current = Date.now()
    pressed.current = true
    clearTimeout(timer.current)
    clearTimeout(nudgeTimer.current)
    setNudge(false)
    setHolding(true)
    timer.current = window.setTimeout(() => {
      fired.current = true
      onDone()
    }, HOLD_MS)
  }
  const cancel = () => {
    pressed.current = false
    clearTimeout(timer.current)
    setHolding(false)
  }
  const release = () => {
    lastInput.current = Date.now()
    const wasPressed = pressed.current
    cancel()
    if (!wasPressed || fired.current) return
    setNudge(true)
    nudgeTimer.current = window.setTimeout(() => setNudge(false), 1600)
  }

  useEffect(() => {
    // Attention left the window, and a key held at that moment never reports its release
    window.addEventListener('blur', cancel)
    return () => {
      window.removeEventListener('blur', cancel)
      clearTimeout(timer.current)
      clearTimeout(nudgeTimer.current)
    }
  }, [])

  const text = `Hold to ${label.toLowerCase()}`
  return (
    <button
      type='button'
      data-holding={holding || undefined}
      onPointerDown={(e) => {
        if (e.button === 0) start()
      }}
      onPointerUp={release}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onBlur={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start()
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') release()
      }}
      onClick={(e) => {
        // A screen reader or switch activates without a press to hold, so it can't be asked to
        if (e.detail === 0 && Date.now() - lastInput.current > 500) onDone()
      }}
      aria-label={`Press and hold to ${label.toLowerCase()}`}
      className='perm-hold relative h-11 min-w-0 flex-1 touch-manipulation select-none overflow-hidden rounded-[var(--perm-inner)] bg-foreground text-[13px] font-medium text-background [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'>
      {/* The sweep sits under the label, so the words never change colour mid-hold */}
      <span aria-hidden className='perm-hold-fill absolute inset-0 bg-background/30' />
      <span className='absolute inset-0 grid place-items-center'>
        <Swap id={nudge ? 'nudge' : 'hold'}>{nudge ? 'Keep holding' : text}</Swap>
      </span>
    </button>
  )
}

function InsteadField({ agent }: { agent: Agent }) {
  const [text, setText] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim()) agent.decide('deny', text.trim())
  }
  return (
    <form
      onSubmit={submit}
      className='flex items-center gap-1.5 rounded-[var(--perm-inner)] bg-foreground/[0.05] pl-3 pr-[var(--perm-inset)] ring-inset ring-foreground/25 transition-[background-color,box-shadow] duration-150 focus-within:bg-foreground/[0.07] focus-within:ring-1'>
      <input
        aria-label={INSTEAD}
        placeholder={INSTEAD}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoComplete='off'
        data-1p-ignore
        data-lpignore='true'
        className='h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [@media(hover:hover)]:text-[13px]'
      />
      <button
        type='submit'
        aria-label='Send this instead'
        disabled={!text.trim()}
        className='relative flex h-[calc(2.75rem-2*var(--perm-inset))] w-[calc(2.75rem-2*var(--perm-inset))] shrink-0 items-center justify-center rounded-[var(--perm-innermost)] bg-foreground text-background transition-[background-color,color,transform] duration-150 ease-out before:absolute before:-inset-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] disabled:bg-foreground/10 disabled:text-muted-foreground motion-reduce:active:scale-100'>
        <ArrowUp className='h-4 w-4' aria-hidden />
      </button>
    </form>
  )
}

function HighStakes({ agent, ask }: { agent: Agent; ask: Ask }) {
  return (
    <div className='perm-raised my-1.5 flex flex-col gap-3 rounded-[var(--perm-radius)] bg-background p-[var(--perm-pad)]'>
      <div className='flex flex-col gap-3 px-1 pt-1'>
        <p className='text-sm font-medium leading-5 [text-wrap:pretty]'>{ask.why}</p>
        <ul className='flex flex-col gap-1.5'>
          {COMMITS.map((c) => (
            <li key={c.sha} className='flex gap-2.5 text-xs leading-[18px]'>
              <code className='shrink-0 font-mono text-muted-foreground'>{c.sha}</code>
              <span className='min-w-0 break-words'>{c.message}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-center gap-1.5'>
          <HoldButton label={ask.allow} onDone={() => agent.decide('once')} />
          <Btn hint='N' className='h-11 shrink-0 md:h-11' onClick={() => agent.decide('deny')}>
            {ask.deny}
          </Btn>
        </div>
        <InsteadField agent={agent} />
      </div>
    </div>
  )
}

function LowStakes({ agent, ask }: { agent: Agent; ask: Ask }) {
  return (
    <div className='mb-2 ml-[2.5px] flex flex-col gap-1.5 border-l py-0.5 pl-[13px]'>
      {/* The row can shorten a command. What you approve is the whole thing */}
      <Command text={ask.command} />
      <div className='flex flex-wrap items-center gap-x-1 gap-y-1'>
        <p className='w-full text-xs leading-[18px] text-muted-foreground [text-wrap:pretty] sm:w-auto sm:min-w-[180px] sm:flex-1'>
          {ask.why}
        </p>
        <Btn hint='Y' onClick={() => agent.decide('once')}>
          Allow
        </Btn>
        <Btn kind='text' hint='A' onClick={() => agent.decide('always')}>
          Always
        </Btn>
        <Btn kind='text' hint='N' onClick={() => agent.decide('deny')}>
          {ask.deny}
        </Btn>
      </div>
      <InsteadField agent={agent} />
    </div>
  )
}

export function AgentPermission() {
  const rootRef = useRef<HTMLDivElement>(null)
  // Start once the demo is properly on screen, so the opening isn't missed
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const [run, setRun] = useState(0)
  return (
    <div ref={rootRef} tabIndex={-1} className='flex w-full justify-center outline-none'>
      {/* A replay fades through rather than cutting to an empty card */}
      <AnimatePresence mode='wait' initial={false}>
        <motion.div
          key={run}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.2 }}
          className='w-full'>
          <Run
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

function Run({ started, onReplay }: { started: boolean; onReplay: () => void }) {
  const agent = useAgent({ started, quickAllow: allowOnlyIfLow })
  return (
    <Frame
      agent={agent}
      onReplay={onReplay}
      dim={agent.waiting?.ask?.risk === 'high'}
      renderWaiting={(step) =>
        step.ask!.risk === 'high' ? (
          <HighStakes agent={agent} ask={step.ask!} />
        ) : (
          <LowStakes agent={agent} ask={step.ask!} />
        )
      }
    />
  )
}
