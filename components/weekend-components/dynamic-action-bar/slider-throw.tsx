'use client'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRightCircleIcon } from 'lucide-react'
import { useState } from 'react'

export const SliderThrow = () => {
  const [cur, setCur] = useState('2')
  const [prev, setPrev] = useState('1')
  const [next, setNext] = useState('3')

  const transition = {
    type: 'easeOut',
    duration: 0.2,
  }

  const curSvg = (
    <svg
      height={120}
      width={120}
      viewBox='0 0 1024 1024'
      className='icon'
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      fill='#000000'>
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        strokeLinecap='round'
        strokeLinejoin='round'></g>
      <g id='SVGRepo_iconCarrier'>
        <path
          d='M240.7 279.3c-12.9 0-19.2-10.1-23.8-17.4-4.3-6.9-6.5-9.9-10.2-9.9s-5.9 3-10.2 9.9c-4.6 7.3-10.9 17.4-23.8 17.4s-19.2-10.1-23.8-17.4c-4.3-6.9-6.5-9.9-10.2-9.9s-5.9 3-10.2 9.9c-4.6 7.3-10.9 17.4-23.8 17.4s-19.2-10.1-23.8-17.4c-4.3-6.9-6.5-9.9-10.2-9.9-4.4 0-8-3.6-8-8s3.6-8 8-8c12.9 0 19.2 10.1 23.8 17.4 4.3 6.9 6.5 9.9 10.2 9.9 3.7 0 5.9-3 10.2-9.9 4.6-7.3 10.9-17.4 23.8-17.4s19.2 10.1 23.8 17.4c4.3 6.9 6.5 9.9 10.2 9.9s5.9-3 10.2-9.9c4.6-7.3 10.9-17.4 23.8-17.4s19.2 10.1 23.8 17.4c4.3 6.9 6.5 9.9 10.2 9.9 4.4 0 8 3.6 8 8s-3.5 8-8 8zM262.7 229.3c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.8-25.7-17c-5.2-7.3-7.8-10.3-12.7-10.3-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2s7.5-3 12.7-10.2c5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2s7.5-3 12.7-10.2c5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8.1-8 8.1z'
          fill='#9A2D2F'></path>
        <path
          d='M352.7 101.7m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z'
          fill='#FFEB4D'></path>
        <path
          d='M352.7 141.7c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-18 40-40 40z m0-64c-13.2 0-24 10.8-24 24s10.8 24 24 24 24-10.8 24-24-10.8-24-24-24z'
          fill='#9A2D2F'></path>
        <path
          d='M201.7 344.7c-18.8 18.8-18.8 49.2 0 67.9l67.9-67.9c-18.7-18.7-49.1-18.7-67.9 0z'
          fill='#FFEB4D'></path>
        <path
          d='M885.7 693.7h-764c-17.6 0-32-14.4-32-32s14.4-32 32-32h764c17.6 0 32 14.4 32 32s-14.4 32-32 32zM685.7 949.7h-362c-110 0-200-90-200-200v-56h762v56c0 110-90 200-200 200z'
          fill='#C7EBFF'></path>
        <path
          d='M847.7 430.7h-64c-8.8 0-16-7.2-16-16v-80h96v80c0 8.8-7.2 16-16 16z'
          fill='#FFEB4D'></path>
        <path
          d='M909.7 462.7h-76c-8.8 0-16-7.2-16-16v-112h108v112c0 8.8-7.2 16-16 16z'
          fill='#FFACC2'></path>
        <path
          d='M227 424.1c-3.1 3.1-3.1 8.2 0 11.3l11 11c1.6 1.6 3.6 2.3 5.7 2.3s4.1-0.8 5.7-2.3c3.1-3.1 3.1-8.2 0-11.3l-11-11a8.15 8.15 0 0 0-11.4 0zM265.9 396.2c-3.1-3.1-8.2-3.1-11.3 0-3.1 3.1-3.1 8.2 0 11.3l11 11c1.6 1.6 3.6 2.3 5.7 2.3s4.1-0.8 5.7-2.3c3.1-3.1 3.1-8.2 0-11.3l-11.1-11zM292.6 391.6c1.6 1.6 3.6 2.3 5.7 2.3s4.1-0.8 5.7-2.3c3.1-3.1 3.1-8.2 0-11.3l-11-11c-3.1-3.1-8.2-3.1-11.3 0-3.1 3.1-3.1 8.2 0 11.3l10.9 11z'
          fill='#9A2D2F'></path>
        <path
          d='M950.7 735.7c-5 0-7.5-3-12.7-10.2-5.1-7.2-12-17-25.7-17-8.3 0-14.2 3.6-18.6 8.1V701c12.1-2.5 22.2-10.4 27.7-21.1 1.1 1.3 2.2 2.9 3.6 4.9 5.1 7.2 12 17 25.7 17 4.4 0 8-3.6 8-8s-3.6-8-8-8c-5 0-7.5-3-12.7-10.2-3.1-4.4-6.8-9.7-12.4-13.2v-0.5c0-19.3-13.8-35.5-32-39.2v-152.5h16c13.2 0 24-10.8 24-24v-104h16c4.4 0 8-3.6 8-8s-3.6-8-8-8h-205c-4.4 0-8 3.6-8 8s3.6 8 8 8h15v72c0 13.2 10.8 24 24 24h26v8c0 13.2 10.8 24 24 24h44v151.5H875c-7-9.7-17.9-16.4-30.4-17.9-6.3-17-22.8-28.7-41.3-28.7h-0.7c-9.1-13.1-24.1-21.1-40.3-21.1-10.9 0-21.3 3.6-29.8 10.1-6.3-3.3-13.3-5.1-20.5-5.1s-14.1 1.7-20.3 4.9c-11.5-13-28.2-20.6-45.8-20.6-6.5 0-12.8 1-18.8 3-7.8-13.3-22.2-21.7-38-21.7-2.9 0-5.8 0.3-8.7 0.9-12.5-21.2-35.6-34.5-60.4-34.5-24.4 0-46.7 12.4-59.5 32.8-2.8-0.4-5.5-0.7-8.3-0.7-11.7 0-23 4-32.1 11.1-7.8-6.2-17.4-9.7-27.6-9.7-18.7 0-35.3 11.9-41.4 29.2-18.1 2-33.7 14-40.5 30.7-10-2-20.6-1.2-30.2 2.4-9.5-16.8-27.5-27.6-47.2-27.6-19.3 0-37.1 10.4-46.8 26.9-18.9 2.4-34.2 17.1-37.7 35.6h-17v-240.5c0-22.1 17.9-40 40-40 6.6 0 12.9 1.6 18.7 4.7-15.9 21.9-14 52.8 5.8 72.5 1.6 1.6 3.6 2.3 5.7 2.3s4.1-0.8 5.7-2.3l67.9-67.9c3.1-3.1 3.1-8.2 0-11.3-10.6-10.6-24.7-16.4-39.6-16.4-12.4 0-24.2 4-33.9 11.4-9-5.8-19.4-8.9-30.2-8.9-30.9 0-56 25.1-56 56v240.9c-19.2 2.9-34 19.5-34 39.5s14.8 36.6 34 39.5v48.5c0 55.3 21.7 107.5 61.1 146.9 19.6 19.6 42.3 34.7 66.9 45.1h-145c-4.4 0-8 3.6-8 8s3.6 8 8 8h824c4.4 0 8-3.6 8-8s-3.6-8-8-8h-157c24.7-10.3 47.4-25.5 66.9-45.1 39.4-39.4 61.1-91.6 61.1-146.9v-7.4c2.3-2.5 4.2-5.3 5.9-7.7 5.1-7.3 7.7-10.2 12.7-10.2s7.5 3 12.7 10.2c5.1 7.2 12 17 25.7 17 4.4 0 8-3.6 8-8s-3.7-7.9-8.1-7.9z m-141-313.5h-26c-4.4 0-8-3.6-8-8v-72h34v80z m-602.3-71.8c7.6-7.6 17.6-11.7 28.3-11.7 8 0 15.6 2.3 22.1 6.6l-55.5 55.5c-10.3-15.5-8.6-36.7 5.1-50.4z m626.3 103.8c-4.4 0-8-3.6-8-8v-104h92v104c0 4.4-3.6 8-8 8h-76z m-642.2 147.5c3 0 5.8-1.8 7.1-4.6 6.3-13.3 19.8-21.9 34.6-21.9 15.9 0 30.3 10 35.8 24.9 0.8 2.2 2.5 3.9 4.7 4.7s4.6 0.6 6.7-0.5c5.9-3.3 12.5-5 19.3-5 4.6 0 9.2 0.8 13.5 2.4 2.2 0.8 4.6 0.6 6.6-0.5s3.5-3.1 3.9-5.3c3.3-15.3 17.1-26.5 32.8-26.5h0.7c3.8 0 7.1-2.7 7.8-6.4 2.6-13 14.2-22.5 27.4-22.5 8.2 0 16 3.6 21.3 9.9 1.5 1.7 3.6 2.8 5.9 2.8s4.5-0.9 6-2.6c6.9-7.4 16.3-11.5 26.4-11.5 3.4 0 6.8 0.5 10.1 1.4 3.7 1.1 7.6-0.6 9.4-4 9.5-18.2 28-29.5 48.5-29.5 21 0 40.3 12.3 49.2 31.3 1.8 3.8 6.2 5.6 10.1 4.1 3.2-1.2 6.5-1.8 9.9-1.8 11.8 0 22.4 7.5 26.4 18.6 0.8 2.1 2.4 3.8 4.5 4.7 2.1 0.9 4.5 0.8 6.5-0.2 6.1-2.9 12.6-4.4 19.4-4.4 14.9 0 28.9 7.4 37.3 19.7 1.2 1.8 3.2 3 5.4 3.4 2.2 0.3 4.4-0.2 6.1-1.6 5-3.9 10.9-5.9 17.2-5.9 6 0 11.8 1.9 16.6 5.5 3.2 2.4 7.6 2 10.4-0.8 6.2-6.3 14.5-9.7 23.4-9.7 12.1 0 23.2 6.6 29 17.3 1.6 2.9 4.8 4.6 8.1 4.1 1.3-0.2 2.6-0.3 3.9-0.3 13.1 0 24.6 9.3 27.4 22.1 0.8 3.7 4.1 6.3 7.8 6.3h0.8c3.9 0 7.6 0.8 11 2.3h-685.3c3.4-11.4 14-19.8 26.4-20z m686.2 148c0 51.1-20 99.2-56.4 135.6s-84.5 56.4-135.6 56.4h-362c-51.1 0-99.2-20-135.6-56.4s-56.4-84.5-56.4-135.6v-48h746v48z m8-64h-764c-13.2 0-24-10.8-24-24s10.8-24 24-24h764c13.2 0 24 10.8 24 24s-10.8 24-24 24z'
          fill='#9A2D2F'></path>
        <path
          d='M838.8 619.4h-0.2c-3.7 0-7-2.6-7.8-6.3-2.8-12.8-14.3-22.1-27.4-22.1-1.3 0-2.6 0.1-3.9 0.3-3.3 0.5-6.5-1.2-8.1-4.1-5.8-10.7-16.9-17.3-29-17.3-8.9 0-17.2 3.4-23.4 9.7-2.8 2.8-7.2 3.2-10.4 0.8-4.8-3.6-10.6-5.5-16.6-5.5-6.3 0-12.2 2-17.2 5.9-1.7 1.4-3.9 1.9-6.1 1.6-2.2-0.4-4.2-1.6-5.4-3.4-8.4-12.3-22.4-19.7-37.3-19.7-6.8 0-13.3 1.5-19.4 4.4-2 1-4.4 1.1-6.5 0.2-2.1-0.9-3.7-2.6-4.5-4.7-4-11.1-14.6-18.6-26.4-18.6-3.4 0-6.7 0.6-9.9 1.8-3.9 1.5-8.3-0.3-10.1-4.1-8.9-19-28.2-31.3-49.2-31.3-20.5 0-39 11.3-48.5 29.5-1.8 3.4-5.7 5.1-9.4 4-3.3-0.9-6.7-1.4-10.1-1.4-10.1 0-19.5 4.1-26.4 11.5-1.5 1.7-3.7 2.6-6 2.6s-4.4-1.1-5.9-2.8c-5.3-6.3-13.1-9.9-21.3-9.9-13.2 0-24.8 9.5-27.4 22.5-0.7 3.7-4 6.4-7.8 6.4h-0.7c-15.7 0-29.5 11.2-32.8 26.5-0.4 2.2-1.9 4.2-3.9 5.3-2 1.1-4.4 1.3-6.6 0.5-4.3-1.6-8.9-2.4-13.5-2.4-6.8 0-13.4 1.7-19.3 5-2.1 1.1-4.5 1.3-6.7 0.5s-3.9-2.5-4.7-4.7c-5.5-14.9-19.9-24.9-35.8-24.9-14.8 0-28.3 8.6-34.6 21.9-1.3 2.8-4.1 4.6-7.1 4.6-12.4 0.2-23 8.6-26.4 20h685.3c-3.4-1.5-7.1-2.3-11-2.3h-0.6z'
          fill='#FFFFFF'></path>
        <path
          d='M390.8 661.7c29.5-2.3 55.4-21.9 89.4-15.4 19.7 3.8 39.9 33.4 67.4 33.9 23.6 0.4 34-33.1 50.5-32.5 13.5 0.5 19.5 17.5 61 17.5 18.9 0 34.2-13.7 51.1-27.5H355.6c8.9 12.2 17.4 25.4 35.2 24z'
          fill='#FFFFFF'></path>
      </g>
    </svg>
  )

  const nextSvg = (
    <svg
      viewBox='0 0 1024 1024'
      className='icon'
      height={120}
      width={120}
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      fill='#000000'>
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        strokeLinecap='round'
        strokeLinejoin='round'></g>
      <g id='SVGRepo_iconCarrier'>
        <path
          d='M827.1 782l-70.3 23.3c1.6 5.1 2.4 10.5 2.4 16.1 0 7.7-1.6 15-4.5 21.7l68.3 28.6c6.6-15.4 10.3-32.4 10.3-50.3 0-13.8-2.2-27-6.2-39.4z'
          fill='#FFFFFF'></path>
        <path
          d='M683.9 771.8l-28.6-68.3c-33.9 14.4-60.3 43.1-71.8 78.5l70.3 23.3c4.7-15.1 15.8-27.3 30.1-33.5zM756.9 805.2l70.3-23.3c-12.5-38.7-42.9-69.4-81.5-82.2L722.4 770c16.4 5.5 29.3 18.7 34.5 35.2zM655.8 843l-68.3 28.6c13.1 30.6 37.7 55 68.4 67.9l28.6-68.3c-12.8-5.3-23.1-15.5-28.7-28.2zM721.7 872.8L745 943c35.2-11.5 63.6-37.7 78.1-71.4L754.8 843c-6.2 14.1-18.2 25-33.1 29.8z'
          fill='#FFACC2'></path>
        <path
          d='M705.3 767.3c6 0 11.7 1 17 2.8l23.3-70.3c-12.7-4.2-26.2-6.5-40.3-6.5-17.8 0-34.7 3.6-50.1 10.2l28.6 68.3c6.6-2.9 13.9-4.5 21.5-4.5zM705.3 875.3c-7.3 0-14.3-1.5-20.7-4.1L656 939.5c15.2 6.3 31.8 9.9 49.3 9.9 13.9 0 27.2-2.2 39.7-6.3l-23.3-70.3c-5.1 1.6-10.7 2.5-16.4 2.5zM651.3 821.3c0-5.6 0.9-11 2.4-16.1L583.5 782c-4 12.4-6.2 25.6-6.2 39.4 0 17.8 3.7 34.8 10.3 50.3l68.3-28.6c-3-6.7-4.6-14.1-4.6-21.8z'
          fill='#FFFFFF'></path>
        <path
          d='M948.4 702.6c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.8-25.7-17c-5.1-7.3-7.7-10.2-12.7-10.2-5 0-7.5 3-12.7 10.2-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17 13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8-8 8zM948.4 652.6c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.8-25.7-17c-5.1-7.3-7.7-10.2-12.7-10.2-5 0-7.5 3-12.7 10.2-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17 13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8-8 8zM239.4 280.6c-12.9 0-19.2-10.1-23.8-17.4-4.3-6.9-6.5-9.9-10.2-9.9s-5.9 3-10.2 9.9c-4.6 7.3-10.9 17.4-23.8 17.4s-19.2-10.1-23.8-17.4c-4.3-6.9-6.5-9.9-10.2-9.9s-5.9 3-10.2 9.9c-4.6 7.3-10.9 17.4-23.8 17.4s-19.2-10.1-23.8-17.4c-4.3-6.9-6.5-9.9-10.2-9.9-4.4 0-8-3.6-8-8s3.6-8 8-8c12.9 0 19.2 10.1 23.8 17.4 4.3 6.9 6.5 9.9 10.2 9.9s5.9-3 10.2-9.9c4.6-7.3 10.9-17.4 23.8-17.4s19.2 10.1 23.8 17.4c4.3 6.9 6.5 9.9 10.2 9.9 3.7 0 5.9-3 10.2-9.9 4.6-7.3 10.9-17.4 23.8-17.4s19.2 10.1 23.8 17.4c4.3 6.9 6.5 9.9 10.2 9.9 4.4 0 8 3.6 8 8s-3.6 8-8 8zM261.3 230.6c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.8-25.7-17c-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2s7.5-3 12.7-10.2c5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8-8 8z'
          fill='#9A2D2F'></path>
        <path
          d='M835.7 951.3H183.1c-44.9 0-81.7-36.8-81.7-81.7v-0.5c0-7.6 6.2-13.8 13.8-13.8h788.4c7.6 0 13.8 6.2 13.8 13.8v0.5c0 45-36.8 81.7-81.7 81.7z'
          fill='#DAE5FF'></path>
        <path
          d='M511.3 95.4c-65.5 25.8-125.5 62.6-177.6 108.2l177.6 47.6V95.4z'
          fill='#FFACC2'></path>
        <path
          d='M125.3 662.3c0 43.6 4.6 86 13.3 127h372.7V648L136.1 547.5c-7.1 37.2-10.8 75.5-10.8 114.8z'
          fill='#FFEB4D'></path>
        <path
          d='M237.7 309.7L511.3 383V251.2l-177.6-47.6c-36 31.4-68.2 67-96 106.1z'
          fill='#F7D4FF'></path>
        <path
          d='M173.3 424.9l338 90.6V383.7l-274-73.4c-25.3 35.5-46.8 74-64 114.6z'
          fill='#DAE5FF'></path>
        <path
          d='M173.3 424.9c-16.5 38.9-29.1 80-37.2 122.6L511.3 648V515.5l-338-90.6z'
          fill='#C0FCD0'></path>
        <path
          d='M502.6 108c-54.7 23-105.4 53.8-151.2 91.8l72.8 19.5c18.2-8.8 69.2-61.9 78.4-111.3zM203.6 666.3c0-17.9-4.9-56.4 1.8-92.3l-61.9-16.6c-6 34.4-9.1 69.6-9.1 104.8 0 40 4 80 11.8 119h26.2c22.4-31.9 31.2-80.9 31.2-114.9zM400.2 229.4l-63.4-17c-31.4 27.8-59.8 58.9-84.7 92.5l58.4 15.6c1.2-18.8 4-35.9 8.9-49.1 11.6-31.1 43.3-28.2 80.8-42zM185.3 419.6l93.7 25.1c6.5-4.7 30.5-17.7 30.5-107.1l-67.9-18.2c-21.9 31.6-40.8 65.2-56.3 100.2zM208.6 558.4c3.2-14.3-4.3-58.7 52.2-102L179 434.5c-14.2 34.6-25.1 70.6-32.6 107.2l62.2 16.7z'
          fill='#FFFFFF'></path>
        <path
          d='M925.4 868.7v-0.5c0-12-9.8-21.8-21.8-21.8H839c1.5-8.2 2.3-16.5 2.3-25 0-14.3-2.2-28.3-6.6-41.8-13.3-41.1-45.6-73.7-86.6-87.3-13.8-4.6-28.2-6.9-42.8-6.9-18.4 0-36.3 3.6-53.2 10.8-8 3.4-15.5 7.5-22.6 12.3l-109.4-459c-0.1-0.4-0.2-0.8-0.4-1.2V97.6c0-0.9-0.1-1.7-0.4-2.5-0.1-2.6-1.4-4.9-3.5-6.4-2.2-1.5-5-1.8-7.4-0.8-65.9 25.9-126.4 62.8-180 109.6-36.5 31.9-69.2 68-97.2 107.5-0.1 0.1-0.1 0.2-0.2 0.3-0.1 0.1-0.1 0.2-0.2 0.3-25.7 36.3-47.5 75.4-64.8 116.2-16.9 39.8-29.6 81.6-37.7 124.2-7.3 38.1-10.9 77.2-10.9 116.3 0 43.3 4.5 86.6 13.4 128.7 0.8 3.7 4 6.3 7.8 6.3h365.1v49.1H115.2c-12 0-21.8 9.8-21.8 21.8v0.5c0 31.1 15.9 58.6 40.1 74.7H74.3c-4.4 0-8 3.6-8 8s3.6 8 8 8h824c4.4 0 8-3.6 8-8s-3.6-8-8-8h-13c24.2-16.1 40.1-43.6 40.1-74.7z m-100.1-47.4c0 8.5-0.9 16.8-2.6 25h-39.3l-18.5-7.8c1.6-5.6 2.4-11.3 2.4-17.2 0-3.6-0.3-7.3-0.9-10.8l33.4-11.1 21.9-7.3c2.4 9.6 3.6 19.4 3.6 29.2z m-74.7-111.1c30.1 12.3 54.2 36.5 66.2 66.8l-48.5 16-6.8 2.3c-6-13-16.4-23.5-29.3-29.7l18.4-55.4z m0.7 111.1c0 6.4-1.3 12.6-3.9 18.5-1 2.3-2.2 4.5-3.5 6.5h-77.2c-1.4-2.1-2.6-4.3-3.6-6.5-2.6-5.8-3.9-12.1-3.9-18.5 0-4.7 0.7-9.3 2.1-13.7 4-12.8 13.3-23.2 25.7-28.5 5.8-2.5 11.9-3.8 18.3-3.8 4.9 0 9.8 0.8 14.5 2.4 14 4.7 25 15.8 29.4 29.9 1.4 4.4 2.1 9.1 2.1 13.7z m-46-120c10.2 0 20.3 1.3 30.1 3.8l-18.3 55.3c-3.9-0.8-7.8-1.1-11.8-1.1-5.8 0-11.5 0.8-17 2.4L665.8 708c12.7-4.4 25.9-6.7 39.5-6.7z m-76.2 27.3c0.3-0.2 0.5-0.4 0.8-0.6 6.5-5.3 13.6-9.9 21.2-13.7l22.5 53.8c-10.8 6.4-19.3 15.9-24.6 27.2L593.8 777c7.5-19 19.8-35.6 35.3-48.4z m16.6 110l-18.5 7.8h-39.3c-1.7-8.2-2.6-16.5-2.6-25 0-9.9 1.2-19.7 3.6-29.2l44 14.5 11.4 3.8c-0.6 3.6-0.9 7.2-0.9 10.8-0.1 5.9 0.7 11.7 2.3 17.3z m-142.4-57.3H145.1c-7.8-39-11.8-79-11.8-119 0-35.2 3.1-70.4 9.1-104.8l360.9 96.7v127.1z m0-143.7l-357.9-95.9c7.5-36.6 18.4-72.7 32.6-107.2l325.3 87.2v115.9z m0-132.5l-79.6-21.3-239.4-64.2c15.5-35 34.4-68.7 56.3-100.2l262.7 70.4v115.3z m0-132.5L251 304.9c24.9-33.7 53.4-64.7 84.7-92.6l157.4 42.2 10.2 2.7v115.4z m0-131.9l-42.5-11.4-110.4-29.6c46.2-38.4 97.5-69.5 152.8-92.5v133.5z m16.4 76.1l95.9 402.3c-18.3 16-32.1 36.8-39.7 60.4-4.4 13.5-6.6 27.6-6.6 41.8 0 8.5 0.8 16.8 2.3 25h-51.9V316.8z m316 625.6H183.1c-40.6 0-73.7-33.1-73.7-73.7v-0.5c0-3.2 2.6-5.8 5.8-5.8h788.4c3.2 0 5.8 2.6 5.8 5.8v0.5c0 40.6-33.1 73.7-73.7 73.7z'
          fill='#9A2D2F'></path>
        <path
          d='M349.3 102.3m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z'
          fill='#FFEB4D'></path>
        <path
          d='M349.3 142.3c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z m0-64c-13.2 0-24 10.8-24 24s10.8 24 24 24 24-10.8 24-24-10.8-24-24-24z'
          fill='#9A2D2F'></path>
      </g>
    </svg>
  )

  const prevSvg = (
    <svg
      height={120}
      width={120}
      viewBox='0 0 1024 1024'
      className='icon'
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      fill='#000000'>
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        strokeLinecap='round'
        strokeLinejoin='round'></g>
      <g id='SVGRepo_iconCarrier'>
        <path
          d='M264.3 282.6c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.9-25.7-17c-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2s7.5-3 12.7-10.2c5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8-8 8zM264.3 232.6c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.9-25.7-17c-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2s7.5-3 12.7-10.2c5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8-8 8z'
          fill='#9A2D2F'></path>
        <path
          d='M353.3 103m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z'
          fill='#FFEB4D'></path>
        <path
          d='M353.3 143c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z m0-64c-13.2 0-24 10.8-24 24s10.8 24 24 24 24-10.8 24-24-10.8-24-24-24z'
          fill='#9A2D2F'></path>
        <path
          d='M393.3 360.3h-80V179.2c0-7.7 6.2-13.9 13.9-13.9h52.1c7.7 0 13.9 6.2 13.9 13.9v181.1z'
          fill='#FFACC2'></path>
        <path
          d='M455.3 950.7h-204c-18.1 0-33-14.8-33-33v-432c0-74.2 60.7-135 135-135 74.2 0 135 60.7 135 135v432c0 18.2-14.8 33-33 33z'
          fill='#FFACC2'></path>
        <path d='M272.3 516.7h162v300h-162z' fill='#DAE5FF'></path>
        <path
          d='M434.3 824.7h-162c-4.4 0-8-3.6-8-8v-300c0-4.4 3.6-8 8-8h162c4.4 0 8 3.6 8 8v300c0 4.5-3.6 8-8 8z m-154-16h146v-284h-146v284z'
          fill='#9A2D2F'></path>
        <path
          d='M397.3 236.8h-88c-3.3 0-6-2.7-6-6v-20c0-3.3 2.7-6 6-6h88c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6z'
          fill='#DAE5FF'></path>
        <path
          d='M576.7 640.5c-66.2 0-126.3-54-119.9-120 1.3-12.9 10-51 10-51h219.8s8.1 38.1 9.3 51c6 66-53 120-119.2 120z'
          fill='#FFFFFF'></path>
        <path
          d='M696.1 520.8H456.8v0.3c-6.4 66 53.7 120 120 120s125.3-54 119.3-120v-0.3z'
          fill='#FFACC2'></path>
        <path
          d='M576.8 632.5c32.1 0 64.1-14 85.5-37.5 0.4-0.4 0.7-0.9 1.1-1.3-19.7 17.5-26.6 15.3-40.3 19.8-26.7 8.8-34.7-7.5-48.7-10-14.8-2.6-33 16.2-63 0.5-12-6.3-26.2-18.3-33.5-25.9 3.4 5.7 7.4 11.1 12.1 16.2 21.8 23.9 54.2 38.2 86.8 38.2z'
          fill='#FFFFFF'></path>
        <path
          d='M746.7 640.5c-66.2 0-126.3-54-119.9-120 1.3-12.9 10-51 10-51h219.8s8.1 38.1 9.3 51c6 66-53 120-119.2 120z'
          fill='#FFFFFF'></path>
        <path
          d='M865.9 520h-239v0.3C620.4 586.1 680.5 640 746.7 640c66.2 0 125.2-53.9 119.2-119.7v-0.3z'
          fill='#FFACC2'></path>
        <path
          d='M746.7 632.5c32.1 0 64-14 85.5-37.5 0.4-0.4 0.7-0.9 1.1-1.3-19.7 17.5-26.6 15.3-40.3 19.8-26.6 8.7-34.6-7.5-48.6-10-14.8-2.6-33 16.2-62.9 0.5-12-6.3-26.1-18.3-33.5-25.9 3.4 5.7 7.4 11.1 12.1 16.2 21.6 23.9 54 38.2 86.6 38.2zM321.3 244.8v101.6c10.3-2.4 21-3.6 32-3.6 2.4 0 4.9 0.1 7.3 0.2-12-12.9-26.8-25.3-27.6-51.3-0.3-10.4-0.7-29.6 3.1-46.9h-14.8zM311.3 212.8v16h29.9c3.1-6.7 7.2-12.3 12.8-16h-42.7zM327.2 173.3c-3.3 0-5.9 2.7-5.9 5.9v17.6h50.5c4.4-6.9 7.5-15.1 9.7-23.1-0.7-0.3-1.4-0.4-2.1-0.4h-52.2z'
          fill='#FFFFFF'></path>
        <path
          d='M951.3 716.7c-5 0-7.5-3-12.7-10.2-5.1-7.2-12-17-25.7-17s-20.7 9.8-25.7 17c-5.1 7.3-7.7 10.2-12.7 10.2-5 0-7.5-3-12.7-10.2-5.1-7.2-12-17-25.7-17s-20.7 9.8-25.7 17c-5.1 7.3-7.7 10.2-12.7 10.2s-7.5-3-12.7-10.2c-5.1-7.2-12-17-25.7-17-1.5 0-2.8 0.4-4 1.1v-36.2c1.2 0.7 2.5 1.1 4 1.1 5 0 7.5 3 12.7 10.2 5.1 7.2 12 17 25.7 17s20.7-9.8 25.7-17c5.1-7.3 7.7-10.2 12.7-10.2s7.5 3 12.7 10.2c5.1 7.2 12 17 25.7 17 13.8 0 20.7-9.8 25.7-17 5.1-7.3 7.7-10.2 12.7-10.2s7.5 3 12.7 10.2c5.1 7.2 12 17 25.7 17 4.4 0 8-3.6 8-8s-3.6-8-8-8c-5 0-7.5-3-12.7-10.2-5.1-7.2-12-17-25.7-17s-20.7 9.8-25.7 17c-5.1 7.3-7.7 10.2-12.7 10.2-5 0-7.5-3-12.7-10.2-5.1-7.2-12-17-25.7-17s-20.7 9.8-25.7 17c-5.1 7.3-7.7 10.2-12.7 10.2s-7.5-3-12.7-10.2c-2.5-3.6-5.5-7.8-9.5-11.1 26.1-5.8 50.1-19.5 68.4-39.5 20.1-22 30.7-49.2 30.4-77.4 0-3-0.2-5.9-0.4-8.9v-0.4c0-0.1 0-0.3-0.1-0.4-1.5-14-9-49.4-9.3-50.9-0.8-3.7-4-6.3-7.8-6.3H494.2c-8.8-51.3-45-93.3-92.9-110.5V244.2c5.8-1.7 10-7.1 10-13.4v-20c0-6.3-4.2-11.7-10-13.4v-18.2c0-12.1-9.8-21.9-21.9-21.9h-52.1c-12.1 0-21.9 9.8-21.9 21.9v18.2c-5.8 1.7-10 7.1-10 13.4v20c0 6.3 4.2 11.7 10 13.4V351c-55.3 19.8-95 72.7-95 134.7v432c0 9.5 3.3 18.3 8.7 25.2H99.3c-4.4 0-8 3.6-8 8s3.6 8 8 8h824c4.4 0 8-3.6 8-8s-3.6-8-8-8h-168V704.3c1.2 0.7 2.5 1.1 4 1.1 5 0 7.5 3 12.7 10.2 5.1 7.2 12 17 25.7 17s20.7-9.8 25.7-17c5.1-7.3 7.7-10.2 12.7-10.2s7.5 3 12.7 10.2c5.1 7.2 12 17 25.7 17 13.8 0 20.7-9.8 25.7-17 5.1-7.3 7.7-10.2 12.7-10.2s7.5 3 12.7 10.2c5.1 7.2 12 17 25.7 17 4.4 0 8-3.6 8-8s-3.6-7.9-8-7.9zM643.2 477.5h206.9c1.7 8.4 4.8 23.6 6.6 34.5H636.1c1.9-11 5.2-26.1 7.1-34.5zM490 594.3c-16.2-17.8-25.1-39.4-25.7-61.7v-3.7h154v2.2c0.2 26.9 10.6 52.8 29.9 74 0.5 0.5 1 1.1 1.5 1.6-20.4 16.4-46.7 25.8-73 25.8-32.6 0-65-14.3-86.7-38.2z m-1.8 21.2c-0.1-0.1-0.2-0.1-0.2-0.2 0 0.1 0.1 0.1 0.2 0.2z m-3.9-3.5l-0.5-0.5c0.2 0.1 0.3 0.3 0.5 0.5z m142.5-134.5s0-0.1 0 0c-2.1 9.7-5.4 24.9-7 35.3H466c1.9-11 5.3-26.7 7.2-35.3h153.6zM321.3 179.2c0-3.3 2.7-5.9 5.9-5.9h52.1c3.3 0 5.9 2.7 5.9 5.9v17.6h-64v-17.6z m-10 33.6h84v16h-84v-16z m74 32v101.6c-10.3-2.4-21-3.6-32-3.6s-21.7 1.3-32 3.6V244.8h64z m-159 240.9c0-33.8 13.3-65.6 37.3-89.7 13.1-13.1 28.4-22.9 45.1-29.2 14.1-5.3 29.1-8.1 44.5-8.1s30.5 2.8 44.5 8.1c16.7 6.3 32.1 16.2 45.1 29.2 18.2 18.2 30.2 40.9 35 65.4h-11.2c-3.7 0-7 2.6-7.8 6.2-0.4 1.6-8.9 38.7-10.2 52-0.4 3.9-0.5 7.8-0.5 11.6 0.1 27 10.5 53 29.9 74.3 0.7 0.8 1.4 1.5 2.1 2.3v309.8c0 13.8-11.2 25-25 25h-204c-13.8 0-25-11.2-25-25V485.7z m270 432.1V622.1c21 15.7 46.7 25.3 73 26.8V943h-81.7c5.4-7 8.7-15.7 8.7-25.2z m89 25.2V648.9c28.3-1.8 55.2-12.7 76.7-30.8 21.7 17.7 49.2 28.5 77.3 30.2V943h-154z m161.4-311c-32.5 0-64.9-14.2-86.6-38.1-17.1-18.8-26.1-41.9-25.7-65.7v-0.3h223.9v4.6c-0.8 22.6-9.8 44.3-26.1 62.1-21.5 23.5-53.5 37.4-85.5 37.4z'
          fill='#9A2D2F'></path>
        <path
          d='M253.3 407.7c1.8 2 3.6 4.1 5.3 6.3 29.2 38.8 67.5 18.9 77 10.5 17.5-15.5 39.4-20.6 74.2-11.8 18.7 4.8 26.1-5.7 29.8-20-12.3-11.4-26.4-20.2-41.7-25.9-14.1-5.3-29.1-8.1-44.5-8.1s-30.5 2.8-44.5 8.1c-16.7 6.3-32.1 16.2-45.1 29.2-3.9 3.8-7.3 7.6-10.5 11.7z'
          fill='#FFFFFF'></path>
      </g>
    </svg>
  )

  return (
    <div className='w-[500px] overflow-hidden h-[200px] bg-slate-50 border rounded-md flex relative items-center justify-center'>
      <motion.div
        layoutId={`${prev}`}
        key={`${prev}`}
        animate={{ opacity: 0, rotate: 45 }}
        initial={{ opacity: 0, rotate: 45 }}
        transition={transition}
        exit={{ opacity: 1 }}
        layout='position'
        className='bg-white border top-0 left-0 rounded-lg h-2/3 w-2/2 shadow absolute text-4xl inline-flex justify-start items-center'>
        {prev === '1' ? curSvg : prev === '2' ? prevSvg : nextSvg}
      </motion.div>
      <motion.div
        layoutId={`${next}`}
        key={`${next}`}
        initial={{ opacity: 0, rotate: 45 }}
        animate={{ opacity: 0, rotate: 45 }}
        transition={transition}
        exit={{ opacity: 1 }}
        layout='position'
        className='bg-white border top-0 right-0 rounded-lg h-2/3 z-0 w-2/2 shadow absolute text-4xl inline-flex justify-end items-center'>
        {prev === '2' ? curSvg : prev === '3' ? prevSvg : nextSvg}
      </motion.div>

      <AnimatePresence mode='sync'>
        <motion.div
          layoutId={`${cur}`}
          key={`${cur}`}
          transition={transition}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          initial={{ opacity: 1, x: 0, rotate: 0 }}
          layout='position'
          className={cn(
            `bg-white border rounded-lg w-[140px] h-[140px] shadow items-center justify-center z-10 absolute text-4xl inline-flex`,
          )}>
          {prev === '3' ? curSvg : prev === '1' ? prevSvg : nextSvg}
        </motion.div>
      </AnimatePresence>
      <button
        onClick={() => {
          const c = cur
          const n = next
          const p = prev
          setPrev(n)
          setCur(p)
          setNext(c)
        }}
        className='absolute px-2 py-1 z-40 cursor-pointer text-slate-800 right-0'>
        <ChevronRightCircleIcon />
      </button>
    </div>
  )
}
