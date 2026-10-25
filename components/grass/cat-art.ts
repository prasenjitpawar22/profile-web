import type { Sprite } from './pixel'

/*
 * The cat's pixel art, built once from simple shapes. Each pose is blocked out
 * with lit shapes (a sphere-shaded head and haunches, cylinder legs, a tube
 * tail), outlined, then finished with hand-placed details: muzzle, nose,
 * mouth, whiskers, chest blaze, toes. Eyes are stamped on at draw time so the
 * cat can blink, squint and smile on any frame.
 *
 * Key: o outline · d deep shade · s shade · w fur · l lit fur · c muzzle/blaze
 *      p inner ear/tongue · n nose · m mouth · v whisker
 *      eyes: k lid/pupil · i iris · h shine · x closed-eye line
 */

type Tone = 'l' | 'w' | 's' | 'd'
type Dir = [number, number]
type Pt = [number, number]

const UP: Dir = [0, -1]
const DOWN: Dir = [0, 1]
const LEFT: Dir = [-1, 0]
const RIGHT: Dir = [1, 0]
const ALL: Dir[] = [UP, DOWN, LEFT, RIGHT]

// Light from the top left, a little in front
const LIGHT = (() => {
  const v = [-0.55, -0.65, 0.55]
  const n = Math.hypot(...v)
  return v.map((c) => c / n)
})()

function tone(nx: number, ny: number): Tone {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
  const d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]
  return d > 0.82 ? 'l' : d > 0.5 ? 'w' : d > 0.18 ? 's' : 'd'
}

// Limbs on the far side of the body sit a step deeper in shadow
const FAR: Record<string, Tone> = { l: 'w', w: 's', s: 'd', d: 'd' }

/** A small pixel canvas that remembers which shape owns each pixel */
class Sketch {
  readonly w: number
  readonly h: number
  readonly px: string[]
  readonly own: Int16Array
  private contours: Dir[][] = [[]]
  private finishing: ((out: string[]) => void)[] = []

  constructor(w: number, h: number) {
    this.w = w
    this.h = h
    this.px = Array(w * h).fill('.')
    this.own = new Int16Array(w * h)
  }

