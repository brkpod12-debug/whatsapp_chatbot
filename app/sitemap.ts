import type { MetadataRoute } from "next";
import { getPropertySlugs, getSiteSettings } from "@/sanity/queries";

export const revalidate = 3600;

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/villas", priority: 0.8 },
  { path: "/apartments", priority: 0.8 },
  { path: "/farmlands", priority: 0.8 },
  { path: "/contact", priority: 0.7 },
  { path: "/about", priority: 0.6 },
  { path: "/nri-property-services", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, slugs] = await Promise.all([getSiteSettings(), getPropertySlugs()]);
  const base = (settings?.siteUrl || "https://www.joshproperties.co.in").replace(/\/$/, "");
  const lastModified = new Date();

  return [
    ...PAGES.map(({ path, priority }) => ({
      url: `${base}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority,
    })),
    ...slugs.map((slug) => ({
      url: `${base}/properties/${slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
