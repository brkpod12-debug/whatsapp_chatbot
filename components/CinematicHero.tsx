"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  cubicBezier,
  motion,
  MotionValue,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Button } from "@/components/ui/Button";
import type { HomePage } from "@/sanity/queries";

// Easing *function* for scroll-mapped transforms. useTransform's `ease` option
// expects an easing function (or array of them), unlike animation transitions
// which accept a cubic-bezier tuple directly.
const EASE_FN = cubicBezier(0.16, 1, 0.3, 1);

// Lerp factor per 60fps frame (spec: 0.08–0.15). Applied frame-rate
// independently in the rAF loop so the film eases toward the target
// frame with a touch of cinematic inertia — never jumps.
const SMOOTH_FACTOR = 0.1;

/**
 * Scroll-scrubbed cinematic hero — the film's timeline is owned by scroll.
 *
 * Scroll only writes a targetTime (scrollProgress × duration); a rAF loop
 * lerps a smoothTime toward it and writes the video there. Scroll down →
 * camera advances, faster scroll → advances faster, stop → settles on the
 * frame, scroll up → reverses. No raw currentTime writes, no seeking jitter.
 *
 * The hero holds a 220vh sticky section (160vh mobile) and plays five
 * opening-title "scenes" — one message at a time — synchronized to the same
 * smoothed progress, ending in a gradient dissolve into the Title Register
 * section. Reduced motion renders a static poster hero instead.
 */
// Devices that actually get the scroll-scrubbed film. Phones and tablets do
// not: seeking a multi-megabyte h264 on every rAF frame starves the mobile
// compositor and the page stops scrolling. They keep the poster frame and the
// same scroll-driven typography, minus the reel.
const FILM_QUERY = "(pointer: fine) and (min-width: 1024px)";

function useFilmDevice() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(FILM_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(FILM_QUERY).matches,
    () => false // SSR + first paint assume "no film", so phones never fetch it
  );
}

