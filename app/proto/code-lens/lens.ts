'use client'

import { RefObject, useEffect } from 'react'
import { LENS as P, MODES, type Mode, type Style } from './params'
import { asciiLine, family as glyphFamily, palette, tokenize, type RGB } from './syntax'

/* Code lens — a page of source code you can only read where you look.
   Outside the circle every word is hidden as ASCII texture (the shape of the
   code survives: indentation, braces, line lengths). Inside it the real
   characters come back, each scrambling through ASCII before landing in its
   syntax colour, chained one after another. The circle comes in a few styles:
   Plain, Focus (no edge, depth of field), Reticle (an instrument) and Orbit
   (a ring made of the code under it). */

const SCRAMBLE = '!<>-_\\/[]{}=+*^?#%&$~'
const LH = 20
const FONT = 13
const PADY = 18
const CURRENT_GAP = 200 // chars between comets in Current
const CURRENT_TAIL = 16
const CLASS_NAMES = ['identifier', 'keyword', 'string', 'number', 'comment', 'function', 'type', 'punctuation', 'space']
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const parseRGB = (s: string): RGB => {
  const m = s.match(/[\d.]+/g) ?? ['0', '0', '0']
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

export function useCodeLens(
  canvasRef: RefObject<HTMLCanvasElement>,
  scrollRef: RefObject<HTMLDivElement>,
  source: string,
  style: Style,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    const scroller = scrollRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !scroller || !ctx) return

    const code = tokenize(source)
    const { lines } = code
    const ascii = lines.map((l, i) => asciiLine(l, code.cls[i], i))
    const h2 = (a: number, b: number) => {
      const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
      return h - Math.floor(h)
    }
    const lineStart = new Int32Array(lines.length)
    let total = 0
    lines.forEach((l, i) => {
      lineStart[i] = total
      total += l.length
    })
    // Breathing: each char (or token) gets its own phase and a period of 0.75–1.25× the base
    const phase0 = new Float32Array(total)
    const periodMul = new Float32Array(total)
    const tokenOf = new Int32Array(total)
    {
      let tok = 0
      lines.forEach((l, row) => {
        for (let col = 0; col < l.length; col++) {
          const k = lineStart[row] + col
          phase0[k] = h2(k, 1)
          periodMul[k] = 0.75 + 0.5 * h2(k, 2)
          const prev = col > 0 ? l[col - 1] : ' '
          if (l[col] !== ' ' && (prev === ' ' || code.cls[row][col] !== code.cls[row][col - 1])) tok++
          tokenOf[k] = tok
        }
      })
    }
    const start = new Float64Array(total).fill(-1) // when each char's animation begins
    const seen = new Float64Array(total).fill(-1e9) // last time it was under the glass

    const reducedQ = window.matchMedia('(prefers-reduced-motion: reduce)')
    let family = 'ui-monospace, monospace'
    let W = 0
    let H = 0
    let dpr = 1
    let cw = 8
    let textX = 60
    let ready = false
    let ink: RGB = [0, 0, 0]
    let bg: RGB = [255, 255, 255]
    let dark = false
    let pal: RGB[] = []
    let flash: RGB = [255, 255, 255]

    const readTheme = () => {
      ink = parseRGB(getComputedStyle(canvas).color)
      bg = parseRGB(getComputedStyle(scroller).backgroundColor)
      dark = document.documentElement.classList.contains('dark')
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
      textX = 18
      readTheme()
    }

    // Pointer
    const ptr = { x: 0, y: 0, inside: false, down: false }
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
    }
    const onMove = (e: PointerEvent) => {
      local(e)
      ptr.inside = true
    }
    const onDown = (e: PointerEvent) => {
      local(e)
      ptr.inside = true
      ptr.down = true
    }
    const onUp = () => (ptr.down = false)
    const onLeave = (e: PointerEvent) => {
      ptr.down = false
      if (e.pointerType === 'mouse') ptr.inside = false
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onLeave)
    canvas.addEventListener('pointerleave', onLeave)

    // The glass
    const magFor = () => (style === 'Loupe' ? P.glassMag : P.mag)
    const lens = { x: 0, y: 0, vx: 0, vy: 0, pres: 0, mag: magFor(), travel: 0, roll: 0 }
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
    const iX = new Float32Array(MAXI)
    const iY = new Float32Array(MAXI)
    const iS = new Float32Array(MAXI)
    const iRho = new Float32Array(MAXI)
    const oX = new Float32Array(MAXI) // where the char sits on the page, relative to the centre
    const oY = new Float32Array(MAXI)
    const oR = new Float32Array(MAXI)
    const entered: number[] = []

    // Glass draws its glyphs into three layers by focus, then blurs whole layers at once
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
    const composite = (R: number, pres: number) => {
      const half = S / dpr / 2
      ctx.globalAlpha = pres
      ctx.filter = `blur(${P.blur.toFixed(2)}px)`
      ctx.drawImage(layerCanvases[2], -half, -half, half * 2, half * 2)
      ctx.filter = `blur(${(P.blur * 0.4).toFixed(2)}px)`
      ctx.drawImage(layerCanvases[1], -half, -half, half * 2, half * 2)
      ctx.filter = 'none'
      ctx.drawImage(layerCanvases[0], -half, -half, half * 2, half * 2)
      // Sheen: the glass is a touch brighter than the page, with a soft highlight up-left
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
    }
    const drawGlyphOn = (c2: CanvasRenderingContext2D, g: string, x: number, y: number, s: number) => {
      c2.save()
      c2.translate(x, y)
      c2.scale(s, s)
      c2.fillText(g, 0, 0)
      c2.restore()
    }

    const drawLens = (now: number, reduced: boolean, f: number) => {
      const mode: Mode = MODES[P.chainMode] ?? 'Cascade'
      const pres = lens.pres
      const ease = 1 - Math.pow(1 - pres, 3)
      const s0 = 0.86 + 0.14 * ease
      const sp = Math.hypot(lens.vx, lens.vy)
      const soft = style === 'Focus'
      const glass = style === 'Loupe'
      // Focus opens a little while moving, like a lens hunting for focus
      const R = P.radius * (soft && !reduced ? 1 + Math.min(0.14, sp * 0.008) : 1)
      const cx = lens.x
      const cy = lens.y
      // Distance travelled and roll: the decorations move only when the circle does
      lens.travel += sp * f
      lens.roll += (lens.vx * f) / R

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(s0, s0)

      if (soft || glass) {
        // Feathered cover: solid in the middle, melting into the page's texture at the edge
        const cover = ctx.createRadialGradient(0, 0, R * (glass ? 0.62 : 0.5), 0, 0, R)
        cover.addColorStop(0, rgba(bg, pres))
        cover.addColorStop(1, rgba(bg, 0))
        ctx.globalAlpha = 1
        ctx.fillStyle = cover
        ctx.fillRect(-R, -R, R * 2, R * 2)
      } else {
        ctx.globalAlpha = pres
        ctx.fillStyle = rgba(bg, 1)
        ctx.beginPath()
        ctx.arc(0, 0, R, 0, Math.PI * 2)
        ctx.fill()
        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, R, 0, Math.PI * 2)
        ctx.clip()
      }
      ctx.globalAlpha = pres

      // Which characters sit under the circle, and where the curve puts them
      const m = lens.mag
      const F = glass ? P.glassCurve : P.fisheye
      const ccx = cx
      const ccy = cy
      const reach = glass ? R + 2 : (R / m) * (F > 0 ? 1 + 1.4 * F : 1.05)
      const r0 = Math.max(0, Math.floor((ccy - reach - PADY) / LH))
      const visible = Math.floor((H - PADY * 2) / LH) - 1
      const r1 = Math.min(lines.length - 1, visible, Math.ceil((ccy + reach - PADY) / LH))
      let n = 0
      entered.length = 0
      for (let row = r0; row <= r1; row++) {
        const line = lines[row]
        const y = PADY + row * LH + LH / 2
        const dy = y - ccy
        const c0 = Math.max(0, Math.floor((ccx - reach - textX) / cw))
        const c1 = Math.min(line.length - 1, Math.ceil((ccx + reach - textX) / cw))
        for (let col = c0; col <= c1 && n < MAXI; col++) {
          if (line[col] === ' ') continue
          const dx = textX + col * cw + cw / 2 - ccx
          const r = Math.hypot(dx, dy)
          const lin = m * r
          const th = Math.tanh(lin / R)
          const rho = lin * (1 - F) + F * R * th
          if (glass ? r > R + 1 : rho > R + (soft ? 0 : 6)) continue
          const idx = lineStart[row] + col
          if (now - seen[idx] > P.linger) start[idx] = -1
          seen[idx] = now
          if (start[idx] < 0) {
            if (reduced || mode === 'Current') start[idx] = now
            else if (mode === 'Decode') start[idx] = now + (r / 10) * P.stagger
            else {
              start[idx] = 1e15
              entered.push(idx)
            }
          }
          const radial = m * (1 - F) + F * m * (1 - th * th)
          const tang = r > 0.5 ? rho / r : m
          iIdx[n] = idx
          iRow[n] = row
          iCol[n] = col
          iX[n] = r > 0.5 ? (dx / r) * rho : 0
          iY[n] = r > 0.5 ? (dy / r) * rho : 0
          iS[n] = (radial + tang) / 2
          iRho[n] = rho
          oX[n] = dx
          oY[n] = dy
          oR[n] = r
          n++
        }
      }
      // Cascade: newcomers join the chain in reading order, one after another
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
      const band = mode === 'Current' && !reduced
      const pos = (now / 1000) * P.chain
      const fizz = Math.floor(lens.travel / 7)
      if (glass) prepLayers(R)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let q = 0; q < n; q++) {
        const idx = iIdx[q]
        const row = iRow[q]
        const col = iCol[q]
        const age = now - start[idx]
        const target = pal[code.cls[row][col]]
        let glyph: string
        let c: RGB
        let a: number
        if (age < 0) {
          glyph = ascii[row][col]
          c = ink
          a = 0.35
        } else if (age < scr) {
          glyph = SCRAMBLE[(Math.floor(age / 45) + idx * 7) % SCRAMBLE.length]
          c = mix(target, flash, 0.35)
          a = 1
        } else {
          const u = Math.min(1, (age - scr) / settle)
          glyph = lines[row][col]
          c = mix(flash, target, 1 - Math.pow(1 - u, 3))
          a = 1
        }
        if (band) {
          const mm = (((pos - idx) % CURRENT_GAP) + CURRENT_GAP) % CURRENT_GAP
          if (mm < CURRENT_TAIL) {
            const p = 1 - mm / CURRENT_TAIL
            if (p > 0.82) glyph = SCRAMBLE[(idx * 7 + Math.floor(now / 60)) % SCRAMBLE.length]
            c = mix(c, flash, p * 0.85)
          }
        }
        if (soft) {
          // Out of focus toward the rim: fewer real letters, more ASCII fizz
          const w = 1 - smooth(R * 0.45, R, iRho[q])
          if (w < 0.45) glyph = SCRAMBLE[(idx * 7 + fizz) % SCRAMBLE.length]
          a *= Math.min(1, w * 1.8)
        }
        if (glass) {
          // Every effect is strongest at the centre and fades to nothing by the rim,
          // so the edge of the glass lines up with the page around it
          const r0 = oR[q]
          const t = 1 - smooth(R * 0.3, R * 0.98, r0)
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
          const reveal = 1 - smooth(R * 0.55, R * 0.92, r0)
          if (reveal <= 0.01) continue
          a *= reveal * (0.72 + 0.28 * hill)
          // Focus pull, plus a little softness in the middle band only
          let blur = smooth(R * 0.35, R * 0.65, r0) * (1 - smooth(R * 0.7, R * 0.95, r0)) * 0.6
          if (age < scr) blur = 1
          else if (!reduced) blur = Math.max(blur, 1 - Math.min(1, (age - scr) / settle))
          const layer = blur > 0.62 ? layers[2] : blur > 0.28 ? layers[1] : layers[0]
          layer.globalAlpha = a
          layer.fillStyle = rgba(c, 1)
          drawGlyphOn(layer, glyph, gx, gy, gs)
          // Fringes live in the middle band and vanish toward the rim
          const e = smooth(R * 0.2, R * 0.55, r0) * (1 - smooth(R * 0.65, R * 0.95, r0))
          if (e > 0.05 && P.fringe > 0 && gr > 0.5) {
            const k = e * P.fringe
            const ux = gx / gr
            const uy = gy / gr
            const fl = layers[1]
            fl.globalAlpha = a * 0.7 * e
            fl.fillStyle = 'rgb(255,64,64)'
            drawGlyphOn(fl, glyph, gx + ux * k, gy + uy * k, gs)
            fl.fillStyle = 'rgb(64,150,255)'
            drawGlyphOn(fl, glyph, gx - ux * k, gy - uy * k, gs)
          }
          continue
        }
        ctx.globalAlpha = pres * a
        ctx.fillStyle = rgba(c, 1)
        drawGlyph(glyph, iX[q], iY[q], iS[q])
      }
      if (glass) composite(R, pres)
      if (!soft && !glass) ctx.restore() // clip
      ctx.globalAlpha = pres

      if (glass) {
        // Border: optional and faint; at 0 the glass is defined by its blur and fringes alone
        if (P.border > 0) {
          ctx.lineWidth = P.border
          ctx.strokeStyle = rgba(ink, 0.22)
          ctx.beginPath()
          ctx.arc(0, 0, R - P.border / 2, 0, Math.PI * 2)
          ctx.stroke()
        }
        const inner = R - P.border
        ctx.lineWidth = 1
        // Etched into the glass: ticks pointing in from the edge, a quiet crosshair
        ctx.strokeStyle = rgba(ink, 0.32)
        ctx.beginPath()
        for (let k = 0; k < 4; k++) {
          const t = (k * Math.PI) / 2
          ctx.moveTo(Math.cos(t) * (inner - 3), Math.sin(t) * (inner - 3))
          ctx.lineTo(Math.cos(t) * (inner - 11), Math.sin(t) * (inner - 11))
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
        // A dashed ring just outside the glass, turning with the distance travelled
        ctx.save()
        ctx.rotate(lens.travel / (R + 14))
        ctx.setLineDash([2, 7])
        ctx.strokeStyle = rgba(ink, 0.2)
        ctx.beginPath()
        ctx.arc(0, 0, R + 9, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      } else if (style === 'Plain') {
        ctx.lineWidth = 1
        ctx.strokeStyle = rgba(ink, 0.3)
        ctx.beginPath()
        ctx.arc(0, 0, R, 0, Math.PI * 2)
        ctx.stroke()
      } else if (style === 'Reticle') {
        ctx.lineWidth = 1
        ctx.strokeStyle = rgba(ink, 0.42)
        ctx.beginPath()
        ctx.arc(0, 0, R, 0, Math.PI * 2)
        ctx.stroke()
        // Ticks at the four compass points
        ctx.strokeStyle = rgba(ink, 0.6)
        ctx.beginPath()
        for (let k = 0; k < 4; k++) {
          const t = (k * Math.PI) / 2
          ctx.moveTo(Math.cos(t) * (R + 3), Math.sin(t) * (R + 3))
          ctx.lineTo(Math.cos(t) * (R + 10), Math.sin(t) * (R + 10))
        }
        ctx.stroke()
        // A dashed outer ring that turns with the distance travelled
        ctx.save()
        ctx.rotate(lens.travel / (R + 16))
        ctx.setLineDash([2, 7])
        ctx.strokeStyle = rgba(ink, 0.22)
        ctx.beginPath()
        ctx.arc(0, 0, R + 16, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        // Crosshair with an open centre so the letter under it stays readable
        ctx.strokeStyle = rgba(ink, 0.5)
        ctx.beginPath()
        ctx.moveTo(-10, 0)
        ctx.lineTo(-4, 0)
        ctx.moveTo(4, 0)
        ctx.lineTo(10, 0)
        ctx.moveTo(0, -10)
        ctx.lineTo(0, -4)
        ctx.moveTo(0, 4)
        ctx.lineTo(0, 10)
        ctx.stroke()
      } else if (style === 'Orbit') {
        // The ring is made of the code under its edge, in its own colours, rolling as it moves
        ctx.strokeStyle = rgba(ink, 0.07)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(0, 0, R, 0, Math.PI * 2)
        ctx.stroke()
        const slots = Math.max(24, Math.floor((Math.PI * 2 * R) / (cw * 1.25)))
        const shake = Math.min(0.6, sp * 0.05)
        ctx.font = `${FONT}px ${family}`
        for (let i = 0; i < slots; i++) {
          const t = (i / slots) * Math.PI * 2 + lens.roll
          const ox = Math.cos(t) * R
          const oy = Math.sin(t) * R
          const row = Math.round((cy + oy - PADY - LH / 2) / LH)
          const col = Math.floor((cx + ox - textX) / cw)
          const ch = row >= 0 && row <= visible ? lines[row]?.[col] : undefined
          const solid = !!ch && ch !== ' '
          let glyph = solid ? ch : '·'
          let c: RGB = solid ? pal[code.cls[row][col]] : ink
          let a = solid ? 0.95 : 0.28
          // Moving fast scrambles the ring, slot by slot
          const h = Math.sin(i * 12.9898 + fizz * 78.233) * 43758.5453
          if (h - Math.floor(h) < shake) {
            glyph = SCRAMBLE[(i * 5 + fizz) % SCRAMBLE.length]
            c = flash
            a = 0.8
          }
          ctx.globalAlpha = pres * a
          ctx.fillStyle = rgba(c, 1)
          ctx.fillText(glyph, ox, oy)
        }
      }
      ctx.restore()

      if (style === 'Reticle' || glass) {
        // Readout trails the circle on a softer spring
        const row = Math.round((cy - PADY - LH / 2) / LH)
        const col = Math.floor((cx - textX) / cw)
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
    }

    // A glyph at lens-local (x, y), scaled about its centre
    const drawGlyph = (g: string, x: number, y: number, s: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(s, s)
      ctx.fillText(g, 0, 0)
      ctx.restore()
    }

    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop)
      if (!ready) return
      const dt = ts - last
      last = ts
      // Physics steps stay small (a stalled frame can't fling the lens); reveal time stays real
      const f = Math.min(3, dt / (1000 / 60))
      clock += Math.min(500, dt) * P.speed
      const now = clock
      const reduced = reducedQ.matches
      if (++frame % 30 === 0) readTheme()

      // Lens follows on a spring (slight overshoot), appears where the cursor is
      if (ptr.inside && lens.pres < 0.02) {
        lens.x = ptr.x
        lens.y = ptr.y
        lens.vx = lens.vy = 0
      }
      if (reduced) {
        lens.x = ptr.x
        lens.y = ptr.y
        lens.vx = lens.vy = 0
      } else {
        const k = P.follow
        lens.vx = (lens.vx + (ptr.x - lens.x) * k * f) * Math.pow(0.62, f)
        lens.vy = (lens.vy + (ptr.y - lens.y) * k * f) * Math.pow(0.62, f)
        lens.x += lens.vx * f
        lens.y += lens.vy * f
      }
      // Enter on a quick-start ease; leave a little faster
      const want = ptr.inside ? 1 : 0
      lens.pres += (want - lens.pres) * Math.min(1, (want ? 0.2 : 0.28) * f)
      if (Math.abs(want - lens.pres) < 0.002) lens.pres = want
      lens.mag += (magFor() - lens.mag) * Math.min(1, 0.15 * f)

      const hide = lens.pres > 0.5
      if (hide !== cursorHidden) {
        cursorHidden = hide
        canvas.style.cursor = hide ? 'none' : ''
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.font = `${FONT}px ${family}`
      ctx.textBaseline = 'middle'
      ctx.fillStyle = rgba(ink, 1)

      // The page: only the lines that fit, each drawn as one string (monospace keeps columns exact)
      const lastRow = Math.min(lines.length - 1, Math.floor((H - PADY * 2) / LH) - 1)
      ctx.textAlign = 'left'
      const page = P.outside ? lines : ascii

      // Breathing: every char slowly brightens and dims on its own rhythm. At the dimmest
      // point of a breath it may quietly become a sibling from its own family (: ; .  ~ -
      // * %), then brighten back as the new char, so a swap is never caught happening.
      const base = P.outside ? 0.3 : 0.28
      const still = reduced || P.breathDepth <= 0
      const tSec = now / 1000
      const LV = 7
      const lo = base - P.breathDepth
      const hi = base + P.breathDepth
      const used = new Uint8Array(LV)
      for (let i = 0; i <= lastRow; i++) {
        const line = page[i]
        const y = PADY + i * LH + LH / 2
        if (still) {
          ctx.globalAlpha = base
          ctx.fillText(line, textX, y)
          continue
        }
        // One string per brightness level keeps it to a few draws per row (monospace keeps columns)
        const bufs: string[][] = []
        for (let l = 0; l < LV; l++) bufs.push(new Array(line.length).fill(' '))
        used.fill(0)
        for (let col = 0; col < line.length; col++) {
          const ch = line[col]
          if (ch === ' ') continue
          const k = lineStart[i] + col
          const key = P.breathByToken ? tokenOf[k] % total : k
          const ph = tSec / (P.breathSpeed * periodMul[key]) + phase0[key]
          const breath = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2) // 0 at the dimmest point
          const lvl = Math.min(LV - 1, Math.floor(breath * LV))
          let g = ch
          if (!P.outside && P.change > 0) {
            const cyc = Math.floor(ph) // ticks over exactly at the dimmest point
            const set = glyphFamily(code.cls[i][col])
            if (set && h2(k, cyc) < P.change) g = set[Math.floor(h2(k + 7, cyc) * set.length)]
          }
          bufs[lvl][col] = g
          used[lvl] = 1
        }
        for (let l = 0; l < LV; l++) {
          if (!used[l]) continue
          ctx.globalAlpha = Math.max(0.02, lo + ((hi - lo) * (l + 0.5)) / LV)
          ctx.fillText(bufs[l].join(''), textX, y)
        }
      }
      ctx.globalAlpha = 1

      if (lens.pres > 0.003) drawLens(now, reduced, f)
    }

    let raf = 0
    let inView = true
    const sync = () => {
      const run = inView && !document.hidden
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
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onLeave)
      canvas.removeEventListener('pointerleave', onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, style])
}
