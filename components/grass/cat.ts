import type { Point } from './butterflies'
import { catFrames, EYES, type CatFrame, type Eyes } from './cat-art'
import { blend, blit, type Palette, type RGB, type Surface } from './pixel'
import { HEART, LEAF, ZED, ZED_SMALL } from './sprites'

/*
 * The cat: a small state machine (what it's doing and where) and the code that
 * picks its frame and expression. The art itself lives in cat-art.ts. All units
 * are art pixels.
 */

export type CatState =
  | 'sit'
  | 'walk'
  | 'stalk'
  | 'pounce'
  | 'groom'
  | 'swat'
  | 'happy'
  | 'sleep'
  | 'curl'

/** What the weather and time of day ask of the cat */
export type CatMood = 'hunt' | 'watch' | 'snow' | 'shelter' | 'sleep'

type Heart = { x: number; y: number; age: number; phase: number }

export type Cat = {
  x: number
  /** 1 faces right, -1 faces left */
  dir: 1 | -1
  state: CatState
  /** seconds spent in the current state */
  t: number
  /** how long the current state lasts */
  dur: number
  from: number
  to: number
  hearts: Heart[]
  heartIn: number
  /** offsets the blink timer so it doesn't feel mechanical */
  blinkSeed: number
}

export type CatEnv = {
  width: number
  mood: CatMood
  /** y of the row the cat stands on */
  ground: number
  /** things worth chasing, most interesting first (the cursor, then butterflies) */
  prey: Point[]
  /** the cursor is resting on the cat */
  petting: boolean
}

const WALK_SPEED = 10
const STALK_SPEED = 6
const POUNCE_RANGE = 30
const POUNCE_TIME = 0.55
const JUMP = 12
/** prey higher than this above the ground isn't worth stalking */
const REACH = 55
/** keeps the widest pose (mid-pounce) clear of the faded edges */
const MARGIN = 26
const HEART_LIFE = 1.4

const rand = (min: number, max: number) => min + Math.random() * (max - min)

export function createCat(width: number): Cat {
  return {
    x: Math.round(Math.min(Math.max(width * 0.72, MARGIN), width - MARGIN)),
    dir: -1,
    state: 'sit',
    t: 0,
    dur: rand(1, 3),
    from: 0,
    to: 0,
    hearts: [],
    heartIn: 0,
    blinkSeed: Math.random() * 10,
  }
}

function enter(cat: Cat, state: CatState, dur: number) {
  cat.state = state
  cat.t = 0
  cat.dur = dur
}

const restingState = (mood: CatMood): CatState | null =>
  mood === 'sleep' ? 'sleep' : mood === 'shelter' ? 'curl' : null

/** Pose for this mood without simulating, for first paint and reduced motion */
export function settleCat(cat: Cat, mood: CatMood) {
  enter(cat, restingState(mood) ?? 'sit', rand(1, 3))
}

