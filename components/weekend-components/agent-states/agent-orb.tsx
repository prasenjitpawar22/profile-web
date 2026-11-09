'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import {
  alphaStyles,
  createSim,
  drawSim,
  setSimState,
  settleSim,
  stepSim,
  type Sim,
  type StateId,
} from './sim'
import { LOCKUP_P, type Tuning } from './tuning'

type AgentOrbProps = {
  state: StateId
  count?: number
  /** The orb's numbers, for a size that needs its own. Keep the reference stable */
  tuning?: Tuning
  /** Tailwind sizing classes; the orb is always square */
  className?: string
}

/**
 * The orb beside a status line, tuned by eye in /proto/agent-indicator. The canvas keeps 12% of
 * its width empty on each side, so the margins pull the visible orb flush with the rows below
 * and leave 8px to the status text.
 */
export const ORB_LOCKUP = { count: 100, tuning: LOCKUP_P, className: '-ml-[4.32px] mr-[3.68px] w-9 shrink-0' }

export function AgentOrb({ state, count = 1600, tuning, className = 'w-[280px]' }: AgentOrbProps) {
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  const simRef = useRef<Sim | null>(null)
  const redrawRef = useRef<() => void>(() => {})
  const sizeRef = useRef(0)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const sim = createSim(count, stateRef.current, tuning)
    simRef.current = sim
    let styles: string[] = []
    let size = 0
    let raf = 0
    let last = 0
    let running = false
    let onScreen = true

    // let the canvas normalise any CSS colour, then read it back
    const readColor = () => {
      ctx.fillStyle = '#000'
      ctx.fillStyle = getComputedStyle(wrap).color
      const v = ctx.fillStyle
      const rgb =
        v[0] === '#'
          ? ([1, 3, 5].map((n) => parseInt(v.slice(n, n + 2), 16)) as [number, number, number])
          : (v.match(/[\d.]+/g)!.slice(0, 3).map(Number) as [number, number, number])
      styles = alphaStyles(rgb)
    }

    const redraw = () => drawSim(ctx, sim, size, styles)
    redrawRef.current = redraw

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      stepSim(sim, dt, size)
      redraw()
    }

    // only animate while visible
    const sync = () => {
      const want = !reduce && onScreen && !document.hidden
      if (want === running) return
      running = want
      if (want) {
        last = 0
        raf = requestAnimationFrame(frame)
      } else {
        cancelAnimationFrame(raf)
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      size = wrap.getBoundingClientRect().width
      sizeRef.current = size
      canvas.width = canvas.height = Math.round(size * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduce) settleSim(sim, sim.state, size)
      redraw()
    }

    readColor()
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    io.observe(wrap)
    // theme toggles flip a class on <html>; re-read the text colour
    const mo = new MutationObserver(() => {
      readColor()
      redraw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    document.addEventListener('visibilitychange', sync)
    sync()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [count, tuning, reduce])

  useEffect(() => {
    stateRef.current = state
    const sim = simRef.current
    if (!sim) return
    if (reduce) {
      settleSim(sim, state, sizeRef.current)
      redrawRef.current()
    } else {
      setSimState(sim, state)
    }
  }, [state, reduce])

  return (
    <div ref={wrapRef} className={`aspect-square text-foreground ${className}`}>
      <canvas ref={canvasRef} aria-hidden className='block size-full' />
    </div>
  )
}
