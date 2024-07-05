import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export const NotePadIcon = () => {
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
      className={cn('lucide lucide-notepad-text', 'group-hover:text-white')}>
      <path d='M8 2v4' />
      <path d='M12 2v4' />
      <path className='w-0' d='M16 2v4' />
      <rect width='16' height='18' x='4' y='4' rx='2' />
      <motion.path variants={{ default: { opacity: 0, pathLength: 0 }, hover: { opacity: 1, pathLength: 1 } }} d='M8 10h6' />
      <motion.path variants={{ default: { opacity: 0, pathLength: 0 }, hover: { opacity: 1, pathLength: 1 } }} d='M8 14h8' />
      <motion.path variants={{ default: { opacity: 0, pathLength: 0 }, hover: { opacity: 1, pathLength: 1 } }} d='M8 18h5' />
    </motion.svg>
  )
}
