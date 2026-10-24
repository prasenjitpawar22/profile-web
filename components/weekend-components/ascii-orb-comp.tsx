"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useSpring } from "motion/react";
import {Cell, Field, RAMP, sampleCell} from './ascii-orb'

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

type AsciiOrbProps = {
  state?: OrbState;
  /** 0–1 audio level. Swells the orb with the voice. */
  level?: number;
  /** Grid resolution. More columns = finer glyphs, heavier draw. */
  cols?: number;
  /** Tailwind size classes, e.g. "size-80" */
  className?: string;
};

// speed: time multiplier, wobble: silhouette movement
const STATES = {
  idle: { speed: 1, wobble: 1 },
  listening: { speed: 1.3, wobble: 1.4 },
  thinking: { speed: 2.6, wobble: 0.8 },
  speaking: { speed: 1.8, wobble: 1.8 },
} as const;

const LIGHT = { x: -0.45, y: -0.55 };

export function AsciiOrb({
  state = "idle",
  level = 0,
  cols = 52,
  className = "size-72 sm:size-96",
}: AsciiOrbProps) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // motion springs smooth every state change; the draw loop just reads .get()
  const speed = useSpring(1, { stiffness: 60, damping: 18 });
  const wobble = useSpring(1, { stiffness: 80, damping: 16 });
  const pulse = useSpring(0, { stiffness: 260, damping: 18, mass: 0.6 });
  const lx = useSpring(LIGHT.x, { stiffness: 90, damping: 20 });
  const ly = useSpring(LIGHT.y, { stiffness: 90, damping: 20 });

  useEffect(() => {
    speed.set(STATES[state].speed);
    wobble.set(STATES[state].wobble);
  }, [state, speed, wobble]);

  useEffect(() => {
    pulse.set(level);
  }, [level, pulse]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const cell: Cell = { ch: " ", r: 0, g: 0, b: 0, a: 1 };
    const field: Field = { wobble: 1, pulse: 0, lx: LIGHT.x, ly: LIGHT.y };
    let size = 0;
    let t = reduce ? 2 : 0;
    let last = 0;
    let raf = 0;

    const draw = () => {
      field.wobble = wobble.get();
      field.pulse = pulse.get();
      field.lx = lx.get();
      field.ly = ly.get();

      ctx.clearRect(0, 0, size, size);
      const step = size / cols;
      ctx.font = `600 ${step * 1.15}px ui-monospace, "Geist Mono", SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let j = 0; j < cols; j++) {
        for (let i = 0; i < cols; i++) {
          if (!sampleCell(i, j, cols, t, field, cell)) continue;
          ctx.globalAlpha = cell.a;
          ctx.fillStyle = `rgb(${cell.r | 0},${cell.g | 0},${cell.b | 0})`;
          ctx.fillText(cell.ch, (i + 0.5) * step, (j + 0.55) * step);
        }
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = wrap.getBoundingClientRect().width;
      canvas.width = canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw();
    };

    // ~30fps reads as "terminal", and is cheaper
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      t += dt * speed.get();
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [cols, reduce, speed, wobble, pulse, lx, ly]);

  // the light follows the pointer
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    lx.set(((e.clientX - b.left) / b.width - 0.5) * 2);
    ly.set(((e.clientY - b.top) / b.height - 0.5) * 2);
  };
  const onLeave = () => {
    lx.set(LIGHT.x);
    ly.set(LIGHT.y);
  };

  return (
    <motion.div
      ref={wrapRef}
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 90, damping: 18 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {/* soft bloom behind the glyphs */}
      <motion.div
        aria-hidden
        className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle,#ff7ad1_0%,#c9a8ff_55%,transparent_75%)] blur-3xl"
        animate={reduce ? { opacity: 0.25 } : { opacity: [0.2, 0.36, 0.2], scale: [1, 1.06, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`ASCII orb, ${state}`}
        className="relative size-full"
      />
    </motion.div>
  );
}