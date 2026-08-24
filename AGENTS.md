<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Josh Properties

Marketing site for **Josh Properties**, a luxury real-estate house in Hyderabad, Telangana — villas, apartments and farmland. Curated listings, an interactive farmland masterplan, and a dossier-gated concierge contact flow. No backend.

The live register currently holds apartments only, at Pragathi Nagar and Nizampet, so `/villas` and `/farmlands` render `PropertyListing`'s empty state until stock is added in Studio.

## Stack

- **Next.js 16.2.12** (App Router), React 19, TypeScript (strict)
- **Tailwind CSS v4** — `@import "tailwindcss"` + `@theme inline` tokens in `app/globals.css`
- **motion** (`motion/react`) for micro-interactions — not `framer-motion`
- **GSAP + ScrollTrigger** for the Method progress line; **motion/react** drives the scroll-scrubbed hero (spring-smoothed video timeline + text choreography); `SmoothScroll.tsx` registers ScrollTrigger and syncs it with Lenis (`lenis.on("scroll", ScrollTrigger.update)`), exposing the instance as `window.__lenis`
- **Lenis** smooth scroll, **lucide-react** icons, **clsx** + **tailwind-merge** via `cn()`
- `next.config.ts` sets `turbopack.root` to the repo to silence the multiple-lockfile warning.

## Commands

- `npm run dev` — dev server
- `npm run build` / `npm run start` — production
- `npm run lint` — ESLint (strict: `react-hooks/set-state-in-effect` and `react-hooks/refs` errors are on)
- `npm run test` — vitest suite (currently covers `app/api/revalidate/route.test.ts`)

## Architecture

- `app/(site)/` — route group holding every public page and its layout; the parentheses don't affect the URL, so `/`, `/villas`, `/contact`, etc. are unchanged.
  - `app/(site)/page.tsx` — landing page; sections in a fixed order (CinematicHero → TrustStrip → Stats → Featured → Offerings → Story → FarmlandBand → WhyJosh → Process → Testimonials → Faq → FinalCta)
  - `app/(site)/layout.tsx` — metadata, JSON-LD (`RealEstateAgent`), Navbar, Footer, FloatingCta, SmoothScroll, ScrollProgress, PageTransition, film-grain overlay
  - `app/(site)/villas/`, `app/(site)/apartments/`, `app/(site)/farmlands/` — category listing pages
  - `app/(site)/properties/[slug]/` — detail page for a single property (`generateStaticParams`, async `params: Promise<{ slug }>`); every published property prerenders at build
  - `app/(site)/contact/` — concierge page + `ContactForm.tsx`
- `app/(studio)/` — route group holding `/studio`, isolated from the site: its own minimal `layout.tsx` (bare `<html><body>`, no Lenis/cursor/transition/navbar/footer/floating-cta, noindex) so Sanity Studio's own scroll panes and fixed toolbar don't fight the site's chrome.
  - `app/(studio)/studio/[[...tool]]/` — `page.tsx` (`dynamic = "force-static"`) + `StudioClient.tsx` (mounts `NextStudio`)
- `components/sections/` — one component per landing/page section (incl. `PageHero`); `components/CinematicHero.tsx` is the scroll-scrubbed homepage hero
- `components/ui/` — reusable primitives: `Button`, `MagneticButton`, `ChapterMarker`
- `components/motion/` — animation primitives: `Reveal`, `RevealMask`, `MaskLines`, `Parallax`, `CountUp`, `ScrollProgress`, `SmoothScroll`, `PageTransition`
- `components/` (page-level) — `CinematicHero` (scroll-scrubbed hero film), `PropertyCard`, `PropertyListing`, `Gallery`, `FarmlandMap`, `DayNightCity`, `DossierForm`, `FloatingCta`
- `sanity/` — Sanity CMS integration: `client.ts` (read `client` + token-authenticated `writeClient`, server-only), `env.ts`, `image.ts` (`urlFor()`), `queries.ts` (typed GROQ fetchers, one per content type), `schemaTypes/` (document schemas), `structure.ts` (Studio desk structure, pins the singletons). `sanity.config.ts` at the repo root wires it all together for `/studio`.
- `lib/utils.ts` — `cn()` class merger
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).

