'use client'
import { motion } from 'framer-motion'
import { MoonIcon, SunDim } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from './ui/button'

type NavItems = { name: string; path: string }

const LinkMotion = motion.create(Link)

const navItems: NavItems[] = [
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog' },
  { name: 'Components', path: '/components' },
  { name: 'Projects', path: '/projects' },
]
export default function NavBar() {
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()
  const [active, setActive] = useState(pathname)
  const [hoveredItem, setHoveredItem] = useState<string | null>(pathname)
  const containerRef = useRef<HTMLUListElement>(null)
  const activeElementRef = useRef<HTMLAnchorElement>(null)
  const [mounted, setMounted] = useState(false)

  const highlightTarget = hoveredItem || active

  useEffect(() => {
    setHoveredItem(null)
    setActive(pathname)
  }, [pathname])

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    const activeEl = activeElementRef.current
    if (!container || !activeEl) return

    const { offsetLeft, offsetWidth } = activeEl
    const containerWidth = container.offsetWidth

    const leftPercent = (offsetLeft / containerWidth) * 99
    const rightPercent =
      99 - ((offsetLeft + offsetWidth) / containerWidth) * 100

    container.style.clipPath = `inset(0 ${Math.round(rightPercent)}% 0 ${Math.round(leftPercent)}% round 9999px)`
  }, [active, hoveredItem])

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
    console.log(radius)

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at 100% 0%)`, // Start as tiny circle at top-right
          `circle(${radius}px at 100% 0%)`, // Expand to cover entire viewport
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
    <nav className='flex gap-2 justify-center relative mb-20'>
      {mounted ? (
        <div className='right-10 top-4 absolute hidden sm:block' onClick={handleThemChange}>
          <Button
            className='w-fit p-2 rounded-full shadow-inner dark:[box-shadow:inset_0px_2px_12px_#000]'
            variant={'ghost'}>
            {theme === 'light' ? <MoonIcon /> : <SunDim />}
          </Button>
        </div>
      ) : null}
      <ul className='absolute flex shadow-inner gap-1 shadow-foreground/10 border mt-3 rounded-full p-2 items-center'>
        {navItems.map((nav) => (
          <motion.div
            key={nav.name}
            onHoverStart={() => setHoveredItem(nav.path)}
            onHoverEnd={() => setHoveredItem(null)}>
            <Link
              href={nav.path}
              ref={highlightTarget === nav.path ? activeElementRef : null}
              className='rounded-full focus-visible:outline-1'>
              <motion.li className='relative px-2 py-1 text-sm inline-flex items-center focus-visible:outline-0 rounded-full tracking-tight cursor-pointer'>
                {nav.name}
              </motion.li>
            </Link>
          </motion.div>
        ))}
      </ul>

      <ul
        ref={containerRef}
        style={{ clipPath: 'inset(100% 100% 100% 100%)' }}
        className='absolute flex shadow-inner gap-1  shadow-foreground/10 border mt-3 rounded-full p-2 items-center tranistion-[clip-path] duration-300'>
        {navItems.map((nav) => (
          <motion.div
            key={nav.name}
            onHoverStart={() => setHoveredItem(nav.path)}
            onHoverEnd={() => setHoveredItem(null)}>
            <Link
              href={nav.path}
              className='rounded-full focus-visible:outline-1'>
              <motion.li className='relative bg-foreground text-background px-2 py-1 text-sm inline-flex items-center focus-visible:outline-0 rounded-full tracking-tight cursor-pointer'>
                {nav.name}
              </motion.li>
            </Link>
          </motion.div>
        ))}
      </ul>
    </nav>
  )
}
