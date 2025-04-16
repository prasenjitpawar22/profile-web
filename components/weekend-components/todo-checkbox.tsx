"use client"

import { motion, useAnimate, } from 'framer-motion'
import { Input } from '../ui/input'
import { useRef, useState } from 'react'


const todos = ['this is a todo list', 'will this ever be completed?', 'haha, never', 'not funny!']

export function TodoCheckboxExample() {
    return <div>
        {todos.map((todo, i) =>
        (<TodoCheckbox backgroundId={`${i}`}
            borderId={`border-${i}`} lineId={`line-${i}`}
            text={todo} textId={`text-${i}`} tickId={`tick-${i}`} key={i} />))}
    </div>
}

export const TodoCheckbox = ({ lineId, tickId, backgroundId, borderId, textId, text }: {
    lineId: string, tickId: string, backgroundId: string, borderId: string, textId: string, text: string
}) => {
    const [checked, setChecked] = useState(false)
    const [scope, animate] = useAnimate()
    const isAnimating = useRef(false)

     
    async function handleCheck() {
        if (isAnimating.current) return // 
        isAnimating.current = true  
        if (checked) {
            animate('#line', { width: '0', opacity: 1 })
            await animate('#text', { opacity: 1, x: [3, 2, 0, -1, 0] })
            animate('#tick', { pathLength: .2, })
            await animate('#tick', { opacity: 0 })
            await animate('#background', { opacity: 0, scale: [1, 0] })
            await animate('#border', { pathLength: 2 })
        }
        else {
            await animate('#border', { pathLength: 0 })
            await animate('#background', { opacity: 1, scale: [0, 1] })
            animate('#tick', { opacity: 1 })
            await animate('#tick', { pathLength: [0, 1], })
            animate('#line', { width: '100%', opacity: .4 })
            await animate('#text', { opacity: .4, x: [3, 2, 0, -1, 0] })
        }
        setChecked((prev) => !prev)
        isAnimating.current = false  
    }

    return <div onClick={handleCheck} className={`flex items-center cursor-pointer gap-2 hover:bg-gray-100 p-2 rounded-md w-fit`} ref={scope}>
        <motion.div  className='relative isolate w-fit h-fit cursor-pointer'>
            <motion.svg className={'w-4 h-4'} width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.path id={'background'} initial={{opacity: 0, scale: 0}} opacity="0.4" d="M3 22V8C3 5.23858 5.23858 3 8 3H22C24.7614 3 27 5.23858 27 8V22C27 24.7614 24.7614 27 22 27H8C5.23858 27 3 24.7614 3 22Z" fill="#0811EC" stroke="#0811EC" stroke-width="5" />
                <motion.defs>
                    <motion.clipPath id="clip0_0_1">
                        <motion.rect width="16" height="12" fill="white" transform="translate(8 9)" />
                    </motion.clipPath>
                </motion.defs>
            </motion.svg>
            <motion.svg className='w-4 h-4 absolute top-0' width="30" height="30" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.path id={'border'} initial={{pathLength: 1}} d="M1 20V6C1 3.23858 3.23858 1 6 1H20C22.7614 1 25 3.23858 25 6V20C25 22.7614 22.7614 25 20 25H6C3.23858 25 1 22.7614 1 20Z" stroke="#A4A4A4" stroke-width="2" />
            </motion.svg>
            <motion.svg
                className={'absolute top-0 scale-75 text-white'}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
            >
                <motion.path
                    id={'tick'}
                    initial={{pathLength: 0, opacity: 0}}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                />
            </motion.svg>
            <Input checked={checked} className='hidden' type='checkbox' />
        </motion.div>
        <motion.p id='text' className='text-black relative'>
            {text}
            <motion.span id={'line'} initial={{width:'0'}} className="absolute left-0 top-1/2 h-[2px] bg-gray-500" />
        </motion.p>
    </div>
}