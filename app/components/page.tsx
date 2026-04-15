'use client'

import { DrawerComp } from '@/components/drawer'
import { TodoCheckboxExample } from '@/components/weekend-components/todo-checkbox'
import { AppSelector } from '@/components/weekend-components/dynamic-action-bar/app-selector'
import { DynamicActionBar } from '@/components/weekend-components/dynamic-action-bar/index'
import { GlideRadioButton } from '@/components/weekend-components/glide-radio-button'
import { MultiSelectExample } from '@/components/weekend-components/multi-select'
import SlideUpButton from '@/components/weekend-components/slide-up-button'
import { SearchBoxGooey } from '@/components/weekend-components/search-box-gooey'
import Timer from '@/components/weekend-components/timer'
import { NavbarClipPath } from '@/components/weekend-components/nav-bar-clip-path'
import { DarkModeClipPath } from '@/components/weekend-components/dark-mode-clip-path'
import InlinePopup from '@/components/weekend-components/inline-popup'
import DiscoButton from '@/components/weekend-components/disco-button'
import { SliderThrow } from '@/components/weekend-components/dynamic-action-bar/slider-throw'
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
        {/* <AppSelector /> */}
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
