'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { MODES, createSand, setMode, settle, stepSand } from './chladni-plate-sim'

/** Seconds each figure holds before the plate rings at the next note */
const HOLD = 4
/** Grains at a 550px plate; scaled by area so density stays the same */
const GRAINS = 24000
const GRAIN = 1.2

const label = (i: number) => `${MODES[i][0]} × ${MODES[i][1]}`

export function ChladniPlate({ className = 'w-[300px]' }: { className?: string }) {
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const nextRef = useRef<() => void>(() => {})

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    let size = 0
    let sand = createSand(0)
    let mode = 0
    let elapsed = 0
    let ink = getComputedStyle(wrap).color
    let raf = 0
    let last = 0
    let running = false
    let onScreen = true

    const draw = () => {
      const pad = Math.round(size * 0.045)
      const inner = size - pad * 2
      const h = GRAIN / 2
      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = ink
      ctx.globalAlpha = 0.8
      for (let i = 0; i < sand.x.length; i++) {
        ctx.fillRect(pad + sand.x[i] * inner - h, pad + sand.y[i] * inner - h, GRAIN, GRAIN)
      }
      ctx.globalAlpha = 1
    }

    const go = (i: number) => {
      mode = i % MODES.length
      elapsed = 0
      setMode(sand, mode)
      if (reduce) {
        settle(sand)
        draw()
      }
      if (readoutRef.current) readoutRef.current.textContent = label(mode)
    }
    nextRef.current = () => go(mode + 1)

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      elapsed += dt
      if (elapsed >= HOLD) go(mode + 1)
      stepSand(sand, dt * 60)
      draw()
    }

    // Only animate while visible
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = wrap.getBoundingClientRect().width
      canvas.width = canvas.height = Math.round(size * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(6000, Math.round(GRAINS * (size / 550) ** 2))
      if (count !== sand.x.length) {
        sand = createSand(count)
        go(mode)
      }
      if (!running) draw()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    io.observe(wrap)
    // Theme toggles flip a class on <html>; re-read the text colour
    const mo = new MutationObserver(() => {
      ink = getComputedStyle(wrap).color
      if (!running) draw()
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
  }, [reduce])

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div ref={wrapRef} className='aspect-square text-foreground'>
        <canvas
          ref={canvasRef}
          role='img'
          aria-label='Sand on a vibrating plate, gathering into the lines where the plate stays still'
          className='block size-full'
        />
      </div>
      <div className='flex items-center justify-between'>
        <span ref={readoutRef} className='text-[13px] tabular-nums text-muted-foreground'>
          {label(0)}
        </span>
        <button
          type='button'
          onClick={() => nextRef.current()}
          className='-mr-3 h-10 touch-manipulation rounded-md px-3 text-[13px] font-medium text-foreground transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] motion-reduce:transition-none'>
          Next note
        </button>
      </div>
    </div>
  )
}
