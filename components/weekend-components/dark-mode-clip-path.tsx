'use client'
import { cn } from '@/lib/utils'
import { Moon, SunDim } from 'lucide-react'
import { useTheme } from 'next-themes'
import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '../ui/button'

const CORNERS = {
  'Top left': '0% 0%',
  'Top right': '100% 0%',
  'Bottom left': '0% 100%',
  'Bottom right': '100% 100%',
} as const

type Corner = keyof typeof CORNERS

export function DarkModeClipPath() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const [corner, setCorner] = useState<Corner>('Top right')

  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // The options are laid out as the corners they stand for, so the arrow
  // keys move between them the way they look: sideways flips the column,
  // up and down flips the row.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const flip =
      e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowDown' ? 2
      : 0
    if (!flip) return
    e.preventDefault()
    const corners = Object.keys(CORNERS) as Corner[]
    const next = corners.indexOf(corner) ^ flip
    setCorner(corners[next])
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  async function handleThemeChange() {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'

    if (
      typeof document.startViewTransition !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setTheme(next)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    }).ready

    // Opposite corner is a full diagonal away, so this always covers the viewport
    const radius = Math.hypot(window.innerWidth, window.innerHeight)
    const origin = CORNERS[corner]

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin})`,
          `circle(${radius}px at ${origin})`,
        ],
      },
      {
        duration: 600,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  if (!mounted) return <div className='h-[140px]' />

  return (
    <div className='flex flex-col items-center gap-6'>
      <div
        ref={groupRef}
        role='radiogroup'
        aria-label='Reveal from'
        onKeyDown={onKeyDown}
        className='grid grid-cols-2 gap-1 rounded-xl border bg-background p-1 text-sm'>
        {(Object.keys(CORNERS) as Corner[]).map((c) => (
          <button
            key={c}
            type='button'
            role='radio'
            aria-checked={corner === c}
            // One tab stop for the group, as with native radios
            tabIndex={corner === c ? 0 : -1}
            onClick={() => setCorner(c)}
            className={cn(
              'min-h-10 touch-manipulation whitespace-nowrap rounded-lg px-4 transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.97] motion-reduce:transition-none md:min-h-8',
              corner === c
                ? 'bg-foreground text-background'
                : 'text-muted-foreground [@media(hover:hover)]:hover:text-foreground',
            )}>
            {c}
          </button>
        ))}
      </div>
      <Button
        onClick={handleThemeChange}
        className='rounded-full transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none'
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}>
        {resolvedTheme === 'dark' ? (
          <SunDim className='h-4 w-4' />
        ) : (
          <Moon className='h-4 w-4' />
        )}
        <span className='ml-2'>Toggle theme</span>
      </Button>
    </div>
  )
}
