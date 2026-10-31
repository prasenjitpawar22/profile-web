// Simulation and drawing for the Logogram. No React — the component owns the loop.
//
// A ring of alien writing in the spirit of the heptapod logograms in Arrival,
// generated from random strokes, never traced. An ink head writes it in one lap:
// the brush swells and thins, tendrils, hooks, blots and splatter grow off it,
// and it loosens into smoke. The ink is drawn as churning glyphs with a scan
// climbing through. Once written, the symbol stays and breathes, its text fixed.

const RAMP = ' .:-=+*#%@'
const POOL = '*+x%#&$@?!~^<>/\\|=:;0o'
const FONT_PX = 8
const TAU = Math.PI * 2
// One lap of the writing head, and one breath of the finished symbol
const LAP_MS = 9000
const BREATH_MS = 5200

export type Pointer = {
  x: number
  y: number
  vx: number
  vy: number
  /** px/ms, jumps up on movement and decays */
  speed: number
  active: boolean
  /** 0–1, eased presence of the pointer */
  hold: number
}

type Kind = 'blob' | 'tendril' | 'hook' | 'splat'
type Mark = { th: number; kind: Kind; len: number; curl: number; width: number; dir: number; seed: number }
type Harm = [number, number, number]
type Symbol_ = { harmT: Harm[]; harmR: Harm[]; marks: Mark[]; base: number }
type Smoke = { x: number; y: number; vx: number; vy: number; life: number; decay: number }

const rnd = Math.random
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const pick = (s: string) => s[(Math.random() * s.length) | 0]
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const wrap2Pi = (a: number) => ((a % TAU) + TAU) % TAU
const h1 = (n: number) => {
  const s = Math.sin(n * 91.345 + 7.13) * 43758.5453
  return s - Math.floor(s)
}
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
/** Smooth value noise, roughly 0–1 */
function noise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function makeMark(th: number): Mark {
  const r = rnd()
  return {
    th,
    kind: r < 0.32 ? 'tendril' : r < 0.52 ? 'hook' : r < 0.78 ? 'blob' : 'splat',
    len: 0.22 + rnd() * 0.42,
    curl: (rnd() - 0.5) * 3.5,
    width: 0.5 + rnd() * 0.7,
    // Most grow outward, a few curl into the ring
    dir: rnd() < 0.8 ? 1 : -1,
    seed: rnd() * 1000,
  }
}

function makeSymbol(): Symbol_ {
  const harm = (n: number, amp: number): Harm[] =>
    Array.from({ length: n }, (_, i) => [i + 1 + Math.floor(rnd() * 3), (amp * (0.4 + rnd() * 0.6)) / (i + 1), rnd() * TAU])
  const n = 4 + Math.floor(rnd() * 4)
  const start = rnd() * TAU
  const marks = Array.from({ length: n }, (_, i) => makeMark(start + (i / n) * TAU + (rnd() - 0.5) * 0.6))
  return { harmT: harm(4, 1), harmR: harm(3, 0.05), marks, base: 0.1 + rnd() * 0.04 }
}

