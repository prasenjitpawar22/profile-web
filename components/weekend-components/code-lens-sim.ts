/* Code lens: a page of source you can only read where you look.
   Outside the glass every word is hidden as ASCII texture that breathes;
   the shape of the code survives (indentation, braces, line lengths).
   Under the loupe the real characters come back in syntax colour, sharpening
   out of blurry ASCII one after another, and the lines arch into a small
   mountain. Every effect fades toward the rim, so the glass meets the page.
   The page you are reading is this file. */

type RGB = [number, number, number]

const enum C {
  Ident,
  Keyword,
  String,
  Number,
  Comment,
  Func,
  Type,
  Punct,
  Space,
}

// Tuned in /proto/code-lens
const P = {
  radius: 124,
  mag: 1.35,
  curve: 0.1,
  peak: 18,
  slope: 1.2,
  swell: 0.25,
  border: 1,
  blur: 0.7,
  fringe: 2,
  follow: 0.19,
  breathDepth: 0.06,
  breathSpeed: 3.5,
  change: 1,
  scramble: 170,
  settle: 480,
  stagger: 7,
  linger: 700,
}

const SCRAMBLE = '!<>-_\\/[]{}=+*^?#%&$~'
const LH = 20
const FONT = 13
const PADY = 18
const TEXT_X = 18
const LEVELS = 7
const CLASS_NAMES = ['identifier', 'keyword', 'string', 'number', 'comment', 'function', 'type', 'punctuation', 'space']

const KEYWORDS = new Set([
  'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'function', 'export', 'import',
  'from', 'new', 'continue', 'break', 'type', 'true', 'false', 'null', 'undefined', 'typeof',
  'as', 'default', 'of', 'in', 'this', 'class', 'extends', 'switch', 'case', 'void', 'enum',
])

