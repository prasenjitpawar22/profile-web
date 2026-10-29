'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The surface a demo sits on. CSS animations inside it pause while it's
 * scrolled out of view, so looping demos don't burn frames nobody sees.
 */
export function DemoStage({
  slug,
  className,
  children,
}: {
  slug: string
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [offscreen, setOffscreen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      // A little early, so a loop is already running when it scrolls in
      { rootMargin: '100px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-track-demo={slug}
      data-offscreen={offscreen || undefined}
      className={className}>
      {children}
    </div>
  )
}
