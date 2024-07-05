import { motion } from 'framer-motion'

export const CodeIcon = () => {
  return (
    <motion.svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='lucide lucide-code-xml'
      variants={{ default: { opacity: 1 }, hover: { opacity: 1 } }}>
      <motion.path d='m18 16 4-4-4-4' />
      <motion.path d='m6 8-4 4 4 4' />
      <motion.path variants={{ default: { pathLength: 1, opacity: 1 }, hover: { pathLength: 0, opacity: 0 } }} d='m14.5 4-5 16' />
    </motion.svg>
  )
}
