import { DEFAULT_WEATHER, type Weather } from '@/lib/weather'

/*
 * Canvas engine behind <Grass />. The canvas is taller than the field: the
 * extra SKY band above it is where rain and snow fade in before landing.
 * The canvas itself ignores pointer events (so it never blocks the footer);
 * the cursor is tracked on window and mapped into canvas space instead.
 */

export type Theme = 'light' | 'dark'

export const SKY = 120

type Blade = {
  x: number
  height: number
  width: number
  lean: number
  stiffness: number
  flutter: number
  angle: number
  velocity: number
  /** Carries a water droplet when the grass is wet */
  dew: boolean
  /** Snow cover level (0–1) at which this blade gets a cap */
  snowAt: number
}

type Drop = { x: number; y: number; len: number; speed: number; ground: number }
type Flake = { x: number; y: number; r: number; speed: number; phase: number; ground: number }
type Splash = { x: number; y: number; age: number }
type Firefly = { x: number; y: number; vx: number; vy: number; phase: number }

type Palette = {
  layers: string[][]
  shade: string
  rain: string
  flake: string
  cap: string
  sun: string
}

const LAYER_SHARE = [0.4, 0.35, 0.25]
const LAYER_HEIGHT = [0.7, 0.85, 1]
const BLADES_PER_PX = 0.5
const TOUCH_RADIUS = 70
const DAMPING = 7
const MAX_ANGLE = 1.3
const MAX_DPR = 2
const SPLASH_LIFE = 0.3

// [hue, saturation, lightness] per layer, back to front
const BASE_COLORS: Record<Theme, [number, number, number][]> = {
  light: [
    [100, 38, 30],
    [100, 42, 39],
    [98, 45, 48],
  ],
  dark: [
    [104, 28, 15],
    [102, 30, 21],
    [100, 33, 28],
  ],
}
const SHADE_STEPS = [-2, 0, 3]

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const rand = (min: number, max: number) => min + Math.random() * (max - min)

function buildPalette(theme: Theme, weather: Weather): Palette {
  let dh = 0
  let ds = 0
  let dl = 0
  const { condition, isDay } = weather

  if (condition === 'rain' || condition === 'storm') {
    // Wet grass: deeper and a touch more saturated
    dh += 6
    ds += 8
    dl -= 5
  } else if (condition === 'cloudy') {
    ds -= 12
    dl -= 2
  } else if (condition === 'snow') {
    ds -= 18
    dl += 2
  }
  if (!isDay) {
    ds -= 8
    dl -= theme === 'light' ? 8 : 4
  }

  const dark = theme === 'dark'
  return {
    layers: BASE_COLORS[theme].map(([h, s, l]) =>
      SHADE_STEPS.map(
        (step) => `hsl(${h + dh}, ${clamp(s + ds, 5, 90)}%, ${clamp(l + dl + step, 5, 90)}%)`,
      ),
    ),
    shade: dark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(20, 40, 10, 0.28)',
    rain: dark ? '170, 190, 220' : '100, 120, 150',
    flake: dark ? '255, 255, 255' : '150, 165, 185',
    cap: dark ? '#e6ebf0' : '#ffffff',
    sun: dark ? 'rgba(255, 214, 140, 0.08)' : 'rgba(255, 220, 140, 0.22)',
  }
}

function createBlades(width: number, fieldHeight: number): Blade[][] {
  const layers: Blade[][] = LAYER_HEIGHT.map(() => [])
  const count = Math.round(width * BLADES_PER_PX)

  // Two slow sine waves give the field natural clumps of taller/shorter grass
  const p1 = Math.random() * 100
  const p2 = Math.random() * 100
  const clump = (x: number) =>
    0.5 + 0.25 * Math.sin(x * 0.013 + p1) + 0.25 * Math.sin(x * 0.037 + p2)

  for (let i = 0; i < count; i++) {
    const r = Math.random()
    const layer = r < LAYER_SHARE[0] ? 0 : r < LAYER_SHARE[0] + LAYER_SHARE[1] ? 1 : 2
    const x = Math.random() * width
    const h = fieldHeight * LAYER_HEIGHT[layer] * (0.4 + 0.4 * clump(x) + Math.random() * 0.2)
    const lean = (Math.random() - 0.5) * 0.35

    layers[layer].push({
      x,
      height: Math.min(h, fieldHeight * 0.97),
      width: 2 + Math.random() * 2 + layer * 0.6,
      lean,
      stiffness: 45 + Math.random() * 40,
      flutter: Math.random() * Math.PI * 2,
      angle: lean,
      velocity: 0,
      dew: Math.random() < 0.14,
      snowAt: Math.random(),
    })
  }
  return layers
}

