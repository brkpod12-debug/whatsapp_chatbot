import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "./ContactForm";
import { OfficeMap } from "@/components/OfficeMap";
import { ChapterMarker } from "@/components/ui/ChapterMarker";
import { Reveal } from "@/components/motion/Reveal";
import { getContactPage, getEnquiryOptions, getSiteSettings } from "@/sanity/queries";
import { buildMetadata, clampDescription } from "@/lib/metadata";
import { JsonLd, breadcrumbGraph } from "@/lib/schema";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getContactPage(), getSiteSettings()]);
  if (!settings) return {};
  const cta = ` Call ${settings.phone} or send a message.`;
  return buildMetadata(settings, "/contact", {
    // The page heading is editorial; the title tag has to say what the page is.
    title: `Contact the ${settings.city} Advisory Desk`,
    description:
      clampDescription(page?.body || "", 158 - cta.length) + cta,
  });
}

export default async function ContactPage() {
  const [page, settings, interests, budgets] = await Promise.all([
    getContactPage(),
    getSiteSettings(),
    getEnquiryOptions("holding"),
    getEnquiryOptions("budget"),
  ]);

  if (!page) notFound();
  if (!settings) {
    throw new Error("siteSettings document is missing — check Sanity Studio");
  }

  return (
    <>
      <JsonLd data={breadcrumbGraph(settings, [{ name: "Contact", path: "/contact" }])} />
      <section className="bg-paper">
        <div className="mx-auto max-w-[1200px] px-6 pb-28 pt-28 sm:px-12 lg:px-20 lg:pb-40 lg:pt-32">
          <Reveal>
            <ChapterMarker kicker={page.kicker} />
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-24">
            <div>
              <Reveal delay={0.1}>
                <h1 className="text-balance font-display text-4xl leading-[1.02] tracking-[-0.02em] text-ink lg:text-6xl">
                  {page.heading}
                </h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-[50ch] text-pretty text-[17px] leading-relaxed text-ink/70">
                  {page.body}
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <ContactForm
                  whatsapp={settings.whatsapp}
                  phone={settings.phone}
                  phoneHref={settings.phoneHref}
                  interests={interests.map((o) => o.label)}
                  budgets={budgets.map((o) => o.label)}
                />
              </Reveal>
            </div>

            <aside className="lg:border-l lg:border-ink/15 lg:pl-14">
              <Reveal delay={0.15}>
                <h2 className="eyebrow text-slate">{page.concierceHeading}</h2>
                <ul className="mt-6 space-y-6">
                  <li>
                    <a
                      href={settings.phoneHref}
                      className="inline-flex min-h-11 items-center font-display text-2xl text-ink transition-colors hover:text-champagne"
                    >
                      {settings.phone}
                    </a>
                    <p className="mt-1 text-sm text-ink/50">{settings.hours}</p>
                  </li>
                  <li>
                    <a
                      href={`mailto:${settings.email}`}
                      className="inline-flex min-h-11 items-center font-display text-xl text-ink transition-colors [overflow-wrap:anywhere] hover:text-champagne sm:text-2xl"
                    >
                      {settings.email}
                    </a>
                    <p className="mt-1 text-sm text-ink/50">{page.emailNote}</p>
                  </li>
                </ul>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="mt-12 border-t border-ink/15 pt-10">
                  <h2 className="eyebrow text-slate">{page.officeHeading}</h2>
                  <address className="mt-5 not-italic">
                    <p className="text-[15px] leading-relaxed text-ink/70">{settings.address}</p>
                    <p className="mt-1 text-sm text-ink/50">{page.officeNote}</p>
                  </address>
                  <div className="vignette relative mt-8 aspect-[4/3] overflow-hidden rounded-[2px] bg-mist">
                    <OfficeMap address={settings.address} name={settings.name} />
                  </div>
                </div>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
