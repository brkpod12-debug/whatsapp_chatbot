import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { PropertyListing } from "@/components/PropertyListing";
import { DayNightCity } from "@/components/DayNightCity";
import { Reveal } from "@/components/motion/Reveal";
import { getCategoryPage, getPropertiesByCategory, getSiteSettings } from "@/sanity/queries";
import { buildMetadata } from "@/lib/metadata";
import { urlFor } from "@/sanity/image";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getCategoryPage("apartment"), getSiteSettings()]);
  if (!settings) return {};
  return buildMetadata(settings, "/apartments", {
    title: page ? `${page.heroTitleLine1} ${page.heroTitleLine2 ?? ""}`.trim() : undefined,
    description: page?.heroBody,
  });
}

export default async function ApartmentsPage() {
  const [page, properties] = await Promise.all([
    getCategoryPage("apartment"),
    getPropertiesByCategory("apartment"),
  ]);

  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow={page.heroEyebrow}
        title={
          <>
            {page.heroTitleLine1}
            <br />
            {page.heroTitleLine2}
          </>
        }
        seed="josh-apartments"
        image={page.heroImage ? urlFor(page.heroImage).width(2400).height(1200).url() : undefined}
      >
        <p>{page.heroBody}</p>
      </PageHero>

      <section className="bg-stone">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-16 px-6 py-24 sm:px-12 lg:grid-cols-2 lg:gap-24 lg:px-20 lg:py-32">
          <Reveal>
            <DayNightCity
              image={page.outlookImage ? urlFor(page.outlookImage).width(1200).height(750).url() : undefined}
              kicker={page.outlookKicker}
              intro={page.outlookNote}
            />
          </Reveal>
          <div>
            <Reveal>
              <h2 className="text-balance font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] text-ink lg:text-6xl">
                {page.outlookHeading}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-[52ch] text-pretty text-[16px] leading-relaxed text-ink/70">
                {page.outlookBody1}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-[52ch] text-pretty text-[16px] leading-relaxed text-ink/70">
                {page.outlookBody2}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <PropertyListing
        kicker={page.listingKicker}
        heading={page.listingHeading}
        intro={page.listingIntro}
        items={properties}
      />
    </>
  );
}