  /** Paint every pixel `shape` claims; it returns a surface normal, or null */
  fill(shape: (px: number, py: number) => Pt | null, contour: Dir[] = [], flat?: string, far = false) {
    const id = this.contours.push(contour) - 1
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const n = shape(x + 0.5, y + 0.5)
        if (!n) continue
        const t = flat ?? tone(n[0], n[1])
        this.px[y * this.w + x] = far ? FAR[t] ?? t : t
        this.own[y * this.w + x] = id
      }
    return id
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, contour: Dir[] = []) {
    return this.fill((px, py) => {
      const nx = (px - cx) / rx
      const ny = (py - cy) / ry
      return nx * nx + ny * ny <= 1 ? [nx * 0.9, ny * 0.9] : null
    }, contour)
  }

  tube(points: Pt[], r: number, contour: Dir[] = [], far = false) {
    return this.fill(
      (px, py) => {
        let best = Infinity
        let n: Pt = [0, 0]
        for (let i = 0; i < points.length - 1; i++) {
          const [ax, ay] = points[i]
          const [bx, by] = points[i + 1]
          const vx = bx - ax
          const vy = by - ay
          const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)))
          const d = Math.hypot(px - (ax + vx * t), py - (ay + vy * t))
          if (d < best) {
            best = d
            n = [((px - (ax + vx * t)) / r) * 0.9, ((py - (ay + vy * t)) / r) * 0.9]
          }
        }
        return best <= r ? n : null
      },
      contour,
      undefined,
      far,
    )
  }

  triangle(a: Pt, b: Pt, c: Pt, flat: string) {
    const side = (p: Pt, q: Pt, r: Pt) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1])
    return this.fill(
      (px, py) => {
        const p: Pt = [px, py]
        const d1 = side(p, a, b)
        const d2 = side(p, b, c)
        const d3 = side(p, c, a)
        return (d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0) ? null : [0, 0]
      },
      [],
      flat,
    )
  }

  /** Darken pixels owned by any of `ids` inside a box (ambient occlusion) */
  shade(x0: number, x1: number, y0: number, y1: number, ids: number[]) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) if (ids.includes(this.own[y * this.w + x])) this.px[y * this.w + x] = 'd'
  }

  /** Recolour fur inside an ellipse (muzzle, chest blaze), after outlining */
  patch(cx: number, cy: number, rx: number, ry: number, ch: string, id: number) {
    this.finishing.push((out) => {
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const nx = (x + 0.5 - cx) / rx
          const ny = (y + 0.5 - cy) / ry
          const i = y * this.w + x
          if (nx * nx + ny * ny <= 1 && this.own[i] === id && 'lwsd'.includes(out[i])) out[i] = ch
        }
    })
  }

  put(x: number, y: number, ch: string) {
    this.finishing.push((out) => {
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) out[y * this.w + x] = ch
    })
  }

  then(step: (out: string[]) => void) {
    this.finishing.push(step)
  }

  /**
   * A front-facing head with ears, centred on (cx, cy). Returns where the eyes
   * go (top-left of each 3 × 3 eye) and the head's centre.
   */
  head(cx: number, cy: number, { tongue = false } = {}) {
    this.triangle([cx - 7.7, cy - 8.1], [cx - 9.6, cy - 1.7], [cx - 2.6, cy - 4.7], 'w')
    this.triangle([cx + 7.7, cy - 8.1], [cx + 9.6, cy - 1.7], [cx + 2.6, cy - 4.7], 's')
    this.triangle([cx - 7.3, cy - 6.2], [cx - 8.1, cy - 2.5], [cx - 4.4, cy - 4.2], 'p')
    this.triangle([cx + 7.3, cy - 6.2], [cx + 8.1, cy - 2.5], [cx + 4.4, cy - 4.2], 'p')
    // widest at the cheeks, like a fluffy cat face
    const id = this.fill((px, py) => {
      const rx = 9 + 0.9 * Math.exp(-((py - cy - 1.5) ** 2) / 2.5)
      const nx = (px - cx) / rx
      const ny = (py - cy) / 5.7
      return nx * nx + ny * ny <= 1 ? [nx * 0.85, ny * 0.85] : null
    }, [DOWN])

    const x = Math.round(cx)
    const y = Math.round(cy)
    this.patch(cx, cy + 2.3, 2.9, 1.45, 'c', id)
    this.put(x - 1, y + 1, 'n')
    this.put(x, y + 1, 'n')
    this.put(x - 1, y + 2, 'm')
    this.put(x, y + 2, 'm')
    this.put(x - 2, y + 3, 'm')
    this.put(x + 1, y + 3, 'm')
    if (tongue) this.put(x - 1, y + 3, 'p')
    // whiskers poke out past the cheeks
    this.then((out) => {
      for (const row of [y + 1, y + 2]) {
        let left = -1
        let right = -1
        for (let i = 0; i < this.w; i++) {
          if (this.own[row * this.w + i] !== id) continue
          if (left < 0) left = i
          right = i
        }
        // only into open air: over the body they'd read as stray fur
        const open = (i: number) => out[row * this.w + i] === '.'
        if (left >= 2 && open(left - 2)) out[row * this.w + left - 2] = 'v'
        if (right >= 0 && right + 2 < this.w && open(right + 2)) out[row * this.w + right + 2] = 'v'
      }
    })
    return { eyes: [[x - 7, y - 2] as Pt, [x + 4, y - 2] as Pt], centre: [cx, cy] as Pt }
  }

  /** Outline, inner contours, then the finishing details */
  finish(): Sprite {
    const { w, h, px, own } = this
    const out = px.slice()
    const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && px[y * w + x] !== '.'
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (px[y * w + x] !== '.') continue
        if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) out[y * w + x] = 'o'
      }
    // A shape with a contour draws a line on whatever earlier shape it overlaps
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const id = own[y * w + x]
        if (!id) continue
        for (const [dx, dy] of this.contours[id]) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          const other = own[ny * w + nx]
          if (other && other < id) out[ny * w + nx] = 'o'
        }
      }
    for (const step of this.finishing) step(out)

    const rows: string[] = []
    for (let y = 0; y < h; y++) rows.push(out.slice(y * w, (y + 1) * w).join(''))
    return rows
  }
}

export type CatFrame = {
  sprite: Sprite
  /** the point between the feet, which sits on the ground */
  ox: number
  oy: number
  /** top-left of each eye, in sprite pixels */
  eyes: Pt[]
  /** head centre, relative to (ox, oy) */
  head: Pt
}

function frame(k: Sketch, ox: number, face: { eyes: Pt[]; centre: Pt }): CatFrame {
  const sprite = k.finish()
  let oy = sprite.length - 1
  while (oy > 0 && !/[^.]/.test(sprite[oy])) oy--
  return { sprite, ox, oy, eyes: face.eyes, head: [face.centre[0] - ox, face.centre[1] - oy] }
}

// ── Poses ──────────────────────────────────────────────────────────────────

type Paw = { from: Pt; to: Pt }

/** Sitting, facing the viewer; `sway` swings the tail tip, `paw` raises one */
function sit(sway: number, paw?: Paw, tongue = false): CatFrame {
  const k = new Sketch(30, 27)
  k.tube(
    [
      [18.5, 23.6],
      [22.2, 23.2],
      [24.5, 20.6],
      [24.9 + sway * 0.5, 17.2],
      [24.1 + sway, 14.9],
      [22.7 + sway, 14.5],
    ],
    1.55,
  )
  const haunchL = k.ellipse(7.2, 21.6, 3.9, 3.4)
  const haunchR = k.ellipse(16.8, 21.6, 3.9, 3.4, [RIGHT, UP])
  const body = k.ellipse(12, 18.6, 6.3, 6.6)
  k.tube([[9.5, 20.3], [9.5, 23.6]], 1.5, [RIGHT])
  k.tube([[14.5, 20.3], [14.5, 23.6]], 1.5, [LEFT])
  k.shade(11, 12, 19, 24, [body, haunchL, haunchR])
  const face = k.head(12, 8.1, { tongue })
  k.patch(12, 15.2, 1.05, 2.6, 'c', body)
  k.put(9, 24, 'o')
  k.put(14, 24, 'o')
  if (paw) k.tube([paw.from, paw.to], 1.35, ALL)
  return frame(k, 12, face)
}

