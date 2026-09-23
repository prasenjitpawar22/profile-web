'use client'
import { MoonIcon, SunDim } from 'lucide-react'
import { useTheme } from 'next-themes'
import { MouseEvent, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleThemeChange(e: MouseEvent<HTMLButtonElement>) {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'

    if (
      typeof document.startViewTransition !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setTheme(next)
      return
    }

    // Grow the new theme out of the toggle button
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    await document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    }).ready

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 600,
        easing: 'ease-out',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  if (!mounted) return <span className='inline-block h-8 w-8' />

  return (
    <button
      type='button'
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      className='-mr-2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      onClick={handleThemeChange}>
      {resolvedTheme === 'dark' ? (
        <SunDim className='h-4 w-4' />
      ) : (
        <MoonIcon className='h-4 w-4' />
      )}
    </button>
  )
}
