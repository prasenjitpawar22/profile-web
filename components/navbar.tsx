'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

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
  const [active, setActive] = useState(pathname)
  const [hoveredItem, setHoveredItem] = useState<string | null>(pathname)
  const containerRef = useRef<HTMLUListElement>(null)
  const activeElementRef = useRef<HTMLAnchorElement>(null)

  const highlightTarget = hoveredItem || active

  useEffect(() => {
    setHoveredItem(null)
    setActive(pathname)
  }, [pathname])

  useLayoutEffect(() => {
    const container = containerRef.current
    const activeEl = activeElementRef.current
    if (!container || !activeEl) return

    const { offsetLeft, offsetWidth } = activeEl
    const containerWidth = container.offsetWidth

    const leftPercent = (offsetLeft / containerWidth) * 100
    const rightPercent =
      100 - ((offsetLeft + offsetWidth) / containerWidth) * 100

    container.style.clipPath = `inset(0 ${rightPercent}% 0 ${leftPercent}% round 9999px)`
  }, [active, hoveredItem])

  return (
    <nav className='flex gap-2 justify-center relative mb-12'>
      <ul className='absolute flex shadow-inner gap-1 shadow-foreground/10 border mt-3 rounded-full p-2 items-center'>
        {navItems.map((nav) => (
          <motion.div
            onHoverStart={() => setHoveredItem(nav.path)}
            onHoverEnd={() => setHoveredItem(null)}>
            <Link
              key={nav.name}
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
            onHoverStart={() => setHoveredItem(nav.path)}
            onHoverEnd={() => setHoveredItem(null)}>
            <Link
              key={nav.name}
              href={nav.path}
              className='rounded-full focus-visible:outline-1'>
              <motion.li
                className='relative bg-foreground text-background px-2 py-1 text-sm inline-flex items-center focus-visible:outline-0 rounded-full tracking-tight cursor-pointer'
              >
                {nav.name}
              </motion.li>
            </Link>
          </motion.div>
        ))}
      </ul>
    </nav>
  )
}
