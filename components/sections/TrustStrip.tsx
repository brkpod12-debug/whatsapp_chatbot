import type { PartnerLogo } from "@/sanity/queries";

export function TrustStrip({ logos }: { logos: PartnerLogo[] }) {
  const doubled = [...logos, ...logos];
  return (
    <section aria-label="Grounds across Hyderabad" className="border-y border-ink/15 bg-stone">
      <div className="group relative overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-16 pr-16 group-hover:[animation-play-state:paused]">
          {doubled.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              aria-hidden={i >= logos.length}
              className="group/item relative flex items-baseline gap-3"
            >
              <span className="font-display text-xl font-medium tracking-tight text-ink/60 transition-colors duration-300 hover:text-ink/85">
                {logo.name}
              </span>
              <span
                className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55 transition-colors duration-300 group-hover/item:text-ink/60 md:inline"
              >
                {logo.note}
              </span>
              <span
                aria-hidden
                className="absolute -bottom-1.5 left-0 h-px w-full origin-right scale-x-0 bg-emerald/70 transition-transform duration-300 ease-out group-hover/item:origin-left group-hover/item:scale-x-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
