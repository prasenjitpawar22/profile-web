"use client"

import { useRef, useEffect } from "react"

const COUNT = 2000
const SIZE = 300
const REACH = 70      // NEW: how far from the cursor dots feel it
const STRENGTH = 3    // NEW: how hard they get shoved
const BACK = 0.93     // NEW: how slowly they drift home (closer to 1 = slower)

export function MovingOrbs() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = SIZE * dpr
        canvas.height = SIZE * dpr
        ctx.scale(dpr, dpr)

        const cx = SIZE / 2
        const cy = SIZE / 2
        const R = SIZE * 0.4

        // only draw inside the circle
        // (dots pushed outside this circle get hidden, so make it a bit bigger if you want to see them fly out)
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.clip()

        const angle = new Float32Array(COUNT)
        const baseR = new Float32Array(COUNT)
        const speed = new Float32Array(COUNT)
        const phase = new Float32Array(COUNT)
        const ox = new Float32Array(COUNT) // NEW: each dot's push offset (x)
        const oy = new Float32Array(COUNT) // NEW: each dot's push offset (y)

        for (let i = 0; i < COUNT; i++) {
            angle[i] = Math.random() * Math.PI * 2
            baseR[i] = Math.sqrt(Math.random()) * R
            speed[i] = (Math.random() - 0.5) * 0.01
            phase[i] = Math.random() * Math.PI * 2
        }

        let t = 0
        let raf = 0
        let mx = -9999 // NEW: cursor position, far away until the mouse enters
        let my = -9999

        function onMove(e: MouseEvent) {
            // NEW: cursor position relative to the canvas (not the whole page)
            const rect = canvas!.getBoundingClientRect()
            mx = e.clientX - rect.left
            my = e.clientY - rect.top
        }
        function onLeave() {
            // NEW: move the cursor "away" so nothing is pushed
            mx = -9999
            my = -9999
        }
        window.addEventListener("mousemove", onMove)
        canvas.addEventListener("mouseleave", onLeave)

        function animate() {
            t += 0.016
            const isDark = document.documentElement.classList.contains("dark")
            const base = isDark ? [255, 255, 255] : [0, 0, 0]  // resting color
            const pushed = isDark ? [90, 150, 255] : [40, 100, 255] // blue when pushed

            ctx!.clearRect(0, 0, SIZE, SIZE)

            for (let i = 0; i < COUNT; i++) {
                angle[i] += speed[i]
                const r = baseR[i] + Math.sin(t * 1.5 + phase[i]) * 6

                // CHANGED: add the push offset to the normal orbit position
                const x = cx + r * Math.cos(angle[i]) + ox[i]
                const y = cy + r * Math.sin(angle[i]) + oy[i]

                // NEW: vector from the cursor to this dot
                const dx = x - mx
                const dy = y - my
                const dist = Math.sqrt(dx * dx + dy * dy)

                // NEW: if the cursor is close, shove the dot directly away
                if (dist < REACH && dist > 0.01) {
                    const force = (1 - dist / REACH) * STRENGTH
                    ox[i] += (dx / dist) * force
                    oy[i] += (dy / dist) * force
                }

                // NEW: let the offset fade so the dot drifts back home
                ox[i] *= BACK
                oy[i] *= BACK
                // how far is this dot from home? 0 = home, bigger = pushed
                const push = Math.hypot(ox[i], oy[i])

                // squash that into 0..1  (20 = the push distance that counts as "fully blue", tune it)
                const k = Math.min(push / 20, 1)

                // blend black -> blue
                const r2 = base[0] + (pushed[0] - base[0]) * k
                const g2 = base[1] + (pushed[1] - base[1]) * k
                const b2 = base[2] + (pushed[2] - base[2]) * k
                ctx!.fillStyle = `rgb(${r2}, ${g2}, ${b2})`
                ctx!.fillRect(x, y, 1.2, 1.2)
            }

            raf = requestAnimationFrame(animate)
        }
        animate()

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("mousemove", onMove)
            canvas.removeEventListener("mouseleave", onLeave)
        }
    }, [])

    return <canvas ref={canvasRef} className="w-[300px] h-[300px]" />
}