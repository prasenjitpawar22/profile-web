// One set of dots, thirteen arrangements. No React.
//
// Every state only answers "where should dot i be, how big, how bright, right
// now". Springs carry the dots there, so changing state never swaps anything
// out: the same dots travel from one shape to the next.

import { P } from './tuning'

export type StateId =
  | 'idle'
  | 'composing'
  | 'thinking'
  | 'queued'
  | 'planning'
  | 'acting'
  | 'responding'
  | 'waiting'
  | 'paused'
  | 'backgrounded'
  | 'compacting'
  | 'recovering'
  | 'ended'

const TAU = Math.PI * 2
const TILT = 0.4
const COS_T = Math.cos(TILT)
const SIN_T = Math.sin(TILT)
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const MAX_STEP = 1 / 60
const ALPHA_STEPS = 16
const QUEUE_SLOTS = 7
/** The orb's radius as a fraction of the canvas */
const ORB = 0.38

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const frac = (x: number) => x - Math.floor(x)
const gauss = (d: number, w: number) => Math.exp(-((d / w) * (d / w)))
const backOut = (x: number) => 1 + 2 * (x - 1) ** 3 + (x - 1) ** 2

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Geometry = ReturnType<typeof buildGeometry>

function buildGeometry(n: number) {
  const random = seeded(n * 7 + 3)
  const lon = new Float32Array(n)
  const sinLat = new Float32Array(n)
  const cosLat = new Float32Array(n)
  const rad = new Float32Array(n)
  const phase = new Float32Array(n)
  const rnd = new Float32Array(n)
  /** For the second dot of a merging pair: the dot it merges into. Otherwise -1. */
  const partner = new Int32Array(n).fill(-1)
  /** Which rung of the queue this dot plays, or -1 */
  const slot = new Int8Array(n).fill(-1)

  for (let i = 0; i < n; i++) {
    // Index runs from the bottom of the orb to the top
    const h = 1 - (2 * (i + 0.5)) / n
    sinLat[i] = h
    cosLat[i] = Math.sqrt(1 - h * h)
    lon[i] = i * GOLDEN + (random() - 0.5) * 0.12
    rad[i] = 0.92 + 0.08 * random()
    phase[i] = random() * TAU
    rnd[i] = random()
  }

  // Merging pairs: each dot with its nearest free neighbour
  const taken = new Uint8Array(n)
  const px = lon.map((l, i) => cosLat[i] * Math.sin(l))
  const pz = lon.map((l, i) => cosLat[i] * Math.cos(l))
  for (let i = 0; i < n; i++) {
    if (taken[i]) continue
    taken[i] = 1
    let best = -1
    let bestD = Infinity
    for (let j = 0; j < n; j++) {
      if (taken[j]) continue
      const dx = px[i] - px[j]
      const dy = sinLat[i] - sinLat[j]
      const dz = pz[i] - pz[j]
      const d = dx * dx + dy * dy + dz * dz
      if (d < bestD) {
        bestD = d
        best = j
      }
    }
    if (best >= 0) {
      taken[best] = 1
      partner[best] = i
    }
  }

  for (let k = 0; k < QUEUE_SLOTS; k++) slot[Math.floor((n * (k + 0.5)) / QUEUE_SLOTS)] = k

  return { n, lon, sinLat, cosLat, rad, phase, rnd, partner, slot, hero: n >> 1 }
}

const geometries = new Map<number, Geometry>()
function geometry(n: number) {
  let g = geometries.get(n)
  if (!g) geometries.set(n, (g = buildGeometry(n)))
  return g
}

type Clock = { t: number; st: number; spin: number; perUnit: number }

// Output of shell(): position, depth, and the brightness and size depth gives
let X = 0
let Y = 0
let Z = 0
let A = 0
let S = 0
// Output of a state's target()
let tx = 0
let ty = 0
let ts = 0
let ta = 0

