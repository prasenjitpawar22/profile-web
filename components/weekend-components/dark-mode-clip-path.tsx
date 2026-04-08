import { useTheme } from 'next-themes'
import { Button } from '../ui/button'
import { Moon, SunDim } from 'lucide-react'
import { flushSync } from 'react-dom'
import { useEffect, useState } from 'react'

export function DarkModeClipPath() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, theme, themes } = useTheme()
  const [side, setSide] = useState('Top Right')

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleThemChange() {
    await document.startViewTransition(() => {
      if (theme === 'light') {
        flushSync(() => setTheme('dark'))
      } else {
        flushSync(() => setTheme('light'))
      }
    }).ready

    // Calculate the radius for a circle that covers the entire viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const radius = Math.sqrt(viewportWidth ** 2 + viewportHeight ** 2)

    let startPosition = ''
    switch (side) {
      case 'Top Right':
        startPosition = '100% 0%'
        break
      case 'Top Left':
        startPosition = '0% 0%'
        break
      case 'Bottom Left':
        startPosition = '0% 100%'
        break
      case 'Bottom Right':
        startPosition = '100% 100%'
        break
      default:
        startPosition = '100% 0%'
    }

    // Set CSS custom property for ripple start position
    document.documentElement.style.setProperty('--ripple-start', startPosition)

    // Apply ripple class to trigger CSS animations
    document.documentElement.classList.add('theme-ripple-active')

    // Remove the class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-ripple-active')
      document.documentElement.style.removeProperty('--ripple-start')
    }, 1200)

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${startPosition})`,
          `circle(${radius}px at ${startPosition})`,
        ],
      },
      {
        duration: 600,
        easing: 'ease-out',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  return (
    <div className='relative flex p-2 border bg-foreground/[0.02] rounded-md min-h-[200px]  text-sm w-full items-center justify-center'>
      {mounted ? (
        <div className='p-12 flex flex-col w-fit items-center justify-center gap-12'>
          <div className='grid lg:grid-cols-4 gap-2 sm:grid-cols-2 grid-cols-1'>
            <Button
              variant={side === 'Top Left' ? 'default' : 'secondary'}
              onClick={() => setSide('Top Left')}>
              Top Left
            </Button>
            <Button
              variant={side === 'Top Right' ? 'default' : 'secondary'}
              onClick={() => setSide('Top Right')}>
              Top Right
            </Button>
            <Button
              variant={side === 'Bottom Left' ? 'default' : 'secondary'}
              onClick={() => setSide('Bottom Left')}>
              Bottom Left
            </Button>
            <Button
              variant={side === 'Bottom Right' ? 'default' : 'secondary'}
              onClick={() => setSide('Bottom Right')}>
              Bottom Right
            </Button>
          </div>
          <Button onClick={handleThemChange} className='w-fit'>
            {theme === 'light' ? <SunDim /> : <Moon />}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
