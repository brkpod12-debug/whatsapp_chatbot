import Link from "next/link";
import type { Property, HomePage } from "@/sanity/queries";
import { ChapterMarker } from "@/components/ui/ChapterMarker";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { RegistryRule } from "@/components/motion/RegistryRule";
import { PropertyCard } from "@/components/PropertyCard";

export function Featured({ properties, copy }: { properties: Property[]; copy: HomePage["featured"] }) {
  const [first, second, third] = properties;

  return (
    <section id="collection" className="bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-28 sm:px-12 lg:px-20 lg:py-40">
        <Reveal>
          <ChapterMarker kicker="The collection" />
        </Reveal>
        <RevealMask delay={0.1}>
          <h2 className="mt-8 max-w-[26ch] text-balance font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink lg:text-6xl">
            {copy.heading}
          </h2>
        </RevealMask>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-[58ch] text-pretty text-[16px] leading-relaxed text-ink/60">
            {copy.body}
          </p>
        </Reveal>

        {/* Sibling-dim: hovering one folio recedes the others, so the desk only
            ever has one document under the lamp. See .folio-desk in globals.css. */}
        <div className="folio-desk mt-20 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {first && (
            <Reveal className="lg:col-span-7">
              <PropertyCard property={first} large />
            </Reveal>
          )}
          <div className="flex flex-col gap-8 lg:col-span-5 lg:gap-14">
            {second && (
              <Reveal delay={0.1}>
                <PropertyCard property={second} />
              </Reveal>
            )}
            {third && (
              <Reveal delay={0.15} className="lg:ml-16">
                <PropertyCard property={third} />
              </Reveal>
            )}
          </div>
        </div>

        <RegistryRule className="mt-20" />
        <Reveal delay={0.1}>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-10">
            {[
              { label: "All villas", href: "/villas" },
              { label: "All apartments", href: "/apartments" },
              { label: "All farmlands", href: "/farmlands" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="eyebrow group flex min-h-11 items-center gap-2 text-slate transition-colors hover:text-emerald"
              >
                {l.label}
                <span className="h-px w-8 bg-slate/50 transition-all duration-300 group-hover:w-14 group-hover:bg-emerald" />
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
