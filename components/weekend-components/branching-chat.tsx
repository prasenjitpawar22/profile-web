'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight, Pencil, RotateCcw } from 'lucide-react'
import { KeyboardEvent, useEffect, useRef, useState } from 'react'

/* ============================================================
   Branching chat — editing an earlier message forks the
   conversation instead of overwriting it. Every version is kept;
   a ‹ 2/3 › switcher steps between them, and everything below
   the fork slides over in the direction you moved.
   ============================================================ */

type Msg = {
  id: string
  role: 'user' | 'assistant'
  parent: string
  text: string
  streaming?: boolean
}

type Tree = {
  nodes: Record<string, Msg>
  /** Children of each node, oldest version first */
  kids: Record<string, string[]>
  /** Which child is showing under each node; unset means the newest */
  active: Record<string, number>
}

const ROOT = 'root'

const SEED: Tree = {
  nodes: {
    b1: { id: 'b1', role: 'user', parent: ROOT, text: 'Suggest a name for my bookshop' },
    b2: {
      id: 'b2',
      role: 'assistant',
      parent: 'b1',
      text: 'How about **Marginalia**? The notes readers leave in the edges, which is what a good bookshop collects too.',
    },
    c1: { id: 'c1', role: 'user', parent: ROOT, text: 'Suggest a name for my coffee shop' },
    c2: {
      id: 'c2',
      role: 'assistant',
      parent: 'c1',
      text: 'How about **Second Pour**? It nods to the refill, and to the regulars who keep coming back for one.',
    },
    c3: { id: 'c3', role: 'user', parent: 'c2', text: 'Something shorter?' },
    c4: {
      id: 'c4',
      role: 'assistant',
      parent: 'c3',
      text: '**Pour.** One word. Fits on a sign and a social handle, and still sounds like you.',
    },
  },
  kids: { [ROOT]: ['b1', 'c1'], b1: ['b2'], c1: ['c2'], c2: ['c3'], c3: ['c4'] },
  active: {},
}

const ease = [0.23, 1, 0.32, 1] as const

/* ---------- A tiny, deterministic "model" ---------- */

type Idea = { name: string; why: string }

const IDEAS: { match: RegExp; ideas: Idea[] }[] = [
  {
    match: /coffee|caf[eé]|espresso/,
    ideas: [
      { name: 'Second Pour', why: 'It nods to the refill, and to the regulars who keep coming back for one.' },
      { name: 'Slow Drip', why: 'It promises the opposite of a rushed takeaway.' },
      { name: 'Crema', why: 'Short, warm, and every coffee person knows exactly what it means.' },
    ],
  },
  {
    match: /book/,
    ideas: [
      { name: 'Marginalia', why: 'The notes readers leave in the edges, which is what a good bookshop collects too.' },
      { name: 'Dog-Eared', why: 'It sounds like a book that has been loved, not shelved.' },
      { name: 'Spine & Story', why: 'It names the object and the reason you pick it up.' },
    ],
  },
  {
    match: /bak|bread|pastr|cake/,
    ideas: [
      { name: 'Proof', why: 'The quiet hour where dough rises, and a promise the bread is real.' },
      { name: 'Rise & Crumb', why: 'The beginning and the end of every loaf.' },
      { name: 'Early Oven', why: 'It tells people when to come, and why it is worth it.' },
    ],
  },
  {
    match: /plant|flower|flor|garden/,
    ideas: [
      { name: 'Repot', why: 'It sounds like a fresh start, which is what people buy plants for.' },
      { name: 'Leaf & Loam', why: 'Green on top, good soil underneath.' },
      { name: 'Petal Press', why: 'Soft, a little nostalgic, and easy to remember.' },
    ],
  },
  {
    match: /bike|cycl/,
    ideas: [
      { name: 'Freewheel', why: 'The best part of any ride, in one word.' },
      { name: 'Spoke', why: 'A bike part, and a nod to a shop people talk about.' },
      { name: 'Chain & Crank', why: 'Mechanical and honest, like the work you do.' },
    ],
  },
  {
    match: /bar|pub|wine|cocktail/,
    ideas: [
      { name: 'Low Light', why: 'It sets the mood before anyone walks in.' },
      { name: 'Last Call', why: 'Familiar, a little cheeky, and impossible to forget.' },
      { name: 'The Decanter', why: 'It sounds patient, like a place that pours properly.' },
    ],
  },
]