export function createLogogram() {
  let cols = 0
  let rows = 0
  let cw = 5
  let ch = 9
  let w = 0
  let h = 0
  let n = 0
  // Per cell: ink density, final brightness, glyph, decode, and the smeared medium
  let ink = new Float32Array(0)
  let val = new Float32Array(0)
  let chr: string[] = []
  let cur: string[] = []
  let dec = new Float32Array(0)
  let dx = new Float32Array(0)
  let dy = new Float32Array(0)
  let vx = new Float32Array(0)
  let vy = new Float32Array(0)

  let symbol = makeSymbol()
  const smoke: Smoke[] = []
  // Where recent ink sits, so smoke can rise from it
  let emit: number[] = []
  let t = 0
  let head = rnd() * TAU
  let written = 0
  let phase: 'write' | 'hold' = 'write'
  let holdT = 0
  /** -1..1, the finished symbol's slow breath, faded in after it completes */
  let breath = 0
  /** 0–1, closes the thin tip where the lap ended once the symbol is done */
  let seal = 0
  let exhaling = false

  function resize(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.font = `${FONT_PX}px ${getComputedStyle(ctx.canvas).fontFamily}`
    cw = Math.ceil(ctx.measureText('M').width)
    ch = Math.round(FONT_PX * 1.15)
    w = width
    h = height
    cols = Math.ceil(w / cw)
    rows = Math.ceil(h / ch)
    n = cols * rows
    ink = new Float32Array(n)
    val = new Float32Array(n)
    chr = new Array(n).fill('')
    cur = Array.from({ length: n }, () => pick(POOL))
    dec = new Float32Array(n)
    dx = new Float32Array(n)
    dy = new Float32Array(n)
    vx = new Float32Array(n)
    vy = new Float32Array(n)
  }

  /** Breathes the symbol out as smoke and starts writing a new one */
  function exhale() {
    exhaling = true
  }

  function step(dt: number, p: Pointer) {
    if (!n) return
    t += dt
    ink.fill(0)
    emit = []
    const ts = t * 0.001
    const S = Math.min(w, h)
    const R0 = S * 0.3
    const cx = w / 2 + Math.sin(ts * 0.21) * S * 0.01
    const cy = h * 0.47 + Math.sin(ts * 0.17 + 1) * S * 0.01
    const minR = cw * 0.38

    const stamp = (x: number, y: number, r: number, a: number, smoky = 0) => {
      r = Math.max(r, minR)
      const c0 = Math.max(0, Math.floor((x - r * 1.2) / cw))
      const c1 = Math.min(cols - 1, Math.floor((x + r * 1.2) / cw))
      const r0 = Math.max(0, Math.floor((y - r * 1.2) / ch))
      const r1 = Math.min(rows - 1, Math.floor((y + r * 1.2) / ch))
      for (let rr = r0; rr <= r1; rr++) {
        const py = (rr + 0.5) * ch
        for (let c = c0; c <= c1; c++) {
          const v = smooth(r * 1.2, r * 0.55, Math.hypot((c + 0.5) * cw - x, py - y)) * a
          const i = rr * cols + c
          if (v > ink[i]) ink[i] = v
        }
      }
      if (smoky > 0 && rnd() < smoky) emit.push(x, y, r)
    }

    const harmSum = (hs: Harm[], th: number, drift: number) => {
      let s = 0
      for (const [k, amp, ph] of hs) s += amp * Math.sin(k * th + ph + ts * drift * k)
      return s
    }
    const pa = Math.atan2(p.y - cy, p.x - cx)
    const near = p.hold * smooth(R0 * 2.2, R0, Math.hypot(p.x - cx, p.y - cy))

    // A point on the ring, and the brush width there
    const ringAt = (th: number) => {
      let R = R0 * (1 + harmSum(symbol.harmR, th, 0.15)) * (1 + 0.015 * breath)
      // The ink leans toward a cursor hovering close
      const da = wrapPi(th - pa)
      R += R0 * 0.07 * near * Math.exp(-(da * da) / 0.25)
      const T = R0 * symbol.base * clamp(1 + harmSum(symbol.harmT, th, 0.08), 0.12, 2.4) * (1 + 0.06 * Math.sin(ts * 0.8)) * (1 + 0.14 * breath)
      return { x: cx + Math.cos(th) * R, y: cy + Math.sin(th) * R, R, T }
    }
    // How much of the ring the head has written so far
    const presence = (th: number) =>
      phase === 'hold' ? 1 : 1 - smooth(written - 0.04, written + 0.02, wrap2Pi(head - th))

    if (phase === 'write') {
      const lap = (dt * TAU) / LAP_MS
      head = wrap2Pi(head + lap)
      written += lap
      // A full lap completes the symbol, and it stays
      if (written >= TAU) {
        phase = 'hold'
        holdT = 0
      }
    } else {
      holdT += dt
      breath = Math.sin((holdT * TAU) / BREATH_MS - Math.PI / 2) * smooth(0, 1800, holdT)
    }
    seal += ((phase === 'hold' ? 1 : 0) - seal) * Math.min(1, dt / 450)

    // The ring
    const N = Math.round((TAU * R0) / 1.4)
    for (let j = 0; j < N; j++) {
      const th = (j / N) * TAU
      const pr = presence(th)
      if (pr < 0.02) continue
      const q = ringAt(th)
      // The stroke starts as a fine tip at the head and swells to full width
      // behind it, like a brush being laid down
      const tip = Math.max(seal, smooth(0, 0.45, wrap2Pi(head - th)))
      stamp(q.x, q.y, q.T * (0.35 + 0.65 * pr) * (0.15 + 0.85 * tip), Math.min(1, pr * 1.1), pr < 0.9 ? 0.5 : 0.012)
    }
    const headQ = phase === 'write' ? ringAt(head) : null

    // Marks off the ring grow in once the head has passed them
    for (const m of symbol.marks) {
      const behind = wrap2Pi(head - m.th)
      const grow = phase === 'hold' ? 1 : behind <= written ? smooth(0.05, 0.7, behind) : 0
      const alpha = presence(m.th)
      if (alpha < 0.02 || grow < 0.01) continue
      drawMark(m, grow, alpha)
    }

    function drawMark(m: Mark, grow: number, alpha: number) {
      const base = ringAt(m.th)
      const smoky = alpha < 0.95 ? 0.4 : 0.02
      if (m.kind === 'blob') {
        const spread = 0.1 + m.width * 0.12
        for (let s = -1; s <= 1; s += 0.08) {
          const a = m.th + s * spread
          const q = ringAt(a)
          const bump = 1 - s * s
          const off = bump * q.T * m.width * 1.6 * m.dir * grow
          stamp(cx + Math.cos(a) * (q.R + off), cy + Math.sin(a) * (q.R + off), q.T * (1 + bump * m.width * 1.1 * grow), alpha, smoky)
        }
        return
      }
      if (m.kind === 'splat') {
        const count = 4 + Math.floor(h1(m.seed) * 6)
        for (let i = 0; i < count; i++) {
          const a = m.th + (h1(m.seed + i) - 0.5) * 0.6
          const dist = base.R + m.dir * (base.T + h1(m.seed + i * 3.1) * R0 * 0.28 * grow)
          stamp(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, base.T * (0.2 + h1(m.seed + i * 7.7) * 0.55), alpha, smoky)
        }
        return
      }
      const curl = m.kind === 'hook' ? m.curl * 2.6 : m.curl
      stroke(base.x, base.y, m.th + (m.dir < 0 ? Math.PI : 0), base.T * 0.85 * m.width + minR, m.len * R0 * grow, curl, m.seed, alpha, smoky, true)
    }

    // A tapering brush stroke that curls as it goes, and may fork once
    function stroke(x: number, y: number, heading: number, width: number, len: number, curl: number, seed: number, alpha: number, smoky: number, fork: boolean) {
      const steps = 26
      const seg = len / steps
      const writhe = 0.7 * Math.sin(ts * 0.6 + seed)
      for (let s = 0; s < steps; s++) {
        heading += (curl + writhe) / steps
        x += Math.cos(heading) * seg
        y += Math.sin(heading) * seg
        stamp(x, y, width * (1 - s / steps) ** 0.8, alpha, smoky * 0.5)
        if (fork && s === 11 && h1(seed) > 0.45) {
          stroke(x, y, heading - Math.sign(curl || 1) * 0.6, width * 0.6, len * 0.45, -curl * 1.4, seed + 1, alpha, smoky, false)
        }
      }
    }

    // Smoke rising off the ink, with a puff on each out-breath
    const emitCount = 0.25 * dt * (1 + 2.5 * Math.max(0, -breath))
    for (let i = 0; i < emitCount && emit.length; i++) {
      const j = Math.floor(rnd() * (emit.length / 3)) * 3
      const a = rnd() * TAU
      spawnSmoke(emit[j] + Math.cos(a) * emit[j + 2], emit[j + 1] + Math.sin(a) * emit[j + 2], Math.cos(a) * 0.01, Math.sin(a) * 0.01 - 0.008, 0.7, 1 / (2200 + rnd() * 2500))
    }

    if (exhaling) {
      exhaling = false
      for (let i = 0; i < n; i++) {
        if (ink[i] < 0.25 || rnd() > 0.7) continue
        const x = ((i % cols) + 0.5) * cw
        const y = (Math.floor(i / cols) + 0.5) * ch
        const a = Math.atan2(y - cy, x - cx) + (rnd() - 0.5) * 0.8
        const sp = 0.02 + rnd() * 0.07
        spawnSmoke(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 0.015, 1, 1 / (1800 + rnd() * 2200))
      }
      symbol = makeSymbol()
      written = 0
      phase = 'write'
      breath = 0
    }

    // Smoke drifts on slow curls and swirls round the cursor
    const SR = S * 0.25
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i]
      const a = noise(s.x * 0.008, s.y * 0.008 + ts * 0.15) * TAU * 2
      s.vx += Math.cos(a) * 0.000018 * dt
      s.vy += Math.sin(a) * 0.000018 * dt - 0.000006 * dt
      if (p.hold > 0.01) {
        const ex = s.x - p.x
        const ey = s.y - p.y
        const d = Math.hypot(ex, ey)
        if (d < SR) {
          const f = (1 - d / SR) ** 2 * p.hold
          s.vx += (p.vx * 0.05 + (ex / (d || 1)) * 0.004) * f * dt * 0.06
          s.vy += (p.vy * 0.05 + (ey / (d || 1)) * 0.004) * f * dt * 0.06
        }
      }
      const damp = Math.exp(-dt / 1400)
      s.vx *= damp
      s.vy *= damp
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt * s.decay
      if (s.life <= 0) smoke.splice(i, 1)
    }

    val.fill(0)
    for (const s of smoke) {
      const c = Math.floor(s.x / cw)
      const r = Math.floor(s.y / ch)
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue
      val[r * cols + c] += 0.13 * s.life
    }

    const MR = S * 0.2
    const relax = Math.exp(-dt / 900)
    const drag = Math.exp(-dt / 260)
    const scanY = cy + R0 * 1.6 - ((ts * 70) % (R0 * 3.2))
    // Once complete, every glyph stays as it was written
    const frozen = phase === 'hold'
    for (let r = 0; r < rows; r++) {
      const y = (r + 0.5) * ch
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        const x = (c + 0.5) * cw

        // A fast cursor drags the medium along with it; it heals slowly
        if (p.hold > 0.01) {
          const d = Math.hypot(x - p.x, y - p.y)
          if (d < MR) {
            const blend = Math.min(1, (1 - d / MR) ** 2 * p.hold * (dt / 50))
            vx[i] += (p.vx * 0.6 - vx[i]) * blend
            vy[i] += (p.vy * 0.6 - vy[i]) * blend
          }
        }
        vx[i] *= drag
        vy[i] *= drag
        dx[i] = dx[i] * relax + vx[i] * dt
        dy[i] = dy[i] * relax + vy[i] * dt
        const sc = Math.min(cols - 1, Math.max(0, Math.round(c - dx[i] / cw)))
        const sr = Math.min(rows - 1, Math.max(0, Math.round(r - dy[i] / ch)))
        const m = ink[sr * cols + sc]

        // A still cursor decodes the glyphs near it into calm, solid ink while
        // the symbol is being written
        const want = frozen ? 0 : p.hold * (1 - smooth(0.04, 0.35, p.speed)) * smooth(S * 0.17, S * 0.06, Math.hypot(x - p.x, y - p.y))
        dec[i] += (want - dec[i]) * Math.min(1, dt / (want > dec[i] ? 300 : 700))
        const disturbed = Math.min(1, Math.hypot(dx[i], dy[i]) / 30)
        const sy = (y - scanY) / 8
        const scan = Math.exp(-sy * sy) * m
        const flick = noise(x * 0.06, y * 0.06 - ts * 1.6)
        const wet = headQ ? Math.exp(-((x - headQ.x) ** 2 + (y - headQ.y) ** 2) / (R0 * R0 * 0.04)) : 0
        let v = m * (0.5 + 0.5 * flick) + scan * 0.5 + disturbed * m * 0.3 + Math.min(0.4, val[i])
        if (m > 0.05) v += (m - v) * dec[i]
        // The finished symbol breathes in brightness only
        if (frozen) v *= 0.86 + 0.14 * breath

        // Glyphs churn, fastest at the wet ink, under the scan and where smeared
        if (!frozen && rnd() < (0.012 + disturbed * 0.2 + scan * 0.3 + wet * 0.4) * (1 - dec[i]) * (dt / 16)) cur[i] = pick(POOL)
        if (v > 0.04) {
          val[i] = clamp(v)
          chr[i] = dec[i] > 0.55 && m > 0.05 ? '' : cur[i]
          continue
        }
        // Fog: faint wisps of glyphs the symbol hangs in; only some cells in a
        // wisp carry one, so it reads as mist, not a block
        const fog = smooth(0.6, 0.9, noise(x * 0.011 + ts * 0.04, y * 0.016 - ts * 0.06))
        if (fog > 0.05 && noise(c * 0.9 + ts * 0.3, r * 0.9) > 0.55) {
          if (!frozen && rnd() < 0.003 * (dt / 16)) cur[i] = pick(POOL)
          val[i] = 0.03 + 0.05 * fog * (0.6 + 0.4 * flick)
          chr[i] = cur[i]
        } else {
          val[i] = 0
          chr[i] = ''
        }
      }
    }

    function spawnSmoke(x: number, y: number, svx: number, svy: number, life: number, decay: number) {
      if (smoke.length < 2600) smoke.push({ x, y, vx: svx, vy: svy, life, decay })
    }
  }

  /** Draws the grid as glyphs in the given rgb colour */
  function draw(ctx: CanvasRenderingContext2D, rgb: [number, number, number]) {
    ctx.clearRect(0, 0, w, h)
    ctx.font = `${FONT_PX}px ${getComputedStyle(ctx.canvas).fontFamily}`
    ctx.textBaseline = 'top'
    const levels = RAMP.length - 1
    // Bucketed by density, so fillStyle changes a handful of times a frame, not per cell;
    // bucket 0 holds the barely-there fog
    const buckets: number[][] = Array.from({ length: levels + 1 }, () => [])
    for (let i = 0; i < n; i++) {
      const lvl = Math.min(levels, Math.floor(val[i] * levels + 0.2))
      if (lvl > 0) buckets[lvl].push(i)
      else if (val[i] > 0.02 && chr[i]) buckets[0].push(i)
    }
    const [r, g, b] = rgb
    for (let lvl = 0; lvl <= levels; lvl++) {
      const cells = buckets[lvl]
      if (!cells.length) continue
      ctx.fillStyle = `rgba(${r},${g},${b},${lvl ? 0.18 + (lvl / levels) * 0.82 : 0.07})`
      for (const i of cells) ctx.fillText(chr[i] || RAMP[lvl], (i % cols) * cw, Math.floor(i / cols) * ch)
    }
  }

  return { resize, step, draw, exhale }
}