/** Control point and tip of a blade bent by `angle`; the base always stays upright */
function geometry(b: Blade, base: number) {
  const mid = b.angle * 0.45
  return {
    cx: b.x + Math.sin(mid) * b.height * 0.55,
    cy: base - Math.cos(mid) * b.height * 0.55,
    tx: b.x + Math.sin(b.angle) * b.height,
    ty: base - Math.cos(b.angle) * b.height,
  }
}

function traceBlade(ctx: CanvasRenderingContext2D, b: Blade, base: number) {
  const { cx, cy, tx, ty } = geometry(b, base)
  const half = b.width / 2
  ctx.moveTo(b.x - half, base)
  ctx.quadraticCurveTo(cx - half * 0.6, cy, tx, ty)
  ctx.quadraticCurveTo(cx + half * 0.6, cy, b.x + half, base)
  ctx.closePath()
}

export function createGrassScene(
  canvas: HTMLCanvasElement,
  { onTouch }: { onTouch: () => void },
) {
  const ctx = canvas.getContext('2d')!
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let theme: Theme = 'light'
  let weather: Weather = DEFAULT_WEATHER
  let palette = buildPalette(theme, weather)

  let width = 0
  let height = 0
  let fieldHeight = 0
  let layers: Blade[][] = []
  let drops: Drop[] = []
  let flakes: Flake[] = []
  let splashes: Splash[] = []
  let fireflies: Firefly[] = []

  let frameId = 0
  let visible = false
  let last = 0
  let time = 0
  let flash = 0
  let nextFlash = rand(2, 5)
  let snowCover = 0
  let touched = false

  const pointer = { active: false, x: 0, y: 0, vx: 0, lastX: 0, lastT: 0 }

  const windFactor = () => clamp(0.5 + weather.windSpeed / 20, 0.5, 2.5)
  const isWet = () => weather.condition === 'rain' || weather.condition === 'storm'
  const groundY = () => height - Math.random() * fieldHeight * 0.8

  function spawnDrop(anywhere: boolean): Drop {
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -Math.random() * 40,
      len: rand(8, 18),
      speed: rand(650, 950),
      ground: groundY(),
    }
  }

  function spawnFlake(anywhere: boolean): Flake {
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -Math.random() * 20,
      r: rand(1, 2.6),
      speed: rand(28, 60),
      phase: Math.random() * Math.PI * 2,
      ground: groundY(),
    }
  }

  function syncParticles() {
    const { condition, intensity, isDay } = weather
    const dropCount = isWet()
      ? Math.round(width * 0.06 * intensity * (condition === 'storm' ? 1.6 : 1))
      : 0
    const flakeCount = condition === 'snow' ? Math.round(width * 0.05 * intensity) : 0
    const fireflyCount = isDay ? 0 : Math.round(10 + width / 100)

    drops = Array.from({ length: dropCount }, () => spawnDrop(true))
    flakes = Array.from({ length: flakeCount }, () => spawnFlake(true))
    splashes = []
    fireflies = Array.from({ length: fireflyCount }, () => ({
      x: Math.random() * width,
      y: height - fieldHeight * rand(0.2, 0.9),
      vx: rand(-10, 10),
      vy: rand(-6, 6),
      phase: Math.random() * Math.PI * 2,
    }))
    snowCover = condition === 'snow' && reducedMotion ? 1 : 0
  }

  function step(dt: number) {
    time += dt
    const wind = windFactor()
    const base = height + 2
    pointer.vx *= Math.exp(-8 * dt)

    for (const blades of layers) {
      for (const b of blades) {
        // A gust rolling left to right plus per-blade flutter, both scaled by real wind
        const sway =
          Math.sin(b.x * 0.004 - time * (0.9 + 0.25 * wind)) * 0.08 * wind +
          Math.sin(time * 2.3 + b.flutter) * 0.025 * (0.6 + wind * 0.4)
        let target = b.lean + sway

        if (pointer.active && pointer.y > base - b.height - 12) {
          const dx = b.x - pointer.x
          const dist = Math.abs(dx)
          if (dist < TOUCH_RADIUS) {
            const f = (1 - dist / TOUCH_RADIUS) ** 2
            const push = Math.sign(dx || 1) * 0.9
            const drag = clamp(pointer.vx * 0.0006, -0.7, 0.7)
            target += (push + drag) * f
          }
        }

        const accel = b.stiffness * (target - b.angle) - DAMPING * b.velocity
        b.velocity += accel * dt
        b.angle = clamp(b.angle + b.velocity * dt, -MAX_ANGLE, MAX_ANGLE)
      }
    }

    // Rain falls on a slant with the wind and splashes where it lands
    const drift = wind * 70
    for (const d of drops) {
      d.y += d.speed * dt
      d.x += drift * dt
      if (d.y >= d.ground) {
        if (splashes.length < 80) splashes.push({ x: d.x, y: d.ground, age: 0 })
        Object.assign(d, spawnDrop(false))
      } else if (d.x > width + 20) {
        d.x -= width + 40
      }
    }
    for (const s of splashes) s.age += dt
    splashes = splashes.filter((s) => s.age < SPLASH_LIFE)

    for (const f of flakes) {
      f.y += f.speed * dt
      f.x += (Math.sin(time * 1.5 + f.phase) * 12 + wind * 12) * dt
      if (f.y >= f.ground) Object.assign(f, spawnFlake(false))
      else if (f.x > width + 10) f.x -= width + 20
    }
    snowCover =
      weather.condition === 'snow'
        ? Math.min(1, snowCover + dt / 25)
        : Math.max(0, snowCover - dt / 8)

    // Keep them among the blades, where the dark green makes them glow
    const top = height - fieldHeight * 0.95
    const bottom = height - fieldHeight * 0.15
    for (const f of fireflies) {
      f.vx = clamp(f.vx + rand(-40, 40) * dt, -22, 22)
      f.vy = clamp(f.vy + rand(-40, 40) * dt, -14, 14)
      f.x += f.vx * dt
      f.y += f.vy * dt
      if (f.x < 0 || f.x > width) f.vx *= -1
      if (f.y < top || f.y > bottom) f.vy *= -1
      f.x = clamp(f.x, 0, width)
      f.y = clamp(f.y, top, bottom)
    }

    if (weather.condition === 'storm' && time > nextFlash) {
      flash = 1
      // Sometimes a second flicker follows right after
      nextFlash = time + (Math.random() < 0.35 ? 0.15 : rand(5, 14))
    }
    flash *= Math.exp(-6 * dt)
  }

  function draw() {
    const base = height + 2
    const fieldTop = base - fieldHeight
    ctx.clearRect(0, 0, width, height)

    layers.forEach((blades, layer) => {
      const shades = palette.layers[layer]
      // One path per shade keeps fill calls to a handful per frame
      for (let s = 0; s < shades.length; s++) {
        ctx.beginPath()
        for (let i = s; i < blades.length; i += shades.length) {
          traceBlade(ctx, blades[i], base)
        }
        ctx.fillStyle = shades[s]
        ctx.fill()
      }

      if (isWet()) {
        ctx.beginPath()
        for (const b of blades) {
          if (!b.dew) continue
          const { tx, ty } = geometry(b, base)
          ctx.moveTo(tx + 1.4, ty + 1.5)
          ctx.arc(tx, ty + 1.5, 1.4, 0, Math.PI * 2)
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fill()
      }

      if (snowCover > 0) {
        ctx.beginPath()
        for (const b of blades) {
          if (b.snowAt > snowCover * 0.75) continue
          const { tx, ty } = geometry(b, base)
          const r = b.width * 0.9
          const cy = ty + r * 0.4
          ctx.moveTo(tx + r * Math.cos(b.angle), cy + r * Math.sin(b.angle))
          ctx.ellipse(tx, cy, r, r * 0.75, b.angle, 0, Math.PI * 2)
        }
        ctx.fillStyle = palette.cap
        ctx.fill()
      }
    })

    // Lighting, painted only onto the grass itself
    ctx.globalCompositeOperation = 'source-atop'

    const roots = ctx.createLinearGradient(0, base - fieldHeight * 0.65, 0, base)
    roots.addColorStop(0, 'rgba(0, 0, 0, 0)')
    roots.addColorStop(1, palette.shade)
    ctx.fillStyle = roots
    ctx.fillRect(0, fieldTop, width, fieldHeight)

    if (weather.condition === 'clear' && weather.isDay) {
      const sun = ctx.createLinearGradient(0, fieldTop, 0, base - fieldHeight * 0.4)
      sun.addColorStop(0, palette.sun)
      sun.addColorStop(1, 'rgba(255, 220, 140, 0)')
      ctx.fillStyle = sun
      ctx.fillRect(0, fieldTop, width, fieldHeight)
    }

    if (weather.condition === 'cloudy') {
      // A soft cloud shadow drifting across the field
      const span = width + 700
      const cx = ((time * 22) % span) - 350
      const shadow = ctx.createRadialGradient(cx, base, 0, cx, base, 340)
      shadow.addColorStop(0, 'rgba(0, 0, 0, 0.14)')
      shadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = shadow
      ctx.fillRect(0, fieldTop, width, fieldHeight)
    }

    if (flash > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.35})`
      ctx.fillRect(0, fieldTop, width, fieldHeight)
    }

    ctx.globalCompositeOperation = 'source-over'

    // Particles fade in through the sky band so they never start with a hard edge
    if (drops.length) {
      const fade = ctx.createLinearGradient(0, 0, 0, SKY)
      fade.addColorStop(0, `rgba(${palette.rain}, 0)`)
      fade.addColorStop(1, `rgba(${palette.rain}, ${0.35 + flash * 0.3})`)
      ctx.strokeStyle = fade
      ctx.lineWidth = 1
      ctx.beginPath()
      const slant = (windFactor() * 70) / 800
      for (const d of drops) {
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - slant * d.len, d.y - d.len)
      }
      ctx.stroke()

      for (const s of splashes) {
        const t = s.age / SPLASH_LIFE
        const r = 1 + t * 5
        ctx.strokeStyle = `rgba(${palette.rain}, ${(1 - t) * 0.5})`
        ctx.beginPath()
        ctx.ellipse(s.x, s.y, r, r * 0.35, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    if (flakes.length) {
      const fade = ctx.createLinearGradient(0, 0, 0, SKY * 0.6)
      fade.addColorStop(0, `rgba(${palette.flake}, 0)`)
      fade.addColorStop(1, `rgba(${palette.flake}, 0.9)`)
      ctx.fillStyle = fade
      ctx.beginPath()
      for (const f of flakes) {
        ctx.moveTo(f.x + f.r, f.y)
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
      }
      ctx.fill()
    }

    for (const f of fireflies) {
      // Pulse between a faint ember and full glow, never switching off entirely
      const glow = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * 1.7 + f.phase)) ** 2
      const halo = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 12)
      halo.addColorStop(0, `rgba(214, 255, 90, ${glow * 0.45})`)
      halo.addColorStop(1, 'rgba(214, 255, 90, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(f.x, f.y, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(245, 255, 190, ${glow})`
      ctx.beginPath()
      ctx.arc(f.x, f.y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function loop(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60
    last = now
    step(dt)
    draw()
    frameId = requestAnimationFrame(loop)
  }

  function start() {
    if (reducedMotion || frameId || !visible) return
    last = 0
    frameId = requestAnimationFrame(loop)
  }

  function stop() {
    cancelAnimationFrame(frameId)
    frameId = 0
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === width && rect.height === height) return
    width = rect.width
    height = rect.height
    fieldHeight = height - SKY
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    layers = createBlades(width, fieldHeight)
    syncParticles()
    draw()
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const inField = x >= 0 && x <= rect.width && y >= SKY - 16 && y <= rect.height
    if (!inField) {
      pointer.active = false
      return
    }

    const dt = (e.timeStamp - pointer.lastT) / 1000
    if (pointer.active && dt > 0 && dt < 0.1) {
      pointer.vx = pointer.vx * 0.6 + ((x - pointer.lastX) / dt) * 0.4
    }
    pointer.active = true
    pointer.x = x
    pointer.y = y
    pointer.lastX = x
    pointer.lastT = e.timeStamp

    if (!touched) {
      touched = true
      onTouch()
    }
  }

  function onPointerEnd(e: PointerEvent) {
    if (e.pointerType !== 'mouse') pointer.active = false
  }

  function onMouseLeaveWindow() {
    pointer.active = false
  }

  resize()

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) start()
    else stop()
  })
  intersectionObserver.observe(canvas)

  if (!reducedMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerEnd)
    window.addEventListener('pointercancel', onPointerEnd)
    document.documentElement.addEventListener('mouseleave', onMouseLeaveWindow)
  }

  return {
    setTheme(next: Theme) {
      theme = next
      palette = buildPalette(theme, weather)
      if (!frameId) draw()
    },
    setWeather(next: Weather) {
      const particlesChanged =
        next.condition !== weather.condition ||
        next.isDay !== weather.isDay ||
        next.intensity !== weather.intensity
      weather = next
      palette = buildPalette(theme, weather)
      if (particlesChanged) syncParticles()
      if (!frameId) draw()
    },
    destroy() {
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
      document.documentElement.removeEventListener('mouseleave', onMouseLeaveWindow)
    },
  }
}

export type GrassScene = ReturnType<typeof createGrassScene>
