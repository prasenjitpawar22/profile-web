'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Command, CommandItem, CommandList } from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useRef } from 'react'
import { useClickOutside } from '@/hooks/use-click-out-hook'
import { cva, VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import Link from 'next/link'

const MotionChevronUp = motion(ChevronUp)
const MotionChevronDown = motion(ChevronDown)

const multiSelectVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof multiSelectVariants> {
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className: string }>
  }[]
  onValueChange: (value: string[]) => void
  defaultValues?: string[]
  placeHolder?: string
  maxCount?: number
  asChild?: boolean
  className?: string
}

const MotionCommandItem = motion(CommandItem)

export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      defaultValues = [],
      onValueChange,
      variant,
      placeHolder = 'Select options',
      maxCount,
      asChild = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] = useState(defaultValues)
    const [isOpen, setIsOpen] = useState(false)
    const popoverRef = useRef(null)

    useClickOutside(popoverRef, () => {
      setIsOpen(false)
    })

    function toggleOption(option: string) {
      const newValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option]
      setSelectedValues(newValues)
      onValueChange(newValues)
    }

    function renderSelectedItems(app: string) {
      return (
        <motion.span
          layout
          key={app}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className='bg-accent font-normal text-accent-foreground rounded-full shadow-sm text-sm px-3 py-1 cursor-default flex items-center'>
          {app}
          <span
            onClick={() => toggleOption(app)}
            className='ml-2 text-xs cursor-pointer text-primary/35 hover:text-primary'>
            &times;
          </span>
        </motion.span>
      )
    }

    return (
      <Popover open={isOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            variant='outline'
            onClick={() => (!selectedValues.length ? setIsOpen(!isOpen) : null)}
            className={cn(
              'rounded-full group flex py-2 gap-2 items-center hover:cursor-pointer',
              selectedValues.length &&
              'hover:bg-background hover:cursor-default',
              className,
            )}>
            {selectedValues.length === 0 ? (
              <span className='text-sm font-normal'> {placeHolder}</span>
            ) : (
              <span className='flex items-center flex-wrap'>
                <span className='flex gap-2 items-center flex-wrap'>
                  <AnimatePresence>
                    {maxCount
                      ? selectedValues
                        .slice(0, maxCount)
                        .map((app) => renderSelectedItems(app))
                      : selectedValues.map((value) =>
                        renderSelectedItems(value),
                      )}
                  </AnimatePresence>
                  {maxCount && selectedValues.length > maxCount ? (
                    <span className='border font-normal text-accent-foreground rounded-full shadow-sm text-xs underline underline-offset-2 px-3 py-1 cursor-default'>
                      {selectedValues.length - maxCount} more
                    </span>
                  ) : null}
                </span>
              </span>
            )}
            {selectedValues.length ? (
              <span
                className='text-xs cursor-pointer hover:text-primary text-primary/35'
                onClick={() => setSelectedValues([])}>
                Clear all
              </span>
            ) : null}
            <span className='border-l h-5'></span>
            <span onClick={() => setIsOpen(!isOpen)}>
              <AnimatePresence>
                {isOpen ? (
                  <MotionChevronUp
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className='h-4 w-4 cursor-pointer group-hover:text-primary text-primary/35'
                  />
                ) : (
                  <MotionChevronDown
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className='h-4 w-4 cursor-pointer group-hover:text-primary text-primary/35'
                  />
                )}
              </AnimatePresence>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent ref={popoverRef} className='p-0' align='center'>
          <Command className='rounded-lg border shadow-md'>
            <CommandList className='overflow-auto'>
              <AnimatePresence initial={false}>
                {options.map((opt, index) => {
                  const selected = selectedValues.includes(opt.value)
                  return (
                    <MotionCommandItem
                      key={index}
                      onSelect={() => {
                        toggleOption(opt.value)
                      }}
                      className={cn(
                        'cursor-pointer w-full flex justify-between',
                        selected && 'bg-accent text-accent-foreground',
                      )}
                      transition={{ duration: 0.2 }}>
                      {opt.label}

                      {selected ? (
                        <span>
                          <Check className='h-4 w-4' />
                        </span>
                      ) : null}
                    </MotionCommandItem>
                  )
                })}
              </AnimatePresence>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

MultiSelect.displayName = 'MultiSelect'

// example
export const MultiSelectExample = () => {
  const options = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Figma', label: 'Figma' },
    { value: 'Twitter', label: 'Twitter' },
    { value: 'GitHub', label: 'GitHub' },
    { value: 'Framer', label: 'Framer' },
    { value: 'Message', label: 'Message' },
  ]

  return (
    <div className='bg-foreground/[.02] py-6 w-full relative h-fit gap-4 items-center flex-col px-4 flex rounded-md shadow border'>
      <p className='text-sm tracking-wide'>
        This component demonstrates a multi-select dropdown menu, allowing users
        to select multiple options with smooth animations and responsive design.
        It is commonly used in applications to let users pick multiple items,
        such as apps or categories, from a predefined list.
        <Link
          href={'https://shadcn-multi-select-component.vercel.app/'}
          target='_blank'
          className='absolute flex cursor-pointer bottom-0 right-0 text-xs'>
          <span className='w-full flex items-center gap-1 rounded-md px-2 mb-2'>
            Inspired from
            <ExternalLink size={12} className='mb-px' />
          </span>
        </Link>
      </p>
      <h2 className='text-sm tracking-wide'>Select Your Apps</h2>
      <MultiSelect
        options={options}
        onValueChange={(values) => null}
        className='max-w-[400px] h-fit rounded-xl'
      />
    </div>
  )
}
