'use client'

import { useIsMac } from '@/hooks/use-is-mac'
import { cn } from '@/lib/utils'
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react'

/* ============================================================
   Shortcut recorder — the settings field for key bindings.
   Keys appear as keycaps while they're held, the result is checked
   against the other actions and the browser's own shortcuts, and
   everything is spelled the way the viewer's platform spells it.
   ============================================================ */

/** `primary` is ⌘ on Apple platforms and Ctrl everywhere else; `ctrl` is the Mac ⌃ key */
type Combo = { primary: boolean; ctrl: boolean; alt: boolean; shift: boolean; key: string }

type ActionId = 'palette' | 'create' | 'sidebar' | 'done'

const combo = (key: string, mods: Partial<Omit<Combo, 'key'>> = {}): Combo => ({
  primary: false,
  ctrl: false,
  alt: false,
  shift: false,
  ...mods,
  key,
})

const ACTIONS: { id: ActionId; label: string; initial: Combo }[] = [
  { id: 'palette', label: 'Open command menu', initial: combo('K', { primary: true }) },
  { id: 'create', label: 'Create issue', initial: combo('C') },
  { id: 'sidebar', label: 'Toggle sidebar', initial: combo('\\', { primary: true }) },
  { id: 'done', label: 'Mark as done', initial: combo('Enter', { primary: true }) },
]

const NAMED_CODES: Record<string, string> = {
  Backslash: '\\',
  Slash: '/',
  Period: '.',
  Comma: ',',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
  Minus: '-',
  Equal: '=',
  Backquote: '`',
  Enter: 'Enter',
  NumpadEnter: 'Enter',
  Space: 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
}

/**
 * Read the physical key, not `event.key`: with ⌥ held on a Mac, `key` turns
 * K into "˚", but `code` stays "KeyK".
 */
function keyFromCode(code: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter) return letter[1]
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(code)
  if (digit) return digit[1]
  if (/^F\d{1,2}$/.test(code)) return code
  return NAMED_CODES[code] ?? null
}

const isModifierCode = (code: string) => /^(Meta|OS|Control|Alt|Shift)(Left|Right)?$/.test(code)

function readMods(e: KeyboardEvent, isMac: boolean): Omit<Combo, 'key'> {
  return {
    primary: isMac ? e.metaKey : e.ctrlKey,
    ctrl: isMac ? e.ctrlKey : false,
    alt: e.altKey,
    shift: e.shiftKey,
  }
}

const same = (a: Combo | null, b: Combo | null) =>
  !!a &&
  !!b &&
  a.key === b.key &&
  a.primary === b.primary &&
  a.ctrl === b.ctrl &&
  a.alt === b.alt &&
  a.shift === b.shift

/** Shortcuts the browser keeps for itself; a page can't reliably override these */
function isReserved(c: Combo, isMac: boolean) {
  if (!c.primary || c.ctrl || c.alt) return !isMac && c.alt && c.key === 'F4'
  const plain = isMac ? ['Q', 'W', 'T', 'N', 'R', 'L', 'H', 'M'] : ['W', 'T', 'N', 'R', 'L']
  return c.shift ? ['T', 'N'].includes(c.key) : plain.includes(c.key)
}

/** Keycap labels in each platform's conventional order */
function capsFor(c: Partial<Combo>, isMac: boolean): string[] {
  const caps = isMac
    ? [c.ctrl && '⌃', c.alt && '⌥', c.shift && '⇧', c.primary && '⌘']
    : [c.primary && 'Ctrl', c.alt && 'Alt', c.shift && 'Shift']
  return [...caps, c.key].filter((k): k is string => !!k)
}

function spoken(c: Combo, isMac: boolean) {
  const names = isMac
    ? [c.ctrl && 'Control', c.alt && 'Option', c.shift && 'Shift', c.primary && 'Command']
    : [c.primary && 'Control', c.alt && 'Alt', c.shift && 'Shift']
  const key = c.key === '\\' ? 'Backslash' : c.key
  return [...names, key].filter(Boolean).join(' ')
}

