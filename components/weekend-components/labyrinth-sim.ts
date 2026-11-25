/* Labyrinth — a perfect maze: exactly one way between any two cells, so it is
   a tree, kept rooted at the exit. Every cell's parent is its next step out.

   Moving the pointer sends pulses that run down the corridors rather than
   spreading in a circle. Each pulse knows the corridor distance from where it
   started, so a cell right behind a wall lights late, and dead ends flash as the
   front runs into them.

   A click draws the one way out, from the exit to the clicked cell, holds it,
   and lets it fade. While it shows, the rest of the maze drops out of focus. */

const CELL = 14
const WALL_INK = 0.18
/** Walls along the thread catch its light */
const LIT = 1.9

// Pulses
const PULSE_SPEED = 15 // cells per second
const REACH = 2.5 // cells for the light to fall off
const TRAIL = 3 // cells of wake behind the front
const SPACING = 15 // px of pointer travel per pulse
const FILL = 0.45 // light filling the corridors
const HEAD = 1.4 // cells of crisp front
const FLOOR = 0.12 // light below this fades out rather than lingering as haze
const CAP = 18

// Thread
const THICK = 3
const FOCUS = 2.5 // cells either side that stay in focus
const DRAW = 0.85
const HOLD = 0.6
const FADE = 1

/** Layer filters, applied in CSS so the blur runs on the GPU once per layer */
export const DEFOCUS = 8
export const BLOOM = 4
export const GLOW = 0.8
/** The whole piece runs a little faster than real time */
export const TIME_SCALE = 1.25
/** How long a click's thread stays up, for reduced motion where nothing animates */
export const HOLD_SECONDS = HOLD / TIME_SCALE

type Grid = {
  n: number
  cols: number
  rows: number
  x0: number
  y0: number
  x: Float32Array
  y: Float32Array
  start: Int32Array
  nb: Int32Array
  root: number
  outX: number
  outY: number
}

function grid(W: number, H: number): Grid & { walls: (joined: (a: number, b: number) => boolean) => Path2D } {
  // A cell of margin all round, so the maze sits inside the frame
  const cols = Math.max(4, Math.floor(W / CELL) - 2)
  const rows = Math.max(4, Math.floor(H / CELL) - 2)
  const x0 = Math.round((W - cols * CELL) / 2) + 0.5
  const y0 = Math.round((H - rows * CELL) / 2) + 0.5
  const n = cols * rows
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const start = new Int32Array(n + 1)
  const list: number[] = []
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i
      x[k] = x0 + (i + 0.5) * CELL
      y[k] = y0 + (j + 0.5) * CELL
      if (i > 0) list.push(k - 1)
      if (i < cols - 1) list.push(k + 1)
      if (j > 0) list.push(k - cols)
      if (j < rows - 1) list.push(k + cols)
      start[k + 1] = list.length
    }
  // The exit: a gap in the bottom wall, somewhere near the middle
  const exit = Math.floor(cols / 2 + (Math.random() - 0.5) * cols * 0.4)
  const root = (rows - 1) * cols + exit
  const x1 = x0 + cols * CELL
  const y1 = y0 + rows * CELL
  const nb = Int32Array.from(list)

  const walls = (joined: (a: number, b: number) => boolean) => {
    const p = new Path2D()
    const h = CELL / 2
    for (let v = 0; v < n; v++)
      for (let s = start[v]; s < start[v + 1]; s++) {
        const u = nb[s]
        if (u < v || joined(u, v)) continue
        const mx = (x[v] + x[u]) / 2
        const my = (y[v] + y[u]) / 2
        const px = -(y[u] - y[v]) / CELL
        const py = (x[u] - x[v]) / CELL
        p.moveTo(mx - px * h, my - py * h)
        p.lineTo(mx + px * h, my + py * h)
      }
    p.moveTo(x0 + exit * CELL, y1)
    p.lineTo(x0, y1)
    p.lineTo(x0, y0)
    p.lineTo(x1, y0)
    p.lineTo(x1, y1)
    p.lineTo(x0 + (exit + 1) * CELL, y1)
    return p
  }
  return { n, cols, rows, x0, y0, x, y, start, nb, root, outX: x[root], outY: y1 + CELL * 0.75, walls }
}

