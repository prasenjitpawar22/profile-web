'use client'

import { motion, useAnimate } from 'motion/react'
import { useRef, useState } from 'react'

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
  const isAnimating = useRef(false)

  // Selectors are resolved inside `scope`, so every row can reuse the same part names
  const part = (name: string) => `[data-part="${name}"]`

  async function handleCheck() {
    if (isAnimating.current) return
    isAnimating.current = true
    if (checked) {
      animate(part('line'), { width: '0%', opacity: 1 })
      await animate(part('text'), { opacity: 1, x: [3, 2, 0, -1, 0] })
      animate(part('tick'), { pathLength: 0.2 })
      await animate(part('tick'), { opacity: 0 })
      await animate(part('background'), { opacity: 0, scale: [1, 0] })
      await animate(part('border'), { pathLength: 1 })
    } else {
      await animate(part('border'), { pathLength: 0 })
      await animate(part('background'), { opacity: 1, scale: [0, 1] })
      animate(part('tick'), { opacity: 1 })
      await animate(part('tick'), { pathLength: [0, 1] })
      animate(part('line'), { width: '100%', opacity: 0.4 })
      await animate(part('text'), { opacity: 0.4, x: [3, 2, 0, -1, 0] })
    }
    setChecked((prev) => !prev)
    isAnimating.current = false
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
            initial={{ opacity: 0, scale: 0 }}
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
          initial={{ width: '0%' }}
          className='absolute left-0 top-1/2 h-px bg-foreground'
        />
      </motion.span>
    </button>
  )
}
