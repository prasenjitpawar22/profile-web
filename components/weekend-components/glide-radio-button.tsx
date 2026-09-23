'use client'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'

const radios = [
  { id: 'creator', name: 'Creator' },
  { id: 'bidder', name: 'Bidder' },
]

export function GlideRadioButton() {
  const [selected, setSelected] = useState('creator')
  const reduceMotion = useReducedMotion()

  return (
    <fieldset className='flex items-center justify-center gap-6'>
      <legend className='sr-only'>Account type</legend>
      {radios.map((radio) => (
        <label
          key={radio.id}
          className='flex cursor-pointer items-center gap-2 text-sm'>
          {/* The real input stays in the DOM (visually hidden) so arrow keys and screen readers work */}
          <input
            type='radio'
            name='glide-radio'
            value={radio.id}
            checked={selected === radio.id}
            onChange={() => setSelected(radio.id)}
            className='peer sr-only'
          />
          <span className='relative h-4 w-4 rounded-full border border-foreground bg-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background'>
            {selected === radio.id && (
              <motion.span
                layoutId='glide-radio-dot'
                initial={false}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        scale: [1, 2, 2, 1],
                        rotate: [10, 120, 120, 10],
                        borderRadius: ['50%', '20%', '50%', '50%'],
                      }
                }
                className='absolute inset-0 m-auto h-[60%] w-[60%] rounded-full bg-foreground'
              />
            )}
          </span>
          {radio.name}
        </label>
      ))}
    </fieldset>
  )
}
