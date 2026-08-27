import path from "node:path";

import type { NextConfig } from "next";

/** One year, in seconds. */
const YEAR = 31536000;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Ships the route's CSS inside the HTML instead of a render-blocking
    // <link>, which removes a round trip from the first paint on mobile.
    inlineCss: true,
    // Tree-shakes the icon and motion barrels instead of pulling the whole
    // package into the first-load bundle.
    optimizePackageImports: ["lucide-react", "motion"],
  },
  images: {
    // AVIF first, WebP fallback. Next negotiates per request via Accept.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [
      {
        // Film stills and the hero reel are content-stable: rename the file to
        // bust them. `/_next/static` already ships immutable; `/public` did not.
        source: "/:all*(mp4|webm|avif|webp|jpg|jpeg)",
        headers: [{ key: "Cache-Control", value: `public, max-age=${YEAR}, immutable` }],
      },
      {
        // Logos/icons are client-editable, so keep a revalidation window.
        source: "/:all*(png|svg|ico)",
        headers: [
          { key: "Cache-Control", value: `public, max-age=86400, stale-while-revalidate=${YEAR}` },
        ],
      },
    ];
  },
};

export default nextConfig;