const ANYTHING: Idea[] = [
  { name: 'Common Ground', why: 'Welcoming, and it works for almost anything you sell.' },
  { name: 'Small Hours', why: 'It feels personal, like a place run by someone who cares.' },
  { name: 'Northside', why: 'Rooted in a place, so the neighbourhood claims it as theirs.' },
]

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

const poolFor = (text: string) =>
  IDEAS.find((g) => g.match.test(text.toLowerCase()))?.ideas

function lastName(history: Msg[]) {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i]
    const found = m.role === 'assistant' && m.text.match(/\*\*(.+?)\*\*/)
    if (found) return found[1].replace(/[.?!]$/, '')
  }
}

function shorten(name: string) {
  const words = name.split(/\s+/).filter((w) => !/^(the|&|and|of|a)$/i.test(w))
  return words[words.length - 1] ?? name
}

function reply(history: Msg[]): string {
  const ask = history[history.length - 1].text.trim()
  const lower = ask.toLowerCase()
  const firstAsk = history.find((m) => m.role === 'user')?.text ?? ask
  const pool = poolFor(ask) ?? poolFor(firstAsk) ?? ANYTHING
  const previous = poolFor(ask) ? undefined : lastName(history)
  const fresh = pool.filter((i) => i.name !== previous)
  const pick = fresh[hash(lower) % fresh.length]

  if (previous && /short|one word|snappier|punchier/.test(lower)) {
    const short = shorten(previous)
    return short === previous
      ? `**${previous}** is already a single word. Any shorter and it stops being a name.`
      : `**${short}.** One word. Fits on a sign and a social handle, and still sounds like you.`
  }
  if (previous && /another|different|else|other|more/.test(lower)) {
    return `Sure, how about **${pick.name}**? ${pick.why}`
  }
  if (previous && !/name|call/.test(lower)) {
    return `I'd still go with **${previous}**, but for a different feel, try **${pick.name}**. ${pick.why}`
  }
  if (!poolFor(ask) && !/name|call/.test(lower)) {
    return 'Tell me what the shop sells and I’ll suggest a name for it.'
  }
  return `How about **${pick.name}**? ${pick.why}`
}

/* ---------- Tree helpers ---------- */

const activeIndex = (tree: Tree, key: string) =>
  tree.active[key] ?? (tree.kids[key]?.length ?? 1) - 1

function historyOf(tree: Tree, id: string) {
  const out: Msg[] = []
  for (let m = tree.nodes[id]; m; m = tree.nodes[m.parent]) out.unshift(m)
  return out
}

/* ---------- Component ---------- */

type Ctx = {
  tree: Tree
  dir: number
  reduceMotion: boolean
  editing: string | null
  onSwitch: (parent: string, delta: number) => void
  onEdit: (id: string) => void
  onSave: (id: string, text: string) => void
  onCancel: () => void
}

