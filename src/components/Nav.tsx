import React, { useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Montserrat } from 'next/font/google'
import { AiOutlineMenu } from 'react-icons/ai'
import { RxCross1 } from 'react-icons/rx'

const montserrat = Montserrat({ subsets: ['latin'] })

enum Type {
    about,
    contact,
    experience,
    work,
    blog
}
interface Props {
    aboutRef: React.MutableRefObject<HTMLDivElement | null>
    experienceRef?: React.MutableRefObject<HTMLDivElement | null>
    workRef?: React.MutableRefObject<HTMLDivElement | null>
    contactRef?: React.MutableRefObject<HTMLDivElement | null>
}

const Nav = (props: Props) => {

    const { aboutRef, experienceRef, workRef, contactRef } = props

    const { scrollY } = useScroll()

    const [hidden, setHidden] = useState(false)
    const [sideBarState, setSideBarState] = useState(false)

    const list = [{ text: 'about', type: Type.about },
    { text: 'experience', type: Type.experience },
    { text: 'work', type: Type.work },
    { text: 'blog', type: Type.blog },
    { text: 'contact', type: Type.contact }]

    const variants = {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: -25 }
    };

    const sidebarVariants = {
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 1, x: 600 + 20 }
    }

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest < scrollY.getPrevious()) {
            setHidden(false)
        } else if (latest > 100 && latest > scrollY.getPrevious()) {
            setHidden(true)
        }
    })

    const handleNavClick = (type: Type | string) => {
        setSideBarState(false)
        if (type === Type.about) { aboutRef.current?.scrollIntoView({ behavior: "smooth" }) }
        if (type === Type.experience && experienceRef) { experienceRef.current?.scrollIntoView({ behavior: "smooth" }) }
        if (type === Type.work && workRef) { workRef.current?.scrollIntoView({ behavior: "smooth" }) }
        if (type === Type.contact && contactRef) { contactRef.current?.scrollIntoView({ behavior: "smooth" }) }

        if (type === Type.blog) window.open('https://techiee.hashnode.dev/', '_blank');

    }

    return (
        <>
            <motion.div
                variants={variants}
                transition={{ ease: [0.1, 0.25, 0.3, 1], duration: 0.6 }}
                animate={hidden ? 'hidden' : 'visible'}
                className={`fixed flex justify-between ${montserrat.className} items-center w-full py-2 px-4 h-fit backdrop-blur-sm z-50`}>
                <h1 className='text-4xl bold text-secondary'>

                </h1>
                <ul className='flex gap-2 xs:hidden md:flex items-center justify-end px-4'>
                    {list.map((l, key) =>
                        <li key={key}
                            onClick={() => handleNavClick(l.type)}
                            className='cursor-pointer px-2 text-secondary capitalize'>{l.text}</li>
                    )}
                </ul>

                <span onClick={() => setSideBarState(!sideBarState)}
                    className='text-secondary md:hidden cursor-pointer'>
                    <AiOutlineMenu size={25} />
                </span>
            </motion.div>

            <motion.div
                transition={{ duration: .8 }}
                variants={sidebarVariants}
                animate={sideBarState ? 'visible' : 'hidden'}
                className='fixed right-0 w-2/4 flex justify-center items-center
            min-h-screen bg-[#1f263a] z-50 shadow-2xl md:hidden'>
                <span onClick={() => setSideBarState(false)}
                    className='cursor-pointer absolute top-0 right-0 p-4 text-secondary'>
                    <RxCross1 />
                </span>
                <ul className='flex flex-col gap-4 items-center 
                    justify-between px-4'>
                    {list.map((l, key) =>
                        <li key={key}
                            onClick={() => handleNavClick(l.type)}
                            className='px-2 text-secondary capitalize hover:cursor-pointer'>{l.text}</li>
                    )}
                </ul>
            </motion.div>
        </>
    )
}

export default Nav