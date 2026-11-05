'use client'

import {
  InputHTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { MistEngine } from './mist-engine'

export interface MistedPasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  /** Time for a fully wiped spot to freeze back over, in ms */
  regrowMs?: number
  /** Radius of the wiped circle, in px */
  brushRadius?: number
  /** Accessible name of the hold-to-reveal control */
  revealLabel?: string
  /** Called when a wipe starts and ends */
  onRevealChange?: (revealing: boolean) => void
}

export const MistedPasswordInput = forwardRef<HTMLInputElement, MistedPasswordInputProps>(
  function MistedPasswordInput(
    {
      value,
      onChange,
      regrowMs = 2000,
      brushRadius = 19,
      revealLabel = 'Hold to wipe the mist and show your password',
      onRevealChange,
      id,
      className,
      autoComplete = 'current-password',
      onScroll,
      onKeyUp,
      onSelect,
      ...rest
    },
    ref,
  ) {
    const autoId = useId()
    const inputId = id ?? autoId
    const wrapRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<MistEngine>()
    const rafRef = useRef(0)
    const runningRef = useRef(false)
    // Keyboard reveal has no pointer to follow, so the spot sweeps the text
    const sweepRef = useRef<number | null>(null)
    const [held, setHeld] = useState(false)

    useImperativeHandle(ref, () => inputRef.current!)

    // The loop only runs while something is moving, then parks itself
    const kick = useCallback(() => {
      if (runningRef.current || !engineRef.current) return
      runningRef.current = true
      let last = performance.now()
      const frame = (t: number) => {
        const e = engineRef.current
        const input = inputRef.current
        if (!e || !input) return
        const dt = Math.max(0, Math.min(48, t - last))
        last = t
        if (input.value !== e.text || input.scrollLeft !== e.scroll) e.setText(input.value, input.scrollLeft)

        if (sweepRef.current !== null) {
          const end = Math.min(e.W - 44, Math.max(e.caretX(e.text.length), e.padX + 40))
          const span = end - e.padX
          const dur = Math.min(1600, Math.max(700, span * 4))
          const p = ((e.now - sweepRef.current) / dur) % 2
          const t2 = p < 1 ? p : 2 - p
          e.move(e.padX + span * (0.5 - Math.cos(t2 * Math.PI) / 2), e.H / 2)
        }

        const active = e.step(dt)
        e.draw()
        if (active) rafRef.current = requestAnimationFrame(frame)
        else runningRef.current = false
      }
      rafRef.current = requestAnimationFrame(frame)
    }, [])

    useEffect(() => {
      const wrap = wrapRef.current!
      const input = inputRef.current!
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
      const e = new MistEngine(canvasRef.current!, {
        radius: brushRadius,
        regrowMs,
        reducedMotion: reduce.matches,
      })
      engineRef.current = e

      const size = () => {
        const r = wrap.getBoundingClientRect()
        e.resize(r.width, r.height)
        kick()
      }
      const font = () => {
        const s = getComputedStyle(input)
        e.setFont(
          `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`,
          parseFloat(s.letterSpacing) || 0,
          parseFloat(s.paddingLeft) || 0,
        )
        kick()
      }
      const motion = () => {
        e.opts.reducedMotion = reduce.matches
      }
      // Mist colours are CSS tokens on the field, so a theme flip repaints them
      const tokens = () => {
        const s = getComputedStyle(wrap)
        const v = (name: string) => s.getPropertyValue(name).trim()
        e.setColors({
          filmTop: v('--mist-film-top'),
          filmBottom: v('--mist-film-bottom'),
          water: v('--mist-water'),
          bead: v('--mist-bead'),
          text: v('--mist-text'),
          textShadow: v('--mist-text-shadow'),
          glow: v('--mist-glow'),
          glowCore: v('--mist-glow-core'),
        })
        kick()
      }
      tokens()
      font()
      size()
      document.fonts.ready.then(font)
      const ro = new ResizeObserver(size)
      ro.observe(wrap)
      const mo = new MutationObserver(tokens)
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      reduce.addEventListener('change', motion)

      return () => {
        cancelAnimationFrame(rafRef.current)
        runningRef.current = false
        engineRef.current = undefined
        ro.disconnect()
        mo.disconnect()
        reduce.removeEventListener('change', motion)
      }
    }, [kick, brushRadius, regrowMs])

    useEffect(kick, [value, kick])

    const local = (ev: React.PointerEvent) => {
      const r = wrapRef.current!.getBoundingClientRect()
      return { x: ev.clientX - r.left, y: ev.clientY - r.top }
    }

    const start = (x: number, y: number) => {
      engineRef.current?.press(x, y)
      setHeld(true)
      onRevealChange?.(true)
      kick()
    }
    const stop = () => {
      sweepRef.current = null
      engineRef.current?.release()
      setHeld(false)
      onRevealChange?.(false)
      kick()
    }

    return (
      <div ref={wrapRef} className={['mist-field', className].filter(Boolean).join(' ')}>
        <canvas ref={canvasRef} className='mist-canvas' aria-hidden='true' />
        <input
          {...rest}
          ref={inputRef}
          id={inputId}
          type='password'
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          onScroll={(ev) => {
            kick()
            onScroll?.(ev)
          }}
          onKeyUp={(ev) => {
            kick()
            onKeyUp?.(ev)
          }}
          onSelect={(ev) => {
            kick()
            onSelect?.(ev)
          }}
          autoComplete={autoComplete}
          spellCheck={false}
          autoCapitalize='off'
          className='mist-input'
        />
        <button
          type='button'
          className='mist-reveal'
          aria-label={revealLabel}
          aria-controls={inputId}
          aria-pressed={held}
          title='Hold and drag across the glass'
          // Keep focus (and the caret) in the input while wiping
          onMouseDown={(ev) => ev.preventDefault()}
          onPointerDown={(ev) => {
            if (ev.button !== 0) return
            ev.preventDefault()
            // Capture so the drag keeps wiping after it leaves the button
            try {
              ev.currentTarget.setPointerCapture(ev.pointerId)
            } catch {}
            const p = local(ev)
            start(p.x, p.y)
          }}
          onPointerMove={(ev) => {
            if (!engineRef.current?.held) return
            const p = local(ev)
            engineRef.current?.move(p.x, p.y)
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={() => held && stop()}
          onKeyDown={(ev) => {
            if ((ev.key === ' ' || ev.key === 'Enter') && !ev.repeat) {
              ev.preventDefault()
              const e = engineRef.current
              if (!e) return
              start(e.padX, e.H / 2)
              sweepRef.current = e.now
            }
          }}
          onKeyUp={(ev) => (ev.key === ' ' || ev.key === 'Enter') && stop()}
          onBlur={() => held && stop()}
          onContextMenu={(ev) => ev.preventDefault()}>
          <Droplet />
        </button>
      </div>
    )
  },
)

/** A drop of water with a glint on its lower left */
export function Droplet({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <g stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M12 3.2c-.4.5-6 6.9-6 11a6 6 0 0 0 12 0c0-4.1-5.6-10.5-6-11Z' />
        <path d='M9.2 14.4a2.9 2.9 0 0 0 2.5 2.9' />
      </g>
    </svg>
  )
}
