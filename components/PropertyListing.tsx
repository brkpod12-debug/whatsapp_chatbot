import type { Property } from "@/sanity/queries";
import { ChapterMarker } from "@/components/ui/ChapterMarker";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { PropertyCard } from "@/components/PropertyCard";

interface PropertyListingProps {
  kicker: string;
  heading: string;
  intro: string;
  items: Property[];
}

export function PropertyListing({
  kicker,
  heading,
  intro,
  items,
}: PropertyListingProps) {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <Reveal>
          <ChapterMarker kicker={kicker} />
        </Reveal>
        <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <RevealMask delay={0.1}>
            <h1 className="max-w-[16ch] text-balance font-display text-5xl font-light leading-[1.02] tracking-[-0.02em] text-ink lg:text-7xl">
              {heading}
            </h1>
          </RevealMask>
          <Reveal delay={0.2}>
            <p className="max-w-[46ch] text-pretty text-[15px] leading-relaxed text-ink/60">
              {intro}
            </p>
          </Reveal>
        </div>

        {items.length === 0 ? (
          <Reveal>
            <p className="mt-20 max-w-[42ch] border-t border-line pt-8 text-[15px] leading-relaxed text-ink/55">
              No entries under this head just now. The register moves quickly, so
              ask the desk what is due to be listed.
            </p>
          </Reveal>
        ) : (
          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 0.08}>
                <PropertyCard property={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
