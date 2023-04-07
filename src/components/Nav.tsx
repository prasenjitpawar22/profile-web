import React, { useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ subsets: ['latin'] })

const Nav = () => {
    const { scrollY } = useScroll()

    const [hidden, setHidden] = useState(false)
    const list = ['Link one', 'Link two', 'Link three']

    const variants = {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: -25 }
    };


    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest < scrollY.getPrevious()) {
            setHidden(false)
        } else if (latest > 100 && latest > scrollY.getPrevious()) {
            setHidden(true)
        }
    })

    return (
        <motion.div
            variants={variants}
            transition={{ ease: [0.1, 0.25, 0.3, 1], duration: 0.6 }}
            animate={hidden ? 'hidden' : 'visible'}
            className={`fixed flex justify-between ${montserrat.className} items-center w-full py-2 px-4 h-fit backdrop-blur-sm`}>
            <h1 className='text-4xl bold text-secondary'>
                P
            </h1>
            <ul className='flex gap-2 items-center justify-end px-4'>
                {list.map((l, key) =>
                    <li key={key} className='px-2 text-secondary'>{l}</li>
                )}
            </ul>
        </motion.div>
    )
}

export default Nav