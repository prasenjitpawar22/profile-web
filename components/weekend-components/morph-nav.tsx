'use client'

import { cn } from '@/lib/utils'
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Lowercase, so a letter only ever has to find itself in the next word.
// Neighbours share a few letters, so most moves hand something over.
const ITEMS = ['home', 'projects', 'writing', 'lab', 'about', 'contact']

const WORD = 'text-[clamp(56px,13vw,112px)] font-semibold leading-none tracking-[-0.055em]'
const EASE_OUT = [0.23, 1, 0.32, 1] as const

type Layout = Record<string, { xs: number[]; width: number }>
type Glyph = {
  id: number
  char: string
  index: number
  /** Offset from the word's centre */
  x: number
  delay: number
  /** Moves straight there, for re-layouts rather than morphs */
  snap?: boolean
}

let nextId = 0

/**
 * Hands letters from the old word to the new one. Each letter of the new word
 * claims the nearest unclaimed copy of itself in the old one, nearest by
 * relative position, so "o" in the middle stays in the middle. Unclaimed old
 * letters leave, unmatched new ones arrive.
 */
function morph(prev: Glyph[], prevLength: number, word: string, layout: Layout): Glyph[] {
  const { xs, width } = layout[word]
  const rel = (i: number, n: number) => (n > 1 ? i / (n - 1) : 0.5)

  const pairs: [cost: number, from: number, to: number][] = []
  prev.forEach((glyph, from) => {
    for (let to = 0; to < word.length; to++) {
      if (word[to] === glyph.char) {
        pairs.push([Math.abs(rel(glyph.index, prevLength) - rel(to, word.length)), from, to])
      }
    }
  })
  pairs.sort((a, b) => a[0] - b[0])

  const claimed = new Set<number>()
  const source = new Map<number, number>()
  for (const [, from, to] of pairs) {
    if (claimed.has(from) || source.has(to)) continue
    claimed.add(from)
    source.set(to, from)
  }

  return word.split('').map((char, to) => {
    const from = source.get(to)
    return {
      id: from === undefined ? nextId++ : prev[from].id,
      char,
      index: to,
      x: xs[to] - width / 2,
      // Travellers leave together; arrivals wait a beat for the room to clear
      delay: from === undefined ? 0.1 + to * 0.03 : to * 0.012,
    }
  })
}

function Letter({ glyph, fontSize, reduce }: { glyph: Glyph; fontSize: number; reduce: boolean }) {
  const x = useMotionValue(glyph.x)
  const y = useMotionValue(0)

  useEffect(() => {
    const dx = glyph.x - x.get()
    if (Math.abs(dx) < 0.5) return
    if (reduce || glyph.snap) {
      x.jump(glyph.x)
      return
    }
    // Rightward letters hop over, leftward ones duck under, so they pass
    // each other instead of colliding. Longer trips arc higher.
    const lift = Math.min(Math.abs(dx) * 0.22, fontSize * 0.3) * (dx > 0 ? -1 : 1)
    const run = animate(x, glyph.x, {
      type: 'spring',
      visualDuration: 0.55,
      bounce: 0.18,
      delay: glyph.delay,
    })
    const arc = animate(y, [y.get(), lift, 0], {
      duration: 0.6,
      times: [0, 0.4, 1],
      ease: 'easeInOut',
      delay: glyph.delay,
    })
    return () => {
      run.stop()
      arc.stop()
    }
  }, [glyph, x, y, fontSize, reduce])

  return (
    <motion.span
      className='absolute left-0 top-0 whitespace-pre'
      style={{ x }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: '0.25em', filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: reduce ? 0.15 : 0.4, ease: EASE_OUT, delay: reduce ? 0 : glyph.delay }}
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0.15 } }
          : { opacity: 0, y: '-0.2em', filter: 'blur(8px)', transition: { duration: 0.22, ease: 'easeIn' } }
      }>
      <motion.span className='inline-block' style={{ y }}>
        {glyph.char}
      </motion.span>
    </motion.span>
  )
}

export function MorphNav() {
  const reduce = useReducedMotion() ?? false
  const measureRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [fontSize, setFontSize] = useState(96)
  const [active, setActive] = useState('projects')
  const [preview, setPreview] = useState<string | null>(null)
  const [glyphs, setGlyphs] = useState<Glyph[]>([])
  const current = useRef<{ word: string | null; glyphs: Glyph[] }>({ word: null, glyphs: [] })

  const shown = preview ?? active

  // Every word is laid out once off-screen, so a morph knows where each letter lands
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const measure = () => {
      const next: Layout = {}
      el.querySelectorAll<HTMLElement>('[data-word]').forEach((word) => {
        const box = word.getBoundingClientRect()
        next[word.dataset.word!] = {
          width: box.width,
          xs: Array.from(word.children).map((c) => c.getBoundingClientRect().left - box.left),
        }
      })
      setFontSize(parseFloat(getComputedStyle(el).fontSize))
      setLayout(next)
    }
    let cancelled = false
    document.fonts.ready.then(() => !cancelled && measure())
    // The type scales with the viewport
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    if (!layout) return
    const prev = current.current
    let next: Glyph[]
    if (prev.word === shown) {
      // Same word, new size: put the letters where they now belong
      const { xs, width } = layout[shown]
      next = prev.glyphs.map((g) => ({ ...g, x: xs[g.index] - width / 2, snap: true }))
    } else {
      next = morph(prev.glyphs, prev.word?.length ?? 0, shown, layout)
    }
    current.current = { word: shown, glyphs: next }
    setGlyphs(next)
  }, [shown, layout])

  return (
    <div className='flex w-full flex-col items-center gap-12 py-10'>
      <div aria-hidden className={cn(WORD, 'relative h-[1em] w-full select-none')}>
        <div className='absolute left-1/2 top-0'>
          <AnimatePresence>
            {glyphs.map((glyph) => (
              <Letter key={glyph.id} glyph={glyph} fontSize={fontSize} reduce={reduce} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <nav
        aria-label='Demo'
        onPointerLeave={() => setPreview(null)}
        className='flex flex-wrap justify-center gap-1'>
        {ITEMS.map((item) => (
          <button
            key={item}
            type='button'
            aria-current={item === active ? 'page' : undefined}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setPreview(item)}
            onFocus={() => setPreview(item)}
            onBlur={(e) => {
              // Tabbing to the next item previews that one instead
              if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) setPreview(null)
            }}
            onClick={() => setActive(item)}
            className={cn(
              'relative rounded-full px-3 py-1.5 text-sm capitalize text-muted-foreground transition-colors duration-150 [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              item === shown && 'text-foreground',
            )}>
            {item}
            {item === active ? (
              <motion.span
                layoutId='morph-nav-dot'
                transition={reduce ? { duration: 0 } : { type: 'spring', visualDuration: 0.35, bounce: 0.2 }}
                className='absolute inset-x-0 -bottom-1 mx-auto size-1 rounded-full bg-foreground'
              />
            ) : null}
          </button>
        ))}
      </nav>

      <div
        ref={measureRef}
        aria-hidden
        className={cn(WORD, 'pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap')}>
        {ITEMS.map((word) => (
          <span key={word} data-word={word} className='block w-max'>
            {word.split('').map((char, i) => (
              <span key={i}>{char}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
