'use client'

import { MultiSelect } from '../multi-select'

const options = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Figma', label: 'Figma' },
  { value: 'Twitter', label: 'Twitter' },
  { value: 'GitHub', label: 'GitHub' },
  { value: 'Framer', label: 'Framer' },
  { value: 'Message', label: 'Message' },
]

export function Test() {
  return (
    <div className='bg-slate-50 py-6 w-full relative h-[350px] gap-4 items-center flex-col px-4 flex rounded-md shadow border'>
      <h2 className='text-lg font-semibold text-stone-700'>Select Your Apps</h2>
      <MultiSelect
        options={options}
        onValueChange={(values) => console.log(values)}
      />
    </div>
  )
}
