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
// import Timer from '@/components/weekend-components/timer'

export default function Page() {
  return (
    <>
      <div className='gap-4 flex flex-col'>
        <h1 className='text-2xl md:text-4xl font-bold text-stone-800'>
          My Weekend Pursuits in Building Innovative Component and learning
          Design
        </h1>
        <p className='text-base text-stone-700 tracking-wide'>
          Welcome to my weekend code showcase! This is where I document all my
          weekend coding experiments and learing.
        </p>
      </div>
      <div className='my-12 flex items-center justify-center flex-col md:justify-start gap-4 flex-wrap overflow-hidden'>
        {/* <InlinePopup /> */}
        {/* <DiscoButton /> as*/}
        <SlideUpButton />
        <DynamicActionBar />
        {/* <SliderThrow /> */}
        {/* <CardsShuffle /> */}
        {/* <NormalAccordion /> */}
        <Timer />
        <GlideRadioButton />
        <AppSelector />
        <MultiSelectExample />
        <div className='relative flex p-2 border bg-slate-50 text-slate-700 rounded-md h-[200px] w-full items-center justify-center'>
          <DrawerComp />
        </div>
        <div className='relative flex p-2 border bg-slate-50 text-slate-700 rounded-md h-[300px] w-full items-center justify-center'>
          <TodoCheckboxExample />
        </div>
        <SearchBoxGooey />
        <NavbarClipPath/>
      </div>
    </>
  )
}