type Problem =
  | { kind: 'reserved'; actionId: ActionId; combo: Combo }
  | { kind: 'conflict'; actionId: ActionId; combo: Combo; withId: ActionId }

const ease = [0.23, 1, 0.32, 1] as const

export function ShortcutRecorder() {
  const isMac = useIsMac()
  const reduceMotion = useReducedMotion() ?? false

  const [bindings, setBindings] = useState<Record<ActionId, Combo | null>>(() =>
    Object.fromEntries(ACTIONS.map((a) => [a.id, a.initial])) as Record<ActionId, Combo | null>,
  )
  const [recording, setRecording] = useState<ActionId | null>(null)
  // What's physically held right now, mirrored live as keycaps
  const [held, setHeld] = useState<Partial<Combo>>({})
  const [problem, setProblem] = useState<Problem | null>(null)
  const [saved, setSaved] = useState<{ id: ActionId; n: number } | null>(null)
  const [fired, setFired] = useState<{ id: ActionId; n: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const fieldRefs = useRef<Partial<Record<ActionId, HTMLButtonElement | null>>>({})
  const label = (id: ActionId) => ACTIONS.find((a) => a.id === id)!.label

  function startRecording(id: ActionId) {
    setProblem(null)
    setHeld({})
    setRecording(id)
    setAnnouncement(`Recording a shortcut for ${label(id)}. Press keys, or Escape to cancel.`)
  }

  function stopRecording() {
    setRecording(null)
    setHeld({})
    // A "reserved" notice belongs to the attempt that just ended
    setProblem((p) => (p?.kind === 'reserved' ? null : p))
  }

  function assign(id: ActionId, c: Combo | null, also?: ActionId) {
    setBindings((b) => ({ ...b, [id]: c, ...(also ? { [also]: null } : {}) }))
    setSaved((s) => ({ id, n: (s?.n ?? 0) + 1 }))
    setProblem(null)
    stopRecording()
    setAnnouncement(
      c ? `${label(id)} is now ${spoken(c, isMac)}.` : `Removed the shortcut for ${label(id)}.`,
    )
  }

  function onRecordKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: ActionId) {
    if (recording !== id) return
    const mods = readMods(e, isMac)
    const bare = !mods.primary && !mods.ctrl && !mods.alt && !mods.shift

    // Tab still moves focus, which also cancels recording via blur
    if (e.key === 'Tab' && bare) return
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape' && bare) {
      stopRecording()
      setAnnouncement('Cancelled.')
      return
    }
    if ((e.key === 'Backspace' || e.key === 'Delete') && bare) {
      assign(id, null)
      return
    }
    if (isModifierCode(e.code)) {
      setHeld({ ...mods })
      return
    }

    const key = keyFromCode(e.code)
    if (!key) return
    const next: Combo = { ...mods, key }
    setHeld({ ...mods, key })

    if (isReserved(next, isMac)) {
      setProblem({ kind: 'reserved', actionId: id, combo: next })
      setAnnouncement(`${spoken(next, isMac)} is reserved by the browser. Try another.`)
      return
    }
    const clash = ACTIONS.find((a) => a.id !== id && same(bindings[a.id], next))
    if (clash) {
      setRecording(null)
      setProblem({ kind: 'conflict', actionId: id, combo: next, withId: clash.id })
      setAnnouncement(`${spoken(next, isMac)} is already used by ${clash.label}.`)
      return
    }
    assign(id, next)
  }

  function onRecordKeyUp(e: KeyboardEvent<HTMLButtonElement>) {
    if (!recording) return
    const mods = readMods(e, isMac)
    setHeld((h) => ({ ...mods, key: keyFromCode(e.code) === h.key ? undefined : h.key }))
  }

  // Bindings are live while focus is inside the card, so they can be tried out
  function onCardKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (recording || e.repeat) return
    const key = keyFromCode(e.code)
    if (!key) return
    const pressed: Combo = { ...readMods(e, isMac), key }
    const match = ACTIONS.find((a) => same(bindings[a.id], pressed))
    if (!match) return
    // A bare letter on a focused button shouldn't also click it
    e.preventDefault()
    setFired((f) => ({ id: match.id, n: (f?.n ?? 0) + 1 }))
    setAnnouncement(`Ran ${match.label}.`)
  }

  return (
    <div
      onKeyDown={onCardKeyDown}
      className='w-full max-w-[420px] rounded-xl border bg-background shadow-sm'>
      <div className='border-b px-3 py-2 text-xs font-medium'>Keyboard shortcuts</div>

      <ul className='p-1.5'>
        {ACTIONS.map((action) => (
          <ShortcutRow
            key={action.id}
            label={action.label}
            binding={bindings[action.id]}
            isMac={isMac}
            reduceMotion={reduceMotion}
            recording={recording === action.id}
            held={held}
            problem={problem?.actionId === action.id ? problem : null}
            savedTick={saved?.id === action.id ? saved.n : 0}
            firedTick={fired?.id === action.id ? fired.n : 0}
            fieldRef={(el) => (fieldRefs.current[action.id] = el)}
            onRecord={() => (recording === action.id ? stopRecording() : startRecording(action.id))}
            onKeyDown={(e) => onRecordKeyDown(e, action.id)}
            onKeyUp={onRecordKeyUp}
            onBlur={() => recording === action.id && stopRecording()}
            onReplace={() => {
              if (problem?.kind !== 'conflict') return
              assign(problem.actionId, problem.combo, problem.withId)
              // The Replace button is about to unmount; keep focus on the field
              fieldRefs.current[action.id]?.focus()
            }}
            onCancelProblem={() => {
              setProblem(null)
              fieldRefs.current[action.id]?.focus()
            }}
            conflictLabel={problem?.kind === 'conflict' ? label(problem.withId) : ''}
          />
        ))}
      </ul>

      <p className='border-t px-3 py-2 text-xs text-muted-foreground'>
        Click a shortcut, then press new keys. <Kbd>Esc</Kbd> cancels, <Kbd>⌫</Kbd> clears.
        Shortcuts work while this card has focus.
      </p>
      <span className='sr-only' aria-live='polite'>
        {announcement}
      </span>
    </div>
  )
}

