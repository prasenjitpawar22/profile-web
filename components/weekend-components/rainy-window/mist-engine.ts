// Condensation on a pane of glass, drawn on canvas.
//
// A coarse grid of "clarity" cells (0 = misted, 1 = wiped clear) is the whole
// state. The finger stamps clarity in; untouched cells mist back over. Each
// frame the grid becomes two small masks, upscaled over the field:
//   - fog mask: where the condensation shows: a grey haze, the password as
//     blurred light glowing through it, and beads of water on the surface
//   - rim mask: the thin band at the edge of a wipe, where the water the
//     finger pushed aside gathers into a line of beads
// The sharp password text is drawn only where the fog mask is empty. When
// the finger lifts, one or two drops gather on the lower edge of the wiped
// patch and run down, leaving a clear trail.

const CELL = 2

export type MistOptions = {
  radius: number
  regrowMs: number
  reducedMotion: boolean
}

/** Read from the field's CSS tokens, so light and dark mode can differ */
export type MistColors = {
  filmTop: string
  filmBottom: string
  water: string
  bead: string
  text: string
  textShadow: string
  glow: string
  glowCore: string
}

const DEFAULT_COLORS: MistColors = {
  filmTop: 'rgba(168, 180, 198, 0.36)',
  filmBottom: 'rgba(140, 152, 172, 0.32)',
  water: 'rgba(214, 226, 242, 0.22)',
  bead: 'rgba(246, 250, 255, 1)',
  text: '#f6fbff',
  textShadow: 'rgba(0, 18, 40, 0.45)',
  glow: 'rgba(255, 206, 150, 0.85)',
  glowCore: 'rgba(255, 244, 226, 1)',
}

type Bead = { x: number; y: number; r: number }
type Drip = { x: number; y: number; r: number; v: number; left: number }

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function layer(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, w)
  c.height = Math.max(1, h)
  return c
}

export class MistEngine {
  W = 0
  H = 0
  dpr = 1
  gw = 0
  gh = 0
  now = 0

  c = new Float32Array(0) // clarity
  touched = new Float32Array(0) // last time the finger cleared this cell
  seed = new Float32Array(0) // per-cell misting speed, so the fog returns unevenly
  edge = new Float32Array(0) // static jitter that makes wipe edges ragged
  drips: Drip[] = []

  held = false
  heldT = 0
  pos = { x: 0, y: 0 }
  target = { x: 0, y: 0 }
  phase = [0, 0, 0]

  text = ''
  scroll = 0
  glyph = 9.6
  advance = 9.6
  padX = 16
  font = '16px monospace'
  textDirty = true
  colors: MistColors = DEFAULT_COLORS

  ctx: CanvasRenderingContext2D
  sharp = layer(1, 1)
  glow = layer(1, 1)
  film = layer(1, 1)
  beads = layer(1, 1)
  edgeBeads = layer(1, 1)
  mistSeed = (Math.random() * 1e9) | 0
  fogLayer = layer(1, 1)
  rimLayer = layer(1, 1)
  fogMask = layer(1, 1)
  rimMask = layer(1, 1)
  fogData: ImageData | null = null
  rimData: ImageData | null = null

  constructor(
    public canvas: HTMLCanvasElement,
    public opts: MistOptions,
  ) {
    this.ctx = canvas.getContext('2d')!
  }

  get ready() {
    return this.W > 0
  }

  resize(W: number, H: number) {
    if (W < 1 || H < 1) return
    this.W = W
    this.H = H
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    const pw = Math.round(W * this.dpr)
    const ph = Math.round(H * this.dpr)
    this.canvas.width = pw
    this.canvas.height = ph
    this.sharp = layer(pw, ph)
    this.glow = layer(pw, ph)
    this.fogLayer = layer(pw, ph)
    this.rimLayer = layer(pw, ph)
    this.paintMist()

    this.gw = Math.ceil(W / CELL) + 1
    this.gh = Math.ceil(H / CELL) + 1
    const n = this.gw * this.gh
    this.c = new Float32Array(n)
    this.touched = new Float32Array(n).fill(-1e9)
    this.seed = valueNoise(this.gw, this.gh, 9)
    this.edge = new Float32Array(n).map(() => (Math.random() - 0.5) * 0.26)
    this.drips = []
    this.fogMask = layer(this.gw, this.gh)
    this.rimMask = layer(this.gw, this.gh)
    this.fogData = this.fogMask.getContext('2d')!.createImageData(this.gw, this.gh)
    this.rimData = this.rimMask.getContext('2d')!.createImageData(this.gw, this.gh)
    this.textDirty = true
  }

