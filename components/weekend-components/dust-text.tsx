'use client'

import { cn } from '@/lib/utils'
import { useReducedMotion } from 'motion/react'
import { Shuffle } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createField, draw, rasterize, snap, step, SNAP_MS, type Aim } from './dust-text-sim'

// Two tones, like a headline and its quieter second half. Kept short so the
// biggest one still fits the card on one or two lines.
const PHRASES: [string, string][] = [
  ['Into', 'thin air'],
  ['Gone', 'with the wind'],
  ['Stardust', 'and static'],
  ['Ashes', 'to pixels'],
  ['Here,', 'then not'],
  ['Nothing', 'lasts'],
  ['Dust', 'settles'],
  ['Ephemeral', 'by design'],
  ['Blink', 'and miss it'],
  ['Soft', 'goodbyes'],
]

type DustTextProps = {
  /** px around the cursor that turns to dust */
  radius?: number
  /** ms the dust stays gone before the letters re-form */
  rest?: number
}

export function DustText({ radius = 56, rest = 200 }: DustTextProps) {
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [index, setIndex] = useState(0)
  // Set by the engine once it's running; lets a new phrase snap the old one away
  const swap = useRef<(() => void) | null>(null)
  const firstPhrase = useRef(true)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const text = textRef.current
    const ctx = canvas?.getContext('2d')
    if (reduce || !wrap || !canvas || !text || !ctx) return

    const field = createField()
    const aim: Aim = { x: 0, y: 0, active: false }
    let raf = 0
    let last = 0
    let running = false
    let ready = false

    const tick = (now: number) => {
      const dt = Math.min(now - last, 48)
      last = now
      const busy = step(field, dt, aim, radius, rest)
      draw(ctx, field)
      if (busy && !document.hidden) raf = requestAnimationFrame(tick)
      else running = false
    }
    // Only animates while something is moving
    const kick = () => {
      if (running || !ready) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const layout = () => {
      rasterize(field, canvas, text)
      draw(ctx, field)
    }

    swap.current = () => {
      if (!ready) return
      snap(field)
      // The new phrase settles in as the old one's sweep clears
      rasterize(field, canvas, text, { enter: true, delay: SNAP_MS * 0.6 })
      kick()
    }

    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      const scale = b.width / (canvas.offsetWidth || 1)
      aim.x = (e.clientX - b.left) / scale
      aim.y = (e.clientY - b.top) / scale
      // Dust only comes off the words, not the button under them
      aim.active = !(e.target as HTMLElement).closest('button')
      kick()
    }
    const onLeave = () => {
      aim.active = false
    }
    // A lifted finger stops pushing; there's no hover to fall back to
    const onUp = (e: PointerEvent) => e.pointerType === 'touch' && onLeave()

    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      ready = true
      layout()
    })

    const ro = new ResizeObserver(() => ready && layout())
    ro.observe(wrap)
    // Theme toggles flip a class on <html>; re-read the text colours
    const mo = new MutationObserver(() => ready && layout())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const onVisible = () => !document.hidden && kick()
    document.addEventListener('visibilitychange', onVisible)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    wrap.addEventListener('pointercancel', onLeave)
    wrap.addEventListener('pointerup', onUp)

    return () => {
      cancelled = true
      swap.current = null
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      document.removeEventListener('visibilitychange', onVisible)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
      wrap.removeEventListener('pointercancel', onLeave)
      wrap.removeEventListener('pointerup', onUp)
      text.removeAttribute('data-ready')
    }
  }, [reduce, radius, rest])

  // Runs after the new phrase is in the DOM, so it can be measured
  useLayoutEffect(() => {
    if (firstPhrase.current) {
      firstPhrase.current = false
      return
    }
    swap.current?.()
  }, [index])

  function shuffle() {
    setIndex((i) => {
      const next = Math.floor(Math.random() * (PHRASES.length - 1))
      return next >= i ? next + 1 : next
    })
  }

  const [first, second] = PHRASES[index]

  return (
    <div
      ref={wrapRef}
      className='relative flex min-h-[300px] w-full touch-pan-y flex-col items-center justify-center gap-8'>
      {/* Bleeds past the stage padding, so dust can drift to the edges */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className='pointer-events-none absolute -left-6 -top-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)]'
      />

      <p
        ref={textRef}
        aria-live='polite'
        className={cn(
          'max-w-[480px] text-balance text-center text-[clamp(44px,11vw,72px)] font-semibold leading-[0.95] tracking-[-0.05em]',
          // The canvas draws the words once it's ready; the real text stays for reading and selecting
          '[&[data-ready]_span]:text-transparent',
        )}>
        <span className='text-foreground'>{first}</span> <span className='text-muted-foreground'>{second}</span>
      </p>

      <button
        type='button'
        onClick={shuffle}
        className='hit-area relative z-10 inline-flex h-8 items-center gap-1.5 rounded-full border bg-background px-3 text-[13px] text-muted-foreground shadow-sm transition-[color,transform] duration-150 ease-out [--hit-y:6px] [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] motion-reduce:transition-none [@media(hover:hover)]:hover:text-foreground'>
        <Shuffle aria-hidden className='h-3.5 w-3.5' />
        New words
      </button>
    </div>
  )
}
