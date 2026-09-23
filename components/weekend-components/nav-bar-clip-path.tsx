'use client'
import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'

const nav = ['home', 'about', 'contact', 'login']

export function NavbarClipPath() {
  const [active, setActive] = useState('home')
  const listRef = useRef<HTMLUListElement>(null)
  const highlightRef = useRef<HTMLUListElement>(null)

  // Clip the inverted copy down to the active item
  useLayoutEffect(() => {
    const list = listRef.current
    const highlight = highlightRef.current
    const target = list?.querySelector<HTMLElement>(`[data-item="${active}"]`)
    if (!list || !highlight || !target) return

    const width = list.offsetWidth
    const left = (target.offsetLeft / width) * 100
    const right = 100 - ((target.offsetLeft + target.offsetWidth) / width) * 100

    highlight.style.clipPath = `inset(0 ${right.toFixed(2)}% 0 ${left.toFixed(2)}% round 9999px)`
  }, [active])

  return (
    <div className='relative text-sm'>
      <ul
        ref={listRef}
        className='relative flex gap-2 rounded-full bg-foreground px-4 py-2 text-background shadow-lg'>
        {nav.map((item) => (
          <li key={item} data-item={item} className='relative'>
            <button
              type='button'
              aria-current={active === item ? 'page' : undefined}
              onClick={() => setActive(item)}
              className='rounded-full px-2 py-2 capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              {item}
            </button>
            {item === active ? (
              // A soft glow that follows the active item and bleeds past the clip edge
              <motion.span
                layoutId='clip-nav-glow'
                className='absolute inset-0 rounded-full bg-background blur-[4px]'
              />
            ) : null}
          </li>
        ))}
      </ul>

      <ul
        ref={highlightRef}
        aria-hidden
        style={{ clipPath: 'inset(0 75% 0 6% round 9999px)' }}
        className='pointer-events-none absolute inset-0 flex gap-2 rounded-full bg-background px-4 py-2 text-foreground transition-[clip-path] duration-300 ease-out'>
        {nav.map((item) => (
          <li key={item} className='px-2 py-2 capitalize'>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
