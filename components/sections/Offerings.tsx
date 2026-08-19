import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service, HomePage } from "@/sanity/queries";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { CounterRotate } from "@/components/motion/CounterRotate";

const hoverClass: Record<string, string> = {
  "/villas":
    "transition-[transform,filter] duration-[1400ms] ease-out group-hover:scale-[1.05] group-hover:brightness-[1.03]",
  "/apartments":
    "transition-[filter,transform] duration-[1400ms] ease-out group-hover:scale-[1.04] group-hover:brightness-[0.62]",
  "/farmlands":
    "transition-[transform,filter] duration-[1600ms] ease-out group-hover:scale-[1.08] group-hover:brightness-[1.05]",
};

const seeds: Record<string, string> = {
  "/villas": "josh-villas",
  "/apartments": "josh-apartments",
  "/farmlands": "josh-farmlands",
};

// Real film stills where we have them; everything else falls back to the seed.
const localImages: Record<string, string> = {
  "/villas": "/images/villa-01.jpg",
};

export function Offerings({ services, copy }: { services: Service[]; copy: HomePage["offerings"] }) {
  const featured = services.slice(0, 3);
  const advisory = services[3];

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-28 sm:px-12 lg:px-20 lg:py-40">
        <RevealMask>
          <h2 className="max-w-[18ch] text-balance font-display text-5xl font-light leading-[1.02] tracking-[-0.02em] text-ink lg:text-7xl">
            {copy.heading}
          </h2>
        </RevealMask>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-[58ch] text-pretty text-[16px] leading-relaxed text-ink/60">
            {copy.body}
          </p>
        </Reveal>

        <div className="mt-20 border-t border-ink/15 hover:[&_a:not(:hover)]:opacity-45">
          {featured.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.06}>
              <Link
                href={s.href}
                data-cursor="VIEW"
                className="group grid grid-cols-1 gap-8 border-b border-ink/15 py-10 transition-opacity duration-500 md:grid-cols-[auto_1fr_240px] md:items-center md:gap-10 lg:py-12"
              >
                <CounterRotate
                  direction={i % 2 === 0 ? 1 : -1}
                  className="font-display text-2xl font-light italic text-slate transition-colors duration-300 group-hover:text-emerald"
                >
                  {s.numeral}
                </CounterRotate>
                <div>
                  <h3 className="relative inline-block font-display text-3xl font-light text-ink transition-colors duration-300 group-hover:text-emerald lg:text-4xl">
                    {s.name}
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-emerald transition-transform duration-[320ms] ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                    />
                  </h3>
                  <p className="mt-3 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-ink/60">
                    {s.detail}
                  </p>
                </div>
                <div className="vignette relative order-first aspect-[4/3] overflow-hidden rounded-[2px] md:order-none">
                  <Image
                    src={localImages[s.href] ?? `https://picsum.photos/seed/${seeds[s.href]}/480/360`}
                    alt={s.name}
                    fill
                    sizes="240px"
                    className={`object-cover ${hoverClass[s.href] ?? ""}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon/55 via-transparent to-transparent" />
                </div>
              </Link>
            </Reveal>
          ))}

          {advisory && (
            <Reveal delay={0.1}>
              <Link
                href={advisory.href}
                data-cursor="ENQUIRE"
                className="wax-border group flex items-center justify-between gap-6 px-6 py-10 transition-opacity duration-500 lg:py-12"
              >
                <div>
                  <CounterRotate
                    direction={-1}
                    className="font-display text-2xl font-light italic text-slate transition-colors duration-300 group-hover:text-emerald"
                  >
                    {advisory.numeral}
                  </CounterRotate>
                  <h3 className="mt-3 font-display text-3xl font-light text-ink transition-colors duration-300 group-hover:text-emerald lg:text-4xl">
                    {advisory.name}
                  </h3>
                  <p className="mt-3 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-ink/60">
                    {advisory.detail}
                  </p>
                </div>
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald/40 text-emerald transition-all duration-300 group-hover:border-emerald group-hover:bg-emerald/10 sm:flex">
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.5}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