export function stepCat(cat: Cat, dt: number, env: CatEnv) {
  cat.t += dt
  const clampX = (x: number) => Math.min(env.width - MARGIN, Math.max(MARGIN, x))

  for (const h of cat.hearts) {
    h.age += dt
    h.y -= 8 * dt
  }
  cat.hearts = cat.hearts.filter((h) => h.age < HEART_LIFE)
  if (env.petting) {
    cat.heartIn -= dt
    if (cat.heartIn <= 0) {
      cat.heartIn = 0.5
      const at = catHead(cat, env.ground)
      cat.hearts.push({ x: at.x + rand(-5, 5), y: at.y - 12, age: 0, phase: Math.random() * 6 })
    }
  } else {
    cat.heartIn = 0
  }

  // Asleep or sheltering: petting still earns hearts, but the cat stays put
  const resting = restingState(env.mood)
  if (resting) {
    cat.x = clampX(cat.x)
    if (cat.state !== resting && cat.state !== 'pounce') enter(cat, resting, Infinity)
    return
  }
  if (cat.state === 'sleep' || cat.state === 'curl') enter(cat, 'sit', rand(1, 2))

  if (env.petting && cat.state !== 'pounce') {
    if (cat.state !== 'happy') enter(cat, 'happy', Infinity)
    return
  }
  if (cat.state === 'happy') return enter(cat, 'sit', rand(1, 2.5))

  const target = () =>
    env.prey.find((p) => env.ground - p.y < REACH && Math.abs(p.x - cat.x) < env.width * 0.6)

  switch (cat.state) {
    case 'stalk':
    case 'walk': {
      const stalking = cat.state === 'stalk'
      if (stalking) {
        const prey = target()
        if (!prey) return enter(cat, 'sit', rand(1, 2.5))
        cat.to = clampX(prey.x)
      }
      const dx = cat.to - cat.x
      if (Math.abs(dx) > 1) cat.dir = dx > 0 ? 1 : -1

      if (stalking && Math.abs(dx) < POUNCE_RANGE) {
        cat.from = cat.x
        cat.to = clampX(cat.x + cat.dir * Math.min(Math.abs(dx) + 4, POUNCE_RANGE + 6))
        return enter(cat, 'pounce', POUNCE_TIME)
      }
      if (Math.abs(dx) < 1 || cat.t > cat.dur) return enter(cat, 'sit', rand(1.5, 4))
      cat.x = clampX(cat.x + cat.dir * (stalking ? STALK_SPEED : WALK_SPEED) * dt)
      return
    }

    case 'pounce': {
      const p = Math.min(1, cat.t / cat.dur)
      cat.x = cat.from + (cat.to - cat.from) * (1 - (1 - p) ** 2)
      if (p >= 1) enter(cat, Math.random() < 0.35 ? 'groom' : 'sit', rand(1.5, 3.5))
      return
    }

    case 'groom':
    case 'swat':
      if (cat.t >= cat.dur) enter(cat, 'sit', rand(1.5, 4))
      return

    case 'sit': {
      // Keep an eye on whatever is moving
      const prey = env.prey[0]
      if (prey && Math.abs(prey.x - cat.x) > 3) cat.dir = prey.x > cat.x ? 1 : -1
      if (cat.t < cat.dur) return

      const r = Math.random()
      const wander = () => {
        cat.to = clampX(rand(MARGIN, env.width - MARGIN))
        enter(cat, 'walk', 12)
      }

      if (env.mood === 'hunt') {
        if (target()) return enter(cat, 'stalk', 8)
        if (r < 0.45) return wander()
        if (r < 0.7) return enter(cat, 'groom', rand(2, 3.5))
      } else if (env.mood === 'snow') {
        if (r < 0.6) return enter(cat, 'swat', 0.7)
        if (r < 0.75) return wander()
      } else {
        if (r < 0.3) return wander()
        if (r < 0.5) return enter(cat, 'groom', rand(2, 3.5))
      }
      return enter(cat, 'sit', rand(2, 5))
    }
  }
}

/** Height of the cat's feet above the ground, for the pounce arc */
export function catLift(cat: Cat) {
  return cat.state === 'pounce' ? Math.round(Math.sin(Math.PI * Math.min(1, cat.t / cat.dur)) * JUMP) : 0
}

/** Which set of frames a state draws from */
function framesFor(state: CatState): CatFrame[] {
  const f = catFrames()
  switch (state) {
    case 'walk':
      return f.walk
    case 'stalk':
      return f.stalk
    case 'pounce':
      return f.pounce
    case 'sleep':
    case 'curl':
      return f.loaf
    case 'groom':
      return f.groom
    case 'swat':
      return f.swat
    default:
      return f.sit
  }
}

/** Centre of the cat's head, for petting and for butterflies to steer clear of */
export function catHead(cat: Cat, ground: number): Point {
  const [hx, hy] = framesFor(cat.state)[0].head
  return { x: cat.x + cat.dir * hx, y: ground + hy - catLift(cat) }
}

// ── Drawing ────────────────────────────────────────────────────────────────

