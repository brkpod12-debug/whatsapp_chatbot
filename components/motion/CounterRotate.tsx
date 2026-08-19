"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/**
 * Tilts its child as the element travels through the viewport. Alternating the
 * direction down a list makes a column of folio numerals lean against each
 * other, which reads as hand-set type rather than a rendered grid.
 */
export function CounterRotate({
  children,
  direction = 1,
  max = 6,
  className,
}: {
  children: ReactNode;
  direction?: 1 | -1;
  /** Peak tilt in degrees at the extremes of travel. */
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const rotate = useTransform(smooth, [0, 1], [max * direction, -max * direction]);

  return (
    <motion.span
      ref={ref}
      className={className}
      style={reduce ? undefined : { rotate, display: "inline-block" }}
    >
      {children}
    </motion.span>
  );
}
