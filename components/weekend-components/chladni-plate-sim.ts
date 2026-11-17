/* Sand on a vibrating square plate. Grains are thrown about wherever the plate
   is moving and come to rest where it is still, so the figure is drawn by what
   is left behind. Positions are kept in 0–1 plate space. */

/** Plate modes: n, m, and the sign that joins the two standing waves */
export const MODES: [number, number, 1 | -1][] = [
  [1, 2, -1],
  [1, 3, 1],
  [2, 3, -1],
  [1, 4, 1],
  [2, 4, -1],
  [3, 4, 1],
  [1, 5, -1],
  [2, 5, 1],
  [3, 5, -1],
  [4, 5, 1],
  [2, 6, 1],
  [3, 6, -1],
  [5, 6, 1],
  [3, 7, 1],
  [4, 7, -1],
  [5, 7, 1],
]

const G = 256 // lookup grid for the field

export type Sand = {
  x: Float32Array
  y: Float32Array
  /** |f|: how hard the plate shakes at each grid cell */
  amp: Float32Array
  /** Downhill on f², towards the still lines */
  gx: Float32Array
  gy: Float32Array
  /** Extra shake right after a note change, so the old figure breaks up */
  burst: number
}

export function createSand(count: number): Sand {
  const x = new Float32Array(count)
  const y = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    x[i] = Math.random()
    y[i] = Math.random()
  }
  return {
    x,
    y,
    amp: new Float32Array(G * G),
    gx: new Float32Array(G * G),
    gy: new Float32Array(G * G),
    burst: 0,
  }
}

/** Ring the plate at a new note. The field is separable on a square plate,
    so it is built from per-axis cos/sin tables. */
export function setMode(sand: Sand, mode: number) {
  const [n, m, s] = MODES[mode % MODES.length]
  const an = new Float32Array(G), sn = new Float32Array(G)
  const am = new Float32Array(G), sm = new Float32Array(G)
  for (let i = 0; i < G; i++) {
    const u = (i + 0.5) / G
    an[i] = Math.cos(n * Math.PI * u)
    sn[i] = Math.sin(n * Math.PI * u)
    am[i] = Math.cos(m * Math.PI * u)
    sm[i] = Math.sin(m * Math.PI * u)
  }
  const g0 = 0.5 * Math.PI * (n + m)
  for (let j = 0; j < G; j++) {
    for (let k = 0; k < G; k++) {
      const f = 0.5 * (an[k] * am[j] + s * am[k] * an[j])
      const fx = -0.5 * Math.PI * (n * sn[k] * am[j] + s * m * sm[k] * an[j])
      const fy = -0.5 * Math.PI * (m * an[k] * sm[j] + s * n * am[k] * sn[j])
      const c = j * G + k
      sand.amp[c] = Math.abs(f)
      sand.gx[c] = (f * fx) / g0
      sand.gy[c] = (f * fy) / g0
    }
  }
  sand.burst = 1
}

/** Advance by `k` 60fps frames */
export function stepSand(sand: Sand, k: number) {
  const { x, y, amp, gx, gy } = sand
  const pull = 0.014 * k
  const shake = 0.03 * k * (1 + sand.burst * 2)
  // Grains on a still line barely move; more than this keeps the lines fuzzy
  const rest = 0.00012 * k
  for (let i = 0; i < x.length; i++) {
    const c = ((y[i] * G) | 0) * G + ((x[i] * G) | 0)
    const kick = amp[c] * shake + rest
    let px = x[i] - gx[c] * pull + (Math.random() - 0.5) * kick
    let py = y[i] - gy[c] * pull + (Math.random() - 0.5) * kick
    // Grains bounce off the plate's edge
    if (px < 0) px = -px
    else if (px >= 1) px = 1.999999 - px
    if (py < 0) py = -py
    else if (py >= 1) py = 1.999999 - py
    x[i] = px
    y[i] = py
  }
  sand.burst *= Math.exp(-k / 20)
}

/** Settle the current figure fully, for reduced motion */
export function settle(sand: Sand) {
  sand.burst = 0
  for (let n = 0; n < 240; n++) stepSand(sand, 1)
}
