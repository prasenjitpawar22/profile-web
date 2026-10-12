'use client'

import { useEffect, useState } from 'react'

/**
 * Whether the viewer is on an Apple platform, for showing ⌘ instead of Ctrl.
 * Starts as `true` so the server render and first paint agree, then corrects
 * itself after mount.
 */
export function useIsMac() {
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ??
      navigator.platform ??
      navigator.userAgent
    setIsMac(/mac|iphone|ipad|ipod/i.test(platform))
  }, [])

  return isMac
}