## Rules

- **Content lives in Sanity — edit via Studio at `/studio`, or query via `sanity/queries.ts`. Never hardcode copy into components.** `getSiteSettings()`, `getHomePage()`, `getCategoryPage()` and `getContactPage()` fetch singleton documents and can return `null` if the document is missing in Sanity — every caller must guard for that (`notFound()` for page-level singletons, a thrown `Error` for the foundational `siteSettings`/`homePage` docs the whole site depends on).
- Components that use hooks, `motion`, Lenis, or event listeners must start with `"use client"`. Server components stay client-free (e.g. `Hero` reads `public/hero.mp4` via `existsSync`/`process.cwd()` and must NOT be a client component).
- Interactive surfaces (`a`, `button`, form controls) use the native cursor.
- **Forms have no backend:** `ContactForm` and `DossierForm` compose a message and open a `wa.me` deep link (`site.whatsapp`) with the user's replies. Keep that flow.
- Images are `picsum.photos` placeholders keyed by a `seed` string (e.g. `josh-park`), allowlisted in `next.config.ts`. Real film stills now live in `public/images/` (`villa-01.jpg`…`villa-10.jpg`, extracted from the hero film) and win over picsum wherever wired: villa `Property` rows carry `image`/`gallery` (local paths), `PageHero` accepts an `image` prop, and `Offerings`/`FinalCta` use local stills. Keep using `next/image`.
- Property `narrative` is `string[]`; wrap single paragraphs in `[...]`.
- **Placeholders to replace for launch:** phone/WhatsApp/email on the `siteSettings` singleton in Sanity Studio and the office map block on `/contact`. The cinematic hero video ships at `public/hero.mp4` (re-encoded from the upscaled 1440p master with a keyframe every 6 frames for smooth scroll scrubbing, 1920x1080, ~4 Mbps, no audio, faststart) with poster `public/hero-poster.jpg`.

## Motion conventions

- Import from `motion/react`. Use `useReducedMotion()` in every animated component and disable/degrade motion when true.
- Standard ease curve: `[0.16, 1, 0.3, 1]`. Durations ~0.5–1s; springs for pointer-reactive motion (MagneticButton).
- Reuse the primitives in `components/motion/` (e.g. `Reveal`, `RevealMask`, `MaskLines`) before writing bespoke animations.
- `SmoothScroll` (Lenis), `ScrollProgress`, and `PageTransition` mount once in the root layout; all self-disable or degrade under reduced motion / coarse pointers.
- **Magnetic buttons:** `MagneticButton` wraps `Button` for a subtle pointer-follow on CTAs. No custom cursor.
- **Page transitions:** `Button` renders `next/link` for internal paths (starts with `/`, not `#` or `http`), enabling client-side nav with the `PageTransition` curtain. Keep cross-page links internal so there are no white flashes.
- **Category signatures:** villas get a gentle scale+brightness hover; apartments get a deeper zoom with a dark city-night radial overlay (`DayNightCity` is the apartments signature scrubber, day→night); farmland gets a strong slow zoom. Preserve these.

## Design system

The site speaks a **Title Register Book** language: warm linen paper and ink, a deep **forest** green for dark chapters, and **brass** as the single accent. Every surface should read as an artifact of a private land registry — a folio, a ledger, a deed, a stamp — not as a generic marketing page.

