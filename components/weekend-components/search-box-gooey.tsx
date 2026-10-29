'use client'
import { motion, Transition, useReducedMotion } from 'motion/react'
import { SearchIcon } from 'lucide-react'
import { KeyboardEvent, useId, useRef, useState } from 'react'

const size = 36
const gap = 12
const openWidth = 200

// Closed, the icon blob sits exactly on top of the collapsed field blob
const closedIconX = -(openWidth + gap)

// The field is always full width and clipped down to a circle when closed:
// clip-path skips layout, where animating width reflowed every frame
const openClip = 'inset(0px 0px 0px 0px round 9999px)'
const closedClip = `inset(0px ${openWidth - size}px 0px 0px round 9999px)`

export function SearchBoxGooey() {
  const [isOpen, setIsOpen] = useState(false)
  // The goo only runs mid-morph; at rest it would pinch the shapes together
  const [isMorphing, setIsMorphing] = useState(false)
  const pendingBlobs = useRef(0)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()

  // React's ids contain colons, which break url(#...) references
  const filterId = `gooey-search-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`

  const fieldTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring', bounce: 0.2, visualDuration: 0.35 }

  // Opening, the icon lags the field so the goo stretches before it snaps;
  // closing, it races back so the two melt into one circle again
  const iconTransition: Transition = reduceMotion
    ? { duration: 0 }
    : isOpen
      ? { type: 'spring', bounce: 0.25, visualDuration: 0.35, delay: 0.05 }
      : { type: 'spring', bounce: 0.15, visualDuration: 0.35 }

  const fieldClip = isOpen ? openClip : closedClip
  const iconX = isOpen ? 0 : closedIconX

  function toggle(next: boolean) {
    if (next === isOpen) return
    pendingBlobs.current = 2
    setIsMorphing(true)
    setIsOpen(next)
  }

  function handleBlobSettled() {
    pendingBlobs.current -= 1
    if (pendingBlobs.current <= 0) setIsMorphing(false)
  }

  function open() {
    toggle(true)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Escape') return
    e.preventDefault()
    // First Escape clears, second one closes
    if (text) setText('')
    else inputRef.current?.blur()
  }

  return (
    <div className='relative' style={{ width: openWidth + gap + size, height: size }}>
      <svg width='0' height='0' className='absolute' aria-hidden>
        <filter
          id={filterId}
          x='-50%'
          y='-50%'
          width='200%'
          height='200%'
          colorInterpolationFilters='sRGB'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='5' result='blur' />
          <feColorMatrix
            in='blur'
            mode='matrix'
            values='
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 18 -7
            '
            result='goo'
          />
          <feComposite in='SourceGraphic' in2='goo' operator='atop' />
        </filter>
      </svg>

      {/* Blob layer: plain shapes only, so the filter never touches text */}
      <div
        aria-hidden
        className='flex'
        style={{ gap, filter: isMorphing ? `url(#${filterId})` : 'none' }}>
        <motion.div
          className='shrink-0 rounded-full bg-foreground'
          style={{ width: openWidth, height: size }}
          initial={false}
          animate={{ clipPath: fieldClip }}
          transition={fieldTransition}
          onAnimationComplete={handleBlobSettled}
        />
        <motion.div
          className='shrink-0 rounded-full bg-foreground'
          style={{ width: size, height: size }}
          initial={false}
          animate={{ x: iconX }}
          transition={iconTransition}
          onAnimationComplete={handleBlobSettled}
        />
      </div>

      {/* Content layer: the real input and button, tracking the blobs */}
      <div className='absolute inset-0 flex' style={{ gap }}>
        <motion.input
          ref={inputRef}
          type='search'
          aria-label='Search'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => toggle(true)}
          onBlur={() => toggle(Boolean(text))}
          placeholder='Search'
          initial={false}
          // Clipped like its blob, so the hidden part can't catch clicks
          animate={{ clipPath: fieldClip, opacity: isOpen ? 1 : 0 }}
          transition={fieldTransition}
          style={{ width: openWidth, height: size }}
          className='shrink-0 rounded-full bg-transparent px-4 text-base text-background sm:text-sm caret-background placeholder:text-background/60 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none'
        />
        <motion.button
          type='button'
          aria-label='Search'
          tabIndex={-1}
          // Keep focus in the input when the icon is clicked
          onMouseDown={(e) => e.preventDefault()}
          onClick={open}
          initial={false}
          animate={{ x: iconX }}
          transition={iconTransition}
          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          style={{ width: size, height: size }}
          className='flex shrink-0 items-center justify-center rounded-full text-background'>
          <SearchIcon className='h-4 w-4' />
        </motion.button>
      </div>
    </div>
  )
}