export function BranchingChat() {
  const reduceMotion = useReducedMotion() ?? false
  const [tree, setTree] = useState(SEED)
  const [dir, setDir] = useState(1)
  const [editing, setEditing] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const nextId = useRef(1)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Follow a streaming reply down, unless the reader has scrolled up to look at something
  const scroller = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const streaming = Object.values(tree.nodes).some((m) => m.streaming)
  useEffect(() => {
    const el = scroller.current
    if (streaming && el && stick.current) el.scrollTop = el.scrollHeight
  }, [tree, streaming])

  const setText = (id: string, text: string, done: boolean) =>
    setTree((t) => ({
      ...t,
      nodes: { ...t.nodes, [id]: { ...t.nodes[id], text, streaming: !done } },
    }))

  function respond(userId: string, history: Msg[]) {
    const id = `m${nextId.current++}`
    const words = reply(history).match(/\S+\s*/g) ?? []
    setTree((t) => ({
      ...t,
      nodes: { ...t.nodes, [id]: { id, role: 'assistant', parent: userId, text: '', streaming: true } },
      kids: { ...t.kids, [userId]: [id] },
    }))

    let shown = 0
    const tick = () => {
      shown++
      const done = shown >= words.length
      setText(id, words.slice(0, shown).join('').trimEnd(), done)
      if (!done) timers.current.push(window.setTimeout(tick, 30 + Math.random() * 45))
    }
    timers.current.push(window.setTimeout(tick, 650))
  }

  function onSave(id: string, text: string) {
    const node = tree.nodes[id]
    const value = text.trim()
    setEditing(null)
    if (!value || value === node.text) return

    // A new sibling, never an overwrite: the old version stays one click away
    const newId = `m${nextId.current++}`
    const msg: Msg = { id: newId, role: 'user', parent: node.parent, text: value }
    const count = (tree.kids[node.parent]?.length ?? 0) + 1
    setTree((t) => {
      const siblings = t.kids[node.parent] ?? []
      return {
        ...t,
        nodes: { ...t.nodes, [newId]: msg },
        kids: { ...t.kids, [node.parent]: [...siblings, newId] },
        active: { ...t.active, [node.parent]: siblings.length },
      }
    })
    setDir(1)
    setStatus(`Forked. Showing version ${count} of ${count}.`)
    stick.current = true
    respond(newId, [...historyOf(tree, node.parent), msg])
  }

  function onSwitch(parent: string, delta: number) {
    const count = tree.kids[parent].length
    const index = Math.min(count - 1, Math.max(0, activeIndex(tree, parent) + delta))
    setEditing(null)
    setDir(delta)
    setTree((t) => ({ ...t, active: { ...t.active, [parent]: index } }))
    setStatus(`Showing version ${index + 1} of ${count}.`)
  }

  function reset() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setEditing(null)
    setDir(-1)
    setTree(SEED)
    setStatus('Conversation reset.')
  }

  const ctx: Ctx = {
    tree,
    dir,
    reduceMotion,
    editing,
    onSwitch,
    onEdit: setEditing,
    onSave,
    onCancel: () => setEditing(null),
  }

  return (
    <div className='flex w-full max-w-[440px] flex-col rounded-xl border bg-background shadow-sm'>
      <div className='flex items-center justify-between gap-3 border-b px-3 py-2'>
        <span className='text-xs font-medium'>Naming the shop</span>
        <button
          type='button'
          onClick={reset}
          disabled={tree === SEED}
          className='inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-[color,background-color,opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-0 motion-reduce:transition-none'>
          <RotateCcw aria-hidden className='h-3 w-3' />
          Reset
        </button>
      </div>

      <div
        ref={scroller}
        role='region'
        aria-label='Conversation'
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
        }}
        className='h-[340px] overflow-y-auto overflow-x-hidden px-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'>
        <div className='flex flex-col gap-4'>
          <Level parent={ROOT} ctx={ctx} />
        </div>
      </div>

      <p className='border-t px-3 py-2 text-xs text-muted-foreground'>
        Edit a message to fork the conversation. Nothing gets overwritten.
      </p>

      <span aria-live='polite' className='sr-only'>
        {status}
      </span>
    </div>
  )
}

/* Each level renders the active child of `parent`, then recurses into it */
function Level({ parent, ctx }: { parent: string; ctx: Ctx }) {
  const ids = ctx.tree.kids[parent]
  if (!ids?.length) return null
  const node = ctx.tree.nodes[ids[activeIndex(ctx.tree, parent)]]

  if (node.role === 'assistant') {
    return (
      <>
        <AssistantMessage msg={node} />
        <Level parent={node.id} ctx={ctx} />
      </>
    )
  }
  return <UserTurn msg={node} siblings={ids} ctx={ctx} />
}

type Slide = { dir: number; reduceMotion: boolean }

// Versions sit side by side: "next" arrives from the right, "previous" from the left.
// A light blur blends the two versions mid-crossfade, and the old one leaves faster than the new one arrives
const slide = {
  enter: ({ dir, reduceMotion }: Slide) => ({
    opacity: 0,
    filter: 'blur(2px)',
    transform: `translateX(${reduceMotion ? 0 : dir * 16}px)`,
  }),
  center: {
    opacity: 1,
    filter: 'blur(0px)',
    transform: 'translateX(0px)',
    transition: { duration: 0.22, ease },
  },
  exit: ({ dir, reduceMotion }: Slide) => ({
    opacity: 0,
    filter: 'blur(2px)',
    transform: `translateX(${reduceMotion ? 0 : dir * -16}px)`,
    transition: { duration: 0.15, ease },
  }),
}

// The counter rolls the same way: "next" counts up from below
const roll = {
  enter: ({ dir, reduceMotion }: Slide) => ({
    opacity: 0,
    transform: `translateY(${reduceMotion ? 0 : dir * 60}%)`,
  }),
  center: { opacity: 1, transform: 'translateY(0%)', transition: { duration: 0.18, ease } },
  exit: ({ dir, reduceMotion }: Slide) => ({
    opacity: 0,
    transform: `translateY(${reduceMotion ? 0 : dir * -60}%)`,
    transition: { duration: 0.12, ease },
  }),
}

