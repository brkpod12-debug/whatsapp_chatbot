import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import {
  getProperty,
  getPropertiesByLocation,
  getPropertyPage,
  getPropertySlugs,
  getSiteSettings,
} from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import { buildMetadata, clampDescription, locality } from "@/lib/metadata";
import { JsonLd, breadcrumbGraph, propertyGraph } from "@/lib/schema";
import { getYouTubeId } from "@/lib/youtube";
import { VideoFacade } from "@/components/VideoFacade";
import { videoById, videoObject } from "@/lib/videos";
import type { Property } from "@/sanity/queries";
import { PageHero } from "@/components/sections/PageHero";
import { Gallery } from "@/components/Gallery";
import { PropertyCard } from "@/components/PropertyCard";
import { ChapterMarker } from "@/components/ui/ChapterMarker";
import { Seal } from "@/components/ui/Seal";
import { Stamp } from "@/components/ui/Stamp";
import { Reveal } from "@/components/motion/Reveal";
import { RevealMask } from "@/components/motion/RevealMask";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getPropertySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [property, settings] = await Promise.all([getProperty(slug), getSiteSettings()]);
  if (!settings) return { title: "Property · Josh Properties" };
  if (!property) return { title: "Property · Josh Properties" };
  const ogImage = property.seo?.ogImage ?? property.image;
  const { title, description } = seoCopy(property, settings.city);
  return buildMetadata(settings, `/properties/${slug}`, {
    title,
    description,
    openGraph: {
      images: ogImage ? [{ url: urlFor(ogImage).width(1200).height(630).url() }] : undefined,
    },
    robots: property.seo?.noIndex ? { index: false, follow: false } : undefined,
  });
}

/** What buyers actually type into Google, per category. */
const CATEGORY_NOUN: Record<Property["category"], string> = {
  villa: "Villa",
  apartment: "Flat",
  farmland: "Farm Land",
};

const CATEGORY_LIST: Record<Property["category"], { name: string; path: string }> = {
  villa: { name: "Villas", path: "/villas" },
  apartment: { name: "Apartments", path: "/apartments" },
  farmland: { name: "Farmlands", path: "/farmlands" },
};

/** Keyword-led title and a description that always keeps its call to action. */
function seoCopy(property: Property, city: string) {
  const noun = CATEGORY_NOUN[property.category];
  const place = locality(property.location, city);
  const beds = property.beds ? `${property.beds} ` : "";
  // Listing names usually already carry the locality ("Nizampet Resale I").
  // Repeating it costs ~15 characters of a 60-character title for nothing.
  const namesPlace = property.title.toLowerCase().includes(place.toLowerCase());
  const title =
    property.seo?.title ||
    `${property.title}: ${beds}${noun}${namesPlace ? "" : ` in ${place}`}`;

  const cta = ` Enquire with Josh Properties, ${city}.`;
  const facts = [property.beds, property.area, property.price].filter(Boolean).join(" · ");
  const description =
    property.seo?.description ||
    clampDescription(
      `${beds}${noun} for sale in ${place}, ${city}. ${facts}. ${property.short}`,
      158 - cta.length
    ) + cta;

  return { title, description };
}

const quickFactKeys = ["approval", "condition", "facing", "floor", "age", "ventilation"];

