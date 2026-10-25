import { blit, type Palette, type Surface } from './pixel'
import { BUTTERFLY } from './sprites'

/*
 * Butterflies wander in loose, bobbing paths, now and then settle on a flower,
 * and scatter from anything that comes too close (the cursor, the cat).
 * Units are art pixels.
 */

export type Point = { x: number; y: number }
/** Something butterflies flee from, with the radius they keep clear of it */
export type Threat = Point & { r: number }

type Butterfly = {
  x: number
  y: number
  vx: number
  vy: number
  heading: number
  wing: number
  /** index into the wing palettes */
  kind: number
  mode: 'fly' | 'land' | 'rest'
  /** seconds left in the current mode */
  timer: number
  perch: (() => Point) | null
}

export type ButterflyEnv = {
  width: number
  top: number
  bottom: number
  threats: Threat[]
  /** a live landing spot (a flower head), or null if there's nowhere good */
  pickPerch: () => (() => Point) | null
}

export const BUTTERFLY_KINDS = 4
const SPEED = 14

const rand = (min: number, max: number) => min + Math.random() * (max - min)

export function createButterflies(count: number, env: Pick<ButterflyEnv, 'width' | 'top' | 'bottom'>) {
  return Array.from({ length: count }, (_, i): Butterfly => {
    const heading = Math.random() * Math.PI * 2
    return {
      x: rand(env.width * 0.1, env.width * 0.9),
      y: rand(env.top, env.bottom),
      vx: Math.cos(heading) * SPEED,
      vy: Math.sin(heading) * SPEED,
      heading,
      wing: Math.random() * Math.PI * 2,
      kind: i % BUTTERFLY_KINDS,
      mode: 'fly',
      timer: rand(3, 9),
      perch: null,
    }
  })
}

export type Butterflies = ReturnType<typeof createButterflies>

/** Everything the cat could chase: butterflies in the air */
export function flying(list: Butterflies): Point[] {
  return list.filter((b) => b.mode !== 'rest')
}

export function stepButterflies(list: Butterflies, dt: number, env: ButterflyEnv) {
  for (const b of list) {
    let danger: Threat | null = null
    for (const t of env.threats) {
      if (Math.hypot(b.x - t.x, b.y - t.y) < t.r) danger = t
    }

    if (danger && b.mode !== 'fly') {
      b.mode = 'fly'
      b.perch = null
      b.timer = rand(4, 9)
    }

    b.timer -= dt
    let dx = 0
    let dy = 0
    let speed = SPEED

    if (b.mode === 'rest' && b.perch) {
      const p = b.perch()
      b.x = p.x
      b.y = p.y
      b.vx = b.vy = 0
      if (b.timer <= 0) {
        b.mode = 'fly'
        b.perch = null
        b.timer = rand(4, 9)
        b.heading = -Math.PI / 2 + rand(-1, 1)
      }
    } else if (b.mode === 'land' && b.perch) {
      const p = b.perch()
      dx = p.x - b.x
      dy = p.y - b.y
      const d = Math.hypot(dx, dy)
      if (d < 1) {
        b.mode = 'rest'
        b.timer = rand(2.5, 6)
      } else {
        speed = Math.min(SPEED, 6 + d)
        dx /= d
        dy /= d
      }
    } else {
      // Wander: the heading drifts, and the field's edges steer it back in
      b.heading += rand(-3.5, 3.5) * dt
      dx = Math.cos(b.heading)
      dy = Math.sin(b.heading)
      if (b.x < env.width * 0.05) dx += 1.5
      if (b.x > env.width * 0.95) dx -= 1.5
      if (b.y < env.top) dy += 1.5
      if (b.y > env.bottom) dy -= 1.5
      b.heading = Math.atan2(dy, dx)

      if (danger) {
        const ax = b.x - danger.x
        const ay = b.y - danger.y
        const d = Math.hypot(ax, ay) || 1
        dx = ax / d
        dy = ay / d - 0.6 // flee up and away
        b.heading = Math.atan2(dy, dx)
        speed = SPEED * 2.6
      } else if (b.timer <= 0) {
        b.perch = env.pickPerch()
        b.mode = b.perch ? 'land' : 'fly'
        b.timer = rand(4, 9)
      }
    }

    if (b.mode !== 'rest') {
      const k = Math.min(1, dt * 3)
      b.vx += (dx * speed - b.vx) * k
      b.vy += (dy * speed - b.vy) * k
      b.x += b.vx * dt
      b.y += b.vy * dt
    }

    // Fast flapping in the air, a slow open-and-close while resting
    b.wing += dt * (b.mode === 'rest' ? 1.6 : 13)
  }
}

// open → half → closed → half
const FLAP = [0, 1, 2, 1]

export function drawButterflies(s: Surface, list: Butterflies, palettes: Palette[]) {
  for (const b of list) {
    const resting = b.mode === 'rest'
    const frame = resting
      ? Math.sin(b.wing) > 0.3
        ? 1
        : 0
      : FLAP[Math.floor(b.wing / (Math.PI / 2)) % 4]
    // A little bob with each wing beat; resting ones sit on the flower head
    const bob = resting ? 0 : frame === 2 ? -1 : 0
    blit(s, BUTTERFLY[frame], b.x - 3, b.y - (resting ? 4 : 2) + bob, palettes[b.kind])
  }
}
