'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MotionValue,
  motion,
  useInView,
  useSpring,
  useTransform,
} from 'motion/react'

const fontSize = 30
const padding = 15
const height = fontSize + padding

export default function Timer() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const [totalSeconds, setTotalSeconds] = useState(600)

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  // Only tick while the counter is on screen
  useEffect(() => {
    if (!inView) return
    const id = setInterval(() => {
      setTotalSeconds((prev) => (prev <= 1 ? 600 : prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [inView])

  return (
    <div ref={ref}>
      <svg width='0' height='0' className='absolute'>
        <filter id='gooey-counter'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='2' result='blur' />
          <feColorMatrix
            in='blur'
            mode='matrix'
            values='
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 16 -6
            '
            result='gooey-counter'
          />
          <feBlend in='SourceGraphic' in2='gooey-counter' />
        </filter>
      </svg>
      <div
        role='timer'
        aria-label={`${minutes} minutes ${seconds} seconds`}
        className='flex items-center justify-center rounded-full border bg-background p-2 px-3 shadow-sm'>
        <Counter value={minutes} />
        <span className='mx-1 text-muted-foreground'>:</span>
        <Counter value={seconds} />
      </div>
    </div>
  )
}

function Counter({ value }: { value: number }) {
  return (
    <div
      aria-hidden
      style={{ fontSize, filter: 'url(#gooey-counter)' }}
      className='flex gap-[13px] overflow-hidden rounded px-2 font-medium leading-none text-foreground'>
      <Digit place={10} value={value} />
      <Digit place={1} value={value} />
    </div>
  )
}

function Digit({ place, value }: { place: number; value: number }) {
  const valueRoundedToPlace = Math.floor(value / place)
  const animatedValue = useSpring(valueRoundedToPlace, { bounce: 0.2 })

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace)
  }, [animatedValue, valueRoundedToPlace])

  return (
    <div style={{ height }} className='relative w-[1ch] tabular-nums'>
      {Array.from({ length: 10 }, (_, i) => (
        <DigitSlot key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  )
}

function DigitSlot({ mv, number }: { mv: MotionValue<number>; number: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10
    const offset = (10 + number - placeValue) % 10

    let memo = offset * height
    if (offset > 5) {
      memo -= 10 * height
    }
    return memo
  })

  return (
    <motion.span
      style={{ y }}
      className='absolute inset-0 flex items-center justify-center'>
      {number}
    </motion.span>
  )
}
