/* A slime mould on the GPU, routed by an agent's tool calls. Agents live in a
   float texture (x, y, heading, target node). Each step they sense the trail
   ahead, steer, nudge toward their target, and move; then every agent deposits
   a point of trail and the trail blurs and decays. On reaching a node an agent
   picks its next stop by the weights of that node's children, so the traffic
   on a route is the share of calls that went down it. */

/** A flake on the map. `parent` is null only for the root. */
export type GraphNode = { id: string; x: number; y: number; parent: string | null; size: number }

export type Food = {
  id: string
  x: number
  y: number
  /** Eased 0–1 so a flake grows in */
  presence: number
  phase: number
  parent: Food | null
  weight: number
  size: number
  /** Decaying bump in radius, set when a call lands */
  pulse: number
}

export type GraphOptions = {
  root: GraphNode
  onFrame: (dt: number, nodes: readonly Food[], cssW: number, cssH: number) => void
}

const MAX_NODES = 10
const STEP_MS = 1000 / 60
const TAU = Math.PI * 2
const DEG = Math.PI / 180

const SIDE = 512
/** Canvas area that gets the full colony; smaller canvases get proportionally fewer agents */
const FULL_AREA = 900 * 900

const SIM = {
  angle: 20 * DEG,
  reach: 26,
  turn: 12 * DEG,
  speed: 1.6,
  pull: 4 * DEG,
  decay: 0.95,
  diffuse: 0.65,
  wander: 0.05,
  crowd: 110,
  /** How strongly agents idle at the root, against the summed tool weights */
  stay: 1.5,
  deposit: 0.3,
}

const VERT_FULL = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`

const FRAG_AGENTS = `#version 300 es
precision highp float;
uniform sampler2D uAgents, uTrail;
uniform vec2 uSize;
uniform vec2 uFood[${MAX_NODES}];
uniform int uCount;
uniform float uAngle, uReach, uTurn, uSpeed, uPull, uWander, uCrowd, uArrive, uFrame;
uniform float uParent[${MAX_NODES}], uWeight[${MAX_NODES}];
uniform float uStay;
out vec4 o;

