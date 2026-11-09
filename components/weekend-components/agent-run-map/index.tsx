'use client'

import { RotateCcw } from 'lucide-react'
import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import './agent-run-map.css'
import { RunMapEngine, type Food } from './engine'
import { ROOT, STEPS, TASK, TOOLS, type Step, type ToolId } from './run'

/** Heat added per call, and how long it takes to fade (ms) */
const CALL_HEAT = 1.4
const HEAT_FADE = 9000
/** Lasting traffic per call, so the finished map still shows what got used */
const LASTING = 0.09
/** How much of the demo must be showing before the run starts, so its opening isn't missed */
const START_AT = 0.3

const IDS = Object.keys(TOOLS) as ToolId[]
const LAST_AT = STEPS[STEPS.length - 1].at
const blank = () => Object.fromEntries(IDS.map((id) => [id, 0])) as Record<ToolId, number>
const fresh = () => ({ clock: 0, next: 0, heat: blank(), calls: blank(), dropped: new Set<ToolId>() })

type Row = { key: number; step: Step }

export function AgentRunMap() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<RunMapEngine | null>(null)
  const labelRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({})
  const replayRef = useRef<() => void>(() => {})

  // Mutated every frame; only what's on screen as text goes through React
  const run = useRef(fresh())
  const [rows, setRows] = useState<Row[]>([])
  const [counts, setCounts] = useState(blank)
  const [failed, setFailed] = useState(false)

  const done = rows.length === STEPS.length
  const callCount = rows.filter((r) => 'tool' in r.step).length

  useEffect(() => {
    const root = rootRef.current!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let started = false

    const fire = (step: Step, key: number) => {
      const engine = engineRef.current!
      const r = run.current
      if ('tool' in step) {
        // A tool under a sub-agent brings the sub-agent up first, and its traffic
        // runs through the sub-agent's route as well as its own
        const chain: ToolId[] = TOOLS[step.tool].parent === 'agent' ? [step.tool] : ['explore', step.tool]
        for (const id of chain) {
          engine.addNode(TOOLS[id])
          r.heat[id] += CALL_HEAT
          r.calls[id] += 1
          engine.pulse(id)
        }
        setCounts({ ...r.calls })
      } else if (step.drop) {
        r.dropped.add(step.drop)
        r.heat[step.drop] = 0
        engine.setSize(step.drop, 4)
      }
      setRows((prev) => [...prev, { key, step }])
    }

    const playAll = () => {
      STEPS.forEach((s, i) => fire(s, i))
      run.current.next = STEPS.length
    }

    const onFrame = (dt: number, nodes: readonly Food[], w: number, h: number) => {
      const r = run.current
      const engine = engineRef.current
      if (!engine) return

      if (started && !reduced) {
        // Driven by frames, so the script can't run ahead of the picture
        r.clock += Math.min(dt, 50)
        while (r.next < STEPS.length && STEPS[r.next].at * 1000 <= r.clock) {
          fire(STEPS[r.next], r.next)
          r.next++
        }
      }

      const keep = reduced ? 1 : Math.exp(-dt / HEAT_FADE)
      for (const id of IDS) {
        r.heat[id] *= keep
        engine.setWeight(id, r.dropped.has(id) ? 0 : r.heat[id] + r.calls[id] * LASTING)
      }

      for (const n of nodes) {
        const el = labelRefs.current[n.id]
        if (!el) continue
        const gap = n.size + n.pulse * 3 + 8
        el.style.transform = `translate3d(${n.x * w}px, ${(1 - n.y) * h + gap}px, 0) translateX(-50%)`
        el.style.opacity = String(n.presence * (r.dropped.has(n.id as ToolId) ? 0.45 : 1))
      }
      // A replay clears the map, and the labels have to leave with their flakes
      for (const id of IDS) {
        const el = labelRefs.current[id]
        if (el && !nodes.some((n) => n.id === id)) el.style.opacity = '0'
      }
    }

    replayRef.current = () => {
      engineRef.current?.restart()
      run.current = fresh()
      setRows([])
      setCounts(blank())
      if (reduced && engineRef.current) playAll()
    }

    // The engine is built the first time the demo comes on screen, so the Lab
    // doesn't pay for a colony nobody has scrolled to
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !engineRef.current) {
          try {
            engineRef.current = new RunMapEngine(canvasRef.current!, { root: ROOT, onFrame })
          } catch {
            setFailed(true)
            io.disconnect()
            return
          }
          if (reduced) playAll()
        }
        engineRef.current?.setActive(entry.isIntersecting)
        if (entry.intersectionRatio >= START_AT) started = true
      },
      { threshold: [0, START_AT] },
    )
    io.observe(root)

    return () => {
      io.disconnect()
      engineRef.current?.dispose()
      engineRef.current = null
      run.current = fresh()
      setRows([])
      setCounts(blank())
    }
  }, [])

  const moveFlake = (id: string, e: KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 12
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (!delta) return
    e.preventDefault()
    engineRef.current?.nudge(id, delta[0], delta[1])
  }

  const statusRunning = failed ? 'This browser can’t run the map' : `Running, ${callCount} calls`

  return (
    <div ref={rootRef} className='runmap'>
      <div className='runmap-rail'>
        <div className='runmap-head'>
          <div>
            <p className='runmap-title'>{TASK}</p>
            <p className='runmap-status'>
              <span data-hidden={done || undefined} aria-hidden={done}>
                {statusRunning}
              </span>
              <span data-hidden={!done || undefined} aria-hidden={!done}>
                Done in {Math.round(LAST_AT)}s, {callCount} calls
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
        <div className='runmap-log'>
          {rows.map(({ key, step }) => (
            <div key={key} className='runmap-row'>
              <div className='runmap-row-clip'>
                <div className='runmap-row-inner'>
                  {'tool' in step ? (
                    <>
                      <span className='runmap-tool'>{TOOLS[step.tool].label}</span>
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
      <div className='runmap-stage'>
        <canvas
          ref={canvasRef}
          aria-label='A map of the agent’s run. Each tool is a flake, and routes thicken with use.'
        />
        <button
          ref={(el) => {
            labelRefs.current.agent = el
          }}
          type='button'
          className='runmap-label'
          aria-label='Agent. Arrow keys move it.'
          onKeyDown={(e) => moveFlake('agent', e)}>
          Agent
        </button>
        {IDS.map((id) => (
          <button
            key={id}
            ref={(el) => {
              labelRefs.current[id] = el
            }}
            type='button'
            className='runmap-label'
            tabIndex={counts[id] > 0 ? 0 : -1}
            aria-hidden={counts[id] === 0}
            aria-label={`${TOOLS[id].label}, ${counts[id]} calls. Arrow keys move it.`}
            onKeyDown={(e) => moveFlake(id, e)}>
            {TOOLS[id].label}
            <span className='runmap-count'>{counts[id]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