function shell(g: Geometry, i: number, spin: number, t: number, scale = 1) {
  const lon = g.lon[i] + spin
  const px = g.cosLat[i] * Math.sin(lon)
  const py0 = g.sinLat[i]
  const pz0 = g.cosLat[i] * Math.cos(lon)
  const py = py0 * COS_T - pz0 * SIN_T
  const pz = py0 * SIN_T + pz0 * COS_T
  const r = g.rad[i] * scale * (1 + 0.012 * Math.sin(t * 1.5 + g.phase[i]))
  X = r * px
  Y = r * py
  Z = pz
  const d = (pz + 1) / 2
  A = 0.3 + 0.7 * d ** 1.2
  S = 0.6 + 0.65 * d
}

const onShell = (brightness = 1, size = 1) => {
  tx = X
  ty = Y
  ts = S * size
  ta = A * brightness
}

const CLICK_DECAY = 14
const RIB = TAU / 6

type Def = {
  spin: (st: number) => number
  /** How fast the orb's spin reaches that speed */
  spinRate: number
  /** Spring stiffness and damping ratio */
  k: number
  ratio: number
  target: (g: Geometry, i: number, c: Clock) => void
}

const DEFS: Record<StateId, Def> = {
  idle: {
    spin: () => P.idle.spin,
    spinRate: 3,
    k: 90,
    ratio: 0.82,
    target(g, i, c) {
      const { breath } = P.idle
      shell(g, i, c.spin, c.t)
      onShell(1 - breath + breath * Math.sin(c.t * 1.05))
    },
  },

  // One dot at a time, from the centre out, until the orb is whole. Held
  // still, because each dot's turn depends on where it sits on screen.
  composing: {
    spin: () => 0,
    spinRate: 6,
    k: 110,
    ratio: 0.85,
    target(g, i, c) {
      const { fill, hold, jitter, grow } = P.composing
      const OUT = 0.7
      const p = c.st % (fill + hold + OUT)
      shell(g, i, c.spin, 0)
      // On a shell, the share of dots within radius r is 1 - sqrt(1 - r²), so
      // this keeps the dots arriving at an even rate. The jitter stops the
      // growing edge from reading as a clean circle.
      const rho = Math.min(1, Math.hypot(X, Y) / g.rad[i])
      const share = 1 - Math.sqrt(1 - rho * rho)
      const born = 0.25 + share * fill + (g.rnd[i] - 0.5) * jitter
      const age = p - born
      const leaving = smooth(fill + hold, fill + hold + OUT, p)
      const grown = age <= 0 ? 0 : backOut(clamp(age / grow))
      onShell(clamp(age / 0.1) * (1 - leaving), grown * (1 - leaving))
    },
  },

  // The dots stay put; light spreads out from the centre, wave after wave
  thinking: {
    spin: () => 0.05,
    spinRate: 3,
    k: 90,
    ratio: 0.85,
    target(g, i, c) {
      const { period, width, base, peak, size } = P.thinking
      shell(g, i, c.spin, c.t)
      const rho = Math.hypot(X, Y)
      let b = 0
      for (let n = 0; n < 3; n++) {
        const life = frac(c.st / period + n / 3)
        const w = gauss(rho - (life * 1.35 - 0.1), width) * smooth(0, 0.08, life) * (1 - smooth(0.8, 1, life))
        if (w > b) b = w
      }
      tx = X
      ty = Y
      ts = S * (0.82 + size * b)
      ta = clamp(A * base + b * peak * (0.35 + 0.65 * A))
    },
  },

  // A dim orb and a turn that climbs towards the top
  queued: {
    spin: () => 0.04,
    spinRate: 3,
    k: 90,
    ratio: 0.85,
    target(g, i, c) {
      const { step, base, peak, size, fade } = P.queued
      const k = g.slot[i]
      if (k < 0) {
        shell(g, i, c.spin, c.t)
        onShell(base, 0.8)
        return
      }
      const ago = (((c.st / step - k) % QUEUE_SLOTS) + QUEUE_SLOTS) % QUEUE_SLOTS
      // Holds its light for its whole turn, then fades as the next one takes over
      const b = ago < 1 ? 1 : Math.exp(-(ago - 1) * fade)
      tx = 0
      ty = 0.8 - (k / (QUEUE_SLOTS - 1)) * 1.6
      ts = 0.9 + size * b
      ta = lerp(0.22, peak, b)
    },
  },

  // The orb keeps its shape; one spiral arm lights up across its own dots,
  // with a head tracing along it
  planning: {
    spin: () => 0.05,
    spinRate: 4,
    k: 90,
    ratio: 0.85,
    target(g, i, c) {
      const { width, turns, trace, trail, base, peak, rotate, dim } = P.planning
      const reach = 1.02
      shell(g, i, c.spin, c.t)
      const r = Math.hypot(X, Y)
      // Spiral arms sit a fixed distance apart, so the nearest one comes
      // straight from the dot's radius and angle
      const pitch = reach / turns
      const q = (Math.atan2(Y, X) + c.st * rotate) / TAU
      const arm = pitch * (Math.round(r / pitch - q) + q)
      const on = arm >= 0 && arm <= reach ? gauss(r - arm, width) : 0
      const d = frac(frac(c.st / trace) - (arm / reach) ** 2)
      const b = Math.exp(-d / trail)
      tx = X
      ty = Y
      ts = S * (0.8 + on * (0.35 + 1.1 * b * b))
      ta = clamp(lerp(A * dim, lerp(base, peak, b) * (0.35 + 0.65 * A), on))
    },
  },

  // Firm, stepped clicks, each with a little weight behind it
  acting: {
    spin(st) {
      const since = (st % P.acting.click) * CLICK_DECAY
      return ((P.acting.turn * Math.PI) / 180) * CLICK_DECAY * Math.exp(-since)
    },
    spinRate: 60,
    k: 420,
    ratio: 0.9,
    target(g, i, c) {
      const { click, base, peak, width, thump } = P.acting
      const hit = Math.exp(-(c.st % click) * 9)
      shell(g, i, c.spin, c.t, 1 - thump * hit)
      const m = (((g.lon[i] + c.spin) % RIB) + RIB) % RIB
      const b = gauss(Math.min(m, RIB - m), width)
      onShell(base + peak * b, 0.86 + 0.35 * b)
      ta = clamp(ta)
    },
  },

  // The orb keeps its shape; the squiggle runs across it as a band of light
  responding: {
    spin: () => 0.05,
    spinRate: 4,
    k: 90,
    ratio: 0.85,
    target(g, i, c) {
      const { width, amp, freq, speed, base, peak, dim } = P.responding
      shell(g, i, c.spin, c.t)
      // Tapers towards the rim so the wave stays inside the orb
      const env = Math.max(0, 1 - X * X) ** 0.35
      const main = Math.sin(X * freq - c.st * speed)
      const wave = (amp * main + amp * 0.26 * Math.sin(X * freq * 2.04 - c.st * speed * 1.54)) * env
      const on = gauss(Y - wave, width)
      const crest = 0.5 + 0.5 * main
      tx = X
      ty = Y
      ts = S * (0.8 + on * (0.25 + 0.25 * crest))
      ta = clamp(lerp(A * dim, (base + peak * crest) * (0.35 + 0.65 * A), on))
    },
  },

  // Everything stops and dims. One dot in the middle asks.
  waiting: {
    spin: () => 0,
    spinRate: 5,
    k: 80,
    ratio: 0.88,
    target(g, i, c) {
      const { period, dot, base, ripple } = P.waiting
      if (i === g.hero) {
        tx = 0
        ty = 0
        const swell = 0.5 - 0.5 * Math.cos((c.st / period) * TAU)
        ts = Math.max(2.4, dot * (1 + 0.7 * swell) * c.perUnit)
        ta = 1
        return
      }
      shell(g, i, c.spin, 0)
      const life = frac(c.st / period - 0.5)
      const b = gauss(Math.hypot(X, Y) - life * 1.4, 0.15) * (1 - life)
      tx = X * (1 + 0.06 * b)
      ty = Y * (1 + 0.06 * b)
      ts = S * (0.78 + 0.32 * b)
      ta = clamp(A * base + ripple * b)
    },
  },

  // The orb freezes on whatever frame it's on: stepSim stops advancing. This
  // pose is only the still frame shown under reduced motion.
  paused: {
    spin: () => 0,
    spinRate: 6,
    k: 90,
    ratio: 1,
    target(g, i, c) {
      shell(g, i, c.spin, 0)
      onShell()
    },
  },

  // Quiet, full size, with one dot still going round inside it
  backgrounded: {
    spin: () => 0.08,
    spinRate: 3,
    k: 70,
    ratio: 0.9,
    target(g, i, c) {
      const { reach, dim, orbit, dot } = P.backgrounded
      if (i === g.hero) {
        const a = (c.st / orbit) * TAU
        const ex = Math.cos(a) * reach
        const ey = Math.sin(a) * reach * 0.38
        const cr = Math.cos(-0.35)
        const sr = Math.sin(-0.35)
        tx = ex * cr - ey * sr
        ty = ex * sr + ey * cr
        ts = dot
        ta = 0.25 + 0.75 * smooth(-0.3, 0.3, Math.sin(a))
        return
      }
      shell(g, i, c.spin, c.t)
      onShell(dim, 0.85)
    },
  },

  // The orb keeps its size. A wave closes in from the rim, neighbouring dots
  // merge in pairs where they sit as it passes, and the orb rests with fewer
  compacting: {
    spin: () => 0.06,
    spinRate: 3,
    k: 110,
    ratio: 0.86,
    target(g, i, c) {
      const { loop, squeeze, merge } = P.compacting
      const p = (c.st % loop) * (5.8 / loop)
      const front = 1.15 - 1.5 * smooth(0.1, 1.9, p)
      const restore = smooth(4.8, 5.75, p)
      const visible = smooth(0.1, 0.3, p) * (1 - smooth(1.7, 2.1, p))
      shell(g, i, c.spin, c.t)
      const ownX = X
      const ownY = Y
      const ownA = A
      const ownS = S
      const b = gauss(Math.hypot(X, Y) - front, 0.16) * visible
      const j = g.partner[i]
      // Both dots of a pair take the same moment, from the one they merge into
      if (j >= 0) shell(g, j, c.spin, c.t)
      const merged = smooth(0, 0.3, Math.hypot(X, Y) - front) * (1 - restore)
      if (j < 0) {
        tx = ownX
        ty = ownY
        ts = ownS * (1 + merge * merged + 0.3 * b)
        ta = clamp(ownA + squeeze * b)
        return
      }
      tx = lerp(ownX, X, merged)
      ty = lerp(ownY, Y, merged)
      ts = ownS * (1 - merged * 0.4 + 0.3 * b)
      ta = clamp(ownA * smooth(1, 0.72, merged) + squeeze * b * (1 - merged))
    },
  },

  // A patch gets knocked off, the orb stutters, the dots come home one by one
  recovering: {
    spin: () => 0,
    spinRate: 6,
    k: 170,
    ratio: 0.56,
    target(g, i, c) {
      const { patch, knock, stutter, home: spread } = P.recovering
      const KNOCK = 0.3
      const LOOP = KNOCK + 1.05 + spread + 1.6
      const p = c.st % LOOP
      const a = Math.floor(c.st / LOOP) * 2.4 + 0.8
      shell(g, i, c.spin, c.t)
      const inPatch =
        X * Math.cos(a) * 0.62 + Y * Math.sin(a) * 0.62 + Z * 0.78 > Math.cos((patch * Math.PI) / 180)
      const shake =
        p > KNOCK ? stutter * Math.exp(-(p - KNOCK) * 4.2) * Math.sign(Math.sin((p - KNOCK) * 54)) : 0
      if (inPatch) {
        const home = KNOCK + 1.05 + g.rnd[i] * spread
        if (p > KNOCK && p < home) {
          const len = Math.hypot(X, Y) || 1
          // Capped to leave room for the spring's overshoot inside the canvas
          const r = Math.min(1.16, len + knock * (0.7 + g.rnd[i]))
          const float = 0.03 * Math.sin(c.t * 1.7 + g.phase[i])
          tx = (X / len) * r + float
          ty = (Y / len) * r - float
          ts = S * 0.8
          ta = A * 0.42
          return
        }
        const flash = p >= home ? Math.exp(-(p - home) * 6) : 0
        tx = X + shake
        ty = Y
        ts = S * (1 + 0.8 * flash)
        ta = clamp(A + 0.5 * flash)
        return
      }
      tx = X + shake
      ty = Y
      ts = S
      ta = A * 0.9
    },
  },

  // One last sweep, then the darkness drains inward from the rim until only
  // a small dark core is left in the still orb
  ended: {
    spin: (st) => (st < 0.9 ? 0.1 : 0),
    spinRate: 4,
    k: 120,
    ratio: 0.92,
    target(g, i, c) {
      const { sweep, gather, final, dim } = P.ended
      const st = c.st
      shell(g, i, c.spin, 0)
      const rho = Math.min(1, Math.hypot(X, Y))
      const b = gauss(Y - (-1.3 + (st / 0.85) * 2.6), 0.26) * (1 - smooth(0.85, 1, st))
      const leave = 0.9 + (1 - rho) * gather
      const gone = smooth(leave, leave + 0.35, st)
      const core = 1 - smooth(final * 0.8, final * 1.25, rho)
      tx = X
      ty = Y
      ts = lerp(S * (1 + sweep * b), lerp(S * 0.85, S * 1.7, core), gone)
      ta = clamp(lerp(A + sweep * 0.85 * b, lerp(A * dim, 1, core), gone))
    },
  },
}

