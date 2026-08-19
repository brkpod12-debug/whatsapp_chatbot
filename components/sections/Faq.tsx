"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import type { Faq as FaqItem, HomePage } from "@/sanity/queries";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";

export function Faq({ items, copy }: { items: FaqItem[]; copy: HomePage["faqSection"] }) {
  // A set rather than a single index, so "expand all" is representable.
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const reduce = useReducedMotion();

  const allOpen = open.size === items.length;
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(items.map((_, i) => i)));
  const toggleOne = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const total = String(items.length).padStart(2, "0");

  return (
    <section id="faq" className="relative overflow-hidden bg-stone">
      {/* Folio watermark, set behind the questions and well clear of the text */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 top-[38%] select-none font-display text-[28vw] leading-none text-ink/[0.04] lg:text-[18vw]"
      >
        Q&amp;A
      </span>

      <div className="relative mx-auto max-w-[920px] px-6 py-28 sm:px-12 lg:py-40">
        <div className="flex items-end justify-between gap-8">
          <RevealMask delay={0.1}>
            <h2 className="text-balance font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] text-ink lg:text-5xl">
              {copy.heading}
            </h2>
          </RevealMask>
          <button
            type="button"
            onClick={toggleAll}
            aria-expanded={allOpen}
            className="shrink-0 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate transition-colors duration-300 hover:text-emerald"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <div className="mt-16">
          {items.map((faq, i) => {
            const isOpen = open.has(i);
            return (
              <Reveal key={faq.question} delay={Math.min(i * 0.03, 0.15)}>
                <div
                  className={`group border-b transition-colors duration-300 ${
                    isOpen ? "border-emerald/50" : "border-ink/15 hover:border-ink/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleOne(i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    className="flex w-full items-center justify-between gap-6 py-7 text-left"
                  >
                    <span className="flex min-w-0 items-baseline gap-4">
                      <span
                        aria-hidden
                        className={`shrink-0 font-mono text-[10px] tracking-[0.2em] transition-colors duration-300 ${
                          isOpen ? "text-emerald" : "text-slate/70"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")} / {total}
                      </span>
                      <span
                        className={
                          isOpen
                            ? "font-display text-xl font-normal text-emerald transition-colors duration-300 lg:text-2xl"
                            : "font-display text-xl font-light text-ink transition-colors duration-300 group-hover:text-ink/70 lg:text-2xl"
                        }
                      >
                        {faq.question}
                      </span>
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center border border-ink/25 text-ink transition-colors duration-300 group-hover:border-emerald/60 group-hover:text-emerald"
                    >
                      <Plus size={16} strokeWidth={1.5} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${i}`}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[65ch] pb-8 text-pretty text-[15px] leading-relaxed text-ink/65">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
