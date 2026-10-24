// Pure shading logic for the ASCII orb. No React, no DOM — easy to test.

export const RAMP = " .:-=+*#%@";

export type Field = {
  /** how much the silhouette wobbles (0–2) */
  wobble: number;
  /** 0–1 audio level, swells the orb */
  pulse: number;
  /** light direction (x, y), roughly -1..1 */
  lx: number;
  ly: number;
};

export type Cell = { ch: string; r: number; g: number; b: number; a: number };

const PINK = [255, 63, 180];
const MAGENTA = [226, 61, 214];
const VIOLET = [138, 123, 255];
const CORAL = [255, 98, 130];
const PALE = [255, 170, 225];
const LILAC = [200, 150, 255];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function hash(a: number, b: number, c: number) {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

let cr = 0, cg = 0, cb = 0;
function start(c: number[]) {
  cr = c[0]; cg = c[1]; cb = c[2];
}
function blend(c: number[], w: number) {
  w = clamp(w);
  cr += (c[0] - cr) * w;
  cg += (c[1] - cg) * w;
  cb += (c[2] - cb) * w;
}

/** Fills `out` and returns true if this grid cell should draw a glyph. */
export function sampleCell(
  i: number,
  j: number,
  cols: number,
  t: number,
  f: Field,
  out: Cell,
): boolean {
  const half = (cols - 1) / 2;
  const nx = ((i - half) / half) * 1.3;
  const ny = ((j - half) / half) * 1.3;
  const r = Math.hypot(nx, ny);
  const th = Math.atan2(ny, nx);
  const w = f.wobble;

  // blobby silhouette
  const R =
    1 +
    f.pulse * 0.07 +
    w * (0.03 * Math.sin(3 * th + t * 0.9) + 0.022 * Math.sin(5 * th - t * 1.3) + 0.015 * Math.sin(2 * th + t * 0.5));
  const q = r / R;
  if (q > 1.3) return false;

  // domain-warped flow drives the colour swirl
  const wx = nx + 0.18 * Math.sin(ny * 2.6 + t * 0.7) + 0.1 * Math.sin(ny * 5.1 - t * 1.1);
  const wy = ny + 0.18 * Math.sin(nx * 2.3 - t * 0.6) + 0.1 * Math.sin(nx * 4.7 + t * 0.9);
  const flow = 0.5 + 0.5 * Math.sin(wx * 2.4 + wy * 1.7 + t * 0.5);
  const flow2 = 0.5 + 0.5 * Math.sin(wx * 3 - wy * 1.2 - t * 0.6);
  const tick = Math.floor(t * 3);

  // soft halo: sparse faint dots outside the shell
  if (q > 1) {
    const a = 1 - (q - 1) / 0.3;
    if (hash(i, j, tick) < 0.55) return false;
    start(PALE);
    blend(LILAC, flow);
    out.ch = hash(i, j, 7) < 0.6 ? "." : ":";
    out.r = cr; out.g = cg; out.b = cb;
    out.a = a * a * (0.28 + 0.25 * flow);
    return true;
  }

  // sphere shading
  const z = Math.sqrt(1 - q * q);
  const nnx = nx / R;
  const nny = ny / R;
  const ll = Math.hypot(f.lx, f.ly, 0.75);
  const diff = Math.max(0, (nnx * f.lx + nny * f.ly + z * 0.75) / ll);
  const rim = Math.pow(1 - z, 2.4);

  // the bright filament: a curve that bends left and flares at the bottom
  const lineX =
    0.16 + 0.12 * Math.sin(ny * 1.8 + t * 0.45) + 0.04 * w * Math.sin(ny * 5 + t * 1.2) - 0.3 * ss(0, 1, ny);
  const d = nx - lineX;
  const gain = (0.3 + 0.7 * ss(-0.4, 0.9, ny)) * ss(-0.9, -0.55, ny);
  const core = Math.exp(-(d * d) / 0.0034) * gain;
  const burst = Math.exp(-((nx + 0.02) ** 2 + (ny - 0.9) ** 2) / 0.012);
  const line = Math.max(core, burst * 0.9);
  const sheen = Math.exp(-((d - 0.25) ** 2) / 0.04) * ss(-0.7, 0.3, ny) * 0.7;

  // ink = how dense the glyph is
  let ink = 0.28 + 0.3 * flow + 0.3 * diff - 0.6 * rim - 0.3 * sheen;
  ink *= 1 - 0.97 * line;
  ink *= 0.6 + 0.4 * ss(1, 0.93, q);
  ink += (hash(i, j, tick) - 0.5) * 0.1;

  const idx = Math.floor(clamp(ink) * RAMP.length);
  if (idx <= 0) return false;

  // colour
  start(PINK);
  blend(MAGENTA, 0.45 * flow);
  blend(VIOLET, ss(0.3, 0.95, (-nx + ny) * 0.5) * (0.55 + 0.45 * flow2));
  blend(VIOLET, ss(0.45, 1, (-nx - ny) * 0.5) * 0.45);
  blend(CORAL, Math.exp(-((nx + 0.8) ** 2 + (ny - 0.15) ** 2) / 0.12) * 0.8);
  blend(PALE, ss(0.15, 0.95, nx) * 0.55 + sheen * 0.5);
  const tone = 0.25 + 0.75 * clamp(ink);
  out.ch = RAMP[Math.min(idx, RAMP.length - 1)];
  out.r = 255 + (cr - 255) * tone;
  out.g = 255 + (cg - 255) * tone;
  out.b = 255 + (cb - 255) * tone;
  out.a = 1;
  return true;
}