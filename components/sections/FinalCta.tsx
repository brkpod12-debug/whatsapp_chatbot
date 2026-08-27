"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Seal } from "@/components/ui/Seal";
import { Reveal } from "@/components/motion/Reveal";
import { SlowZoom } from "@/components/motion/SlowZoom";
import type { HomePage } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";

export function FinalCta({
  copy, phone, phoneHref, whatsapp, reraNumber,
}: {
  copy: HomePage["finalCta"]; phone: string; phoneHref: string; whatsapp: string; reraNumber: string;
}) {
  const reduce = useReducedMotion();

  return (
    <section id="enquire" className="relative overflow-hidden bg-graphite">
      {/* Cinematic backdrop: faint architecture, slow zoom, dusk gradient */}
      <div className="absolute inset-0">
        <SlowZoom>
          <Image
            src={copy.image ? urlFor(copy.image).width(1920).url() : "/images/villa-06.jpg"}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
        </SlowZoom>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,7,0.9)] via-[rgba(8,8,7,0.55)] to-[rgba(8,8,7,0.35)]" />
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[860px] -translate-x-1/2 -translate-y-1/3 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(193,163,109,0.3), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1440px] px-6 py-32 text-center sm:px-12 lg:px-20 lg:py-48">
        <Reveal delay={0.05}>
          <Seal className="mx-auto h-16 w-16 text-emerald/85" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto mt-8 max-w-[18ch] text-balance font-display text-5xl font-light leading-[1.02] tracking-[-0.02em] text-paper lg:text-7xl">
            {copy.headingPlain}{" "}
            <span className="text-emerald">{copy.headingEmphasis}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-[52ch] text-pretty text-lg leading-relaxed text-paper/60">
            {copy.body}
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <MagneticButton href="/contact" className="w-full sm:w-auto">
              <Button
                href="/contact"
                variant="filled"
                size="lg"
                data-cursor="ENQUIRE"
                className="group w-full sm:w-auto"
              >
                {copy.ctaEnquireLabel}
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>
            </MagneticButton>
            <MagneticButton href={phoneHref} className="w-full sm:w-auto">
              <Button
                href={phoneHref}
                variant="outline"
                size="lg"
                className="w-full border-emerald/50 text-emerald hover:bg-emerald/10 sm:w-auto"
              >
                <Phone size={16} strokeWidth={1.5} />
                {phone}
              </Button>
            </MagneticButton>
            <MagneticButton href={whatsapp} className="w-full sm:w-auto">
              <Button
                href={whatsapp}
                variant="ghost"
                size="lg"
                className="w-full text-paper/70 hover:text-emerald sm:w-auto"
              >
                <MessageCircle size={16} strokeWidth={1.5} />
                {copy.ctaWhatsappLabel}
              </Button>
            </MagneticButton>
          </div>
        </Reveal>
        <Reveal delay={0.4}>
          <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center justify-between gap-3 border-t border-paper/15 pt-8 sm:flex-row sm:gap-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/65">
              {copy.founded}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/65">
              {copy.byAppointment}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/65">
              RERA {reraNumber}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
