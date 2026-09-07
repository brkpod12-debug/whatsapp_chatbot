"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Property } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import { Stamp } from "@/components/ui/Stamp";
import { CurtainReveal } from "@/components/motion/CurtainReveal";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const imageHover: Record<Property["category"], string> = {
  villa:
    "transition-[transform,filter] duration-[900ms] ease-out group-hover:scale-[1.045] group-hover:brightness-[1.02]",
  apartment:
    "transition-[filter,transform] duration-[900ms] ease-out group-hover:scale-[1.045] group-hover:brightness-[0.7]",
  farmland:
    "transition-[transform,filter] duration-[1400ms] ease-out group-hover:scale-[1.07] group-hover:brightness-[1.05]",
};

interface PropertyCardProps {
  property: Property;
  large?: boolean;
  className?: string;
}

export function PropertyCard({ property, large, className }: PropertyCardProps) {
  const ratio = large ? "aspect-[4/5]" : "aspect-[4/3]";
  const dim = property.tall || large ? 1200 : 900;
  const src = property.image
    ? urlFor(property.image).width(dim).height(dim).url()
    : `https://picsum.photos/seed/${property.slug}/${dim}/${dim}`;
  const reduce = useReducedMotion();

  // Brass spotlight follows the pointer inside the frame. Written straight to
  // CSS custom properties on the element and rAF-coalesced, so a pointermove
  // storm never triggers a React render or a layout read per frame.
  const frame = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (reduce || e.pointerType !== "mouse") return;
      const el = frame.current;
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
    <Link
      href={`/properties/${property.slug}`}
      className={cn(
        "folio-item group block transition-transform duration-300 ease-out active:scale-[0.985]",
        className
      )}
    >
      <div
        ref={frame}
        onPointerMove={onPointerMove}
        className="relative overflow-hidden rounded-[2px] bg-carbon shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-shadow duration-500 ease-out group-hover:shadow-[0_1px_0_rgba(0,0,0,0.04),0_30px_60px_-20px_rgba(0,0,0,0.25)]"
      >
        <div className={cn("relative", ratio)}>
          <CurtainReveal className="absolute inset-0">
            <Image
              src={src}
              alt={`${property.title} - ${property.area}, ${property.location}`}
              fill
              sizes={large ? "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 60vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
              className={cn("object-cover", imageHover[property.category])}
            />
          </CurtainReveal>
        </div>

        {property.category === "apartment" && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_110%,rgba(10,10,9,0.95)_0%,rgba(10,10,9,0.35)_45%,transparent_70%)] opacity-0 transition-opacity duration-1000 ease-out group-hover:opacity-100" />
        )}

        {/* Pointer-tracked brass spotlight, above the image but under the type */}
        {!reduce && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(200px 200px at var(--mx, 50%) var(--my, 50%), var(--gold-glow), transparent 70%)",
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon/95 via-carbon/35 via-50% to-transparent" />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="absolute left-0 right-0 top-4 flex justify-between px-5"
        >
          <Stamp
            label={property.status}
            tone={
              property.status === "Available"
                ? "available"
                : property.status === "Sold"
                  ? "sold"
                  : "reserved"
            }
          />
          <span className="stamp flex items-center border border-brass/60 bg-carbon/40 px-2.5 py-1 text-brass">
            Folio {property.folio}
          </span>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.5, ease }}
          className="absolute bottom-0 left-0 right-0 p-6"
        >
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.58, ease }}
            className="eyebrow text-emerald"
          >
            {property.location}
          </motion.p>
          <motion.h3
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: 0.66, ease }}
            className="mt-2 font-display text-3xl text-paper transition-transform duration-300 ease-out group-hover:translate-x-[5px]"
          >
            {property.title}
          </motion.h3>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.74, ease }}
            className="mt-2 flex items-center gap-2 text-[15px] text-paper/80"
          >
            {property.price} · {property.area}
            <ArrowUpRight
              size={15}
              strokeWidth={1.5}
              className="text-emerald transition-transform duration-300 ease-out group-hover:translate-x-[4px] group-hover:-translate-y-[4px]"
            />
          </motion.p>
        </motion.div>
      </div>
    </Link>
  );
}
