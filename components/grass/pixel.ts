/*
 * A tiny pixel-art surface. The scene draws into a low-resolution buffer of
 * whole pixels and the canvas is scaled up with nearest-neighbour, so every
 * edge stays crisp. Sprites are strings: one character per pixel, '.' is empty.
 */

export type RGB = [number, number, number]

export const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/** RGBA packed for a little-endian Uint32 view over ImageData */
export const pack = (c: RGB, a = 255) =>
  ((a << 24) | (Math.round(c[2]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[0])) >>> 0

export type Surface = { w: number; h: number; px: Uint32Array }

export function plot(s: Surface, x: number, y: number, color: number) {
  x = Math.round(x)
  y = Math.round(y)
  if (x < 0 || y < 0 || x >= s.w || y >= s.h) return
  s.px[y * s.w + x] = color
}

/** Alpha-blend a colour over whatever is already there (for glows and fades) */
export function blend(s: Surface, x: number, y: number, c: RGB, alpha: number) {
  x = Math.round(x)
  y = Math.round(y)
  if (x < 0 || y < 0 || x >= s.w || y >= s.h || alpha <= 0) return
  const i = y * s.w + x
  const dst = s.px[i]
  const da = dst >>> 24
  if (da === 0) {
    s.px[i] = pack(c, Math.round(Math.min(1, alpha) * 255))
    return
  }
  const t = Math.min(1, alpha)
  const r = (dst & 255) + (c[0] - (dst & 255)) * t
  const g = ((dst >>> 8) & 255) + (c[1] - ((dst >>> 8) & 255)) * t
  const b = ((dst >>> 16) & 255) + (c[2] - ((dst >>> 16) & 255)) * t
  s.px[i] = pack([r, g, b], Math.max(da, Math.round(t * 255)))
}

export type Sprite = readonly string[]

/** Character → packed colour, indexed by char code; 0 means "leave empty" */
export type Palette = Uint32Array

export function palette(colors: Record<string, RGB | number>): Palette {
  const p = new Uint32Array(128)
  for (const [ch, c] of Object.entries(colors)) {
    p[ch.charCodeAt(0)] = typeof c === 'number' ? c : pack(c)
  }
  return p
}

export function blit(
  s: Surface,
  sprite: Sprite,
  x: number,
  y: number,
  pal: Palette,
  flip = false,
) {
  x = Math.round(x)
  y = Math.round(y)
  const w = sprite[0].length
  for (let j = 0; j < sprite.length; j++) {
    const row = sprite[j]
    for (let i = 0; i < w; i++) {
      const c = pal[row.charCodeAt(flip ? w - 1 - i : i)]
      if (c) plot(s, x + i, y + j, c)
    }
  }
}
