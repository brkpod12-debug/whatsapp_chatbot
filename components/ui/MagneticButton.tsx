"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Accepted for API compatibility with existing call sites but ignored:
   *  the inner Button renders the real link. */
  href?: string;
  strength?: number;
  /** Accepted for API compatibility but ignored (see href). */
  label?: string;
}

export function MagneticButton({
  children,
  className,
  strength = 10,
  label,
}: MagneticButtonProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const sy = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || reduce) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set((dx / rect.width) * strength);
    y.set((dy / rect.height) * strength);
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  // Wrapper only: the inner Button renders the real link, so this is a span.
  // (Rendering an <a> here would nest anchors inside the Button and break
  // hydration.)
  return (
    <motion.span
      ref={ref}
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ x: sx, y: sy }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.span>
  );
}
