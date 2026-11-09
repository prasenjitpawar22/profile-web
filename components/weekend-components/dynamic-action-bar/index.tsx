'use client'
import { cn } from '@/lib/utils'
import {
  Code,
  Paperclip,
  Slack,
  SquareArrowOutUpRight,
  Twitch,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MouseEvent, useEffect, useId, useRef, useState } from 'react'
import useMeasure from 'react-use-measure'
import { AppWindowMacIcon } from './app-window-mac-icon'
import { CodeIcon } from './code-icon'
import { NotePadIcon } from './notepad-icon'

type TabId = 'apps' | 'components' | 'notes'

type Row = {
  title: string
  meta: string
  icon: React.ReactNode
  external?: boolean
}

const TABS: {
  id: TabId
  label: string
  Icon: () => JSX.Element
  rows: Row[]
}[] = [
  {
    id: 'apps',
    label: 'Apps',
    Icon: AppWindowMacIcon,
    rows: [
      { title: 'Twitch', meta: 'Streams', icon: <Twitch />, external: true },
      { title: 'Slack', meta: 'Messaging', icon: <Slack />, external: true },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    Icon: CodeIcon,
    rows: [
      { title: 'Dynamic action bar', meta: 'Jul 2024', icon: <Code /> },
      { title: 'App switcher', meta: 'Jul 2024', icon: <Code /> },
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    Icon: NotePadIcon,
    rows: [
      { title: 'Dapper split-on', meta: 'May 2024', icon: <Paperclip /> },
      { title: 'Feedback component', meta: 'Apr 2024', icon: <Paperclip /> },
      { title: 'Rolling back a database', meta: 'Dec 2025', icon: <Paperclip /> },
    ],
  },
]

const SPRING = { type: 'spring', bounce: 0.1, duration: 0.3 } as const
// Closing is the response to the pointer leaving, so it snaps
const CLOSE = { duration: 0.18, ease: [0.23, 1, 0.32, 1] } as const

export const DynamicActionBar = () => {
  const [active, setActive] = useState<TabId | null>(null)
  const pointerType = useRef('mouse')
  const barRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const pillId = useId()
  const reduceMotion = useReducedMotion()
  // Animate to the measured height so switching tabs resizes smoothly too
  const [contentRef, { height }] = useMeasure()

  // Touch has no pointer to move away, so a tap anywhere else closes it
  const isOpen = active !== null
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setActive(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen])

  const tab = TABS.find((t) => t.id === active)
  const transition = reduceMotion ? { duration: 0 } : SPRING

  // Mouse users get hover-to-open; a click just keeps it open. Touch and
  // keyboard (detail === 0) toggle instead, since they have no hover.
  function onTabClick(e: MouseEvent, id: TabId) {
    if (e.detail !== 0 && pointerType.current === 'mouse') setActive(id)
    else setActive((prev) => (prev === id ? null : id))
  }

  return (
    <div className='flex h-[260px] w-full items-end justify-center'>
      <div
        ref={barRef}
        // Mouse only. A tap ends with the touch pointer "leaving" too, which
        // used to close the panel in the same breath that opened it.
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
        onKeyDown={(e) => e.key === 'Escape' && setActive(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setActive(null)
        }}
        className='w-[300px] rounded-2xl border bg-background/80 p-1.5 shadow-sm backdrop-blur-md'>
        <AnimatePresence initial={false}>
          {tab && (
            <motion.div
              key='panel'
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height, opacity: 1 }}
              exit={{
                height: 0,
                opacity: 0,
                transition: reduceMotion ? { duration: 0 } : CLOSE,
              }}
              transition={transition}
              className='overflow-hidden'>
              <div ref={contentRef} className='relative'>
                <AnimatePresence mode='popLayout' initial={false}>
                  <motion.ul
                    key={tab.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18 }}
                    className='flex w-full flex-col gap-0.5 p-1 pb-2'>
                    {tab.rows.map((row) => (
                      <li key={row.title}>
                        <a
                          href='#'
                          onClick={(e) => e.preventDefault()}
                          className='group flex items-center justify-between gap-2 rounded-lg p-1.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                          <span className='flex items-center gap-2.5'>
                            <span className='grid h-7 w-7 place-items-center rounded-md bg-foreground text-background [&>svg]:h-3.5 [&>svg]:w-3.5'>
                              {row.icon}
                            </span>
                            <span className='flex items-center gap-1 text-xs font-medium'>
                              {row.title}
                              {row.external ? (
                                <SquareArrowOutUpRight className='h-2.5 w-2.5 text-muted-foreground' />
                              ) : null}
                            </span>
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            {row.meta}
                          </span>
                        </a>
                      </li>
                    ))}
                  </motion.ul>
                </AnimatePresence>
                <div className='hairline mb-1.5' />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className='flex gap-1'>
          {TABS.map((t) => (
            <motion.button
              key={t.id}
              type='button'
              aria-expanded={active === t.id}
              aria-controls={active === t.id ? panelId : undefined}
              initial='default'
              animate='default'
              whileHover='hover'
              onPointerDown={(e) => (pointerType.current = e.pointerType)}
              onPointerEnter={(e) => {
                pointerType.current = e.pointerType
                if (e.pointerType === 'mouse') setActive(t.id)
              }}
              onClick={(e) => onTabClick(e, t.id)}
              className={cn(
                'relative flex flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active === t.id
                  ? 'text-background'
                  : 'text-muted-foreground [@media(hover:hover)]:hover:text-foreground',
              )}>
              {/* One highlight for the whole bar: sweeping across the tabs
                  it slides between them, where three separate backgrounds
                  would blink off and on */}
              {active === t.id ? (
                <motion.span
                  aria-hidden
                  layoutId={pillId}
                  transition={transition}
                  className='absolute inset-0 rounded-xl bg-foreground'
                />
              ) : null}
              <span className='relative flex items-center gap-1.5'>
                <t.Icon />
                {t.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
