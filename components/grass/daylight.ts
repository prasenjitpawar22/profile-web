import { DEFAULT_SUNRISE, DEFAULT_SUNSET } from '@/lib/weather'

/*
 * Where the sun is, from the visitor's clock and today's sunrise and sunset.
 * The meadow uses it to warm the grass at golden hour, cool it at night, and
 * decide who's awake.
 */

export type Daylight = {
  /** -1 (midnight) … 0 (horizon) … 1 (noon) */
  elevation: number
  /** 0–1: strongest just after sunrise and just before sunset */
  golden: number
  /** 0–1: the pink-violet minutes either side of the horizon */
  twilight: number
  /** 0–1: fully dark once the sun is well below the horizon */
  night: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Sun height for a local time: a half sine across the day and across the night */
export function sunElevation(minutes: number, rise = DEFAULT_SUNRISE, set = DEFAULT_SUNSET) {
  if (minutes >= rise && minutes <= set) return Math.sin((Math.PI * (minutes - rise)) / (set - rise))
  const night = 1440 - (set - rise)
  return -Math.sin((Math.PI * ((minutes - set + 1440) % 1440)) / night)
}

export function daylightAt(minutes: number, rise?: number, set?: number): Daylight {
  const elevation = sunElevation(minutes, rise, set)
  return {
    elevation,
    golden: clamp01(1 - Math.abs(elevation - 0.1) * 7),
    twilight: clamp01(1 - Math.abs(elevation + 0.04) * 9),
    night: clamp01(-elevation * 4 - 0.1),
  }
}

/** Minutes after local midnight, with seconds so the light drifts smoothly */
export function localMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}
