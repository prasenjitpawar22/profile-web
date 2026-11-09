'use client'

import { motion, useReducedMotion } from 'motion/react'

/** One stroke weight for every icon in the card */
export const ICON_STROKE = 1.75

// Lucide's shapes, written as single paths and split in two. `still` is what makes the icon
// recognisable and never moves once drawn. `live` is the part that does the task's work
const SHAPES: Record<string, { still: string[]; live: string[] }> = {
  // The page holds still while its lines of text are scanned, top to bottom
  Read: {
    still: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4'],
    live: ['M10 9H8', 'M16 13H8', 'M16 17H8'],
  },
  // The lens traces round while the handle stays put
  Search: {
    still: ['m21 21-4.3-4.3'],
    live: ['M11 3a8 8 0 1 1 0 16a8 8 0 1 1 0-16Z'],
  },
  // A meridian sweeps a globe that stays where it is
  'Web search': {
    still: ['M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20Z', 'M2 12h20'],
    live: ['M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'],
  },
  // The arrow drops onto a line that is already there
  Fetch: {
    still: ['M19 21H5'],
    live: ['M12 3v14', 'm6 11 6 6 6-6'],
  },
  // The pen moves over a page that doesn't
  Edit: {
    still: ['M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5', 'M14 2v4a2 2 0 0 0 2 2h4'],
    live: [
      'M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z',
    ],
  },
  // The window is fixed; the prompt and cursor type themselves
  Run: {
    still: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'],
    live: ['m7 11 2-2-2-2', 'M11 13h4'],
  },
  // The pencil holds while the line under it gets written
  Write: {
    still: [
      'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      'm15 5 4 4',
    ],
    live: ['M13 21h8'],
  },
  // Turns the corner, then lands
  Instead: {
    still: [],
    live: ['M4 4v7a4 4 0 0 0 4 4h12', 'M15 10l5 5-5 5'],
  },
}

const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
const EASE_OUT = [0.23, 1, 0.32, 1] as const

const HIDDEN = { pathLength: 0, pathOffset: 0, opacity: 0 }
const DRAWN = { pathLength: 1, pathOffset: 0, opacity: 1 }

// Draws on, holds, then wipes away from where it started. Opacity only hides the round cap,
// which would otherwise sit there as a dot while the stroke has no length
const WORKING = {
  pathLength: [0, 0.03, 1, 1, 1, 1],
  pathOffset: [0, 0, 0, 0, 1, 1],
  opacity: [0, 1, 1, 1, 1, 0],
}

const LOOP_S = 1.6
const STROKE_DELAY_S = 0.06
const LIVE_STAGGER_S = 0.14
// The moving strokes wait until the fixed part has finished drawing on
const STILL_DRAW_S = 0.24
/** How visible a moving stroke's path stays while it's between passes */
const GHOST = 0.28

const settle = (delay: number) => ({ duration: STILL_DRAW_S, ease: EASE_OUT, delay })

export function TaskIcon({
  verb,
  running,
  denied,
  className,
}: {
  verb: string
  running: boolean
  denied: boolean
  className?: string
}) {
  const reduce = useReducedMotion() ?? false
  const working = running && !reduce
  const { still, live } = SHAPES[verb] ?? SHAPES.Read
  const liveStart = still.length ? still.length * STROKE_DELAY_S + STILL_DRAW_S : 0
  return (
    <svg
      aria-hidden
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={ICON_STROKE}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}>
      {still.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          initial={reduce ? false : HIDDEN}
          animate={DRAWN}
          transition={settle(i * STROKE_DELAY_S)}
        />
      ))}
      {live.map((d) => (
        <motion.path
          key={`ghost-${d}`}
          d={d}
          initial={{ opacity: 0 }}
          animate={{ opacity: working ? GHOST : 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT, delay: working ? liveStart : 0 }}
        />
      ))}
      {live.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          data-live=''
          initial={reduce ? false : HIDDEN}
          animate={working ? WORKING : DRAWN}
          transition={
            working
              ? {
                  duration: LOOP_S,
                  times: [0, 0.03, 0.46, 0.6, 0.97, 1],
                  ease: ['linear', EASE_IN_OUT, 'linear', EASE_IN_OUT, 'linear'],
                  repeat: Infinity,
                  repeatDelay: live.length > 1 ? 0.2 : 0,
                  delay: liveStart + i * LIVE_STAGGER_S,
                }
              : settle(i * STROKE_DELAY_S)
          }
        />
      ))}
      {/* Struck out rather than swapped, so a denied task keeps its icon and nothing pops */}
      {denied ? (
        <motion.path d='m3 3 18 18' initial={reduce ? false : HIDDEN} animate={DRAWN} transition={settle(0)} />
      ) : null}
    </svg>
  )
}