export type Sim = ReturnType<typeof createSim>

export function createSim(count: number, state: StateId) {
  const g = geometry(count)
  const sim = {
    g,
    state,
    t: 0,
    st: 0,
    spin: 0,
    spinVel: 0,
    k: DEFS[state].k,
    ratio: DEFS[state].ratio,
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    s: new Float32Array(count),
    a: new Float32Array(count),
    order: new Uint32Array(count),
    bucket: new Uint8Array(count),
    start: new Uint32Array(ALPHA_STEPS + 1),
  }
  // Start already in place but invisible, so a mount fades up rather than flies in
  const c: Clock = { t: 0, st: 0, spin: 0, perUnit: 40 }
  for (let i = 0; i < count; i++) {
    DEFS[state].target(g, i, c)
    sim.x[i] = tx
    sim.y[i] = ty
  }
  return sim
}

export function setSimState(sim: Sim, state: StateId) {
  if (sim.state === state) return
  sim.state = state
  sim.st = 0
}

const POSTER: Record<StateId, number> = {
  idle: 0,
  composing: 2.8,
  thinking: 1.1,
  queued: 2,
  planning: 1.6,
  acting: 0.3,
  responding: 1,
  waiting: 1.4,
  paused: 0,
  backgrounded: 1,
  compacting: 1.4,
  recovering: 1,
  ended: 5,
}

