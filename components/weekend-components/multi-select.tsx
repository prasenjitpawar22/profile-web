'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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

  const labelFor = (value: string) =>
    options.find((o) => o.value === value)?.label ?? value
  const visible = maxCount ? selectedValues.slice(0, maxCount) : selectedValues
  const hidden = selectedValues.length - visible.length

  return (
    // Radix handles Escape and outside clicks through onOpenChange
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex min-h-10 w-full items-center gap-2 rounded-2xl border bg-background px-2 py-1.5 text-sm shadow-sm',
            className,
          )}>
          <div className='flex flex-1 flex-wrap items-center gap-1.5'>
            {selectedValues.length === 0 ? (
              <button
                type='button'
                onClick={() => setIsOpen(true)}
                className='flex-1 rounded-md px-1 text-left text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                {placeHolder}
              </button>
            ) : (
              <AnimatePresence initial={false} mode='popLayout'>
                {visible.map((value) => (
                  <motion.span
                    layout
                    key={value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className='flex items-center gap-1 rounded-full bg-accent py-0.5 pl-2.5 pr-1 text-accent-foreground'>
                    {labelFor(value)}
                    <button
                      type='button'
                      aria-label={`Remove ${labelFor(value)}`}
                      onClick={() => toggleOption(value)}
                      className='grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                      <X className='h-3 w-3' />
                    </button>
                  </motion.span>
                ))}
                {hidden > 0 ? (
                  <motion.span
                    layout
                    key='more'
                    className='rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground'>
                    +{hidden} more
                  </motion.span>
                ) : null}
              </AnimatePresence>
            )}
          </div>

          {selectedValues.length ? (
            <button
              type='button'
              onClick={() => update([])}
              className='shrink-0 rounded-md px-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              Clear all
            </button>
          ) : null}
          <span className='h-5 shrink-0 border-l' />
          <PopoverTrigger asChild>
            <button
              type='button'
              aria-label={isOpen ? 'Close options' : 'Open options'}
              className='grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
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
                  whileTap={{ scale: 0.98 }}>
                  {opt.label}
                  <Check
                    className={cn(
                      'h-4 w-4 transition-opacity',
                      selected ? 'opacity-100' : 'opacity-0',
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
