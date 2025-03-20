// import { AnimationEventHandler, ComponentPropsWithoutRef, createContext, Dispatch, ElementRef, forwardRef, HTMLAttributes, PropsWithChildren, ReactNode, SetStateAction, useContext, useEffect, useState } from "react";
// import { Root, Portal, PortalProps } from '@radix-ui/react-portal'
// import { useAnimate, useDragControls, useMotionValue, useTransform, motion, Transition, DragControls, AnimationScope, MotionValue, motionValue } from "framer-motion";
// import useMeasure from "react-use-measure";

// interface DrawerContextProps {
//     open: boolean,
//     setOpen: Dispatch<SetStateAction<boolean>>
//     dragControls: DragControls | undefined
//     drawerRef: (element: HTMLElement | null) => void
//     height: number
//     y: MotionValue<number>
//     // scope: AnimationScope<any> | null
//     // drawerRef: (element: HTMLOrSVGElement | null) => void | null
//     // y: MotionValue<number>

// }
// export const DrawerContext = createContext<DrawerContextProps>
//     ({
//         open: false, setOpen: () => null, dragControls: undefined,
//         drawerRef: (element: HTMLOrSVGElement | null) => null,
//         height: 0,
//         y: motionValue(0),
//     })

// export const useDrawer = () => {
//     const context = useContext(DrawerContext)

//     if (!context) throw 'context error break toast!'
//     return context
// }
// export const DrawerProvider = ({ children }: { children: ReactNode }) => {
//     const [open, setOpen] = useState(false)
//     const dragControls = useDragControls()
//     const [drawerRef, { height }] = useMeasure()
//     const y = useMotionValue(height)

//     return <DrawerContext.Provider value={{ open, setOpen, dragControls, drawerRef, height, y }} >
//         {children}
//     </DrawerContext.Provider>
// }

// const transition: Transition = {
//     duration: 0.4,
//     ease: 'easeIn',
// }

// const MotionPortalRoot = motion(Root)

// export const Drawer = forwardRef<ElementRef<typeof MotionPortalRoot>, ComponentPropsWithoutRef<typeof MotionPortalRoot>>(({ ...props }, ref) => {
//     const [scope, animate] = useAnimate()
//     return <MotionPortalRoot ref={scope} {...props} />
// })


// export interface DrawerOverlayProps extends AnimationEventHandler<HTMLDivElement> {
//     backdropBlur: string,
//     handleClose: () => null
// }

// export const DrawerOverlay = forwardRef<HTMLDivElement, DrawerOverlayProps>(({ handleClose, backdropBlur, ...props }) => {
//     return <motion.div
//         onClick={handleClose}
//         style={{
//             backdropFilter: backdropBlur,
//             WebkitBackdropFilter: backdropBlur,
//         }}
//         {...props}
//     />
// })

// export interface DrawerTiggerProps extends ComponentPropsWithoutRef<'button'> { }

// export const DrawerTigger = forwardRef<ElementRef<'button'>, DrawerTiggerProps>(({ ...props }, ref) => {
//     return <button {...props} />
// })

// export interface DrawerPortalProps extends AnimationEventHandler<'div'> {
//     drawerRef: (element: HTMLElement | null) => void
//     dragControls: DragControls
//     handleClose: () => null
//     y: MotionValue
// }

// const MotionPortal = motion(Portal)
// export const DrawerPortal = forwardRef<ElementRef<'div'>, DrawerPortalProps>(({ drawerRef, dragControls, handleClose, y, ...props }, ref) => {
//     const handleClose
//     const {dragControls, drawerRef, height, open, setOpen, y, } = useDrawer()
//     return <MotionPortal
//         id='drawer'
//         ref={drawerRef}
//         onClick={(e) => e.stopPropagation()}
//         initial={{ y: 500 }}
//         animate={{ y: 0 }}
//         drag='y'
//         dragControls={dragControls}
//         transition={transition}
//         dragListener={false}
//         dragConstraints={{ top: 0, bottom: 0 }}
//         dragElastic={{ top: 0, bottom: 1 }}
//         style={{ y }}
//         onDragEnd={() => {
//             if (y.get() >= 150) {
//                 handleClose()
//             }
//         }}
//         {...props}
//     />
// })

// // root  .
// // trigger .
// // portal .
// // overlay .

// export const DrawerComp = forwardRef(({ ...props }, ref) => {
//     const { open, setOpen, dragControls, drawerRef, height, y} = useDrawer()
//     // const { open, setOpen } = useDrawer()

//     // const dragControls = useDragControls()
//     const [scope, animate] = useAnimate()
//     // const [drawerRef, { height }] = useMeasure()
//     // const y = useMotionValue(height)

//     // // animate the page 
//     const transformPage = useTransform(y, [0, height], ['scale(0.9)', 'scale(1)'])
//     const backdropBlur = useTransform(y, [0, height], ['blur(3px)', 'blur(0px)'])


//     useEffect(() => {
//         if (open) {
//             document.body.style.overflow = "hidden"; // Disable scrolling
//         } else {
//             document.body.style.overflow = ""; // Re-enable scrolling
//         }

//         return () => {
//             document.body.style.overflow = ""; // Cleanup when component unmounts
//         };
//     }, [open]);

//     const handleClose = async () => {
//         animate(scope.current, { opacity: [1, 0] })

//         const yStart = typeof y.get() === 'number' ? y.get() : 0

//         await animate('#drawer', {
//             y: [yStart, height],
//         })

//         y.set(height)
//         setOpen(false)
//     }

//     return <Drawer>
//         <DrawerTigger>Click</DrawerTigger>
//         <DrawerPortal >

//         </DrawerPortal>
//     </Drawer>

//     return open && (
//         <motion.div
//             ref={scope}
//             data-open={open}
//             transition={transition}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className='fixed inset-0 z-[8888] overflow-hidden'>
//             <motion.div
//                 onClick={handleClose}
//                 className='h-screen w-full fixed z-[8888]'
//                 style={{
//                     backdropFilter: backdropBlur,
//                     WebkitBackdropFilter: backdropBlur,
//                 }}>
//                 <motion.div
//                     id='drawer'
//                     ref={drawerRef}
//                     onClick={(e) => e.stopPropagation()}
//                     initial={{ y: 100 }}
//                     animate={{ y: 0 }}
//                     drag='y'
//                     dragControls={dragControls}
//                     transition={transition}
//                     dragListener={false}
//                     dragConstraints={{ top: 0, bottom: 0 }}
//                     dragElastic={{ top: 0, bottom: 1 }}
//                     style={{ y }}
//                     onDragEnd={() => {
//                         if (y.get() >= 150) {
//                             handleClose()
//                         }
//                     }}
//                     className='absolute shadow-2xl border bottom-0 h-[75vh] w-full overflow-hidden bg-white rounded-t-3xl z-[9999]'>
//                     <motion.button
//                         style={{ touchAction: "none" }}
//                         onPointerDown={(e) => dragControls?.start(e)}
//                         className='w-full inline-flex items-center justify-center'>
//                         <span className='h-2 w-14 rounded-full bg-slate-200'></span>
//                     </motion.button>
//                     <div className='flex items-end justify-end p-2'>{children}</div>
//                 </motion.div>
//             </motion.div>
//         </motion.div>
//     )
// })