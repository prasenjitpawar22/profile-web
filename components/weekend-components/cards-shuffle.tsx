'use client'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BathIcon,
  ChefHat,
  ChevronRightCircleIcon,
  TreeDeciduous,
} from 'lucide-react'
import { useState } from 'react'

export const CardsShuffle = () => {
  const [cur, setCur] = useState(0)

  const transition = {
    type: 'spring',
    bounce: 0.5,
    duration: 1.73,
  }

  const [list, setList] = useState([
    <BathIcon key={1} size={90} />,
    <TreeDeciduous key={2} size={90} />,
    <ChevronRightCircleIcon key={3} size={90} />,
    <ChefHat key={4} size={90} />,
  ])

  return (
    <div className='w-[500px] overflow-hidden flex-col h-[200px] bg-slate-50 border rounded-md flex relative items-center justify-center'>
      <div className='flex w-full relative h-[100%] items-center justify-center p-2'>
        <div className='flex w-full h-full p-2 relative overflow-hidden'>
          {list.map((item, idx) => (
            <AnimatePresence key={idx} mode='wait'>
              {idx !== cur ? (
                <motion.div
                  layoutId={`${idx}-card`}
                  layout={'position'}
                  transition={transition}
                  initial={{ rotate: -12, zIndex: 1 }}
                  animate={{ rotate: -12, zIndex: 1 }}
                  className='border bg-white rounded-md absolute left-1/3 top-[10%] -translate-x-1/2 -translate-y-1/2 p-2 shadow'>
                  {item}
                </motion.div>
              ) : (
                <motion.div
                  layout={'position'}
                  layoutId={`${idx}-card`}
                  transition={transition}
                  initial={{ opacity: 1, zIndex: 2, rotate: -12, x: 30 }}
                  animate={{ opacity: 1, zIndex: 2, rotate: -12, x: 30 }}
                  className='border bg-white rounded-md absolute left-[45%] top-[20%] -translate-x-1/2 -translate-y-1/2 p-2 shadow'>
                  {item}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
        <button
          onClick={() => {
            setCur((prev) => (prev + 1) % list.length)
          }}>
          <ChevronRightCircleIcon />
        </button>
      </div>
    </div>
  )
}
