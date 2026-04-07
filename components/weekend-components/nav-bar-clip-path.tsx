import React, { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

export function NavbarClipPath() {
  const [active, setActive] = useState('home')
  const container = useRef<HTMLDivElement>(null)
  const activeEl = useRef<HTMLLIElement>(null)

  const nav = ['home', 'about', 'contact', 'login']

  useLayoutEffect(() => {
    const containerRef = container.current
    const activeRef = activeEl.current
    if (!containerRef || !activeRef) return

    const { offsetLeft, offsetWidth } = activeRef
    const containerWidth = containerRef.offsetWidth

    const right = offsetLeft + offsetWidth
    const left = offsetLeft

    const leftPercent = Number((left / containerWidth) * 100).toFixed()

    const rightPercent = Number(100 - (right / containerWidth) * 100).toFixed()

    containerRef.style.clipPath = `inset(0 ${rightPercent}% 0 ${leftPercent}% round 9999px)`
  }, [active, container, activeEl])

  return (
    <div className='relative flex p-2 border bg-foreground/[.02]  rounded-md h-[200px]  text-sm w-full items-center justify-center'>
      {/* <svg width='0' height='0'>
        <filter id='gooey-nav'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='1' result='blur' />
          <feColorMatrix
            in='blur'
            mode='matrix'
            values='
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 20 -10
            '
            result='gooey-nav'
          />
          <feBlend in='SourceGraphic' in2='gooey-nav' />
        </filter>
      </svg> */}

      <div className='relative w-full h-full flex items-center justify-center'>
        <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 py-2 bg-black shadow-xl shadow-black rounded-full text-white w-max'>
          <ul className='flex gap-2 px-4'>
            {nav.map((l, i) => (
              <React.Fragment key={i}>
                <li
                  key={l}
                  className='p-2 cursor-pointer py-2 px-2 relative'
                  onClick={() => setActive(l)}
                  ref={active === l ? activeEl : null}>
                  {l}
                  {l === active ? (
                    <motion.div
                      layoutId='gooey'
                      className='absolute bg-white shadow shadow-white blur-[4px] w-full h-full top-0 left-0 rounded-full'></motion.div>
                  ) : null}
                </li>
              </React.Fragment>
            ))}
          </ul>
        </div>

        <div
          ref={container}
          className='z-10 transition-[clip-path] [clip-path:inset(0_75%_0_6%_round_9999px)] overflow-hidden duration-300 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow shadow-white rounded-full text-black w-max'>
          <ul className='flex gap-2 px-4'>
            {nav.map((l, i) => (
              <React.Fragment key={i}>
                <div className=' bg-red-500 absolute rounded-full -z-10'></div>
                <motion.li
                  layoutId={l}
                  key={l}
                  className='py-2 px-2 cursor-default'>
                  {l}
                </motion.li>
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
