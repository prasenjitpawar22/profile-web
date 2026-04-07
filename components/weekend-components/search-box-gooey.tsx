import {
  AnimatePresence,
  delay,
  LayoutGroup,
  motion,
  stagger,
  Variant,
  Variants,
} from 'framer-motion'
import { Layout, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MotionSearchIcon = motion.create(SearchIcon)

export function SearchBoxGooey() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const inputVariants: Variants = {
    open: {
      width: 150,
      scale: 1,
    },
    close: {
      width: 100,
      scale: 0.8,
    },
  }

  const searchIconVariant: Variants = {
    open: {
      x: 10,
      opacity: 1,
      scale: 1,
      color: 'white',
      transition: { type: 'spring', duration: 1.2 },
    },
    close: {
      x: -40,
      scale: 0.7,
      color: 'black',
      transition: { type: 'spring', damping: 20, duration: 1.2},
    },
  }

  const list = [
    'listing thsi is',
    'this aisa another one listing',
    'no its not a listing',
  ]

  return (
    <div className='relative flex p-2 border bg-foreground/[.02] rounded-md h-[200px] w-full items-center justify-center'>
      <svg width='0' height='0'>
        <filter id='goo'>
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
            result='goo'
          />
          <feBlend in='SourceGraphic' in2='goo' />
        </filter>
      </svg>

      <div className="h-full justify-center flex flex-col [filter:url('#goo')] ">
        <LayoutGroup>
          <div className='flex'>
            <motion.input
              ref={ref}
              layout
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='search'
              variants={inputVariants}
              animate={isOpen ? 'open' : 'close'}
              initial={'close'}
              // whileHover={!isOpen ? { scale: 1 } : {}}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setIsOpen(false)}
              transition={{ delayChildren: 2 }}
              className='h-8 w-[200px] text-white bg-black rounded-3xl shadow shadow-black focus-visible:outline-none pl-4'
            />
            <motion.div
              className='p-2 bg-black rounded-full flex items-center justify-center shadow shadow-black'
              variants={searchIconVariant}
              animate={isOpen ? 'open' : 'close'}
              initial={'close'}>
              <MotionSearchIcon className='h-4 w-4' />
            </motion.div>
          </div>
        </LayoutGroup>
      </div>
    </div>
  )
}
