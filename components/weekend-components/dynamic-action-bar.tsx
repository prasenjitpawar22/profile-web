'use client'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { cn } from '@/lib/utils'
import { useState } from 'react'

import { AnimatePresence, Variant, motion } from 'framer-motion'
import { AppWindowMac } from '../app-window-mac'
import { CodeIcon } from '../code-icon'

const CollapsibleContent = motion(CollapsiblePrimitive.Content)
const CollapsibleRoot = motion(CollapsiblePrimitive.Root)

enum BarButtons {
  'App' = 'Apps',
  'Notes' = 'Notes',
  'components' = 'components',
}

export const DynamicActionBar = () => {
  const [state, setState] = useState<{
    isOpen: boolean
    state?: null | BarButtons
  }>({ isOpen: false, state: null })

  const variant: { default: Variant; hover: Variant } = {
    default: { opacity: 0, pathLength: 0 },
    hover: { opacity: 1, pathLength: 1 },
  }

  return (
    <motion.div className='flex w-[500px] bg-slate-50 h-[200px] border items-start p-3 justify-center  rounded-md'>
      <CollapsibleRoot
        initial={{ width: 280 }}
        animate={{ width: state.isOpen ? 290 : 280 }}
        className={cn('border backdrop-blur-md bg-white shadow rounded-2xl px-2 flex items-center justify-center flex-col')}
        open={state.isOpen}
        onOpenChange={(e) => setState({ isOpen: e, state: null })}>
        <div className={cn('flex gap-2 justify-center items-center px-3 py-2 rounded-2xl', state.isOpen && 'rounded-b-none')}>
          <CollapsiblePrimitive.Trigger asChild>
            <motion.button
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.App })}
              onMouseLeave={() => setState({ isOpen: false })}
              onClick={(e) => e.preventDefault()}
              className={cn(
                'inline-flex items-center justify-center gap-1 w-full hover:text-white hover:bg-slate-700 px-2 transition-all duration-300 py-1 rounded-2xl text-sm',
                state.isOpen && state.state === BarButtons.App ? 'bg-slate-700 text-white' : null,
              )}
              variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
              initial='default'
              animate='default'
              whileHover={'hover'}>
              <motion.svg
                variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                stroke-width='2'
                stroke-linecap='round'
                stroke-linejoin='round'
                className='lucide lucide-app-window-mac'>
                <rect width='20' height='16' x='2' y='4' rx='2' />
                <motion.path variants={variant} d='M6 8h.01' />
                <motion.path variants={variant} d='M10 8h.01' />
                <motion.path variants={variant} d='M14 8h.01' />
              </motion.svg>
              {BarButtons.App}
            </motion.button>
          </CollapsiblePrimitive.Trigger>
          <CollapsiblePrimitive.Trigger asChild>
            <motion.button
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.components })}
              key={'components'}
              onMouseLeave={() => setState({ isOpen: false })}
              onClick={(e) => {
                e.preventDefault()
              }}
              className={cn(
                'inline-flex items-center gap-1 justify-center w-full hover:text-white hover:bg-slate-700 px-2 transition-all duration-300 py-1 rounded-2xl text-sm',
                state.isOpen && state.state === BarButtons.components ? 'bg-slate-700 text-white ' : null,
              )}
              variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
              initial='default'
              animate='default'
              whileHover={'hover'}>
              <motion.svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='lucide lucide-code-xml'
                variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}>
                <motion.path d='m18 16 4-4-4-4' />
                <motion.path d='m6 8-4 4 4 4' />
                <motion.path variants={{ default: { pathLength: 1, opacity: 1 }, hover: { pathLength: 0, opacity: 0 } }} d='m14.5 4-5 16' />
              </motion.svg>
              {BarButtons.components}
            </motion.button>
          </CollapsiblePrimitive.Trigger>
          <CollapsiblePrimitive.Trigger asChild>
            <AnimatePresence mode='sync'>
              <motion.button
                onMouseEnter={() => setState({ isOpen: true, state: BarButtons.Notes })}
                onMouseLeave={() => setState({ isOpen: false })}
                key={'notes'}
                id='notes'
                layoutId='notes'
                onClick={(e) => e.preventDefault()}
                className={cn(
                  'inline-flex items-center group gap-1 justify-center w-full hover:text-white hover:bg-slate-700 px-2 transition-all duration-300 py-1 rounded-2xl text-sm',
                  state.isOpen && state.state === BarButtons.Notes ? 'bg-slate-700 text-white' : null,
                )}
                variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
                initial='default'
                animate='default'
                whileHover={'hover'}>
                <motion.svg
                  variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
                  xmlns='http://www.w3.org/2000/svg'
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className={cn('lucide lucide-notepad-text', 'group-hover:text-white')}>
                  <path d='M8 2v4' />
                  <path d='M12 2v4' />
                  <path className='w-0' d='M16 2v4' />
                  <rect width='16' height='18' x='4' y='4' rx='2' />
                  <motion.path variants={variant} d='M8 10h6' />
                  <motion.path variants={variant} d='M8 14h8' />
                  <motion.path variants={variant} d='M8 18h5' />
                </motion.svg>
                {BarButtons.Notes}
              </motion.button>
            </AnimatePresence>
          </CollapsiblePrimitive.Trigger>
        </div>

        <AnimatePresence>
          {state.isOpen && state.state === BarButtons.App && (
            <CollapsibleContent
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.App })}
              onMouseLeave={() => setState({ isOpen: false })}
              initial={{ display: 'none', height: 0 }}
              animate={{ display: 'flex', height: 100 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.73 }}
              forceMount
              className='flex w-full items-center border-t rounded-t-none justify-center overflow-hidden px-4 h-full flex-col gap-2 rounded-2xl'>
              Hello from inside the Dialog!
            </CollapsibleContent>
          )}
          {state.isOpen && state.state === BarButtons.components && (
            <CollapsibleContent
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.components })}
              onMouseLeave={() => setState({ isOpen: false })}
              initial={{ display: 'none', height: 0 }}
              animate={{ display: 'flex', height: 100 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.73 }}
              forceMount
              className='flex w-full items-center border-t rounded-t-none justify-center overflow-hidden px-4 h-full flex-col gap-2 rounded-2xl'>
              components hai
            </CollapsibleContent>
          )}
          {state.isOpen && state.state === BarButtons.Notes && (
            <CollapsibleContent
              onMouseEnter={() =>
                setState({
                  isOpen: true,
                  state: BarButtons.Notes,
                })
              }
              onMouseLeave={() => setState({ isOpen: false })}
              initial={{ display: 'none', height: 0 }}
              animate={{ display: 'flex', height: 100 }}
              transition={{
                type: 'spring',
                bounce: 0.5,
                duration: 0.73,
              }}
              forceMount
              className='flex w-full items-center border-t rounded-t-none justify-center overflow-hidden px-4 h-full flex-col gap-2 rounded-2xl'>
              Notes ahi
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </CollapsibleRoot>
    </motion.div>
  )
}
