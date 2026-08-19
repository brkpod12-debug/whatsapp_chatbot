"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface RevealMaskProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const mask = {
  hidden: { clipPath: "inset(0% 0% 100% 0%)" },
  visible: { clipPath: "inset(0% 0% 0% 0%)" },
};

/**
 * Reveals its children from behind a mask that wipes upward.
 *
 * The clip lives on an inner element, never on the observed one. Chrome counts
 * an element's own clip-path when computing intersection, so putting the clip
 * on the element carrying whileInView makes it report zero visible area: the
 * trigger never fires and the mask never opens. Keeping the observer on an
 * unclipped wrapper is what makes this reliable.
 */
export function RevealMask({ children, delay = 0, className }: RevealMaskProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      className={className}
    >
      <motion.div
        variants={reduce ? undefined : mask}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
        className={cn("overflow-hidden")}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
