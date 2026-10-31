'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createLogogram, type Pointer } from './logogram-sim'

export function Logogram() {
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const logogram = createLogogram()
    const p: Pointer = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, active: false, hold: 0 }
    let rgb: [number, number, number] = [0, 0, 0]
    let raf = 0
    let last = 0
    let lastMove = 0
    let visible = true

    const readColor = () => {
      const m = getComputedStyle(wrap).color.match(/\d+(\.\d+)?/g)
      if (m) rgb = [+m[0], +m[1], +m[2]]
    }
    const resize = () => {
      const b = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(b.width * dpr)
      canvas.height = Math.round(b.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      logogram.resize(ctx, b.width, b.height)
    }
    // Reduced motion: write the whole symbol at once and show it still
    const still = () => {
      for (let i = 0; i < 640; i++) logogram.step(16, p)
      logogram.draw(ctx, rgb)
    }

    const tick = (now: number) => {
      const dt = Math.min(now - last, 48)
      last = now
      p.speed *= Math.exp(-dt / 220)
      p.hold += ((p.active ? 1 : 0) - p.hold) * Math.min(1, dt / 160)
      logogram.step(dt, p)
      logogram.draw(ctx, rgb)
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      const x = e.clientX - b.left
      const y = e.clientY - b.top
      const now = performance.now()
      const dt = Math.max(now - lastMove, 1)
      if (p.active && dt < 100) {
        const vx = (x - p.x) / dt
        const vy = (y - p.y) / dt
        p.vx += (vx - p.vx) * 0.5
        p.vy += (vy - p.vy) * 0.5
        p.speed = Math.max(p.speed, Math.hypot(vx, vy))
      }
      p.x = x
      p.y = y
      p.active = true
      lastMove = now
    }
    const onLeave = () => {
      p.active = false
    }
    const onDown = () => {
      logogram.exhale()
      if (reduce) still()
    }

    readColor()
    resize()
    if (reduce) still()

    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) still()
    })
    ro.observe(canvas)
    // Theme toggles flip a class on <html>; re-read the glyph colour
    const mo = new MutationObserver(() => {
      readColor()
      if (reduce) logogram.draw(ctx, rgb)
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    // Stops drawing while scrolled away
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(wrap)
    const onVisible = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisible)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    wrap.addEventListener('pointercancel', onLeave)
    wrap.addEventListener('pointerdown', onDown)
    start()

    return () => {
      stop()
      ro.disconnect()
      mo.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisible)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
      wrap.removeEventListener('pointercancel', onLeave)
      wrap.removeEventListener('pointerdown', onDown)
    }
  }, [reduce])

  return (
    <div className='relative h-[420px] w-full'>
      {/* Bleeds past the stage padding, so smoke can drift to the edges */}
      <div
        ref={wrapRef}
        className='absolute -inset-6 touch-pan-y select-none font-mono text-foreground'>
        <canvas ref={canvasRef} aria-hidden className='h-full w-full' />
      </div>
    </div>
  )
}
