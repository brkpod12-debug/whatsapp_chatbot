"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import type { ProcessStep, HomePage } from "@/sanity/queries";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { IstClock } from "@/components/ui/IstClock";
import { WaxSeal } from "@/components/ui/WaxSeal";

gsap.registerPlugin(ScrollTrigger);

export function Process({ steps, copy }: { steps: ProcessStep[]; copy: HomePage["process"] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduce) return;
    const ctx = gsap.context(() => {
      const line = section.querySelector<HTMLElement>(".method-progress");
      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".method-track",
              start: "top 75%",
              end: "bottom 60%",
              scrub: 0.6,
            },
          }
        );
      }
      const survey = section.querySelector<SVGPathElement>(".method-survey-path");
      if (survey) {
        gsap.fromTo(
          survey,
          { strokeDashoffset: 360 },
          {
            strokeDashoffset: 0,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: ".method-head", start: "top 75%" },
          }
        );
      }

      // Per-step activation: the dim state and sequential text reveal live
      // in CSS (.method-step / .is-active), so SSR matches the resting state
      // with no flash. ScrollTrigger only flips the class.
      const steps = gsap.utils.toArray<HTMLElement>(".method-step");
      steps.forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 78%",
          once: true,
          onEnter: () => step.classList.add("is-active"),
        });
      });
    }, section);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="method" ref={sectionRef} className="bg-carbon text-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-28 sm:px-12 lg:px-20 lg:py-44">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="method-head lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-brass/90">
                  <span className="h-px w-10 bg-brass/60" aria-hidden />
                  {copy.kicker}
                </p>
              </Reveal>
              <RevealMask delay={0.1}>
                <h2 className="mt-8 text-balance font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] lg:text-6xl">
                  {copy.heading}
                </h2>
              </RevealMask>
              <svg
                aria-hidden
                viewBox="0 0 360 120"
                fill="none"
                className="mt-12 w-full max-w-[280px] text-brass/80"
              >
                <path
                  d="M0 0 L0 100 L60 100 L120 40 L200 40 L260 10 L360 10"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="360"
                  strokeDashoffset="360"
                  className="method-survey-path"
                />
                <circle cx="0" cy="0" r="2.5" fill="currentColor" />
                <circle cx="360" cy="10" r="2.5" fill="currentColor" />
              </svg>
              <Reveal delay={0.2}>
                <p className="mt-10 max-w-[42ch] text-pretty text-[15px] leading-relaxed text-paper/55">
                  {copy.intro}
                </p>
              </Reveal>
              <p className="stamp mt-8 text-paper/35">
                Doc · <IstClock precision="second" />
              </p>
            </div>
          </div>

          <div className="method-track relative lg:col-span-7">
            <div
              aria-hidden
              className="absolute bottom-4 left-[22px] top-4 w-px bg-paper/15"
            />
            <div
              aria-hidden
              className="method-progress absolute bottom-4 left-[22px] top-4 w-px origin-top bg-brass"
            />
            <ol className="space-y-14 lg:space-y-20">
              {steps.map((step, i) => (
                <Reveal key={step.step} delay={Math.min(i * 0.05, 0.15)}>
                  <li className="method-step relative grid grid-cols-[44px_1fr] gap-6 lg:gap-10">
                    <span className="method-num relative z-10 mt-1 flex h-[44px] w-[44px] items-center justify-center border bg-carbon font-mono text-[11px] tracking-[0.1em]">
                      {step.step}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <h3 className="method-text method-title font-display text-2xl font-normal text-paper lg:text-3xl">
                          {step.title}
                        </h3>
                        <span className="method-text method-week eyebrow text-brass/90">
                          {step.week}
                        </span>
                      </div>
                      <p className="method-text method-desc mt-3 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-paper/60">
                        {step.description}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>

            {/* The method closes the way a file does: stamped, then set down. */}
            <div className="mt-20 flex items-center gap-6 border-t border-paper/15 pt-10">
              <WaxSeal label="Advisory · Delivered" className="h-20 w-20 shrink-0" />
              <p className="stamp text-paper/45">
                Advisory
                <br />
                delivered
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
