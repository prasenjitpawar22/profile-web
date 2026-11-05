'use client'

import { useEffect, useRef } from 'react'
import { RainSim } from './rain'

// A rainy car window at night, rendered like a photograph focused on the glass.
//
// Outside is a composed street, drawn sharp in linear HDR light: a sky lit
// orange from below by the city, two layers of skyline with lit windows and
// the odd neon sign, a wet road, street lamps streaming past along the kerb as
// the car drives on, oncoming headlights, tail-lights ahead that brake now and
// then, and a traffic signal. Every light is mirrored in the road as a long
// rippled streak. A lens blur then throws the street out of focus, so bright
// lights bloom into true bokeh discs, and the condensation blurs it further.
//
// On the glass, a small simulation (rain.ts) moves real water: beads of
// condensation, and drops that grow, merge, slide in fits and starts, swallow
// beads and wipe clear streaks through the mist, which fogs back. Each drop
// is a lens over the sharp street: flipped, slightly dispersed, dark at the
// rim, bright where light gathers, reflective at grazing angles. Between the
// drops lies fine condensation that glints.
//
// `focus` pulls the street toward sharp while the password is wiped. Colours
// come from the scene's --night-* tokens (sRGB hex, converted to linear).
//
// Passes: scene (half res, HDR) -> prefilter -> depth of field -> mist blur
// (quarter res) -> water heights (full res) -> wiped streaks (half res,
// persistent) -> composite with ACES tone mapping.

const QUAD_VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const HASH = `
float h11(float x) { return fract(sin(x * 127.1 + 1.7) * 43758.5453); }
float h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 h22(vec2 p) {
  float n = h21(p);
  return vec2(n, h21(p + n));
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}
`

const SCENE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uParallax;
uniform float uLamp;
uniform float uWindows;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uGround;
uniform vec3 uBuilding;
uniform vec3 uWarm;
uniform vec3 uWhite;
uniform vec3 uCool;
uniform vec3 uRed;
uniform vec3 uNeonA;
uniform vec3 uNeonB;
${HASH}
const float HORIZON = 0.44;
float aspect;

// A point light: a hot core and an inverse-square glow. The depth of field
// pass is what turns it into a bokeh disc
vec3 light(vec2 p, vec2 c, float size, vec3 col, float power) {
  vec2 d = p - c;
  float d2 = dot(d, d);
  float core = 1.0 - smoothstep(size * 0.35, size, sqrt(d2));
  float glow = size * size / (d2 + size * size) * 0.18;
  return col * power * (core + glow);
}

// Its reflection in the wet road: a streak that spreads and fades as it
// falls, broken into horizontal glints by the ripples on the water
vec3 reflection(vec2 p, vec2 c, float groundY, float size, vec3 col, float power) {
  if (p.y > groundY) return vec3(0.0);
  float below = groundY - p.y;
  float dx = (p.x - c.x) / (size * (1.1 + below * 9.0));
  float len = (c.y - groundY) * 0.85 + 0.03;
  float wobble = noise(vec2(p.y * 90.0 - uTime * 0.5, c.x * 40.0)) - 0.5;
  dx += wobble * 0.9;
  float bands = smoothstep(0.32, 0.78, noise(vec2(p.x * 70.0, p.y * 230.0 - uTime * 0.9)));
  // By day the bright sky drowns most of it out
  float daylight = mix(0.3, 1.0, uLamp);
  return col * power * 0.16 * daylight * exp(-dx * dx) * exp(-below / len) * (0.25 + 0.75 * bands);
}

