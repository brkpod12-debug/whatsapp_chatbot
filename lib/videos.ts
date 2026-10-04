/**
 * The channel's latest property tours. Hand-maintained: copy new IDs from
 * https://www.youtube.com/@JoshProperties/videos. uploadDate is derived from
 * the "N days ago" shown on the channel, so it can be a day off.
 */
export type Video = {
  videoId: string;
  title: string;
  locality: string;
  uploadDate: string;
};

export const CHANNEL_URL = "https://www.youtube.com/@JoshProperties";

export const VIDEOS: Video[] = [
  {
    videoId: "XkVoGLFup7s",
    title: "HMDA Approved 2 BHK Flat for Sale in KPHB, JNTU: Furnished, UDS 48 sq yds",
    locality: "KPHB, Pragathi Nagar, JNTU",
    uploadDate: "2026-10-03",
  },
  {
    videoId: "rpRnheyGFrA",
    title: "Furnished 2 BHK Flat for Sale in KPHB, Pragathi Nagar: 48 Lakhs",
    locality: "KPHB, Pragathi Nagar",
    uploadDate: "2026-09-30",
  },
  {
    videoId: "-6LztV6_FRg",
    title: "Fully Furnished 1,560 sft Flat for Sale in KPHB: 66 Lakhs, 3 km from JNTU Metro",
    locality: "KPHB, JNTU Metro",
    uploadDate: "2026-09-28",
  },
  {
    videoId: "pJAZMatgv1w",
    title: "HMDA Approved 1,780 sft Furnished Flat for Sale in Pragathi Nagar: UDS 80 sq yds",
    locality: "Pragathi Nagar, JNTU",
    uploadDate: "2026-09-27",
  },
  {
    videoId: "_2Fq5ZXt1Sw",
    title: "Highrise Gated Community Flats near Miyapur Metro: 2 km, 6,666 per sft",
    locality: "Miyapur",
    uploadDate: "2026-09-27",
  },
  {
    videoId: "qJ8hfuXN80k",
    title: "Brand New 2 BHK Flat for Sale near KPHB Metro, JNTU, Pragathi Nagar",
    locality: "KPHB, Pragathi Nagar",
    uploadDate: "2026-09-26",
  },
];

/** Tied to a listing page but not on the homepage wall. Dates approximate ("3w", "1mo" ago). */
const PROPERTY_ONLY: Video[] = [
  {
    videoId: "i--tYftUG3I",
    title: "5 Years Old 1,185 sft Fully Furnished 2 BHK Flat for Sale in KPHB, JNTU, Pragathi Nagar",
    locality: "KPHB, Pragathi Nagar",
    uploadDate: "2026-09-13",
  },
  {
    videoId: "6bHCZkQHcKw",
    title: "6 Years Old Fully Furnished 2 BHK Flat for Sale near JNTU, Nizampet",
    locality: "Nizampet, JNTU",
    uploadDate: "2026-09-04",
  },
];

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const embedPageUrl = (id: string) => `https://www.youtube.com/embed/${id}`;

/** Muted, looping autoplay on the privacy host. loop only works with playlist=ID. */
export const autoplayEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&rel=0&modestbranding=1&playsinline=1`;

export const videoById = (id: string) => [...VIDEOS, ...PROPERTY_ONLY].find((v) => v.videoId === id);

export const videoDescription = (v: Video) =>
  `Video tour: ${v.title}. Shot on location in ${v.locality}, Hyderabad, by Josh Properties.`;

export function videoObject(v: Video) {
  return {
    "@type": "VideoObject",
    name: v.title,
    description: videoDescription(v),
    thumbnailUrl: [thumbUrl(v.videoId)],
    uploadDate: v.uploadDate,
    embedUrl: embedPageUrl(v.videoId),
    contentUrl: watchUrl(v.videoId),
  };
}
