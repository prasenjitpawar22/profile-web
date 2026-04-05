'use client'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import React from 'react'

export const Morph = (props: {
  children: React.ReactNode
}): React.ReactNode => {
  return <LayoutGroup {...props} />
}