float rnd(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float route(int t, float r) {
  float kids = 0.;
  for (int i = 0; i < uCount; i++)
    if (int(uParent[i]) == t) kids += uWeight[i];
  bool root = uParent[t] < 0.;
  float home = root ? uStay : .02 + .35 * kids;
  float x = r * (home + kids);
  if (x < home) return root ? float(t) : uParent[t];
  x -= home;
  for (int i = 0; i < uCount; i++) {
    if (int(uParent[i]) != t) continue;
    if (x < uWeight[i]) return float(i);
    x -= uWeight[i];
  }
  return float(t);
}

float sense(vec2 p, float a) {
  float v = texture(uTrail, (p + uReach * vec2(cos(a), sin(a))) / uSize).r;
  // Peaks at uCrowd: past it agents spread, so veins keep their width
  return v / (1. + v * v / (uCrowd * uCrowd));
}

void main() {
  vec2 id = gl_FragCoord.xy;
  vec4 a = texelFetch(uAgents, ivec2(id), 0);
  vec2 p = a.xy;
  float h = a.z;
  float target = mod(a.w, float(uCount));
  float r1 = rnd(id + fract(uFrame * .61803) * 997.);
  float r2 = rnd(id.yx + fract(uFrame * .32471) * 613.);

  vec2 to = uFood[int(target)] - p;
  bool commuter = rnd(id * .73) >= uWander;
  float off = atan(to.y, to.x) - h;
  off = atan(sin(off), cos(off));
  // A route has to die when its traffic stops. An agent facing away from its
  // target stops reading trails, or trunks feed themselves forever.
  bool follow = !commuter || abs(off) < 1.1;

  if (follow) {
    float F = sense(p, h);
    float L = sense(p, h + uAngle);
    float R = sense(p, h - uAngle);
    float turn = uTurn * (.6 + .8 * r1);
    if (F > L && F > R) {
    } else if (F < L && F < R) {
      h += r2 < .5 ? turn : -turn;
    } else if (L > R) {
      h += turn;
    } else if (R > L) {
      h -= turn;
    }
  }

  if (commuter) {
    float diff = atan(to.y, to.x) - h;
    diff = atan(sin(diff), cos(diff));
    // Up close the food wins over the trail, or trunks capture agents and
    // veins stop short of the flake they were heading for
    float near = 1. - smoothstep(0., uArrive * 10., length(to));
    float reach = uPull * (1. + 14. * near * near);
    if (!follow) reach = max(reach, .35);
    h += clamp(diff, -reach, reach) * (.45 + .55 * rnd(id * 1.37));
  }

  p += uSpeed * vec2(cos(h), sin(h));

  if (dot(to, to) < uArrive * uArrive) {
    float next = route(int(target), rnd(id * .91 + fract(uFrame * .1547) * 431.));
    // Leave already pointed at the next stop, or arrivals spray out in a fan
    vec2 way = uFood[int(next)] - p;
    h = next == target ? r2 * ${TAU.toFixed(6)} : atan(way.y, way.x) + (r2 - .5) * .9;
    target = next;
  }

  if (p.x < 1. || p.y < 1. || p.x > uSize.x - 1. || p.y > uSize.y - 1.) {
    p = clamp(p, vec2(1.), uSize - 1.);
    h = r2 * ${TAU.toFixed(6)};
  }

  o = vec4(p, mod(h, ${TAU.toFixed(6)}), target);
}`

const VERT_DEPOSIT = `#version 300 es
uniform sampler2D uAgents;
uniform int uSide;
uniform vec2 uSize;
void main() {
  vec2 p = texelFetch(uAgents, ivec2(gl_VertexID % uSide, gl_VertexID / uSide), 0).xy;
  gl_Position = vec4(p / uSize * 2. - 1., 0., 1.);
  gl_PointSize = 1.;
}`

const FRAG_DEPOSIT = `#version 300 es
precision highp float;
uniform float uAmount;
out vec4 o;
void main() { o = vec4(uAmount); }`

const FRAG_DIFFUSE = `#version 300 es
precision highp float;
uniform sampler2D uTrail;
uniform float uDecay, uDiffuse;
out float o;
void main() {
  // Four bilinear taps on the texel corners make a 3×3 tent for under half the reads
  vec2 s = vec2(textureSize(uTrail, 0));
  vec2 uv = gl_FragCoord.xy / s;
  vec2 e = .5 / s;
  float sum = texture(uTrail, uv + e).r + texture(uTrail, uv - e).r
            + texture(uTrail, uv + vec2(e.x, -e.y)).r + texture(uTrail, uv + vec2(-e.x, e.y)).r;
  o = mix(texture(uTrail, uv).r, sum * .25, uDiffuse) * uDecay;
}`

const FRAG_RENDER = `#version 300 es
precision highp float;
uniform sampler2D uTrail;
uniform vec2 uRes;
uniform vec3 uBg, uMid, uHot, uFoodColor;
uniform vec4 uNodes[${MAX_NODES}];
uniform int uNodeCount;
uniform float uGain, uRef;
out vec4 o;

float rnd(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float v = max(texture(uTrail, uv).r, 0.);
  float t = clamp(log(1. + v * uGain) / log(1. + uRef * uGain), 0., 1.);
  vec3 c = mix(uBg, uMid, smoothstep(.04, .62, t));
  c = mix(c, uHot, smoothstep(.55, 1., t));

  for (int i = 0; i < uNodeCount; i++) {
    vec4 n = uNodes[i];
    if (n.z <= 0.) continue;
    vec2 d = gl_FragCoord.xy - n.xy;
    float a = atan(d.y, d.x);
    // Lumpy like an oat flake, each one different
    float r = n.z * (1. + .1 * sin(a * 3. + n.w) + .06 * sin(a * 5. - n.w * 2.));
    c = mix(c, uFoodColor, smoothstep(1., -1., length(d) - r));
  }

  c += (rnd(gl_FragCoord.xy) - .5) / 255.;
  o = vec4(c, 1.);
}`

type Palette = { bg: number[]; mid: number[]; hot: number[]; food: number[] }

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

const DARK: Palette = {
  bg: hex('#0e0e0e'),
  mid: hex('#94600f'),
  hot: hex('#ffdc5e'),
  food: hex('#f6eedb'),
}
const LIGHT: Palette = {
  bg: hex('#ffffff'),
  mid: hex('#ecb62a'),
  hot: hex('#6b4307'),
  food: hex('#241a0e'),
}

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    gl.attachShader(prog, s)
    gl.deleteShader(s)
  }
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
  const cache = new Map<string, WebGLUniformLocation | null>()
  return {
    prog,
    u(name: string) {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name))
      return cache.get(name)!
    },
  }
}

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer }

export class RunMapEngine {
  private gl: WebGL2RenderingContext
  private vao: WebGLVertexArrayObject
  private pAgents
  private pDeposit
  private pDiffuse
  private pRender
  private agents: [Target, Target]
  private trail: [Target, Target] | null = null
  /** Rows the canvas size calls for, and the rows still running after any quality cuts */
  private baseRows = SIDE
  private rows = SIDE

  private W = 1
  private H = 1
  private cssW = 1
  private cssH = 1
  private dpr = 1
  private unit = 1

  private foods: Food[]
  private press: { food: Food; x: number; y: number; moved: boolean } | null = null
  private hover: Food | null = null

  private frame = 0
  private raf = 0
  private last = 0
  private acc = 0
  private slowSum = 0
  private slowN = 0
  private seen = 0
  private dirty = true
  private colors: Palette
  private palette: Palette
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  private foodBuf = new Float32Array(MAX_NODES * 2)
  private parentBuf = new Float32Array(MAX_NODES)
  private weightBuf = new Float32Array(MAX_NODES)
  private nodeBuf = new Float32Array(MAX_NODES * 4)
  private ro: ResizeObserver
  private mo: MutationObserver
  private resizeTimer = 0

  constructor(
    private canvas: HTMLCanvasElement,
    private graph: GraphOptions,
  ) {
    this.foods = []
    this.foods = [this.makeNode(graph.root)]
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('WebGL2 float targets unavailable')
    this.gl = gl
    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)
    gl.disable(gl.DEPTH_TEST)

    this.pAgents = compile(gl, VERT_FULL, FRAG_AGENTS)
    this.pDeposit = compile(gl, VERT_DEPOSIT, FRAG_DEPOSIT)
    this.pDiffuse = compile(gl, VERT_FULL, FRAG_DIFFUSE)
    this.pRender = compile(gl, VERT_FULL, FRAG_RENDER)

    this.palette = this.readTheme()
    this.colors = {
      bg: [...this.palette.bg],
      mid: [...this.palette.mid],
      hot: [...this.palette.hot],
      food: [...this.palette.food],
    }

    this.agents = [this.makeAgentTarget(), this.makeAgentTarget()]
    this.allocate()

    this.ro = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = window.setTimeout(() => this.resized(), 180)
    })
    this.ro.observe(canvas)
    this.mo = new MutationObserver(() => {
      this.palette = this.readTheme()
      this.dirty = true
    })
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointercancel', this.onCancel)
    canvas.addEventListener('pointerleave', this.onLeave)
    canvas.addEventListener('touchstart', this.onTouch, { passive: false })
  }

  private readTheme() {
    return document.documentElement.classList.contains('dark') ? DARK : LIGHT
  }

  private makeAgentTarget(): Target {
    const { gl } = this
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, SIDE, SIDE, 0, gl.RGBA, gl.FLOAT, null)
    return this.wrap(tex)
  }

  private makeTrailTarget(): Target {
    const { gl, W, H } = this
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, W, H, 0, gl.RED, gl.HALF_FLOAT, null)
    return this.wrap(tex)
  }

  private wrap(tex: WebGLTexture): Target {
    const { gl } = this
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return { tex, fbo }
  }

  private freeTarget(t: Target) {
    this.gl.deleteTexture(t.tex)
    this.gl.deleteFramebuffer(t.fbo)
  }

  /** Sizes everything to the canvas. An existing trail is carried over so a resize doesn't blank the map. */
  private allocate() {
    const { canvas, gl } = this
    const rect = canvas.getBoundingClientRect()
    this.cssW = Math.max(1, rect.width)
    this.cssH = Math.max(1, rect.height)
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(this.cssW * this.dpr)
    canvas.height = Math.round(this.cssH * this.dpr)

    const scale = Math.min(1.25, 1800 / Math.max(this.cssW, this.cssH))
    const oldW = this.W
    const oldH = this.H
    this.W = Math.max(64, Math.round(this.cssW * scale))
    this.H = Math.max(64, Math.round(this.cssH * scale))
    this.unit = Math.max(0.6, Math.min(this.W, this.H) / 800)
    this.baseRows = Math.max(SIDE >> 3, Math.min(SIDE, Math.round((SIDE * this.W * this.H) / FULL_AREA)))
    this.rows = this.baseRows

    const old = this.trail
    this.trail = [this.makeTrailTarget(), this.makeTrailTarget()]
    this.seed()
    if (old) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, old[0].fbo)
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.trail[0].fbo)
      gl.blitFramebuffer(0, 0, oldW, oldH, 0, 0, this.W, this.H, gl.COLOR_BUFFER_BIT, gl.LINEAR)
      old.forEach((t) => this.freeTarget(t))
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  private resized() {
    const rect = this.canvas.getBoundingClientRect()
    if (Math.abs(rect.width - this.cssW) < 1 && Math.abs(rect.height - this.cssH) < 1) return
    this.allocate()
  }

  /** Every agent starts on a flake, so the network grows out of them */
  private seed() {
    const { gl, W, H, foods } = this
    const data = new Float32Array(SIDE * SIDE * 4)
    const spread = 7 * this.unit
    for (let i = 0; i < SIDE * SIDE; i++) {
      const home = i % foods.length
      const a = Math.random() * TAU
      const r = Math.sqrt(Math.random()) * spread
      data[i * 4] = foods[home].x * W + Math.cos(a) * r
      data[i * 4 + 1] = foods[home].y * H + Math.sin(a) * r
      data[i * 4 + 2] = Math.random() * TAU
      data[i * 4 + 3] = home
    }
    gl.bindTexture(gl.TEXTURE_2D, this.agents[0].tex)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SIDE, SIDE, gl.RGBA, gl.FLOAT, data)
    for (const t of this.trail!) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    this.frame = 0
    this.dirty = true
  }

  private makeNode(n: GraphNode): Food {
    return {
      id: n.id,
      x: n.x,
      y: n.y,
      presence: 0,
      phase: this.foods.length * 2.1,
      parent: this.foods.find((f) => f.id === n.parent) ?? null,
      weight: 0,
      size: n.size,
      pulse: 0,
    }
  }

  private find(id: string) {
    return this.foods.find((f) => f.id === id)
  }

  addNode(n: GraphNode) {
    if (this.foods.length >= MAX_NODES || this.find(n.id)) return
    this.foods.push(this.makeNode(n))
    this.dirty = true
  }

  setWeight(id: string, weight: number) {
    const f = this.find(id)
    if (f) f.weight = weight
  }

  setSize(id: string, size: number) {
    const f = this.find(id)
    if (f) f.size = size
  }

  pulse(id: string) {
    const f = this.find(id)
    if (f) f.pulse = 1
  }

  /** Move a flake by CSS pixels, for the keyboard */
  nudge(id: string, dx: number, dy: number) {
    const f = this.find(id)
    if (!f) return
    this.place(f, f.x * this.cssW + dx, (1 - f.y) * this.cssH + dy)
    this.dirty = true
  }

  /** Back to the root alone, with every agent gathered on it */
  restart() {
    this.foods = this.foods.slice(0, 1)
    this.foods[0].weight = 0
    this.seed()
  }

  /** Runs only while on screen; nothing is spent on a demo nobody can see */
  setActive(on: boolean) {
    if (on === (this.raf !== 0)) return
    if (on) {
      this.last = 0
      this.raf = requestAnimationFrame(this.tick)
    } else {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
  }

  private step() {
    const { gl, W, H, rows, unit, foods } = this
    const trail = this.trail!
    for (let i = 0; i < MAX_NODES; i++) {
      const f = foods[i]
      this.foodBuf[i * 2] = f ? f.x * W : 0
      this.foodBuf[i * 2 + 1] = f ? f.y * H : 0
      this.parentBuf[i] = f?.parent ? foods.indexOf(f.parent) : -1
      this.weightBuf[i] = f ? f.weight : 0
    }

    // Only the rows still in play are stepped, so quality can drop without a reseed
    const a = this.pAgents
    gl.useProgram(a.prog)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.agents[1].fbo)
    gl.viewport(0, 0, SIDE, SIDE)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(0, 0, SIDE, rows)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.agents[0].tex)
    gl.uniform1i(a.u('uAgents'), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, trail[0].tex)
    gl.uniform1i(a.u('uTrail'), 1)
    gl.uniform2f(a.u('uSize'), W, H)
    gl.uniform2fv(a.u('uFood'), this.foodBuf)
    gl.uniform1i(a.u('uCount'), foods.length)
    gl.uniform1f(a.u('uStay'), SIM.stay)
    gl.uniform1fv(a.u('uParent'), this.parentBuf)
    gl.uniform1fv(a.u('uWeight'), this.weightBuf)
    gl.uniform1f(a.u('uAngle'), SIM.angle)
    gl.uniform1f(a.u('uReach'), SIM.reach * unit)
    gl.uniform1f(a.u('uTurn'), SIM.turn)
    gl.uniform1f(a.u('uSpeed'), SIM.speed * unit)
    gl.uniform1f(a.u('uPull'), SIM.pull)
    gl.uniform1f(a.u('uWander'), SIM.wander)
    gl.uniform1f(a.u('uCrowd'), SIM.crowd)
    gl.uniform1f(a.u('uArrive'), 12 * unit)
    gl.uniform1f(a.u('uFrame'), this.frame % 100000)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.disable(gl.SCISSOR_TEST)
    this.agents.reverse()

    const d = this.pDeposit
    gl.useProgram(d.prog)
    gl.bindFramebuffer(gl.FRAMEBUFFER, trail[0].fbo)
    gl.viewport(0, 0, W, H)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.agents[0].tex)
    gl.uniform1i(d.u('uAgents'), 0)
    gl.uniform1i(d.u('uSide'), SIDE)
    gl.uniform2f(d.u('uSize'), W, H)
    gl.uniform1f(d.u('uAmount'), (this.baseRows / rows) * SIM.deposit)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.drawArrays(gl.POINTS, 0, SIDE * rows)
    gl.disable(gl.BLEND)

    const b = this.pDiffuse
    gl.useProgram(b.prog)
    gl.bindFramebuffer(gl.FRAMEBUFFER, trail[1].fbo)
    gl.bindTexture(gl.TEXTURE_2D, trail[0].tex)
    gl.uniform1i(b.u('uTrail'), 0)
    gl.uniform1f(b.u('uDecay'), SIM.decay)
    gl.uniform1f(b.u('uDiffuse'), SIM.diffuse)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    trail.reverse()
    this.frame++
  }

  private draw() {
    const { gl, canvas, colors, dpr } = this
    this.foods.forEach((f, n) => {
      const hover = f === this.hover || f === this.press?.food
      this.nodeBuf[n * 4] = f.x * canvas.width
      this.nodeBuf[n * 4 + 1] = f.y * canvas.height
      this.nodeBuf[n * 4 + 2] = (f.size + (hover ? 2 : 0) + f.pulse * 3) * dpr * f.presence
      this.nodeBuf[n * 4 + 3] = f.phase
    })
    const r = this.pRender
    gl.useProgram(r.prog)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.trail![0].tex)
    gl.uniform1i(r.u('uTrail'), 0)
    gl.uniform2f(r.u('uRes'), canvas.width, canvas.height)
    gl.uniform3fv(r.u('uBg'), colors.bg)
    gl.uniform3fv(r.u('uMid'), colors.mid)
    gl.uniform3fv(r.u('uHot'), colors.hot)
    gl.uniform3fv(r.u('uFoodColor'), colors.food)
    gl.uniform4fv(r.u('uNodes'), this.nodeBuf)
    gl.uniform1i(r.u('uNodeCount'), this.foods.length)
    gl.uniform1f(r.u('uGain'), 0.6)
    gl.uniform1f(r.u('uRef'), SIM.crowd * 3)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  private ease(dt: number) {
    const reduced = this.reduced
    const k = reduced ? 1 : 1 - Math.exp(-dt / 90)
    const fade = reduced ? 0 : Math.exp(-dt / 240)
    for (const f of this.foods) {
      f.presence += (1 - f.presence) * k
      f.pulse *= fade
    }
    const c = reduced ? 1 : 1 - Math.exp(-dt / 110)
    for (const key of ['bg', 'mid', 'hot', 'food'] as const)
      for (let i = 0; i < 3; i++) this.colors[key][i] += (this.palette[key][i] - this.colors[key][i]) * c
  }

  private adapt(dt: number) {
    // A gap this long is a backgrounded tab and says nothing about the GPU
    if (dt > 2000 || ++this.seen < 4) return
    this.slowSum += dt
    this.slowN++
    // Judge on elapsed time, so a very slow machine still gets a verdict quickly
    if (this.slowSum < 600) return
    const avg = this.slowSum / this.slowN
    const floor = Math.min(this.baseRows, SIDE >> 3)
    if (avg > 24 && this.rows > floor) {
      // The further off budget, the bigger the cut, bounded so one hitch can't gut it
      const cut = Math.max(0.5, Math.min(0.85, 18 / avg))
      this.rows = Math.max(floor, Math.floor(this.rows * cut))
    }
    this.slowSum = 0
    this.slowN = 0
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = this.last ? now - this.last : STEP_MS
    this.last = now
    this.ease(dt)
    this.graph.onFrame(dt, this.foods, this.cssW, this.cssH)

    if (this.reduced) {
      // No growth to watch: bake the settled network, move only under the hand
      if (this.press) this.step()
      else if (this.dirty) for (let i = 0; i < 240; i++) this.step()
      this.dirty = false
      this.draw()
      return
    }

    this.adapt(dt)
    this.acc += Math.min(dt, 50)
    let steps = 0
    // Catching up on a slow frame only makes the next one slower
    const maxSteps = dt < 40 ? 2 : 1
    while (this.acc >= STEP_MS && steps < maxSteps) {
      this.step()
      this.acc -= STEP_MS
      steps++
    }
    if (this.acc >= STEP_MS) this.acc = 0
    this.draw()
  }

  private pointer(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  private hit(x: number, y: number) {
    let best: Food | null = null
    let bestD = 22 * 22
    for (const f of this.foods) {
      const dx = f.x * this.cssW - x
      const dy = (1 - f.y) * this.cssH - y
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = f
      }
    }
    return best
  }

  private place(f: Food, x: number, y: number) {
    const m = 20
    f.x = Math.min(this.cssW - m, Math.max(m, x)) / this.cssW
    f.y = 1 - Math.min(this.cssH - m, Math.max(m, y)) / this.cssH
  }

  private setCursor() {
    this.canvas.style.cursor = this.press ? 'grabbing' : this.hover ? 'grab' : 'default'
  }

  private onDown = (e: PointerEvent) => {
    const { x, y } = this.pointer(e)
    const food = this.hit(x, y)
    if (!food) return
    this.canvas.setPointerCapture(e.pointerId)
    this.press = { food, x, y, moved: false }
    this.setCursor()
  }

  private onMove = (e: PointerEvent) => {
    const { x, y } = this.pointer(e)
    const p = this.press
    if (p) {
      if (Math.hypot(x - p.x, y - p.y) > 4) p.moved = true
      if (p.moved) this.place(p.food, x, y)
    } else {
      this.hover = this.hit(x, y)
    }
    this.setCursor()
  }

  private onUp = () => {
    this.press = null
    this.dirty = true
    this.setCursor()
  }

  private onCancel = () => {
    this.press = null
    this.setCursor()
  }

  private onLeave = () => {
    this.hover = null
  }

  /** A touch on a flake drags it; a touch anywhere else scrolls the page as usual */
  private onTouch = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    const r = this.canvas.getBoundingClientRect()
    if (this.hit(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top)) e.preventDefault()
  }

  dispose() {
    this.setActive(false)
    clearTimeout(this.resizeTimer)
    this.ro.disconnect()
    this.mo.disconnect()
    const { canvas, gl } = this
    canvas.removeEventListener('pointerdown', this.onDown)
    canvas.removeEventListener('pointermove', this.onMove)
    canvas.removeEventListener('pointerup', this.onUp)
    canvas.removeEventListener('pointercancel', this.onCancel)
    canvas.removeEventListener('pointerleave', this.onLeave)
    canvas.removeEventListener('touchstart', this.onTouch)
    ;[...this.agents, ...this.trail!].forEach((t) => this.freeTarget(t))
    for (const p of [this.pAgents, this.pDeposit, this.pDiffuse, this.pRender]) gl.deleteProgram(p.prog)
    gl.deleteVertexArray(this.vao)
  }
}
