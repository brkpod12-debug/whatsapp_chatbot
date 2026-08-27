"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface ChapterMarkerProps {
  kicker: string;
  tone?: "light" | "dark";
  className?: string;
}

export function ChapterMarker({ kicker, tone = "light", className }: ChapterMarkerProps) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        "flex items-center gap-4",
        // Brass reads on a dark chapter; on paper it needs the darker
        // text-grade champagne to clear 4.5:1.
        tone === "dark" ? "text-emerald" : "text-champagne",
        className
      )}
    >
      <motion.span
        aria-hidden
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="rule-solid w-16 origin-left"
      />
      <motion.span
        initial={reduce ? false : { opacity: 0, letterSpacing: "0.1em" }}
        whileInView={{ opacity: 1, letterSpacing: "0.22em" }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="eyebrow"
      >
        {kicker}
      </motion.span>
    </div>
  );
}
