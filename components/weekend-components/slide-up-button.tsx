import { ChevronsRight } from 'lucide-react'

const label = 'Get started for free'
const ease = 'ease-[cubic-bezier(0.22,1,0.36,1)]'

export default function SlideUpButton() {
  return (
    <button
      type='button'
      className={`group relative inline-flex h-12 w-52 items-center justify-center overflow-hidden rounded-full p-[2px] transition-transform duration-150 ${ease} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] motion-reduce:transition-none`}>
      {/*
        Spinning conic gradient, clipped to a thin ring by the surface above it.
        It has to be a square wider than the button's diagonal, or the corners
        sweep past and leave gaps mid-spin. Percentage margins resolve against
        the button's width, so -75% on both axes centres a 150%-wide square.
      */}
      <span
        aria-hidden
        className='absolute left-1/2 top-1/2 -ml-[75%] -mt-[75%] aspect-square w-[150%] animate-spin-slow bg-[conic-gradient(var(--tw-gradient-stops))] from-purple-600 from-20% via-pink-600 via-50% to-red-600 blur-md motion-reduce:animate-none'
      />
      <span
        aria-hidden
        className={`absolute inset-[2px] rounded-full bg-foreground transition-colors duration-300 ${ease} group-hover:bg-background group-focus-visible:bg-background`}
      />

      {/*
        Two stacked labels; hovering slides the second one up into view.
        clip-path clips only vertically, so the chevron can hang off the
        right edge without nudging the text off-centre.
      */}
      <span className='relative h-5 text-sm font-medium [clip-path:inset(0_-2rem)]'>
        <span
          className={`flex flex-col transition-transform duration-300 ${ease} group-hover:-translate-y-1/2 group-focus-visible:-translate-y-1/2 motion-reduce:transition-none`}>
          <span className='flex h-5 items-center justify-center text-background'>
            {label}
          </span>
          <span
            aria-hidden
            className='relative flex h-5 items-center justify-center text-foreground'>
            {label}
            <ChevronsRight
              size={16}
              className={`absolute left-full ml-1 -translate-x-2 opacity-0 transition duration-300 ${ease} group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none`}
            />
          </span>
        </span>
      </span>
    </button>
  )
}
