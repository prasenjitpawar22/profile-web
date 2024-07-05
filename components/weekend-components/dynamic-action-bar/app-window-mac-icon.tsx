import { motion } from 'framer-motion'

export const AppWindowMacIcon = () => {
  return (
    <motion.svg
      variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='lucide lucide-app-window-mac'>
      <rect width='20' height='16' x='2' y='4' rx='2' />
      <motion.path variants={{ default: { pathLength: 1, opacity: 1 }, hover: { pathLength: 0, opacity: 0 } }} d='M6 8h.01' />
      <motion.path variants={{ default: { pathLength: 1, opacity: 1 }, hover: { pathLength: 0, opacity: 0 } }} d='M10 8h.01' />
      <motion.path variants={{ default: { pathLength: 1, opacity: 1 }, hover: { pathLength: 0, opacity: 0 } }} d='M14 8h.01' />
    </motion.svg>
  )
}
