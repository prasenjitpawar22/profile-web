"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { BUCKETS, COLOR_STEPS, DEPTH_STEPS, createOrb, stepOrb, type Pointer } from "./particle-orb-sim"

type ParticleOrbProps = {
  count?: number
  /** px radius around the pointer that dots feel */
  reach?: number
  /** px a dot is pushed when the pointer sits right on it */
  strength?: number
  /** any CSS colour; pushed dots blend toward it. Resting dots use the text colour. */
  accent?: string
  /** Tailwind sizing classes; the orb is always square */
  className?: string
}

type RGB = [number, number, number]

export function ParticleOrb({
  count = 2000,
  reach = 70,
  strength = 40,
  accent = "hsl(222 100% 60%)",
  className = "w-[300px]",
}: ParticleOrbProps) {
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!wrap || !canvas || !ctx) return

    const orb = createOrb(count)
    const params = { reach, strength }
    const pointer: Pointer = { x: 0, y: 0, active: false, presence: 0 }
    const styles: string[] = new Array(BUCKETS)
    const radii = new Float32Array(DEPTH_STEPS)
    let size = 0
    let unwatchDpr = () => {}
    let raf = 0
    let last = 0
    let running = false
    let onScreen = true

    // let the canvas normalise any CSS colour, then read it back
    const parse = (color: string): RGB => {
      ctx.fillStyle = "#000"
      ctx.fillStyle = color
      const v = ctx.fillStyle
      if (v[0] === "#") return [1, 3, 5].map((n) => parseInt(v.slice(n, n + 2), 16)) as RGB
      const m = v.match(/[\d.]+/g)
      return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0]
    }

    const readColors = () => {
      const base = parse(getComputedStyle(wrap).color)
      const tint = parse(accent)
      for (let d = 0; d < DEPTH_STEPS; d++) {
        const alpha = 0.18 + 0.82 * ((d + 0.5) / DEPTH_STEPS) ** 1.5
        for (let c = 0; c < COLOR_STEPS; c++) {
          const k = c / (COLOR_STEPS - 1)
          const [r, g, b] = base.map((v, n) => Math.round(v + (tint[n] - v) * k))
          styles[d * COLOR_STEPS + c] = `rgba(${r},${g},${b},${alpha.toFixed(3)})`
        }
      }
    }

    const render = (dt: number) => {
      stepOrb(orb, dt, size, pointer, params)
      ctx.clearRect(0, 0, size, size)
      for (let b = 0; b < BUCKETS; b++) {
        const from = orb.start[b]
        const to = orb.start[b + 1]
        if (from === to) continue
        // one path and one fill per bucket; round dots stay crisp at any zoom
        const s = radii[(b / COLOR_STEPS) | 0]
        ctx.fillStyle = styles[b]
        ctx.beginPath()
        for (let k = from; k < to; k++) {
          const i = orb.order[k]
          ctx.moveTo(orb.x[i] + s, orb.y[i])
          ctx.arc(orb.x[i], orb.y[i], s, 0, Math.PI * 2)
        }
        ctx.fill()
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      render(dt)
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
      canvas.width = canvas.height = Math.round(size * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // dots, reach and push are tuned at 300px and scale with the orb
      const scale = size / 300
      params.reach = reach * scale
      params.strength = strength * scale
      const r = Math.max(scale, 0.75)
      for (let d = 0; d < DEPTH_STEPS; d++) radii[d] = (0.4 + (0.5 * (d + 0.5)) / DEPTH_STEPS) * r

      if (!running) render(0)
    }

    // browser zoom changes devicePixelRatio without resizing the element,
    // so ResizeObserver never fires; watch the resolution directly
    const watchDpr = () => {
      const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      const onChange = () => {
        resize()
        watchDpr()
      }
      mq.addEventListener("change", onChange, { once: true })
      unwatchDpr = () => mq.removeEventListener("change", onChange)
    }

    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      pointer.x = e.clientX - b.left
      pointer.y = e.clientY - b.top
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
    }

    readColors()
    resize()
    watchDpr()

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    io.observe(wrap)
    // theme toggles flip a class on <html>; re-read the text colour
    const mo = new MutationObserver(() => {
      readColors()
      if (!running) render(0)
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    document.addEventListener("visibilitychange", sync)
    if (!reduce) {
      wrap.addEventListener("pointermove", onMove)
      wrap.addEventListener("pointerleave", onLeave)
      wrap.addEventListener("pointercancel", onLeave)
    }
    sync()

    return () => {
      cancelAnimationFrame(raf)
      unwatchDpr()
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", sync)
      wrap.removeEventListener("pointermove", onMove)
      wrap.removeEventListener("pointerleave", onLeave)
      wrap.removeEventListener("pointercancel", onLeave)
    }
  }, [count, reach, strength, accent, reduce])

  return (
    <div ref={wrapRef} className={`aspect-square text-foreground ${className}`}>
      <canvas ref={canvasRef} aria-hidden className="block size-full" />
    </div>
  )
}
