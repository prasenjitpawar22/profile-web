'use client'

import { useEffect, useRef } from 'react'
import { BLOOM, DEFOCUS, GLOW, HOLD_SECONDS, TIME_SCALE, createLabyrinth } from './labyrinth-sim'

/* Three stacked canvases: a defocused copy of the maze, a blurred glow layer,
   and the sharp layer on top. The blur is a CSS filter on whole layers, so it
   runs once per layer on the GPU instead of as a canvas filter every frame.
   The blurred layers draw at 1x, since the blur hides the difference. */
export function Labyrinth() {
  const boxRef = useRef<HTMLDivElement>(null)
  const sharpRef = useRef<HTMLCanvasElement>(null)
  const softRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const box = boxRef.current
    const sharpC = sharpRef.current
    const softC = softRef.current
    const glowC = glowRef.current
    if (!box || !sharpC || !softC || !glowC) return
    const sharp = sharpC.getContext('2d')
    const soft = softC.getContext('2d')
    const glow = glowC.getContext('2d')
    const maskC = document.createElement('canvas')
    const mask = maskC.getContext('2d')
    if (!sharp || !soft || !glow || !mask) return

    const reducedQ = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = reducedQ.matches
    let W = 0
    let H = 0
    let dpr = 1
    let ink = getComputedStyle(box).color
    let maze: ReturnType<typeof createLabyrinth> | null = null
    let raf = 0
    let last = 0
    let running = false
    let onScreen = true
    let clear = 0

    const paint = () => {
      for (const [ctx, s] of [
        [sharp, dpr],
        [mask, dpr],
        [soft, 1],
        [glow, 1],
      ] as const) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.setTransform(s, 0, 0, s, 0, 0)
      }
      maze?.draw(sharp, soft, glow, mask, ink)
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      maze?.tick(dt * TIME_SCALE)
      paint()
    }

    // Only animate while on screen, in a visible tab, without reduced motion
    const sync = () => {
      const want = !reduced && onScreen && !document.hidden
      if (want === running) return
      running = want
      if (want) {
        last = 0
        raf = requestAnimationFrame(frame)
      } else cancelAnimationFrame(raf)
    }

    // Reduced motion has no loop, so every change repaints directly
    const still = () => {
      if (!reduced || !maze) return
      maze.still(performance.now() / 1000)
      paint()
    }

    const resize = () => {
      const r = box.getBoundingClientRect()
      if (!r.width || !r.height) return
      if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return
      W = r.width
      H = r.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      sharpC.width = maskC.width = Math.round(W * dpr)
      sharpC.height = maskC.height = Math.round(H * dpr)
      softC.width = glowC.width = Math.round(W)
      softC.height = glowC.height = Math.round(H)
      maze = createLabyrinth(W, H)
      if (reduced) still()
      else paint()
    }

    const local = (e: PointerEvent) => {
      const r = box.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top] as const
    }
    const onMove = (e: PointerEvent) => {
      const [px, py] = local(e)
      maze?.pointer(px, py, true)
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const [px, py] = local(e)
      maze?.pointer(px, py, true)
      maze?.click(px, py, reduced ? performance.now() / 1000 : undefined)
      if (reduced) {
        still()
        // No loop to take the thread away again
        clearTimeout(clear)
        clear = window.setTimeout(still, HOLD_SECONDS * 1000 + 50)
      }
    }
    const onLeave = () => maze?.pointer(0, 0, false)
    const onUp = (e: PointerEvent) => {
      // A lifted finger is gone; a mouse is still hovering
      if (e.pointerType !== 'mouse') onLeave()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      sync()
    })
    io.observe(box)
    const onReduce = () => {
      reduced = reducedQ.matches
      if (reduced) still()
      sync()
    }
    reducedQ.addEventListener('change', onReduce)
    // Theme changes flip a class on <html>; re-read the ink
    const mo = new MutationObserver(() => {
      ink = getComputedStyle(box).color
      if (!running) paint()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    box.addEventListener('pointermove', onMove)
    box.addEventListener('pointerdown', onDown)
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('pointercancel', onLeave)
    box.addEventListener('pointerup', onUp)
    document.addEventListener('visibilitychange', sync)
    sync()

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(clear)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      reducedQ.removeEventListener('change', onReduce)
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('pointercancel', onLeave)
      box.removeEventListener('pointerup', onUp)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return (
    <div className='relative h-[440px] w-full'>
      {/* Bleeds to the stage's edges, like the Logogram */}
      <div
        ref={boxRef}
        role='img'
        aria-label='A maze in the dark. Moving the pointer sends light running through its corridors; clicking draws the one way out, from the exit to that spot.'
        className='absolute -inset-6 touch-pan-y select-none bg-background text-foreground'>
        <canvas
          ref={softRef}
          aria-hidden
          className='pointer-events-none absolute inset-0 size-full'
          style={{ filter: `blur(${DEFOCUS}px)` }}
        />
        <canvas
          ref={glowRef}
          aria-hidden
          className='pointer-events-none absolute inset-0 size-full'
          style={{ filter: `blur(${BLOOM}px)`, opacity: GLOW }}
        />
        <canvas ref={sharpRef} aria-hidden className='pointer-events-none absolute inset-0 size-full' />
      </div>
    </div>
  )
}
