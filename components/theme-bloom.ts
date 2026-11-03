import { flushSync } from 'react-dom'

/* Theme bloom — the next theme spreads out of the toggle like a drop of ink:
   a blob with a wobbling, tendrilled edge, flinging droplets ahead of itself
   that it swallows as it catches up. It runs as a view transition, clipping
   ::view-transition-new(root) to the blob's outline every frame. */

const DURATION = 750
const POINTS = 220

// Layered ripples around the edge; together they can pull it in by ~25%
const WAVES = [
  { k: 3, a: 0.1 },
  { k: 5, a: 0.07 },
  { k: 7, a: 0.05 },
  { k: 11, a: 0.035 },
  { k: 17, a: 0.02 },
]

const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Applies the next theme, blooming it out from (x, y) where supported */
export async function bloomTheme(x: number, y: number, apply: () => void) {
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    apply()
    return
  }

  const path = bloomPath(x, y)
  const vt = document.startViewTransition(() => flushSync(apply))
  try {
    await vt.ready
  } catch {
    // Skipped (say, the tab is hidden): the theme has still been applied
    return
  }

  // Keeps the transition open while the frames below redraw the clip
  document.documentElement.animate(
    { opacity: [1, 1] },
    { duration: DURATION, pseudoElement: '::view-transition-new(root)' },
  )

  const style = document.createElement('style')
  document.head.append(style)
  const start = performance.now()
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION)
    style.textContent = `::view-transition-new(root){clip-path:${t < 1 ? path(t) : 'none'}}`
    if (t < 1) requestAnimationFrame(frame)
  }
  frame(start)

  await vt.finished
  style.remove()
}

function bloomPath(x: number, y: number) {
  const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  // Overshoot so even the edge's deepest dip clears the farthest corner
  const R = reach * 1.35
  const waves = WAVES.map((w) => ({ ...w, phase: rand(0, 6.28), drift: rand(-2, 2) }))
  const tendrils = Array.from({ length: 7 }, () => ({
    at: rand(0, 6.28),
    len: rand(0.12, 0.3),
    width: rand(0.06, 0.14),
  }))
  const drops = Array.from({ length: 9 }, () => ({
    at: rand(0, 6.28),
    lead: rand(1.08, 1.38),
    size: rand(0.025, 0.065),
    born: rand(0, 0.4),
  }))

  return (t: number) => {
    const r0 = R * easeOut(t)
    // Tendrils reach out early and draw back in as the bloom fills
    const reachOut = Math.sin(Math.PI * Math.min(1, t * 1.6))
    const pts: string[] = []
    for (let i = 0; i < POINTS; i++) {
      const th = (i / POINTS) * Math.PI * 2
      let f = 1
      for (const w of waves) f += w.a * Math.sin(w.k * th + w.phase + w.drift * t)
      for (const d of tendrils) {
        const da = Math.atan2(Math.sin(th - d.at), Math.cos(th - d.at))
        f += d.len * Math.exp(-(da * da) / (2 * d.width * d.width)) * reachOut
      }
      const r = Math.max(0, r0 * f)
      pts.push(`${(x + Math.cos(th) * r).toFixed(1)} ${(y + Math.sin(th) * r).toFixed(1)}`)
    }

    let d = `M${pts.join('L')}Z`
    for (const p of drops) {
      if (t < p.born) continue
      const rr = (R * p.size * Math.min(1, (t - p.born) * 4)).toFixed(1)
      const cx = x + Math.cos(p.at) * r0 * p.lead
      const cy = y + Math.sin(p.at) * r0 * p.lead
      d += `M${(cx + +rr).toFixed(1)} ${cy.toFixed(1)}a${rr} ${rr} 0 1 0 ${-2 * +rr} 0a${rr} ${rr} 0 1 0 ${2 * +rr} 0Z`
    }
    return `path(nonzero,'${d}')`
  }
}
