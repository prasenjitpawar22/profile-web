'use client'

import { ArrowUpRight, ChevronDown } from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

// The nav bar is a strip of liquid metal. A bulge hangs off its underside and follows the
// cursor; opening a menu draws the panel down out of the bar on a tendril, switching menus
// flows it across, and closing melts it back up.

type Item = { title: string; description: string; external?: boolean }
type Menu = { id: string; label: string; width: number; items: Item[] }

const MENUS: Menu[] = [
  {
    id: 'projects',
    label: 'Projects',
    width: 320,
    items: [
      { title: 'Demodrop', description: 'Polished demo videos from any tab or screen' },
      { title: 'Kholi', description: 'Hand over your room' },
      { title: 'Protein tracker', description: 'Log Indian meals, watch the ring fill' },
      { title: 'Abhi and Atul', description: 'Sound and lights services', external: true },
    ],
  },
  {
    id: 'lab',
    label: 'Lab',
    width: 300,
    items: [
      { title: 'Generative', description: 'Dust text, Logogram, Particle orb' },
      { title: 'AI interactions', description: 'Branching chat, Smart paste, Edit review' },
      { title: 'Components', description: 'Small interface experiments' },
    ],
  },
  {
    id: 'writing',
    label: 'Writing',
    width: 400,
    items: [
      { title: 'Native Color Math', description: 'color-mix() and contrast-color() in CSS' },
      { title: 'The JavaScript Event Loop is Gaslighting You', description: 'Technical' },
      { title: "Interface Segregation: Don't Force Your Minions to Do Useless Work", description: 'Principles' },
      { title: "Closures: JavaScript's Memory Trap", description: 'Technical' },
    ],
  },
]
const LINKS = ['About', 'Contact']

const PILL_H = 44
/** Even space around the menu items inside the strip */
const PILL_PAD = 4
const PANEL_RADIUS = 20
const PANEL_PAD = 6
/** Nested corners: outer radius minus the padding between them */
const ROW_RADIUS = PANEL_RADIUS - PANEL_PAD
const BULGE = 30
const CLOSE_DELAY = 200
const HOLD = 300
const EASE_OUT = [0.23, 1, 0.32, 1] as const

type Point = { x: number; y: number }
type Rect = { x: number; y: number; w: number; h: number }

