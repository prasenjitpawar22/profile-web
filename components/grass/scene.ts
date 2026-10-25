import { DEFAULT_WEATHER, type Weather } from '@/lib/weather'
import {
  createButterflies,
  drawButterflies,
  flying,
  stepButterflies,
  type Butterflies,
  type Point,
  type Threat,
} from './butterflies'
import {
  catHead,
  createCat,
  drawCat,
  drawCatEffects,
  settleCat,
  stepCat,
  type Cat,
  type CatMood,
} from './cat'
import { daylightAt, localMinutes, type Daylight } from './daylight'
import { blend, blit, hex, mix, pack, palette, plot, type Palette, type RGB, type Surface } from './pixel'
import { BUD, FLOWER } from './sprites'

/*
 * Pixel-art engine behind <Grass />. Everything is drawn into a small buffer
 * of art pixels, put on a canvas of the same size, and scaled up by CSS with
 * `image-rendering: pixelated`. Each art pixel is a whole number of device
 * pixels, so nothing ever smears. The canvas is taller than the field: rain and
 * snow fall in through the empty band on top. It ignores pointer events (so it
 * never blocks the footer); the cursor is tracked on window instead.
 */

export type Theme = 'light' | 'dark'

/** CSS px per art pixel (rounded to whole device pixels) */
const PIXEL = 3
/** CSS px of empty band above the grass, where rain and snow fall in */
export const SKY = 120

/** A tuft blade growing out of the top edge of its band */
type Blade = {
  x: number
  /** y of the band edge it grows from */
  root: number
  height: number
  lean: number
  stiffness: number
  flutter: number
  angle: number
  velocity: number
  /** which of two colour variants, so neighbouring blades differ */
  variant: number
  /** Carries a water droplet when the grass is wet */
  dew: boolean
  /** Snow cover level (0–1) at which this blade gets a cap */
  snowAt: number
  /** index into the flower palettes, or -1 for plain grass */
  flower: number
}

type Drop = { x: number; y: number; len: number; speed: number; ground: number }
type Flake = { x: number; y: number; big: boolean; speed: number; phase: number; ground: number }
type Splash = { x: number; y: number; age: number }
type Firefly = { x: number; y: number; vx: number; vy: number; phase: number }

type Colors = {
  /** [layer][variant][root, mid, tip, highlight] */
  grass: number[][][]
  dew: number
  cap: number
  cat: Palette
  butterflies: Palette[]
  flowers: Palette[]
  rain: RGB
  flake: number
}

/*
 * The field is three solid bands of grass (back, middle, front), each with a
 * rolling top edge, as fractions of the field height. Tufts sway along the
 * edges; the cat sits between the middle and front bands.
 */
const BANDS = [
  { height: 0.42, roll: 0.1, wave: 0.035, tufts: 0.65, tuft: [2, 9] },
  { height: 0.2, roll: 0.06, wave: 0.05, tufts: 0.55, tuft: [2, 7] },
  { height: 0.06, roll: 0.025, wave: 0.08, tufts: 0.5, tuft: [1, 4] },
] as const

/** The cat is switched off for now; flip this to bring it back */
const SHOW_CAT = false

const TOUCH_RADIUS = 23
const DAMPING = 7
const MAX_ANGLE = 1.3
const SPLASH_LIFE = 0.25
/** How often the light is recomputed from the clock, in seconds */
const RELIGHT_EVERY = 5

// Grass ramps per layer (back, middle, front): root, mid, tip, highlight
const GRASS: Record<Theme, string[][]> = {
  light: [
    ['#2c5a34', '#356b3e', '#417d48', '#4c8b50'],
    ['#2f6a35', '#3e853f', '#52a049', '#68b558'],
    ['#3a7d3a', '#55a447', '#76bf55', '#a8dd70'],
  ],
  dark: [
    ['#142c1d', '#1a3824', '#22452b', '#2a5232'],
    ['#183520', '#21492a', '#2c5c33', '#386c3c'],
    ['#1e4826', '#2a6131', '#3a7b3f', '#57a052'],
  ],
}

