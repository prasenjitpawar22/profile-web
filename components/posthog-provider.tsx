'use client'

import * as React from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Skip in dev / when no key is set, so local visits don't pollute the stats
    if (!key || posthog.__loaded) return
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      // App router navigations are client-side, so track pageviews on history changes
      capture_pageview: 'history_change',
      capture_pageleave: true,
      person_profiles: 'identified_only',
    })
  }, [])

  // One delegated listener instead of wiring handlers into server components:
  // links carry data-track="event" plus data-track-* props, and demo stages
  // carry data-track-demo so we learn which craft components people play with
  React.useEffect(() => {
    if (!key) return
    const played = new Set<string>()

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return

      const link = target.closest<HTMLElement>('[data-track]')
      if (link) {
        const { track, ...rest } = link.dataset
        const props: Record<string, string> = {}
        for (const [k, v] of Object.entries(rest)) {
          if (k.startsWith('track') && v) {
            props[k.slice(5).toLowerCase()] = v
          }
        }
        posthog.capture(track!, props)
        return
      }

      // Count the first interaction with each demo per visit, not every click
      const slug = target.closest<HTMLElement>('[data-track-demo]')?.dataset
        .trackDemo
      if (slug && !played.has(slug)) {
        played.add(slug)
        posthog.capture('component_interacted', { slug })
      }
    }

    document.addEventListener('click', onClick, { capture: true })
    return () =>
      document.removeEventListener('click', onClick, {
        capture: true,
      })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
