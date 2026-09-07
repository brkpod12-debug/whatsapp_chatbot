import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { PropertyListing } from "@/components/PropertyListing";
import { DayNightCity } from "@/components/DayNightCity";
import { Reveal } from "@/components/motion/Reveal";
import { getCategoryPage, getPropertiesByCategory, getSiteSettings } from "@/sanity/queries";
import { buildMetadata, clampDescription } from "@/lib/metadata";
import { JsonLd, breadcrumbGraph } from "@/lib/schema";
import { urlFor } from "@/sanity/image";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getCategoryPage("apartment"), getSiteSettings()]);
  if (!settings) return {};
  // The hero line is editorial ("Altitudes made private."). Search needs the
  // words buyers actually type, so the tag line stays on the page and the
  // title tag carries the keywords.
  const cta = ` Speak to Josh Properties, ${settings.city}.`;
  return buildMetadata(settings, "/apartments", {
    title: `Flats & Apartments for Sale in ${settings.city}`,
    description:
      clampDescription(page?.heroBody || "2 and 3 BHK flats for sale in Pragathi Nagar, Nizampet and across Hyderabad, resale and brand new, each with the title chain verified.", 158 - cta.length) + cta,
  });
}

export default async function ApartmentsPage() {
  const [page, properties, settings] = await Promise.all([
    getCategoryPage("apartment"),
    getPropertiesByCategory("apartment"),
    getSiteSettings(),
  ]);

  if (!page) notFound();
  if (!settings) {
    throw new Error("siteSettings document is missing — check Sanity Studio");
  }

  return (
    <>
      <JsonLd
        data={breadcrumbGraph(settings, [{ name: "Apartments", path: "/apartments" }])}
      />
      <PageHero
        eyebrow={page.heroEyebrow}
        title={
          <>
            {page.heroTitleLine1}{" "}
            <br />
            {page.heroTitleLine2}
          </>
        }
        seed="josh-apartments"
        image={page.heroImage ? urlFor(page.heroImage).width(1800).height(900).url() : undefined}
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
              <h2 className="text-balance font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink lg:text-6xl">
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