export function CinematicHero({ copy, heroVideo }: { copy: HomePage["hero"]; heroVideo: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const film = useFilmDevice();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Smoothed progress: raw scroll → target, eased in rAF below. Everything
  // (video + text) reads this one value, so typography and film stay in sync.
  const smooth = useMotionValue(0);

  // --- scrub loop: interpolate currentTime toward targetTime, with inertia ---
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      // Frame-rate independent easing toward the target progress.
      const k = 1 - Math.pow(1 - SMOOTH_FACTOR, dt / (1000 / 60));
      const target = scrollYProgress.get();
      const cur = smooth.get();
      const next = cur + (target - cur) * k;
      if (Math.abs(next - cur) > 0.00001) smooth.set(next);

      const v = film ? videoRef.current : null;
      if (v && v.readyState >= 2 && v.duration > 0) {
        const t = next * v.duration;
        // Dead-band + seeking guard: only seek when meaningfully off target.
        if (!v.seeking && Math.abs(v.currentTime - t) > 0.02) {
          v.currentTime = t;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [film, reduce, scrollYProgress, smooth]);

  // --- unlock frame decode (muted play then pause) ---
  useEffect(() => {
    if (!film) return;
    const v = videoRef.current;
    if (!v) return;
    const unlock = () => {
      v.play().then(() => v.pause()).catch(() => {});
    };
    unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [film]);

  // ─────────────────────────── Scene choreography ───────────────────────────
  // Scene 01 (0–22%): PRIVATE REAL ESTATE ADVISORY / HYDERABAD — opening title.
  // Scene 01 draws itself in on load. It used to be scroll-mapped from 0, which
  // left the opening frame with no rule, no kicker and the headline parked
  // outside its own clip box until roughly 400px of scroll.
  // Scene 01 exit: HYDERABAD lifts 18px and fades; advisory follows later.
  const hyderabadExitY = useTransform(smooth, [0.18, 0.27], [0, -18]);
  const hyderabadOpacity = useTransform(smooth, [0.18, 0.27], [1, 0]);
  const advisoryExit = useTransform(smooth, [0.2, 0.3], [1, 0]);

  // Scene 02 (30–48%): CURATED. VERIFIED. PRIVATE. — sequential masked lines.
  const s2In = useTransform(smooth, [0.3, 0.36], [0, 1]);
  const s2Exit = useTransform(smooth, [0.48, 0.53], [1, 0]);
  const s2ExitY = useTransform(smooth, [0.48, 0.53], [0, -18]);

  // Scene 03 (52–72%): THE TITLE / COMES FIRST. + the verification note.
  const s3In = useTransform(smooth, [0.54, 0.6], [0, 1]);
  const s3Meta = useTransform(smooth, [0.62, 0.67], [0, 1]);
  const s3MetaY = useTransform(smooth, [0.62, 0.67], [10, 0]);
  const s3Exit = useTransform(smooth, [0.72, 0.77], [1, 0]);
  const s3ExitY = useTransform(smooth, [0.72, 0.77], [0, -14]);

  // Scene 04 (76–92%): JOSH PROPERTIES — final campaign frame. Desktop only.
  const s4In = useTransform(smooth, [0.78, 0.84], [0, 1]);
  const s4InY = useTransform(smooth, [0.78, 0.84], [16, 0]);
  const s4Out = useTransform(smooth, [0.93, 0.97], [1, 0]);

  // Scene 05 (92–100%): film dissolves into the next section + one CTA.
  const cta = useTransform(smooth, [0.9, 0.95], [0, 1]);
  const ctaY = useTransform(smooth, [0.9, 0.95], [12, 0]);
  const dissolve = useTransform(smooth, [0.68, 0.94], [0, 1]);
  const videoFade = useTransform(smooth, [0.9, 1], [1, 0.2]);
  const scale = useTransform(smooth, [0, 1], [1, 1.025]);
  const indicator = useTransform(smooth, [0.04, 0.1], [0, 1]);

  if (reduce) return <StaticHero copy={copy} />;

  return (
    <section ref={sectionRef} className="relative h-[160vh] md:h-[220vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-carbon">
        {/* Scroll-scrubbed film */}
        <motion.div
          aria-hidden
          className="absolute inset-0 will-change-transform"
          style={{ scale, opacity: videoFade }}
        >
          <video
            ref={videoRef}
            // No `src` off-film: the element renders the poster and the reel is
            // never requested on phones.
            src={film ? heroVideo : undefined}
            poster="/hero-poster.webp"
            muted
            playsInline
            preload={film ? "auto" : "none"}
            disablePictureInPicture
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Localized cinematic gradients — villa stays visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(7,7,6,0.72)] via-[rgba(7,7,6,0.38)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon/45 via-transparent to-carbon/25" />
        <div className="vignette absolute inset-0" />
        <div className="film-grain absolute inset-0" />

        {/* ── Scene 01 · opening title (left aligned) ── */}
        {/* Not aria-hidden: this scene carries the page's only <h1>. */}
        <motion.div className="pointer-events-none absolute inset-0 flex items-center px-6 sm:px-12 lg:px-20">
          <div className="max-w-[760px]">
            <motion.div style={{ opacity: advisoryExit }}>
              <div className="hero-rule h-px w-[42px] origin-left bg-emerald" />
              <p className="hero-kicker mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/80 sm:text-[11px]">
                {copy.kicker}
              </p>
            </motion.div>
            <motion.div
              style={{ opacity: hyderabadOpacity, y: hyderabadExitY }}
              className="mt-2 w-fit overflow-hidden pb-[0.1em] pr-[0.06em] pt-[0.05em]"
            >
              <h1 className="hero-title font-display text-[clamp(2.8rem,9vw,7.5rem)] leading-[1] text-paper">
                {copy.place}
              </h1>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Scene 02 · CURATED. VERIFIED. PRIVATE. (center) ── */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: s2Exit, y: s2ExitY }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
        >
          <motion.div style={{ opacity: s2In }} className="text-center">
            <MaskedLine
              progress={smooth}
              range={[0.31, 0.37]}
              className="font-display text-[clamp(2.2rem,6vw,5.5rem)] leading-[1.1] text-paper"
            >
              {copy.words[0]}
            </MaskedLine>
            <MaskedLine
              progress={smooth}
              range={[0.34, 0.4]}
              className="font-display text-[clamp(2.2rem,6vw,5.5rem)] leading-[1.1] text-emerald"
            >
              {copy.words[1]}
            </MaskedLine>
            <MaskedLine
              progress={smooth}
              range={[0.37, 0.43]}
              className="font-display text-[clamp(2.2rem,6vw,5.5rem)] leading-[1.1] text-paper"
            >
              {copy.words[2]}
            </MaskedLine>
          </motion.div>
        </motion.div>

        {/* ── Scene 03 · THE TITLE / COMES FIRST. (center-left) ── */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: s3Exit, y: s3ExitY }}
          className="pointer-events-none absolute inset-0 flex items-center px-6 sm:px-12 lg:px-20"
        >
          <motion.div style={{ opacity: s3In }} className="max-w-[640px]">
            <MaskedLine
              progress={smooth}
              range={[0.54, 0.6]}
              className="font-display text-[clamp(2.6rem,7.5vw,6.5rem)] leading-[1.02] text-paper"
            >
              {copy.titleLine1}
            </MaskedLine>
            <MaskedLine
              progress={smooth}
              range={[0.56, 0.62]}
              className="font-display text-[clamp(2.6rem,7.5vw,6.5rem)] leading-[1.02] italic text-paper"
            >
              {copy.titleLine2}
            </MaskedLine>
            <motion.div
              style={{ opacity: s3Meta, y: s3MetaY }}
              className="mt-8 flex items-center gap-4"
            >
              <span className="h-px w-10 bg-emerald/80" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper/70">
                {copy.verificationNote}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Scene 04 · JOSH PROPERTIES — final frame (center, desktop) ── */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: s4Out }}
          className="pointer-events-none absolute inset-x-0 bottom-[14vh] hidden items-center justify-center md:flex"
        >
          <motion.div style={{ opacity: s4In, y: s4InY }} className="text-center">
            <p className="font-display text-[clamp(1.6rem,3.5vw,3rem)] tracking-[0.08em] text-paper">
              {copy.brandLine}
            </p>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/60">
              {copy.brandSub}
            </p>
          </motion.div>
        </motion.div>

        {/* ── Finale CTA: one understated link, appears as the film dissolves ── */}
        <motion.a
          href="#collection"
          style={{ opacity: cta, y: ctaY }}
          className="group absolute inset-x-0 bottom-10 z-40 flex justify-center px-6"
        >
          <span className="link-underline flex min-h-11 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/80 transition-colors duration-300 hover:text-bronze">
            {copy.ctaLabel}
            <ArrowRight
              size={14}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </span>
        </motion.a>

        {/* 68–100%: dissolve into the next section (warm ivory) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh]"
          style={{
            opacity: dissolve,
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(242,239,232,0.2) 55%, var(--color-stone) 100%)",
          }}
        />

        {/* Editorial scroll progress — 01 │ │ │ 04 (desktop) */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: indicator }}
          className="pointer-events-none absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex xl:right-10"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/60">01</span>
          <div className="relative h-28 w-px overflow-hidden bg-paper/15">
            <motion.div className="absolute inset-0 origin-top bg-emerald/70" style={{ scaleY: smooth }} />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/60">04</span>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * A line of text revealed by a masked vertical wipe (translateY 105% → 0),
 * driven by the hero's smoothed scroll progress rather than a timer.
 * Typography is passed by the caller so each scene styles its own lines.
 */
