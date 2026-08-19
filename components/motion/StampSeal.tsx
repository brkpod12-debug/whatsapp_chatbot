"use client";

import { motion, useReducedMotion } from "motion/react";
import { Seal } from "@/components/ui/Seal";
import { cn } from "@/lib/utils";

/**
 * The seal presses once when it first enters the viewport: overshoot, settle,
 * rest. Under reduced motion it is simply present, at rest, from the start.
 */
export function StampSeal({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      aria-hidden
      className={cn("inline-block", className)}
      initial={reduce ? false : { scale: 1.4, opacity: 0 }}
      whileInView={{ scale: [1.4, 0.96, 1], opacity: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.28, times: [0, 0.6, 1], ease: "easeOut" }}
    >
      <Seal className="h-full w-full" />
    </motion.span>
  );
}