// A black cat with amber eyes (keys in cat-art.ts), plus the leaf it hides
// under in the rain. Five fur tones give it volume under the top-left light.
const CAT: Record<string, string> = {
  d: '#221e2a',
  s: '#2c2836',
  w: '#383344',
  l: '#4a4459',
  c: '#57506a',
  p: '#e98aa3',
  n: '#f08aa6',
  m: '#16131c',
  v: '#9a93ad',
  k: '#16131c',
  i: '#f6c945',
  h: '#fff6d6',
  x: '#8d86a3',
  q: '#2f6a2c',
  g: '#74c255',
  u: '#a8de78',
}

// On a dark page a near-black outline vanishes, so it becomes a soft violet rim
const CAT_OUTLINE: Record<Theme, string> = { light: '#16131c', dark: '#4d4660' }

// Brimstone yellow, cabbage white, orange tip, common blue: wing and wing edge
const WINGS: [string, string][] = [
  ['#ffe680', '#e0a92c'],
  ['#fffaf0', '#c4bcae'],
  ['#ffb066', '#dc6b28'],
  ['#a6d3ff', '#5b8fd6'],
]

// Daisy, pink clover, forget-me-not, buttercup: petal and centre
const PETALS: [string, string][] = [
  ['#ffffff', '#ffd84a'],
  ['#ffb3cf', '#ffe680'],
  ['#a9c8ff', '#fff3a0'],
  ['#ffe066', '#f29a2e'],
]

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
/** Stable 0–1 noise per pixel, for texture that doesn't crawl between frames */
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}
const desaturate = (c: RGB, k: number): RGB => {
  const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
  return mix(c, [l, l, l], k)
}