/** The frame to show right now, the expression on it, and any little hop */
function pose(cat: Cat, time: number): { frame: CatFrame; eyes: Eyes; hop: number } {
  const frames = framesFor(cat.state)
  const at = (fps: number) => frames[Math.floor(time * fps) % frames.length]
  const blinking = (time + cat.blinkSeed) % 4.2 < 0.14
  const open: Eyes = blinking ? 'blink' : 'open'

  switch (cat.state) {
    case 'happy':
      return { frame: at(6), eyes: 'happy', hop: Math.floor(time * 5) % 2 }
    case 'groom':
      return { frame: at(6), eyes: 'happy', hop: 0 }
    case 'swat': {
      const k = Math.sin(Math.PI * Math.min(1, cat.t / cat.dur))
      return { frame: frames[Math.min(frames.length - 1, Math.floor(k * frames.length))], eyes: 'focus', hop: 0 }
    }
    case 'walk':
      return { frame: at(8), eyes: open, hop: 0 }
    case 'stalk':
      return { frame: at(5), eyes: 'focus', hop: 0 }
    case 'pounce':
      return { frame: frames[0], eyes: 'focus', hop: 0 }
    case 'sleep':
      return { frame: at(1 / 1.4), eyes: 'sleep', hop: 0 }
    case 'curl':
      // Sheltering, not asleep: it peeks out at the rain now and then
      return { frame: at(1 / 1.4), eyes: (time + cat.blinkSeed) % 6 < 1 ? 'open' : 'blink', hop: 0 }
    default:
      // the tail swishes through its frames slowly
      return { frame: at(1.6), eyes: open, hop: 0 }
  }
}

const SHADOW: RGB = [0, 0, 0]

export function drawCat(s: Surface, cat: Cat, ground: number, time: number, pal: Palette) {
  const { frame, eyes, hop } = pose(cat, time)
  const lift = catLift(cat) + hop
  const w = frame.sprite[0].length
  const flip = cat.dir === -1

  // A soft shadow on the grass, shrinking as the cat leaves the ground
  const rx = w * 0.32 * (1 - lift / (JUMP * 2))
  for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
    const k = 1 - (dx / rx) ** 2
    if (k <= 0) continue
    blend(s, cat.x + dx, ground, SHADOW, 0.22 * k)
    blend(s, cat.x + dx, ground + 1, SHADOW, 0.12 * k)
  }

  const x = Math.round(cat.x) - (flip ? w - 1 - frame.ox : frame.ox)
  const y = ground - frame.oy - lift
  blit(s, frame.sprite, x, y, pal, flip)
  // Eyes go on unflipped, so the shine stays on the lit side
  for (const [ex, ey] of frame.eyes) blit(s, EYES[eyes], x + (flip ? w - 3 - ex : ex), y + ey, pal)

  // In the rain it shelters under a leaf balanced on its ears
  if (cat.state === 'curl') {
    const head = catHead(cat, ground)
    blit(s, LEAF, head.x - 8 + Math.round(Math.sin(time * 1.1)), head.y - 12, pal)
  }
}

/** Hearts and Zs float above everything, so they're drawn after the front grass */
export function drawCatEffects(s: Surface, cat: Cat, ground: number, time: number, pal: Palette) {
  for (const h of cat.hearts) {
    // the classic pixel-game exit: blink out instead of fading
    if (h.age > HEART_LIFE - 0.4 && Math.floor(h.age * 12) % 2) continue
    blit(s, HEART, h.x + Math.sin(h.age * 4 + h.phase) * 1.5 - 2, h.y, pal)
  }

  if (cat.state === 'sleep') {
    const at = catHead(cat, ground)
    for (const offset of [0, 0.5]) {
      const p = (time / 2.6 + offset) % 1
      if (p > 0.85 && Math.floor(time * 10) % 2) continue
      blit(s, p < 0.45 ? ZED_SMALL : ZED, at.x + cat.dir * (9 + p * 5), at.y - 9 - p * 9, pal)
    }
  }
}
