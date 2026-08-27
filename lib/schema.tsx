import type { Faq, Property, SiteSettings } from "@/sanity/queries";

/**
 * Structured data for the register. One place, because the same business
 * identity has to agree across every page Google indexes: the sitewide
 * Organization/RealEstateAgent node, per-page breadcrumbs, per-property
 * listings, and the home FAQ block.
 */

type Json = Record<string, unknown>;

/** Renders a JSON-LD block. `<` is escaped so a stray `</script>` can't break out. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}

export function baseUrl(settings: SiteSettings) {
  return (settings.siteUrl || "https://www.joshproperties.co.in").replace(/\/$/, "");
}

/** Organization + WebSite + RealEstateAgent, as one connected graph. */
export function organizationGraph(settings: SiteSettings, logoUrl?: string): Json[] {
  const base = baseUrl(settings);
  const sameAs = (settings.socialLinks ?? [])
    .filter((s) => s.enabled !== false && s.href)
    .map((s) => s.href);

  const address = {
    "@type": "PostalAddress",
    streetAddress: settings.org?.streetAddress || "",
    addressLocality: settings.org?.addressLocality || settings.city,
    addressRegion: settings.state,
    postalCode: settings.org?.postalCode || "",
    addressCountry: "IN",
  };

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: settings.name,
      legalName: settings.legalName,
      url: base,
      logo: logoUrl ? { "@type": "ImageObject", url: logoUrl } : undefined,
      telephone: settings.phone,
      email: settings.email,
      address,
      foundingDate: settings.org?.foundingYear || "2017",
      sameAs: sameAs.length ? sameAs : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}#website`,
      url: base,
      name: settings.name,
      publisher: { "@id": `${base}#organization` },
      inLanguage: "en-IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "@id": `${base}#agency`,
      name: settings.name,
      legalName: settings.legalName,
      description: settings.metaDescription || settings.position,
      url: base,
      image: logoUrl,
      logo: logoUrl,
      parentOrganization: { "@id": `${base}#organization` },
      address,
      telephone: settings.phone,
      email: settings.email,
      openingHours: settings.org?.openingHours || undefined,
      priceRange: settings.org?.priceRange || "₹₹₹",
      areaServed: [settings.city, settings.state, ...(settings.footerGroundsLinks ?? [])]
        .filter(Boolean)
        .map((n) => ({ "@type": "Place", name: n })),
      sameAs: sameAs.length ? sameAs : undefined,
    },
  ];
}

export function breadcrumbGraph(
  settings: SiteSettings,
  trail: { name: string; path: string }[]
): Json {
  const base = baseUrl(settings);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${base}${c.path === "/" ? "" : c.path}`,
    })),
  };
}

const CATEGORY_TYPE: Record<Property["category"], string> = {
  villa: "SingleFamilyResidence",
  apartment: "Apartment",
  farmland: "LandForm",
};

const AVAILABILITY: Record<Property["status"], string> = {
  Available: "https://schema.org/InStock",
  Limited: "https://schema.org/LimitedAvailability",
  "Under Offer": "https://schema.org/InStock",
  Reserved: "https://schema.org/PreOrder",
  Sold: "https://schema.org/SoldOut",
  "Coming Soon": "https://schema.org/PreOrder",
};

/** Digits only, so "₹1.45 Cr" and "₹95 L" both resolve to rupees. */
export function parsePriceInr(price: string): number | undefined {
  const m = price.replace(/,/g, "").match(/([\d.]+)\s*(cr|crore|l|lakh|lac)?/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return undefined;
  const unit = (m[2] || "").toLowerCase();
  if (unit.startsWith("cr")) return Math.round(n * 1e7);
  if (unit.startsWith("l")) return Math.round(n * 1e5);
  return Math.round(n);
}

export function propertyGraph(
  settings: SiteSettings,
  property: Property,
  imageUrl?: string
): Json {
  const base = baseUrl(settings);
  const url = `${base}/properties/${property.slug}`;
  const amount = parsePriceInr(property.price);

  return {
    "@context": "https://schema.org",
    "@type": ["Product", "RealEstateListing"],
    "@id": `${url}#listing`,
    name: property.title,
    description: property.seo?.description || property.short,
    url,
    image: imageUrl ? [imageUrl] : undefined,
    sku: property.folio,
    category: property.category,
    brand: { "@id": `${base}#organization` },
    additionalProperty: property.specs.map((s) => ({
      "@type": "PropertyValue",
      name: s.label,
      value: s.value,
    })),
    about: {
      "@type": CATEGORY_TYPE[property.category],
      name: property.title,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.location.trim(),
        addressRegion: settings.state,
        addressCountry: "IN",
      },
      floorSize: property.area
        ? { "@type": "QuantitativeValue", name: property.area }
        : undefined,
      numberOfRooms: property.beds || undefined,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      // Sanity stores display strings ("₹1.45 Cr"); publish the numeric rupee
      // value when it parses, and fall back to the text otherwise.
      ...(amount ? { price: amount } : { priceSpecification: { "@type": "PriceSpecification", description: property.price } }),
      availability: AVAILABILITY[property.status] ?? "https://schema.org/InStock",
      seller: { "@id": `${base}#agency` },
    },
  };
}

export function faqGraph(items: Faq[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
