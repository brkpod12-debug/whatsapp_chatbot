"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/**
 * The folio opens as the reader scrolls: a clip wipe travelling bottom to top
 * across the card, spring-smoothed so it never snaps at the frame boundaries
 * of the smooth-scroll loop. Under reduced motion the card is simply open.
 */
export function FolioWipe({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.35"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const clip = useTransform(smooth, (v) => `inset(0% 0% ${(1 - v) * 100}% 0%)`);

  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { clipPath: clip }}>
      {children}
    </motion.div>
  );
}
