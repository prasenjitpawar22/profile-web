'use client'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import React from 'react'

export const Morph = (props: {
  children: React.ReactNode
}): React.ReactNode => {
  return <LayoutGroup {...props} />
}
