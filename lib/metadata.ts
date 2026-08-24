import type { Metadata } from "next";
import { urlFor } from "@/sanity/image";
import type { SiteSettings } from "@/sanity/queries";

export function siteBase(settings: SiteSettings): URL {
  return new URL(settings.siteUrl || "https://joshproperties.in");
}

export function buildMetadata(
  settings: SiteSettings,
  path: string,
  overrides?: Metadata
): Metadata {
  const base = siteBase(settings);
  const siteName = settings.name || "Josh Properties";
  const defaultTitle = `${siteName} · Private Property Advisory`;
  const description = settings.metaDescription || settings.position || "";
  const ogImage = settings.ogImage
    ? urlFor(settings.ogImage).width(1200).height(630).url()
    : undefined;

  const clear = (
    overrides && Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined))
  ) as Metadata | undefined;

  const resolvedOg = {
    type: "website",
    locale: "en_IN",
    siteName,
    title: (clear?.openGraph?.title as string) ?? settings.ogTitle ?? defaultTitle,
    description: (clear?.openGraph?.description as string) ?? settings.ogDescription ?? description,
    images: clear?.openGraph?.images ?? (ogImage ? [{ url: ogImage }] : []),
  };

  return {
    metadataBase: base,
    title: { default: defaultTitle, template: `%s · ${siteName}` },
    description,
    keywords: settings.keywords || [],
alternates: { canonical: clear?.alternates?.canonical ?? (path || "/") },
    robots: clear?.robots ?? { index: true, follow: true },
    verification: settings.googleSiteVerification
      ? { google: settings.googleSiteVerification }
      : undefined,
    ...clear,
    openGraph: resolvedOg,
  };
}