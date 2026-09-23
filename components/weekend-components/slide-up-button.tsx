import { ChevronsRight } from 'lucide-react'

export default function SlideUpButton() {
  return (
    <button
      type='button'
      className='group relative inline-flex h-12 w-52 items-center justify-center overflow-hidden rounded-full p-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'>
      {/* Spinning conic gradient, clipped to a thin ring by the surface above it */}
      <span className='absolute -inset-[160%] animate-spin-slow bg-[conic-gradient(var(--tw-gradient-stops))] from-purple-600 from-20% via-pink-600 via-50% to-red-600 blur-md motion-reduce:animate-none' />
      <span className='absolute inset-[2px] rounded-full bg-foreground transition-colors duration-300 group-hover:bg-background group-focus-visible:bg-background' />

      {/* Two stacked labels; hovering slides the second one up into view */}
      <span className='relative h-5 overflow-hidden text-sm font-medium'>
        <span className='flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2 group-focus-visible:-translate-y-1/2 motion-reduce:transition-none'>
          <span className='flex h-5 items-center justify-center text-background'>
            Get started for free
          </span>
          <span className='flex h-5 items-center justify-center gap-1 text-foreground'>
            Get started for free <ChevronsRight size={16} />
          </span>
        </span>
      </span>
    </button>
  )
}
