'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Command, CommandItem, CommandList } from '@/components/ui/command'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, X } from 'lucide-react'

type Option = { label: string; value: string }

interface MultiSelectProps {
  options: Option[]
  onValueChange: (value: string[]) => void
  defaultValues?: string[]
  placeHolder?: string
  maxCount?: number
  className?: string
}

const MotionCommandItem = motion.create(CommandItem)

const ease = [0.23, 1, 0.32, 1] as const

export function MultiSelect({
  options,
  defaultValues = [],
  onValueChange,
  placeHolder = 'Select options',
  maxCount,
  className,
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] = useState(defaultValues)
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()

  // Chips pop in from slightly smaller and leave a touch faster than they
  // arrive. Under reduced motion they only fade, and neighbours snap into place.
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
  const shown = { opacity: 1, scale: 1 }
  const chipTransition = {
    duration: 0.2,
    ease,
    layout: reduceMotion ? { duration: 0 } : { duration: 0.2, ease },
  }
  const chipExit = { ...hidden, transition: { duration: 0.15, ease } }

  function update(values: string[]) {
    setSelectedValues(values)
    onValueChange(values)
  }

  function toggleOption(value: string) {
    update(
      selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value],
    )
  }

  // The button that had focus is about to unmount (or hide), so hand focus
  // to the trigger instead of letting it fall back to <body>
  function remove(value: string) {
    toggleOption(value)
    triggerRef.current?.focus()
  }

  function clearAll() {
    update([])
    triggerRef.current?.focus()
  }

  const labelFor = (value: string) =>
    options.find((o) => o.value === value)?.label ?? value
  const visible = maxCount ? selectedValues.slice(0, maxCount) : selectedValues
  const overflow = selectedValues.length - visible.length
  const hasSelection = selectedValues.length > 0

  return (
    // Radix handles Escape and outside clicks through onOpenChange
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex min-h-10 w-full items-center gap-2 rounded-2xl border bg-background px-2 py-1.5 text-sm shadow-sm',
            className,
          )}>
          {/* `relative` is what popLayout measures exiting chips against.
              One presence boundary for the placeholder and every chip, so the
              first chip animates in and the last one animates out too. */}
          <div className='relative flex flex-1 flex-wrap items-center gap-1.5'>
            <AnimatePresence initial={false} mode='popLayout'>
              {!hasSelection ? (
                <motion.button
                  key='placeholder'
                  type='button'
                  onClick={() => setIsOpen(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.15, ease }}
                  className='flex-1 rounded-md px-1 text-left text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  {placeHolder}
                </motion.button>
              ) : null}

              {visible.map((value) => (
                <motion.span
                  // Position only: a chip never resizes, and size layout
                  // would stretch its text mid-flight
                  layout='position'
                  key={value}
                  initial={hidden}
                  animate={shown}
                  exit={chipExit}
                  transition={chipTransition}
                  className='flex items-center gap-1 rounded-full bg-accent py-0.5 pl-2.5 pr-1 text-accent-foreground'>
                  {labelFor(value)}
                  <button
                    type='button'
                    aria-label={`Remove ${labelFor(value)}`}
                    onClick={() => remove(value)}
                    className='grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                    <X className='h-3 w-3' />
                  </button>
                </motion.span>
              ))}

              {overflow > 0 ? (
                <motion.span
                  layout='position'
                  key='more'
                  initial={hidden}
                  animate={shown}
                  exit={chipExit}
                  transition={chipTransition}
                  className='flex items-center rounded-full border px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground'>
                  +
                  {/* Only the count rolls, the chip itself stays put */}
                  <span className='relative inline-flex overflow-hidden'>
                    <AnimatePresence mode='popLayout' initial={false}>
                      <motion.span
                        key={overflow}
                        initial={reduceMotion ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { y: '100%', opacity: 0 }}
                        transition={{ duration: 0.15, ease }}
                        className='inline-block'>
                        {overflow}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  &nbsp;more
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Always rendered so it never shoves the chips sideways as it
              appears; it just fades and drops out of the tab order */}
          <button
            type='button'
            onClick={clearAll}
            tabIndex={hasSelection ? 0 : -1}
            aria-hidden={!hasSelection}
            className={cn(
              'shrink-0 rounded-md px-1 text-xs text-muted-foreground transition-opacity duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              hasSelection ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}>
            Clear all
          </button>
          <span className='h-5 shrink-0 border-l' />
          <PopoverTrigger asChild>
            <button
              ref={triggerRef}
              type='button'
              aria-label={isOpen ? 'Close options' : 'Open options'}
              className='grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent className='w-[220px] p-0' align='end'>
        <Command>
          <CommandList>
            {options.map((opt) => {
              const selected = selectedValues.includes(opt.value)
              return (
                <MotionCommandItem
                  key={opt.value}
                  onSelect={() => toggleOption(opt.value)}
                  className='flex w-full cursor-pointer justify-between'
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                  {opt.label}
                  {/* The tick lands with a small pop; the row highlight
                      itself stays instant, since list navigation repeats */}
                  <Check
                    className={cn(
                      'h-4 w-4 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
                      selected ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
                    )}
                  />
                </MotionCommandItem>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const MultiSelectExample = () => {
  const options = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'figma', label: 'Figma' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'github', label: 'GitHub' },
    { value: 'framer', label: 'Framer' },
    { value: 'messages', label: 'Messages' },
  ]

  return (
    <div className='w-full max-w-[400px]'>
      <MultiSelect
        options={options}
        onValueChange={() => null}
        placeHolder='Select your apps'
        maxCount={3}
      />
    </div>
  )
}
