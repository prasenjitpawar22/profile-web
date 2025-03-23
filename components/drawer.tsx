import {
  ComponentPropsWithoutRef,
  createContext,
  Dispatch,
  ElementRef,
  forwardRef,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Root } from '@radix-ui/react-portal'
import {
  useAnimate,
  useDragControls,
  useMotionValue,
  useTransform,
  motion,
  Transition,
  DragControls,
  AnimationScope,
  MotionValue,
  motionValue,
  animate as framerAnimate,
  HTMLMotionProps,
} from 'framer-motion'
import useMeasure from 'react-use-measure'
import { Button } from './ui/button'
import { Slot } from '@radix-ui/react-slot'

interface DrawerContextProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  dragControls: DragControls | undefined
  drawerRef: (element: HTMLElement | null) => void
  height: number
  y: MotionValue<number>
  scope: AnimationScope<any> | undefined
}
export const DrawerContext = createContext<DrawerContextProps>({
  open: true,
  setOpen: () => null,
  dragControls: undefined,
  drawerRef: (element: HTMLOrSVGElement | null) => null,
  height: 0,
  y: motionValue(0),
  scope: undefined,
})

export const useDrawer = () => {
  const context = useContext(DrawerContext)

  if (!context) throw 'context error break toast!'
  return context
}
export const DrawerProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)
  const dragControls = useDragControls()
  const [drawerRef, { height }] = useMeasure()
  const y = useMotionValue(height)
  const [scope] = useAnimate()

  const value = useMemo(
    () => ({ open, setOpen, dragControls, drawerRef, height, y, scope }),
    [open, setOpen, dragControls, drawerRef, height, y, scope],
  )

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  )
}

const transition: Transition = {
  duration: 0.4,
  ease: 'easeIn',
}

export const Drawer = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => {
    const { setOpen } = useDrawer()

    return (
      <DrawerProvider>
        <motion.div
          {...props}
          className='relative'
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
            }
          }}>
          {children}
        </motion.div>
      </DrawerProvider>
    )
  },
)

Drawer.displayName = 'Drawer'

const MotionOverlay = motion(Root)
interface DrawerOverlayProps
  extends ComponentPropsWithoutRef<typeof MotionOverlay> {
  children?: ReactNode
  transformElement?: string
}

export const DrawerOverlay = forwardRef<HTMLDivElement, DrawerOverlayProps>(
  ({ transformElement, ...props }, ref) => {
    const { handleClose } = useContext(DrawerPortalContext)
    const { scope, y, height } = useDrawer()

    const transformPage = useTransform(
      y,
      [0, height],
      ['scale(0.9)', 'scale(1)'],
    )

    const backdropBlur = useTransform(
      y,
      [0, height],
      ['blur(3px)', 'blur(0px)'],
    )

    useEffect(() => {
      if (!transformElement) return // Exit if no element is provided

      const element = document.querySelector(transformElement)
      if (!element || !(element instanceof HTMLElement)) return

      const unsubscribe = transformPage.onChange((value) => {
        element.style.transform = value
      })

      return () => {
        unsubscribe()
        element.style.transform = '' // Reset transform when unmounted
      }
    }, [transformPage, transformElement]) // Added transformElement as a dependency

    return (
      <MotionOverlay
        ref={scope}
        className='fixed inset-0'
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleClose}
        style={{
          backdropFilter: backdropBlur,
          WebkitBackdropFilter: backdropBlur,
        }}
        {...props}
      />
    )
  },
)

DrawerOverlay.displayName = 'DrawerOverlay'

export interface DrawerTiggerProps extends ComponentPropsWithoutRef<'button'> {
  // asChild?: boolean
  asChild?: boolean
}

export const DrawerTigger = forwardRef<ElementRef<'button'>, DrawerTiggerProps>(
  ({ asChild, ...props }, ref) => {
    const { setOpen, open } = useDrawer()
    const Comp = asChild ? Slot : 'button'

    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden' // Disable scrolling
        document.body.style.position = 'relative' // Disable scrolling
      } else {
        document.body.style.overflow = '' // Re-enable scrolling
        document.body.style.position = '' // Disable scrolling
      }

      return () => {
        document.body.style.overflow = '' // Cleanup when component unmounts
      }
    }, [open])

    return (
      <Comp
        ref={ref}
        {...props}
        onClick={() => {
          setOpen(true)
        }}
      />
    )
  },
)

DrawerTigger.displayName = 'DrawerTigger'

const MotionPortal = motion(Root)
interface DrawerPortalProps
  extends ComponentPropsWithoutRef<typeof MotionPortal> {
  children?: ReactNode
}

const DrawerPortalContext = createContext<{ handleClose: () => Promise<void> }>(
  { handleClose: () => Promise.resolve() },
)

export const DrawerPortal = forwardRef<ElementRef<'div'>, DrawerPortalProps>(
  ({ children, ...props }, ref) => {
    const { drawerRef, height, setOpen, y, open, scope } = useDrawer()
    const dragControls = useDragControls()

    const handleClose = useCallback(async () => {
      framerAnimate(scope?.current, { opacity: [1, 0] })

      const yStart = typeof y.get() === 'number' ? y.get() : 0

      await framerAnimate('#drawer', {
        y: [yStart, height],
      })

      y.set(height)
      setOpen(false)
    }, [height, scope])

    return (
      open && (
        <MotionPortal
          id='drawer'
          ref={drawerRef}
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 500 }}
          animate={{ y: 0 }}
          drag='y'
          dragControls={dragControls}
          transition={transition}
          // dragListener={false}
          // style={{ touchAction: 'none' }}
          onPointerDown={(e) => dragControls?.start(e)}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.2, bottom: 1 }}
          style={{ y, touchAction: 'none' }}
          onDragEnd={() => {
            if (y.get() >= 150) {
              handleClose()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClose()
            }
          }}
          className="fixed border-t bottom-0 h-[75vh] w-full overflow-hidden bg-white rounded-t-3xl z-[9999] 
          after:content-[''] after:absolute p-2 after:top-[100%] after:left-0 after:right-0 after:h-[200%] flex flex-col"
          {...props}>
          <DrawerPortalContext.Provider value={{ handleClose }}>
            <motion.span
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => dragControls?.start(e)}
              className='w-full inline-flex items-center justify-center'>
              <span className='h-2 w-14 rounded-full bg-slate-200'></span>
            </motion.span>
            {children}
          </DrawerPortalContext.Provider>
        </MotionPortal>
      )
    )
  },
)

DrawerPortal.displayName = 'DrawerPortal'

export const DrawerContent = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ ...props }, ref) => {
    const { dragControls } = useDrawer()

    return (
      <motion.div
        ref={ref}
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          dragControls?.start(e)
        }}
        {...props}
      />
    )
  },
)

DrawerContent.displayName = 'DrawerContent'

export const DrawerComp = () => {
  return (
    <Drawer>
      <DrawerTigger asChild>
        <Button>Open Drawer</Button>
      </DrawerTigger>
      <DrawerPortal>
        <DrawerOverlay transformElement='main' />
        <DrawerContent className='w-full items-center flex-col flex justify-center overflow-y-auto h-full'>
          <div className='md:max-w-[600px] max-w-80'>
            <p className='text-md mb-2'>React Drawer.</p>
            <p className='text-md text-black/[.5]'>
              This drawer component provides a smooth and interactive way to
              display hidden content or settings. It slides in when triggered,
              offering a clean and modern UI for managing additional options
              without cluttering the main screen. Ideal for menus, filters, or
              secondary actions.
            </p>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}
