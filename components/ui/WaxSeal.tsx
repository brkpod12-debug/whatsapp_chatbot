"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The closing wax stamp on the method: it presses once, then rests.
 *
 * This is the site's one deliberate use of wax red. Treat the colour as a
 * precious resource, as the design system does, and do not introduce a second
 * instance on the same page.
 */
export function WaxSeal({ label, className }: { label: string; className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn("relative", className)}
      initial={reduce ? false : { scale: 1.35, opacity: 0, rotate: -8 }}
      whileInView={{ scale: [1.35, 0.96, 1], opacity: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.7 }}
      transition={{ duration: 0.32, times: [0, 0.62, 1], ease: "easeOut" }}
    >
      {/* The label is set beside the seal, not curved inside it: at this
          diameter the arc text is microtype nobody can read. The accessible
          name still carries it. */}
      <svg viewBox="0 0 100 100" role="img" aria-label={label} className="h-full w-full">
        <circle cx="50" cy="50" r="46" fill="var(--wax-red)" fillOpacity="0.14" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="var(--wax-red)" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="39" fill="none" stroke="var(--wax-red)" strokeWidth="0.5" />

        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="var(--wax-red)"
          fontSize="19"
          fontFamily="var(--font-display)"
          fontWeight="300"
        >
          JP
        </text>
      </svg>
    </motion.div>
  );
}
