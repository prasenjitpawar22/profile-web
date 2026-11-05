'use client'

import { RefObject, useEffect } from 'react'

// The rim lens: an SVG displacement filter appended to a surface's
// backdrop-filter, so the scene bends at the edge like a thick glass slab.
// Red is the sideways bend, green the vertical one, 128 is none. Only a rim
// bends; the middle stays flat. Optionally, three passes split it by colour.

const NS = 'http://www.w3.org/2000/svg'
const maps = new Map<string, { url: string; max: number }>()

/** Displacement map for a rounded rect, built once per size and radius */
function lensMap(w: number, h: number, r: number) {
  const key = `${w}x${h}r${r}`
  const hit = maps.get(key)
  if (hit) return hit

  const rim = Math.max(4, Math.min(44, Math.min(w, h) / 3.5))
  const max = 1.1 * rim
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const cx = w / 2
  const cy = h / 2
  const bx = w / 2 - r
  const by = h / 2 - r

  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - cx
      const py = y + 0.5 - cy
      const qx = Math.abs(px) - bx
      const qy = Math.abs(py) - by
      // Signed distance to the rounded edge, and the outward normal
      let sdf: number
      let nx = 0
      let ny = 0
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(qx, qy)
        sdf = l - r
        nx = (qx / l) * Math.sign(px)
        ny = (qy / l) * Math.sign(py)
      } else if (qx > qy) {
        sdf = qx - r
        nx = Math.sign(px)
      } else {
        sdf = qy - r
        ny = Math.sign(py)
      }
      const d = -sdf
      let ox = 0
      let oy = 0
      if (d > 0 && d < rim) {
        // Hard at the edge, where the scene folds back, easing to nothing
        const m = max * Math.pow(1 - d / rim, 2.6)
        ox = -nx * m
        oy = -ny * m
      }
      const i = (y * w + x) * 4
      img.data[i] = 128 + (ox / max) * 127
      img.data[i + 1] = 128 + (oy / max) * 127
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  const out = { url: c.toDataURL(), max }
  maps.set(key, out)
  return out
}

const keep = (ch: 'r' | 'g' | 'b') =>
  ({
    r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
    g: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
    b: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
  })[ch]

function filterMarkup(id: string, w: number, h: number, url: string, max: number, split: number) {
  const scale = 2 * max
  const pass = (ch: 'r' | 'g' | 'b', k: number) => `
    <feDisplacementMap in="SourceGraphic" in2="map" scale="${scale * k}" xChannelSelector="R" yChannelSelector="G" result="d${ch}"/>
    <feColorMatrix in="d${ch}" type="matrix" values="${keep(ch)}" result="${ch}"/>`
  return `<filter id="${id}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feImage href="${url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
    ${
      // The colour split costs three passes a frame; without it, one
      split > 0
        ? `${pass('r', 1 + split)}${pass('g', 1)}${pass('b', 1 - split)}
    <feBlend in="r" in2="g" mode="screen" result="rg"/>
    <feBlend in="rg" in2="b" mode="screen"/>`
        : `<feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>`
    }
  </filter>`
}

/**
 * Bends the backdrop at the rim of `ref`'s element. `split` (0.15 looks
 * good) adds a colour fringe at three times the cost. Chromium only: elsewhere
 * (and with reduced transparency) the surface keeps its CSS-only glass.
 * The element's base filter is read from --glass-filter so themes still apply.
 */
export function useLiquidLens(ref: RefObject<HTMLElement>, split = 0) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const firefox = /firefox/i.test(navigator.userAgent)
    const plain = window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    if (firefox || plain || !CSS.supports('backdrop-filter', 'url(#a)')) return

    const id = `lens-${Math.random().toString(36).slice(2, 9)}`
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.setAttribute('aria-hidden', 'true')
    svg.style.position = 'absolute'
    document.body.appendChild(svg)

    let disposed = false
    let last = ''
    const build = async () => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      // Too small to read as a slab
      if (w < 32 || h < 32) return
      const r = Math.round(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0)
      const key = `${w}x${h}r${r}`
      if (key === last) return
      last = key
      const { url, max } = lensMap(w, h, r)
      // Point the surface at the filter only once the map has decoded, or it
      // draws for a frame without its blur
      const img = new Image()
      img.src = url
      await img.decode().catch(() => {})
      if (disposed || key !== last) return
      svg.innerHTML = filterMarkup(id, w, h, url, max, split)
      const value = `var(--glass-filter) url(#${id})`
      el.style.setProperty('-webkit-backdrop-filter', value)
      el.style.setProperty('backdrop-filter', value)
    }
    build()
    const ro = new ResizeObserver(() => build())
    ro.observe(el)

    return () => {
      disposed = true
      ro.disconnect()
      svg.remove()
      el.style.removeProperty('-webkit-backdrop-filter')
      el.style.removeProperty('backdrop-filter')
    }
  }, [ref, split])
}
