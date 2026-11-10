'use client'

import {
  Bot,
  FileText,
  FlaskConical,
  FolderTree,
  Globe,
  History,
  Pencil,
  RotateCcw,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { CSSProperties, KeyboardEvent, PointerEvent, useEffect, useId, useRef, useState } from 'react'
import { AgentOrb } from '../agent-states/agent-orb'
import type { StateId } from '../agent-states/sim'
import { LOCKUP_P } from '../agent-states/tuning'
import './agent-run-map.css'
import { CHAPTERS, STEPS, TASK, TOOLS, type NodeId, type Step, type ToolId } from './run'

type Pt = { x: number; y: number }

/** One leg of a call, out or back, and the pause at the tool between them (ms). Matches --rg-leg. */
const LEG = 420
const HOLD = 120
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
/** Streak length as a share of its edge. Matches the packet's dash in the CSS. */
const TAIL = 0.14
/** How much of the demo must be showing before the run starts, so its opening isn't missed */
const START_AT = 0.3
/** Long enough for Responding to read as its own beat before the orb winds down */
const RESPONDING_MS = 2600
/** Room the sub-agent's frame keeps around its nodes: sideways, above, and below where captions sit */
const FRAME = { x: 58, top: 30, bottom: 36 }

const ICONS: Record<ToolId, LucideIcon> = {
  read: FileText,
  search: Search,
  web: Globe,
  test: FlaskConical,
  edit: Pencil,
  explore: Bot,
  files: FolderTree,
  history: History,
}

/** A tree read left to right: the agent, its tools, then the sub-agent's tools.
    Positions are shares of the stage, measured from its top left. */
const HOME: Record<NodeId, Pt> = {
  agent: { x: 0.1, y: 0.5 },
  read: { x: 0.46, y: 0.1 },
  search: { x: 0.46, y: 0.26 },
  explore: { x: 0.46, y: 0.42 },
  test: { x: 0.46, y: 0.58 },
  edit: { x: 0.46, y: 0.74 },
  web: { x: 0.46, y: 0.9 },
  files: { x: 0.84, y: 0.34 },
  history: { x: 0.84, y: 0.5 },
}

/** Looking things up reads as thinking; changing or running things reads as acting */
const LOOKUPS = new Set<ToolId>(['read', 'search', 'web'])

/** The orb's states, named as on the Agent states card */
const STATE_NAMES: Partial<Record<StateId, string>> = {
  idle: 'Idle',
  thinking: 'Thinking',
  acting: 'Acting',
  planning: 'Planning',
  recovering: 'Recovering',
  backgrounded: 'Backgrounded',
  responding: 'Responding',
  ended: 'Ended',
}

const IDS = Object.keys(TOOLS) as ToolId[]
/** The sub-agent and the tools it owns, which share a frame on the graph */
const SUB: ToolId = 'explore'
const SUB_GROUP = IDS.filter((id) => id === SUB || TOOLS[id].parent === SUB)
const LAST_AT = STEPS[STEPS.length - 1].at
/** The timeline runs a second past the last step, so the final note isn't jammed against its end */
const TOTAL_MS = (LAST_AT + 1) * 1000
/** A call's bar is as wide as the call takes: out, the pause at the tool, and back */
const CALL_SHARE = (LEG * 2 + HOLD) / TOTAL_MS
/** The later call of a parallel pair sits on the row above, so the two can be seen to overlap */
const UPPER = STEPS.map((s, i) => STEPS.slice(0, i).some((p) => p.at === s.at))
const pct = (share: number) => `${n1(share * 100)}%`

const blank = () => Object.fromEntries(IDS.map((id) => [id, 0])) as Record<ToolId, number>
const fresh = () => ({ clock: 0, next: 0, calls: blank(), sub: false })
const n1 = (v: number) => Math.round(v * 10) / 10
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const tint = (id: ToolId, fail = false) => ({ '--c': fail ? 'var(--rg-fail)' : `var(--rg-${id})` }) as CSSProperties

const edgePath = (a: Pt, b: Pt) => {
  const mx = n1((a.x + b.x) / 2)
  return `M${n1(a.x)} ${n1(a.y)}C${mx} ${n1(a.y)} ${mx} ${n1(b.y)} ${n1(b.x)} ${n1(b.y)}`
}

/** Whether a log row belongs to a node. The agent owns the notes; a sub-agent owns its tools' calls. */
const owns = (id: NodeId, step: Step) => {
  if (!('tool' in step)) return id === 'agent' || step.drop === id || step.spawn === id
  return step.tool === id || TOOLS[step.tool].parent === id
}

/** The nodes a log row points at */
const nodesOf = (step: Step): NodeId[] => {
  if (!('tool' in step)) return [step.drop ?? step.spawn ?? 'agent']
  const { parent } = TOOLS[step.tool]
  return parent === 'agent' ? [step.tool] : [parent, step.tool]
}

/** What the agent is doing, from the step it is on */
const orbFor = (step: Step | undefined): StateId => {
  if (!step) return 'idle'
  if ('tool' in step) {
    // While a sub-agent works, the agent itself is only keeping an eye on it
    if (TOOLS[step.tool].parent !== 'agent') return 'backgrounded'
    return LOOKUPS.has(step.tool) ? 'thinking' : 'acting'
  }
  if (step.drop) return 'recovering'
  if (step.spawn) return 'planning'
  return 'thinking'
}

type Row = { key: number; step: Step }

/** A number that rolls to its new value, the old one leaving as the new one arrives */
function Count({ n }: { n: number }) {
  const [v, setV] = useState({ now: n, was: n })
  useEffect(() => setV((c) => (c.now === n ? c : { now: n, was: c.now })), [n])
  const rolling = v.was !== v.now
  return (
    <span className='rg-count'>
      {rolling && (
        <span key={`out-${v.now}`} className='rg-num-out'>
          {v.was}
        </span>
      )}
      <span key={v.now} className={rolling ? 'rg-num-in' : undefined}>
        {v.now}
      </span>
    </span>
  )
}

export function AgentRunMap() {
  const uid = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const seekRef = useRef<(ms: number, hold: boolean) => void>(() => {})
  const packetRefs = useRef<Partial<Record<ToolId, SVGGElement | null>>>({})
  const glowRefs = useRef<Partial<Record<ToolId, HTMLSpanElement | null>>>({})
  const ringRefs = useRef<Partial<Record<ToolId, HTMLSpanElement | null>>>({})
  const replayRef = useRef<() => void>(() => {})
  const dragRef = useRef<{ id: NodeId; x: number; y: number; from: Pt; moved: boolean } | null>(null)

  // The script's own bookkeeping; what's on screen goes through React
  const run = useRef(fresh())
  const [rows, setRows] = useState<Row[]>([])
  const [counts, setCounts] = useState(blank)
  const [seen, setSeen] = useState<ToolId[]>([])
  const [dropped, setDropped] = useState<ToolId[]>([])
  /** Tools whose latest call came back failed */
  const [failing, setFailing] = useState<ToolId[]>([])
  /** What each tool was last called with, shown under it for a moment as the call lands */
  const [caps, setCaps] = useState<Partial<Record<ToolId, { text: string; n: number }>>>({})
  /** The sub-agent has handed its findings back */
  const [reported, setReported] = useState(false)
  const [size, setSize] = useState({ w: 0, h: 0 })
  /** Where nodes have been dragged to, over their home positions */
  const [moved, setMoved] = useState<Partial<Record<NodeId, Pt>>>({})
  const [dragging, setDragging] = useState<NodeId | null>(null)
  /** The node under the pointer or holding focus, and the one clicked to stay */
  const [hover, setHover] = useState<NodeId | null>(null)
  const [picked, setPicked] = useState<NodeId | null>(null)
  /** The step being pointed at, from its log row, its tick on the timeline, or the keyboard */
  const [litKey, setLitKey] = useState<number | null>(null)
  /** The last node shown, so its status line can fade out with its text still in place */
  const [shown, setShown] = useState<NodeId>('agent')
  const [ended, setEnded] = useState(false)
  /** Whole seconds into the run, for the playhead's readout */
  const [sec, setSec] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  /** The step whose tooltip is up on the timeline; it keeps its text while it fades */
  const [tip, setTip] = useState({ key: 0, on: false })

  const done = rows.length === STEPS.length
  const callCount = rows.filter((r) => 'tool' in r.step).length
  // The log filters to the node being pointed at. A node with nothing in the
  // log yet filters nothing, or the rail would go blank
  const wanted = hover ?? picked
  const active = wanted && rows.some((r) => owns(wanted, r.step)) ? wanted : null
  const linked = active !== null
  const inLog = (step: Step) => active === null || owns(active, step)
  const lit = litKey !== null ? nodesOf(STEPS[litKey]) : []
  const hot = new Set<NodeId>(active ? [...lit, active] : lit)
  const orb: StateId = done ? (ended ? 'ended' : 'responding') : orbFor(rows[rows.length - 1]?.step)
  /** The state's name and the one it replaced, so the two can cross-fade */
  const [word, setWord] = useState({ now: orb, was: orb })

  useEffect(() => {
    if (active) setShown(active)
  }, [active])

  useEffect(() => {
    setWord((v) => (v.now === orb ? v : { now: orb, was: v.now }))
  }, [orb])

  useEffect(() => {
    if (!done) return setEnded(false)
    const t = window.setTimeout(() => setEnded(true), RESPONDING_MS)
    return () => clearTimeout(t)
  }, [done])

  // A row reached by keyboard may sit above the fold of the log
  useEffect(() => {
    if (litKey === null || document.activeElement !== logRef.current) return
    document.getElementById(`${uid}-${litKey}`)?.scrollIntoView({ block: 'nearest' })
  }, [litKey, uid])

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(stageRef.current!)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const root = rootRef.current!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const timers = new Set<number>()
    let raf = 0
    let last = 0
    let visible = false
    let started = false
    /** Held still under a scrub */
    let paused = false
    let shownSec = -1

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
    }

    const show = (id: ToolId) => setSeen((s) => (s.includes(id) ? s : [...s, id]))
    /** Puts the playhead and the filled line at a moment of the run */
    const paint = (ms: number) => {
      const share = Math.min(1, ms / TOTAL_MS)
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${share})`
      if (headRef.current) headRef.current.style.left = `${share * 100}%`
      const s = Math.floor(ms / 1000)
      if (s !== shownSec) setSec((shownSec = s))
    }

    /** Runs the streak along a tool's edge, away from its parent or back to it */
    const travel = (id: ToolId, dir: 'out' | 'back', delay: number) => {
      const frames = [
        { strokeDashoffset: dir === 'out' ? TAIL : -1, opacity: 1 },
        { strokeDashoffset: dir === 'out' ? -1 : TAIL, opacity: 1 },
      ]
      packetRefs.current[id]?.animate(frames, { duration: LEG, delay, easing: EASE })
    }

    /** The call landing: the node takes its colour for a moment and sheds a ring. A failure
        lands in red with a short shake. */
    const ping = (id: ToolId, fail: boolean) => {
      const glow = glowRefs.current[id]
      const ring = ringRefs.current[id]
      glow?.toggleAttribute('data-fail', fail)
      ring?.toggleAttribute('data-fail', fail)
      glow?.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], {
        duration: fail ? 900 : 640,
        easing: 'ease-out',
      })
      ring?.animate(
        [
          { opacity: 0.7, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(1.32)' },
        ],
        { duration: 560, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      )
      if (fail)
        glow?.parentElement?.animate(
          { transform: ['translateX(0)', 'translateX(-3px)', 'translateX(3px)', 'translateX(-2px)', 'translateX(0)'] },
          { duration: 280, easing: 'ease-out' },
        )
    }

    const fire = (step: Step, key: number, instant: boolean) => {
      const r = run.current
      if ('tool' in step) {
        const id = step.tool
        const { parent } = TOOLS[id]
        const fail = !!step.fail
        // The first call the agent makes itself after a sub-agent's run is the sub-agent reporting back
        if (parent === 'agent' && r.sub) {
          r.sub = false
          setReported(true)
          if (!instant) travel(SUB, 'back', 0)
        }
        if (parent !== 'agent') {
          r.sub = true
          show(parent)
          r.calls[parent] += 1
        }
        show(id)
        r.calls[id] += 1
        const snapshot = { ...r.calls }
        const land = () => {
          setCounts(snapshot)
          setFailing((f) => (fail ? (f.includes(id) ? f : [...f, id]) : f.filter((t) => t !== id)))
        }
        if (instant) {
          land()
        } else {
          // Out along the edge, land, then the result comes back. The count ticks on
          // landing, and a failure turns the way back red.
          const packet = packetRefs.current[id]
          packet?.removeAttribute('data-fail')
          travel(id, 'out', 0)
          later(() => {
            land()
            setCaps((c) => ({ ...c, [id]: { text: step.text, n: key } }))
            packet?.toggleAttribute('data-fail', fail)
            ping(id, fail)
          }, LEG)
          travel(id, 'back', LEG + HOLD)
        }
      } else {
        const { drop, spawn } = step
        if (drop) setDropped((d) => (d.includes(drop) ? d : [...d, drop]))
        if (spawn) {
          show(spawn)
          if (!instant) {
            travel(spawn, 'out', 0)
            later(() => ping(spawn, false), LEG)
          }
        }
      }
      setRows((prev) => [...prev, { key, step }])
    }

    const playAll = () => {
      STEPS.forEach((s, i) => fire(s, i, true))
      run.current.next = STEPS.length
      run.current.clock = LAST_AT * 1000
      paint(run.current.clock)
    }

    // The script runs on frames, so it holds still while the tab or the demo is out of view
    const tick = (now: number) => {
      const r = run.current
      const dt = last ? now - last : 16
      last = now
      if (started) {
        r.clock += Math.min(dt, 50)
        paint(r.clock)
        while (r.next < STEPS.length && STEPS[r.next].at * 1000 <= r.clock) {
          fire(STEPS[r.next], r.next, false)
          r.next++
        }
      }
      raf = r.next < STEPS.length ? requestAnimationFrame(tick) : 0
    }

    const wake = () => {
      if (!visible || raf || reduced || paused || run.current.next >= STEPS.length) return
      last = 0
      raf = requestAnimationFrame(tick)
    }

    const clear = () => {
      timers.forEach((id) => clearTimeout(id))
      timers.clear()
      const live = [packetRefs.current, glowRefs.current, ringRefs.current].flatMap((refs) => Object.values(refs))
      for (const el of live) {
        el?.removeAttribute('data-fail')
        el?.getAnimations().forEach((a: Animation) => a.cancel())
      }
      for (const glow of Object.values(glowRefs.current))
        glow?.parentElement?.getAnimations().forEach((a: Animation) => a.cancel())
    }

    const reset = () => {
      clear()
      run.current = fresh()
      setRows([])
      setCounts(blank())
      setSeen([])
      setDropped([])
      setFailing([])
      setCaps({})
      setReported(false)
    }

    // Nodes fade and edges un-draw through their own transitions, so a replay isn't a hard cut
    replayRef.current = () => {
      reset()
      setHover(null)
      setPicked(null)
      setLitKey(null)
      paused = false
      paint(0)
      if (reduced) playAll()
      else wake()
    }

    // Jumps the run to a moment: everything up to it is rebuilt at once, with no streaks.
    // Held, it stays there; let go, the run carries on from that point.
    seekRef.current = (ms, hold) => {
      reset()
      const r = run.current
      r.clock = Math.max(0, Math.min(LAST_AT * 1000, ms))
      STEPS.forEach((s, i) => {
        if (s.at * 1000 > r.clock) return
        fire(s, i, true)
        r.next = i + 1
      })
      paint(r.clock)
      started = true
      paused = hold
      if (hold) {
        cancelAnimationFrame(raf)
        raf = 0
      } else wake()
    }

    if (reduced) playAll()

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (entry.intersectionRatio >= START_AT) started = true
        if (visible) wake()
        else {
          cancelAnimationFrame(raf)
          raf = 0
        }
      },
      { threshold: [0, START_AT] },
    )
    io.observe(root)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      reset()
    }
  }, [])

  const { w, h } = size
  const at = (id: NodeId): Pt => {
    const p = moved[id] ?? HOME[id]
    // On a narrow stage the last column would run its pills off the edge
    return { x: Math.min(w - 48, Math.max(24, p.x * w)), y: p.y * h }
  }
  const place = (id: NodeId, x: number, y: number) => {
    if (!w || !h) return
    setMoved((m) => ({
      ...m,
      [id]: { x: Math.min(w - 44, Math.max(44, x)) / w, y: Math.min(h - 20, Math.max(20, y)) / h },
    }))
  }

  const onDown = (id: NodeId, e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, x: e.clientX, y: e.clientY, from: at(id), moved: false }
  }
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) {
      d.moved = true
      setDragging(d.id)
    }
    if (d.moved) place(d.id, d.from.x + e.clientX - d.x, d.from.y + e.clientY - d.y)
  }
  // A press that never became a drag keeps the node's calls in the log
  const onUp = () => {
    const d = dragRef.current
    dragRef.current = null
    setDragging(null)
    if (d && !d.moved) setPicked((p) => (p === d.id ? null : d.id))
  }
  const onNodeKey = (id: NodeId, e: KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 12
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (!delta) return
    e.preventDefault()
    const p = at(id)
    place(id, p.x + delta[0], p.y + delta[1])
  }

  // The log is one tab stop; arrow keys walk the rows still showing
  const onLogKey = (e: KeyboardEvent) => {
    const open = rows.filter((r) => inLog(r.step))
    if (!open.length) return
    const i = open.findIndex((r) => r.key === litKey)
    const end = open.length - 1
    const to = { ArrowUp: i < 0 ? end : Math.max(0, i - 1), ArrowDown: Math.min(end, i + 1), Home: 0, End: end }[e.key]
    if (to === undefined) return
    e.preventDefault()
    setLitKey(open[to].key)
  }
  const onLogFocus = () => {
    const open = rows.filter((r) => inLog(r.step))
    if (litKey === null && open.length) setLitKey(open[open.length - 1].key)
  }
  const onLogBlur = () => {
    setLitKey(null)
    logRef.current?.scrollTo({ top: 0 })
  }

  const nodeProps = (id: NodeId) => ({
    type: 'button' as const,
    'data-hot': hot.has(id) || undefined,
    'data-dragging': dragging === id || undefined,
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => onDown(id, e),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setHover(id)
    },
    onPointerLeave: () => setHover(null),
    onFocus: () => setHover(id),
    onBlur: () => setHover(null),
    onKeyDown: (e: KeyboardEvent) => onNodeKey(id, e),
  })
  const spot = (id: NodeId): CSSProperties => ({
    transform: `translate3d(${n1(at(id).x)}px, ${n1(at(id).y)}px, 0) translate(-50%, -50%)`,
  })

  // The frame wraps the sub-agent and whichever of its tools have appeared
  const members = SUB_GROUP.filter((id) => id === SUB || seen.includes(id)).map(at)
  const frame = {
    left: Math.max(2, Math.min(...members.map((p) => p.x)) - FRAME.x),
    top: Math.max(2, Math.min(...members.map((p) => p.y)) - FRAME.top),
    right: Math.min(w - 2, Math.max(...members.map((p) => p.x)) + FRAME.x),
    bottom: Math.min(h - 2, Math.max(...members.map((p) => p.y)) + FRAME.bottom),
  }

  const timeAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return ((e.clientX - rect.left) / rect.width) * TOTAL_MS
  }
  const onScrubDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setScrubbing(true)
    setTip((t) => ({ ...t, on: false }))
    seekRef.current(timeAt(e), true)
  }
  const onScrubMove = (e: PointerEvent<HTMLDivElement>) => {
    if (scrubbing) seekRef.current(timeAt(e), true)
  }
  const onScrubUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    setScrubbing(false)
    seekRef.current(timeAt(e), false)
  }
  const onScrubKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 5000 : 1000
    const now = run.current.clock
    const to = { ArrowLeft: now - step, ArrowRight: now + step, Home: 0, End: LAST_AT * 1000 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    seekRef.current(to, false)
  }

  const chapter = CHAPTERS.reduce((cur, c) => (c.at <= sec ? c : cur))
  const lastTool = [...rows].reverse().find((r) => 'tool' in r.step)?.step
  const tipStep = STEPS[tip.key]
  const fails = rows.filter((r) => 'tool' in r.step && r.step.fail).length

  const statusNode =
    shown === 'agent'
      ? `Agent, ${plural(rows.filter((r) => !('tool' in r.step)).length, 'note')}`
      : `${TOOLS[shown].label}, ${plural(counts[shown], 'call')}`

  return (
    <div ref={rootRef} className='runmap' data-linked={linked || undefined}>
      <div className='runmap-rail'>
        <div className='runmap-head'>
          <div>
            <p className='runmap-title'>{TASK}</p>
            <p className='runmap-status'>
              <span data-hidden={done || linked || undefined} aria-hidden={done || linked}>
                Running, {plural(callCount, 'call')}
              </span>
              <span data-hidden={!done || linked || undefined} aria-hidden={!done || linked}>
                Done in {Math.round(LAST_AT)}s, {plural(callCount, 'call')}
                <span className='runmap-sum'>
                  {plural(fails, 'failed test')}, {plural(dropped.length, 'path')} dropped
                </span>
              </span>
              <span data-hidden={!linked || undefined} aria-hidden={!linked}>
                {statusNode}
              </span>
            </p>
          </div>
          <button
            type='button'
            className='runmap-replay hit-area [--hit-x:6px] [--hit-y:6px]'
            aria-label='Replay the run'
            onClick={() => replayRef.current()}>
            <RotateCcw aria-hidden='true' className='h-3.5 w-3.5' />
          </button>
        </div>
        <div
          ref={logRef}
          className='runmap-log'
          role='listbox'
          aria-label='Run log. Arrow keys walk the steps.'
          aria-activedescendant={litKey !== null ? `${uid}-${litKey}` : undefined}
          tabIndex={rows.length ? 0 : -1}
          onKeyDown={onLogKey}
          onFocus={onLogFocus}
          onBlur={onLogBlur}>
          <div className='runmap-log-inner'>
            {rows.map(({ key, step }) => (
              <div
                key={key}
                id={`${uid}-${key}`}
                role='option'
                aria-selected={litKey === key}
                className='runmap-row'
                data-match={(linked && inLog(step)) || undefined}
                data-out={!inLog(step) || undefined}
                data-lit={litKey === key || undefined}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setLitKey(key)
                }}
                onPointerLeave={() => setLitKey(null)}>
                <div className='runmap-row-clip'>
                  <div className='runmap-row-inner'>
                    {'tool' in step ? (
                      <>
                        <span className='runmap-tool' style={tint(step.tool, step.fail)}>
                          <span className='runmap-dot' aria-hidden='true' />
                          {TOOLS[step.tool].label}
                        </span>
                        <span className='runmap-text'>{step.text}</span>
                      </>
                    ) : (
                      <span className='runmap-note'>{step.note}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='rg-main'>
        <div ref={stageRef} className='rg-stage' role='group' aria-label='A graph of the agent’s run'>
          {w > 0 && (
            <>
              <div
                className='rg-frame'
                data-on={seen.includes(SUB) || undefined}
                data-done={reported || undefined}
                data-still={!dragging || undefined}
                style={{
                  ...tint(SUB),
                  left: n1(frame.left),
                  top: n1(frame.top),
                  width: n1(frame.right - frame.left),
                  height: n1(frame.bottom - frame.top),
                }}>
                <span className='rg-frame-name'>Sub-agent</span>
              </div>
              <svg className='rg-edges' width={w} height={h} aria-hidden='true'>
                {IDS.map((id) => {
                  const d = edgePath(at(TOOLS[id].parent), at(id))
                  return (
                    <g
                      key={id}
                      data-on={seen.includes(id) || undefined}
                      data-hot={hot.has(id) || undefined}
                      data-dropped={dropped.includes(id) || undefined}
                      // A route thickens with its calls, up to a cap so one busy tool can't swamp the rest
                      style={{ ...tint(id), '--rg-w': `${1.25 + Math.min(counts[id], 8) * 0.45}px` } as CSSProperties}>
                      <path className='rg-edge' d={d} pathLength={1} />
                      <path className='rg-edge-dash' d={d} />
                      <g
                        ref={(el) => {
                          packetRefs.current[id] = el
                        }}
                        className='rg-packet'>
                        <path className='rg-packet-halo' d={d} pathLength={1} />
                        <path d={d} pathLength={1} />
                      </g>
                    </g>
                  )
                })}
              </svg>
              <button
                {...nodeProps('agent')}
                style={spot('agent')}
                className='rg-node rg-agent'
                data-on
                aria-label={`Agent, ${STATE_NAMES[orb] ?? 'working'}. Arrow keys move it.`}>
                <span className='rg-orb'>
                  <AgentOrb state={orb} count={100} tuning={LOCKUP_P} className='w-10' />
                </span>
                <span className='rg-agent-name' aria-hidden='true'>
                  {word.was !== word.now && (
                    <span key={`${word.was}-${word.now}`} className='rg-word-out'>
                      {STATE_NAMES[word.was]}
                    </span>
                  )}
                  <span key={word.now} className={word.was !== word.now ? 'rg-word-in' : undefined}>
                    {STATE_NAMES[word.now]}
                  </span>
                </span>
              </button>
              {IDS.map((id) => {
                const Icon = ICONS[id]
                const on = seen.includes(id)
                const cap = caps[id]
                return (
                  <button
                    key={id}
                    {...nodeProps(id)}
                    style={{ ...spot(id), ...tint(id) }}
                    className='rg-node'
                    data-on={on || undefined}
                    data-dropped={dropped.includes(id) || undefined}
                    data-failing={failing.includes(id) || undefined}
                    tabIndex={on ? 0 : -1}
                    aria-hidden={!on}
                    aria-label={`${TOOLS[id].label}, ${plural(counts[id], 'call')}${failing.includes(id) ? ', last one failed' : ''}. Arrow keys move it.`}>
                    <span className='rg-body'>
                      <Icon aria-hidden='true' className='rg-icon' />
                      <span className='rg-name'>{TOOLS[id].label}</span>
                      <Count n={counts[id]} />
                      <span
                        ref={(el) => {
                          glowRefs.current[id] = el
                        }}
                        className='rg-glow'
                      />
                      <span
                        ref={(el) => {
                          ringRefs.current[id] = el
                        }}
                        className='rg-ring'
                      />
                    </span>
                    {cap && (
                      <span key={cap.n} className='rg-cap' aria-hidden='true'>
                        {cap.text}
                      </span>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>
        <div className='rg-time' data-scrub={scrubbing || undefined}>
          <div
            className='rg-time-inner'
            role='slider'
            tabIndex={0}
            aria-label='Run time. Arrow keys move through the run.'
            aria-valuemin={0}
            aria-valuemax={Math.round(LAST_AT)}
            aria-valuenow={sec}
            aria-valuetext={`${sec} seconds, ${chapter.name}`}
            onPointerDown={onScrubDown}
            onPointerMove={onScrubMove}
            onPointerUp={onScrubUp}
            onPointerCancel={onScrubUp}
            onKeyDown={onScrubKey}>
            {STEPS.map((step, i) => {
              const on = i < rows.length
              const call = 'tool' in step
              return (
                <span
                  key={i}
                  className='rg-bar'
                  style={{
                    left: pct((step.at * 1000) / TOTAL_MS),
                    width: call ? pct(CALL_SHARE) : undefined,
                    ...(call ? tint(step.tool, step.fail) : null),
                  }}
                  data-on={on || undefined}
                  data-note={!call || undefined}
                  data-upper={UPPER[i] || undefined}
                  data-dim={(on && !inLog(step)) || undefined}
                  data-lit={litKey === i || undefined}
                  onPointerEnter={(e) => {
                    if (!on || scrubbing || e.pointerType !== 'mouse') return
                    setLitKey(i)
                    setTip({ key: i, on: true })
                  }}
                  onPointerLeave={() => {
                    setLitKey(null)
                    setTip((t) => ({ ...t, on: false }))
                  }}
                />
              )
            })}
            <span className='rg-track' />
            <span ref={progressRef} className='rg-progress' />
            {CHAPTERS.map((c) => (
              <span
                key={c.name}
                className='rg-chapter'
                style={{ left: pct((c.at * 1000) / TOTAL_MS) }}
                data-now={c === chapter || undefined}>
                {c.name}
              </span>
            ))}
            <span
              ref={headRef}
              className='rg-head'
              style={lastTool && 'tool' in lastTool ? tint(lastTool.tool, lastTool.fail) : undefined}>
              <span className='rg-head-dot' />
              {sec}s
            </span>
            <span
              className='rg-tip'
              data-on={tip.on || undefined}
              style={{
                left: `clamp(70px, ${pct((tipStep.at * 1000) / TOTAL_MS)}, calc(100% - 70px))`,
                ...('tool' in tipStep ? tint(tipStep.tool, tipStep.fail) : null),
              }}>
              {'tool' in tipStep ? (
                <>
                  <span className='runmap-dot' />
                  <span className='rg-tip-tool'>{TOOLS[tipStep.tool].label}</span>
                  <span className='rg-tip-text'>{tipStep.text}</span>
                </>
              ) : (
                <span className='rg-tip-text'>{tipStep.note}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
