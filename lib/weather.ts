export type Condition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm'

export type Weather = {
  condition: Condition
  /** Human label, e.g. "Light rain" */
  label: string
  /** 0.6 light, 1 normal, 1.5 heavy — scales rain and snow density */
  intensity: number
  isDay: boolean
  /** km/h */
  windSpeed: number
  temperature?: number
  unit?: 'C' | 'F'
  city?: string
  preview?: boolean
}

export const CONDITIONS: Condition[] = ['clear', 'cloudy', 'rain', 'snow', 'storm']

export const DEFAULT_WEATHER: Weather = {
  condition: 'clear',
  label: 'Clear',
  intensity: 1,
  isDay: true,
  windSpeed: 8,
}

// WMO weather interpretation codes, as returned by Open-Meteo
const CODES: Record<number, [Condition, string, number]> = {
  0: ['clear', 'Clear sky', 1],
  1: ['clear', 'Mainly clear', 1],
  2: ['cloudy', 'Partly cloudy', 1],
  3: ['cloudy', 'Overcast', 1],
  45: ['cloudy', 'Fog', 1],
  48: ['cloudy', 'Fog', 1],
  51: ['rain', 'Light drizzle', 0.6],
  53: ['rain', 'Drizzle', 0.6],
  55: ['rain', 'Heavy drizzle', 1],
  56: ['rain', 'Freezing drizzle', 0.6],
  57: ['rain', 'Freezing drizzle', 1],
  61: ['rain', 'Light rain', 0.6],
  63: ['rain', 'Rain', 1],
  65: ['rain', 'Heavy rain', 1.5],
  66: ['rain', 'Freezing rain', 0.6],
  67: ['rain', 'Freezing rain', 1.5],
  71: ['snow', 'Light snow', 0.6],
  73: ['snow', 'Snow', 1],
  75: ['snow', 'Heavy snow', 1.5],
  77: ['snow', 'Snow grains', 0.6],
  80: ['rain', 'Light showers', 0.6],
  81: ['rain', 'Showers', 1],
  82: ['rain', 'Heavy showers', 1.5],
  85: ['snow', 'Snow showers', 0.6],
  86: ['snow', 'Heavy snow showers', 1.5],
  95: ['storm', 'Thunderstorm', 1.2],
  96: ['storm', 'Thunderstorm with hail', 1.5],
  99: ['storm', 'Thunderstorm with hail', 1.5],
}

export function describeWeatherCode(code: number) {
  const [condition, label, intensity] = CODES[code] ?? CODES[0]
  return { condition, label, intensity }
}

const PREVIEW_LABELS: Record<Condition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Thunderstorm',
}

/** `?weather=snow&time=night` lets anyone preview a state without waiting for it */
export function weatherFromPreview(params: URLSearchParams): Weather | null {
  const condition = params.get('weather') as Condition | null
  const time = params.get('time')
  const valid = condition && CONDITIONS.includes(condition)
  if (!valid && time !== 'night' && time !== 'day') return null

  const c: Condition = valid ? condition : 'clear'
  return {
    ...DEFAULT_WEATHER,
    condition: c,
    label: PREVIEW_LABELS[c],
    windSpeed: c === 'storm' ? 35 : c === 'rain' ? 16 : 8,
    isDay: time !== 'night',
    preview: true,
  }
}
