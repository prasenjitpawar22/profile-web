import { motion, useMotionValue } from 'framer-motion'
import { useRef } from 'react'

export function Testing() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect()
          mouseX.set(e.clientX - rect.left)
          mouseY.set(e.clientY - rect.top)
        }
      }}
      className=" [filter:url('#gootest')]  relative flex p-2 border  rounded-md h-[200px] w-full items-center justify-center">
      <svg width='0' height='0'>
        <filter id='gootest' className='absolute'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='10' result='blur' />
          <feColorMatrix
            in='blur'
            mode='matrix'
            values='
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 50 -5
            '
            result='gootest'
          />
          <feBlend in='SourceGraphic' in2='gootest' />
        </filter>
      </svg>
      <motion.div className='blur h-12 w-12 bg-gradient-to-tr from-red-500 via-green-600 to-blue-500'></motion.div>
      <motion.div
        className='absolute blur h-12 w-12 bg-gradient-to-tr from-red-500 via-green-600 to-blue-500 rounded-full top-0 left-0'
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}></motion.div>
    </motion.div>
  )
}