export function createGrassScene(
  canvas: HTMLCanvasElement,
  { onTouch }: { onTouch: () => void },
) {
  const ctx = canvas.getContext('2d')!
  const box = canvas.parentElement!
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let theme: Theme = 'light'
  let weather: Weather = DEFAULT_WEATHER
  let light: Daylight = daylightAt(localMinutes())
  let colors: Colors

  // Sizes are in art pixels
  let w = 0
  let h = 0
  let field = 0
  let image: ImageData
  let surface: Surface
  /** top edge (y) of each band, per column */
  let tops: Int16Array[] = []
  let layers: Blade[][] = [[], [], []]
  let drops: Drop[] = []
  let flakes: Flake[] = []
  let splashes: Splash[] = []
  let fireflies: Firefly[] = []
  let butterflies: Butterflies = []
  let cat: Cat = createCat(0)
  let mood: CatMood = 'hunt'
  let lifeKey = ''

  let frameId = 0
  let visible = false
  let last = 0
  let time = 0
  let relightIn = 0
  let flash = 0
  let nextFlash = rand(2, 5)
  let snowCover = 0
  let petUntil = 0
  let touched = false

  const pointer = { active: false, near: false, x: 0, y: 0, vx: 0, lastX: 0, lastT: 0, idle: 99 }

  const base = () => h - 1
  const fieldTop = () => h - field
  // The cat sits just behind the front band, its paws on the edge
  const catGround = () => base() - 3
  const windFactor = () => clamp(0.5 + weather.windSpeed / 20, 0.5, 2.5)
  const isWet = () => weather.condition === 'rain' || weather.condition === 'storm'
  /** Where something falling at x lands: the top of one of the bands */
  const groundY = (x: number) => {
    const col = clamp(Math.floor(x), 0, w - 1)
    return tops[Math.floor(Math.random() * tops.length)]?.[col] ?? base()
  }
  const clock = () => weather.clock ?? localMinutes()

  // ── Colour ───────────────────────────────────────────────────────────────

  /** Weather and time of day, applied to any colour in the meadow */
  function grade(c: RGB, strength = 1): RGB {
    const { condition } = weather
    let out = c
    if (isWet()) out = mix(out, [24, 70, 52], 0.18 * strength)
    if (condition === 'cloudy') out = desaturate(out, 0.3 * strength)
    if (condition === 'snow') out = mix(desaturate(out, 0.35), [205, 215, 225], 0.18 * strength)
    out = mix(out, [255, 196, 110], 0.16 * light.golden * strength)
    out = mix(out, [196, 120, 160], 0.14 * light.twilight * strength)
    const night: RGB = theme === 'dark' ? [10, 18, 40] : [26, 40, 74]
    return mix(out, night, (theme === 'dark' ? 0.35 : 0.45) * light.night * strength)
  }

  function buildColors(): Colors {
    const dark = theme === 'dark'
    const grass = GRASS[theme].map((ramp) => {
      const colors = ramp.map((c, i) => {
        const graded = grade(hex(c))
        // Golden hour catches the tips first
        return i >= 2 ? mix(graded, [255, 214, 120], 0.3 * light.golden) : graded
      })
      // the second variant is a touch darker, so neighbouring blades read apart
      return [colors.map((c) => pack(c)), colors.map((c) => pack(mix(c, [0, 0, 0], 0.08)))]
    })

    const catColors = Object.fromEntries(
      Object.entries(CAT).map(([k, c]) => [k, grade(hex(c), 0.3)]),
    ) as Record<string, RGB>

    return {
      grass,
      dew: pack(hex('#e6f4ff')),
      cap: pack(hex(dark ? '#e6ecf4' : '#fbfdff')),
      cat: palette({ ...catColors, o: hex(CAT_OUTLINE[theme]), z: hex(dark ? '#c3d0ea' : '#7a8aa8') }),
      butterflies: WINGS.map(([b, e]) =>
        palette({ b: grade(hex(b), 0.3), e: grade(hex(e), 0.3), o: hex('#3a2a2a') }),
      ),
      flowers: PETALS.map(([f, y]) => palette({ f: grade(hex(f), 0.4), y: grade(hex(y), 0.4) })),
      rain: hex(dark ? '#a0b6d8' : '#7f98bd'),
      flake: pack(hex(dark ? '#ffffff' : '#a7b6cc')),
    }
  }

  function relight() {
    light = daylightAt(clock(), weather.sunrise, weather.sunset)
    colors = buildColors()

    const { condition, intensity } = weather
    mood =
      light.night > 0.5
        ? 'sleep'
        : isWet()
          ? 'shelter'
          : condition === 'snow'
            ? 'snow'
            : condition === 'cloudy'
              ? 'watch'
              : 'hunt'

    const day = light.elevation > 0.05
    const night = light.night > 0.5
    const key = `${day}|${night}|${condition}|${intensity}|${w}`
    if (key !== lifeKey) {
      lifeKey = key
      syncLife(day, night)
    }
  }

  // ── Population ───────────────────────────────────────────────────────────

  function createField() {
    // Each band's edge rolls gently, with a smaller ripple on top
    tops = BANDS.map((band) => {
      const p = Math.random() * 100
      return Int16Array.from({ length: w }, (_, x) => {
        const roll = 0.6 * Math.sin(x * band.wave + p) + 0.4 * Math.sin(x * band.wave * 2.7 + p * 2)
        return Math.round(base() - field * (band.height + band.roll * roll))
      })
    })

    const blade = (x: number, layer: number, height: number, flower = -1): Blade => {
      // Tufts fan out: neighbours lean opposite ways
      const lean = (Math.random() - 0.5) * 0.9
      return {
        x,
        root: tops[layer][x],
        height: Math.max(1, Math.round(height)),
        lean,
        stiffness: 45 + Math.random() * 40,
        flutter: Math.random() * Math.PI * 2,
        angle: lean,
        velocity: 0,
        variant: Math.random() < 0.5 ? 0 : 1,
        dew: Math.random() < 0.14,
        snowAt: Math.random(),
        flower,
      }
    }

    layers = BANDS.map((band, layer) => {
      const blades: Blade[] = []
      for (let x = 0; x < w; x++) {
        if (Math.random() < band.tufts) blades.push(blade(x, layer, rand(band.tuft[0], band.tuft[1])))
      }
      return blades
    })

    const flowerCount = Math.round(w / 22)
    for (let i = 0; i < flowerCount; i++) {
      const x = Math.round(rand(4, w - 4))
      layers[1].push(blade(x, 1, rand(4, 9), i % PETALS.length))
    }
  }

  function spawnDrop(anywhere: boolean): Drop {
    const x = Math.random() * w
    return {
      x,
      y: anywhere ? Math.random() * h : -Math.random() * 12,
      len: Math.round(rand(3, 5)),
      speed: rand(220, 320),
      ground: groundY(x),
    }
  }

  function spawnFlake(anywhere: boolean): Flake {
    const x = Math.random() * w
    return {
      x,
      y: anywhere ? Math.random() * h : -Math.random() * 6,
      big: Math.random() < 0.25,
      speed: rand(9, 20),
      phase: Math.random() * Math.PI * 2,
      ground: groundY(x),
    }
  }

  /** What falls from the sky */
  function syncWeather() {
    const { condition, intensity } = weather
    const dropCount = isWet() ? Math.round(w * 0.18 * intensity * (condition === 'storm' ? 1.6 : 1)) : 0
    const flakeCount = condition === 'snow' ? Math.round(w * 0.15 * intensity) : 0
    drops = Array.from({ length: dropCount }, () => spawnDrop(true))
    flakes = Array.from({ length: flakeCount }, () => spawnFlake(true))
    splashes = []
    snowCover = condition === 'snow' && reducedMotion ? 1 : 0
  }

  /** Who's out in the meadow, which depends on the hour as well as the weather */
  function syncLife(day: boolean, night: boolean) {
    const calm = weather.condition === 'clear' || weather.condition === 'cloudy'
    const butterflyCount =
      day && calm ? Math.round(clamp(w / 100, 2, 6) * (weather.condition === 'cloudy' ? 0.5 : 1)) : 0
    const fireflyCount = night && calm ? Math.round(8 + w / 35) : 0

    butterflies = createButterflies(butterflyCount, butterflyBounds())
    fireflies = Array.from({ length: fireflyCount }, () => ({
      x: Math.random() * w,
      y: base() - field * rand(0.2, 0.75),
      vx: rand(-3, 3),
      vy: rand(-2, 2),
      phase: Math.random() * Math.PI * 2,
    }))
    settleCat(cat, mood)
  }

  function butterflyBounds() {
    return { width: w, top: base() - field * 0.62 - 6, bottom: base() - field * 0.22 }
  }

  /** Where a blade's tip is right now, given how far it's bent */
  function tipOf(b: Blade) {
    const rows = Math.max(1, Math.round(b.height * (1 - 0.18 * Math.min(1, b.angle * b.angle))))
    return { x: b.x + Math.round(Math.sin(b.angle) * b.height * 0.9), y: b.root - rows, rows }
  }

  function pickPerch() {
    const candidates = light.night < 0.5 ? layers[1].filter((b) => b.flower >= 0) : []
    const b = candidates[Math.floor(Math.random() * candidates.length)]
    if (!b) return null
    return (): Point => {
      const tip = tipOf(b)
      return { x: tip.x, y: tip.y - 1 }
    }
  }

  // ── Simulation ───────────────────────────────────────────────────────────

  function step(dt: number) {
    time += dt
    relightIn -= dt
    if (relightIn <= 0) {
      relightIn = RELIGHT_EVERY
      relight()
    }

    const wind = windFactor()
    const b0 = base()
    pointer.vx *= Math.exp(-8 * dt)
    pointer.idle += dt

    for (const blades of layers) {
      for (const b of blades) {
        // A gust rolling left to right plus per-blade flutter, both scaled by real wind
        const sway =
          Math.sin(b.x * 0.012 - time * (0.9 + 0.25 * wind)) * 0.08 * wind +
          Math.sin(time * 2.3 + b.flutter) * 0.025 * (0.6 + wind * 0.4)
        let target = b.lean + sway

        if (pointer.active && pointer.y > b.root - b.height - 4) {
          const dx = b.x - pointer.x
          const dist = Math.abs(dx)
          if (dist < TOUCH_RADIUS) {
            const f = (1 - dist / TOUCH_RADIUS) ** 2
            const push = Math.sign(dx || 1) * 0.9
            const drag = clamp(pointer.vx * 0.0018, -0.7, 0.7)
            target += (push + drag) * f
          }
        }

        const accel = b.stiffness * (target - b.angle) - DAMPING * b.velocity
        b.velocity += accel * dt
        b.angle = clamp(b.angle + b.velocity * dt, -MAX_ANGLE, MAX_ANGLE)
      }
    }

    const threats: Threat[] = []
    if (pointer.near) threats.push({ x: pointer.x, y: pointer.y, r: 27 })

    if (SHOW_CAT) {
      // Resting the cursor on the cat pets it; moving it around is a toy to chase
      const ground = catGround()
      const head = catHead(cat, ground)
      if (pointer.near && Math.abs(pointer.x - head.x) < 10 && Math.abs(pointer.y - head.y) < 8) {
        petUntil = time + 0.35
      }
      const petting = time < petUntil
      const prey: Point[] = []
      if (!petting && pointer.near && pointer.idle < 1 && pointer.y > fieldTop() - 10) {
        prey.push({ x: pointer.x, y: pointer.y })
      }
      prey.push(...flying(butterflies).sort((a, b) => Math.abs(a.x - cat.x) - Math.abs(b.x - cat.x)))
      stepCat(cat, dt, { width: w, mood, ground, prey, petting })

      if (cat.state === 'pounce') threats.push({ ...catHead(cat, ground), r: 40 })
      else if (cat.state === 'stalk') threats.push({ ...catHead(cat, ground), r: 16 })
    }
    stepButterflies(butterflies, dt, { ...butterflyBounds(), threats, pickPerch })

    // Rain falls on a slant with the wind and splashes where it lands
    const drift = wind * 23
    for (const d of drops) {
      d.y += d.speed * dt
      d.x += drift * dt
      if (d.y >= d.ground) {
        if (splashes.length < 60) splashes.push({ x: Math.round(d.x), y: Math.round(d.ground), age: 0 })
        Object.assign(d, spawnDrop(false))
      } else if (d.x > w + 6) {
        d.x -= w + 12
      }
    }
    for (const s of splashes) s.age += dt
    splashes = splashes.filter((s) => s.age < SPLASH_LIFE)

    for (const f of flakes) {
      f.y += f.speed * dt
      f.x += (Math.sin(time * 1.5 + f.phase) * 4 + wind * 4) * dt
      if (f.y >= f.ground) Object.assign(f, spawnFlake(false))
      else if (f.x > w + 3) f.x -= w + 6
    }
    snowCover =
      weather.condition === 'snow' ? Math.min(1, snowCover + dt / 25) : Math.max(0, snowCover - dt / 8)

    // Keep them low over the grass, where the dark green makes them glow
    const top = base() - field * 0.75
    const bottom = base() - field * 0.2
    for (const f of fireflies) {
      f.vx = clamp(f.vx + rand(-13, 13) * dt, -7, 7)
      f.vy = clamp(f.vy + rand(-13, 13) * dt, -5, 5)
      f.x += f.vx * dt
      f.y += f.vy * dt
      if (f.x < 0 || f.x > w) f.vx *= -1
      if (f.y < top || f.y > bottom) f.vy *= -1
      f.x = clamp(f.x, 0, w)
      f.y = clamp(f.y, top, bottom)
    }

    if (weather.condition === 'storm' && time > nextFlash) {
      flash = 1
      // Sometimes a second flicker follows right after
      nextFlash = time + (Math.random() < 0.35 ? 0.15 : rand(5, 14))
    }
    flash *= Math.exp(-6 * dt)
  }

  // ── Drawing ──────────────────────────────────────────────────────────────

  /** A solid band: lit rim, a dithered step into shadow, and scattered strands */
  function drawBand(layer: number) {
    const [root, mid, rim] = colors.grass[layer][0]
    const px = surface.px
    const edge = tops[layer]
    const wet = isWet()
    for (let x = 0; x < w; x++) {
      for (let y = Math.max(0, edge[x]); y < h; y++) {
        const d = y - edge[x]
        let c = d === 0 ? rim : d < 3 ? mid : d === 3 ? ((x + y) % 2 ? mid : root) : root
        if (d > 1 && hash(x, (y >> 1) + layer * 31) < 0.08) c = d < 3 ? rim : mid
        if (d === 0 && wet && hash(x, layer + 17) < 0.06) c = colors.dew
        if (snowCover > 0) {
          if (d === 0 && hash(x, layer + 3) < snowCover) c = colors.cap
          if (d === 1 && hash(x, layer + 9) < snowCover * 0.6) c = colors.cap
        }
        px[y * w + x] = c
      }
    }
  }

  function drawTufts(layer: number) {
    const wet = isWet()
    const open = light.night < 0.5
    for (const b of layers[layer]) {
      const ramp = colors.grass[layer][b.variant]
      const { rows } = tipOf(b)
      const bend = Math.sin(b.angle) * b.height * 0.9
      let tx = b.x
      let ty = b.root
      for (let i = 0; i < rows; i++) {
        const t = (i + 1) / rows
        tx = b.x + Math.round(bend * t * t)
        ty = b.root - 1 - i
        plot(surface, tx, ty, i === rows - 1 ? ramp[3] : ramp[2])
      }

      if (b.flower >= 0) {
        // Flowers close up for the night
        if (open) blit(surface, FLOWER, tx - 1, ty - 1, colors.flowers[b.flower])
        else blit(surface, BUD, tx, ty, colors.flowers[b.flower])
      } else if (snowCover > 0 && b.snowAt < snowCover * 0.8) {
        plot(surface, tx, ty, colors.cap)
        if (b.snowAt < snowCover * 0.4) plot(surface, tx, ty - 1, colors.cap)
      } else if (wet && b.dew) {
        plot(surface, tx, ty, colors.dew)
      }
    }
  }

  function draw() {
    surface.px.fill(0)
    drawBand(0)
    drawTufts(0)
    drawBand(1)
    drawTufts(1)
    if (SHOW_CAT) drawCat(surface, cat, catGround(), time, colors.cat)
    drawBand(2)
    drawTufts(2)
    drawButterflies(surface, butterflies, colors.butterflies)

    for (const f of fireflies) {
      // Pulse between a faint ember and full glow, never switching off entirely
      const glow = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * 1.7 + f.phase)) ** 2
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        blend(surface, f.x + dx, f.y + dy, [190, 240, 90], glow * 0.45)
      }
      blend(surface, f.x, f.y, [245, 255, 190], 0.35 + glow * 0.65)
    }

    if (SHOW_CAT) drawCatEffects(surface, cat, catGround(), time, colors.cat)

    if (drops.length) {
      // Fade in through the empty band on top, so drops never pop into view
      const fadeTo = (h - field) * 0.7
      const slant = (windFactor() * 23) / 270
      for (const d of drops) {
        const a = clamp(d.y / fadeTo, 0, 1) * (0.55 + flash * 0.3)
        for (let k = 0; k < d.len; k++) blend(surface, d.x - slant * k, d.y - k, colors.rain, a)
      }
      for (const s of splashes) {
        const spread = s.age < SPLASH_LIFE / 2 ? 1 : 2
        blend(surface, s.x - spread, s.y - spread + 1, colors.rain, 0.7)
        blend(surface, s.x + spread, s.y - spread + 1, colors.rain, 0.7)
      }
    }

    for (const f of flakes) {
      plot(surface, f.x, f.y, colors.flake)
      if (f.big) {
        plot(surface, f.x - 1, f.y, colors.flake)
        plot(surface, f.x + 1, f.y, colors.flake)
        plot(surface, f.x, f.y - 1, colors.flake)
        plot(surface, f.x, f.y + 1, colors.flake)
      }
    }

    if (flash > 0.01) {
      // Lightning lights up everything that's drawn
      const k = flash * 0.35
      const px = surface.px
      for (let i = 0; i < px.length; i++) {
        const v = px[i]
        if (!(v >>> 24)) continue
        const r = (v & 255) + (255 - (v & 255)) * k
        const g = ((v >>> 8) & 255) + (255 - ((v >>> 8) & 255)) * k
        const b = ((v >>> 16) & 255) + (255 - ((v >>> 16) & 255)) * k
        px[i] = pack([r, g, b], v >>> 24)
      }
    }

    ctx.putImageData(image, 0, 0)
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

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

  let cssPerPixel = 0

  function resize() {
    const rect = box.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    // Whole device pixels per art pixel, so the upscale is exact
    const scale = Math.max(1, Math.round(PIXEL * dpr)) / dpr
    const nextW = Math.floor(rect.width / scale)
    const nextH = Math.floor((rect.height + SKY) / scale)
    if (nextW === w && nextH === h && scale === cssPerPixel) return

    cssPerPixel = scale
    w = nextW
    h = nextH
    field = Math.round(rect.height / scale)
    canvas.width = w
    canvas.height = h
    canvas.style.width = `${w * scale}px`
    canvas.style.height = `${h * scale}px`
    canvas.style.left = `${(rect.width - w * scale) / 2}px`

    image = ctx.createImageData(w, h)
    surface = { w, h, px: new Uint32Array(image.data.buffer) }
    createField()
    cat = createCat(w)
    syncWeather()
    lifeKey = ''
    relight()
    draw()
  }

  // Browser zoom changes devicePixelRatio without resizing anything
  let unwatchDpr = () => {}
  function watchDpr() {
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    const onChange = () => {
      resize()
      watchDpr()
    }
    mq.addEventListener('change', onChange, { once: true })
    unwatchDpr = () => mq.removeEventListener('change', onChange)
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * w
    const y = ((e.clientY - rect.top) / rect.height) * h
    pointer.near = x >= 0 && x <= w && y >= 0 && y <= h
    pointer.x = x
    pointer.y = y
    pointer.idle = 0

    const inField = pointer.near && y >= fieldTop() - 5
    if (!inField) {
      pointer.active = false
      return
    }

    const dt = (e.timeStamp - pointer.lastT) / 1000
    if (pointer.active && dt > 0 && dt < 0.1) {
      pointer.vx = pointer.vx * 0.6 + ((x - pointer.lastX) / dt) * 0.4
    }
    pointer.active = true
    pointer.lastX = x
    pointer.lastT = e.timeStamp

    if (!touched) {
      touched = true
      onTouch()
    }
  }

  function onPointerEnd(e: PointerEvent) {
    if (e.pointerType !== 'mouse') pointer.active = pointer.near = false
  }

  function onMouseLeaveWindow() {
    pointer.active = pointer.near = false
  }

  resize()
  watchDpr()

  // Watch the box, not the canvas: the canvas size is set from here
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(box)

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
      colors = buildColors()
      if (!frameId) draw()
    },
    setWeather(next: Weather) {
      const fallChanged = next.condition !== weather.condition || next.intensity !== weather.intensity
      weather = next
      if (fallChanged) syncWeather()
      relight()
      if (!frameId) draw()
    },
    destroy() {
      stop()
      unwatchDpr()
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
