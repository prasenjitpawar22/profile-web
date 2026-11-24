// A tiny scanner: enough to colour TypeScript the way an editor would,
// one class per character.

export const enum C {
  Ident,
  Keyword,
  String,
  Number,
  Comment,
  Func,
  Type,
  Punct,
  Space,
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'function', 'export', 'import',
  'from', 'new', 'continue', 'break', 'type', 'true', 'false', 'null', 'undefined', 'typeof',
  'as', 'default', 'of', 'in', 'this', 'class', 'extends', 'switch', 'case', 'void',
])

export type Code = { lines: string[]; cls: Uint8Array[] }

export function tokenize(raw: string): Code {
  const src = raw.replace(/\t/g, '  ').replace(/\r/g, '')
  const n = src.length
  const out = new Uint8Array(n)
  const isId = (c: string) => /[A-Za-z0-9_$]/.test(c)
  let i = 0
  while (i < n) {
    const c = src[i]
    const start = i
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++
      out.fill(C.Comment, start, i)
    } else if (c === '/' && src[i + 1] === '*') {
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++
      i = Math.min(n, i + 2)
      out.fill(C.Comment, start, i)
    } else if (c === "'" || c === '"' || c === '`') {
      i++
      while (i < n && src[i] !== c && !(c !== '`' && src[i] === '\n')) i += src[i] === '\\' ? 2 : 1
      i = Math.min(n, i + 1)
      out.fill(C.String, start, i)
    } else if (/[0-9]/.test(c) && !isId(src[i - 1] ?? ' ')) {
      while (i < n && /[0-9a-fA-Fx._]/.test(src[i])) i++
      out.fill(C.Number, start, i)
    } else if (/[A-Za-z_$]/.test(c)) {
      while (i < n && isId(src[i])) i++
      const word = src.slice(start, i)
      let j = i
      while (src[j] === ' ') j++
      const cls = KEYWORDS.has(word) ? C.Keyword : src[j] === '(' ? C.Func : /^[A-Z]/.test(word) ? C.Type : C.Ident
      out.fill(cls, start, i)
    } else {
      out[i] = /\s/.test(c) ? C.Space : C.Punct
      i++
    }
  }
  const lines: string[] = []
  const cls: Uint8Array[] = []
  let s = 0
  for (const line of src.split('\n')) {
    lines.push(line)
    cls.push(out.slice(s, s + line.length))
    s += line.length + 1
  }
  return { lines, cls }
}

type RGB = [number, number, number]
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

/** Syntax colours by class, per theme. Punct and Ident lean on the ink colour. */
export function palette(dark: boolean, ink: RGB, bg: RGB): RGB[] {
  const p = dark
    ? { kw: '#ff9b7a', str: '#a6d189', num: '#efb96a', com: '#6f7787', fn: '#82aaff', type: '#c7a6ff' }
    : { kw: '#c2410c', str: '#3d7a1f', num: '#a15c07', com: '#8b909a', fn: '#2350c8', type: '#7b3fc2' }
  const dim = ink.map((v, i) => Math.round(v * 0.6 + bg[i] * 0.4)) as RGB
  return [ink, hex(p.kw), hex(p.str), hex(p.num), hex(p.com), hex(p.fn), hex(p.type), dim, ink]
}

export type { RGB }

/** The texture outside the lens: same shape as the code, every word hidden */
const HIDE: Record<number, string> = {
  [C.Ident]: ':.;',
  [C.Keyword]: '=-',
  [C.String]: '~-',
  [C.Number]: '#+',
  [C.Comment]: '.,',
  [C.Func]: '+*',
  [C.Type]: '*%',
}

/** The hidden-texture glyphs a char of this class can show; null for spaces and punctuation */
export const family = (c: number): string | null => HIDE[c] ?? null

export function asciiLine(line: string, cls: Uint8Array, row: number) {
  let s = ''
  for (let i = 0; i < line.length; i++) {
    const c = cls[i]
    if (c === C.Space || c === C.Punct) s += line[i]
    else {
      const set = HIDE[c]
      const h = Math.sin(row * 127.1 + i * 311.7) * 43758.5453
      s += set[Math.floor((h - Math.floor(h)) * set.length)]
    }
  }
  return s
}
