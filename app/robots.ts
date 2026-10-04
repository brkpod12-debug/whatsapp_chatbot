import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/sanity/queries";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const base = (settings?.siteUrl || "https://www.joshproperties.co.in").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/studio", "/studio/", "/api/"] }],
    sitemap: [`${base}/sitemap.xml`, `${base}/sitemap-video.xml`],
    host: base,
  };
}