// What each class shows outside the glass; spaces and punctuation stay as they are
const HIDE: Partial<Record<C, string>> = {
  [C.Ident]: ':.;',
  [C.Keyword]: '=-',
  [C.String]: '~-',
  [C.Number]: '#+',
  [C.Comment]: '.,',
  [C.Func]: '+*',
  [C.Type]: '*%',
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const hash = (a: number, b: number) => {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return h - Math.floor(h)
}
const parseRGB = (s: string): RGB => {
  const m = s.match(/[\d.]+/g) ?? ['0', '0', '0']
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

/** One class per character, enough to colour TypeScript the way an editor would */
function tokenize(raw: string) {
  const src = raw.replace(/\t/g, '  ').replace(/\r/g, '')
  const n = src.length
  const out = new Uint8Array(n)
  const isId = (c: string) => /[A-Za-z0-9_$]/.test(c)
  let i = 0
  while (i < n) {
    const c = src[i]
    const start = i
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++
      out.fill(C.Comment, start, i)
    } else if (c === '/' && src[i + 1] === '*') {
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++
      i = Math.min(n, i + 2)
      out.fill(C.Comment, start, i)
    } else if (c === "'" || c === '"' || c === '`') {
      i++
      while (i < n && src[i] !== c && !(c !== '`' && src[i] === '\n')) i += src[i] === '\\' ? 2 : 1
      i = Math.min(n, i + 1)
      out.fill(C.String, start, i)
    } else if (/[0-9]/.test(c) && !isId(src[i - 1] ?? ' ')) {
      while (i < n && /[0-9a-fA-Fx._]/.test(src[i])) i++
      out.fill(C.Number, start, i)
    } else if (/[A-Za-z_$]/.test(c)) {
      while (i < n && isId(src[i])) i++
      const word = src.slice(start, i)
      let j = i
      while (src[j] === ' ') j++
      out.fill(KEYWORDS.has(word) ? C.Keyword : src[j] === '(' ? C.Func : /^[A-Z]/.test(word) ? C.Type : C.Ident, start, i)
    } else {
      out[i] = /\s/.test(c) ? C.Space : C.Punct
      i++
    }
  }
  const lines: string[] = []
  const cls: Uint8Array[] = []
  let s = 0
  for (const line of src.split('\n')) {
    lines.push(line)
    cls.push(out.slice(s, s + line.length))
    s += line.length + 1
  }
  return { lines, cls }
}

function palette(dark: boolean, ink: RGB, bg: RGB): RGB[] {
  const p = dark
    ? { kw: '#ff9b7a', str: '#a6d189', num: '#efb96a', com: '#6f7787', fn: '#82aaff', type: '#c7a6ff' }
    : { kw: '#c2410c', str: '#3d7a1f', num: '#a15c07', com: '#8b909a', fn: '#2350c8', type: '#7b3fc2' }
  const dim = ink.map((v, i) => Math.round(v * 0.6 + bg[i] * 0.4)) as RGB
  return [ink, hex(p.kw), hex(p.str), hex(p.num), hex(p.com), hex(p.fn), hex(p.type), dim, ink]
}

function asciiLine(line: string, cls: Uint8Array, row: number) {
  let s = ''
  for (let i = 0; i < line.length; i++) {
    const set = HIDE[cls[i] as C]
    s += set ? set[Math.floor(hash(row, i) * set.length)] : line[i]
  }
  return s
}

/** Runs the page and the loupe on a canvas. Returns a cleanup function. */
export function startCodeLens(canvas: HTMLCanvasElement, box: HTMLElement, source: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const code = tokenize(source)
  const { lines } = code
  const ascii = lines.map((l, i) => asciiLine(l, code.cls[i], i))
  const lineStart = new Int32Array(lines.length)
  let total = 0
  lines.forEach((l, i) => {
    lineStart[i] = total
    total += l.length
  })
  // Breathing: each char gets its own phase, and a period of 0.75–1.25× the base
  const phase0 = new Float32Array(total)
  const periodMul = new Float32Array(total)
  for (let k = 0; k < total; k++) {
    phase0[k] = hash(k, 1)
    periodMul[k] = 0.75 + 0.5 * hash(k, 2)
  }
  const start = new Float64Array(total).fill(-1) // when each char's reveal begins
  const seen = new Float64Array(total).fill(-1e9) // last time it was under the glass

  const reducedQ = window.matchMedia('(prefers-reduced-motion: reduce)')
  let family = 'ui-monospace, monospace'
  let W = 0
  let H = 0
  let dpr = 1
  let cw = 8
  let ready = false
  let ink: RGB = [0, 0, 0]
  let bg: RGB = [255, 255, 255]
  let dark = false
  let pal: RGB[] = []
  let flash: RGB = [255, 255, 255]

  const readTheme = () => {
    ink = parseRGB(getComputedStyle(canvas).color)
    bg = parseRGB(getComputedStyle(box).backgroundColor)
    // The Lab is dark by a wrapper class, not the root, so ask the nearest ancestor
    dark = !!canvas.closest('.dark')
    pal = palette(dark, ink, bg)
    flash = dark ? [255, 255, 255] : ink
  }

  const setup = () => {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    W = r.width
    H = r.height
    dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.font = `${FONT}px ${family}`
    cw = ctx.measureText('M').width
    readTheme()
  }

  // Pointer
  const ptr = { x: 0, y: 0, inside: false }
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    ptr.x = e.clientX - r.left
    ptr.y = e.clientY - r.top
    ptr.inside = true
  }
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') ptr.inside = false
  }
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onMove)
  canvas.addEventListener('pointerleave', onLeave)

  // The glass
  const lens = { x: 0, y: 0, vx: 0, vy: 0, pres: 0, travel: 0 }
  const label = { x: 0, y: 0 }
  let chainT = 0
  let clock = 0
  let last = 0
  let frame = 0
  let cursorHidden = false

  // Per-frame scratch for the glyphs under the glass
  const MAXI = 4000
  const iIdx = new Int32Array(MAXI)
  const iRow = new Int32Array(MAXI)
  const iCol = new Int32Array(MAXI)
  const iX = new Float32Array(MAXI) // where the glass puts it
  const iY = new Float32Array(MAXI)
  const iS = new Float32Array(MAXI)
  const oX = new Float32Array(MAXI) // where it sits on the page, relative to the centre
  const oY = new Float32Array(MAXI)
  const oR = new Float32Array(MAXI)
  const entered: number[] = []

  // Glyphs go into three layers by focus, and each layer is blurred once, not per glyph
  const layerCanvases = [0, 1, 2].map(() => document.createElement('canvas'))
  const layers = layerCanvases.map((c) => c.getContext('2d')!)
  let S = 0
  const prepLayers = (R: number) => {
    const size = Math.ceil((R * 2 + 32) * dpr)
    if (size !== S) {
      S = size
      layerCanvases.forEach((c) => {
        c.width = S
        c.height = S
      })
    }
    for (const l of layers) {
      l.setTransform(1, 0, 0, 1, 0, 0)
      l.clearRect(0, 0, S, S)
      l.setTransform(dpr, 0, 0, dpr, S / 2, S / 2)
      l.font = `${FONT}px ${family}`
      l.textAlign = 'center'
      l.textBaseline = 'middle'
    }
  }
  const glyphOn = (c2: CanvasRenderingContext2D, g: string, x: number, y: number, s: number) => {
    c2.save()
    c2.translate(x, y)
    c2.scale(s, s)
    c2.fillText(g, 0, 0)
    c2.restore()
  }

  const drawLens = (now: number, reduced: boolean, f: number) => {
    const R = P.radius
    const pres = lens.pres
    const s0 = 0.86 + 0.14 * (1 - Math.pow(1 - pres, 3)) // grows in, never from nothing
    const cx = lens.x
    const cy = lens.y
    lens.travel += Math.hypot(lens.vx, lens.vy) * f

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(s0, s0)

    // Feathered cover: solid in the middle, melting into the page's texture at the edge
    const cover = ctx.createRadialGradient(0, 0, R * 0.62, 0, 0, R)
    cover.addColorStop(0, rgba(bg, pres))
    cover.addColorStop(1, rgba(bg, 0))
    ctx.fillStyle = cover
    ctx.fillRect(-R, -R, R * 2, R * 2)

    // Which characters sit under the glass, and where the curve puts them
    const m = P.mag
    const F = P.curve
    const visible = Math.floor((H - PADY * 2) / LH) - 1
    const r0 = Math.max(0, Math.floor((cy - R - PADY) / LH))
    const r1 = Math.min(lines.length - 1, visible, Math.ceil((cy + R - PADY) / LH))
    let n = 0
    entered.length = 0
    for (let row = r0; row <= r1; row++) {
      const line = lines[row]
      const dy = PADY + row * LH + LH / 2 - cy
      const c0 = Math.max(0, Math.floor((cx - R - TEXT_X) / cw))
      const c1 = Math.min(line.length - 1, Math.ceil((cx + R - TEXT_X) / cw))
      for (let col = c0; col <= c1 && n < MAXI; col++) {
        if (line[col] === ' ') continue
        const dx = TEXT_X + col * cw + cw / 2 - cx
        const r = Math.hypot(dx, dy)
        if (r > R + 1) continue
        const lin = m * r
        const th = Math.tanh(lin / R)
        const rho = lin * (1 - F) + F * R * th
        const idx = lineStart[row] + col
        if (now - seen[idx] > P.linger) start[idx] = -1
        seen[idx] = now
        if (start[idx] < 0) {
          if (reduced) start[idx] = now
          else {
            start[idx] = 1e15
            entered.push(idx)
          }
        }
        const radial = m * (1 - F) + F * m * (1 - th * th)
        iIdx[n] = idx
        iRow[n] = row
        iCol[n] = col
        iX[n] = r > 0.5 ? (dx / r) * rho : 0
        iY[n] = r > 0.5 ? (dy / r) * rho : 0
        iS[n] = (radial + (r > 0.5 ? rho / r : m)) / 2
        oX[n] = dx
        oY[n] = dy
        oR[n] = r
        n++
      }
    }
    // Newcomers join the chain in reading order; a full lens resolves within ~600ms
    if (entered.length) {
      entered.sort((a, b) => a - b)
      const step = Math.min(P.stagger, 600 / entered.length)
      chainT = Math.max(now, chainT)
      for (const idx of entered) {
        chainT += step
        start[idx] = chainT
      }
    }

    const scr = reduced ? 0 : P.scramble
    const settle = reduced ? 160 : P.settle
    prepLayers(R)
    for (let q = 0; q < n; q++) {
      const idx = iIdx[q]
      const row = iRow[q]
      const col = iCol[q]
      const age = now - start[idx]
      const target = pal[code.cls[row][col]]
      let glyph: string
      let c: RGB
      let a = 1
      if (age < 0) {
        glyph = ascii[row][col]
        c = ink
        a = 0.35
      } else if (age < scr) {
        glyph = SCRAMBLE[(Math.floor(age / 45) + idx * 7) % SCRAMBLE.length]
        c = mix(target, flash, 0.35)
      } else {
        glyph = lines[row][col]
        c = mix(flash, target, 1 - Math.pow(1 - Math.min(1, (age - scr) / settle), 3))
      }

      // Every effect is strongest at the centre and gone by the rim
      const pr = oR[q]
      const t = 1 - smooth(R * 0.3, R * 0.98, pr)
      const gx = oX[q] + (iX[q] - oX[q]) * t
      let gy = oY[q] + (iY[q] - oY[q]) * t
      // Mountain: lines lift into a peak in the middle and slope down to both sides
      const u = Math.max(-1, Math.min(1, gx / R))
      const hill = Math.pow(1 - u * u, P.slope)
      const hv = hill * Math.max(0, 1 - (gy / R) ** 2)
      gy -= P.peak * hill * t
      const gr = Math.hypot(gx, gy)
      if (gr > R) continue
      const gs = 1 + (iS[q] * (1 + P.swell * hv) - 1) * t
      // Real characters hand over to the page's own texture before the rim
      const reveal = 1 - smooth(R * 0.55, R * 0.92, pr)
      if (reveal <= 0.01) continue
      a *= reveal * (0.72 + 0.28 * hill)
      // Focus pull: blurry ASCII sharpening into the real char; a touch soft mid-band
      let blur = smooth(R * 0.35, R * 0.65, pr) * (1 - smooth(R * 0.7, R * 0.95, pr)) * 0.6
      if (age < scr) blur = 1
      else if (!reduced) blur = Math.max(blur, 1 - Math.min(1, (age - scr) / settle))
      const layer = blur > 0.62 ? layers[2] : blur > 0.28 ? layers[1] : layers[0]
      layer.globalAlpha = a
      layer.fillStyle = rgba(c, 1)
      glyphOn(layer, glyph, gx, gy, gs)
      // Colour fringes in the middle band, vanishing toward the rim
      const e = smooth(R * 0.2, R * 0.55, pr) * (1 - smooth(R * 0.65, R * 0.95, pr))
      if (e > 0.05 && gr > 0.5) {
        const k = e * P.fringe
        const ux = gx / gr
        const uy = gy / gr
        const fl = layers[1]
        fl.globalAlpha = a * 0.7 * e
        fl.fillStyle = 'rgb(255,64,64)'
        glyphOn(fl, glyph, gx + ux * k, gy + uy * k, gs)
        fl.fillStyle = 'rgb(64,150,255)'
        glyphOn(fl, glyph, gx - ux * k, gy - uy * k, gs)
      }
    }

    // Composite the focus layers, then the glass's lift and sheen
    const half = S / dpr / 2
    ctx.globalAlpha = pres
    ctx.filter = `blur(${P.blur}px)`
    ctx.drawImage(layerCanvases[2], -half, -half, half * 2, half * 2)
    ctx.filter = `blur(${P.blur * 0.4}px)`
    ctx.drawImage(layerCanvases[1], -half, -half, half * 2, half * 2)
    ctx.filter = 'none'
    ctx.drawImage(layerCanvases[0], -half, -half, half * 2, half * 2)
    const lift = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.9)
    lift.addColorStop(0, dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.14)')
    lift.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = lift
    ctx.fillRect(-R, -R, R * 2, R * 2)
    ctx.save()
    ctx.translate(-0.34 * R, -0.4 * R)
    ctx.rotate(-0.6)
    ctx.scale(1, 0.45)
    const sheen = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42)
    sheen.addColorStop(0, dark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.55)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = sheen
    ctx.fillRect(-R, -R, R * 2, R * 2)
    ctx.restore()

    // A faint border, ticks and a crosshair etched into the glass
    ctx.lineWidth = P.border
    ctx.strokeStyle = rgba(ink, 0.22)
    ctx.beginPath()
    ctx.arc(0, 0, R - P.border / 2, 0, Math.PI * 2)
    ctx.stroke()
    const inner = R - P.border
    ctx.lineWidth = 1
    ctx.strokeStyle = rgba(ink, 0.32)
    ctx.beginPath()
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2
      ctx.moveTo(Math.cos(a) * (inner - 3), Math.sin(a) * (inner - 3))
      ctx.lineTo(Math.cos(a) * (inner - 11), Math.sin(a) * (inner - 11))
    }
    ctx.moveTo(-10, 0)
    ctx.lineTo(-4, 0)
    ctx.moveTo(4, 0)
    ctx.lineTo(10, 0)
    ctx.moveTo(0, -10)
    ctx.lineTo(0, -4)
    ctx.moveTo(0, 4)
    ctx.lineTo(0, 10)
    ctx.stroke()
    // A dashed ring just outside, turning only as the glass travels
    ctx.save()
    ctx.rotate(lens.travel / (R + 14))
    ctx.setLineDash([2, 7])
    ctx.strokeStyle = rgba(ink, 0.2)
    ctx.beginPath()
    ctx.arc(0, 0, R + 9, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    ctx.restore()

    // Readout: where the crosshair is and what it is pointing at, trailing on a softer spring
    const row = Math.round((cy - PADY - LH / 2) / LH)
    const col = Math.floor((cx - TEXT_X) / cw)
    const ch = row >= 0 && row <= visible ? lines[row]?.[col] : undefined
    const kind = ch && ch !== ' ' ? CLASS_NAMES[code.cls[row][col]] : 'space'
    const tx = cx + R * 0.72 + 14
    const ty = cy + R * 0.72 + 14
    if (label.x === 0 && label.y === 0) {
      label.x = tx
      label.y = ty
    }
    label.x += (tx - label.x) * Math.min(1, 0.16 * f)
    label.y += (ty - label.y) * Math.min(1, 0.16 * f)
    ctx.globalAlpha = pres * 0.75
    ctx.strokeStyle = rgba(ink, 0.3)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx + R * 0.72 * s0, cy + R * 0.72 * s0)
    ctx.lineTo(label.x - 4, label.y - 4)
    ctx.stroke()
    ctx.font = `11px ${family}`
    ctx.textAlign = 'left'
    ctx.fillStyle = rgba(ink, 1)
    ctx.fillText(`L${Math.max(1, row + 1)}:C${Math.max(1, col + 1)} · ${kind}`, label.x, label.y + 4)
  }

  const used = new Uint8Array(LEVELS)
  const loop = (ts: number) => {
    raf = requestAnimationFrame(loop)
    if (!ready) return
    const dt = ts - last
    last = ts
    // Physics steps stay small (a stalled frame can't fling the glass); reveal time stays real
    const f = Math.min(3, dt / (1000 / 60))
    clock += Math.min(500, dt)
    const now = clock
    const reduced = reducedQ.matches
    if (++frame % 30 === 0) readTheme()

    // The glass follows on a spring with a slight overshoot, and appears where the cursor is
    if (reduced || (ptr.inside && lens.pres < 0.02)) {
      lens.x = ptr.x
      lens.y = ptr.y
      lens.vx = lens.vy = 0
    } else {
      lens.vx = (lens.vx + (ptr.x - lens.x) * P.follow * f) * Math.pow(0.62, f)
      lens.vy = (lens.vy + (ptr.y - lens.y) * P.follow * f) * Math.pow(0.62, f)
      lens.x += lens.vx * f
      lens.y += lens.vy * f
    }
    const want = ptr.inside ? 1 : 0
    lens.pres += (want - lens.pres) * Math.min(1, (want ? 0.2 : 0.28) * f)
    if (Math.abs(want - lens.pres) < 0.002) lens.pres = want

    const hide = lens.pres > 0.5
    if (hide !== cursorHidden) {
      cursorHidden = hide
      canvas.style.cursor = hide ? 'none' : ''
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.font = `${FONT}px ${family}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillStyle = rgba(ink, 1)

    // The page breathes: every char slowly brightens and dims on its own rhythm, and at the
    // dimmest point of a breath it becomes a sibling from its family (: ; .  ~ -  * %), so a
    // swap is never caught happening. Drawn as one string per brightness level per row.
    const lastRow = Math.min(lines.length - 1, Math.floor((H - PADY * 2) / LH) - 1)
    const base = 0.28
    const tSec = now / 1000
    for (let i = 0; i <= lastRow; i++) {
      const line = ascii[i]
      const y = PADY + i * LH + LH / 2
      if (reduced) {
        ctx.globalAlpha = base
        ctx.fillText(line, TEXT_X, y)
        continue
      }
      const bufs: string[][] = []
      for (let l = 0; l < LEVELS; l++) bufs.push(new Array(line.length).fill(' '))
      used.fill(0)
      for (let col = 0; col < line.length; col++) {
        const ch = line[col]
        if (ch === ' ') continue
        const k = lineStart[i] + col
        const ph = tSec / (P.breathSpeed * periodMul[k]) + phase0[k]
        const breath = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2) // 0 at the dimmest point
        const lvl = Math.min(LEVELS - 1, Math.floor(breath * LEVELS))
        const set = HIDE[code.cls[i][col] as C]
        const cyc = Math.floor(ph) // ticks over exactly at the dimmest point
        bufs[lvl][col] = set && hash(k, cyc) < P.change ? set[Math.floor(hash(k + 7, cyc) * set.length)] : ch
        used[lvl] = 1
      }
      for (let l = 0; l < LEVELS; l++) {
        if (!used[l]) continue
        ctx.globalAlpha = base - P.breathDepth + (2 * P.breathDepth * (l + 0.5)) / LEVELS
        ctx.fillText(bufs[l].join(''), TEXT_X, y)
      }
    }
    ctx.globalAlpha = 1

    if (lens.pres > 0.003) drawLens(now, reduced, f)
  }

  // Only run while on screen and the tab is visible
  let raf = 0
  let inView = true
  const sync = () => {
    const run = inView && !document.hidden && ready
    if (run && !raf) {
      last = performance.now()
      raf = requestAnimationFrame(loop)
    } else if (!run && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting
    sync()
  })
  io.observe(canvas)
  document.addEventListener('visibilitychange', sync)
  const ro = new ResizeObserver(setup)
  ro.observe(canvas)

  // Measure with the real mono font before the first frame, then fade in
  let alive = true
  document.fonts.ready.then(() => {
    if (!alive) return
    const v = getComputedStyle(document.documentElement).getPropertyValue('--font-geist-mono').trim()
    if (v) family = `${v}, ui-monospace, monospace`
    setup()
    ready = true
    canvas.dataset.ready = ''
    sync()
  })

  return () => {
    alive = false
    cancelAnimationFrame(raf)
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', sync)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerdown', onMove)
    canvas.removeEventListener('pointerleave', onLeave)
  }
}
