'use client'

import { useEffect, useRef } from 'react'
import { startCodeLens } from './code-lens-sim'

/** Source hidden as breathing ASCII; a glass loupe reveals it in colour. `source` is the sim's own file. */
export function CodeLens({ source }: { source: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !boxRef.current) return
    return startCodeLens(canvasRef.current, boxRef.current, source)
  }, [source])

  return (
    <div className='relative h-[440px] w-full'>
      {/* Bleeds to the stage's edges, like the Logogram */}
      <div ref={boxRef} className='absolute -inset-6 bg-background'>
        <canvas
          ref={canvasRef}
          role='img'
          aria-label='A page of source code hidden as ASCII texture. A glass loupe follows the cursor and reveals the code underneath in colour.'
          className='block size-full touch-pan-y select-none text-foreground opacity-0 transition-opacity duration-300 ease-out data-[ready]:opacity-100 motion-reduce:duration-150'
        />
      </div>
    </div>
  )
}
