import type { Metadata } from "next";
import { body, display, mono } from "@/app/fonts";
import "@/app/globals.css";

// The desk is staff-only and must never be indexed.
export const metadata: Metadata = {
  title: "Josh Properties Desk",
  robots: { index: false, follow: false },
};

// Deliberately bare, the same reasoning as `app/(studio)/layout.tsx`: no
// Lenis smooth-scroll, no PageTransition curtain, no film grain, no Navbar or
// FloatingCta. The desk is a dense working tool with its own scroll panes;
// the site's chrome would fight it. The design tokens are shared, the chrome
// is not.
export default function DeskLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">{children}</body>
    </html>
  );
}