  /** New theme: repaint the mist and the text, keep the wipe state as it is */
  setColors(colors: Partial<MistColors>) {
    const next = { ...DEFAULT_COLORS }
    for (const k of Object.keys(next) as (keyof MistColors)[]) if (colors[k]) next[k] = colors[k]!
    this.colors = next
    if (this.ready) this.paintMist()
    this.textDirty = true
  }

  private paintMist() {
    const rand = prng(this.mistSeed)
    const beads = scatterBeads(this.W, this.H, rand)
    this.film = paintFilm(this.W, this.H, this.dpr, this.colors, rand, beads)
    this.beads = paintBeads(this.W, this.H, this.dpr, this.colors, beads, false)
    this.edgeBeads = paintBeads(this.W, this.H, this.dpr, this.colors, scatterEdgeBeads(this.W, this.H, rand), true)
  }

  setFont(font: string, letterSpacing: number, padX: number) {
    this.font = font
    this.ctx.font = font
    // The native field draws one bullet per character, so each character is
    // centred in a bullet-wide slot and the caret and selection line up
    this.glyph = this.ctx.measureText('•').width
    this.advance = this.glyph + letterSpacing
    this.padX = padX
    this.textDirty = true
  }

  setText(text: string, scroll: number) {
    this.text = text
    this.scroll = scroll
    this.textDirty = true
  }

  /** x of the boundary before character `index` */
  caretX(index: number) {
    return this.padX + index * this.advance - this.scroll
  }

  // ---- the finger --------------------------------------------------------

  press(x: number, y: number) {
    this.held = true
    this.heldT = 0
    this.pos = { x, y }
    this.target = { x, y }
    this.phase = [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28]
  }

  move(x: number, y: number) {
    this.target = {
      x: Math.min(this.W, Math.max(0, x)),
      y: Math.min(this.H, Math.max(0, y)),
    }
  }

  release() {
    this.held = false
    if (!this.opts.reducedMotion) this.spawnDrips()
  }

  // The water the finger gathered collects on the lower edge of the wiped
  // patch and, heavy enough, runs down
  private spawnDrips() {
    const { gw, gh, c } = this
    const spots: [number, number][] = []
    for (let x = 1; x < gw - 1; x++)
      for (let y = gh - 4; y >= 1; y--) {
        if (c[y * gw + x] > 0.7 && c[(y + 2) * gw + x] < 0.35) {
          // Start a little way up inside the patch so the slide reads
          spots.push([x * CELL, Math.max(4, y * CELL - 10)])
          break
        }
      }
    // A wipe across the full height has no lower edge: the water starts
    // higher up inside the cleared patch and slides down through it
    if (!spots.length) {
      const row = Math.round(gh * 0.32)
      for (let x = 2; x < gw - 2; x += 2) if (c[row * gw + x] > 0.7) spots.push([x * CELL, row * CELL])
    }
    if (!spots.length) return
    const count = Math.random() < 0.6 ? 2 : 1
    for (let k = 0; k < count; k++) {
      const [x, y] = spots[Math.floor(Math.random() * spots.length)]
      if (this.drips.some((d) => Math.abs(d.x - x) < 12)) continue
      this.drips.push({ x, y, r: 1.5 + Math.random() * 1.1, v: 9 + Math.random() * 9, left: 18 + Math.random() * 20 })
    }
  }

