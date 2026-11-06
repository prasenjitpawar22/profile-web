'use client'

import { createOrb, type Pointer } from '@/components/weekend-components/particle-orb-sim'
import { RefObject, useEffect, useRef } from 'react'

// Everything behind the card: a soft liquid star built like the particle orb, and a
// loose field of the same dots across the whole card. One colour; depth is opacity and
// size. Star dots sit on a spinning sphere mapped into the star's outline. All of them
// are on springs and can be pushed. Behind text the field quietens, so text stays clean.
//
// The star is switched off for now: its drawing is commented out in the blocks marked
// STAR. Uncomment those to bring it back. The field runs on without it.

const STAR_COUNT = 1300
/** Field dots per square px, up to a limit */
const FIELD_DENSITY = 0.0068
const FIELD_MAX = 2600
const TAU = Math.PI * 2
const N = 720
const CIRCLE = 0.66
/** Behind text a field dot is capped at this opacity, the most that keeps muted text at
 *  4.5:1 with a dot right behind it. Shrinking dots isn't enough: a small dot still
 *  reaches full strength on the pixels it covers */
const QUIET_ALPHA = 0.14
/** Steps between full strength and quiet, so a dot eases across the edge of a text area */
const QUIET_STEPS = 4
const STACK_GAP = 20

/** Tips the sphere's spin axis toward the viewer, as on the orb */
const TILT = 0.4
const COS_TILT = Math.cos(TILT)
const SIN_TILT = Math.sin(TILT)
/** Shell radius wobble, as a share of the radius */
const BREATH = 0.015
const STIFFNESS = 120
const DAMPING = 10 // under-damped: dots overshoot a touch before settling
const MAX_STEP = 1 / 60
/** Pointer reach and push in px, tuned at the orb's 108px radius */
const REACH = 70
const STRENGTH = 40
/** Outward kick when a source opens, in px per second at that same radius */
const KICK = 190
/** The field is quieter than the star, in strength and in response */
const FIELD_ALPHA = 0.74
const FIELD_KICK = 0.4
/** Field drift in px per second, per step, for the nearest dots */
const DRIFT = [7, 15, 9, 5]

const DEPTHS = 5
const ALPHA = Array.from({ length: DEPTHS }, (_, d) => 0.18 + 0.82 * ((d + 0.5) / DEPTHS) ** 1.5)
const SIZE = Array.from({ length: DEPTHS }, (_, d) => 0.4 + (0.5 * (d + 0.5)) / DEPTHS)

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const approach = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-dt * rate))

type Spring = { x: number; v: number }
/** Stepped finely, so it behaves the same at any frame rate and can overshoot */
const spring = (s: Spring, to: number, omega: number, damping: number, dt: number) => {
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240)
    s.v += (omega * omega * (to - s.x) - 2 * damping * omega * s.v) * h
    s.x += s.v * h
  }
}

// ---- the star -----------------------------------------------------------------

/** Exact distance to a star of four shallow arcs. Subtracting a radius from it
 *  turns each tip into a true semicircle, which is where the softness comes from */
const ARC_CENTRE = 1.34
const ARC_RADIUS = Math.hypot(ARC_CENTRE - 1, ARC_CENTRE)
function starDistance(u: number, v: number) {
  const x = Math.abs(u)
  const y = Math.abs(v)
  const ax = x - ARC_CENTRE
  const ay = y - ARC_CENTRE
  const l = Math.hypot(ax, ay) || 1e-6
  const qx = ARC_CENTRE + (ax / l) * ARC_RADIUS
  const qy = ARC_CENTRE + (ay / l) * ARC_RADIUS
  const onArc = qx >= 0 && qy >= 0 && qx + qy < 2 * ARC_CENTRE
  const dist = onArc ? Math.abs(l - ARC_RADIUS) : Math.min(Math.hypot(x - 1, y), Math.hypot(x, y - 1))
  return l > ARC_RADIUS && x + y < 1 ? -dist : dist
}

