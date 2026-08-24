import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { PropertyListing } from "@/components/PropertyListing";
import { getCategoryPage, getPropertiesByCategory, getSiteSettings } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getCategoryPage("villa"), getSiteSettings()]);
  if (!settings) return {};
  return buildMetadata(settings, "/villas", {
    title: page ? `${page.heroTitleLine1} ${page.heroTitleLine2 ?? ""}`.trim() : undefined,
    description: page?.heroBody,
  });
}

export default async function VillasPage() {
  const [page, properties] = await Promise.all([
    getCategoryPage("villa"),
    getPropertiesByCategory("villa"),
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
        seed="josh-villas"
        image={page.heroImage ? urlFor(page.heroImage).width(2400).height(1200).url() : undefined}
      >
        <p>{page.heroBody}</p>
      </PageHero>
      <PropertyListing
        kicker={page.listingKicker}
        heading={page.listingHeading}
        intro={page.listingIntro}
        items={properties}
      />
    </>
  );
}
