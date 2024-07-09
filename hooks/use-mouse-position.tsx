'use client'

import { MutableRefObject, RefAttributes, useEffect, useState } from 'react'

export const useMousePosition = (
  ref: MutableRefObject<HTMLElement> | MutableRefObject<null>,
) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const updateMousePostion = (e: MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    const { clientX, clientY } = e

    if (rect)
      setMousePosition({ x: clientX - rect?.left, y: clientY - rect.top })
  }

  useEffect(() => {
    ref.current?.addEventListener('mousemove', updateMousePostion)
    return () => {
      ref.current?.removeEventListener('mousemove', updateMousePostion)
    }
  }, [ref])

  return mousePosition
}
