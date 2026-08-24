import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PageHero } from "@/components/sections/PageHero";
import { FarmlandMap } from "@/components/FarmlandMap";
import { DossierForm } from "@/components/DossierForm";
import { ChapterMarker } from "@/components/ui/ChapterMarker";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { getCategoryPage, getEnquiryOptions, getFarmlandOptions, getFarmlandProjects, getSiteSettings } from "@/sanity/queries";
import { buildMetadata } from "@/lib/metadata";
import { urlFor } from "@/sanity/image";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getCategoryPage("farmland"), getSiteSettings()]);
  if (!settings) return {};
  return buildMetadata(settings, "/farmlands", {
    title: page ? `${page.heroTitleLine1} ${page.heroTitleLine2 ?? ""}`.trim() : undefined,
    description: page?.heroBody,
  });
}

export default async function FarmlandsPage() {
  const [page, options, settings, budgets, projects] = await Promise.all([
    getCategoryPage("farmland"),
    getFarmlandOptions(),
    getSiteSettings(),
    getEnquiryOptions("budget"),
    getFarmlandProjects(),
  ]);

  if (!page) notFound();
  if (!settings) {
    throw new Error("siteSettings document is missing — check Sanity Studio");
  }

  const masterplan = projects[0] ?? page.masterplan;

  return (
    <>
      <PageHero eyebrow={page.heroEyebrow} title={<>{page.heroTitleLine1}<br />{page.heroTitleLine2}</>} seed="josh-farmlands"
        image={page.heroImage ? urlFor(page.heroImage).width(2400).height(1200).url() : undefined}>
        <p>{page.heroBody}</p>
      </PageHero>

      <section className="bg-paper">
        <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
          <Reveal><ChapterMarker kicker={page.masterplanKicker ?? ""} /></Reveal>
          <RevealMask delay={0.1}>
            <h2 className="mt-8 max-w-[18ch] text-balance font-display text-5xl font-light leading-[1.02] tracking-[-0.02em] text-ink lg:text-7xl">
              {page.masterplanHeading}
            </h2>
          </RevealMask>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-[58ch] text-pretty text-[16px] leading-relaxed text-ink/70">
              {page.masterplanBody}
            </p>
          </Reveal>
          {masterplan && (
            <Reveal delay={0.15} className="mt-12">
              <FarmlandMap masterplan={masterplan} />
            </Reveal>
          )}
        </div>
      </section>

      <section className="bg-stone">
        <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <Reveal><ChapterMarker kicker={page.holdingsKicker ?? ""} /></Reveal>
              <RevealMask delay={0.1}>
                <h2 className="mt-8 max-w-[18ch] text-balance font-display text-5xl font-light leading-[1.02] tracking-[-0.02em] text-ink lg:text-7xl">
                  {page.holdingsHeading}
                </h2>
              </RevealMask>
            </div>
            <Reveal delay={0.2}>
              <p className="eyebrow max-w-[30ch] text-slate">{page.holdingsNote}</p>
            </Reveal>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {options.map((o, i) => (
              <Reveal key={o.slug} delay={(i % 2) * 0.1}>
                <div className="group border border-ink/15 bg-paper">
                  <div className="vignette relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={o.image ? urlFor(o.image).width(1200).height(750).url() : `https://picsum.photos/seed/${o.slug}/1200/750`}
                      alt={`${o.name}, drone survey`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-[transform,filter] duration-[1600ms] ease-out group-hover:scale-[1.06] group-hover:brightness-[1.04]"
                    />
                  </div>
                  <div className="p-7">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-2xl font-light text-ink lg:text-3xl">{o.name}</h3>
                      <span className={o.status === "Available" ? "eyebrow text-emerald" : "eyebrow text-ink/40"}>
                        {o.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-ink/15 pt-5">
                      <div><p className="eyebrow text-slate">Area</p><p className="mt-1 text-[15px] text-ink">{o.area}</p></div>
                      <div><p className="eyebrow text-slate">Price</p><p className="mt-1 text-[15px] text-ink">{o.price}</p></div>
                      <div><p className="eyebrow text-slate">Holding</p><p className="mt-1 text-[15px] text-ink">{o.acres}</p></div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-16 px-6 py-24 sm:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-20 lg:py-32">
          <div>
            <Reveal><ChapterMarker kicker={page.dossierKicker ?? ""} /></Reveal>
            <RevealMask delay={0.1}>
              <h2 className="mt-8 text-balance font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] text-ink lg:text-6xl">
                {page.dossierHeading}
              </h2>
            </RevealMask>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-[50ch] text-pretty text-[16px] leading-relaxed text-ink/70">{page.dossierBody}</p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-6 text-[15px] leading-relaxed text-ink/50">
                Prefer to talk first? Call{" "}
                <a href={settings.phoneHref} className="text-emerald underline-offset-4 hover:underline">{settings.phone}</a>
                . A concierge answers, not a call centre.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <DossierForm holdings={options.map((o) => ({ slug: o.slug, name: o.name }))} budgets={budgets.map((b) => b.label)} whatsapp={settings.whatsapp} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
