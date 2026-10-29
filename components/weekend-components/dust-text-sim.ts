// Text that turns to dust under the cursor, blows away on the wind, then
// re-forms on the letters themselves.
//
// At rest the canvas shows a crisp copy of the real text, laid out glyph by
// glyph exactly where the browser put it. Only cells that have turned to dust
// are cut out of that copy, so nothing looks pixelated until it moves.

/** css px per grain */
const CELL = 2
const WIND_X = 0.05
const LIFT = 0.03
/** Rebuild: a soft wave across the text, left edge to right edge */
const SETTLE_WAVE_MS = 450
/** px a grain lands off its spot before settling */
const SETTLE_JITTER = 2.5
const SETTLE_FADE_MS = 320
/** A full snap sweeps across the text, left to right */
const SNAP_SWEEP_MS = 380

type Grain = {
  /** home: top-left of its cell, in canvas px */
  hx: number
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  a: number
  /** home, blowing away, gone, settling back */
  state: 0 | 1 | 2 | 3
  t: number
  life: number
  alpha: number
  tau: number
}

export type DustField = {
  grains: Grain[]
  /** Grains of text that's been replaced: they only blow away, they never come back */
  drifters: Grain[]
  source: HTMLCanvasElement | null
  w: number
  h: number
  dpr: number
  minX: number
  spanX: number
}

export type Aim = { x: number; y: number; active: boolean }

export const createField = (): DustField => ({
  grains: [],
  drifters: [],
  source: null,
  w: 0,
  h: 0,
  dpr: 1,
  minX: 0,
  spanX: 1,
})

/**
 * Lays the text out on a canvas where the DOM put each glyph, then samples it
 * into grains. With `enter`, the grains start out gone and settle in.
 */
export function rasterize(
  field: DustField,
  canvas: HTMLCanvasElement,
  text: HTMLElement,
  { enter = false, delay = 0 }: { enter?: boolean; delay?: number } = {},
) {
  // Read the real colours, so a theme change is picked up
  text.removeAttribute('data-ready')

  const cr = canvas.getBoundingClientRect()
  const w = canvas.offsetWidth
  const h = canvas.offsetHeight
  if (!w || !h) return
  const scale = cr.width / w
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)

  const src = document.createElement('canvas')
  src.width = canvas.width
  src.height = canvas.height
  const ctx = src.getContext('2d', { willReadFrequently: true })!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.textBaseline = 'alphabetic'

  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const cs = getComputedStyle(node.parentElement!)
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    ctx.fillStyle = cs.color
    for (let i = 0; i < node.data.length; i++) {
      const ch = node.data[i]
      if (!ch.trim()) continue
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const r = range.getClientRects()[0]
      if (!r || !r.width) continue
      const m = ctx.measureText(ch)
      const x = (r.left - cr.left) / scale
      const top = (r.top - cr.top) / scale
      const boxH = r.height / scale
      // The DOM box is the font's content area; centre the canvas glyph's box on it
      const pad = (boxH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2
      ctx.fillText(ch, x, top + pad + m.fontBoundingBoxAscent)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x + r.width / scale)
      minY = Math.min(minY, top)
      maxY = Math.max(maxY, top + boxH)
    }
  }

  // One grain per cell, read at the cell's centre
  const img = ctx.getImageData(0, 0, src.width, src.height).data
  const grains: Grain[] = []
  for (let y = Math.max(0, Math.floor(minY)); y < Math.min(h, maxY); y += CELL) {
    for (let x = Math.max(0, Math.floor(minX)); x < Math.min(w, maxX); x += CELL) {
      const i = (Math.floor((y + CELL / 2) * dpr) * src.width + Math.floor((x + CELL / 2) * dpr)) * 4
      const a = img[i + 3]
      if (a < 24) continue
      grains.push({
        hx: x,
        hy: y,
        x,
        y,
        vx: 0,
        vy: 0,
        color: `rgb(${img[i]},${img[i + 1]},${img[i + 2]})`,
        a: a / 255,
        state: enter ? 2 : 0,
        t: -delay,
        life: 0,
        alpha: enter ? 0 : 1,
        tau: 0,
      })
    }
  }

  Object.assign(field, {
    grains,
    source: src,
    w,
    h,
    dpr,
    minX,
    spanX: Math.max(1, maxX - minX),
  })
  text.setAttribute('data-ready', '')
}

function launch(g: Grain, nx: number, ny: number) {
  g.vx = 0.4 + Math.random() * 1.3 + nx * 0.7
  g.vy = -(0.2 + Math.random() * 0.9) + ny * 0.7
  g.life = 700 + Math.random() * 700
  g.alpha = 1
}