let cached: { star: Float32Array; warp: Float32Array } | null = null
const getStar = () => {
  if (cached) return cached
  const size = 0.88
  const corner = 0.1
  const star = new Float32Array(N + 1)
  for (let i = 0; i < N; i++) {
    const th = (i / N) * TAU
    const c = Math.cos(th)
    const s = Math.sin(th)
    let lo = 0
    let hi = 1.4
    for (let k = 0; k < 22; k++) {
      const m = (lo + hi) / 2
      if (starDistance((m * c) / size, (m * s) / size) * size - corner < 0) lo = m
      else hi = m
    }
    star[i] = (lo + hi) / 2
  }
  star[N] = star[0]

  // A sphere gives every angle the same number of dots, but the star's tips hold far
  // more area than its waist. This table respaces the angles by area, so the dots
  // spread evenly and the tips don't go thin.
  const cdf = new Float32Array(N + 1)
  for (let i = 0; i < N; i++) cdf[i + 1] = cdf[i] + star[i] * star[i]
  const warp = new Float32Array(N + 1)
  let k = 0
  for (let i = 0; i <= N; i++) {
    const want = (i / N) * cdf[N]
    while (k < N - 1 && cdf[k + 1] < want) k++
    const span = cdf[k + 1] - cdf[k] || 1
    warp[i] = ((k + (want - cdf[k]) / span) / N) * TAU
  }
  cached = { star, warp }
  return cached
}

/** Reads a table of N+1 entries at a position of 0..1 around the circle */
const sample = (t: Float32Array, at: number) => {
  const a = (at - Math.floor(at)) * N
  const k = Math.min(N - 1, Math.floor(a))
  return t[k] + (t[k + 1] - t[k]) * (a - k)
}

// ---- the liquid outline --------------------------------------------------------

type Frame = {
  dt: number
  /** 0 read, 1 search, 2 sources, 3 draft */
  step: number
}

type Pose = {
  outline: Float32Array
  /** Slow turn of the whole figure */
  rot: number
}

/** Radians per second, per step. Slow always, a little quicker in search */
const TURN = [0.2, 0.32, 0.24, 0.12]
/** How far the arms wander, per step. Drafting resolves to a clean star */
const WANDER = [0.16, 0.34, 0.22, 0]

const liquid = () => {
  const { star } = getStar()
  const outline = new Float32Array(N + 1)
  const waves = [
    { k: 1, a: 0.3, s: 0.7, p: 0 },
    { k: 2, a: 0.46, s: -0.52, p: 1.3 },
    { k: 3, a: 0.56, s: 0.94, p: 3.9 },
    { k: 5, a: 0.1, s: -1.2, p: 5.2 },
  ]
  // On a spring, so the star lands with a little wobble when it resolves
  const amount: Spring = { x: 0.1, v: 0 }
  let rot = 0
  let speed = TURN[0]
  return (f: Frame): Pose => {
    spring(amount, WANDER[f.step], 5, 0.62, f.dt)
    speed = approach(speed, TURN[f.step], 2, f.dt)
    rot += speed * f.dt
    const a = amount.x
    waves.forEach((w) => (w.p += w.s * (1 + a * 2.4) * f.dt))
    for (let i = 0; i < N; i++) {
      const th = (i / N) * TAU
      let swell = 0
      for (const w of waves) swell += w.a * Math.sin(w.k * th + w.p)
      // Mostly the arms: the waist holds, so it stays balanced around its centre
      outline[i] = star[i] * (1 + a * swell * (0.25 + 0.75 * ss(0.55, 0.95, star[i])))
    }
    outline[N] = outline[0]
    return { outline, rot }
  }
}

// ---- the particles -------------------------------------------------------------

type Live = {
  step: number
  sources: number
  leaving: boolean
  /** Nothing more is coming: the field slows to a stop and drawing pauses */
  resting: boolean
}

type Target = {
  ctx: CanvasRenderingContext2D
  W: number
  H: number
  /** The star's centre and radius */
  cx: number
  cy: number
  R: number
  /** The box the text fills: dots stay quiet behind it */
  textBox: { l: number; t: number; r: number; b: number } | null
  ink: string
}

/** How fast the particles stream through the star, per step */
const FLOW = [0.18, 0.36, 0.24, 0.1]

