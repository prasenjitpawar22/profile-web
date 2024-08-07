'use client'

import { useEffect, useState } from 'react'
import { MotionValue, motion, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

const fontSize = 30
const padding = 15
const height = fontSize + padding

export default function Timer() {
  const [totalSeconds, setTotalSeconds] = useState(600) // initial total seconds
  const [seconds, setSeconds] = useState(0)
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    const min = Math.floor(totalSeconds / 60)
    const sec = totalSeconds % 60
    setMinutes(min)
    setSeconds(sec)
  }, [totalSeconds])

  useEffect(() => {
    const id = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) return 600
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [])
  // aababbab
  return (
    <div className='relative flex p-2 border bg-slate-50 text-slate-700 rounded-md h-[200px] w-[500px] items-center justify-center'>
      <Counter value={minutes} />
      <span className='font-bold mx-2'>:</span>
      <Counter value={seconds} />
      <Link
        href={'https://buildui.com/recipes/animated-counter'}
        target='_blank'
        className='absolute flex cursor-pointer bottom-0 right-0 text-xs'>
        <p className='w-full flex items-center gap-1 rounded-md px-2'>
          Reference from
          <ExternalLink size={12} className='mb-[1px]' />
        </p>
      </Link>
    </div>
  )
}

function Counter({ value }: { value: number }) {
  return (
    <div
      style={{ fontSize }}
      className='flex space-x-3 overflow-hidden rounded bg-black px-2 leading-none text-gray-900'>
      <Digit place={10} value={value} />
      <Digit place={1} value={value} />
    </div>
  )
}

function Digit({ place, value }: { place: number; value: number }) {
  let valueRoundedToPlace = Math.floor(value / place)
  let animatedValue = useSpring(valueRoundedToPlace)

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace)
  }, [animatedValue, valueRoundedToPlace])

  return (
    <div style={{ height }} className='relative w-[1ch] tabular-nums'>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  )
}

function Number({ mv, number }: { mv: MotionValue; number: number }) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10
    let offset = (10 + number - placeValue) % 10

    let memo = offset * height

    if (offset > 5) {
      memo -= 10 * height
    }

    return memo
  })

  return (
    <motion.span
      style={{ y }}
      className='absolute inset-0 flex gap-3 items-center justify-center'>
      <span className='bg-white rounded curved-text'>{number}</span>
    </motion.span>
  )
}
