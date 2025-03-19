'use client'
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import {
  motion,
  Transition,
  useAnimate,
  useDragControls,
  useMotionValue,
  useTransform,
  Variants,
} from 'framer-motion'
import useMeasure from 'react-use-measure'

const BreakToastContext = createContext<{
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}>({ open: false, setOpen: () => null })

const transition: Transition = {
  duration: 0.4,
  ease: 'easeIn',
}

export const useBreakToastContext = () => {
  const context = useContext(BreakToastContext)

  if (!context) throw 'context error break toast!'
  return context
}

export function BreakToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const dragControls = useDragControls()
  const [scope, animate] = useAnimate()
  const [drawerRef, { height }] = useMeasure()
  const y = useMotionValue(200)

  const transformPage = useTransform(y, [0, 200], ['scale(0.9)', 'scale(1)'])
  const backdropBlur = useTransform(y, [0, 200], ['blur(3px)', 'blur(0px)'])

  const handleClose = async () => {
    animate(scope.current, { opacity: [1, 0] })

    const yStart = typeof y.get() === 'number' ? y.get() : 0

    await animate('#drawer', {
      y: [yStart, height],
    })

    y.set(200)
    setOpen(false)
  }

  return (
    <BreakToastContext.Provider value={{ open, setOpen }}>
      {open && (
        <motion.div
          ref={scope}
          data-open={open}
          transition={transition}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='fixed inset-0 z-[8888]'>
          <motion.div
            onClick={handleClose}
            className='h-screen w-full fixed z-[8888]  '
            style={{
              backdropFilter: backdropBlur,
              WebkitBackdropFilter: backdropBlur,
            }}>
            <motion.div
              id='drawer'
              ref={drawerRef}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 500 }}
              animate={{ y: 0 }}
              drag='y'
              dragControls={dragControls}
              transition={transition}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              style={{ y }}
              onDrag={() => {
                console.log(y.get(), 'y')
              }}
              onDragEnd={() => {
                if (y.get() >= 100) {
                  handleClose()
                }
              }}
              className='absolute bottom-0 h-[75vh] w-full overflow-hidden bg-white rounded-t-3xl z-[9999]'>
              <motion.button
                onPointerDown={(e) => dragControls.start(e)}
                className='w-full inline-flex items-center justify-center bg-slate-50 h-12'></motion.button>
              <div className='flex items-end justify-end p-2'>Hello</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      <motion.div
        transition={transition}
        // variants={variants}
        // animate={open ? { transform: transformPage } : {}}
        style={{ transform: transformPage }}
        // initial={'close'}
      >
        {children}
      </motion.div>
    </BreakToastContext.Provider>
  )
}