/** Everything that plays over time, independent of the clock that drives it */
const player = (reduce: boolean, pointer: Pointer) => {
  const pose = liquid()
  const { star, warp } = getStar()
  const dots = createOrb(STAR_COUNT)
  const { lon, cosLat, sinLat, rad, drift, phase, ox, oy, vx, vy } = dots
  const starLayers: number[][] = ALPHA.map(() => [])
  const fieldLayers: number[][] = Array.from({ length: DEPTHS * QUIET_STEPS }, () => [])

  // The field: a position across the card, a depth, a phase, and its own springs
  const fx = new Float32Array(FIELD_MAX)
  const fy = new Float32Array(FIELD_MAX)
  const fz = new Float32Array(FIELD_MAX)
  const fp = new Float32Array(FIELD_MAX)
  const fox = new Float32Array(FIELD_MAX)
  const foy = new Float32Array(FIELD_MAX)
  const fvx = new Float32Array(FIELD_MAX)
  const fvy = new Float32Array(FIELD_MAX)
  for (let i = 0; i < FIELD_MAX; i++) {
    fx[i] = Math.random()
    fy[i] = Math.random()
    fz[i] = Math.random()
    fp[i] = Math.random() * TAU
  }

  const enter: Spring = { x: 0, v: 0 }
  const beat: Spring = { x: 0, v: 0 }
  let t = 0
  let flow = 0
  let flowSpeed = FLOW[0]
  let driftSpeed = DRIFT[0]
  let out = 0
  let seen = 0
  let textBottom = 0
  let calm = 0
  let moving = 1

  const spring2 = (ax: Float32Array, ay: Float32Array, bx: Float32Array, by: Float32Array, i: number, fxx: number, fyy: number, dt: number) => {
    for (let left = dt; left > 0; left -= MAX_STEP) {
      const h = Math.min(left, MAX_STEP)
      bx[i] += (fxx - STIFFNESS * ax[i] - DAMPING * bx[i]) * h
      by[i] += (fyy - STIFFNESS * ay[i] - DAMPING * by[i]) * h
      ax[i] += bx[i] * h
      ay[i] += by[i] * h
    }
  }

  return (dt: number, live: Live, { ctx, W, H, cx, cy, R, textBox, ink }: Target) => {
    // Everything has settled: leave the last frame up. A dt of 0 is a forced redraw
    if (dt > 0 && live.resting && calm > 0.99 && moving < 0.5 && !pointer.active && pointer.presence < 0.01 && Math.abs(textBottom - (textBox?.b ?? 0)) < 0.5) return

    t += dt
    const step = clamp(live.step, 0, 3)
    // Blooms out of a round dot, closes back into one. Exit is quicker than entry
    spring(enter, 1, 7, 0.74, dt)
    out = live.leaving ? out + dt : 0
    const closing = Math.pow(clamp(out / 0.34), 2)
    const open = reduce ? (live.leaving ? 0 : 1) : clamp(enter.x, 0, 1.2) * (1 - closing)
    const visible = open > 0.01

    const unit = R / 108
    const kicked = live.sources > seen && !reduce
    if (kicked) beat.v += 1.5
    seen = Math.max(seen, live.sources)
    spring(beat, 0, 13, 0.7, dt)

    // The text grows row by row, and the quiet area eases down after it
    textBottom = textBox ? (textBottom > 0 ? approach(textBottom, textBox.b, 6, dt) : textBox.b) : 0
    calm = reduce ? 1 : approach(calm, live.resting ? 1 : 0, 1.6, dt)

/* STAR
    const p: Pose = reduce ? { outline: star, rot: 0 } : pose({ dt, step })
*/
    flowSpeed = approach(flowSpeed, FLOW[step], 2, dt)
    flow += flowSpeed * dt
    driftSpeed = approach(driftSpeed, DRIFT[step], 2, dt) * (1 - calm)

    pointer.presence += ((pointer.active ? 1 : 0) - pointer.presence) * (1 - Math.exp(-dt * 8))
    const reach = REACH * unit
    const pull = STRENGTH * unit * STIFFNESS * pointer.presence
    const scale = (0.3 + 0.7 * open) * (1 + 0.1 * beat.x)
    const round = 1 - Math.min(1, open)
    const lift = ss(0, 0.5, open)
    const dotScale = Math.max(unit, 0.75)
    const push = (hx: number, hy: number, depth: number, out: [number, number]) => {
      out[0] = 0
      out[1] = 0
      if (pull <= 0) return
      const dx = hx - pointer.x
      const dy = hy - pointer.y
      const d2 = dx * dx + dy * dy
      if (d2 < reach * reach && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const k = 1 - d / reach
        const force = (k * k * pull * (0.4 + 0.6 * depth)) / d
        out[0] = dx * force
        out[1] = dy * force
      }
    }
    const force: [number, number] = [0, 0]
    starLayers.forEach((l) => (l.length = 0))
    fieldLayers.forEach((l) => (l.length = 0))
    let fastest = 0

    // ---- the field, behind everything
    const fieldCount = Math.min(FIELD_MAX, Math.round(W * H * FIELD_DENSITY))
    const fieldIn = reduce ? 1 : ss(0, 0.9, t)
    for (let i = 0; i < fieldCount; i++) {
      const z = fz[i]
      // A slow current, so neighbours travel together; nearer dots go faster
      const u = fx[i]
      const v = fy[i]
      const pace = driftSpeed * (0.35 + 0.65 * z)
      fx[i] = u + ((pace * (0.7 + 0.5 * Math.sin(v * 5 + t * 0.13))) / W) * dt
      fy[i] = v + ((pace * 0.55 * Math.sin(u * 6 + fp[i] * 0.2 + t * 0.17)) / H) * dt
      fx[i] -= Math.floor(fx[i])
      fy[i] -= Math.floor(fy[i])
      const hx = fx[i] * W
      const hy = fy[i] * H

      push(hx + fox[i], hy + foy[i], z, force)
      if (kicked) {
        const dx = hx - cx
        const dy = hy - cy
        const l = Math.hypot(dx, dy) || 1
        const kick = (KICK * unit * FIELD_KICK * (0.5 + 0.5 * Math.sin(fp[i] * 3))) / Math.max(l, 60)
        fvx[i] += dx * kick
        fvy[i] += dy * kick
      }
      spring2(fox, foy, fvx, fvy, i, force[0], force[1], dt)
      fastest = Math.max(fastest, Math.abs(fvx[i]) + Math.abs(fvy[i]))
      const x = hx + fox[i]
      const y = hy + foy[i]

      let seen01 = fieldIn
/* STAR
      // Keeps out of the star, so its outline stays clean
      if (visible) {
        const dx = x - cx
        const dy = cy - y
        const d = Math.hypot(dx, dy)
        if (d < R * scale * 1.35) {
          const shape = sample(p.outline, (Math.atan2(dy, dx) - p.rot) / TAU)
          seen01 *= ss(1.06, 1.42, d / (R * scale * (shape + (CIRCLE - shape) * round)))
        }
      }
*/
      // Quiet behind text only. The open card around it keeps full-strength dots
      const quiet = textBox ? ss(textBox.l - 20, textBox.l, x) * ss(textBox.r + 20, textBox.r, x) * ss(textBox.t - 16, textBox.t, y) * ss(textBottom + 16, textBottom, y) : 0
      if (seen01 < 0.04) continue
      fieldLayers[Math.min(DEPTHS - 1, Math.floor(z * DEPTHS)) * QUIET_STEPS + Math.round(quiet * (QUIET_STEPS - 1))].push(x, y, seen01)
    }

/* STAR
    // ---- the star
    if (visible)
      for (let i = 0; i < STAR_COUNT; i++) {
        // A point on the tilted, spinning sphere, as on the orb
        const a = lon[i] + flow + drift[i] * t
        const sx = cosLat[i] * Math.sin(a)
        const y0 = sinLat[i]
        const z0 = cosLat[i] * Math.cos(a)
        const sy = y0 * COS_TILT - z0 * SIN_TILT
        const sz = y0 * SIN_TILT + z0 * COS_TILT

        // Then into the star: its angle respaced by area, its reach set by the outline
        const inner = Math.hypot(sx, sy)
        const turned = Math.atan2(sy, sx) - p.rot
        const beta = sample(warp, turned / TAU)
        const shape = sample(p.outline, beta / TAU)
        const reachOut = inner * R * scale * (rad[i] + BREATH * Math.sin(t * 1.5 + phase[i])) * (shape + (CIRCLE - shape) * round)
        const hx = cx + reachOut * Math.cos(beta + p.rot)
        const hy = cy - reachOut * Math.sin(beta + p.rot)

        // Spring state: pointer pushes dots off home, stronger on the near side
        const depth = (sz + 1) / 2
        push(hx + ox[i], hy + oy[i], depth, force)
        if (kicked) {
          // A source opens and the whole star takes a breath outward, unevenly
          const l = reachOut || 1
          const k = (KICK * unit * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(phase[i] * 3)))) / l
          vx[i] += (hx - cx) * k
          vy[i] += (hy - cy) * k
        }
        spring2(ox, oy, vx, vy, i, force[0], force[1], dt)
        starLayers[Math.min(DEPTHS - 1, Math.floor(depth * DEPTHS))].push(hx + ox[i], hy + oy[i], 1)
      }
*/
    moving = fastest

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = ink
    // One path and one fill per layer; round dots stay crisp at any zoom
    const trace = (list: number[], depth: number) => {
      const size = SIZE[depth] * dotScale
      for (let k = 0; k < list.length; k += 3) {
        const r = size * list[k + 2]
        ctx.moveTo(list[k] + r, list[k + 1])
        ctx.arc(list[k], list[k + 1], r, 0, TAU)
      }
    }
    const fillDots = (list: number[], depth: number, alpha: number) => {
      if (!list.length) return
      ctx.globalAlpha = alpha
      ctx.beginPath()
      trace(list, depth)
      ctx.fill()
    }
    const last = QUIET_STEPS - 1
    fieldLayers.forEach((list, k) => {
      if (k % QUIET_STEPS === last) return
      const depth = Math.floor(k / QUIET_STEPS)
      const full = ALPHA[depth] * FIELD_ALPHA
      fillDots(list, depth, full + (Math.min(full, QUIET_ALPHA) - full) * ((k % QUIET_STEPS) / last))
    })
    // Every fully quiet dot goes in a single fill, so overlapping ones can't add up
    ctx.globalAlpha = QUIET_ALPHA
    ctx.beginPath()
    for (let depth = 0; depth < DEPTHS; depth++) trace(fieldLayers[depth * QUIET_STEPS + last], depth)
    ctx.fill()
/* STAR
    if (visible) starLayers.forEach((list, depth) => fillDots(list, depth, ALPHA[depth] * lift))
*/
    ctx.globalAlpha = 1
  }
}

