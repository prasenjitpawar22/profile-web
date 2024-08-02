'use client'

import * as Accordion from '@radix-ui/react-accordion'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDownIcon } from 'lucide-react'
import React, { ComponentPropsWithoutRef, ElementRef, useState } from 'react'

export const NormalAccordion = () => {
  const [cur, setCur] = useState(0)

  const variants = {
    open: { opacity: 1, height: 'auto' },
    collapsed: { opacity: 0, height: 0 },
    exit: { opacity: 0, height: 0, margin: 0 },
  }

  const items = [
    {
      id: 1,
      title: 'Is it accessible?',
      desc: 'Yes. It adheres to the WAI-ARIA design pattern.',
    },
    {
      id: 2,
      title: 'Is it unstyled?',
      desc: "Yes. It's unstyled by default, giving you freedom over the look and feel.",
    },
    {
      id: 3,
      title: 'Can it be animated?',
      desc: 'Yes! You can animate the Accordion with CSS or JavaScript.',
    },
  ]

  const AccordionContent = motion(AccordionContentPremitive)
  return (
    <div className='flex p-2 border bg-slate-50 text-slate-700 rounded-md h-[200px] w-[500px] items-center justify-center'>
      <Accordion.Root
        className='px-3 py-2 rounded-md w-full bg-white'
        type='single'>
        {items.map((item) => (
          <Accordion.Item
            key={item.id}
            className={clsx('py-1 text-sm overflow-hidden')}
            value='item-1'>
            <AccordionTrigger
              onClick={() =>
                setCur((prev) => (prev === item.id ? 0 : item.id))
              }>
              {item.title}
              <ChevronDownIcon
                className={clsx(
                  'transition-all duration-300',
                  cur === item.id ? 'rotate-180' : '',
                )}
                size={14}
                aria-hidden
              />
            </AccordionTrigger>
            <AnimatePresence>
              {cur === item.id && (
                <AccordionContent
                  forceMount
                  initial='collapsed'
                  animate='open'
                  exit='exit'
                  variants={variants}
                  transition={{ duration: 0.3 }}>
                  {item.desc}
                </AccordionContent>
              )}
            </AnimatePresence>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  )
}

const AccordionTrigger = React.forwardRef<
  ElementRef<typeof Accordion.AccordionTrigger>,
  ComponentPropsWithoutRef<typeof Accordion.AccordionTrigger>
>(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Header className='AccordionHeader'>
    <Accordion.Trigger
      className={clsx('flex w-full justify-between hover:underline', className)}
      {...props}
      ref={forwardedRef}>
      {children}
    </Accordion.Trigger>
  </Accordion.Header>
))

const AccordionContentPremitive = React.forwardRef<
  ElementRef<typeof Accordion.AccordionContent>,
  ComponentPropsWithoutRef<typeof Accordion.AccordionContent>
>(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Header className='AccordionHeader'>
    <Accordion.AccordionContent
      className={clsx('my-1', className)}
      {...props}
      ref={forwardedRef}>
      {children}
    </Accordion.AccordionContent>
  </Accordion.Header>
))
