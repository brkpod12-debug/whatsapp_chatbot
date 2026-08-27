import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { PropertyListing } from "@/components/PropertyListing";
import { getCategoryPage, getPropertiesByCategory, getSiteSettings } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import { buildMetadata, clampDescription } from "@/lib/metadata";
import { JsonLd, breadcrumbGraph } from "@/lib/schema";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getCategoryPage("villa"), getSiteSettings()]);
  if (!settings) return {};
  // The hero line is editorial ("Altitudes made private."). Search needs the
  // words buyers actually type, so the tag line stays on the page and the
  // title tag carries the keywords.
  const cta = ` Speak to Josh Properties, ${settings.city}.`;
  return buildMetadata(settings, "/villas", {
    title: `Villas for Sale in ${settings.city}`,
    description:
      clampDescription(page?.heroBody || "Independent villas and gated-community houses for sale in Hyderabad, each with the title chain verified before it is listed.", 158 - cta.length) + cta,
  });
}

export default async function VillasPage() {
  const [page, properties, settings] = await Promise.all([
    getCategoryPage("villa"),
    getPropertiesByCategory("villa"),
    getSiteSettings(),
  ]);

  if (!page) notFound();
  if (!settings) {
    throw new Error("siteSettings document is missing — check Sanity Studio");
  }

  return (
    <>
      <JsonLd
        data={breadcrumbGraph(settings, [{ name: "Villas", path: "/villas" }])}
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
        seed="josh-villas"
        image={page.heroImage ? urlFor(page.heroImage).width(1800).height(900).url() : undefined}
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
