import { useState } from 'react'

export default function ColorMixLab() {
  const [color1, setColor1] = useState('#1e3a8a') // Midnight blue
  const [color2, setColor2] = useState('#06b6d4') // Bright cyan
  const [mixPercentage, setMixPercentage] = useState(50)
  const [colorSpace, setColorSpace] = useState('oklab')
  const [hueMethod, setHueMethod] = useState('shorter hue')

  const isPolar = colorSpace === 'oklch' || colorSpace === 'hsl'
  const hueString = isPolar ? ` ${hueMethod}` : ''

  // 1. Compute the custom color-mix rule
  const mixedColorCSS = `color-mix(in ${colorSpace}${hueString}, ${color1} ${mixPercentage}%, ${color2})`

  // 2. Feed the dynamic color-mix string straight into the contrast-color function!
  const autonomousTextStyle = {
    backgroundColor: mixedColorCSS,
    color: `contrast-color(${mixedColorCSS})`,
  }

  const generatedCode = `.dynamic-card {
  background-color: ${mixedColorCSS};
  /* Automatically outputs black or white text depending on contrast math */
  color: contrast-color(${mixedColorCSS});
}`

  return (
    <div className='min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center gap-8 font-sans'>
      <header className='text-center max-w-xl'>
        <h1 className='text-3xl font-extrabold tracking-tight'>
          React & Tailwind{' '}
          <code className='text-emerald-400 text-2xl font-mono'>
            contrast-color()
          </code>{' '}
          Lab
        </h1>
        <p className='text-slate-400 mt-2'>
          Watch the text color automatically flip between pure black and pure
          white based on browser accessibility math.
        </p>
      </header>

      <main className='grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl'>
        {/* Control Parameters */}
        <section className='bg-slate-800 p-6 rounded-xl shadow-xl flex flex-col gap-5'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='flex flex-col gap-2'>
              <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                Base Color 1
              </label>
              <input
                type='color'
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                className='w-full h-12 rounded-lg cursor-pointer bg-transparent border border-slate-700'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                Base Color 2
              </label>
              <input
                type='color'
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                className='w-full h-12 rounded-lg cursor-pointer bg-transparent border border-slate-700'
              />
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider'>
              <label>Mixing Proportion</label>
              <span className='text-emerald-400 font-mono text-sm'>
                {mixPercentage}%
              </span>
            </div>
            <input
              type='range'
              min='0'
              max='100'
              value={mixPercentage}
              onChange={(e) => setMixPercentage(Number(e.target.value))}
              className='w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
              Color Space
            </label>
            <select
              value={colorSpace}
              onChange={(e) => setColorSpace(e.target.value)}
              className='w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white'>
              <option value='oklab'>oklab (Perceptually Uniform)</option>
              <option value='oklch'>oklch (Polar)</option>
              <option value='srgb'>srgb (Standard)</option>
            </select>
          </div>
        </section>

        {/* Live Preview Arena */}
        <section className='flex flex-col gap-4'>
          {/* Card applying automated color and background natively */}
          <div
            style={autonomousTextStyle}
            className='flex-grow min-h-[220px] rounded-xl flex flex-col justify-center items-center p-8 shadow-2xl text-center transition-all duration-75'>
            <h3 className='text-2xl font-black tracking-tight mb-2'>
              Self-Correcting Text
            </h3>
            <p className='text-sm max-w-xs font-medium opacity-90'>
              The browser reads the mixed background color and chooses the
              accessible text option.
            </p>
          </div>

          {/* Active CSS String display */}
          <div className='bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto'>
            <pre>{generatedCode}</pre>
          </div>
        </section>
      </main>
    </div>
  )
}