  private stamp(px: number, py: number, R: number, amount: number) {
    const { gw, gh, c, touched, phase, now } = this
    const reach = R * 1.25
    const x0 = Math.max(0, Math.floor((px - reach) / CELL))
    const x1 = Math.min(gw - 1, Math.ceil((px + reach) / CELL))
    const y0 = Math.max(0, Math.floor((py - reach) / CELL))
    const y1 = Math.min(gh - 1, Math.ceil((py + reach) / CELL))
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const dx = x * CELL - px
        const dy = y * CELL - py
        const d = Math.hypot(dx, dy)
        // A fingertip is never a perfect circle: wobble the radius by angle
        const a = Math.atan2(dy, dx)
        const rr =
          R *
          (1 + 0.11 * Math.sin(3 * a + phase[0]) + 0.06 * Math.sin(5 * a + phase[1]) + 0.04 * Math.sin(11 * a + phase[2]))
        if (d >= rr) continue
        const f = 1 - smooth(rr * 0.55, rr, d)
        const i = y * gw + x
        c[i] = Math.min(1, c[i] + f * amount)
        touched[i] = now
      }
  }

  // ---- simulation --------------------------------------------------------

  /** Advances the glass; returns false once nothing is left to animate */
  step(dt: number) {
    this.now += dt
    if (!this.ready) return false
    const { gw, gh, c, touched, seed, now, opts } = this

    if (this.held) {
      this.heldT += dt
      if (opts.reducedMotion) {
        c.fill(1)
        touched.fill(now)
      } else {
        // The clear spot trails the finger slightly, like a real smear
        const prev = this.pos
        const k = 1 - Math.exp(-dt / 45)
        this.pos = {
          x: prev.x + (this.target.x - prev.x) * k,
          y: prev.y + (this.target.y - prev.y) * k,
        }
        // The hole opens from a point rather than appearing at full size
        const grow = Math.min(1, this.heldT / 220)
        const R = opts.radius * (1 - Math.pow(1 - grow, 3))
        const dist = Math.hypot(this.pos.x - prev.x, this.pos.y - prev.y)
        const steps = Math.max(1, Math.ceil(dist / Math.max(2, R * 0.25)))
        for (let s = 1; s <= steps; s++) {
          const t = s / steps
          const moving = dist > 0.5 ? 0.28 : 0
          this.stamp(
            prev.x + (this.pos.x - prev.x) * t,
            prev.y + (this.pos.y - prev.y) * t,
            R,
            dt / steps / 110 + moving,
          )
        }
      }
    }

    // Drips run down in fits and starts, wiping a narrow trail as they go
    for (const d of this.drips) {
      const lurch = Math.random() < 0.12 ? 0.15 : 1
      const dy = (d.v * dt * lurch) / 1000
      d.y += dy
      d.x += (Math.random() - 0.5) * 0.15
      d.left -= dy
      this.stamp(d.x, d.y - d.r * 0.6, d.r * 1.1, 1)
    }
    this.drips = this.drips.filter((d) => d.left > 0 && d.y < this.H + d.r)

    const fogAt = (x: number, y: number) =>
      x < 0 || y < 0 || x >= gw || y >= gh ? 1 : 1 - c[y * gw + x]
    const wait = opts.reducedMotion ? 400 : 220
    let any = false
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x
        if (c[i] <= 0) continue
        any = true
        // Nothing mists over while the finger is still on the glass
        if (this.held || now - touched[i] < wait) continue
        if (opts.reducedMotion) {
          c[i] = Math.max(0, c[i] - dt / opts.regrowMs)
          continue
        }
        // Breath on cold glass: the mist creeps back in from the edges of
        // the wipe, a little unevenly
        const nf = (fogAt(x - 1, y) + fogAt(x + 1, y) + fogAt(x, y - 1) + fogAt(x, y + 1)) / 4
        const k = 0.8 + seed[i] * 0.35 + nf * 1.0
        c[i] = Math.max(0, c[i] - (dt / opts.regrowMs) * k)
      }

    return this.held || any || this.drips.length > 0 || this.textDirty
  }

  // ---- rendering ---------------------------------------------------------

  private renderText() {
    const { dpr, W, H } = this
    const sx = this.sharp.getContext('2d')!
    const gx = this.glow.getContext('2d')!
    for (const x of [sx, gx]) {
      x.setTransform(dpr, 0, 0, dpr, 0, 0)
      x.clearRect(0, 0, W, H)
      x.font = this.font
      x.textAlign = 'center'
      x.textBaseline = 'middle'
      x.lineJoin = 'round'
    }
    sx.fillStyle = this.colors.text
    sx.shadowColor = this.colors.textShadow
    sx.shadowBlur = 3

    const chars: { ch: string; x: number; k: number }[] = []
    for (let i = 0; i < this.text.length; i++) {
      const cx = this.caretX(i) + this.glyph / 2
      if (cx < -30 || cx > W + 30) continue
      // Each character is its own lamp, a little brighter or dimmer
      chars.push({ ch: this.text[i], x: cx, k: 0.72 + 0.28 * hash1(i) })
      sx.fillText(this.text[i], cx, H / 2 + 1)
    }

    // Under the mist the password is only light: a halo and a soft core per
    // character, blurred far past reading, like street lamps seen through a
    // fogged car window at night
    for (const c of chars) {
      const r = 9
      const g = gx.createRadialGradient(c.x, H / 2, 0, c.x, H / 2, r)
      g.addColorStop(0, this.colors.glow)
      g.addColorStop(1, 'rgba(0, 0, 0, 0)')
      gx.globalAlpha = 0.6 * c.k
      gx.fillStyle = g
      gx.fillRect(c.x - r, H / 2 - r, r * 2, r * 2)
    }
    const pass = (color: string, blur: number, width: number, alpha: number) => {
      gx.filter = `blur(${blur * dpr}px)`
      gx.fillStyle = color
      gx.strokeStyle = color
      gx.lineWidth = width
      for (const c of chars) {
        gx.globalAlpha = alpha * c.k
        gx.fillText(c.ch, c.x, H / 2 + 1)
        gx.strokeText(c.ch, c.x, H / 2 + 1)
      }
    }
    pass(this.colors.glowCore, 3.6, 2, 1)
    pass(this.colors.glowCore, 3.6, 2, 0.5)
    gx.filter = 'none'
    gx.globalAlpha = 1
    this.textDirty = false
  }

  draw() {
    if (!this.ready || !this.fogData || !this.rimData) return
    if (this.textDirty) this.renderText()
    const { ctx, gw, gh, c, edge, canvas, dpr } = this
    const pw = canvas.width
    const ph = canvas.height
    const fd = this.fogData.data
    const rd = this.rimData.data

    for (let i = 0; i < gw * gh; i++) {
      const e = c[i] + edge[i]
      const clear = smooth(0.4, 0.6, e)
      fd[i * 4 + 3] = (1 - clear) * 255
      const rim = c[i] < 0.03 ? 0 : Math.max(0, 1 - Math.abs(e - 0.5) * 3)
      rd[i * 4] = rd[i * 4 + 1] = rd[i * 4 + 2] = 255
      rd[i * 4 + 3] = rim * 255
    }
    this.fogMask.getContext('2d')!.putImageData(this.fogData, 0, 0)
    this.rimMask.getContext('2d')!.putImageData(this.rimData, 0, 0)
    const mw = gw * CELL * dpr
    const mh = gh * CELL * dpr

    // Mist: the haze, the password's light glowing through it, then the
    // beads on the surface, all kept only where the glass is misted
    const fx = this.fogLayer.getContext('2d')!
    fx.globalCompositeOperation = 'source-over'
    fx.clearRect(0, 0, pw, ph)
    fx.drawImage(this.film, 0, 0)
    fx.globalCompositeOperation = 'screen'
    fx.drawImage(this.glow, 0, 0)
    fx.globalCompositeOperation = 'source-over'
    fx.drawImage(this.beads, 0, 0)
    fx.globalCompositeOperation = 'destination-in'
    fx.drawImage(this.fogMask, 0, 0, mw, mh)

    // Rim: the water the wipe pushed aside, gathered into a line of beads
    const rx = this.rimLayer.getContext('2d')!
    rx.globalCompositeOperation = 'source-over'
    rx.clearRect(0, 0, pw, ph)
    rx.drawImage(this.edgeBeads, 0, 0)
    rx.globalCompositeOperation = 'destination-in'
    rx.drawImage(this.rimMask, 0, 0, mw, mh)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, pw, ph)
    ctx.drawImage(this.sharp, 0, 0)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(this.fogMask, 0, 0, mw, mh)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(this.fogLayer, 0, 0)
    ctx.drawImage(this.rimLayer, 0, 0)

    // Drips, stretched a little by their own weight
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (const d of this.drips) drawBead(ctx, this.colors, { x: d.x, y: d.y, r: d.r }, 1, 1.25, true)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
}