function stampTone(property: Property) {
  if (property.status === "Available") return "available";
  if (property.status === "Sold") return "sold";
  return "reserved";
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params;
  const [property, settings, pageCopy] = await Promise.all([
    getProperty(slug),
    getSiteSettings(),
    getPropertyPage(),
  ]);
  if (!property) notFound();
  if (!settings) {
    throw new Error("siteSettings document is missing — check Sanity Studio");
  }
  const sameGround = (await getPropertiesByLocation(property.location)).filter((p) => p.slug !== slug);
  const inGround = sameGround.slice(0, 3);
  const groundCount = sameGround.length + 1;

  const copy = {
    walkthroughKicker: "Walk through",
    walkthroughHeading: "Drag through the property.",
    videoKicker: "On film",
    videoHeading: "The walkthrough, in motion.",
    storyKicker: "The story",
    storyHeading: "Why this property exists.",
    factsKicker: "The facts",
    titleChainNote:
      "The full chain of title, revenue records and survey maps are provided to serious enquirers before any payment is discussed.",
    enquireLabel: "Enquire about this property",
    factsOriginLabel: "Ground holdings",
    groundHeading: "Also in this ground",
    alsoHeading: "If this is almost right.",
    viewFullListLabel: "View the full list",
    imageNote: undefined,
    photosLabel: "Photographs",
    photosNote: "On request from the Private Advisory",
    // Sanity returns "" for a field an editor cleared rather than deleted, and
    // a plain spread lets that empty string beat the default, blanking the
    // label on every property page. Only non-empty values override.
    ...Object.fromEntries(
      Object.entries(pageCopy ?? {}).filter(
        ([, value]) => !(typeof value === "string" && value.trim() === "")
      )
    ),
  };

  const videoId = getYouTubeId(property.youtubeUrl);
  // VideoObject needs an upload date; only videos we track in lib/videos.ts have one.
  const knownVideo = videoId ? videoById(videoId) : undefined;

  const heroUrl = property.image ? urlFor(property.image).width(1800).height(900).url() : undefined;
  const galleryImages =
    property.gallery && property.gallery.length > 0
      ? property.gallery.map((img, i) => ({
          src: urlFor(img).width(1600).height(1000).url(),
          alt: `${property.title}${i === 0 ? ", main view" : `, view ${i + 1}`}`,
        }))
      : property.image
        ? [{ src: heroUrl ?? "", alt: `${property.title}, main view` }]
        : [];
  const hasPhotos = galleryImages.length > 0;

  const listHref =
    property.category === "villa" ? "/villas" : property.category === "apartment" ? "/apartments" : "/farmlands";

  const quickFacts = property.specs.filter((s) =>
    quickFactKeys.some((k) => s.label.toLowerCase().includes(k))
  );

  const list = CATEGORY_LIST[property.category];

  return (
    <>
      <JsonLd
        data={[
          propertyGraph(settings, property, heroUrl),
          breadcrumbGraph(settings, [
            list,
            { name: property.title, path: `/properties/${property.slug}` },
          ]),
        ]}
      />
      <PageHero
        eyebrow={`${property.category} · ${property.location.trim()}`}
        title={property.title}
        seed={`${property.slug}-hero`}
        image={heroUrl}
        wide
      >
        <div className="w-full">
          <div className="flex flex-col gap-8 pt-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-[54ch] text-pretty text-lg leading-relaxed text-paper/75">{property.short}</p>
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <Stamp label={property.status} tone={stampTone(property)} />
                <span className="stamp border border-paper/25 bg-carbon/40 px-2.5 py-1 text-paper/70">
                  Folio {property.folio}
                </span>
              </div>
              <p className="mt-3 font-display text-4xl text-paper lg:text-5xl">{property.price}</p>
              <p className="mt-1 text-right font-mono text-[12px] uppercase tracking-[0.2em] text-paper/60">
                {[property.beds, property.area].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </PageHero>

      <section className="bg-paper py-16 lg:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Reveal>
                <ChapterMarker kicker={copy.walkthroughKicker} />
              </Reveal>
              <RevealMask delay={0.1}>
                <h2 className="mt-6 max-w-[20ch] text-balance font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink lg:text-5xl">
                  {copy.walkthroughHeading}
                </h2>
              </RevealMask>
            </div>
            {quickFacts.length > 0 && (
              <Reveal delay={0.15}>
                <dl className="grid grid-cols-3 gap-x-8 gap-y-2">
                  {quickFacts.map((f) => (
                    <div key={f.label} className="border-l border-ink/15 pl-4">
                      <dt className="stamp text-slate">{f.label}</dt>
                      <dd className="mt-1 text-[15px] font-light text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}
          </div>

          {hasPhotos ? (
            <Reveal delay={0.2} className="mt-10">
              <Gallery images={galleryImages} className="lg:px-0" />
              {copy.imageNote && (
                <p className="stamp mt-4 text-ink/60">{copy.imageNote}</p>
              )}
            </Reveal>
          ) : (
            <Reveal delay={0.2} className="mt-10">
              <div className="vignette relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-carbon lg:aspect-[21/9]">
                <Seal className="h-28 w-28 text-paper/[0.1]" />
                <div className="absolute bottom-6 left-6 max-w-[80%]">
                  <p className="stamp text-emerald">{copy.photosLabel}</p>
                  <p className="stamp mt-1 text-paper/70">{copy.photosNote}</p>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {videoId && (
        <section className="bg-stone">
          <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
            <Reveal>
              <ChapterMarker kicker={copy.videoKicker} />
            </Reveal>
            <RevealMask delay={0.1}>
              <h2 className="mt-6 text-balance font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink lg:text-5xl">
                {copy.videoHeading}
              </h2>
            </RevealMask>
            <Reveal delay={0.2} className="mt-10">
              {knownVideo && <JsonLd data={{ "@context": "https://schema.org", ...videoObject(knownVideo) }} />}
              <VideoFacade
                videoId={videoId}
                title={`${property.title} walkthrough`}
                alt={`${property.title} video walkthrough, ${property.location}`}
              />
            </Reveal>
          </div>
        </section>
      )}

      <section className="bg-stone">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-16 px-6 py-16 sm:px-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24 lg:px-20 lg:py-24">
          <div>
            <Reveal>
              <ChapterMarker kicker={copy.storyKicker} />
            </Reveal>
            <RevealMask delay={0.1}>
              <h2 className="mt-6 text-balance font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink lg:text-5xl">
                {copy.storyHeading}
              </h2>
            </RevealMask>
            <div className="mt-8 space-y-5">
              {property.narrative.map((para, i) => (
                <Reveal key={i} delay={0.05 * i}>
                  <p className="max-w-[64ch] text-pretty text-[17px] leading-relaxed text-ink/75">{para}</p>
                </Reveal>
              ))}
            </div>

            {(
              <Reveal delay={0.2} className="mt-10">
                <div className="border-t border-ink/15 pt-8">
                  <p className="eyebrow text-slate">{copy.factsOriginLabel}</p>
                  <p className="mt-3 font-display text-2xl text-ink">
                    {property.location.trim()}
                  </p>
                  <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-ink/60">
                    This ground currently holds {groundCount} listed propert{groundCount === 1 ? "y" : "ies"} on the open roster.
                  </p>
                </div>
              </Reveal>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <div className="border border-ink/15 bg-paper">
                <div className="flex items-center justify-between border-b border-ink/15 px-7 py-5">
                  <p className="eyebrow text-slate">{copy.factsKicker}</p>
                  <span className="stamp text-slate">
                    {property.location.trim()} · {settings.city}
                  </span>
                </div>
                {property.specs.length > 0 ? (
                  <dl className="divide-y divide-ink/10 px-7 py-2">
                    {/* No wrapper element between <dl> and its <dt>/<dd>: the
                        list is revealed as a whole, one level up. */}
                    {property.specs.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-baseline justify-between gap-6 py-4 transition-colors duration-300 hover:bg-mist/50"
                      >
                        <dt className="text-[13px] uppercase tracking-[0.12em] text-ink/60">{s.label}</dt>
                        <dd className="text-right font-display text-lg text-ink">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="px-7 py-10">
                    <p className="text-[15px] leading-relaxed text-ink/60">
                      The private details arrive with the full dossier, on enquiry.
                    </p>
                  </div>
                )}
                <div className="border-t border-ink/15 p-7">
                  <p className="text-[14px] leading-relaxed text-ink/60">{copy.titleChainNote}</p>
                  <div className="mt-6 flex flex-col gap-3">
                    <MagneticButton href="/contact">
                      <Button
                        href="/contact"
                        variant="filled"
                        className="group w-full justify-center"
                      >
                        {copy.enquireLabel}
                        <ArrowRight
                          size={16}
                          strokeWidth={1.5}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </Button>
                    </MagneticButton>
                    <MagneticButton href={settings.phoneHref}>
                      <Button href={settings.phoneHref} variant="outline" className="w-full justify-center">
                        <Phone size={15} strokeWidth={1.5} />
                        {settings.phone}
                      </Button>
                    </MagneticButton>
                  </div>
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      {inGround.length > 0 && (
        <section className="bg-paper">
          <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div>
                <Reveal>
                  <ChapterMarker kicker={copy.groundHeading} />
                </Reveal>
                <RevealMask delay={0.1}>
                  <h2 className="mt-6 text-balance font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink lg:text-5xl">
                    {copy.alsoHeading}
                  </h2>
                </RevealMask>
              </div>
              <Reveal delay={0.2}>
                <Link
                  href={listHref}
                  className="link-underline eyebrow group flex min-h-11 items-center gap-2 whitespace-nowrap text-slate transition-colors hover:text-emerald"
                >
                  {copy.viewFullListLabel}
                  <span className="h-px w-8 bg-slate/50 transition-all duration-300 group-hover:w-14 group-hover:bg-emerald" />
                </Link>
              </Reveal>
            </div>
            <div className={cn("mt-12 grid grid-cols-1 gap-8", inGround.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1")}>
              {inGround.map((p) => (
                <Reveal key={p.slug}>
                  <PropertyCard property={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}