'use client'

import { useEffect, useRef, useState } from 'react'
import { DEFAULTS, LENS, SPECS, type Spec } from './params'

const values = LENS as Record<string, number>
const defaults = DEFAULTS as Record<string, number>

function format(spec: Spec, v: number) {
  if (spec.options) return spec.options[v] ?? String(v)
  if (spec.toggle) return v ? 'on' : 'off'
  const places = spec.step >= 1 ? 0 : spec.step >= 0.1 ? 1 : spec.step >= 0.01 ? 2 : 3
  return `${v.toFixed(places)}${spec.unit ?? ''}`
}

export function Controls({ name }: { name: string }) {
  const [, setTick] = useState(0)
  const refresh = () => setTick((n) => n + 1)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const copyTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setOpen(window.innerWidth >= 1200)
    return () => clearTimeout(copyTimer.current)
  }, [])

  const copy = async () => {
    const text = `${name}: ${SPECS.map((s) => `${s.key} ${format(s, values[s.key])}`).join(' · ')}`
    let result: 'done' | 'failed' = 'done'
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      result = 'failed'
    }
    setCopied(result)
    clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied('idle'), 1600)
  }

  return (
    <aside className='tune' aria-label='Animation controls'>
      <button type='button' className='tune-toggle' aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>Controls</span>
        <span aria-hidden='true'>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className='tune-body'>
          <section>
            <h2 className='tune-title'>Circle · {name}</h2>
            {SPECS.map((spec) => {
              const v = values[spec.key]
              if (spec.options)
                return (
                  <label key={spec.key} className='tune-row tune-toggle-row'>
                    <span>{spec.label}</span>
                    <select
                      className='tune-select'
                      value={v}
                      onChange={(e) => {
                        values[spec.key] = Number(e.target.value)
                        refresh()
                      }}>
                      {spec.options.map((o, i) => (
                        <option key={o} value={i}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              if (spec.toggle)
                return (
                  <label key={spec.key} className='tune-row tune-toggle-row'>
                    <span>{spec.label}</span>
                    <input
                      type='checkbox'
                      checked={v === 1}
                      onChange={(e) => {
                        values[spec.key] = e.target.checked ? 1 : 0
                        refresh()
                      }}
                    />
                  </label>
                )
              return (
                <label key={spec.key} className='tune-row'>
                  <span className='tune-row-head'>
                    <span>{spec.label}</span>
                    <output data-changed={v !== defaults[spec.key] || undefined}>{format(spec, v)}</output>
                  </span>
                  <input
                    type='range'
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={v}
                    onChange={(e) => {
                      values[spec.key] = Number(e.target.value)
                      refresh()
                    }}
                  />
                </label>
              )
            })}
          </section>
          <div className='tune-actions'>
            <button
              type='button'
              onClick={() => {
                Object.assign(values, defaults)
                refresh()
              }}>
              Reset
            </button>
            <button type='button' className='tune-copy' onClick={copy}>
              {copied === 'done' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy values'}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
