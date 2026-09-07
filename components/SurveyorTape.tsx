"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import type { HomePage } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";

type Ground = HomePage["farmlandBand"]["grounds"][number];

/**
 * A deterministic snaking "drone flight" over each plot. Seeded off the card
 * index so every ground gets its own line, but the same line on every render
 * (no hydration drift, no per-frame randomness).
 */
function dronePath(i: number) {
  const drift = (i % 3) * 8 - 8;
  return [
    `M 4 ${74 + drift}`,
    `C 22 ${58 + drift}, 30 ${86 - drift}, 48 ${64 + drift}`,
    `S 74 ${30 - drift}, 96 ${18 + drift}`,
  ].join(" ");
}

export function SurveyorTape({ grounds }: { grounds: Ground[] }) {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // GSAP is ~70 KB. Fetch it when the effect runs rather than shipping it on
  // the homepage's critical path (this section renders above Process, which
  // already defers it the same way).
  useEffect(() => {
    const el = root.current;
    if (!el || reduce) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();

        // Desktop/tablet only. Touch keeps the native swipe track below, which
        // is a better interaction than a hijacked vertical scroll on a phone.
        mm.add("(min-width: 769px)", () => {
          const track = el.querySelector<HTMLElement>("[data-tape-track]");
          const pin = el.querySelector<HTMLElement>("[data-tape-pin]");
          if (!track || !pin) return;

          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

          // Overall progress drives the ruler fill and the mini-map marker.
          // These must be wired in the config: ScrollTrigger reads its vars at
          // creation, so assigning .vars.onUpdate afterwards never fires.
          const ruler = el.querySelector<HTMLElement>("[data-tape-ruler]");
          const marker = el.querySelector<HTMLElement>("[data-tape-marker]");

          const drive = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: pin,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (ruler) ruler.style.transform = `scaleX(${self.progress})`;
                if (marker) marker.style.left = `${self.progress * 100}%`;
              },
            },
          });

          // Per-card effects ride the horizontal tween via containerAnimation.
          gsap.utils.toArray<HTMLElement>("[data-tape-card]").forEach((card, i) => {
            const img = card.querySelector<HTMLElement>("[data-tape-img]");
            const path = card.querySelector<SVGPathElement>("[data-tape-path]");
            const name = card.querySelector<HTMLElement>("[data-tape-name]");
            const counter = el.querySelector<HTMLElement>("[data-tape-count]");

            // Saturation ramps as the card crosses the centre of the frame,
            // scrubbed by position rather than fired once.
            if (img) {
              ScrollTrigger.create({
                trigger: card,
                containerAnimation: drive,
                start: "left 85%",
                end: "center 55%",
                scrub: true,
                onUpdate: (self) => {
                  img.style.filter = `grayscale(${1 - self.progress}) brightness(${0.9 + self.progress * 0.1})`;
                },
              });
            }

            ScrollTrigger.create({
              trigger: card,
              containerAnimation: drive,
              start: "left 70%",
              end: "right 30%",
              onToggle: (self) => {
                if (!self.isActive) return;
                card.setAttribute("data-active", "true");
                if (counter) counter.textContent = String(i + 1).padStart(2, "0");
              },
              onLeave: () => card.removeAttribute("data-active"),
              onLeaveBack: () => card.removeAttribute("data-active"),
            });

            if (path) {
              gsap.fromTo(
                path,
                { strokeDashoffset: 1 },
                {
                  strokeDashoffset: 0,
                  duration: 1.6,
                  ease: "power2.out",
                  scrollTrigger: { trigger: card, containerAnimation: drive, start: "left 65%", once: true },
                }
              );
            }

            if (name) {
              gsap.fromTo(
                name.children,
                { yPercent: 110, opacity: 0 },
                {
                  yPercent: 0,
                  opacity: 1,
                  duration: 0.7,
                  ease: "power3.out",
                  stagger: 0.03,
                  scrollTrigger: { trigger: card, containerAnimation: drive, start: "left 70%", once: true },
                }
              );
            }
          });
        });
      }, el);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <div ref={root} className="mt-16">
      <div data-tape-pin className="relative md:min-h-[100dvh] md:overflow-hidden">
        <div
          data-tape-track
          className={
            // Touch: a native snap-swipe track. Desktop: a single wide row the
            // pin drags horizontally, so overflow must stay visible there.
            "flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] md:w-max md:snap-none md:items-center md:gap-[4vw] md:overflow-visible md:px-[5vw] md:pb-0 md:pt-[10vh] [&::-webkit-scrollbar]:hidden"
          }
        >
          {grounds.map((g, i) => (
            <article
              key={g.name}
              data-tape-card
              className="group w-[300px] shrink-0 snap-start border-t border-paper/20 transition-opacity duration-500 md:w-[46vw] md:opacity-55 md:data-[active]:opacity-100 lg:w-[38vw]"
            >
              <div className="vignette relative aspect-[4/5] overflow-hidden rounded-[2px] md:aspect-[16/10]">
                <Image
                  data-tape-img
                  src={
                    g.image
                      ? urlFor(g.image).width(1200).height(900).url()
                      : `https://picsum.photos/seed/josh-farm-${g.name}/1200/900`
                  }
                  alt={`${g.name}, ${g.note}`}
                  fill
                  sizes="(max-width: 768px) 300px, 46vw"
                  className="tape-img object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />

                {/* Surveyed flight line over the plot */}
                <svg
                  aria-hidden
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  <path
                    data-tape-path
                    d={dronePath(i)}
                    fill="none"
                    stroke="var(--brass)"
                    strokeWidth="0.5"
                    strokeOpacity="0.85"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    strokeDasharray={1}
                  />
                </svg>

                <span className="stamp absolute left-4 top-4 border border-brass/50 bg-carbon/50 px-2 py-1 text-brass">
                  Plot {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <h3
                data-tape-name
                className="mt-5 flex overflow-hidden font-display text-2xl text-paper md:text-4xl"
              >
                {[...g.name.trim()].map((ch, c) => (
                  <span key={`${ch}-${c}`} className="inline-block whitespace-pre">
                    {ch}
                  </span>
                ))}
              </h3>
              <p className="mt-1 text-[13px] text-paper/70">{g.note}</p>
            </article>
          ))}
        </div>

        {/* Surveyor's ruler + mini-map. Desktop only: on touch the swipe track
            already shows position, and a fixed strip would cover the cards. */}
        {/* Right padding clears the fixed floating CTA in the corner. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[6vh] hidden pl-[5vw] pr-[7.5rem] md:block">
          <div className="flex items-end justify-between gap-8">
            <div className="flex-1">
              <div className="relative h-px w-full bg-paper/20">
                <span
                  data-tape-ruler
                  className="absolute inset-0 origin-left bg-brass"
                  style={{ transform: "scaleX(0)" }}
                />
                <span
                  data-tape-marker
                  className="absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-brass"
                  style={{ left: "0%" }}
                />
                <div className="absolute inset-x-0 -top-2 flex justify-between">
                  {grounds.map((g) => (
                    <span key={g.name} className="h-2 w-px bg-paper/25" />
                  ))}
                </div>
              </div>
              <p className="stamp mt-3 text-paper/65">Surveyed ground, west to east</p>
            </div>

            <p className="stamp shrink-0 text-paper/60">
              <span data-tape-count className="text-brass">01</span> / {String(grounds.length).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
