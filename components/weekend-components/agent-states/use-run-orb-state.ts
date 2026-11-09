'use client'

import { useEffect, useState } from 'react'
import type { StateId } from './sim'

// Long enough for Responding to read as its own beat before the orb winds down
const RESPONDING_MS = 2600

/** Which state the orb should show for an agent run in another component */
export function useRunOrbState({
  started = true,
  phase,
  verb,
}: {
  started?: boolean
  phase: string
  /** The step at work, since looking things up and changing them are different states */
  verb?: string
}): StateId {
  const [ended, setEnded] = useState(false)
  const done = phase === 'done'

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setEnded(true), RESPONDING_MS)
    return () => clearTimeout(t)
  }, [done])

  if (!started) return 'idle'
  if (done) return ended ? 'ended' : 'responding'
  if (phase === 'waiting') return 'waiting'
  if (phase === 'starting') return 'queued'
  return verb === 'Read' || verb === 'Search' ? 'thinking' : 'acting'
}
