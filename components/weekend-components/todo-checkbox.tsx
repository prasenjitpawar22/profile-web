'use client'

import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useState } from 'react'

const ease = [0.23, 1, 0.32, 1] as const

const todos = [
  'This is a todo list',
  'Will this ever be completed?',
  'Haha, never',
  'Not funny!',
]

export function TodoCheckboxExample() {
  return (
    <div className='flex flex-col'>
      {todos.map((todo) => (
        <TodoCheckbox key={todo} text={todo} />
      ))}
    </div>
  )
}

export const TodoCheckbox = ({ text }: { text: string }) => {
  const [checked, setChecked] = useState(false)
  const [scope, animate] = useAnimate()
  const reduceMotion = useReducedMotion()

  // Selectors are resolved inside `scope`, so every row can reuse the same part names
  const part = (name: string) => `[data-part="${name}"]`

  // State flips first and every part animates at once from wherever it is,
  // so a fast double-click simply reverses mid-flight instead of being dropped
  function handleCheck() {
    const next = !checked
    setChecked(next)

    const t = (delay = 0) =>
      reduceMotion ? { duration: 0 } : { duration: 0.2, ease, delay }

    animate(part('border'), { pathLength: next ? 0 : 1 }, t())
    animate(
      part('background'),
      { opacity: next ? 1 : 0, scale: next ? 1 : 0.9 },
      t(),
    )
    animate(part('tick'), { opacity: next ? 1 : 0, pathLength: next ? 1 : 0 }, t(next ? 0.05 : 0))
    animate(part('line'), { scaleX: next ? 1 : 0 }, t(next ? 0.05 : 0))
    animate(part('text'), { opacity: next ? 0.4 : 1 }, t())
  }

  return (
    <button
      type='button'
      role='checkbox'
      aria-checked={checked}
      onClick={handleCheck}
      ref={scope}
      className='flex w-fit cursor-pointer items-center gap-2 rounded-md p-2 text-left transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
      <span className='relative isolate h-4 w-4'>
        <svg className='h-4 w-4' viewBox='0 0 30 30' fill='none' aria-hidden>
          <motion.path
            data-part='background'
            initial={{ opacity: 0, scale: 0.9 }}
            d='M3 22V8C3 5.23858 5.23858 3 8 3H22C24.7614 3 27 5.23858 27 8V22C27 24.7614 24.7614 27 22 27H8C5.23858 27 3 24.7614 3 22Z'
            className='fill-grass stroke-grass'
            strokeWidth='5'
          />
        </svg>
        <svg className='absolute top-0 h-4 w-4' viewBox='0 0 26 26' fill='none' aria-hidden>
          <motion.path
            data-part='border'
            initial={{ pathLength: 1 }}
            d='M1 20V6C1 3.23858 3.23858 1 6 1H20C22.7614 1 25 3.23858 25 6V20C25 22.7614 22.7614 25 20 25H6C3.23858 25 1 22.7614 1 20Z'
            className='stroke-muted-foreground'
            strokeWidth='2'
          />
        </svg>
        <svg
          className='absolute top-0 h-4 w-4 scale-75 text-background'
          viewBox='0 0 24 24'
          fill='none'
          strokeWidth={2}
          stroke='currentColor'
          aria-hidden>
          <motion.path
            data-part='tick'
            initial={{ pathLength: 0, opacity: 0 }}
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M4.5 12.75l6 6 9-13.5'
          />
        </svg>
      </span>
      <motion.span data-part='text' className='relative text-sm'>
        {text}
        <motion.span
          data-part='line'
          initial={{ scaleX: 0 }}
          className='absolute left-0 top-1/2 h-px w-full origin-left bg-foreground'
        />
      </motion.span>
    </button>
  )
}
