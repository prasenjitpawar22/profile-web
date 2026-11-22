'use client'
import { MoonIcon, SunDim } from 'lucide-react'
import { useTheme } from 'next-themes'
import { MouseEvent, useRef } from 'react'
import { bloomTheme } from './theme-bloom'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const blooming = useRef(false)

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

  return (
    <button
      type='button'
      // The label can't name the next theme before hydration, so it stays general
      aria-label='Toggle dark mode'
      className='hit-area -mr-2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out will-change-transform [--hit-x:6px] [--hit-y:6px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground'
      onClick={handleThemeChange}>
      {/* Both icons are always rendered and the `dark` class picks one, so the
          right icon is there on first paint and the swap can cross-fade
          (see .theme-icon in globals.css) */}
      <span className='grid h-4 w-4 [grid-area:1/1]'>
        <MoonIcon data-theme-icon='moon' className='theme-icon h-4 w-4 [grid-area:1/1]' />
        <SunDim data-theme-icon='sun' className='theme-icon h-4 w-4 [grid-area:1/1]' />
      </span>
    </button>
  )
}
