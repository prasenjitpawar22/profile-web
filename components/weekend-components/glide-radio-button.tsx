'use client'
import { motion, Transition, useReducedMotion } from 'motion/react'
import { useId, useRef, useState } from 'react'

const radios = [
  { id: 'creator', name: 'Creator' },
  { id: 'bidder', name: 'Bidder' },
]

// Mid-flight the dot swells into a rounded square and spins, then settles back
const tumble = {
  scale: [1, 1.6, 1.6, 1],
  rotate: [0, 90, 180, 180],
  borderRadius: ['50%', '25%', '25%', '50%'],
}
const rest = { scale: 1, rotate: 0, borderRadius: '50%' }

export function GlideRadioButton() {
  const [selected, setSelected] = useState('creator')
  // No tumble on first paint or for arrow keys, only when a pointer picks
  const [hasMoved, setHasMoved] = useState(false)
  const pointerPick = useRef(false)
  const reduceMotion = useReducedMotion()
  // Scoped so several instances don't share a radio group or a layoutId
  const groupId = useId()

  const shouldTumble = hasMoved && !reduceMotion

  const transition: Transition = reduceMotion
    ? { duration: 0 }
    : {
        layout: { type: 'spring', bounce: 0.2, visualDuration: 0.35 },
        default: { duration: 0.35, times: [0, 0.35, 0.65, 1], ease: 'easeInOut' },
      }

  function select(id: string) {
    setSelected(id)
    setHasMoved(pointerPick.current)
    pointerPick.current = false
  }

  return (
    <fieldset className='flex items-center justify-center gap-6'>
      <legend className='sr-only'>Account type</legend>
      {radios.map((radio) => {
        const isSelected = selected === radio.id
        return (
          <label
            key={radio.id}
            onPointerDown={() => (pointerPick.current = true)}
            className='group flex cursor-pointer select-none items-center gap-2 text-sm'>
            {/* The real input stays in the DOM (visually hidden) so arrow keys and screen readers work */}
            <input
              type='radio'
              name={groupId}
              value={radio.id}
              checked={isSelected}
              onChange={() => select(radio.id)}
              onKeyDown={() => (pointerPick.current = false)}
              className='peer sr-only'
            />
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-background transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background ${
                isSelected
                  ? 'border-foreground'
                  : 'border-muted-foreground/60 group-hover:border-foreground/80'
              }`}>
              {isSelected && (
                <motion.span
                  layoutId={`${groupId}-dot`}
                  // The dot remounts under each new choice, so the tumble replays on every move
                  initial={shouldTumble ? rest : false}
                  animate={shouldTumble ? tumble : rest}
                  transition={transition}
                  // Whole-pixel size: a percentage of the 14px inner box lands on half pixels and sits off-center
                  className='relative z-10 h-2 w-2 bg-foreground'
                  style={{ borderRadius: '50%' }}
                />
              )}
            </span>
            <span
              className={`transition-colors ${
                isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
              {radio.name}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
