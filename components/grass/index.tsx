'use client'

import { useWeather } from '@/hooks/use-weather'
import { cn } from '@/lib/utils'
import { DEFAULT_WEATHER, type Weather } from '@/lib/weather'
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { createGrassScene, SKY, type GrassScene } from './scene'

const HINT_KEY = 'grass-touched'

export function Grass({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const weather = useWeather()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<GrassScene>()
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let touchedBefore = false
    try {
      touchedBefore = localStorage.getItem(HINT_KEY) === '1'
    } catch {}
    // With reduced motion the grass stays still, so there is nothing to touch
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!touchedBefore && !reducedMotion) setShowHint(true)

    const scene = createGrassScene(canvas, {
      onTouch: () => {
        setShowHint(false)
        try {
          localStorage.setItem(HINT_KEY, '1')
        } catch {}
      },
    })
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = undefined
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
  }, [resolvedTheme])

  // Without real weather (local dev, or the lookup failed) still honour the
  // visitor's own clock, so night — and the fireflies — show up after dark
  useEffect(() => {
    const hour = new Date().getHours()
    sceneRef.current?.setWeather(
      weather ?? { ...DEFAULT_WEATHER, isDay: hour >= 6 && hour < 19 },
    )
  }, [weather])

  return (
    <div className={cn('relative', className)}>
      <div className='page flex h-5 items-center justify-between gap-4 text-xs text-muted-foreground'>
        <WeatherCaption weather={weather} />
        <span
          aria-hidden
          className={cn(
            'shrink-0 transition-opacity duration-700',
            showHint ? 'opacity-100' : 'opacity-0',
          )}>
          touch some grass
        </span>
      </div>

      <div className='relative h-36 touch-pan-y md:h-44'>
        {/* Taller than the field: rain and snow fade in through the extra band on top */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className='fade-x pointer-events-none absolute inset-x-0 bottom-0 w-full'
          style={{ height: `calc(100% + ${SKY}px)` }}
        />
      </div>
    </div>
  )
}

function WeatherCaption({ weather }: { weather: Weather | null }) {
  if (!weather) return <span />

  const Icon =
    weather.condition === 'storm'
      ? CloudLightning
      : weather.condition === 'snow'
        ? CloudSnow
        : weather.condition === 'rain'
          ? CloudRain
          : weather.condition === 'cloudy'
            ? Cloud
            : weather.isDay
              ? Sun
              : Moon

  const temperature =
    weather.temperature !== undefined
      ? `${weather.temperature}°${weather.unit ?? 'C'}`
      : null
  const place = weather.city ? `${weather.label} in ${weather.city}` : weather.label
  const text = [temperature, place].filter(Boolean).join(' · ')

  return (
    <span className='inline-flex min-w-0 items-center gap-1.5 duration-700 animate-in fade-in'>
      <Icon className='h-3.5 w-3.5 shrink-0' aria-hidden />
      <span className='truncate'>
        {text}
        {weather.preview ? ' (preview)' : null}
      </span>
    </span>
  )
}
