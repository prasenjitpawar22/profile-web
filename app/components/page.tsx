'use client'

import { DrawerComp } from '@/components/drawer'
import { DarkModeClipPath } from '@/components/weekend-components/dark-mode-clip-path'
import { DynamicActionBar } from '@/components/weekend-components/dynamic-action-bar'
import { GlideRadioButton } from '@/components/weekend-components/glide-radio-button'
import { MultiSelectExample } from '@/components/weekend-components/multi-select'
import { NavbarClipPath } from '@/components/weekend-components/nav-bar-clip-path'
import { SearchBoxGooey } from '@/components/weekend-components/search-box-gooey'
import SlideUpButton from '@/components/weekend-components/slide-up-button'
import Timer from '@/components/weekend-components/timer'
import { TodoCheckboxExample } from '@/components/weekend-components/todo-checkbox'
// import Timer from '@/components/weekend-components/timer'

export default function Page() {
  return (
    <>
      <div className='gap-4 flex flex-col'>
        <h1 className='text-2xl md:text-4xl font-bold'>
          My Weekend Pursuits in Building Innovative Component and learning
          Design
        </h1>
        <p className='text-base tracking-wide'>
          Welcome to my weekend code showcase! This is where I document all my
          weekend coding experiments and learing.
        </p>
      </div>
      <div className='my-12 flex items-center justify-center flex-col md:justify-start gap-4 flex-wrap overflow-hidden'>
        <SlideUpButton />
        <DynamicActionBar />
        <Timer />
        <GlideRadioButton />
        <MultiSelectExample />
        <div className='relative flex p-2 border bg-foreground/[.02]  rounded-md h-[200px] w-full items-center justify-center'>
          <DrawerComp />
        </div>
        <div className='relative flex p-2 border bg-foreground/[.02] rounded-md h-[300px] w-full items-center justify-center'>
          <TodoCheckboxExample />
        </div>
        <SearchBoxGooey />
        <NavbarClipPath />
        <DarkModeClipPath />
      </div>
    </>
  )
}
