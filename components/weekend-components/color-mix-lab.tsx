'use client'

import { MotionProps, motion } from 'motion/react'
import { useState } from 'react'

interface ColorMixLabProps extends MotionProps {
  animate?: { '--color': string } & MotionProps['animate']
  initial?: { '--color': string } & MotionProps['initial']
}

export function ColorMixLab() {
  const [color, setColor] = useState('#6366f1') // Starting with a vibrant purple-blue for better initial impact

  return (
    <div className='relative flex p-2 border bg-foreground/[0.02] rounded-md min-h-[200px] text-sm w-full items-center justify-center'>
      <motion.div
        animate={{ '--color': color } as any}
        initial={{ '--color': '#6366f1' }}
        className='min-w-[400px] border border-white/10 overflow-hidden backdrop-blur-md p-6 rounded-2xl relative  shadow-2xl transition-shadow duration-300'
        style={{
          // Deep dark base mixed slightly with the custom color for an ultra-premium glass look
          backgroundColor: 'color-mix(in srgb, var(--color) 8%, #0f172a)',
        }}>
        <div className='relative z-10 flex flex-col gap-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3
                className='text-xs font-semibold uppercase tracking-wider'
                style={{
                  color: 'color-mix(in srgb, var(--color) 35%, #ffffff)',
                }}>
                Color Mix Engine
              </h3>
              <p
                className='text-xl font-bold tracking-tight mt-1'
                style={{
                  color: 'color-mix(in srgb, var(--color) 15%, #ffffff)',
                }}>
                Interactive Swatch
              </p>
            </div>

            {/* Interactive Styled Swatch Preview */}
            <label
              htmlFor='color-picker'
              className='group flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95'>
              <div
                className='w-4 h-4 rounded-full border border-white/20 shadow-inner'
                style={{ backgroundColor: 'var(--color)' }}
              />
              <span className='font-mono text-xs text-slate-300 group-hover:text-white transition-colors uppercase'>
                {color}
              </span>
            </label>
          </div>

          {/* Demonstration Block showing off the CSS color-mix() output */}
          <div
            className='h-24 w-full backdrop-blur-3xl rounded-xl border border-white/5 flex items-center justify-center font-medium shadow-inner transition-all'
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color) 25%, #0f172a)',
              color:
                'contrast-color(color-mix(in srgb, var(--color) 100%, #ffffff))',
            }}>
            35% Mix Contrast Preview
          </div>

          {/* Completely hidden input triggered cleanly via the <label> above */}
          <input
            type='color'
            id='color-picker'
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className='sr-only'
          />
        </div>

        {/* Modern Ambient Mesh Glow (Replaces the rigid absolute div) */}
        <motion.div
          animate={{
            // 1. Move X: Left (0) -> Right (100) -> Hold -> Left (0) -> Hold
            left: ['-22%', '90%', '90%', '-22%', '-22%'],
            // 2. Move Y: Hold -> Bottom (90) -> Hold -> Top (0) -> Hold
            top: ['-40%', '-40%', '80%', '80%', '-40%'],
          }}
          transition={{
            duration: 12,
            ease: 'anticipate',
            repeat: Infinity,
          }}
          className='absolute left-[-22%] top-[-40%] h-40 w-40 opacity-80 rounded-full blur-xl pointer-events-none transition-transform duration-500 hover:scale-125'
          style={{
            backgroundColor: 'var(--color)',
          }}
        />
      </motion.div>
    </div>
  )
}
