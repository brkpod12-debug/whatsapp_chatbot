import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/sanity/queries";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd, breadcrumbGraph } from "@/lib/schema";

export type InfoSection = { heading: string; paragraphs: string[] };

/** Static editorial page: hero, headed sections, links to the register, call to action. */
export function InfoPage({
  settings, path, crumb, eyebrow, h1, lead, sections, children,
}: {
  settings: SiteSettings;
  path: string;
  crumb: string;
  eyebrow: string;
  h1: string;
  lead: string;
  sections: InfoSection[];
  children?: ReactNode;
}) {
  return (
    <>
      <JsonLd data={breadcrumbGraph(settings, [{ name: crumb, path }])} />
      <PageHero eyebrow={eyebrow} title={h1} seed="josh-office" image="/images/villa-06.jpg">
        {lead}
      </PageHero>
      <section className="bg-paper">
        <div className="mx-auto max-w-[760px] px-6 py-24 sm:px-12 lg:py-32">
          {sections.map((s) => (
            <div key={s.heading} className="mb-14">
              <h2 className="text-balance font-display text-3xl leading-[1.1] tracking-[-0.02em] text-ink lg:text-4xl">
                {s.heading}
              </h2>
              {s.paragraphs.map((p) => (
                <p key={p.slice(0, 24)} className="mt-5 text-pretty text-[17px] leading-relaxed text-ink/75">
                  {p}
                </p>
              ))}
            </div>
          ))}
          {children}
          <p className="mt-6 text-[17px] leading-relaxed text-ink/75">
            Browse the register:{" "}
            <Link className="text-champagne underline underline-offset-4" href="/apartments">apartments</Link>,{" "}
            <Link className="text-champagne underline underline-offset-4" href="/villas">villas</Link> and{" "}
            <Link className="text-champagne underline underline-offset-4" href="/farmlands">farmland</Link>.
          </p>
          <div className="mt-12 border border-ink/15 p-8">
            <p className="font-display text-2xl text-ink">Speak to the concierge</p>
            <p className="mt-3 text-ink/70">
              {settings.phone}, Monday to Saturday, 10:00 to 19:00. Viewings are by appointment.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.2em]">
              <a className="border border-ink px-5 py-3 text-ink" href={settings.phoneHref}>Call</a>
              <a className="border border-ink/20 px-5 py-3 text-ink" href={settings.whatsapp}>WhatsApp</a>
              <Link className="border border-ink/20 px-5 py-3 text-ink" href="/contact">Enquire privately</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