/** Jump straight to a still frame of the state, for reduced motion */
export function settleSim(sim: Sim, state: StateId, size: number) {
  sim.state = state
  sim.st = POSTER[state]
  sim.spin = 0
  sim.spinVel = 0
  const c: Clock = { t: 0, st: sim.st, spin: 0, perUnit: unitsToDot(size) }
  for (let i = 0; i < sim.g.n; i++) {
    DEFS[state].target(sim.g, i, c)
    sim.x[i] = tx
    sim.y[i] = ty
    sim.vx[i] = 0
    sim.vy[i] = 0
    sim.s[i] = Math.max(0, ts)
    sim.a[i] = clamp(ta)
  }
}

const dotRadius = (size: number) => clamp(size / 140, 0.85, 1.45)
const unitsToDot = (size: number) => (size * ORB) / dotRadius(size)

export function stepSim(sim: Sim, rawDt: number, size: number) {
  if (sim.state === 'paused') return
  const def = DEFS[sim.state]
  const { g, x, y, vx, vy, s, a } = sim
  // Speed stretches time itself, so every curve keeps its shape
  const dt = rawDt * P.global.speed
  sim.t += dt
  sim.st += dt
  sim.spinVel += (def.spin(sim.st) - sim.spinVel) * (1 - Math.exp(-dt * def.spinRate))
  sim.spin += sim.spinVel * dt
  sim.k += (def.k * P.global.morph - sim.k) * (1 - Math.exp(-dt * 5))
  sim.ratio += (def.ratio - sim.ratio) * (1 - Math.exp(-dt * 5))

  const c: Clock = { t: sim.t, st: sim.st, spin: sim.spin, perUnit: unitsToDot(size) }
  const easeS = 1 - Math.exp(-dt * 16)
  const easeA = 1 - Math.exp(-dt * 14)

  for (let i = 0; i < g.n; i++) {
    def.target(g, i, c)
    // Dots set off a beat apart so a change of state ripples through
    const delay = g.rnd[i] * 0.16
    const ramp = smooth(delay, delay + 0.22, sim.st)
    const full = sim.k * (0.8 + 0.4 * g.rnd[i])
    const k = full * ramp
    const damp = 2 * sim.ratio * Math.sqrt(full)
    for (let left = dt; left > 0; left -= MAX_STEP) {
      const h = Math.min(left, MAX_STEP)
      vx[i] += (k * (tx - x[i]) - damp * vx[i]) * h
      vy[i] += (k * (ty - y[i]) - damp * vy[i]) * h
      x[i] += vx[i] * h
      y[i] += vy[i] * h
    }
    s[i] += (Math.max(0, ts) - s[i]) * easeS
    a[i] += (clamp(ta) - a[i]) * easeA
  }
}

