'use client'
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  motion,
  Transition,
  useAnimate,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import useMeasure from 'react-use-measure'

const BreakToastContext = createContext<{
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}>({ open: false, setOpen: () => null })

const transition: Transition = {
  duration: .2,
  ease: 'easeIn',
}

export const useDrawer = () => {
  const context = useContext(BreakToastContext)

  if (!context) throw 'context error break toast!'
  return context
}

export function BreakToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const dragControls = useDragControls()
  const [scope, animate] = useAnimate()
  const [drawerRef, { height }] = useMeasure()
  const y = useMotionValue(height)

  const transformPage = useTransform(y, [0, height], ['scale(0.9)', 'scale(1)'])
  const backdropBlur = useTransform(y, [0, height], ['blur(3px)', 'blur(0px)'])

  const handleClose = async () => {
    animate(scope.current, { opacity: [1, 0] })

    const yStart = typeof y.get() === 'number' ? y.get() : 0

    await animate('#drawer', {
      y: [yStart, height],
    })

    y.set(height)
    setOpen(false)
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = ""; // Re-enable scrolling
    }

    return () => {
      document.body.style.overflow = ""; // Cleanup when component unmounts
    };
  }, [open]);

  return (
    <BreakToastContext.Provider value={{ open, setOpen }}>
      {open && (
        <motion.div
          ref={scope}
          data-open={open}
          className='fixed inset-0 z-[8888] overflow-hidden'>
          <motion.div
            onClick={handleClose}
            className='h-screen w-full fixed z-[8888]'
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
              dragConstraints={{ top: 0, bottom:0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              style={{ y }}
              onDragEnd={() => {
                if (y.get() >= 150) {
                  handleClose()
                }
              }}
              className='absolute py-3 px-4 shadow-2xl border bottom-0 h-[75vh] w-full overflow-hidden bg-white rounded-t-3xl z-[9999]'>
              <motion.button
              style={{ touchAction: "none" }}
                onPointerDown={(e) => dragControls.start(e)}
                className='w-full inline-flex items-center justify-center'>
                <span className='h-2 w-14 rounded-full bg-slate-200'></span>
              </motion.button>
              <div className='flex items-center justify-center p-2 text-center'></div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      <motion.div
        transition={transition}
        style={{ transform: transformPage}}
      >
        {children}
      </motion.div>
    </BreakToastContext.Provider>
  )
}