/** Side-on walk (or a low stalk), facing right; `step` is 0–3 through the cycle */
function walk(step: number, stalk = false): CatFrame {
  const k = new Sketch(38, 26)
  const phase = (step / 4) * Math.PI * 2
  const low = stalk ? 2 : 0
  const legTop = 17.5 + low
  const foot = 23.4
  // Diagonal pairs move together: near-back with far-front, far-back with near-front
  const stride = stalk ? 1.4 : 2.2
  const leg = (x: number, offset: number, far: boolean, contour: Dir[] = []) => {
    const swing = Math.sin(phase + offset) * stride
    const lift = Math.max(0, Math.cos(phase + offset)) * (stalk ? 0.6 : 1.2)
    k.tube([[x, legTop], [x + swing, foot - lift]], 1.4, contour, far)
  }

  if (stalk) {
    k.tube([[9.5, 17], [5, 16.4], [1.8, 16.6 + Math.sin(step * 2.1) * 0.7]], 1.45)
  } else {
    const sway = Math.sin(phase) * 0.8
    k.tube([[9.5, 15.5], [6.6, 12.6], [5.4 + sway * 0.4, 9], [6 + sway, 6.2], [7.6 + sway, 5.4]], 1.5)
  }
  leg(13.5, Math.PI, true)
  leg(24.5, 0, true)
  k.ellipse(11.5, 16.5 + low, 4.4, 4.2)
  k.ellipse(17.5, 16.8 + low, 8.6, 4.6)
  leg(11, 0, false, [UP])
  leg(22, Math.PI, false, [UP])
  const bob = !stalk && step % 2 === 1 ? 1 : 0
  const face = k.head(stalk ? 28 : 26.5, (stalk ? 12.6 : 8.6) + bob)
  return frame(k, 17, face)
}

/** Mid-pounce: stretched out, front paws reaching */
function pounce(): CatFrame {
  const k = new Sketch(40, 26)
  k.tube([[8.5, 14], [4.5, 12.6], [1.6, 11.6]], 1.45)
  k.tube([[13, 17], [7, 21.5]], 1.4, [], true)
  k.tube([[25, 17], [31.5, 20]], 1.4, [], true)
  k.ellipse(11, 15.8, 4.2, 3.8)
  k.ellipse(18, 15.6, 9.6, 4.1)
  k.tube([[11, 17], [5, 22]], 1.4, [UP])
  k.tube([[23, 17], [29.5, 21.5]], 1.4, [UP])
  const face = k.head(28, 9.5)
  return frame(k, 18, face)
}

/** Curled up in a loaf; `breath` puffs the body out by a pixel */
function loaf(breath: number): CatFrame {
  const k = new Sketch(32, 22)
  const body = k.ellipse(15.5, 15.6 - breath * 0.4, 11.2, 5.4 + breath * 0.4)
  k.shade(5, 26, 20, 20, [body])
  const face = k.head(15.5, 10.4)
  // tail wrapped around the front
  k.tube([[26, 17.4], [22, 19.2], [15, 19.6], [9, 19.2], [6.4, 18]], 1.35, ALL)
  return frame(k, 16, face)
}

// ── Eyes ───────────────────────────────────────────────────────────────────

/** 3 × 3 stamps over the eye anchors; '.' keeps the fur underneath */
export const EYES = {
  /** half-lidded and content */
  open: ['kkk', 'hii', 'iki'],
  /** round and alert: something's moving */
  focus: ['.k.', 'hik', 'iki'],
  blink: ['...', '...', 'xxx'],
  /** ^ ^ */
  happy: ['...', '.x.', 'x.x'],
  /** ‿ ‿ */
  sleep: ['...', 'x.x', '.x.'],
} satisfies Record<string, Sprite>

export type Eyes = keyof typeof EYES

// ── Frames, built on first use ─────────────────────────────────────────────

let built: ReturnType<typeof build> | null = null

function build() {
  const raise = (lift: number): Paw => ({ from: [14.5, 19], to: [13.4 + lift * 0.3, 13.6 - lift] })
  return {
    sit: [-1, 0, 1, 0].map((s) => sit(s)),
    groom: [0, 1].map((l) => sit(0, raise(l), true)),
    swat: [0, 1, 2].map((k) => sit(0.5, { from: [14.5, 19], to: [18 + k, 12 - k * 2] })),
    walk: [0, 1, 2, 3].map((s) => walk(s)),
    stalk: [0, 1, 2, 3].map((s) => walk(s, true)),
    pounce: [pounce()],
    loaf: [0, 1].map((b) => loaf(b)),
  }
}

export function catFrames() {
  built ??= build()
  return built
}
