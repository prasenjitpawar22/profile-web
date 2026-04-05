import { AnimatePresence, LayoutGroup, motion, stagger } from 'framer-motion'
import { Layout, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MotionSearchIcon = motion.create(SearchIcon)

export function SearchBoxGooey() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const list = [
    'listing thsi is',
    'this aisa another one listing',
    'no its not a listing',
  ]

  return (
    <div className='relative flex p-2 border bg-slate-50 text-slate-700 rounded-md h-[200px] w-full items-center justify-center'>
      {/* ✅ Gooey filter */}
      <svg width='0' height='0'>
        <filter id='goo'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='3' result='blur' />
          <feColorMatrix
            in='blur'
            mode='matrix'
            values='
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 50 -25
            '
            result='goo'
          />
          <feBlend in='SourceGraphic' in2='goo' />
        </filter>
      </svg>

      <div className="h-full justify-center flex flex-col [filter:url('#goo')] ">
        <LayoutGroup>
          <AnimatePresence mode='popLayout'>
            <div className='flex'>
              <motion.input
                ref={ref}
                layout
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='search'
                whileHover={!isOpen ? { scale: 1 } : {}}
                initial={{ width: 100, scale: 0.8 }}
                animate={
                  isOpen ? { width: 200, scale: 1 } : { width: 100, scale: 0.8 }
                }
                onFocus={() => setIsOpen(true)}
                onBlur={() => setIsOpen(false)}
                transition={{ delayChildren: 2 }}
                className='h-8 w-[200px] text-white bg-black rounded-3xl shadow shadow-black focus-visible:outline-none pl-4'
              />
              {isOpen && (
                <motion.div
                  className='p-2 bg-black rounded-full flex items-center justify-center shadow shadow-black'
                  initial={{ x: -10 }}
                  animate={{ x: 10 }}
                  exit={{ x: 0 }}
                  transition={{ type: 'spring', delay: 0.27 }}>
                  <MotionSearchIcon className='h-4 w-4 text-white' />
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