function inTriangle(p: Point, a: Point, b: Point, c: Point) {
  const s = (p1: Point, p2: Point, p3: Point) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  const d1 = s(p, a, b)
  const d2 = s(p, b, c)
  const d3 = s(p, c, a)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

/* ------------------------------------------------------------------ */
/* Hover intent                                                        */

/** Hover target for things on the bar that close the menu rather than open one */
const CLOSE = 'close'

function useMenu() {
  const [active, setActive] = useState<string | null>(null)
  const [direction, setDirection] = useState(0)
  const activeRef = useRef<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggers = useRef(new Map<string, HTMLButtonElement>())
  const hovered = useRef<string | null>(null)
  // Where the cursor last was on the open trigger: the tip of the safe triangle
  const apex = useRef<Point | null>(null)
  const hold = useRef<string | null>(null)
  const closeTimer = useRef<number>()
  const holdTimer = useRef<number>()

  const order = (id: string) => MENUS.findIndex((m) => m.id === id)
  const clearHold = () => {
    window.clearTimeout(holdTimer.current)
    hold.current = null
  }
  const cancelClose = () => window.clearTimeout(closeTimer.current)

  const open = useCallback((id: string) => {
    cancelClose()
    clearHold()
    const prev = activeRef.current
    setDirection(prev && prev !== id ? Math.sign(order(id) - order(prev)) : 0)
    activeRef.current = id
    setActive(id)
  }, [])

  const close = useCallback(() => {
    cancelClose()
    clearHold()
    apex.current = null
    activeRef.current = null
    setActive(null)
  }, [])

  const act = (id: string) => (id === CLOSE ? close() : open(id))

  /** Is the cursor still travelling from the open trigger towards the panel? */
  const aiming = (p: Point) => {
    const panel = panelRef.current?.getBoundingClientRect()
    if (!panel || !apex.current) return false
    return inTriangle(p, apex.current, { x: panel.left, y: panel.top }, { x: panel.right, y: panel.top })
  }

  /**
   * The cursor reached a trigger, or (CLOSE) a plain link or empty bar. Acts at once, unless
   * it's only crossing on the way down to the open panel; then it waits to see.
   */
  const arrive = (id: string, e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    hovered.current = id
    cancelClose()
    const current = activeRef.current
    if (!current) return id === CLOSE ? undefined : open(id)
    if (current === id) return clearHold()
    if (aiming({ x: e.clientX, y: e.clientY })) {
      clearHold()
      hold.current = id
      holdTimer.current = window.setTimeout(() => hovered.current === id && act(id), HOLD)
    } else act(id)
  }
  const depart = (id: string) => {
    if (hovered.current === id) hovered.current = null
    if (hold.current === id) clearHold()
  }

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current)
      window.clearTimeout(holdTimer.current)
    },
    [],
  )

  const rootProps = {
    ref: rootRef,
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const p = { x: e.clientX, y: e.clientY }
      if (activeRef.current && hovered.current === activeRef.current) apex.current = p
      // Stopped aiming while waiting: act now
      if (hold.current && hovered.current === hold.current && !aiming(p)) act(hold.current)
    },
    onPointerEnter: cancelClose,
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse' || !activeRef.current) return
      cancelClose()
      closeTimer.current = window.setTimeout(close, CLOSE_DELAY)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== 'Escape' || !activeRef.current) return
      const id = activeRef.current
      close()
      triggers.current.get(id)?.focus()
    },
    onBlur: (e: React.FocusEvent) => {
      if (!rootRef.current?.contains(e.relatedTarget as Node)) close()
    },
  }

  const plainProps = {
    onPointerEnter: (e: React.PointerEvent) => arrive(CLOSE, e),
    onPointerLeave: () => depart(CLOSE),
    onFocus: () => activeRef.current && close(),
  }

  const triggerProps = (id: string) => ({
    ref: (el: HTMLButtonElement | null) => {
      if (el) triggers.current.set(id, el)
      else triggers.current.delete(id)
    },
    type: 'button' as const,
    'aria-expanded': active === id,
    'aria-controls': `chrome-nav-${id}`,
    onPointerEnter: (e: React.PointerEvent) => arrive(id, e),
    onPointerLeave: () => depart(id),
    onClick: (e: React.MouseEvent) => {
      // A mouse already opened it on hover; a click there shouldn't shut it
      const fromMouse = e.detail > 0 && hovered.current === id
      if (activeRef.current === id) {
        if (!fromMouse) close()
      } else open(id)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowDown') return
      e.preventDefault()
      open(id)
      requestAnimationFrame(() => requestAnimationFrame(() => panelRef.current?.querySelector('a')?.focus()))
    },
  })

  return {
    menu: MENUS.find((m) => m.id === active) ?? null,
    direction,
    rootRef,
    panelRef,
    triggers,
    rootProps,
    plainProps,
    triggerProps,
    close,
  }
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */

function Rows({ menu, width, onPick, measure }: { menu: Menu; width: number; onPick?: () => void; measure?: boolean }) {
  return (
    <div style={{ width, padding: PANEL_PAD }}>
      {menu.items.map((item) => (
        <a
          key={item.title}
          href='#'
          tabIndex={measure ? -1 : undefined}
          onClick={(e) => {
            e.preventDefault()
            onPick?.()
          }}
          // A hovered row lifts out of the ink
          style={{ borderRadius: ROW_RADIUS }}
          className='flex flex-col px-3 py-2.5 outline-none transition-colors duration-150 focus-visible:bg-[color:var(--chrome-hover)] [@media(hover:hover)]:hover:bg-[color:var(--chrome-hover)]'>
          <span className='flex items-center gap-1.5 text-sm font-medium'>
            {item.title}
            {item.external ? <ArrowUpRight aria-label='Opens another site' className='h-3.5 w-3.5 shrink-0 opacity-60' /> : null}
          </span>
          <span className='text-[13px] text-[color:var(--chrome-ink-muted)]'>{item.description}</span>
        </a>
      ))}
    </div>
  )
}

