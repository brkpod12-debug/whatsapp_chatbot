import type { Metadata } from "next";
import { urlFor } from "@/sanity/image";
import type { SiteSettings } from "@/sanity/queries";
import { clampDescription } from "@/lib/seo";

export { clampDescription, locality } from "@/lib/seo";

const FALLBACK_SITE = "https://www.joshproperties.co.in";

export function siteBase(settings: SiteSettings): URL {
  return new URL(settings.siteUrl || FALLBACK_SITE);
}

export function buildMetadata(
  settings: SiteSettings,
  path: string,
  overrides?: Metadata
): Metadata {
  const base = siteBase(settings);
  const siteName = settings.name || "Josh Properties";
  const defaultTitle = `${siteName} | Private Real Estate Advisory in ${settings.city}`;
  const description = clampDescription(settings.metaDescription || settings.position || "");
  const ogImage = settings.ogImage
    ? urlFor(settings.ogImage).width(1200).height(630).url()
    : undefined;

  const clear = (
    overrides && Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined))
  ) as Metadata | undefined;

  const resolvedDescription =
    typeof clear?.description === "string" ? clampDescription(clear.description) : description;

  const resolvedOg = {
    type: "website",
    locale: "en_IN",
    siteName,
    url: new URL(path || "/", base).toString(),
    title: (clear?.openGraph?.title as string) ?? (clear?.title as string) ?? settings.ogTitle ?? defaultTitle,
    description:
      (clear?.openGraph?.description as string) ??
      settings.ogDescription ??
      resolvedDescription,
    images: clear?.openGraph?.images ?? (ogImage ? [{ url: ogImage }] : []),
  };

  return {
    metadataBase: base,
    title: { default: defaultTitle, template: `%s | ${siteName}` },
    keywords: settings.keywords || [],
    alternates: { canonical: clear?.alternates?.canonical ?? (path || "/") },
    robots: clear?.robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    verification: settings.googleSiteVerification
      ? { google: settings.googleSiteVerification }
      : undefined,
    ...clear,
    // After the spread: page overrides supply the raw text, we publish the
    // clamped one.
    description: resolvedDescription,
    openGraph: resolvedOg,
    twitter: {
      card: "summary_large_image",
      title: resolvedOg.title,
      description: resolvedOg.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