// One row of buildings. Writes cover = 1 where a building stands
vec3 skyline(vec2 p, inout float cover, float par, float seed, float cellW, float maxH, float lit) {
  float x = p.x + par;
  float id = floor(x / cellW);
  float fx = fract(x / cellW);
  float r = h11(id * 7.13 + seed);
  float inset = 0.04 + 0.14 * h11(id * 3.31 + seed);
  float top = HORIZON + maxH * (0.16 + 0.84 * r * r);
  // Some towers step back near the top
  if (h11(id + seed * 3.0) > 0.6 && p.y > top - 0.04 && (fx < inset + 0.12 || fx > 0.86)) return vec3(0.0);
  if (p.y > top || p.y < HORIZON - 0.004 || fx < inset || fx > 1.0 - inset * 0.4) return vec3(0.0);
  cover = 1.0;
  // A faint gradient: lit from below by the street
  vec3 body = uBuilding * (0.7 + 0.6 * smoothstep(top, HORIZON, p.y));

  // Windows: a grid of panes, most dark, some warm, a few cool white
  float cols = floor(5.0 + 6.0 * h11(id + seed + 2.0));
  float bw = 1.0 - inset * 1.4;
  vec2 wq = vec2((fx - inset) / bw * cols, (p.y - HORIZON) / (0.0105 + 0.004 * h11(id + 9.0)));
  vec2 wid = floor(wq);
  vec2 wf = fract(wq);
  // Some buildings are all but dark; others are busy
  float busy = h11(id + 5.0);
  float on = step(h21(wid + vec2(id * 13.7 + seed, seed)), lit * (0.04 + 0.34 * busy * busy));
  float pane = smoothstep(0.12, 0.22, wf.x) * smoothstep(0.88, 0.78, wf.x) * smoothstep(0.15, 0.28, wf.y) * smoothstep(0.85, 0.72, wf.y);
  float k = h21(wid + id + 3.3);
  vec3 wc = k < 0.64 ? uWarm : (k < 0.92 ? uWhite : uCool);
  body += wc * pane * on * (0.5 + 1.8 * h21(wid + 7.7)) * uWindows;

  // The odd neon sign over a shopfront
  float sign = h11(id * 5.7 + seed * 2.0);
  if (sign > 0.84) {
    float sy = HORIZON + 0.018 + 0.03 * h11(id + 1.0);
    float band = (1.0 - smoothstep(0.0, 0.0055, abs(p.y - sy))) * smoothstep(inset, inset + 0.1, fx) * smoothstep(1.0 - inset * 0.4, 0.86, fx);
    float buzz = 0.9 + 0.1 * step(0.97, h11(floor(uTime * 12.0) + id));
    body += (sign > 0.92 ? uNeonA : uNeonB) * band * 5.0 * buzz * uLamp;
  }
  return body;
}