function TendrilBead({
  from,
  to,
  k,
  size,
}: {
  from: [MotionValue<number>, MotionValue<number>]
  to: [MotionValue<number>, MotionValue<number>]
  k: number
  size: number
}) {
  const x = useTransform([from[0], to[0]] as MotionValue[], ([a, b]: number[]) => a + (b - a) * k - size / 2)
  const y = useTransform([from[1], to[1]] as MotionValue[], ([a, b]: number[]) => a + (b - a) * k - size / 2)
  // Stretched far, the tendril thins out until it snaps
  const scale = useTransform([from[0], from[1], to[0], to[1]] as MotionValue[], ([ax, ay, bx, by]: number[]) =>
    Math.max(0, Math.min(1, 1 - (Math.hypot(bx - ax, by - ay) - 90) / 230)),
  )
  return (
    <motion.div
      className='absolute left-0 top-0 rounded-full'
      style={{ x, y, scale, width: size, height: size, background: 'var(--chrome-bead)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Chrome nav                                                          */

export function ChromeNav() {
  const nav = useMenu()
  const reduce = useReducedMotion() ?? false
  const goo = `chrome-goo-${useId().replace(/:/g, '')}`
  const barRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{
    width: number
    bar: number
    pill: { x: number; w: number }
    triggers: Record<string, Rect>
  } | null>(null)
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [onPill, setOnPill] = useState(false)

  // Panels never outgrow the stage on narrow screens
  const widthOf = (menu: Menu) => Math.min(menu.width, (layout?.width ?? menu.width) - 8)

  useLayoutEffect(() => {
    const root = nav.rootRef.current
    const bar = barRef.current
    const group = groupRef.current
    if (!root || !bar || !group) return
    const measure = () => {
      const r = root.getBoundingClientRect()
      const triggers: Record<string, Rect> = {}
      nav.triggers.current.forEach((el, id) => {
        const b = el.getBoundingClientRect()
        triggers[id] = { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }
      })
      const g = group.getBoundingClientRect()
      setLayout({ width: r.width, bar: bar.offsetHeight, pill: { x: g.left - r.left - PILL_PAD, w: g.width + PILL_PAD * 2 }, triggers })
    }
    measure()
    document.fonts.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [nav.rootRef, nav.triggers])

  // Every menu's height at its real width, measured off-screen, so the metal never guesses
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el || !layout) return
    const next: Record<string, number> = {}
    el.querySelectorAll<HTMLElement>('[data-menu]').forEach((m) => {
      next[m.dataset.menu!] = m.offsetHeight
    })
    setHeights(next)
  }, [layout])

  const menu = nav.menu
  const bar = layout?.bar ?? 56
  const pill = layout?.pill
  const pillY = (bar - PILL_H) / 2
  const pillBottom = pillY + PILL_H
  // Far enough below the strip that only the neck joins them, not a film along the whole edge
  const top = pillBottom + 18
  const w = menu ? widthOf(menu) : 0
  const h = menu ? heights[menu.id] ?? 0 : 0
  const t = menu ? layout?.triggers[menu.id] : undefined
  // Under its trigger but inside the strip's span when it fits; wider panels centre on the strip
  const x = (() => {
    if (!t || !layout || !pill) return 0
    const under = t.x + t.w / 2 - w / 2
    const aligned = w <= pill.w ? Math.max(pill.x, Math.min(under, pill.x + pill.w - w)) : pill.x + pill.w / 2 - w / 2
    return Math.max(0, Math.min(aligned, layout.width - w))
  })()
  const cx = x + w / 2
  // Where the neck meets the panel: straight below the open trigger, clear of the corners
  const anchor = t ? Math.max(x + PANEL_RADIUS + 12, Math.min(x + w - PANEL_RADIUS - 12, t.x + t.w / 2)) : cx
  const ready = !!(menu && t && h)

  const stiff = (stiffness: number, damping: number) => (reduce ? { stiffness: 3000, damping: 200 } : { stiffness, damping })

  // The bulge chases the cursor along the strip, never past its ends; with the cursor
  // elsewhere it rests under the open trigger
  const target = useMotionValue(0)
  const bulgeX = useSpring(target, stiff(260, 24))
  const bulgeY = useMotionValue(pillBottom - 2)
  const bulgeLeft = useTransform(bulgeX, (v) => v - BULGE / 2)
  const panelCx = useSpring(anchor, stiff(170, 20))
  const panelTop = useMotionValue(top + 12)
  useEffect(() => {
    if (menu) panelCx.set(anchor)
  }, [menu, anchor, panelCx])
  useEffect(() => {
    if (!onPill && t) target.set(t.x + t.w / 2)
  }, [onPill, t, target])
  useEffect(() => {
    bulgeY.set(pillBottom - 2)
    panelTop.set(top + 12)
  }, [pillBottom, top, bulgeY, panelTop])

  // A glint that follows the cursor across the panel
  const panelLeft = useRef(x)
  panelLeft.current = x
  const px = useMotionValue(-999)
  const glintX = useTransform(px, (v) => v - panelLeft.current)
  const glint = useMotionTemplate`radial-gradient(180px 90px at ${glintX}px 0px, var(--chrome-glint), transparent 70%)`

  const flow = reduce ? { duration: 0 } : { type: 'spring' as const, visualDuration: 0.5, bounce: 0.3 }

  // The panel's metal: grows out of the bar, flows between menus, melts back up
  const drop = {
    className: 'absolute left-0 top-0',
    style: { background: 'var(--chrome-sheen)', borderRadius: PANEL_RADIUS },
    initial: { x: anchor - 20, y: pillBottom - 20, width: 40, height: 40 },
    animate: { x, y: top, width: w, height: h },
    exit: {
      x: anchor - 30,
      y: pillBottom - 30,
      width: 60,
      height: 30,
      opacity: 0,
      transition: { duration: reduce ? 0 : 0.28, ease: 'easeIn' as const },
    },
    transition: flow,
  }

  return (
    // The bar sits centred, high enough that the tallest menu still fits below it
    <div className='chrome-nav flex min-h-[440px] w-full items-start self-stretch pt-6'>
      <div
        {...nav.rootProps}
        onPointerMove={(e) => {
          nav.rootProps.onPointerMove(e)
          if (e.pointerType !== 'mouse' || !pill) return
          const r = e.currentTarget.getBoundingClientRect()
          const lx = e.clientX - r.left
          const ly = e.clientY - r.top
          px.set(lx)
          const over = ly < bar && lx > pill.x - 12 && lx < pill.x + pill.w + 12
          setOnPill(over)
          if (over) target.set(Math.max(pill.x + BULGE / 2 + 8, Math.min(pill.x + pill.w - BULGE / 2 - 8, lx)))
        }}
        onPointerLeave={(e) => {
          nav.rootProps.onPointerLeave(e)
          setOnPill(false)
        }}
        className='relative w-full'>
        <svg aria-hidden width='0' height='0' className='absolute'>
          <defs>
            <filter id={goo}>
              <feGaussianBlur in='SourceGraphic' stdDeviation='7' />
              <feColorMatrix values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12' />
            </filter>
          </defs>
        </svg>

        {/* The metal. The shadow sits outside the goo, so the filter doesn't swallow it */}
        <div aria-hidden className='pointer-events-none absolute inset-x-0 top-0 h-[440px] drop-shadow-[0_8px_14px_rgb(0_0_0/0.16)]'>
          <div className='absolute inset-0' style={{ filter: reduce ? undefined : `url(#${goo})` }}>
            {pill ? (
              <div
                className='absolute rounded-full'
                style={{ left: pill.x, top: pillY, width: pill.w, height: PILL_H, background: 'var(--chrome-bead)' }}
              />
            ) : null}
            <AnimatePresence>
              {onPill || menu ? (
                <motion.div
                  key='bulge'
                  className='absolute left-0 top-0 rounded-full'
                  style={{ x: bulgeLeft, y: pillBottom - BULGE + 14, width: BULGE, height: BULGE, background: 'var(--chrome-bead)' }}
                  initial={{ scale: 0.3 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.3 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                />
              ) : null}
              {ready
                ? [0.2, 0.4, 0.6, 0.8].map((k, i) => (
                    <TendrilBead key={k} from={[bulgeX, bulgeY]} to={[panelCx, panelTop]} k={k} size={[24, 22, 22, 24][i]} />
                  ))
                : null}
              {ready ? <motion.div key='drop' {...drop} /> : null}
            </AnimatePresence>
          </div>

          {/* The goo rounds every corner its own way. A crisp copy on top pins the strip and
              the settled panel to their real radii; the melting stays where the tendril joins */}
          {pill ? (
            <div
              className='absolute rounded-full'
              style={{ left: pill.x, top: pillY, width: pill.w, height: PILL_H, background: 'var(--chrome-bead)' }}
            />
          ) : null}
          <AnimatePresence>
            {ready ? (
              <motion.div
                key='crisp'
                {...drop}
                initial={{ ...drop.initial, opacity: 0 }}
                animate={{ ...drop.animate, opacity: 1 }}
                exit={{ ...drop.exit, opacity: 0, transition: { duration: 0.06 } }}
                transition={{ ...flow, opacity: { duration: 0.15, delay: reduce ? 0 : 0.3 } }}
              />
            ) : null}
          </AnimatePresence>
        </div>

        <div ref={barRef} className='relative flex h-14 items-center'>
          {/* Covers the gap under the bar, so the cursor never falls out on the way down */}
          {menu ? <span aria-hidden className='absolute inset-x-0 top-full h-3' /> : null}
          {/* Empty bar either side: reaching it closes the menu, like a plain link */}
          <div aria-hidden {...nav.plainProps} className='h-full flex-1' />
          <div ref={groupRef} className='flex items-center sm:gap-1'>
            {MENUS.map((m) => {
              const open = menu?.id === m.id
              return (
                <button
                  key={m.id}
                  {...nav.triggerProps(m.id)}
                  className={[
                    'relative flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] transition-colors duration-150 [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:text-sm',
                    open
                      ? 'text-[color:var(--chrome-ink)]'
                      : 'text-[color:var(--chrome-ink-muted)] [@media(hover:hover)]:hover:text-[color:var(--chrome-ink)]',
                  ].join(' ')}>
                  {m.label}
                  <ChevronDown
                    aria-hidden
                    className='h-3.5 w-3.5 opacity-60 transition-transform duration-200 ease-out'
                    style={{ transform: open ? 'rotate(180deg)' : undefined }}
                  />
                </button>
              )
            })}
            {LINKS.map((link) => (
              <a
                key={link}
                href='#'
                {...nav.plainProps}
                onClick={(e) => e.preventDefault()}
                className={[
                  'relative flex h-9 items-center rounded-full px-2.5 text-[13px] text-[color:var(--chrome-ink-muted)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:text-sm [@media(hover:hover)]:hover:text-[color:var(--chrome-ink)]',
                  // No room on a phone; Contact stays
                  link === 'About' ? 'hidden sm:flex' : '',
                ].join(' ')}>
                {link}
              </a>
            ))}
          </div>
          <div aria-hidden {...nav.plainProps} className='h-full flex-1' />
        </div>

        <AnimatePresence>
          {ready ? (
            <motion.div
              key='content'
              ref={nav.panelRef}
              id={`chrome-nav-${menu!.id}`}
              className='absolute left-0 z-10 overflow-hidden text-[color:var(--chrome-ink)]'
              style={{ top, borderRadius: PANEL_RADIUS }}
              initial={{ x, width: w, height: h, opacity: 0 }}
              animate={{ x, width: w, height: h, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              transition={{
                x: flow,
                width: flow,
                height: flow,
                // Only once the metal is under the words
                opacity: { duration: 0.2, delay: reduce ? 0 : 0.2 },
              }}>
              <motion.span aria-hidden className='pointer-events-none absolute inset-0' style={{ background: glint }} />
              <AnimatePresence initial={false} mode='popLayout' custom={nav.direction}>
                <motion.div
                  key={menu!.id}
                  custom={nav.direction}
                  variants={{
                    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 20, filter: 'blur(4px)' }),
                    leave: (d: number) =>
                      reduce
                        ? { opacity: 0, transition: { duration: 0.1 } }
                        : { opacity: 0, x: d * -20, filter: 'blur(4px)', transition: { duration: 0.12 } },
                  }}
                  initial='enter'
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit='leave'
                  transition={{ duration: 0.28, ease: EASE_OUT, delay: 0.06 }}>
                  <Rows menu={menu!} width={w} onPick={nav.close} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div ref={measureRef} aria-hidden className='pointer-events-none invisible absolute left-0 top-0'>
          {MENUS.map((m) => (
            <div key={m.id} data-menu={m.id}>
              <Rows menu={m} width={widthOf(m)} measure />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
