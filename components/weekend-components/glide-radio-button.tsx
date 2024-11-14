'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'

const radios = [
  {
    id: 1,
    name: 'Creator',
    value: 'Creator',
  },
  {
    id: 2,
    name: 'Bidder',
    value: 'Bidder',
  },
]

export function GlideRadioButton() {
  const [selected, setSelected] = useState<string | null>('Creator')

  return (
    <div className='bg-slate-50 w-full relative h-[150px] gap-4 items-center flex-col justify-center flex rounded-md shadow border p-2'>
      <div className='flex items-center justify-center gap-4'>
        {radios.map((radio) => (
          <div key={radio.id} className='flex items-center gap-2 relative'>
            <input
              type='radio'
              name='radio'
              id={radio.value}
              value={radio.value}
              className='hidden'
            />
            <motion.div
              onClick={() => setSelected(radio.value)}
              className='w-4 h-4 bg-white border border-black rounded-full relative cursor-pointer'>
              {selected === radio.value && (
                <motion.div
                  layoutId='radio-circle'
                  initial={false}
                  animate={{
                    scale: [1, 2, 2, 1],
                    rotate: [10, 120, 120, 10],
                    borderRadius: ['50%', '20%', '50%', '50%'],
                  }}
                  className='absolute left-0 bottom-0 m-auto top-0 right-0 w-[60%] h-[60%] bg-black rounded-full'></motion.div>
              )}
            </motion.div>
            <label
              onClick={() => setSelected(radio.value)}
              htmlFor={radio.value}>
              {radio.name}
            </label>
          </div>
        ))}
      </div>
      <div className='flex items-center flex-col justify-center gap-1'>
        <p className='text-sm text-stone-700 tracking-wide'>{selected}</p>
        <p className='text-sm text-stone-700 tracking-wide'>
          A simple radio button made with simple animations.
        </p>
      </div>
    </div>
  )
}
