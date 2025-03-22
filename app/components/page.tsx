'use client'

import { Drawer, DrawerComp } from '@/components/drawer'
import { useDrawer } from '@/components/drawer-blur/provider'
import { Button } from '@/components/ui/button'
import { CardsShuffle } from '@/components/weekend-components/cards-shuffle'
import DiscoButton from '@/components/weekend-components/disco-button'
import { AppSelector } from '@/components/weekend-components/dynamic-action-bar/app-selector'
import { DynamicActionBar } from '@/components/weekend-components/dynamic-action-bar/index'
import { SliderThrow } from '@/components/weekend-components/dynamic-action-bar/slider-throw'
import { GlideRadioButton } from '@/components/weekend-components/glide-radio-button'
import InlinePopup from '@/components/weekend-components/inline-popup'
import { MultiSelectExample } from '@/components/weekend-components/multi-select'
import { NormalAccordion } from '@/components/weekend-components/normal-accordion'
import SlideUpButton from '@/components/weekend-components/slide-up-button'
import { Test } from '@/components/weekend-components/testing/test'
import Timer from '@/components/weekend-components/timer'

export default function Page() {
  const { open, setOpen } = useDrawer()

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
      <div className='my-12 flex items-center justify-center md:justify-start gap-4 flex-wrap overflow-hidden'>
        <InlinePopup />
        <DiscoButton />
        <SlideUpButton />
        <DynamicActionBar />
        <SliderThrow />
        <CardsShuffle />
        <NormalAccordion />
        <Timer />
        <GlideRadioButton />
        <AppSelector />
        <MultiSelectExample />
        <div className='bg-slate-50 py-6 w-full relative h-fit gap-4 items-center flex-col px-4 flex rounded-md shadow border'>
          <DrawerComp />
        </div>
      </div>
    </>
  )
}
