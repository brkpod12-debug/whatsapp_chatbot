"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Seal } from "@/components/ui/Seal";

const ease = [0.16, 1, 0.3, 1] as const;
const STAMP_LINE = "Josh Properties · Private Advisory · Hyderabad · Est. 2017";
const SESSION_KEY = "jp_loaded";

const noopSubscribe = () => () => {};

/** True only on the session's first visit. SSR and first client paint agree on `false`. */
function useFirstVisit() {
  return useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(SESSION_KEY) !== "1",
    () => false
  );
}

/**
 * First-visit-only brass foil press: the registry seal scales in and settles
 * while the imprint line types itself beneath it. Repeat visits inside the same
 * session skip it entirely, as does reduced motion.
 */
export function SealLoader() {
  const firstVisit = useFirstVisit();
  const reduce = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [typed, setTyped] = useState(0);

  const open = firstVisit && !reduce && !dismissed;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    const perChar = 1400 / STAMP_LINE.length;
    const typer = window.setInterval(() => {
      setTyped((n) => (n >= STAMP_LINE.length ? n : n + 1));
    }, perChar);

    const done = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setDismissed(true);
    }, 1600);

    return () => {
      window.clearInterval(typer);
      window.clearTimeout(done);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-carbon"
          exit={{ opacity: 0, transition: { duration: 0.5, ease } }}
        >
          <motion.div
            className="brass-shimmer relative text-brass"
            initial={{ scale: 0, rotate: 8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease }}
          >
            <Seal className="h-[220px] w-[220px]" />
          </motion.div>

          <p className="stamp mt-10 h-4 text-paper/45">{STAMP_LINE.slice(0, typed)}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