function UserTurn({ msg, siblings, ctx }: { msg: Msg; siblings: string[]; ctx: Ctx }) {
  const custom: Slide = { dir: ctx.dir, reduceMotion: ctx.reduceMotion }
  const index = siblings.indexOf(msg.id)
  const editing = ctx.editing === msg.id
  const busy = Object.values(ctx.tree.nodes).some(
    (m) => m.streaming && m.parent === msg.id,
  )

  // Only what changes between versions moves; the controls stay put so focus survives a switch
  const swap = (children: React.ReactNode, className?: string) => (
    <div className='relative'>
      <AnimatePresence initial={false} mode='popLayout' custom={custom}>
        <motion.div
          key={msg.id}
          custom={custom}
          variants={slide}
          initial='enter'
          animate='center'
          exit='exit'
          className={className}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )

  return (
    <>
      <div className='flex flex-col gap-1'>
        {swap(
          editing ? (
            <Editor
              initial={msg.text}
              onSave={(text) => ctx.onSave(msg.id, text)}
              onCancel={ctx.onCancel}
            />
          ) : (
            <p className='max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-muted px-3 py-1.5 text-sm'>
              {msg.text}
            </p>
          ),
          'flex justify-end',
        )}

        {editing ? null : (
          <div className='flex items-center justify-end gap-0.5 text-xs text-muted-foreground'>
            <IconButton label='Edit message' disabled={busy} onClick={() => ctx.onEdit(msg.id)}>
              <Pencil className='h-3 w-3' />
            </IconButton>

            {siblings.length > 1 ? (
              <div role='group' aria-label='Message versions' className='flex items-center'>
                <IconButton
                  label='Previous version'
                  disabled={index === 0}
                  onClick={() => ctx.onSwitch(msg.parent, -1)}>
                  <ChevronLeft className='h-3.5 w-3.5' />
                </IconButton>
                <span className='flex min-w-[2.5rem] justify-center tabular-nums'>
                  <span className='relative inline-flex overflow-hidden'>
                    <AnimatePresence initial={false} mode='popLayout' custom={custom}>
                      <motion.span
                        key={index}
                        custom={custom}
                        variants={roll}
                        initial='enter'
                        animate='center'
                        exit='exit'>
                        {index + 1}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  /{siblings.length}
                </span>
                <IconButton
                  label='Next version'
                  disabled={index === siblings.length - 1}
                  onClick={() => ctx.onSwitch(msg.parent, 1)}>
                  <ChevronRight className='h-3.5 w-3.5' />
                </IconButton>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {swap(<Level parent={msg.id} ctx={ctx} />, 'flex flex-col gap-4')}
    </>
  )
}

function AssistantMessage({ msg }: { msg: Msg }) {
  if (msg.streaming && !msg.text) {
    return (
      <div aria-label='Thinking' className='flex h-6 items-center gap-1'>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: `${delay}ms` }}
            className='h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60 motion-reduce:animate-none'
          />
        ))}
      </div>
    )
  }

  return (
    <p className='max-w-[92%] text-sm leading-6 text-foreground/80'>
      {msg.text.split('**').map((part, i) =>
        // Odd segments sit between ** markers; an unclosed marker mid-stream just stays bold
        i % 2 ? (
          <strong key={i} className='font-medium text-foreground'>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
      {msg.streaming ? (
        <span
          aria-hidden
          className='ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-[1px] bg-foreground/60 motion-reduce:animate-none'
        />
      ) : null}
    </p>
  )
}

function Editor({
  initial,
  onSave,
  onCancel,
}: {
  initial: string
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(initial)
  const ref = useRef<HTMLTextAreaElement>(null)
  const changed = text.trim() !== '' && text.trim() !== initial

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (changed) onSave(text)
    }
  }

  return (
    <div className='flex w-[85%] flex-col gap-2 rounded-2xl border bg-background p-2 shadow-sm'>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label='Edit message'
        rows={Math.max(1, Math.ceil(text.length / 40))}
        className='w-full resize-none bg-transparent px-1 text-base outline-none [field-sizing:content] sm:text-sm'
      />
      <div className='flex items-center justify-end gap-1 text-xs'>
        <button
          type='button'
          onClick={onCancel}
          className='rounded-md px-2 py-1 text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none'>
          Cancel
        </button>
        <button
          type='button'
          disabled={!changed}
          onClick={() => onSave(text)}
          className='rounded-md bg-foreground px-2 py-1 font-medium text-background transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:opacity-40 motion-reduce:transition-none'>
          Fork
        </button>
      </div>
    </div>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className='grid h-6 w-6 place-items-center rounded-md transition-[color,background-color,opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-none'>
      {children}
    </button>
  )
}
