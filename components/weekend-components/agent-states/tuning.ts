// The numbers each state was tuned to by eye.

export const P = {
  global: { speed: 1.1, dotSize: 0.5, morph: 1 },
  idle: { spin: 0.14, breath: 0.12 },
  composing: { fill: 4.8, hold: 1.3, jitter: 0.3, grow: 0.34 },
  thinking: { period: 2.7, width: 0.17, base: 0.3, peak: 0.35, size: 0.4 },
  queued: { step: 0.35, base: 0.7, peak: 0.55, size: 2.2, fade: 0.8 },
  planning: { width: 0.05, turns: 3.5, trace: 3.1, trail: 0.2, base: 0.5, peak: 0.62, rotate: 1, dim: 0.7 },
  acting: { click: 0.68, turn: 30, base: 0.5, peak: 0.3, width: 0.17, thump: 0.04 },
  responding: { width: 0.08, amp: 0.27, freq: 5.4, speed: 4.6, base: 0.5, peak: 0.35, dim: 0.7 },
  waiting: { period: 3.4, dot: 0.04, base: 0.69, ripple: 0.5 },
  backgrounded: { reach: 0.73, dim: 0.9, orbit: 3.4, dot: 1.9 },
  compacting: { loop: 3, squeeze: 0, merge: 0 },
  recovering: { patch: 39, knock: 0.25, stutter: 0.03, home: 0.5 },
  ended: { sweep: 0.3 },
}

export type Tuning = typeof P

/** The orb at status-line size, tuned by eye in /proto/agent-indicator */
export const LOCKUP_P: Tuning = {
  global: { speed: 1.7, dotSize: 0.8, morph: 1 },
  idle: { spin: 0.14, breath: 0.12 },
  composing: { fill: 2.2, hold: 1.3, jitter: 0.3, grow: 0.18 },
  thinking: { period: 2.7, width: 0.17, base: 0.3, peak: 0.35, size: 0.4 },
  queued: { step: 0.35, base: 0.7, peak: 0.55, size: 1.8, fade: 1.6 },
  planning: { width: 0.14, turns: 4.2, trace: 3.5, trail: 0.2, base: 0.65, peak: 0.67, rotate: 0.23, dim: 0.94 },
  acting: { click: 0.68, turn: 30, base: 0.5, peak: 0.77, width: 0.16, thump: 0.04 },
  responding: { width: 0.185, amp: 0.14, freq: 5.4, speed: 7.7, base: 0.66, peak: 0.52, dim: 1 },
  waiting: { period: 3.4, dot: 0.04, base: 1, ripple: 0.5 },
  backgrounded: { reach: 0.73, dim: 0.9, orbit: 3.4, dot: 1.9 },
  compacting: { loop: 3, squeeze: 0, merge: 0 },
  recovering: { patch: 80, knock: 0.25, stutter: 0.03, home: 0.5 },
  ended: { sweep: 0.3 },
}
