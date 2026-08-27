"use client";

import { useEffect } from "react";

/**
 * Lenis + GSAP ScrollTrigger, loaded only where they are used.
 *
 * These used to be static imports in the root layout, which put ~80 KB of
 * scroll machinery on the critical path of every page, including the phones
 * that bail out of it two lines later. They now arrive after the media
 * queries have said yes.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Coarse pointers (phones, tablets): native momentum + rubber-banding is
    // the premium mobile feel. Lenis only smooths wheel/keyboard scroll, so
    // on touch it would add a permanent rAF loop for no benefit.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ autoRaf: true, anchors: true });
      (window as unknown as { __lenis?: unknown }).__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const onRefresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", onRefresh);

      cleanup = () => {
        window.removeEventListener("load", onRefresh);
        delete (window as unknown as { __lenis?: unknown }).__lenis;
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
