import { getProperties, getSiteSettings } from "@/sanity/queries";
import { VIDEOS, embedPageUrl, thumbUrl, videoById, videoDescription } from "@/lib/videos";
import { getYouTubeId } from "@/lib/youtube";

export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const node = (v: (typeof VIDEOS)[number]) => `    <video:video>
      <video:thumbnail_loc>${esc(thumbUrl(v.videoId))}</video:thumbnail_loc>
      <video:title>${esc(v.title)}</video:title>
      <video:description>${esc(videoDescription(v))}</video:description>
      <video:player_loc>${esc(embedPageUrl(v.videoId))}</video:player_loc>
      <video:publication_date>${v.uploadDate}</video:publication_date>
    </video:video>`;

export async function GET() {
  const [settings, properties] = await Promise.all([getSiteSettings(), getProperties()]);
  const base = (settings?.siteUrl || "https://www.joshproperties.co.in").replace(/\/$/, "");

  // One <url> per page that actually embeds a video. Property videos only count
  // when we know their upload date, i.e. they are in VIDEOS.
  const pages = [{ loc: `${base}/`, videos: VIDEOS }];
  for (const p of properties) {
    const v = videoById(getYouTubeId(p.youtubeUrl) ?? "");
    if (v) pages.push({ loc: `${base}/properties/${p.slug}`, videos: [v] });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${pages.map((pg) => `  <url>\n    <loc>${esc(pg.loc)}</loc>\n${pg.videos.map(node).join("\n")}\n  </url>`).join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600" },
  });
}
