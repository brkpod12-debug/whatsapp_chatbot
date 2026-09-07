"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import type { PromiseItem, HomePage } from "@/sanity/queries";
import { Reveal } from "@/components/motion/Reveal";

const ease = [0.16, 1, 0.3, 1] as const;

function Pillar({ item, index }: { item: PromiseItem; index: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const insight = item.insight?.trim();
  const panelId = `pillar-${index}-insight`;

  // Same rAF-coalesced custom-property write as the folio cards: no React
  // render and no layout read per pointer frame.
  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (reduce || e.pointerType !== "mouse") return;
      const el = card.current;
      if (!el) return;
      const { clientX, clientY } = e;
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${clientX - r.left}px`);
        el.style.setProperty("--my", `${clientY - r.top}px`);
      });
    },
    [reduce]
  );

  return (
    <div
      ref={card}
      onPointerMove={onPointerMove}
      className="group relative isolate grid grid-cols-1 gap-x-10 pb-12 pt-7 lg:grid-cols-12 lg:pb-16 lg:pt-9"
    >
      {/* Top hairline, filling with brass on hover */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/15">
        <span className="absolute inset-0 origin-left scale-x-0 bg-emerald transition-transform duration-[1200ms] ease-out group-hover:scale-x-100 motion-reduce:transition-none" />
      </span>

      {/* Pointer-tracked brass spotlight */}
      {!reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(340px 340px at var(--mx, 50%) var(--my, 50%), var(--gold-glow), transparent 70%)",
          }}
        />
      )}

      {/* Hanging index, out in the margin where a ledger would set it */}
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate transition-colors duration-300 group-hover:text-emerald lg:col-span-2 lg:pt-3">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="mt-4 lg:col-span-10 lg:mt-0">
        <h3 className="max-w-[22ch] text-balance font-display text-3xl leading-[1.08] tracking-[-0.015em] text-ink transition-transform duration-500 ease-out group-hover:translate-x-[3px] lg:text-[2.75rem]">
          {item.title}
        </h3>

        {/* Body steps in one column under the title: the stagger is what keeps
            this from reading as another equal-column grid. */}
        <div className="mt-5 lg:mt-7 lg:pl-[8.333%]">
          <p className="max-w-[52ch] text-pretty text-[15px] leading-relaxed text-ink/60">
            {item.body}
          </p>

          {insight && (
            <>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                className="mt-5 inline-flex min-h-11 items-center gap-2 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate transition-colors duration-300 hover:text-emerald"
              >
                <Plus
                  size={12}
                  strokeWidth={1.5}
                  className={`transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-45" : ""}`}
                />
                Why this matters
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={panelId}
                    key="insight"
                    initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[52ch] border-l border-emerald/50 pl-4 text-[14px] leading-relaxed text-ink/70">
                      {insight}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function WhyJosh({ items, copy }: { items: PromiseItem[]; copy: HomePage["whyJosh"] }) {
  return (
    <section className="bg-paper">
      {/* Indented into the grid rather than sitting at its edge, so this
          section does not open on the same left margin as its neighbours. */}
      <div className="mx-auto max-w-[1440px] px-6 py-28 sm:px-12 lg:px-20 lg:py-40">
        <div className="lg:pl-[16.666%]">
          <Reveal>
            <h2 className="max-w-[18ch] text-balance font-display text-4xl leading-[1.03] tracking-[-0.02em] text-ink lg:text-6xl">
              {copy.heading}
            </h2>
          </Reveal>

          {/* A single column of large, quiet statements. No equal-card grid,
              so no empty cell however many pillars the register holds. */}
          <div className="mt-16 lg:mt-24">
            {items.map((item, i) => (
              <Reveal key={item.title} delay={i === 0 ? 0 : 0.06}>
                <Pillar item={item} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
