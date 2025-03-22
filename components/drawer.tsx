import { ComponentPropsWithoutRef, createContext, Dispatch, ElementRef, forwardRef, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
import { Root, } from '@radix-ui/react-portal'
import { useAnimate, useDragControls, useMotionValue, useTransform, motion, Transition, DragControls, AnimationScope, MotionValue, motionValue, animate as framerAnimate } from "framer-motion";
import useMeasure from "react-use-measure";
import { Button } from "./ui/button";
import { Slot } from "@radix-ui/react-slot";

interface DrawerContextProps {
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>
    dragControls: DragControls | undefined
    drawerRef: (element: HTMLElement | null) => void
    height: number
    y: MotionValue<number>
    scope: AnimationScope<any> | undefined
}
export const DrawerContext = createContext<DrawerContextProps>
    ({
        open: true, setOpen: () => null, dragControls: undefined,
        drawerRef: (element: HTMLOrSVGElement | null) => null,
        height: 0,
        y: motionValue(0),
        scope: undefined
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

    return <DrawerContext.Provider value={{ open, setOpen, dragControls, drawerRef, height, y, scope }} >
        {children}
    </DrawerContext.Provider>
}

const transition: Transition = {
    duration: 0.4,
    ease: 'easeIn',
}

export const Drawer = forwardRef<ElementRef<'div'>, ComponentPropsWithoutRef<'div'>>(({ children, ...props }, ref) => {
    return <DrawerProvider>
        <div {...props} className="relative"  >
            {children}
        </div>
    </DrawerProvider>
})

Drawer.displayName = "Drawer"

const MotionOverlay = motion(Root)
// // extends AnimationEventHandler<'div'> { }
interface DrawerOverlayProps extends ComponentPropsWithoutRef<typeof MotionOverlay> {
    children?: ReactNode;
}

export const DrawerOverlay = forwardRef<HTMLDivElement, DrawerOverlayProps>(({ ...props }, ref) => {
    const { handleClose } = useContext(DrawerPortalContext)
    const { scope, y, height } = useDrawer()


    const transformPage = useTransform(y, [0, height], ['scale(0.9)', 'scale(1)'])
    const backdropBlur = useTransform(y, [0, height], ['blur(3px)', 'blur(0px)'])

    return <MotionOverlay
        ref={scope}
        className="fixed inset-0"
        onClick={handleClose}
        style={{
            backdropFilter: backdropBlur,
            WebkitBackdropFilter: backdropBlur,
        }}
        {...props}
    />
})

DrawerOverlay.displayName = "DrawerOverlay"

export interface DrawerTiggerProps extends ComponentPropsWithoutRef<'button'> {
    // asChild?: boolean
    asChild?: boolean

}

export const DrawerTigger = forwardRef<ElementRef<'button'>, DrawerTiggerProps>(({  asChild, ...props }, ref) => {
    const { setOpen, open } = useDrawer()
    const Comp = asChild ? Slot : "button"

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden"; // Disable scrolling
            document.body.style.position = "relative"; // Disable scrolling
        } else {
            document.body.style.overflow = ""; // Re-enable scrolling
            document.body.style.position = ""; // Disable scrolling
        }

        return () => {
            document.body.style.overflow = ""; // Cleanup when component unmounts
        };
    }, [open]);

    return <Comp ref={ref} {...props} onClick={() => {
        setOpen(true)
    }}/>
})

DrawerTigger.displayName = "DrawerTigger"

const MotionPortal = motion(Root)
interface DrawerPortalProps extends ComponentPropsWithoutRef<typeof MotionPortal> {
    children?: ReactNode;
}

const DrawerPortalContext = createContext<{ handleClose: () => Promise<void> }>({ handleClose: () => Promise.resolve() })

export const DrawerPortal = forwardRef<ElementRef<'div'>, DrawerPortalProps>(({ children, ...props }, ref) => {
    const { drawerRef, height, setOpen, y, open, scope } = useDrawer()
    const dragControls = useDragControls()

    const handleClose = async () => {
        framerAnimate(scope?.current, { opacity: [1, 0] })

        const yStart = typeof y.get() === 'number' ? y.get() : 0

        await framerAnimate('#drawer', {
            y: [yStart, height],
        })

        y.set(height)
        setOpen(false)
    }

    return open && (
        <MotionPortal
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
            dragElastic={{ top: 0, bottom: 1 }}
            style={{ y }}
            onDragEnd={() => {
                if (y.get() >= 150) {
                    handleClose()
                }
            }}
            className='absolute shadow-2xl border bottom-0 h-[75vh] w-full overflow-hidden bg-white rounded-t-3xl z-[9999]'
            {...props}>
            <DrawerPortalContext.Provider value={{ handleClose }}>
                <motion.span
                    style={{ touchAction: "none" }}
                    onPointerDown={(e) => dragControls?.start(e)}
                    className='w-full inline-flex items-center justify-center'>
                    <span className='h-2 w-14 rounded-full bg-slate-200'></span>
                </motion.span>
                {children}
            </DrawerPortalContext.Provider>
        </MotionPortal>
    )
})

DrawerPortal.displayName = "DrawerPortal"

export const DrawerContent = forwardRef<ElementRef<'div'>, ComponentPropsWithoutRef<'div'>>(({ ...props }, ref) => {
    return <div
        ref={ref}
        {...props}
    ></div>
})

DrawerContent.displayName = "DrawerContent"

export const DrawerComp = () => {
    return <Drawer>
        <DrawerTigger asChild >
            <Button>Open Drawer</Button>
        </DrawerTigger>
        <DrawerPortal>
            <DrawerOverlay />
            <DrawerContent className="text-center">
            </DrawerContent>
        </DrawerPortal>
    </Drawer>

}