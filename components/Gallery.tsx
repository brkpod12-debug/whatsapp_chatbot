"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type GalleryImage = { src: string; alt: string };

interface GalleryProps {
  images: GalleryImage[];
  className?: string;
}

export function Gallery({ images, className }: GalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const moved = useRef(0);
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();

  function onDown(e: React.PointerEvent) {
    setDragging(true);
    startX.current = e.clientX;
    scrollLeft.current = trackRef.current?.scrollLeft ?? 0;
    moved.current = 0;
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - startX.current;
    moved.current = Math.max(moved.current, Math.abs(dx));
    el.scrollLeft = scrollLeft.current - dx;
  }

  function end(e: React.PointerEvent) {
    setDragging(false);
    // Open the lightbox only on a true tap/click, not after a drag.
    if (moved.current < 8 && e.target instanceof Element) {
      const figure = e.target.closest("[data-gallery-index]");
      if (figure) setOpen(Number(figure.getAttribute("data-gallery-index")));
    }
  }

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((o) => (o === null ? o : (o + images.length - 1) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setOpen((o) => (o === null ? o : (o + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Tab" && dialog) {
        const focusables = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === document.body)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, close, prev, next]);

  return (
    <>
      <div
        ref={trackRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerLeave={end}
        className={`flex snap-x snap-mandatory select-none gap-4 overflow-x-auto overscroll-x-contain pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
      >
        {images.map((img, i) => (
          <figure
            key={i}
            data-gallery-index={i}
            className="group relative aspect-[4/3] w-[82vw] shrink-0 cursor-zoom-in snap-start overflow-hidden rounded-[2px] sm:w-[60vw] lg:w-[42vw]"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 82vw, (max-width: 1024px) 60vw, 42vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              priority={i === 0}
            />
            <span className="absolute bottom-4 left-4 bg-carbon/50 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-paper backdrop-blur">
              {i + 1} / {images.length}
            </span>
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[85] flex items-center justify-center bg-carbon/95 backdrop-blur-md"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${open + 1} of ${images.length}`}
          >
            <button
              type="button"
              aria-label="Close gallery"
              autoFocus
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center border border-paper/25 text-paper transition-colors hover:border-emerald hover:text-emerald"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/25 bg-carbon/40 text-paper transition-colors hover:border-emerald hover:text-emerald sm:left-4 sm:h-12 sm:w-12"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-paper/25 bg-carbon/40 text-paper transition-colors hover:border-emerald hover:text-emerald sm:right-4 sm:h-12 sm:w-12"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={open}
                initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full px-3 py-16 sm:px-20 md:px-24"
              >
                <motion.div
                  className="relative h-full w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={images[open].src}
                    alt={images[open].alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </motion.div>
              </motion.figure>
            </AnimatePresence>

            <figcaption
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 flex items-center justify-between px-8 font-mono text-[10px] uppercase tracking-[0.24em] text-paper/50 sm:bottom-6"
            >
              <span>
                {open + 1} / {images.length}
              </span>
              <span className="hidden sm:block">{images[open].alt}</span>
            </figcaption>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
