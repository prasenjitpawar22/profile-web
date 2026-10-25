// Pure simulation for the particle orb. No React, no DOM — easy to test.
//
// Dots live on a thin spherical shell that slowly spins. Each frame they're
// projected to 2D; the pointer pushes them off their home spot and a spring
// pulls them back, with a little overshoot.

export type OrbParams = {
  /** px radius around the pointer that dots feel */
  reach: number
  /** px a dot is pushed when the pointer sits right on it */
  strength: number
}

export type Pointer = {
  x: number
  y: number
  active: boolean
  /** 0–1, eased toward `active` so the force fades in and out */
  presence: number
}

export const COLOR_STEPS = 6
export const DEPTH_STEPS = 5
export const BUCKETS = COLOR_STEPS * DEPTH_STEPS

const SPIN = 0.18 // rad/s for the whole globe
const TILT = 0.4 // rad, tips the spin axis toward the viewer
const BREATH = 0.015 // shell radius wobble, as a fraction of R
const STIFFNESS = 120
const DAMPING = 10 // under-damped: dots overshoot a touch before settling
const MAX_STEP = 1 / 60 // physics substep, keeps the spring stable at low fps

const cosT = Math.cos(TILT)
const sinT = Math.sin(TILT)

export type Orb = ReturnType<typeof createOrb>

export function createOrb(count: number, random = Math.random) {
  const orb = {
    count,
    t: 0,
    lon: new Float32Array(count),
    cosLat: new Float32Array(count),
    sinLat: new Float32Array(count),
    rad: new Float32Array(count),
    drift: new Float32Array(count),
    phase: new Float32Array(count),
    // spring state: offset from home and velocity, in px
    ox: new Float32Array(count),
    oy: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    // output of the last step
    x: new Float32Array(count),
    y: new Float32Array(count),
    bucket: new Uint8Array(count),
    /** dot indices grouped by bucket; bucket b is order[start[b]..start[b+1]) */
    order: new Uint32Array(count),
    start: new Uint32Array(BUCKETS + 1),
  }

  for (let i = 0; i < count; i++) {
    // uniform on a sphere: uniform height, uniform longitude
    const h = random() * 2 - 1
    orb.sinLat[i] = h
    orb.cosLat[i] = Math.sqrt(1 - h * h)
    orb.lon[i] = random() * Math.PI * 2
    orb.rad[i] = 0.88 + 0.12 * random()
    // a little per-dot drift so it shimmers instead of spinning rigidly
    orb.drift[i] = (random() - 0.5) * 0.12
    orb.phase[i] = random() * Math.PI * 2
  }

  return orb
}

export function stepOrb(orb: Orb, dt: number, size: number, pointer: Pointer, p: OrbParams) {
  const t = (orb.t += dt)
  const c = size / 2
  const R = size * 0.36
  const { ox, oy, vx, vy } = orb

  pointer.presence += ((pointer.active ? 1 : 0) - pointer.presence) * (1 - Math.exp(-dt * 8))
  const pull = p.strength * STIFFNESS * pointer.presence
  const reach2 = p.reach * p.reach
  const counts = new Uint32Array(BUCKETS)

  for (let i = 0; i < orb.count; i++) {
    // home position on the tilted, spinning shell
    const lon = orb.lon[i] + (SPIN + orb.drift[i]) * t
    const px = orb.cosLat[i] * Math.sin(lon)
    const py0 = orb.sinLat[i]
    const pz0 = orb.cosLat[i] * Math.cos(lon)
    const py = py0 * cosT - pz0 * sinT
    const pz = py0 * sinT + pz0 * cosT
    const r = R * (orb.rad[i] + BREATH * Math.sin(t * 1.5 + orb.phase[i]))
    const depth = (pz + 1) / 2 // 0 = back, 1 = front
    const hx = c + r * px
    const hy = c + r * py

    // pointer force, stronger on the near side of the globe
    let fx = 0
    let fy = 0
    if (pull > 0) {
      const dx = hx + ox[i] - pointer.x
      const dy = hy + oy[i] - pointer.y
      const d2 = dx * dx + dy * dy
      if (d2 < reach2 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const k = 1 - d / p.reach
        const f = (k * k * pull * (0.4 + 0.6 * depth)) / d
        fx = dx * f
        fy = dy * f
      }
    }

    // semi-implicit Euler, substepped
    for (let left = dt; left > 0; left -= MAX_STEP) {
      const h = Math.min(left, MAX_STEP)
      vx[i] += (fx - STIFFNESS * ox[i] - DAMPING * vx[i]) * h
      vy[i] += (fy - STIFFNESS * oy[i] - DAMPING * vy[i]) * h
      ox[i] += vx[i] * h
      oy[i] += vy[i] * h
    }

    orb.x[i] = hx + ox[i]
    orb.y[i] = hy + oy[i]

    const push = Math.min(Math.hypot(ox[i], oy[i]) / (p.strength * 0.7), 1)
    const cb = Math.min(COLOR_STEPS - 1, (push * COLOR_STEPS) | 0)
    const db = Math.min(DEPTH_STEPS - 1, (depth * DEPTH_STEPS) | 0)
    const b = db * COLOR_STEPS + cb
    orb.bucket[i] = b
    counts[b]++
  }

  // counting sort so the renderer sets each fill style once per frame
  orb.start[0] = 0
  for (let b = 0; b < BUCKETS; b++) orb.start[b + 1] = orb.start[b] + counts[b]
  const cursor = orb.start.slice(0, BUCKETS)
  for (let i = 0; i < orb.count; i++) orb.order[cursor[orb.bucket[i]]++] = i
}
