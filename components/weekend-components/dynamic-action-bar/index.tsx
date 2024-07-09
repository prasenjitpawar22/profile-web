'use client'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { cn } from '@/lib/utils'
import { useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { AppWindowMacIcon } from './app-window-mac-icon'
import { CodeIcon } from './code-icon'
import { NotePadIcon } from './notepad-icon'
import { SquareArrowOutUpRight, CodeIcon as LucideCodeIcon, Paperclip } from 'lucide-react'

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

  return (
    <motion.div className='flex w-[500px] bg-slate-50 h-[200px] items-end justify-center border p-3 rounded-md'>
      <CollapsibleRoot
        initial={{ width: 280 }}
        animate={{ width: state.isOpen ? 300 : 280 }}
        className={cn('border backdrop-blur-md bg-white shadow items-center justify-center rounded-xl px-[15px] flex flex-col')}
        open={state.isOpen}
        onOpenChange={(e) => setState({ isOpen: e, state: null })}>
        <AnimatePresence>
          {state.isOpen && state.state === BarButtons.App && (
            <CollapsibleContent
              layout='position'
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.App })}
              onMouseLeave={() => setState({ isOpen: false })}
              initial={{ display: 'flex', height: 0, marginBottom: 6, marginTop: 12 }}
              animate={{ display: 'flex', height: 'auto', marginBottom: 6, marginTop: 12 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.73 }}
              forceMount
              className='flex w-full items-center justify-center overflow-hidden h-full flex-col gap-2 rounded-md'>
              <div className='group justify-between gap-2 items-center w-full flex hover:bg-slate-50 rounded-md hover:p-2 cursor-pointer transition-all duration-300'>
                <div className='flex gap-2 items-center justify-start'>
                  <svg className='bg-slate-700 fill-white border rounded-lg p-1' width='34' height='34' viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'>
                    <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
                    <g id='SVGRepo_tracerCarrier' strokeLinecap='round' strokeLinejoin='round'></g>
                    <g id='SVGRepo_iconCarrier'>
                      <title>ionicons-v5_logos</title>
                      <path d='M80,32,48,112V416h96v64h64l64-64h80L464,304V32ZM416,288l-64,64H256l-64,64V352H112V80H416Z'></path>
                      <rect x='320' y='143' width='48' height='129'></rect>
                      <rect x='208' y='143' width='48' height='129'></rect>
                    </g>
                  </svg>
                  <div className='flex flex-col items-start '>
                    <h1 className='text-xs inline-flex gap-1 items-center font-bold tracking-tight'>
                      Twitch
                      <SquareArrowOutUpRight className='text-black/[0.7]' size={10} />
                    </h1>
                    <p className='text-xs text-black/[0.7]'>Streams</p>
                  </div>
                </div>
                <span className='text-xs hidden group-hover:block text-black/[.4] px-2 py-1 border rounded-md'>Web</span>
              </div>
              <div className='group justify-between gap-2 items-center w-full flex hover:bg-slate-50 rounded-md hover:p-2 cursor-pointer transition-all duration-300'>
                <div className='flex gap-2 items-center justify-start'>
                  <svg className='bg-slate-700 fill-white border rounded-lg p-1' width='34' height='34' viewBox='0 0 32 32' version='1.1' xmlns='http://www.w3.org/2000/svg'>
                    <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
                    <g id='SVGRepo_tracerCarrier' strokeLinecap='round' strokeLinejoin='round'></g>
                    <g id='SVGRepo_iconCarrier'>
                      <title>slack</title>{' '}
                      <path d='M19.955 23.108c-1.74 0-3.151-1.411-3.151-3.151s1.411-3.151 3.151-3.151h7.889c1.74 0 3.151 1.411 3.151 3.151s-1.411 3.151-3.151 3.151v0zM19.955 24.693c1.739 0 3.149 1.41 3.149 3.149s-1.41 3.149-3.149 3.149c-1.738 0-3.148-1.408-3.149-3.146v-3.152zM23.108 12.044c0 1.74-1.411 3.151-3.151 3.151s-3.151-1.411-3.151-3.151v0-7.888c0-1.74 1.411-3.151 3.151-3.151s3.151 1.411 3.151 3.151v0zM24.693 12.044c0.001-1.738 1.41-3.147 3.148-3.147s3.148 1.41 3.148 3.149c0 1.738-1.408 3.147-3.145 3.149h-3.152zM12.044 8.893c1.736 0.005 3.142 1.413 3.142 3.15s-1.406 3.146-3.142 3.15h-7.888c-1.736-0.005-3.142-1.413-3.142-3.15s1.406-3.146 3.142-3.15h0zM12.044 7.305c-1.736-0.002-3.143-1.41-3.143-3.147 0-1.738 1.409-3.147 3.147-3.147s3.145 1.408 3.147 3.144v3.149zM8.893 19.955c0.005-1.736 1.413-3.142 3.15-3.142s3.146 1.406 3.15 3.142v7.889c-0.005 1.736-1.413 3.142-3.15 3.142s-3.146-1.406-3.15-3.142v-0zM7.305 19.955c-0.001 1.737-1.41 3.145-3.147 3.145s-3.147-1.409-3.147-3.147c0-1.738 1.408-3.146 3.145-3.147h3.149z'></path>{' '}
                    </g>
                  </svg>
                  <div className='flex flex-col items-start '>
                    <h1 className='text-xs inline-flex gap-1 items-center font-bold tracking-tight'>
                      Slack
                      <SquareArrowOutUpRight className='text-black/[0.7]' size={10} />
                    </h1>
                    <p className='text-xs text-black/[0.7]'>Streams</p>
                  </div>
                </div>
                <span className='text-xs hidden group-hover:block text-black/[.4] px-2 py-1 border rounded-md'>Web</span>
              </div>
            </CollapsibleContent>
          )}
          {state.isOpen && state.state === BarButtons.components && (
            <CollapsibleContent
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.components })}
              onMouseLeave={() => setState({ isOpen: false })}
              animate={{ display: 'flex', height: 'auto', marginBottom: 6, marginTop: 12 }}
              initial={{ display: 'flex', height: 0, marginBottom: 6, marginTop: 12 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.73 }}
              forceMount
              className='flex w-full items-center rounded-b-none justify-center overflow-hidden h-full flex-col gap-2 rounded-md'>
              <div className='group justify-between gap-2 items-center w-full flex hover:bg-slate-50 rounded-md hover:p-2 cursor-pointer transition-all duration-300'>
                <div className='flex gap-2 items-center justify-start'>
                  <LucideCodeIcon size={14} />
                  <h1 className='text-xs inline-flex gap-1 items-center font-bold tracking-tight'>Dynamic Action Bar</h1>
                </div>
                <div className='flex text-xs gap-1 justify-between items-center'>
                  <span className='group-hover:block text-black/[.4] px-2 py-1 border rounded-md'>Dynamic</span>
                  <span> 07 - 24 </span>
                </div>
              </div>
              <div className='group justify-between gap-2 items-center w-full flex hover:bg-slate-50 rounded-md hover:p-2 cursor-pointer transition-all duration-300'>
                <div className='flex gap-2 items-center justify-start'>
                  <LucideCodeIcon size={14} />
                  <h1 className='text-xs inline-flex gap-1 items-center font-bold tracking-tight'>Slack</h1>
                </div>
                <div className='flex text-xs gap-1 justify-between items-center'>
                  <span className='group-hover:block text-black/[.4] px-2 py-1 border rounded-md'>Dynamic</span>
                  <span> 07 - 24 </span>
                </div>
              </div>
            </CollapsibleContent>
          )}
          {state.isOpen && state.state === BarButtons.Notes && (
            <CollapsibleContent
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.Notes })}
              onMouseLeave={() => setState({ isOpen: false })}
              animate={{ display: 'flex', height: 'auto', marginBottom: 6, marginTop: 12 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.73 }}
              forceMount
              className='flex w-full items-center rounded-b-none justify-center overflow-hidden h-full flex-col gap-2 rounded-md'>
              <div className='group justify-between gap-2 items-center w-full flex hover:bg-slate-50 rounded-md hover:p-2 cursor-pointer transition-all duration-300'>
                <div className='flex gap-2 items-center justify-start'>
                  <Paperclip size={14} />
                  <h1 className='text-xs inline-flex gap-1 items-center font-bold tracking-tight'>Dappper split-on</h1>
                </div>
                <div className='flex text-xs gap-1 justify-between items-center'>
                  <span> May, 2024</span>
                </div>
              </div>
              <div className='group justify-between gap-2 items-center w-full flex hover:bg-slate-50 rounded-md hover:p-2 cursor-pointer transition-all duration-300'>
                <div className='flex gap-2 items-center justify-start'>
                  <Paperclip size={14} />
                  <h1 className='text-xs inline-flex gap-1 items-center font-bold tracking-tight'>Feedback component</h1>
                </div>
                <div className='flex text-xs gap-1 justify-between items-center'>
                  <span> Apr, 2024 </span>
                </div>
              </div>
              <div className='group justify-between gap-2 items-center w-full flex hover:bg-slate-50 rounded-md hover:p-2 cursor-pointer transition-all duration-300'>
                <div className='flex gap-2 items-center justify-start'>
                  <Paperclip size={14} />
                  <h1 className='text-xs inline-flex gap-1 items-center font-bold tracking-tight'>Rolling back database</h1>
                </div>
                <div className='flex text-xs gap-1 justify-between items-center'>
                  <span> Dec, 2025 </span>
                </div>
              </div>
            </CollapsibleContent>
          )}
        </AnimatePresence>

        <div className={cn('flex gap-2 justify-center items-center py-1 rounded-xl', state.isOpen && 'border-t rounded-t-none')}>
          <CollapsiblePrimitive.Trigger asChild>
            <motion.button
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.App })}
              onMouseLeave={() => setState({ isOpen: false })}
              onClick={(e) => e.preventDefault()}
              className={cn(
                'inline-flex items-center cursor-default justify-center gap-1 w-full px-2 hover:text-white hover:bg-slate-700 transition-all duration-300 py-1 rounded-md text-xs',
                state.isOpen && state.state === BarButtons.App ? 'bg-slate-700 text-white' : null,
              )}
              variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
              initial='default'
              animate='default'
              whileHover={'hover'}>
              <AppWindowMacIcon />
              {BarButtons.App}
            </motion.button>
          </CollapsiblePrimitive.Trigger>
          <CollapsiblePrimitive.Trigger asChild>
            <motion.button
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.components })}
              onMouseLeave={() => setState({ isOpen: false })}
              onClick={(e) => {
                e.preventDefault()
              }}
              className={cn(
                'inline-flex items-center cursor-default gap-1 justify-center w-full hover:text-white hover:bg-slate-700 px-2 transition-all duration-300 py-1 rounded-md text-sm',
                state.isOpen && state.state === BarButtons.components ? 'bg-slate-700 text-white ' : null,
              )}
              variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
              initial='default'
              animate='default'
              whileHover={'hover'}>
              <CodeIcon />
              {BarButtons.components}
            </motion.button>
          </CollapsiblePrimitive.Trigger>
          <CollapsiblePrimitive.Trigger asChild>
            <motion.button
              onMouseEnter={() => setState({ isOpen: true, state: BarButtons.Notes })}
              onMouseLeave={() => setState({ isOpen: false })}
              onClick={(e) => e.preventDefault()}
              className={cn(
                'inline-flex items-center cursor-default group gap-1 justify-center w-full hover:text-white hover:bg-slate-700 px-2 transition-all duration-300 py-1 rounded-md text-sm',
                state.isOpen && state.state === BarButtons.Notes ? 'bg-slate-700 text-white' : null,
              )}
              variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
              initial='default'
              animate='default'
              whileHover={'hover'}>
              <NotePadIcon />
              {BarButtons.Notes}
            </motion.button>
          </CollapsiblePrimitive.Trigger>
        </div>
      </CollapsibleRoot>
    </motion.div>
  )
}