- **Colors are Tailwind theme tokens in `app/globals.css`:** `paper #faf8f3`, `stone #f2efe8`, `mist #ece6db`, `slate #8d8981`, `ink #0a0a09`, `graphite #191815`, `carbon #11110f` (warm black), `chrome #cbc5b9`, `sage #b9b2a3` (clay), `emerald #c1a36d` (the champagne-brass accent), `pine #7b6746` (bronze hover/dark). Brass aliases: `brass`, `champagne #a88a5a`, `bronze`, `forest`, `clay`, `line`, `paper-dark`. **`emerald`/`pine`/`carbon`/`sage` still mean brass/bronze/warm-black/clay respectively — `emerald` IS the brass accent.** Champagne is the darker text-grade accent (`#a88a5a`); use it for accent text, `emerald` for fills. Use tokens, not raw hex. Plan-named variables (`--paper`, `--ink`, `--forest`, `--brass`, `--champagne`, `--bronze`, `--clay`, `--line`, `--text-hero`, `--text-h2`, `--text-label`) are also defined in `:root`.
- **Fonts load via `next/font` in `app/fonts.ts`:** `Instrument Serif` (display — weight 400 only, normal + italic), `Sora` (body — 300–600), `IBM Plex Mono` (mono/registry metadata). Exposed as `font-display`, `font-body`, `font-mono`.
- **Registry devices (reuse, don't re-invent):**
  - `components/ui/Seal.tsx` — circular JP monogram seal ("Josh Properties · Private Advisory"). Use as watermark (large, `text-paper/[0.07]` on dark, `text-emerald/[0.07]` on paper) or as a small brand mark.
  - `components/ui/Stamp.tsx` — corner stamp with tones `available` (brass), `sold` (slate, rotated), `reserved` (chrome), `muted`; rotates -6deg on hover. Used on `PropertyCard` for status.
  - `components/motion/Parallax.tsx` — `useScroll`/`useTransform` y-parallax; wrap images in `absolute inset-[-12%]` inside an `overflow-hidden` container. Disables under reduced motion.
  - Double-frame "document" cards: `border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px]` (Story folio, Stats ledger, Footer deed band).
- **Utilities in `globals.css`:** `.eyebrow` (mono, 11px, 0.22em, uppercase), `.stamp` (mono, 9px, 0.2em, uppercase), `.rule-solid`, `.vignette`, `.film-grain`, `.animate-marquee`, `heroZoom`, `.animate-wave` (voice-note waveform), `.brass-shimmer` (hover shimmer on brass elements), `.field-underline` + `.group-field:focus-within` (brass underline grows from center on form focus).
- **Signature GSAP:** Method (Process) sticky headline + brass progress-line fill in `components/sections/Process.tsx`. Both self-disable under reduced motion and clean up via `gsap.context()`.
- **Voice notes:** `Testimonials` renders clients as WhatsApp-style voice notes — brass play/pause toggles a `.animate-wave` on the waveform bars. No blockquote styling.
- **Copy discipline (anti-slop):** NO em-dashes (use commas/colons/periods; en-dashes only in numeric ranges like `₹1–3 Cr`). No "Khammam", "Victory Atelier", "coordination charges" (except the deliberate FAQ line), no eyebrow on every section.
- **Eyebrow restraint:** max ~1 eyebrow per 3 sections. Home page currently uses three: hero kicker, "The collection" (Featured), "The farmland" (FarmlandBand). Don't add more.
- **Shape lock:** all-sharp system (radius 0–2px). No rounded cards; the only circles are the Seal and voice-note play buttons. Timelines use sharp index squares, not circles.
- **Respect `prefers-reduced-motion` global CSS and the marquee fallback.**
- **Dark/light arc:** dark opening (Hero/Stats), long light "documents" chapter (Featured→WhyJosh), dark chapters (FarmlandBand, Method/Process, FinalCta), light close. Keep this triptych; don't scatter dark sections through the light chapter.

## SEO / metadata

- Set per-page `Metadata` via `export const metadata` in each `page.tsx` (see `app/(site)/layout.tsx` for site-wide defaults, `app/(site)/properties/[slug]/page.tsx` for dynamic per-property metadata).
- Update the `siteSettings` singleton in Sanity Studio if business details change (phone, hours, address); the JSON-LD in `app/(site)/layout.tsx` reads from it directly.
- `/studio` is excluded from indexing (`robots: { index: false, follow: false }` in `app/(studio)/layout.tsx`) and does not inherit the site's metadata/viewport — it re-exports Studio's own defaults from `next-sanity/studio`.

## Environment variables

Required in `.env.local` (see `.env.example` for the full list):

- `NEXT_PUBLIC_SANITY_PROJECT_ID` — Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` — dataset name (e.g. `production`)
- `NEXT_PUBLIC_SANITY_API_VERSION` — GROQ API version date
- `SANITY_API_TOKEN` — Editor-permission token, server-only, used by `writeClient` (`sanity/client.ts`)
- `SANITY_REVALIDATE_SECRET` — shared secret checked by the `/api/revalidate` webhook