function MaskedLine({
  progress,
  range,
  children,
  className = "",
}: {
  progress: MotionValue<number>;
  range: [number, number];
  children: React.ReactNode;
  className?: string;
}) {
  const y = useTransform(progress, range, ["105%", "0%"], { ease: EASE_FN });
  return (
    <span className="block overflow-hidden pb-[0.1em] pt-[0.04em]">
      <motion.span className={`block will-change-transform ${className}`} style={{ y }}>
        {children}
      </motion.span>
    </span>
  );
}

/** Reduced-motion fallback: premium static poster hero, content visible. */
function StaticHero({ copy }: { copy: HomePage["hero"] }) {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-carbon">
      <div className="absolute inset-0">
        <Image
          src="/hero-poster.jpg"
          alt="Aerial dusk view over a luxury villa near Hyderabad"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(7,7,6,0.72)] via-[rgba(7,7,6,0.28)] to-[rgba(7,7,6,0.12)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-carbon/90 via-carbon/40 to-carbon/30" />
      <div className="vignette absolute inset-0" />

      <div className="relative mx-auto w-full max-w-[1440px] px-6 sm:px-12 lg:px-20">
        <div className="h-px w-[42px] bg-emerald" />
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/80 sm:text-[11px]">
          {copy.kicker}
        </p>
        <h1 className="mt-3 font-display text-[clamp(3rem,10vw,7.5rem)] leading-[0.95] text-paper">
          {copy.place}
        </h1>
        <p className="mt-6 max-w-[44ch] font-display text-2xl italic leading-snug text-paper/85">
          {copy.titleLine1} {copy.titleLine2}
        </p>
        <div className="mt-12">
          <MagneticButton href="#collection">
            <Button href="#collection" variant="filled" size="lg" className="group brass-shimmer">
              {copy.ctaLabel}
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Button>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
