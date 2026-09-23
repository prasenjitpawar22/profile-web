'use client'

import { weatherFromPreview, type Weather } from '@/lib/weather'
import { useEffect, useState } from 'react'

/** The visitor's current weather, or null until it arrives (or if it can't be found) */
export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    const preview = weatherFromPreview(new URLSearchParams(window.location.search))
    if (preview) {
      setWeather(preview)
      return
    }

    const controller = new AbortController()
    fetch('/api/weather', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Weather | null) => {
        if (data) setWeather(data)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  return weather
}
