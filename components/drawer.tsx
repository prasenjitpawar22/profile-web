'use client'

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
  useReducedMotion,
} from 'motion/react'
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

// Opening is the deliberate move, closing is the response: it snaps
const openTransition: Transition = {
  duration: 0.45,
  ease: [0.32, 0.72, 0, 1],
}
const closeTransition: Transition = {
  duration: 0.25,
  ease: [0.23, 1, 0.32, 1],
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

const MotionOverlay = motion.create(Root)
interface DrawerOverlayProps extends ComponentPropsWithoutRef<
  typeof MotionOverlay
> {
  children?: ReactNode
  transformElement?: string
}

export const DrawerOverlay = forwardRef<HTMLDivElement, DrawerOverlayProps>(
  ({ transformElement, ...props }, ref) => {
    const { handleClose } = useContext(DrawerPortalContext)
    const { scope, y, height } = useDrawer()
    const reduceMotion = useReducedMotion()

    const transformPage = useTransform(
      y,
      [0, height],
      ['scale(0.9)', 'scale(1)'],
    )

    // The blur stays fixed and only its opacity tracks the sheet:
    // re-blurring the whole viewport every frame is far more expensive
    const overlayOpacity = useTransform(y, [0, height], [1, 0])

    useEffect(() => {
      if (!transformElement || reduceMotion) return // No page scale under reduced motion

      const element = document.querySelector(transformElement)
      if (!element || !(element instanceof HTMLElement)) return

      const unsubscribe = transformPage.on('change', (value) => {
        element.style.transform = value
      })

      return () => {
        unsubscribe()
        element.style.transform = '' // Reset transform when unmounted
      }
    }, [transformPage, transformElement, reduceMotion])

    return (
      <MotionOverlay
        ref={scope}
        className='fixed inset-0 backdrop-blur-[3px]'
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleClose}
        style={{ opacity: overlayOpacity }}
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

const MotionPortal = motion.create(Root)
interface DrawerPortalProps extends ComponentPropsWithoutRef<
  typeof MotionPortal
> {
  children?: ReactNode
}

const DrawerPortalContext = createContext<{ handleClose: () => Promise<void> }>(
  { handleClose: () => Promise.resolve() },
)

// The sheet is h-[75vh], so this offset hides it fully below the viewport
const offscreenY = () => window.innerHeight * 0.75

export const DrawerPortal = forwardRef<ElementRef<'div'>, DrawerPortalProps>(
  ({ children, ...props }, ref) => {
    const { drawerRef, setOpen, y, open } = useDrawer()
    const dragControls = useDragControls()
    const reduceMotion = useReducedMotion()

    // Slide in by animating the shared y value itself. The portal attaches its
    // element a frame late, so initial/animate props on it never get to run.
    useEffect(() => {
      if (!open) return
      if (reduceMotion) {
        y.jump(0)
        return
      }
      y.jump(offscreenY())
      const controls = framerAnimate(y, 0, openTransition)
      return () => controls.stop()
    }, [open, y, reduceMotion])

    // Animate the value, not a '#drawer' selector: ids are global and the
    // craft page already uses 'drawer' as an anchor for its demo card.
    // The overlay fades off the same value, so the two can't drift apart.
    const handleClose = useCallback(async () => {
      if (!reduceMotion) await framerAnimate(y, offscreenY(), closeTransition)
      setOpen(false)
    }, [setOpen, y, reduceMotion])

    return (
      open && (
        <MotionPortal
          ref={drawerRef}
          onClick={(e) => e.stopPropagation()}
          drag='y'
          dragControls={dragControls}
          onPointerDown={(e) => dragControls?.start(e)}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.2, bottom: 1 }}
          style={{ y, touchAction: 'none' }}
          onDragEnd={(_, info) => {
            // A quick flick dismisses as well as a long drag
            if (y.get() >= 150 || info.velocity.y > 500) {
              handleClose()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClose()
            }
          }}
          className="border-t bottom-0 fixed bg-background z-50 h-[75vh] w-full after:top-[100%] rounded-t-3xl after:content-[''] after:bg-inherit after:w-full after:h-[90%] after:absolute"
          {...props}>
          <DrawerPortalContext.Provider value={{ handleClose }}>
            <motion.span
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => dragControls?.start(e)}
              className='w-full inline-flex items-center justify-center'>
              <span className='h-2 w-14 rounded-full bg-muted'></span>
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
        <Button variant='outline' className='rounded-full'>Open drawer</Button>
      </DrawerTigger>
      <DrawerPortal>
        <DrawerOverlay transformElement='main' />
        <DrawerContent className='w-full items-center flex-col flex justify-center overflow-y-auto h-full'>
          <div className='md:max-w-[600px] max-w-80'>
            <p className='mb-2 font-medium'>React drawer</p>
            <p className='text-muted-foreground'>
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
