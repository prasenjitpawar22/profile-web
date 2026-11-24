'use client'

import './picker.css'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Controls } from './controls'
import { useCodeLens } from './lens'
import { STYLES, type Style } from './params'

const BOX = 'min(560px, 70svh)'

function Page({ source, style }: { source: string; style: Style }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  useCodeLens(canvasRef, boxRef, source, style)
  return (
    <div className='flex flex-col gap-4'>
      <div ref={boxRef} className='overflow-hidden rounded-2xl border bg-background' style={{ height: BOX }}>
        <canvas
          ref={canvasRef}
          role='img'
          aria-label='Source code hidden as ASCII texture; a circle follows the cursor and reveals the code underneath in colour.'
          className='lens-canvas block size-full touch-none text-foreground'
        />
      </div>
      <p className='text-[13px] text-muted-foreground'>Move over the code to read it</p>
    </div>
  )
}

export default function Harness({ source }: { source: string }) {
  const [current, setCurrent] = useState(0)
  const [run, setRun] = useState(0)
  const [ready, setReady] = useState(false)
  const highlightRef = useRef<HTMLSpanElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const setActive = (i: number) => {
    if (i < 0 || i >= STYLES.length) return
    setCurrent(i)
    const url = new URL(location.href)
    url.searchParams.set('v', String(i + 1))
    history.replaceState(null, '', url)
  }

  useEffect(() => {
    const v = parseInt(new URLSearchParams(location.search).get('v') ?? '', 10)
    if (v >= 1 && v <= STYLES.length) setCurrent(v - 1)
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
  }, [])

  useLayoutEffect(() => {
    const move = () => {
      const el = itemRefs.current[current]
      const hl = highlightRef.current
      if (!el || !hl) return
      hl.style.width = el.offsetWidth + 'px'
      hl.style.transform = `translateX(${el.offsetLeft}px)`
    }
    move()
    window.addEventListener('resize', move)
    return () => window.removeEventListener('resize', move)
  }, [current])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= STYLES.length) setActive(num - 1)
      else if (e.key === 'ArrowRight') setActive((current + 1) % STYLES.length)
      else if (e.key === 'ArrowLeft') setActive((current - 1 + STYLES.length) % STYLES.length)
      else if (e.key === 'r' || e.key === 'R') setRun((r) => r + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [current])

  const style = STYLES[current]

  return (
    <>
      <div className='mx-auto flex w-full max-w-[880px] flex-col gap-8 px-4 pb-32 pt-16 sm:px-6'>
        <header className='flex flex-col gap-1'>
          <h1 className='text-[15px] font-medium'>Code lens</h1>
          <p className='text-[15px] text-muted-foreground'>Source you can only read where you look.</p>
        </header>
        <Page key={`${current}-${run}`} source={source} style={style} />
      </div>
      <Controls name={style} />
      <nav className='proto-picker' aria-label='Prototype variants' data-ready={ready || undefined}>
        <span ref={highlightRef} className='proto-picker-highlight' aria-hidden='true' />
        {STYLES.map((m, i) => (
          <button
            key={m}
            type='button'
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            className='proto-picker-item'
            data-active={i === current || undefined}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => setActive(i)}>
            {m}
          </button>
        ))}
        <span className='proto-picker-divider' aria-hidden='true' />
        <button
          type='button'
          className='proto-picker-item proto-picker-replay'
          aria-label='Reset the page (R)'
          onClick={() => setRun((r) => r + 1)}>
          ↻
        </button>
      </nav>
    </>
  )
}