// ---- the mist itself, painted once per size and theme ----------------------

const hash1 = (i: number) => {
  const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453
  return s - Math.floor(s)
}

/** Small seeded PRNG, so a theme flip repaints the same condensation */
function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function valueNoise(gw: number, gh: number, scale: number) {
  const cw = Math.ceil(gw / scale) + 2
  const ch = Math.ceil(gh / scale) + 2
  const rnd = Array.from({ length: cw * ch }, Math.random)
  const out = new Float32Array(gw * gh)
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const fx = x / scale
      const fy = y / scale
      const ix = Math.floor(fx)
      const iy = Math.floor(fy)
      const tx = fx - ix
      const ty = fy - iy
      const a = rnd[iy * cw + ix]
      const b = rnd[iy * cw + ix + 1]
      const c = rnd[(iy + 1) * cw + ix]
      const d = rnd[(iy + 1) * cw + ix + 1]
      out[y * gw + x] = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
    }
  return out
}

/** Condensation in three sizes: a dust of tiny beads, smaller drops, a few larger ones */
function scatterBeads(W: number, H: number, rand: () => number) {
  const tiny: Bead[] = []
  const mid: Bead[] = []
  const big: Bead[] = []
  for (let k = 0; k < (W * H) / 7; k++) tiny.push({ x: rand() * W, y: rand() * H, r: 0.3 + rand() * 0.55 })
  for (let k = 0; k < (W * H) / 90; k++) mid.push({ x: rand() * W, y: rand() * H, r: 0.9 + Math.pow(rand(), 1.5) * 1.3 })
  for (let k = 0; k < Math.max(3, W / 26); k++) big.push({ x: rand() * W, y: 4 + rand() * (H - 8), r: 2 + Math.pow(rand(), 1.3) * 1.8 })
  return { tiny, mid, big }
}

