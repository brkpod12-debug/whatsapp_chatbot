import { IBM_Plex_Mono, Instrument_Serif, Sora } from "next/font/google";

/**
 * Three families, six files, all preloaded, was enough to push the
 * render-blocking stylesheet behind them on a phone connection. Only the two
 * faces that paint above the fold keep their preload; the registry mono
 * swaps in a beat later and nothing moves, because next/font ships a
 * metric-matched fallback.
 */

export const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const body = Sora({
  variable: "--font-body",
  subsets: ["latin"],
  // 600 was declared but never used: `font-light`, the 400 default and
  // `font-medium` are the only weights on the site.
  weight: ["300", "400", "500"],
  display: "swap",
});

export const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  // .eyebrow is 400, .stamp is 500. 300 was unused.
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});
