// Rain on a window, simulated on the CPU in CSS pixels (y grows downward).
//
// Two kinds of water:
//   - beads: small, still droplets of condensation that form over time
//   - drops: bigger ones that sit until heavy, then slide down in fits and
//     starts, swallowing the beads and drops in their path, shedding small
//     beads behind them and wiping a clear streak through the mist
// The renderer stamps every bead and drop into a water texture each frame,
// and every moving drop into the mist-clearing texture.

export type Water = { x: number; y: number; r: number; seed: number; moving: boolean }

type Drop = Water & { vx: number; vy: number; shed: number }

/** Where a moving drop wiped the glass this frame */
export type Stamp = { x: number; y: number; r: number }

const CLEAR_CELL = 12
/** How long a wiped streak keeps new condensation off it, in ms */
const CLEAR_MS = 3500

export class RainSim {
  W = 0
  H = 0
  now = 0
  beads: Water[] = []
  drops: Drop[] = []
  stamps: Stamp[] = []
  private cleared = new Float32Array(0)
  private cw = 0
  private ch = 0

  resize(W: number, H: number) {
    if (W < 1 || H < 1) return
    this.W = W
    this.H = H
    this.cw = Math.ceil(W / CLEAR_CELL)
    this.ch = Math.ceil(H / CLEAR_CELL)
    this.cleared = new Float32Array(this.cw * this.ch).fill(-1e9)
    this.beads = []
    this.drops = []
    while (this.beads.length < this.beadTarget()) this.spawnBead()
    while (this.drops.length < this.dropTarget()) this.spawnDrop(Math.random() * H)
  }

  private beadTarget() {
    return Math.round((this.W * this.H) / 380)
  }
  private dropTarget() {
    return Math.round((this.W * this.H) / 11000)
  }

  private spawnBead() {
    // Condensation stays off a freshly wiped streak for a while
    for (let tries = 0; tries < 6; tries++) {
      const x = Math.random() * this.W
      const y = Math.random() * this.H
      const cell = Math.floor(y / CLEAR_CELL) * this.cw + Math.floor(x / CLEAR_CELL)
      if (this.now - this.cleared[cell] < CLEAR_MS && tries < 5) continue
      const r = 1.2 + Math.pow(Math.random(), 2.4) * 5
      this.beads.push({ x, y, r, seed: Math.random(), moving: false })
      return
    }
  }

  private spawnDrop(y: number) {
    this.drops.push({
      x: Math.random() * this.W,
      y,
      r: 6 + Math.pow(Math.random(), 1.7) * 20,
      seed: Math.random(),
      moving: false,
      vx: 0,
      vy: 0,
      shed: 8 + Math.random() * 12,
    })
  }

  private markCleared(x: number, y: number, r: number) {
    const x0 = Math.max(0, Math.floor((x - r) / CLEAR_CELL))
    const x1 = Math.min(this.cw - 1, Math.floor((x + r) / CLEAR_CELL))
    const y0 = Math.max(0, Math.floor((y - r) / CLEAR_CELL))
    const y1 = Math.min(this.ch - 1, Math.floor((y + r) / CLEAR_CELL))
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) this.cleared[cy * this.cw + cx] = this.now
  }

  /** Advance by dt milliseconds */
  step(dt: number) {
    if (!this.W) return
    this.now += dt
    const s = dt / 1000
    this.stamps = []

    // New water arrives: condensation slowly, rain drops now and then
    const beadRate = this.beadTarget() / 7
    for (let k = 0; k < beadRate * s * 2 && this.beads.length < this.beadTarget(); k++)
      if (Math.random() < 0.5) this.spawnBead()
    if (this.drops.length < this.dropTarget() && Math.random() < s * this.dropTarget() / 9)
      this.spawnDrop(Math.random() * this.H * 0.9)

    const absorb = (d: Drop, r: number) => {
      // Volumes add, so radii add in quadrature (a little is lost to the glass)
      d.r = Math.sqrt(d.r * d.r + r * r * 0.75)
    }

    for (const d of this.drops) {
      if (!d.moving) {
        d.r += s * 0.04
        // Heavy drops let go of the glass
        if (d.r > 15 && Math.random() < s * (d.r - 15) * 0.05) {
          d.moving = true
          d.vy = 10
        }
        continue
      }

      // Stick and slip: a drop catches on the glass, then lurches on
      const terminal = 30 + d.r * 16
      d.vy = Math.min(terminal, d.vy + d.r * 22 * s)
      if (Math.random() < s * 0.9) d.vy *= 0.15
      d.vx = (d.vx + (Math.random() - 0.5) * 90 * s) * 0.9
      d.vx = Math.max(-22, Math.min(22, d.vx))
      const dx = d.vx * s
      const dy = d.vy * s
      d.x += dx
      d.y += dy

      // Shed small beads behind as it goes, losing water to the trail
      d.shed -= Math.hypot(dx, dy)
      if (d.shed < 0) {
        const br = d.r * (0.22 + Math.random() * 0.2)
        this.beads.push({ x: d.x + (Math.random() - 0.5) * d.r * 0.4, y: d.y - d.r * 1.1, r: br, seed: Math.random(), moving: false })
        d.r = Math.sqrt(Math.max(1, d.r * d.r - br * br * 0.6))
        d.shed = 7 + Math.random() * 16
      }
      if (d.r < 6) {
        d.moving = false
        d.vy = 0
      }

      this.stamps.push({ x: d.x, y: d.y, r: d.r })
      this.markCleared(d.x, d.y, d.r * 1.2)

      // Swallow the beads in its path
      const reach = d.r * 1.05
      for (let i = this.beads.length - 1; i >= 0; i--) {
        const b = this.beads[i]
        const ddx = b.x - d.x
        const ddy = b.y - d.y
        if (ddy < -reach * 2 || ddy > reach * 2) continue
        if (ddx * ddx + ddy * ddy < (reach + b.r * 0.5) ** 2) {
          absorb(d, b.r)
          this.beads[i] = this.beads[this.beads.length - 1]
          this.beads.pop()
        }
      }
    }

    // Drops that touch merge into one; a moving one carries the other along
    for (let i = 0; i < this.drops.length; i++) {
      const a = this.drops[i]
      for (let j = i + 1; j < this.drops.length; j++) {
        const b = this.drops[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const lim = (a.r + b.r) * 0.62
        if (dx * dx + dy * dy > lim * lim) continue
        const [big, small] = a.r >= b.r ? [a, b] : [b, a]
        absorb(big, small.r)
        big.moving = big.moving || small.moving
        big.vy = Math.max(big.vy, small.vy)
        small.r = 0
      }
    }

    this.drops = this.drops.filter((d) => d.r > 0 && d.y - d.r < this.H + 4)
    // Keep the bead count bounded even when drops shed a lot
    if (this.beads.length > this.beadTarget() * 1.4) this.beads.splice(0, this.beads.length - this.beadTarget() * 1.4)
  }
}