// ---- the component -------------------------------------------------------------

export function DotStar({
  text,
  step,
  sources,
  leaving,
  resting,
  reduce,
}: {
  /** The text on the card: the trace and the answer */
  text: RefObject<HTMLElement>
  step: number
  sources: number
  /** True once thinking is done: the star closes into a round dot and is gone */
  leaving: boolean
  resting: boolean
  reduce: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const redrawRef = useRef<() => void>(() => {})
  const live = useRef<Live>({ step, sources, leaving, resting })
  live.current = { step, sources, leaving, resting }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const pointer: Pointer = { x: 0, y: 0, active: false, presence: 0 }
    const tick = player(reduce, pointer)
    const target: Target = { ctx, W: 0, H: 0, cx: 0, cy: 0, R: 108, textBox: null, ink: getComputedStyle(canvas).color }
    redrawRef.current = () => tick(0, live.current, target)

    const size = () => {
      const r = canvas.getBoundingClientRect()
      target.W = r.width
      target.H = r.height
      const box = text.current?.getBoundingClientRect()
      target.textBox = box ? { l: box.left - r.left, t: box.top - r.top, r: box.right - r.left, b: box.bottom - r.top } : null
      target.cx = r.width / 2
      target.cy = r.height / 2
      const dpr = Math.min(3, window.devicePixelRatio || 1)
      const w = Math.round(r.width * dpr)
      const h = Math.round(r.height * dpr)
      // Setting a canvas's size wipes it, so only when it has really changed
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      redrawRef.current()
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    // A row arriving or opening changes the text's box without changing the card's
    if (text.current) ro.observe(text.current)

    // Canvas colours don't follow the theme by themselves
    const mo = new MutationObserver(() => {
      target.ink = getComputedStyle(canvas).color
      redrawRef.current()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      pointer.x = e.clientX - b.left
      pointer.y = e.clientY - b.top
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
    }
    if (!reduce) {
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerleave', onLeave)
      canvas.addEventListener('pointercancel', onLeave)
    }

    let raf = 0
    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      tick(Math.min(0.25, (now - last) / 1000) || 1e-3, live.current, target)
      last = now
    }
    // Off screen it stops drawing; with reduced motion it holds one still frame
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (!e.isIntersecting || reduce) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    })
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointercancel', onLeave)
    }
  }, [reduce, text])

  // Held still, a change of state still has to show
  useEffect(() => {
    if (reduce) redrawRef.current()
  }, [reduce, leaving])

  // Runs out to the card's edge, so nothing it draws is cut off by its own box
  return <canvas ref={canvasRef} aria-hidden className='absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] text-foreground' />
}