void main() {
  vec2 uv = vUv;
  aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;
  float hy = uv.y - HORIZON;

  // Sky: city light caught in low cloud, fading up into the dark
  vec3 col = mix(uSkyHorizon, uSkyTop, smoothstep(0.0, 0.5, hy));
  float clouds = fbm(vec2(p.x * 1.3 + t * 0.004 + uParallax.x * 0.002, uv.y * 3.5));
  col += uSkyHorizon * clouds * 0.6 * smoothstep(0.55, 0.0, hy) * step(0.0, hy);

  // Skyline: the near row hides the far one; distance adds haze
  if (uv.y > HORIZON - 0.004) {
    float cover = 0.0;
    vec3 near = skyline(p, cover, uParallax.x * 0.012, 1.0, 0.075, 0.36, 1.0);
    if (cover > 0.0) {
      col = near;
    } else {
      vec3 far = skyline(p, cover, uParallax.x * 0.005, 7.0, 0.045, 0.22, 0.75);
      if (cover > 0.0) col = mix(far, uSkyHorizon, 0.4);
    }
  }

  vec2 vp = vec2(0.6 * aspect + uParallax.x * 0.02, HORIZON);

  // The wet road: dark asphalt mirroring the glowing sky near the horizon
  if (uv.y < HORIZON) {
    float depth = (HORIZON - uv.y) / HORIZON;
    vec3 road = uGround * (0.55 + 0.7 * depth);
    float sheen = 0.55 + 0.45 * noise(vec2(p.x * 30.0, uv.y * 140.0));
    // Wet asphalt is half mirror: it carries the sky, most strongly far off
    road += uSkyHorizon * (0.18 + 0.4 * pow(1.0 - depth, 2.0)) * sheen;
    // Lane markings running into the vanishing point
    vec2 rel = p - vp;
    float laneX = rel.x / max(-rel.y, 0.001);
    float dash = step(0.5, fract(log(max(-rel.y, 0.001)) * 6.0 - t * 1.2));
    float mark = (1.0 - smoothstep(0.0, 0.02, abs(laneX + 0.55))) * dash;
    road += uWhite * mark * 0.05 * (0.3 + depth);
    col = road;
  }

  // Street lamps along the left kerb, streaming past as the car drives on
  vec2 kerb = normalize(vec2(-1.0, -0.36));
  for (int k = 0; k < 12; k++) {
    float fk = float(k);
    float s = fract(fk / 12.0 + t * 0.035);
    float e = s * s;
    vec2 ground = vp + kerb * e * aspect * 1.1;
    vec2 c = ground + vec2(0.0, 0.025 + 0.3 * e);
    float size = 0.002 + 0.012 * e;
    float fade = smoothstep(0.0, 0.08, s) * (1.0 - smoothstep(0.9, 1.0, s));
    float power = 9.0 * fade * uLamp;
    col += light(p, c, size, uWarm, power);
    col += reflection(p, c, ground.y, size, uWarm, power);
  }

  // Oncoming traffic: headlight pairs rushing out of the distance
  vec2 lane = normalize(vec2(-1.0, -0.62));
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float s = fract(fk / 4.0 + t * 0.085 + 0.3);
    float e = s * s * s;
    vec2 ground = vp + vec2(-0.02, 0.0) + lane * e * aspect * 0.85;
    float sep = 0.004 + 0.06 * e;
    float size = 0.0018 + 0.009 * e;
    float fade = smoothstep(0.0, 0.1, s) * (1.0 - smoothstep(0.88, 1.0, s));
    float power = 11.0 * fade * mix(0.6, 1.0, uLamp);
    vec2 a = ground + vec2(-sep * 0.5, 0.006 + 0.012 * e);
    vec2 b = ground + vec2(sep * 0.5, 0.006 + 0.012 * e);
    col += light(p, a, size, uWhite, power) + light(p, b, size, uWhite, power);
    col += reflection(p, a, ground.y, size, uWhite, power) + reflection(p, b, ground.y, size, uWhite, power);
  }

  // Traffic ahead: tail-light pairs holding their distance, braking now and then
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float e = 0.05 + 0.22 * h11(fk * 3.1) + 0.02 * sin(t * 0.3 + fk * 2.0);
    vec2 ground = vp + vec2((0.08 - 0.05 * fk) * e * 3.0, 0.0) + vec2(-0.25, -1.0) * e * 0.55;
    float sep = 0.003 + 0.07 * e;
    float size = 0.0016 + 0.008 * e;
    float brake = step(0.72, h11(floor(t * 0.22 + fk * 1.7)));
    float power = (2.5 + 7.0 * brake) * mix(0.7, 1.0, uLamp);
    vec2 a = ground + vec2(-sep * 0.5, 0.008 + 0.02 * e);
    vec2 b = ground + vec2(sep * 0.5, 0.008 + 0.02 * e);
    col += light(p, a, size, uRed, power) + light(p, b, size, uRed, power);
    col += reflection(p, a, ground.y, size, uRed, power) + reflection(p, b, ground.y, size, uRed, power);
  }

  // A traffic signal on the far corner, cycling slowly
  vec2 sig = vp + vec2(0.16, 0.085);
  float phase = fract(t / 26.0);
  vec3 sc = phase < 0.46 ? vec3(0.1, 1.0, 0.45) : (phase < 0.56 ? vec3(1.0, 0.62, 0.05) : uRed);
  col += light(p, sig, 0.004, sc, 8.0 * uLamp);
  col += reflection(p, sig, HORIZON - 0.004, 0.004, sc, 8.0 * uLamp);

  outColor = vec4(col, 1.0);
}`

// Golden-angle lens blur: bright samples are weighted up, so highlights
// bloom into round bokeh discs while dark areas simply soften
const blurFrag = (iter: number) => `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uRadius;
uniform float uHot;
void main() {
  const float GA = 2.39996323;
  mat2 rot = mat2(cos(GA), sin(GA), -sin(GA), cos(GA));
  vec3 acc = vec3(0.0);
  vec3 div = vec3(0.0);
  float r = 1.0;
  vec2 ang = vec2(0.0, uRadius / sqrt(${iter}.0 * 2.0));
  for (int j = 0; j < ${iter}; j++) {
    r += 1.0 / r;
    ang = rot * ang;
    vec3 c = texture(uSrc, vUv + (r - 1.0) * ang * uTexel).rgb;
    vec3 w = mix(vec3(1.0), c * c + 0.01, uHot);
    acc += c * w;
    div += w;
  }
  outColor = vec4(acc / div, 1.0);
}`

const SPRITE_VERT = `#version 300 es
in vec2 aPos;
in vec2 aLocal;
in vec3 aInfo;
out vec2 vLocal;
out vec3 vInfo;
void main() {
  vLocal = aLocal;
  vInfo = aInfo;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

// A dome of water: height as a fraction of HMAX canvas px, so slopes come
// out true. info: x height scale, y shape seed, z vertical stretch
const SPRITE_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec3 vInfo;
out vec4 outColor;
void main() {
  vec2 d = vLocal;
  // Gravity fills out the bottom, sliding stretches it
  d.y *= mix(0.86, 1.1, smoothstep(-0.6, 0.6, d.y));
  d.y /= vInfo.z;
  float len = length(d);
  vec2 dn = d / max(len, 0.0001);
  // Never a true circle: a seeded wobble in the outline
  float a = fract(vInfo.y * 7.31) - 0.5;
  float b = fract(vInfo.y * 13.7) - 0.5;
  float wob = 1.0 + 0.14 * ((dn.x * dn.x - dn.y * dn.y) * a + 2.0 * dn.x * dn.y * b);
  float q = len / wob;
  if (q >= 1.0) discard;
  outColor = vec4(vInfo.x * (1.0 - q * q));
}`

const FILL_FRAG = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() {
  outColor = uColor;
}`

const COMPOSITE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSharp;
uniform sampler2D uDof;
uniform sampler2D uMisty;
uniform sampler2D uWater;
uniform sampler2D uWipe;
uniform vec2 uTexel;
uniform float uHmax;
uniform float uTime;
uniform float uFocus;
uniform float uExposure;
uniform float uDay;
uniform vec3 uDrop;
uniform vec3 uHaze;
${HASH}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec2 safe(vec2 uv) { return clamp(uv, 0.002, 0.998); }

void main() {
  vec2 uv = vUv;
  vec3 key = normalize(vec3(-0.35, 0.75, 0.55));

  // Behind the glass: out of focus, unless the eye is refocusing on it
  vec3 dof = mix(texture(uDof, uv).rgb, texture(uSharp, uv).rgb, uFocus * 0.85);
  // Condensation scatters the view further and lays a pale veil over it,
  // except where a drop has just wiped the glass
  float wiped = clamp(texture(uWipe, uv).r * 1.6, 0.0, 1.0);
  float mist = 1.0 - wiped;
  vec3 veil = texture(uMisty, uv).rgb * 1.05 + uHaze * 0.45;
  vec3 col = mix(dof, veil, mist * 0.72);
  float lum = dot(dof, vec3(0.2126, 0.7152, 0.0722));

  // Water on the glass
  float h = texture(uWater, uv).r * uHmax;
  float hl = texture(uWater, uv - vec2(uTexel.x, 0.0)).r;
  float hr = texture(uWater, uv + vec2(uTexel.x, 0.0)).r;
  float hd = texture(uWater, uv - vec2(0.0, uTexel.y)).r;
  float hu = texture(uWater, uv + vec2(0.0, uTexel.y)).r;
  // Slope of the water surface in px per px, pointing uphill (inward)
  vec2 g = vec2(hr - hl, hu - hd) * 0.5 * uHmax;
  float mask = smoothstep(0.12, 0.45, h);

  // Each drop casts a soft shadow down and to the right
  float above = texture(uWater, uv + vec2(-2.0, 3.0) * uTexel).r * uHmax;
  col *= 1.0 - 0.3 * smoothstep(0.2, 1.8, above) * (1.0 - mask);

  // Fine condensation between the drops: countless tiny beads that glint
  vec2 cell = gl_FragCoord.xy / 3.4;
  vec2 mid = floor(cell);
  vec2 mf = fract(cell) - 0.5;
  if (mask < 0.5 && h21(mid) < 0.62 * mist) {
    vec2 mc = (h22(mid + 4.1) - 0.5) * 0.4;
    float mr = 0.14 + 0.24 * h21(mid + 8.3);
    vec2 md = (mf - mc) / mr;
    float ml = length(md);
    if (ml < 1.0) {
      vec3 mn = normalize(vec3(md * 0.9, 1.0));
      float ms = pow(max(0.0, dot(reflect(-key, mn), vec3(0.0, 0.0, 1.0))), 24.0);
      col = col * (1.0 - 0.2 * smoothstep(0.45, 1.0, ml)) + uDrop * ms * (0.08 + lum * 0.6);
    }
  }

  if (mask > 0.001) {
    float slope = length(g);
    vec2 dir = g / max(slope, 0.0001);
    vec3 n = normalize(vec3(-g, 1.0));

    // A dome lens over the sharp street: flipped, with a touch of dispersion
    vec2 off = g * 0.016;
    vec3 inside;
    inside.r = texture(uSharp, safe(uv + off * 1.05)).r;
    inside.g = texture(uSharp, safe(uv + off)).g;
    inside.b = texture(uSharp, safe(uv + off * 0.95)).b;
    inside = mix(inside, dof, 0.15) * mix(1.15, 0.92, uDay);

    // At grazing angles near the rim, water reflects the lit street above
    float fres = pow(1.0 - n.z, 2.2);
    vec3 refl = texture(uDof, safe(uv - g * 0.03 + vec2(0.0, 0.05))).rgb;
    inside = mix(inside, refl * 1.2, fres * 0.55);

    // A dark band where light reflects inside the edge, heaviest below
    float rim = smoothstep(0.9, 2.0, slope);
    float low = 0.55 + 0.45 * max(0.0, dot(dir, vec2(0.35, 0.94)));
    inside *= 1.0 - rim * 0.72 * low;

    // Light passing through gathers in a crescent inside the lower edge
    float cres = smoothstep(0.5, 1.1, slope) * (1.0 - smoothstep(1.1, 1.9, slope)) * pow(max(0.0, dir.y), 2.0);
    inside += uDrop * cres * mix(0.55, 0.25, uDay) * (0.3 + lum);

    // Specular: the street lights above catch on the dome
    float spec = pow(max(0.0, dot(reflect(-key, n), vec3(0.0, 0.0, 1.0))), 90.0);
    vec3 fill = normalize(vec3(0.5, 0.6, 0.62));
    float spec2 = pow(max(0.0, dot(reflect(-fill, n), vec3(0.0, 0.0, 1.0))), 160.0);
    inside += uDrop * (spec * 2.6 + spec2 * 0.7);

    col = mix(col, inside, mask);
  }

  col = aces(col * uExposure);
  // A soft vignette, as if the window frame were just out of view
  vec2 v = uv - 0.5;
  col *= 1.0 - 0.42 * dot(v, v);
  col = pow(col, vec3(1.0 / 2.2));
  // Film grain, faint, and dither against banding
  col += (h21(gl_FragCoord.xy + fract(uTime * 7.0) * 91.0) - 0.5) * 0.018;
  outColor = vec4(col, 1.0);
}`

/** sRGB hex to linear RGB */
function linear(value: string, fallback: [number, number, number]): [number, number, number] {
  const m = value.trim().match(/^#([0-9a-f]{6})$/i)
  if (!m) return fallback
  const n = parseInt(m[1], 16)
  const c = (v: number) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return [c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)]
}

/** Water heights are stored as a fraction of this many canvas px */
const HMAX = 32
/** How long a wiped streak takes to mist over again */
const MIST_MS = 4500

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }

export function NightWindow({ focus = 0 }: { focus?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  // The loop reads the target every frame, so props never rebuild WebGL
  const focusRef = useRef(focus)
  const redrawRef = useRef<() => void>()
  focusRef.current = focus

  useEffect(() => {
    redrawRef.current?.()
  }, [focus])

  useEffect(() => {
    const canvas = ref.current!
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false })
    // HDR needs float render targets; without them the static gradient stays
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) {
      canvas.style.display = 'none'
      return
    }

    const compile = (vert: string, frag: string) => {
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('night-window shader', gl.getShaderInfoLog(s))
        return s
      }
      const prog = gl.createProgram()!
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert))
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag))
      // Every quad shader reads aPos from location 0, so one vertex array serves all
      gl.bindAttribLocation(prog, 0, 'aPos')
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('night-window link failed', gl.getProgramInfoLog(prog))
        return null
      }
      return prog
    }
    const sceneProg = compile(QUAD_VERT, SCENE_FRAG)
    const prefilterProg = compile(QUAD_VERT, blurFrag(24))
    const dofProg = compile(QUAD_VERT, blurFrag(110))
    const mistProg = compile(QUAD_VERT, blurFrag(48))
    const spriteProg = compile(SPRITE_VERT, SPRITE_FRAG)
    const fillProg = compile(QUAD_VERT, FILL_FRAG)
    const compProg = compile(QUAD_VERT, COMPOSITE_FRAG)
    if (!sceneProg || !prefilterProg || !dofProg || !mistProg || !spriteProg || !fillProg || !compProg) {
      canvas.style.display = 'none'
      return
    }

    const uni = (prog: WebGLProgram) => {
      const cache = new Map<string, WebGLUniformLocation | null>()
      return (name: string) => {
        if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name))
        return cache.get(name)!
      }
    }
    const S = uni(sceneProg)
    const C = uni(compProg)
    const Fl = uni(fillProg)
    const blurUni = new Map([prefilterProg, dofProg, mistProg].map((p) => [p, uni(p)]))

    // A fullscreen quad and the sprite buffer, each with its own vertex array
    const quadVao = gl.createVertexArray()
    gl.bindVertexArray(quadVao)
    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const spriteVao = gl.createVertexArray()
    gl.bindVertexArray(spriteVao)
    const sprites = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, sprites)
    const stride = 7 * 4
    const spriteAttr = (name: string, n: number, off: number) => {
      const loc = gl.getAttribLocation(spriteProg, name)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, n, gl.FLOAT, false, stride, off)
    }
    spriteAttr('aPos', 2, 0)
    spriteAttr('aLocal', 2, 8)
    spriteAttr('aInfo', 3, 16)
    gl.bindVertexArray(null)

    const target = (w: number, h: number, float: boolean): Target => {
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      const fbo = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return { tex, fbo, w, h }
    }
    const free = (t?: Target) => {
      if (!t) return
      gl.deleteTexture(t.tex)
      gl.deleteFramebuffer(t.fbo)
    }
    let sceneT: Target | undefined
    let preT: Target | undefined
    let dofT: Target | undefined
    let mistyT: Target | undefined
    let waterT: Target | undefined
    let wipeT: Target | undefined

    const host = canvas.parentElement!
    const look = { exposure: 1, blur: 12, day: 0 }
    const theme = () => {
      const s = getComputedStyle(host)
      const v = (k: string) => s.getPropertyValue(k)
      const num = (k: string, d: number) => {
        const n = parseFloat(v(k))
        return Number.isFinite(n) ? n : d
      }
      gl.useProgram(sceneProg)
      gl.uniform3fv(S('uSkyTop'), linear(v('--night-sky-top'), [0.002, 0.003, 0.008]))
      gl.uniform3fv(S('uSkyHorizon'), linear(v('--night-sky-horizon'), [0.05, 0.03, 0.025]))
      gl.uniform3fv(S('uGround'), linear(v('--night-ground'), [0.004, 0.005, 0.007]))
      gl.uniform3fv(S('uBuilding'), linear(v('--night-building'), [0.006, 0.007, 0.012]))
      gl.uniform3fv(S('uWarm'), linear(v('--night-warm'), [1, 0.45, 0.12]))
      gl.uniform3fv(S('uWhite'), linear(v('--night-white'), [1, 0.86, 0.7]))
      gl.uniform3fv(S('uCool'), linear(v('--night-cool'), [0.4, 0.58, 1]))
      gl.uniform3fv(S('uRed'), linear(v('--night-red'), [1, 0.05, 0.03]))
      gl.uniform3fv(S('uNeonA'), linear(v('--night-neon-a'), [1, 0.08, 0.37]))
      gl.uniform3fv(S('uNeonB'), linear(v('--night-neon-b'), [0.04, 0.75, 0.64]))
      gl.uniform1f(S('uLamp'), num('--night-lamp', 1))
      gl.uniform1f(S('uWindows'), num('--night-windows', 1))
      gl.useProgram(compProg)
      gl.uniform3fv(C('uDrop'), linear(v('--night-drop'), [0.62, 0.74, 1]))
      gl.uniform3fv(C('uHaze'), linear(v('--night-haze'), [0.012, 0.017, 0.035]))
      look.exposure = num('--night-exposure', 1)
      look.blur = num('--night-blur', 12)
      look.day = num('--night-day', 0)
      gl.uniform1f(C('uDay'), look.day)
    }

    const sim = new RainSim()
    let dpr = 1
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr))
      for (const t of [sceneT, preT, dofT, mistyT, waterT, wipeT]) free(t)
      const hw = Math.max(1, Math.round(canvas.width / 2))
      const hh = Math.max(1, Math.round(canvas.height / 2))
      sceneT = target(hw, hh, true)
      preT = target(hw, hh, true)
      dofT = target(hw, hh, true)
      mistyT = target(Math.max(1, Math.round(hw / 2)), Math.max(1, Math.round(hh / 2)), true)
      waterT = target(canvas.width, canvas.height, true)
      wipeT = target(hw, hh, false)
      sim.resize(canvas.clientWidth, canvas.clientHeight)
    }

    // Pointer parallax: near layers shift more than far ones
    const pointer = { x: 0, y: 0 }
    const parallax = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    // Every bead and drop as a quad: 6 vertices of pos(2) local(2) info(3)
    let verts = new Float32Array(0)
    const corners = [
      [-1, -1], [1, -1], [-1, 1],
      [-1, 1], [1, -1], [1, 1],
    ]
    const drawSprites = (list: { x: number; y: number; r: number; seed: number; moving: boolean }[], ampScale: number) => {
      if (!list.length) return
      const need = list.length * 42
      if (verts.length < need) verts = new Float32Array(need * 1.5)
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      let o = 0
      for (const w of list) {
        const stretch = w.moving ? 1.12 : 1
        const amp = Math.min(1, (w.r * dpr * ampScale) / HMAX)
        const pad = 1.2
        const sx = ((w.r * pad) / W) * 2
        const sy = ((w.r * pad * stretch) / H) * 2
        const cx = (w.x / W) * 2 - 1
        const cy = 1 - (w.y / H) * 2
        for (const [ux, uy] of corners) {
          verts[o++] = cx + ux * sx
          verts[o++] = cy + uy * sy
          verts[o++] = ux * pad
          verts[o++] = uy * pad * stretch
          verts[o++] = amp
          verts[o++] = w.seed
          verts[o++] = stretch
        }
      }
      gl.useProgram(spriteProg)
      gl.bindVertexArray(spriteVao)
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites)
      gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, o), gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.TRIANGLES, 0, o / 7)
      gl.bindVertexArray(quadVao)
    }

    const runBlur = (prog: WebGLProgram, src: Target, dst: Target, radius: number, hot: number) => {
      const B = blurUni.get(prog)!
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo)
      gl.viewport(0, 0, dst.w, dst.h)
      gl.useProgram(prog)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, src.tex)
      gl.uniform1i(B('uSrc'), 0)
      gl.uniform2f(B('uTexel'), 1 / src.w, 1 / src.h)
      gl.uniform1f(B('uRadius'), radius)
      gl.uniform1f(B('uHot'), hot)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const start = performance.now()
    let last = start
    let shown = focusRef.current
    let raf = 0

    const draw = (now: number) => {
      if (!sceneT || !preT || !dofT || !mistyT || !waterT || !wipeT) return
      const dt = Math.min(100, now - last)
      last = now
      const still = reduce.matches
      // Refocusing eases like an eye adjusting; parallax trails the pointer
      shown = still ? focusRef.current : shown + (focusRef.current - shown) * (1 - Math.exp(-dt / 260))
      if (!still) {
        const k = 1 - Math.exp(-dt / 350)
        parallax.x += (pointer.x - parallax.x) * k
        parallax.y += (pointer.y - parallax.y) * k
      }
      const t = still ? 40 : 40 + (now - start) / 1000
      gl.bindVertexArray(quadVao)
      gl.disable(gl.BLEND)

      // The street, sharp and in linear light
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneT.fbo)
      gl.viewport(0, 0, sceneT.w, sceneT.h)
      gl.useProgram(sceneProg)
      gl.uniform2f(S('uRes'), sceneT.w, sceneT.h)
      gl.uniform1f(S('uTime'), t)
      gl.uniform2f(S('uParallax'), parallax.x, -parallax.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      // Soften pinpoint lights first so the lens blur never speckles, then
      // throw the street out of focus, then blur it again for the mist
      const r = (look.blur * dpr) / 2
      runBlur(prefilterProg, sceneT, preT, 2.5 * dpr, 0)
      runBlur(dofProg, preT, dofT, r * (1 - 0.8 * shown), look.day > 0.5 ? 0.4 : 1)
      runBlur(mistProg, dofT, mistyT, r * 0.55, 0.3)

      if (!still) sim.step(dt)

      // Water: every bead and drop as a dome; overlaps add up and merge
      gl.bindFramebuffer(gl.FRAMEBUFFER, waterT.fbo)
      gl.viewport(0, 0, waterT.w, waterT.h)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendEquation(gl.FUNC_ADD)
      gl.blendFunc(gl.ONE, gl.ONE)
      drawSprites(sim.beads, 1)
      drawSprites(sim.drops, 1)

      // Wiped streaks fade back a little every frame, then this frame's
      // sliding drops wipe the glass again
      gl.bindFramebuffer(gl.FRAMEBUFFER, wipeT.fbo)
      gl.viewport(0, 0, wipeT.w, wipeT.h)
      gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)
      gl.useProgram(fillProg)
      const fade = still ? 0 : Math.max(1 / 255, dt / MIST_MS)
      gl.uniform4f(Fl('uColor'), fade, fade, fade, fade)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.blendEquation(gl.FUNC_ADD)
      drawSprites(
        sim.stamps.map((s) => ({ ...s, seed: 0.5, moving: false })),
        HMAX / Math.max(1, 8 * dpr),
      )
      gl.disable(gl.BLEND)

      // Composite the glass
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(compProg)
      const bind = (unit: number, tex: WebGLTexture, name: string) => {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.uniform1i(C(name), unit)
      }
      bind(0, preT.tex, 'uSharp')
      bind(1, dofT.tex, 'uDof')
      bind(2, mistyT.tex, 'uMisty')
      bind(3, waterT.tex, 'uWater')
      bind(4, wipeT.tex, 'uWipe')
      gl.uniform2f(C('uTexel'), 1 / waterT.w, 1 / waterT.h)
      gl.uniform1f(C('uHmax'), HMAX)
      gl.uniform1f(C('uTime'), t)
      gl.uniform1f(C('uFocus'), shown)
      gl.uniform1f(C('uExposure'), look.exposure)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.activeTexture(gl.TEXTURE0)
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      draw(now)
    }
    // Off screen, the window stops drawing entirely
    let visible = true
    const restart = () => {
      cancelAnimationFrame(raf)
      if (!visible) return
      if (reduce.matches) draw(performance.now())
      else {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        restart()
      },
      { rootMargin: '100px' },
    )
    io.observe(canvas)
    redrawRef.current = () => reduce.matches && draw(performance.now())

    theme()
    size()
    restart()

    const ro = new ResizeObserver(() => {
      size()
      draw(performance.now())
    })
    ro.observe(canvas)
    const mo = new MutationObserver(() => {
      theme()
      draw(performance.now())
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    reduce.addEventListener('change', restart)

    return () => {
      cancelAnimationFrame(raf)
      redrawRef.current = undefined
      io.disconnect()
      ro.disconnect()
      mo.disconnect()
      reduce.removeEventListener('change', restart)
      window.removeEventListener('pointermove', onPointer)
      for (const t of [sceneT, preT, dofT, mistyT, waterT, wipeT]) free(t)
    }
  }, [])

  return <canvas ref={ref} className='rainy-window-canvas' aria-hidden='true' />
}
