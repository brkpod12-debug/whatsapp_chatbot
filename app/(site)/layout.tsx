import type { Metadata, Viewport } from "next";
import { display, body, mono } from "../fonts";
import { getSiteSettings } from "@/sanity/queries";
import { buildMetadata } from "@/lib/metadata";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { FloatingCta } from "@/components/FloatingCta";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { PremiumCursor } from "@/components/motion/PremiumCursor";
import { PageTransition } from "@/components/motion/PageTransition";
import { SealLoader } from "@/components/motion/SealLoader";
import "../globals.css";

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  width: "device-width",
  initialScale: 1,
  // Extend into the notched/hole-punch area on phones so fixed chrome
  // (nav, floating CTA, lightbox) can pad against real safe-area insets.
  viewportFit: "cover",
};

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  if (!settings) return {};
  return buildMetadata(settings, "/");
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  if (!settings) {
    throw new Error("siteSettings document is missing — check Sanity Studio");
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${settings.siteUrl || "https://joshproperties.in"}#agency`,
    name: settings.name,
    legalName: settings.legalName,
    description: settings.position,
    foundingDate: settings.org?.foundingYear || "2017",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.org?.streetAddress || "",
      addressLocality: settings.org?.addressLocality || "",
      addressRegion: settings.state,
      postalCode: settings.org?.postalCode || "",
      addressCountry: "IN",
    },
    telephone: settings.phone,
    email: settings.email,
    openingHours: settings.org?.openingHours || "",
    priceRange: settings.org?.priceRange || "₹₹₹",
  };

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-body text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-emerald focus:px-5 focus:py-3 focus:text-carbon"
        >
          Skip to content
        </a>
        <SealLoader />
        <SmoothScroll />
        <ScrollProgress />
        <PremiumCursor />
        <PageTransition />
        <div className="film-grain" aria-hidden />
        <Navbar settings={settings} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
        <FloatingCta whatsapp={settings.whatsapp} />
      </body>
    </html>
  );
}