/** Dense mid-size beads, shown only along the edge of a wipe */
function scatterEdgeBeads(W: number, H: number, rand: () => number) {
  const out: Bead[] = []
  for (let k = 0; k < (W * H) / 26; k++) out.push({ x: rand() * W, y: rand() * H, r: 0.7 + Math.pow(rand(), 1.6) * 1.5 })
  return { tiny: [] as Bead[], mid: out, big: [] as Bead[] }
}

/** The haze: a thin grey film with uneven patches and grain; each bead is a
 * clearer spot in it, since water lets more light through than mist */
function paintFilm(
  W: number,
  H: number,
  dpr: number,
  colors: MistColors,
  rand: () => number,
  beads: ReturnType<typeof scatterBeads>,
) {
  const canvas = layer(Math.round(W * dpr), Math.round(H * dpr))
  const x = canvas.getContext('2d')!
  x.scale(dpr, dpr)

  const film = x.createLinearGradient(0, 0, 0, H)
  film.addColorStop(0, colors.filmTop)
  film.addColorStop(1, colors.filmBottom)
  x.fillStyle = film
  x.fillRect(0, 0, W, H)

  // Breath never lands evenly: soft denser patches
  for (let k = 0; k < Math.round(W / 30); k++) {
    const cx = rand() * W
    const cy = rand() * H
    const r = 12 + rand() * 30
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(255, 255, 255, 0.09)')
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    x.fillStyle = g
    x.fillRect(cx - r, cy - r, r * 2, r * 2)
  }

  // Grain, so the haze reads as a surface rather than a blur filter
  const gw = canvas.width
  const gh = canvas.height
  const grain = layer(gw, gh)
  const gx = grain.getContext('2d')!
  const img = gx.createImageData(gw, gh)
  for (let i = 0; i < gw * gh; i++) {
    const v = 200 + rand() * 55
    img.data[i * 4] = v
    img.data[i * 4 + 1] = v
    img.data[i * 4 + 2] = v + 6
    img.data[i * 4 + 3] = rand() * 22
  }
  gx.putImageData(img, 0, 0)
  x.setTransform(1, 0, 0, 1, 0, 0)
  x.drawImage(grain, 0, 0)
  x.scale(dpr, dpr)

  // Punch every bead into a clearer spot
  x.globalCompositeOperation = 'destination-out'
  const punch = (list: Bead[], alpha: number) => {
    x.fillStyle = `rgba(0, 0, 0, ${alpha})`
    for (const b of list) {
      x.beginPath()
      x.arc(b.x, b.y, b.r * 0.85, 0, Math.PI * 2)
      x.fill()
    }
  }
  punch(beads.tiny, 0.35)
  punch(beads.mid, 0.55)
  punch(beads.big, 0.7)
  x.globalCompositeOperation = 'source-over'
  return canvas
}

