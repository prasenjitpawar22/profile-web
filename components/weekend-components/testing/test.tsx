'use client'

import { useEffect, useState } from 'react'
import { MotionValue, motion, useSpring, useTransform } from 'framer-motion'

export default function Test() {
  const [counter, setCounter] = useState(0)
  const animatedY = useSpring(counter)

  useEffect(() => {
    animatedY.set(counter)
  }, [animatedY, counter])

  return (
    <div className='bg-slate-50 w-[500px] relative h-[200px] items-center justify-center flex'>
      <motion.span
        style={{ y: animatedY }}
        className='text-black inset-0 absolute w-fit'>
        text
      </motion.span>
      <input
        type='number'
        className=''
        step={50}
        onChange={(e) => setCounter(parseInt(e.target.value))}
      />
    </div>
  )
}
