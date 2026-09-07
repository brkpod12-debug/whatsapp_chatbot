import { ArrowRight } from "lucide-react";
import { ChapterMarker } from "@/components/ui/ChapterMarker";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { SurveyorTape } from "@/components/SurveyorTape";
import type { HomePage } from "@/sanity/queries";

export function FarmlandBand({ copy }: { copy: HomePage["farmlandBand"] }) {
  return (
    <section className="bg-carbon">
      <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-28 sm:px-12 lg:px-20 lg:pt-36">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Reveal>
              <ChapterMarker kicker="The farmland" tone="dark" />
            </Reveal>
            <RevealMask delay={0.1}>
              <h2 className="mt-8 max-w-[18ch] text-balance font-display text-5xl leading-[1.02] tracking-[-0.02em] text-paper lg:text-7xl">
                {copy.heading}
              </h2>
            </RevealMask>
          </div>
          <Reveal delay={0.2}>
            <a
              href="/farmlands"
              className="group inline-flex items-center gap-3 border border-emerald/40 px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-emerald transition-colors duration-300 hover:bg-emerald/10"
            >
              {copy.ctaLabel}
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </Reveal>
        </div>
      </div>

      {/* The tape runs full-bleed: it is pinned and dragged horizontally on
          desktop, so it must not sit inside the page's max-width gutter. */}
      <div className="px-6 pb-28 sm:px-12 md:px-0 md:pb-0 lg:px-0">
        <SurveyorTape grounds={copy.grounds} />
      </div>
    </section>
  );
}
