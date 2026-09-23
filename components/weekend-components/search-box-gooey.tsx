'use client'
import { motion, Variants } from 'motion/react'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'

const inputVariants: Variants = {
  open: { width: 150, scale: 1 },
  close: { width: 100, scale: 0.8 },
}

const searchIconVariants: Variants = {
  open: {
    x: 10,
    scale: 1,
    transition: { type: 'spring', duration: 1.2 },
  },
  close: {
    // Tucked behind the input, where the goo filter melts the two together
    x: -40,
    scale: 0.7,
    transition: { type: 'spring', damping: 20, duration: 1.2 },
  },
}

export function SearchBoxGooey() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')

  return (
    <div>
      <svg width='0' height='0' className='absolute'>
        <filter id='gooey-search'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='5' result='blur' />
          <feColorMatrix
            in='blur'
            mode='matrix'
            values='
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 10 -5
            '
            result='gooey-search'
          />
          <feBlend in='SourceGraphic' in2='gooey-search' />
        </filter>
      </svg>

      <div className="flex [filter:url('#gooey-search')]">
        <motion.input
          layout
          type='search'
          aria-label='Search'
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Search'
          variants={inputVariants}
          animate={isOpen ? 'open' : 'close'}
          initial='close'
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className='h-8 rounded-3xl bg-foreground pl-4 text-sm text-background placeholder:text-background/60 focus-visible:outline-none'
        />
        <motion.div
          aria-hidden
          className='flex items-center justify-center rounded-full bg-foreground p-2 text-background'
          variants={searchIconVariants}
          animate={isOpen ? 'open' : 'close'}
          initial='close'>
          <SearchIcon className='h-4 w-4' />
        </motion.div>
      </div>
    </div>
  )
}