/** One bead of water: a dark rim where light bends away at its edge, light
 * gathered inside its lower side, and a highlight up and to the left */
function drawBead(x: CanvasRenderingContext2D, colors: MistColors, b: Bead, s: number, stretch = 1, filled = false) {
  const { r } = b
  x.save()
  x.translate(b.x, b.y)
  x.scale(1, stretch)
  if (filled) {
    x.globalAlpha = 1
    x.fillStyle = colors.water
    x.beginPath()
    x.arc(0, 0, r, 0, Math.PI * 2)
    x.fill()
  }
  x.globalAlpha = 0.5 * s
  x.strokeStyle = 'rgba(4, 10, 22, 1)'
  x.lineWidth = Math.max(0.35, r * 0.3)
  x.beginPath()
  x.arc(0, 0, r * 0.84, 0, Math.PI * 2)
  x.stroke()
  x.globalAlpha = 0.3 * s
  x.strokeStyle = colors.bead
  x.lineWidth = Math.max(0.3, r * 0.22)
  x.beginPath()
  x.arc(0, 0, r * 0.58, Math.PI * 0.15, Math.PI * 0.85)
  x.stroke()
  x.globalAlpha = 0.95 * s
  x.fillStyle = colors.bead
  x.beginPath()
  x.arc(-r * 0.32, -r * 0.36, Math.max(0.3, r * 0.24), 0, Math.PI * 2)
  x.fill()
  x.restore()
}

/** The beads on the surface, crisp, laid over the haze */
function paintBeads(
  W: number,
  H: number,
  dpr: number,
  colors: MistColors,
  beads: ReturnType<typeof scatterBeads>,
  filled: boolean,
) {
  const canvas = layer(Math.round(W * dpr), Math.round(H * dpr))
  const x = canvas.getContext('2d')!
  x.scale(dpr, dpr)

  // The dust of tiny beads: just a darker speck, some with a pinpoint glint
  for (const b of beads.tiny) {
    x.globalAlpha = 0.22
    x.fillStyle = 'rgba(4, 10, 22, 1)'
    x.beginPath()
    x.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    x.fill()
    if (b.r > 0.6) {
      x.globalAlpha = 0.6
      x.fillStyle = colors.bead
      x.fillRect(b.x - b.r * 0.5, b.y - b.r * 0.5, 0.5, 0.5)
    }
  }
  for (const b of beads.mid) drawBead(x, colors, b, 0.85, 1, filled)
  for (const b of beads.big) drawBead(x, colors, b, 1, 1.08, filled)
  x.globalAlpha = 1
  return canvas
}
