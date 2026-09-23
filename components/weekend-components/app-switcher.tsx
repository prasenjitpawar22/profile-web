'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Transition } from 'motion/react'
import { MessageCircle, X } from 'lucide-react'
import {
  InstagramLogoIcon,
  FigmaLogoIcon,
  TwitterLogoIcon,
  GitHubLogoIcon,
} from '@radix-ui/react-icons'

/* ============================================================
   App switcher — a compact trigger that expands into a grid of
   apps and collapses back, carrying the selected icon with it
   via a shared layout transition.
   ============================================================ */

type AppId = 'instagram' | 'figma' | 'twitter' | 'github' | 'message'

/** The subset of motion props these icons are actually driven with. */
type MotionIconProps = {
  className?: string
  layoutId?: string
  transition?: Transition
}

type AppEntry = {
  id: AppId
  label: string
  Icon: React.ComponentType<MotionIconProps>
}

/* Motion wrappers are created once at module scope. Doing this inside the
   component would produce a new component type every render, which remounts
   the icon and breaks the shared-layout animation it exists to drive. */
const APPS: AppEntry[] = [
  { id: 'instagram', label: 'Instagram', Icon: motion.create(InstagramLogoIcon) },
  { id: 'figma', label: 'Figma', Icon: motion.create(FigmaLogoIcon) },
  { id: 'twitter', label: 'Twitter', Icon: motion.create(TwitterLogoIcon) },
  { id: 'github', label: 'GitHub', Icon: motion.create(GitHubLogoIcon) },
  { id: 'message', label: 'Messages', Icon: motion.create(MessageCircle) },
]

/* One spring for every shared-layout move, so the trigger, the heading and the
   icon all travel on the same curve instead of drifting apart. */
const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const

export function AppSwitcher() {
  const [open, setOpen] = useState(false)
  // The id is the state — not a React element. Elements captured in state go
  // stale, can't be persisted, and duplicate the layoutId they were built with.
  const [selectedId, setSelectedId] = useState<AppId>('instagram')

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const reduceMotion = useReducedMotion()

  const selected = APPS.find((a) => a.id === selectedId) ?? APPS[0]

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  // Escape and outside-click live on the document: a keydown handler on the
  // wrapper only fires while something inside it already has focus.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  // Move focus into the grid so the expanded state is reachable by keyboard.
  useEffect(() => {
    if (!open) return
    const first = gridRef.current?.querySelector<HTMLButtonElement>(
      '[data-selected="true"], button',
    )
    first?.focus()
  }, [open])

  /** Roving focus across the grid, the convention for a menu of equal choices. */
  function onGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()

    const items = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    )
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (index === -1) return

    const next =
      e.key === 'ArrowRight' ? (index + 1) % items.length
      : e.key === 'ArrowLeft' ? (index - 1 + items.length) % items.length
      : e.key === 'Home' ? 0
      : items.length - 1

    items[next]?.focus()
  }

  function select(id: AppId) {
    setSelectedId(id)
    close()
  }

  const SelectedIcon = selected.Icon

  return (
    <div ref={rootRef} className='relative inline-flex items-center justify-center'>
      <motion.div
        layout
        transition={reduceMotion ? { duration: 0 } : SPRING}
        className='overflow-hidden rounded-xl border bg-background shadow-sm'>
        <AnimatePresence mode='popLayout' initial={false}>
          {!open ? (
            <motion.button
              key='trigger'
              ref={triggerRef}
              layoutId='switcher-surface'
              type='button'
              onClick={() => setOpen(true)}
              aria-expanded={false}
              aria-haspopup='true'
              aria-controls={panelId}
              transition={reduceMotion ? { duration: 0 } : SPRING}
              className='flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'>
              <SelectedIcon
                layoutId={`app-${selected.id}`}
                transition={reduceMotion ? { duration: 0 } : SPRING}
                className='h-4 w-4 text-foreground'
              />
              {/* Deliberately not a shared layout: the icon is the only thing
                  that should travel between the two states. A flying label
                  crosses the icon's path and reads as a collision.
                  Instead the label swaps in place — clipped by the wrapper so
                  it slides out from under the top edge, and delayed so the
                  icon has landed before the name appears. */}
              <span className='relative inline-flex overflow-hidden leading-5'>
                {/* No `initial={false}` here: the trigger remounts every time
                    the panel closes, so the label is always a first mount and
                    that flag would suppress the slide on every single swap. */}
                <AnimatePresence mode='wait'>
                  <motion.span
                    key={selected.id}
                    initial={reduceMotion ? false : { y: '-110%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { y: '110%', opacity: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.26, delay: 0.14, ease: [0.22, 1, 0.36, 1] }
                    }
                    className='block whitespace-nowrap'>
                    {selected.label}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.button>
          ) : (
            <motion.div
              key='panel'
              id={panelId}
              layoutId='switcher-surface'
              role='dialog'
              aria-label='Choose an app'
              transition={reduceMotion ? { duration: 0 } : SPRING}
              className='w-[248px]'>
              <div className='flex items-center justify-between gap-3 px-3 py-2'>
                <span className='text-sm font-medium text-foreground/80'>Apps</span>
                <button
                  type='button'
                  onClick={() => close()}
                  aria-label='Close app switcher'
                  className='-mr-1 grid h-6 w-6 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring'>
                  <X className='h-3.5 w-3.5' />
                </button>
              </div>

              <motion.div
                ref={gridRef}
                onKeyDown={onGridKeyDown}
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, delay: reduceMotion ? 0 : 0.04 }}
                className='grid grid-cols-5 gap-1 border-t bg-muted/60 p-2'>
                {APPS.map(({ id, label, Icon }, i) => {
                  const isSelected = id === selectedId
                  return (
                    <motion.button
                      key={id}
                      type='button'
                      title={label}
                      aria-label={label}
                      aria-pressed={isSelected}
                      data-selected={isSelected}
                      onClick={() => select(id)}
                      // Each tile arrives just after the one before it, which
                      // reads as the panel filling in rather than popping.
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.16,
                        delay: reduceMotion ? 0 : 0.05 + i * 0.025,
                      }}
                      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                      className='grid h-9 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm'>
                      <Icon
                        layoutId={isSelected ? `app-${id}` : undefined}
                        transition={reduceMotion ? { duration: 0 } : SPRING}
                        className='h-4 w-4'
                      />
                    </motion.button>
                  )
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
