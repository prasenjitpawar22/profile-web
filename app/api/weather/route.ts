import { describeWeatherCode, type Weather } from '@/lib/weather'
import { NextRequest, NextResponse } from 'next/server'

const noStore = { headers: { 'Cache-Control': 'no-store' } }

// Vercel attaches the visitor's approximate location to every request, so no
// permission prompt is needed. Locally these headers are absent and we return null.
export async function GET(req: NextRequest) {
  const lat = req.headers.get('x-vercel-ip-latitude')
  const lon = req.headers.get('x-vercel-ip-longitude')
  if (!lat || !lon) return NextResponse.json(null, noStore)

  const cityHeader = req.headers.get('x-vercel-ip-city')
  const city = cityHeader ? decodeURIComponent(cityHeader) : undefined
  const useFahrenheit = req.headers.get('x-vercel-ip-country') === 'US'

  // Rounded to ~10 km: kinder to privacy, and nearby visitors share a cached forecast
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', Number(lat).toFixed(1))
  url.searchParams.set('longitude', Number(lon).toFixed(1))
  url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m,is_day')
  url.searchParams.set('wind_speed_unit', 'kmh')
  url.searchParams.set('timezone', 'auto')

  try {
    const res = await fetch(url, { next: { revalidate: 900 } })
    if (!res.ok) return NextResponse.json(null, noStore)

    const { current } = await res.json()
    const celsius: number = current.temperature_2m

    const weather: Weather = {
      ...describeWeatherCode(current.weather_code),
      isDay: current.is_day === 1,
      windSpeed: current.wind_speed_10m,
      temperature: Math.round(useFahrenheit ? (celsius * 9) / 5 + 32 : celsius),
      unit: useFahrenheit ? 'F' : 'C',
      city,
    }

    return NextResponse.json(weather, {
      headers: { 'Cache-Control': 'private, max-age=900' },
    })
  } catch {
    return NextResponse.json(null, noStore)
  }
}