function ShortcutRow({
  label,
  binding,
  isMac,
  reduceMotion,
  recording,
  held,
  problem,
  savedTick,
  firedTick,
  fieldRef,
  onRecord,
  onKeyDown,
  onKeyUp,
  onBlur,
  onReplace,
  onCancelProblem,
  conflictLabel,
}: {
  label: string
  binding: Combo | null
  isMac: boolean
  reduceMotion: boolean
  recording: boolean
  held: Partial<Combo>
  problem: Problem | null
  savedTick: number
  firedTick: number
  fieldRef: (el: HTMLButtonElement | null) => void
  onRecord: () => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  onKeyUp: (e: KeyboardEvent<HTMLButtonElement>) => void
  onBlur: () => void
  onReplace: () => void
  onCancelProblem: () => void
  conflictLabel: string
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // A refused combination shakes the field, the way a wrong password does
  useEffect(() => {
    if (problem?.kind !== 'reserved' || reduceMotion || !buttonRef.current) return
    animate(buttonRef.current, { x: [0, -4, 4, -3, 2, 0] }, { duration: 0.35, ease: 'easeOut' })
  }, [problem, reduceMotion])

  const liveCaps = capsFor(held, isMac)
  const caps = recording ? liveCaps : binding ? capsFor(binding, isMac) : []
  const problemCaps = problem ? capsFor(problem.combo, isMac).join(isMac ? '' : '+') : ''

  return (
    <li>
      <div className='flex items-center justify-between gap-3 rounded-lg px-2 py-1.5'>
        <span className='flex min-w-0 items-center gap-2 text-sm'>
          <span className='truncate'>{label}</span>
          {/* Proof the binding is live: a quiet "Ran" each time it fires */}
          <AnimatePresence>
            {firedTick ? (
              <motion.span
                key={firedTick}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 3 }}
                animate={{ opacity: [0, 1, 1, 0], y: 0 }}
                transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1], ease }}
                className='shrink-0 rounded-full bg-grass/15 px-1.5 text-[10px] font-medium text-grass'>
                Ran
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>

        <button
          ref={(el) => {
            buttonRef.current = el
            fieldRef(el)
          }}
          type='button'
          onClick={onRecord}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={onBlur}
          aria-pressed={recording}
          aria-label={
            recording
              ? `Recording shortcut for ${label}`
              : `${label}: ${binding ? spoken(binding, isMac) : 'not set'}. Press to change.`
          }
          className={cn(
            'relative flex h-8 min-w-[96px] shrink-0 items-center justify-end gap-1 rounded-md border px-1.5 transition-[border-color,box-shadow,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            recording
              ? 'border-ring bg-background shadow-[0_0_0_3px_hsl(var(--ring)/0.15)]'
              : 'border-transparent hover:border-border hover:bg-muted/50',
            problem?.kind === 'reserved' && 'border-red-500/60',
          )}>
          {/* Keyed overlay rather than re-keying the button, which would drop focus */}
          {savedTick > 0 ? (
            <span
              key={savedTick}
              aria-hidden
              className='saved-flash pointer-events-none absolute inset-0 rounded-[5px]'
            />
          ) : null}
          {caps.length ? (
            <AnimatePresence initial={false} mode='popLayout'>
              {caps.map((cap, i) => (
                <Keycap
                  key={`${cap}-${i}`}
                  pressed={recording}
                  reduceMotion={reduceMotion}>
                  {cap}
                </Keycap>
              ))}
            </AnimatePresence>
          ) : recording ? (
            <span className='px-1 text-xs text-shimmer'>Press keys…</span>
          ) : (
            <span className='px-1 text-xs text-muted-foreground/70'>Not set</span>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {problem ? (
          <motion.div
            key={problem.kind}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15, ease } }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease }}
            className='overflow-hidden'>
            <div
              className={cn(
                'mx-2 mb-1.5 flex items-center justify-between gap-3 rounded-md py-1.5 pl-2.5 pr-1 text-xs',
                problem.kind === 'reserved'
                  ? 'bg-red-500/[0.07] text-red-700 dark:text-red-300'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
              )}>
              {problem.kind === 'reserved' ? (
                <span>
                  {problemCaps} is reserved by the browser. Try another.
                </span>
              ) : (
                <>
                  <span className='min-w-0'>
                    {problemCaps} is already used by “{conflictLabel}”.
                  </span>
                  <span className='flex shrink-0 items-center gap-0.5'>
                    <SmallButton onClick={onReplace}>Replace</SmallButton>
                    <SmallButton onClick={onCancelProblem} quiet>
                      Cancel
                    </SmallButton>
                  </span>
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

function Keycap({
  pressed,
  reduceMotion,
  children,
}: {
  pressed: boolean
  reduceMotion: boolean
  children: ReactNode
}) {
  return (
    <motion.kbd
      layout={reduceMotion ? false : 'position'}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      // Held keys sit a pixel lower and lose their edge, like a real key going down
      animate={{ opacity: 1, scale: 1, y: pressed ? 1 : 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
      transition={{
        default: { duration: 0.15, ease },
        y: { duration: 0.08 },
        layout: { duration: 0.15, ease },
      }}
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-md border bg-background px-1.5 font-sans text-xs font-medium text-foreground transition-shadow duration-75',
        pressed
          ? 'shadow-none'
          : 'shadow-[0_1px_0_0_hsl(var(--border)),0_1px_2px_0_hsl(var(--foreground)/0.06)]',
      )}>
      {children}
    </motion.kbd>
  )
}

function SmallButton({
  onClick,
  quiet,
  children,
}: {
  onClick: () => void
  quiet?: boolean
  children: ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded px-1.5 py-0.5 font-medium transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none',
        quiet && 'font-normal opacity-70',
      )}>
      {children}
    </button>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className='mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground'>
      {children}
    </kbd>
  )
}
