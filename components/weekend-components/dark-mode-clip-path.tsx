'use client'
import { cn } from '@/lib/utils'
import { Moon, SunDim } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    setMounted(true)
  }, [])

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
        easing: 'ease-out',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  if (!mounted) return <div className='h-[140px]' />

  return (
    <div className='flex flex-col items-center gap-6'>
      <div
        role='radiogroup'
        aria-label='Reveal from'
        className='grid grid-cols-2 gap-1 rounded-xl border bg-background p-1 text-sm sm:grid-cols-4'>
        {(Object.keys(CORNERS) as Corner[]).map((c) => (
          <button
            key={c}
            type='button'
            role='radio'
            aria-checked={corner === c}
            onClick={() => setCorner(c)}
            className={cn(
              'rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              corner === c
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            {c}
          </button>
        ))}
      </div>
      <Button
        onClick={handleThemeChange}
        className='rounded-full'
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