export function alphaStyles([r, g, b]: [number, number, number]) {
  return Array.from(
    { length: ALPHA_STEPS },
    (_, n) => `rgba(${r},${g},${b},${((n + 1) / ALPHA_STEPS).toFixed(3)})`,
  )
}

export function drawSim(ctx: CanvasRenderingContext2D, sim: Sim, size: number, styles: string[]) {
  const { x, y, s, a, order, bucket, start } = sim
  const n = sim.g.n
  const c = size / 2
  const R = size * ORB
  const dot = dotRadius(size) * P.global.dotSize
  const counts = new Uint32Array(ALPHA_STEPS)

  // Counting sort so each brightness is one path and one fill
  for (let i = 0; i < n; i++) {
    const b = Math.min(ALPHA_STEPS - 1, (a[i] * ALPHA_STEPS) | 0)
    bucket[i] = b
    counts[b]++
  }
  start[0] = 0
  for (let b = 0; b < ALPHA_STEPS; b++) start[b + 1] = start[b] + counts[b]
  const cursor = start.slice(0, ALPHA_STEPS)
  for (let i = 0; i < n; i++) order[cursor[bucket[i]]++] = i

  ctx.clearRect(0, 0, size, size)
  for (let b = 0; b < ALPHA_STEPS; b++) {
    if (start[b] === start[b + 1]) continue
    ctx.fillStyle = styles[b]
    ctx.beginPath()
    for (let k = start[b]; k < start[b + 1]; k++) {
      const i = order[k]
      const r = dot * s[i]
      if (r < 0.06 || a[i] < 0.012) continue
      const px = c + x[i] * R
      const py = c + y[i] * R
      ctx.moveTo(px + r, py)
      ctx.arc(px, py, r, 0, TAU)
    }
    ctx.fill()
  }
}