/** Snaps every grain away in a sweep; whatever is rasterized next settles in behind it */
export function snap(field: DustField) {
  const { minX, spanX } = field
  for (const g of field.grains) {
    if (g.state === 2) continue
    if (g.state === 0 || g.state === 3) {
      g.state = 1
      g.t = -((g.hx - minX) / spanX) * SNAP_SWEEP_MS - Math.random() * 60
      launch(g, 0, 0)
    }
    field.drifters.push(g)
  }
  field.grains = []
}

/** The snap's length, so new text can time its arrival behind it */
export const SNAP_MS = SNAP_SWEEP_MS

/** Advances one frame. Returns whether anything is still moving. */
export function step(field: DustField, dt: number, aim: Aim, radius: number, rest: number) {
  const f = dt / 16.67
  const drag = Math.pow(0.985, f)
  const fly = (g: Grain) => {
    g.t += dt
    if (g.t < 0) return
    g.vx += (WIND_X + (Math.random() - 0.5) * 0.18) * f
    g.vy += (-LIFT + (Math.random() - 0.5) * 0.18) * f
    g.vx *= drag
    g.vy *= drag
    g.x += g.vx * f
    g.y += g.vy * f
    const k = Math.min(1, g.t / g.life)
    g.alpha = 1 - k * k
    if (k >= 1) {
      g.state = 2
      g.t = 0
      g.alpha = 0
    }
  }

  let busy = aim.active
  for (const g of field.grains) {
    const cx = g.hx + CELL / 2
    const cy = g.hy + CELL / 2
    if (g.state === 0) {
      if (!aim.active) continue
      const dx = cx - aim.x
      const dy = cy - aim.y
      const d = Math.hypot(dx, dy)
      if (d > radius) continue
      // Grainy erosion: closer grains are likelier to go this frame
      if (Math.random() > Math.pow(1 - d / radius, 0.7) * 0.45 * f) continue
      g.state = 1
      g.t = 0
      launch(g, d ? dx / d : 0, d ? dy / d : 0)
      busy = true
    } else if (g.state === 1) {
      busy = true
      fly(g)
    } else if (g.state === 2) {
      busy = true
      g.t += dt
      const near = aim.active && Math.hypot(cx - aim.x, cy - aim.y) < radius * 1.25
      const wave = ((g.hx - field.minX) / field.spanX) * SETTLE_WAVE_MS + ((g.hy * 7) % 23) * 6
      if (g.t > rest + wave && !near) {
        // Re-form in place: appear on its own spot, a hair off, and settle.
        // A grain never flies back along the path it blew away on.
        g.state = 3
        g.x = g.hx + (Math.random() - 0.5) * SETTLE_JITTER
        g.y = g.hy - Math.random() * SETTLE_JITTER
        g.alpha = 0
        g.tau = 90 + Math.random() * 90
        g.life = SETTLE_FADE_MS * (0.7 + Math.random() * 0.6)
      }
    } else {
      busy = true
      const k = 1 - Math.exp(-dt / g.tau)
      g.x += (g.hx - g.x) * k
      g.y += (g.hy - g.y) * k
      g.alpha = Math.min(1, g.alpha + dt / g.life)
      if (g.alpha >= 1 && Math.hypot(g.hx - g.x, g.hy - g.y) < 0.35) {
        g.state = 0
        g.x = g.hx
        g.y = g.hy
      }
    }
  }

  if (field.drifters.length) {
    busy = true
    for (const g of field.drifters) fly(g)
    field.drifters = field.drifters.filter((g) => g.state === 1)
  }
  return busy
}

export function draw(ctx: CanvasRenderingContext2D, field: DustField) {
  const { w, h, dpr, source } = field
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.clearRect(0, 0, w, h)
  if (!source) return
  ctx.drawImage(source, 0, 0, w, h)

  // Cut out the cells whose grains have left; a settling grain fills its own gap back in
  ctx.globalCompositeOperation = 'destination-out'
  for (const g of field.grains) {
    if (g.state === 0) continue
    ctx.globalAlpha = g.state === 3 ? 1 - g.alpha : 1
    ctx.fillRect(g.hx, g.hy, CELL, CELL)
  }

  ctx.globalCompositeOperation = 'source-over'
  const paint = (g: Grain) => {
    // A drifter waiting for the snap's sweep to reach it is still part of the old text
    const alpha = g.t < 0 && g.state === 1 ? 1 : g.alpha
    if (alpha <= 0.01) return
    ctx.globalAlpha = alpha * g.a
    ctx.fillStyle = g.color
    ctx.fillRect(g.x, g.y, CELL, CELL)
  }
  for (const g of field.grains) if (g.state === 1 || g.state === 3) paint(g)
  for (const g of field.drifters) paint(g)
  ctx.globalAlpha = 1
}
