import Image from "next/image";
import type { SiteSettings } from "@/sanity/queries";
import { Reveal } from "@/components/motion/Reveal";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="relative overflow-hidden bg-carbon text-paper">
      {/* Slow champagne glow, barely perceptible */}
      <div
        aria-hidden
        className="animate-[footerGlow_14s_ease-in-out_infinite_alternate] pointer-events-none absolute -top-48 right-[-10%] h-[520px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(193,163,109,0.16),transparent_70%)]"
      />
      {/* Large magazine wordmark */}
      <div aria-hidden className="pointer-events-none relative select-none">
        <p aria-hidden className="px-6 text-center font-display text-[clamp(5rem,17vw,15rem)] font-light leading-[0.8] tracking-[0.1em] text-paper/[0.045]">
          JOSH
        </p>
      </div>

      <div className="rule-solid relative w-full opacity-60" />
      <div className="relative mx-auto max-w-[1440px] px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-20 sm:px-12 lg:px-20">
        <Reveal>
          <div className="mb-20 border border-paper/15 outline outline-1 outline-paper/10 outline-offset-[3px] px-6 py-8 sm:px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <p className="stamp text-slate">Registered</p>
              <p className="mt-3 text-[14px] leading-relaxed text-paper/60">
                {settings.rera.registeredUnder}
              </p>
            </div>
            <div>
              <p className="stamp text-slate">RERA number</p>
              <p className="mt-3 font-display text-2xl font-light text-paper">
                {settings.rera.number}
              </p>
            </div>
            <div>
              <p className="stamp text-slate">Registration</p>
              <p className="mt-3 text-[14px] leading-relaxed text-paper/60">
                {settings.rera.note}
              </p>
            </div>
          </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
        <div className="grid grid-cols-1 gap-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/logo-mark.png"
              alt=""
              width={360}
              height={349}
              className="h-14 w-auto"
            />
            <p className="mt-5 font-display text-[22px] tracking-[0.16em] text-paper">
              {settings.name.toUpperCase()}
            </p>
            <p className="mt-3 font-display text-[17px] italic leading-snug text-emerald/85">
              {settings.tagline}
            </p>
            <p className="mt-6 max-w-[34ch] text-pretty text-[15px] leading-relaxed text-paper/50">
              {settings.footerBlurb}
            </p>
          </div>

          <nav aria-label="Explore">
            <p className="eyebrow text-slate">Explore</p>
            <ul className="mt-5 space-y-3">
              {settings.footerExploreLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="link-underline inline-flex min-h-11 items-center text-[15px] text-paper/70 transition-colors hover:text-emerald"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Grounds">
            <p className="eyebrow text-slate">Grounds</p>
            <ul className="mt-5 space-y-3">
              {settings.footerGroundsLinks.map((l) => (
                <li key={l}>
                  <a
                    href="/farmlands"
                    className="link-underline inline-flex min-h-11 items-center text-[15px] text-paper/70 transition-colors hover:text-emerald"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow text-slate">Concierge</p>
            <address className="mt-5 space-y-3 not-italic">
              <p className="text-[15px] leading-relaxed text-paper/70">
                {settings.address}
              </p>
              <p>
                <a href={settings.phoneHref} className="link-underline inline-flex min-h-11 items-center text-[15px] text-paper/70 transition-colors hover:text-emerald">
                  {settings.phone}
                </a>
              </p>
              <p>
                <a href={settings.whatsapp} className="link-underline inline-flex min-h-11 items-center text-[15px] text-paper/70 transition-colors hover:text-emerald">
                  WhatsApp
                </a>
              </p>
              <p className="text-[13px] text-paper/65">{settings.hours}</p>
            </address>
          </div>
        </div>
        </Reveal>

        <Reveal delay={0.15}>
        <div className="mt-20 flex flex-col justify-between gap-6 border-t border-paper/15 pt-8 md:flex-row md:items-center">
          <p className="eyebrow text-slate">
            RERA no. {settings.rera.number} · Registration by counsel at every close
          </p>
          <p className="text-[12px] text-paper/60">
            © {new Date().getFullYear()} {settings.name}. {settings.legalName} · All rights reserved.
          </p>
        </div>
        {settings.legal?.disclaimer && (
          <div className="mt-6 border-t border-paper/10 pt-6">
            <p className="max-w-[90ch] text-[12px] leading-relaxed text-paper/60">
              {settings.legal.disclaimer}
            </p>
          </div>
        )}
        {(settings.legal?.privacyUrl || settings.legal?.termsUrl) && (
          <div className="mt-4 flex flex-wrap gap-6">
            {settings.legal.privacyUrl && (
              <a href={settings.legal.privacyUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-paper/60 transition-colors hover:text-paper">
                Privacy policy
              </a>
            )}
            {settings.legal.termsUrl && (
              <a href={settings.legal.termsUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-paper/60 transition-colors hover:text-paper">
                Terms of use
              </a>
            )}
          </div>
        )}
        </Reveal>
      </div>
    </footer>
  );
}
