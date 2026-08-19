"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Stat, HomePage } from "@/sanity/queries";
import { CountUp } from "@/components/motion/CountUp";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";
import { IstClock } from "@/components/ui/IstClock";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export function Stats({ stats, copy }: { stats: Stat[]; copy: HomePage["stats"] }) {
  const reduce = useReducedMotion();

  return (
    <section className="bg-graphite">
      <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <Reveal>
          <div className="perforated-edge border border-paper/15 bg-graphite text-paper/70 outline outline-1 outline-paper/10 outline-offset-[3px]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/15 px-6 py-5 sm:px-10">
              <p className="stamp text-paper/60">{copy.label}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald/90">
                {copy.folioLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 0.08}>
                  <div
                    className={cn(
                      "group relative flex h-full flex-col justify-between gap-6 border-paper/15 px-5 py-8 sm:gap-10 sm:px-10 sm:py-12",
                      i >= 2 && "border-t lg:border-t-0",
                      i % 2 === 1 && "border-l lg:border-l-0",
                      i !== 0 && "lg:border-l"
                    )}
                  >
                    {/* Champagne draw-line over the divider */}
                    <motion.span
                      aria-hidden
                      initial={reduce ? false : { scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 1, delay: 0.35 + i * 0.12, ease }}
                      className="absolute bottom-0 left-0 hidden h-full w-px origin-top bg-brass/45 lg:block"
                    />

                    {/* Folio numeral, set as a register mark rather than a label.
                        Upright, not italic: Instrument Serif's italic capital I is a
                        bare stem, so "III"/"IV" read as slashes at this size. */}
                    <FadeIn
                      delay={0.1 + i * 0.08}
                      className="font-display text-[32px] font-light leading-none tracking-[0.08em] text-brass/80"
                    >
                      {stat.numeral}
                    </FadeIn>

                    <div>
                      <span className="font-display text-4xl font-light leading-none text-emerald tabular-nums whitespace-nowrap sm:text-6xl lg:text-7xl">
                        <CountUp value={stat.value} suffix={stat.suffix} />
                      </span>
                      <p className="mt-4 max-w-[16ch] text-[13px] leading-snug text-paper/80 sm:mt-6 sm:text-[15px]">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-paper/15 px-6 py-4 sm:px-10">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/35">
                As of <IstClock /> · {copy.footerNote}
              </span>
              <span aria-hidden className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-paper/35 sm:inline">
                {copy.eoe}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
