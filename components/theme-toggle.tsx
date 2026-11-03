'use client'
import { MoonIcon, SunDim } from 'lucide-react'
import { useTheme } from 'next-themes'
import { MouseEvent, useEffect, useRef, useState } from 'react'
import { bloomTheme } from './theme-bloom'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const blooming = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleThemeChange(e: MouseEvent<HTMLButtonElement>) {
    // A second click mid-bloom would start a transition on top of this one
    if (blooming.current) return
    blooming.current = true
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'

    // Bloom the new theme out of the toggle button
    const rect = e.currentTarget.getBoundingClientRect()
    try {
      await bloomTheme(rect.left + rect.width / 2, rect.top + rect.height / 2, () =>
        setTheme(next),
      )
    } finally {
      blooming.current = false
    }
  }

  if (!mounted) return <span className='inline-block h-8 w-8' />

  return (
    <button
      type='button'
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      className='hit-area -mr-2 grid h-8 w-8 place-items-center [--hit-x:6px] [--hit-y:6px] rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      onClick={handleThemeChange}>
      {resolvedTheme === 'dark' ? (
        <SunDim className='h-4 w-4' />
      ) : (
        <MoonIcon className='h-4 w-4' />
      )}
    </button>
  )
}
