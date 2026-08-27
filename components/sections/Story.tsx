import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { Parallax } from "@/components/motion/Parallax";
import { FolioWipe } from "@/components/motion/FolioWipe";
import { StampSeal } from "@/components/motion/StampSeal";
import { Seal } from "@/components/ui/Seal";
import type { HomePage } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";

export function Story({ copy }: { copy: HomePage["story"] }) {
  return (
    <section className="relative overflow-hidden bg-stone">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-16 px-6 py-28 sm:px-12 lg:grid-cols-2 lg:gap-24 lg:px-20 lg:py-40">
        <Reveal className="order-1">
          <div className="vignette relative aspect-[4/5] overflow-hidden rounded-[2px] lg:mr-24">
            <Parallax strength={6} className="absolute inset-[-12%]">
              <Image
                src={copy.image ? urlFor(copy.image).width(1000).height(1250).url() : "https://picsum.photos/seed/josh-story/1000/1250"}
                alt="Late-afternoon light across a surveyed farmland holding"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </Parallax>
          </div>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-slate">
            {copy.imageCaption}
          </p>
        </Reveal>

        <div className="order-2">
          <FolioWipe>
            <div className="relative border border-ink/15 bg-paper outline outline-1 outline-ink/10 outline-offset-[3px]">
              <div className="flex items-center justify-between gap-6 border-b border-ink/15 px-7 py-5 sm:px-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate">
                  {copy.folioLabel}
                </p>
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-slate sm:block">
                  {copy.verifiedLabel}
                </p>
              </div>

              <div className="relative px-7 py-10 sm:px-10">
                {/* Resting watermark: one revolution a minute, never a focal point */}
                <Seal className="animate-seal-turn pointer-events-none absolute -right-5 -top-5 h-44 w-44 text-emerald/[0.07]" />
                <RevealMask>
                  <h2 className="font-display text-4xl font-light leading-[1.02] tracking-[-0.02em] text-ink lg:text-5xl">
                    {copy.headingPlain}
                    <br />
                    <em className="italic text-champagne">{copy.headingItalic}</em>
                  </h2>
                </RevealMask>

                <Reveal delay={0.15}>
                  <p className="mt-8 max-w-[34ch] font-display text-2xl font-light italic leading-snug text-ink/80">
                    {copy.pullQuote}
                  </p>
                </Reveal>

                {copy.bodyParagraphs.map((para, i) => (
                  <Reveal key={i} delay={0.05 * (i + 1)}>
                    <p className={`${i === 0 ? "mt-8" : "mt-5"} max-w-[60ch] text-pretty text-[16px] leading-relaxed text-ink/70`}>
                      {para}
                    </p>
                  </Reveal>
                ))}

                <Reveal delay={0.45}>
                  <div className="mt-12 flex items-center justify-between gap-6 border-t border-ink/15 pt-8">
                    <div className="flex items-baseline gap-4">
                      <p className="font-display text-3xl font-light tracking-[0.18em]">
                        {copy.signoffName}
                      </p>
                      <p className="font-display text-sm italic text-slate">
                        {copy.signoffTitle}
                      </p>
                    </div>
                    {/* The sign-off seal presses once, as a notary would */}
                    <StampSeal className="h-14 w-14 shrink-0 text-emerald" />
                  </div>
                </Reveal>
              </div>
            </div>
          </FolioWipe>
        </div>
      </div>
    </section>
  );
}