type Pulse = { t0: number; amp: number; dist: Float32Array; far: number }
type Scar = { cells: number[]; frac: number; t0: number; a: number }

export function createLabyrinth(W: number, H: number) {
  const g = grid(W, H)
  const { n, x, y } = g

  // Wilson's algorithm: random walks with their loops erased, so every maze is equally likely
  const parent = new Int32Array(n).fill(-1)
  {
    const inTree = new Uint8Array(n)
    const next = new Int32Array(n)
    inTree[g.root] = 1
    for (let s = 0; s < n; s++) {
      let v = s
      while (!inTree[v]) {
        const a = g.start[v]
        next[v] = g.nb[a + Math.floor(Math.random() * (g.start[v + 1] - a))]
        v = next[v]
      }
      for (v = s; !inTree[v]; v = next[v]) {
        parent[v] = next[v]
        inTree[v] = 1
      }
    }
  }
  const kids: number[][] = Array.from({ length: n }, () => [])
  for (let v = 0; v < n; v++) if (parent[v] >= 0) kids[parent[v]].push(v)
  const leaves: number[] = []
  for (let v = 0; v < n; v++) if (!kids[v].length && v !== g.root) leaves.push(v)
  const walls = g.walls((a, b) => parent[a] === b || parent[b] === a)

  const cellAt = (px: number, py: number) => {
    const i = Math.floor((px - g.x0) / CELL)
    const j = Math.floor((py - g.y0) / CELL)
    return i < 0 || j < 0 || i >= g.cols || j >= g.rows ? -1 : j * g.cols + i
  }

  /** The way out from v: root first, v last */
  const wayOut = (v: number) => {
    const out: number[] = []
    for (let a = v; a >= 0; a = parent[a]) out.push(a)
    return out.reverse()
  }

  // Corridor distance from a cell to every other
  const queue = new Int32Array(n)
  const distances = (src: number) => {
    const dist = new Float32Array(n).fill(-1)
    let head = 0
    let tail = 0
    queue[tail++] = src
    dist[src] = 0
    let far = 0
    while (head < tail) {
      const v = queue[head++]
      const d = dist[v] + 1
      const p = parent[v]
      if (p >= 0 && dist[p] < 0) {
        dist[p] = d
        queue[tail++] = p
      }
      for (const k of kids[v])
        if (dist[k] < 0) {
          dist[k] = d
          queue[tail++] = k
        }
      far = Math.max(far, dist[v])
    }
    return { dist, far }
  }

  let t = 0
  let alpha = 0
  let focusAll = 1
  const ptr = { x: 0, y: 0, inside: false, fresh: true, acc: 0, lastEmit: -10 }
  let ambient = 1.5

  // ---- Pulses ----
  let pulses: Pulse[] = []
  const head = new Float32Array(n)
  const wake = new Float32Array(n)
  const room = new Float32Array(n)
  const spark = new Float32Array(n)

  const emit = (src: number, amp: number) => {
    if (src < 0) return
    if (pulses.length >= CAP) pulses.shift()
    pulses.push({ t0: t, amp, ...distances(src) })
  }

  // ---- Thread ----
  let flash: { cells: number[]; t0: number } | null = null
  let drawn: number[] = [g.root]
  let frac = 1
  let opacity = 0
  let scars: Scar[] = []
  const length = () => drawn.length - 1 - (1 - frac)

  const tickThread = (instant: boolean) => {
    scars = scars.filter((s) => t - s.t0 < 0.6)
    if (!flash) {
      drawn = [g.root]
      frac = 1
      opacity = 0
      return
    }
    const age = t - flash.t0
    const u = instant ? 1 : Math.min(1, age / DRAW)
    // Quick start, soft landing at the clicked cell
    const L = (flash.cells.length - 1) * (1 - (1 - u) ** 3)
    const k = Math.floor(L)
    drawn = flash.cells.slice(0, Math.min(flash.cells.length, k + 2))
    frac = k + 1 < flash.cells.length ? L - k : 1
    const out = age - (instant ? 0 : DRAW) - HOLD
    opacity = out <= 0 ? 1 : instant ? 0 : Math.max(0, 1 - out / FADE)
    if (opacity <= 0) flash = null
  }

  /** Out of the gap, through the cells, to the tip; rounded at every turn */
  const trace = (ctx: CanvasRenderingContext2D, cells: number[], f: number, fromExit: boolean) => {
    const px = (i: number) => (i < 0 ? g.outX : x[cells[i]])
    const py = (i: number) => (i < 0 ? g.outY : y[cells[i]])
    const first = fromExit ? -1 : 0
    const m = cells.length - 1
    if (m + (fromExit ? 1 : 0) < 1) return false
    const tipX = m >= 1 ? px(m - 1) + (px(m) - px(m - 1)) * f : px(m)
    const tipY = m >= 1 ? py(m - 1) + (py(m) - py(m - 1)) * f : py(m)
    ctx.moveTo(px(first), py(first))
    if (m === 0) {
      ctx.lineTo(tipX, tipY)
      return true
    }
    ctx.lineTo((px(first) + px(first + 1)) / 2, (py(first) + py(first + 1)) / 2)
    for (let i = first + 1; i < m - 1; i++) ctx.quadraticCurveTo(px(i), py(i), (px(i) + px(i + 1)) / 2, (py(i) + py(i + 1)) / 2)
    // The last bend ends at the tip, wherever along its corridor it has reached
    const late = f >= 0.5
    const ex = late ? (px(m - 1) + px(m)) / 2 : tipX
    const ey = late ? (py(m - 1) + py(m)) / 2 : tipY
    if (m - 1 > first) ctx.quadraticCurveTo(px(m - 1), py(m - 1), ex, ey)
    else ctx.lineTo(ex, ey)
    if (late) ctx.lineTo(tipX, tipY)
    return true
  }

  return {
    /** Pointer position in CSS px, or inside=false when it leaves */
    pointer(px: number, py: number, inside: boolean) {
      if (!inside) {
        ptr.inside = false
        ptr.fresh = true
        return
      }
      if (!ptr.fresh) ptr.acc += Math.hypot(px - ptr.x, py - ptr.y)
      ptr.fresh = false
      ptr.inside = true
      ptr.x = px
      ptr.y = py
    },

    /** Draw the way out from the clicked cell. `now` is only for reduced motion, which has no clock of its own. */
    click(px: number, py: number, now?: number) {
      if (now !== undefined) t = now * TIME_SCALE
      const c = cellAt(px, py)
      if (c < 0) return
      // A thread still showing fades away instead of vanishing
      if (opacity > 0.02 && drawn.length > 1) scars.push({ cells: drawn.slice(), frac, t0: t, a: opacity })
      flash = { cells: wayOut(c), t0: t }
    },

    tick(dt: number) {
      t += dt
      alpha = Math.min(1, alpha + dt / 0.8)
      if (ptr.inside) {
        const c = cellAt(ptr.x, ptr.y)
        if (ptr.acc >= SPACING && t - ptr.lastEmit > 0.05 && c >= 0) {
          emit(c, 1)
          ptr.acc = 0
          ptr.lastEmit = t
        }
        ptr.acc = Math.min(ptr.acc, SPACING * 4)
      } else {
        // Nobody here: now and then a quiet pulse from somewhere
        ambient -= dt
        if (ambient <= 0) {
          emit(Math.floor(Math.random() * n), 0.55)
          ambient = 3 + Math.random() * 2.5
        }
      }
      pulses = pulses.filter((p) => (t - p.t0) * PULSE_SPEED - TRAIL * 6 < Math.min(p.far, REACH * 3))
      tickThread(false)
      // Focus pulls onto the thread while it shows; quick, because the thread is brief
      focusAll += (1 - opacity - focusAll) * (1 - Math.exp(-dt / 0.08))
    },

    /** Reduced motion: the maze stands still, and a click's thread simply appears and goes */
    still(now: number) {
      // `now` is real seconds; the piece's clock runs TIME_SCALE faster
      t = now * TIME_SCALE
      alpha = 1
      tickThread(true)
      focusAll = 1 - opacity
    },

    draw(sharp: CanvasRenderingContext2D, soft: CanvasRenderingContext2D, glow: CanvasRenderingContext2D, mask: CanvasRenderingContext2D, ink: string) {
      const A = alpha
      for (const c of [sharp, soft, glow, mask]) {
        c.fillStyle = ink
        c.strokeStyle = ink
        c.lineCap = 'round'
        c.lineJoin = 'round'
      }

      // Walls: a soft copy everywhere, a sharp brighter copy wherever the mask says focus
      for (const [ctx, a] of [
        [soft, WALL_INK],
        [sharp, Math.min(1, WALL_INK * LIT)],
      ] as const) {
        ctx.lineCap = 'square'
        ctx.lineWidth = 1
        ctx.globalAlpha = a * A
        ctx.stroke(walls)
        ctx.lineCap = 'round'
      }
      // Whole-maze focus brings walls back to their normal ink, not the thread's brighter ink
      mask.globalAlpha = focusAll / LIT
      mask.fillRect(0, 0, W, H)
      if (opacity > 0 && length() > 0.05)
        for (const [k, a] of [
          [1.8, 0.25],
          [1.3, 0.3],
          [0.8, 0.45],
        ]) {
          mask.beginPath()
          trace(mask, drawn, frac, true)
          mask.lineWidth = FOCUS * CELL * k
          mask.globalAlpha = a * opacity
          mask.stroke()
        }
      for (const [ctx, op] of [
        [sharp, 'destination-in'],
        [soft, 'destination-out'],
      ] as const) {
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = op
        ctx.drawImage(mask.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.restore()
      }

      // Pulses
      head.fill(0)
      wake.fill(0)
      room.fill(0)
      spark.fill(0)
      for (const p of pulses) {
        const front = (t - p.t0) * PULSE_SPEED
        const { dist, amp } = p
        for (let v = 0; v < n; v++) {
          const pv = parent[v]
          const dv = dist[v]
          // Each corridor is lit by its midpoint; the exit stub by the root
          const d = pv >= 0 ? (dv + dist[pv]) / 2 : dv
          const xd = front - d
          if (xd >= 0 && xd <= TRAIL * 6) {
            const a = amp * Math.exp(-d / REACH)
            if (xd < HEAD) head[v] += a * (1 - xd / HEAD)
            wake[v] += a * Math.exp(-xd / TRAIL)
          }
          // The cell itself fills with light as the pulse passes through it
          const xc = front - dv
          if (xc >= 0 && xc < TRAIL * 6) room[v] += amp * Math.exp(-dv / REACH) * Math.exp(-xc / TRAIL)
        }
        for (const v of leaves) {
          const xl = front - dist[v]
          if (xl > 0 && xl < HEAD * 1.5) spark[v] += amp * Math.exp(-dist[v] / REACH) * (1 - xl / (HEAD * 1.5))
        }
      }
      if (pulses.length) {
        const LV = 8
        const lines = (ctx: CanvasRenderingContext2D, val: Float32Array, width: number, gain: number) => {
          ctx.lineWidth = width
          for (let l = 1; l <= LV; l++) {
            ctx.beginPath()
            let any = false
            for (let v = 0; v < n; v++) {
              const r = (Math.min(1, val[v]) - FLOOR / 3) / (1 - FLOOR / 3)
              if (r <= 0 || Math.ceil(r * LV) !== l) continue
              const pv = parent[v]
              ctx.moveTo(x[v], y[v])
              if (pv >= 0) ctx.lineTo(x[pv], y[pv])
              else ctx.lineTo(g.outX, g.outY)
              any = true
            }
            if (!any) continue
            ctx.globalAlpha = (l / LV) * gain * A
            ctx.stroke()
          }
        }
        const rooms = (ctx: CanvasRenderingContext2D, gain: number) => {
          const h = CELL / 2
          for (let l = 1; l <= LV; l++) {
            ctx.beginPath()
            let any = false
            for (let v = 0; v < n; v++) {
              // Faint leftovers from far pulses stay dark, so the maze never fogs over
              const r = (Math.min(1, room[v]) - FLOOR) / (1 - FLOOR)
              if (r <= 0 || Math.ceil(r * LV) !== l) continue
              ctx.rect(x[v] - h, y[v] - h, CELL, CELL)
              any = true
            }
            if (!any) continue
            ctx.globalAlpha = (l / LV) * gain * A
            ctx.fill()
          }
        }
        // Light fills the corridors on the blurred layer; on the sharp layer it is
        // faint enough that the walls cut it into the shape of the passages
        rooms(glow, FILL)
        rooms(sharp, FILL * 0.18)
        lines(glow, wake, 3, 1)
        lines(sharp, wake, 1.25, 0.55)
        lines(sharp, head, 2, 1)

        // Dead ends flash as the front runs into them
        sharp.beginPath()
        glow.beginPath()
        for (const v of leaves) {
          const s = Math.min(1, spark[v])
          if (s < 0.05) continue
          const r = 0.8 + s * 1.2
          sharp.moveTo(x[v] + r, y[v])
          sharp.arc(x[v], y[v], r, 0, Math.PI * 2)
          glow.moveTo(x[v] + r * 2.5, y[v])
          glow.arc(x[v], y[v], r * 2.5, 0, Math.PI * 2)
        }
        sharp.globalAlpha = 0.8 * A
        sharp.fill()
        glow.globalAlpha = 0.5 * A
        glow.fill()
      }

      // Thread, and any thread a new click replaced
      for (const s of scars) {
        const u = (t - s.t0) / 0.6
        sharp.beginPath()
        if (!trace(sharp, s.cells, s.frac, true)) continue
        sharp.lineWidth = THICK
        sharp.globalAlpha = (1 - u) * (1 - u) * s.a * A
        sharp.stroke()
      }
      const show = Math.min(1, length() / 1.5) * A * opacity
      if (show > 0.001) {
        glow.beginPath()
        trace(glow, drawn, frac, true)
        glow.lineWidth = THICK * 3
        glow.globalAlpha = 0.7 * show
        glow.stroke()
        sharp.beginPath()
        trace(sharp, drawn, frac, true)
        sharp.lineWidth = THICK
        sharp.globalAlpha = show
        sharp.stroke()
        // The tip: the cell that was clicked
        const m = drawn.length - 1
        const tx = m === 0 ? x[drawn[0]] : x[drawn[m - 1]] + (x[drawn[m]] - x[drawn[m - 1]]) * frac
        const ty = m === 0 ? y[drawn[0]] : y[drawn[m - 1]] + (y[drawn[m]] - y[drawn[m - 1]]) * frac
        sharp.beginPath()
        sharp.arc(tx, ty, THICK * 1.6, 0, Math.PI * 2)
        sharp.fill()
        glow.beginPath()
        glow.arc(tx, ty, THICK * 4, 0, Math.PI * 2)
        glow.fill()
      }
      for (const c of [sharp, soft, glow, mask]) c.globalAlpha = 1
    },
  }
}
