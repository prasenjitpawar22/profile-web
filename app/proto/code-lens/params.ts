// Live-tuned numbers. The engine reads these every frame; the panel mutates them in place.

export type Spec = { key: string; label: string; min: number; max: number; step: number; unit?: string; toggle?: boolean; options?: readonly string[] }

export const MODES = ['Decode', 'Cascade', 'Current'] as const
export type Mode = (typeof MODES)[number]

// In the picker; Plain, Focus and Orbit were set aside once Reticle was chosen
export const STYLES = ['Loupe', 'Reticle'] as const
export type Style = (typeof STYLES)[number] | 'Plain' | 'Focus' | 'Orbit'

export const LENS = {
  radius: 124,
  mag: 1,
  fisheye: 0,
  follow: 0.19,
  glassMag: 1.35,
  glassCurve: 0.1,
  blur: 0.7,
  fringe: 2,
  peak: 18,
  slope: 1.2,
  swell: 0.25,
  outside: 0,
  breathDepth: 0.06,
  breathSpeed: 3.5,
  change: 1,
  breathByToken: 0,
  border: 1,
  chainMode: 1,
  scramble: 170,
  settle: 480,
  stagger: 7,
  chain: 90,
  linger: 700,
  speed: 1,
}

export const DEFAULTS = { ...LENS }

export const SPECS: Spec[] = [
  { key: 'radius', label: 'Circle size', min: 50, max: 180, step: 2, unit: 'px' },
  { key: 'glassMag', label: 'Loupe magnification', min: 1, max: 3, step: 0.05, unit: 'x' },
  { key: 'glassCurve', label: 'Loupe curvature', min: 0, max: 1, step: 0.05 },
  { key: 'peak', label: 'Peak height', min: 0, max: 60, step: 1, unit: 'px' },
  { key: 'slope', label: 'Slope (gentle → sharp)', min: 0.4, max: 4, step: 0.1 },
  { key: 'swell', label: 'Swell at the top', min: 0, max: 1, step: 0.05 },
  { key: 'border', label: 'Glass border', min: 0, max: 6, step: 0.25, unit: 'px' },
  { key: 'blur', label: 'Edge blur', min: 0, max: 6, step: 0.1, unit: 'px' },
  { key: 'fringe', label: 'Colour fringe', min: 0, max: 4, step: 0.1, unit: 'px' },
  { key: 'mag', label: 'Reticle magnification', min: 1, max: 3.5, step: 0.05, unit: 'x' },
  { key: 'fisheye', label: 'Reticle curvature', min: 0, max: 1, step: 0.05 },
  { key: 'follow', label: 'Follow', min: 0.05, max: 1, step: 0.01 },
  { key: 'breathDepth', label: 'Breath depth', min: 0, max: 0.2, step: 0.005 },
  { key: 'breathSpeed', label: 'Breath speed', min: 1, max: 20, step: 0.5, unit: 's' },
  { key: 'change', label: 'Change rate', min: 0, max: 1, step: 0.05 },
  { key: 'breathByToken', label: 'Breathe per token', min: 0, max: 1, step: 1, toggle: true },
  { key: 'outside', label: 'Plain code outside', min: 0, max: 1, step: 1, toggle: true },
  { key: 'chainMode', label: 'Chain', min: 0, max: 2, step: 1, options: MODES },
  { key: 'scramble', label: 'Scramble', min: 0, max: 600, step: 10, unit: 'ms' },
  { key: 'settle', label: 'Colour settle', min: 60, max: 1500, step: 20, unit: 'ms' },
  { key: 'stagger', label: 'Chain step', min: 0, max: 40, step: 1, unit: 'ms' },
  { key: 'chain', label: 'Current speed', min: 10, max: 400, step: 5, unit: ' ch/s' },
  { key: 'linger', label: 'Re-animate after', min: 100, max: 3000, step: 50, unit: 'ms' },
  { key: 'speed', label: 'Speed', min: 0.25, max: 1, step: 0.25, unit: 'x' },
]
