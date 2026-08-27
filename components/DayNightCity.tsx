"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Moon, Sun } from "lucide-react";

type Scene = {
  at: number;
  time: string;
  label: string;
  brightness: number;
  saturate: number;
  contrast: number;
  warm: number;
  cool: number;
  lights: number;
};

type NumKey = Exclude<keyof Scene, "at" | "time" | "label">;

const SCENES: Scene[] = [
  { at: 0, time: "9:30 AM", label: "Day", brightness: 1.12, saturate: 0.96, contrast: 1.04, warm: 0, cool: 0, lights: 0 },
  { at: 45, time: "4:30 PM", label: "Golden hour", brightness: 1.0, saturate: 1.12, contrast: 0.98, warm: 0.22, cool: 0, lights: 0 },
  { at: 72, time: "6:45 PM", label: "Dusk", brightness: 0.68, saturate: 0.9, contrast: 1.1, warm: 0.14, cool: 0.18, lights: 0.35 },
  { at: 100, time: "9:30 PM", label: "Night", brightness: 0.5, saturate: 0.82, contrast: 1.16, warm: 0, cool: 0.42, lights: 1 },
];

function interp(p: number, key: NumKey): number {
  for (let i = 0; i < SCENES.length - 1; i++) {
    const a = SCENES[i];
    const b = SCENES[i + 1];
    if (p <= b.at) {
      const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
      return a[key] + (b[key] - a[key]) * t;
    }
  }
  return SCENES[SCENES.length - 1][key];
}

const LIGHT_DOTS =
  "radial-gradient(circle at 30% 40%, rgba(255,214,150,0.9) 0.8%, transparent 2%)," +
  "radial-gradient(circle at 48% 30%, rgba(255,214,150,0.9) 0.8%, transparent 2%)," +
  "radial-gradient(circle at 62% 44%, rgba(255,214,150,0.9) 0.8%, transparent 2%)," +
  "radial-gradient(circle at 72% 34%, rgba(255,214,150,0.9) 0.8%, transparent 2%)," +
  "radial-gradient(circle at 40% 58%, rgba(255,214,150,0.85) 0.8%, transparent 2%)," +
  "radial-gradient(circle at 55% 64%, rgba(255,214,150,0.85) 0.8%, transparent 2%)," +
  "radial-gradient(circle at 80% 52%, rgba(255,214,150,0.85) 0.8%, transparent 2%)";

export function DayNightCity({ image, kicker = "Outlook · day to night", intro = "The skyline is the decoration. Drag the scrubber and watch the tower change with the light." }: { image?: string; kicker?: string; intro?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(72);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  const filter = [
    `brightness(${interp(pos, "brightness")})`,
    `saturate(${interp(pos, "saturate")})`,
    `contrast(${interp(pos, "contrast")})`,
    "sepia(0.04)",
  ].join(" ");
  const warm = interp(pos, "warm");
  const cool = interp(pos, "cool");
  const lights = interp(pos, "lights");

  const scene = SCENES.reduce((prev, cur) =>
    Math.abs(cur.at - pos) < Math.abs(prev.at - pos) ? cur : prev
  );
  const isDay = pos <= 50;

  return (
    <div ref={ref}>
      <p className="eyebrow text-slate">{kicker}</p>
      <p className="mt-2 max-w-[42ch] text-[15px] leading-relaxed text-ink/60">
        {intro}
      </p>

      <div className="vignette relative mt-6 aspect-[16/10] overflow-hidden rounded-[2px]">
        <motion.div
          style={reduce ? undefined : { y, filter }}
          className="absolute inset-[-8%]"
        >
          <Image
            src={image ?? "https://picsum.photos/seed/josh-skyline/1200/750"}
            alt="Hyderabad skyline from day to night"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(120% 90% at 50% 20%, rgba(197,162,107,0.45), transparent 65%)",
            opacity: warm,
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,14,10,0.7) 0%, rgba(12,14,10,0.15) 40%, rgba(12,14,10,0.9) 100%)",
            opacity: cool,
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: LIGHT_DOTS, opacity: lights }}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isDay ? (
              <Sun size={14} strokeWidth={1.5} className="text-emerald" />
            ) : (
              <Moon size={14} strokeWidth={1.5} className="text-emerald" />
            )}
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate">
              {scene.label}
            </span>
          </span>
          <span className="font-mono text-[11px] tracking-[0.1em] text-ink/60 tabular-nums">
            {scene.time}
          </span>
        </div>

        <div className="relative mt-4 h-11">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-emerald/30" />
          <div
            className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-emerald"
            style={{ width: `${pos}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={pos}
            aria-label="Change the city outlook from day to night"
            onChange={(e) => setPos(Number(e.target.value))}
            className="relative z-10 h-full w-full cursor-ew-resize touch-none appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-emerald [&::-webkit-slider-thumb]:bg-paper [&::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(197,162,107,0.28)] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-emerald [&::-moz-range-thumb]:bg-paper"
          />
        </div>
      </div>
    </div>
  );
}
