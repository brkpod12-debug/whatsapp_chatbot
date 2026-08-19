"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface RegistryRuleProps {
  /** Fill duration in seconds. The spec's section dividers run long and slow. */
  duration?: number;
  delay?: number;
  /** `dark` sits on carbon/graphite, `light` on paper. Controls the track colour. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * A hairline divider that fills with brass from left to right when it enters
 * the viewport. The track stays visible under reduced motion so the section
 * boundary never disappears, only the fill animation is dropped.
 */
export function RegistryRule({
  duration = 1.6,
  delay = 0,
  tone = "light",
  className,
}: RegistryRuleProps) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className={cn(
        "relative h-px w-full",
        tone === "dark" ? "bg-paper/15" : "bg-ink/15",
        className
      )}
    >
      <motion.span
        className="absolute inset-0 origin-left bg-brass"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
