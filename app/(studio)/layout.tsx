import type { Metadata, Viewport } from "next";
import { metadata as studioMetadata, viewport as studioViewport } from "next-sanity/studio";

// Studio gets its own minimal theme-color/viewport instead of inheriting
// the site's — and is explicitly kept out of search results.
export const metadata: Metadata = {
  ...studioMetadata,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = studioViewport;

// Deliberately bare: no site chrome (Lenis smooth-scroll,
// PageTransition curtain, film-grain overlay, fixed Navbar/FloatingCta).
// Sanity Studio is a full SPA with its own nested scroll panes and fixed
// toolbar; the site's chrome would fight it (Lenis stealing wheel events
// from Studio's document list, fixed nav/CTA sitting on top of Studio's UI).
export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
