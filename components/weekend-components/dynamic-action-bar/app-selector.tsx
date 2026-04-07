'use client'

import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import {
  InstagramLogoIcon,
  FigmaLogoIcon,
  TwitterLogoIcon,
  FramerLogoIcon,
  GitHubLogoIcon,
} from '@radix-ui/react-icons'

const MotionButton = motion(Button)
const Instagram = motion(InstagramLogoIcon)
const Figma = motion(FigmaLogoIcon)
const Twitter = motion(TwitterLogoIcon)
const GitHub = motion(GitHubLogoIcon)
const Framer = motion(FramerLogoIcon)
const Message = motion(MessageCircle)

export function AppSelector() {
  const [open, onOpenChange] = useState(false)
  const [selectedApp, setSelectedApp] = useState(
    <Instagram layoutId='Instagram' />,
  )

  const icons = [
    {
      icon: (
        <Instagram
          layoutId='Instagram'
          className='h-6 w-6 hover:text-foreground text-foreground/50 cursor-pointer transition-all duration-200'
        />
      ),
      selected: <Instagram layoutId='Instagram' />,
    },
    {
      icon: (
        <Figma
          layoutId='Figma'
          className='h-6 w-6 hover:text-foreground text-foreground/50 cursor-pointer transition-all duration-200'
        />
      ),
      selected: <Figma layoutId='Figma' />,
    },
    {
      icon: (
        <Twitter
          layoutId='Twitter'
          className='h-6 w-6 hover:text-foreground text-foreground/50 cursor-pointer transition-all duration-200'
        />
      ),
      selected: <Twitter layoutId='Twitter' />,
    },
    {
      icon: (
        <GitHub
          layoutId='GitHub'
          className='h-6 w-6 hover:text-foreground text-foreground/50 cursor-pointer transition-all duration-200'
        />
      ),
      selected: <GitHub layoutId='GitHub' />,
    },
    {
      icon: (
        <Framer
          layoutId='Framer'
          className='h-6 w-6 hover:text-foreground text-foreground/50 cursor-pointer transition-all duration-200'
        />
      ),
      selected: <Framer layoutId='Framer' />,
    },
    {
      icon: (
        <Message
          layoutId='Message'
          className='h-6 w-6 hover:text-foreground text-foreground/50 cursor-pointer'
        />
      ),
      selected: <Message layoutId='Message' className='h-4 w-4' />,
    },
  ]

  return (
    <div className='bg-foreground/[.02] py-2 w-full relative h-fit gap-4 items-center flex-col px-4 flex rounded-md shadow border'>
      <p className='text-sm tracking-wide'>
        {` This component is an animated app switcher that provides a visually
        interactive way to choose between various application icons. When
        clicked, it expands to display all available app icons, allowing the
        user to select one. Once selected, the component collapses, showing the
        chosen app icon on the button. It's ideal for scenarios where users need
        a compact and engaging way to switch between different tools or
        platforms within an application.`}
      </p>
      <div className='flex items-center h-[100px]'>
        <motion.div
          onKeyDown={(e) => e.code === 'Escape' && onOpenChange(false)}
          className='border-2 bg-foreground/[.02] text-foreground text-sm flex flex-col gap-4 rounded-2xl shadow overflow-hidden'>
          <AnimatePresence mode='popLayout'>
            {!open ? (
              <MotionButton
                key={'button'}
                layoutId='title'
                initial={false}
                animate={{ height: 'fit' }}
                className='text-sm flex gap-2 bg-background/80 text-foreground hover:bg-background '
                onClick={() => onOpenChange(true)}
                variant={'default'}>
                {selectedApp} Apps
              </MotionButton>
            ) : (
              <motion.div key={'block'} className='rounded-2xl'>
                <div className='flex justify-between p-2'>
                  <motion.h1 layoutId='title' className=''>
                    Apps
                  </motion.h1>
                  <X
                    className='h-4 w-4 cursor-pointer hover:text-foreground text-foreground/50 transition-all duration-200'
                    onClick={() => onOpenChange(false)}
                  />
                </div>
                <motion.div
                  key={'block-child'}
                  initial={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.3 } }}
                  className='grid grid-cols-6 gap-4 z-10 shadow-inner rounded-b-none rounded-2xl p-2 text-foreground bg-background w-full'>
                  {icons.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onOpenChange(false)
                        setSelectedApp(item.selected)
                      }}>
                      {item.icon}
                    </button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
