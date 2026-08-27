import { CinematicHero } from "@/components/CinematicHero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { Stats } from "@/components/sections/Stats";
import { Featured } from "@/components/sections/Featured";
import { Offerings } from "@/components/sections/Offerings";
import { Story } from "@/components/sections/Story";
import { FarmlandBand } from "@/components/sections/FarmlandBand";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { Faq } from "@/components/sections/Faq";
import { WhyJosh } from "@/components/sections/WhyJosh";
import { FinalCta } from "@/components/sections/FinalCta";
import {
  getHomePage, getSiteSettings, getStats, getPartnerLogos, getFeaturedProperties,
  getServices, getPromiseItems, getProcessSteps, getTestimonials, getFaqs,
} from "@/sanity/queries";
import type { HomePage } from "@/sanity/queries";
import { JsonLd, faqGraph } from "@/lib/schema";

export const revalidate = 60;

export default async function Home() {
  const [homePage, settings, stats, logos, featuredProperties, services, promiseItems, processSteps, testimonials, faqs] =
    await Promise.all([
      getHomePage(), getSiteSettings(), getStats(), getPartnerLogos(), getFeaturedProperties(),
      getServices(), getPromiseItems(), getProcessSteps(), getTestimonials(), getFaqs(),
    ]);

  if (!homePage) {
    throw new Error("homePage document is missing — check Sanity Studio");
  }
  if (!settings) {
    throw new Error("siteSettings document is missing — check Sanity Studio");
  }

  const show = homePage.sections ?? {};
  const on = (key: keyof NonNullable<HomePage["sections"]>) => show[key] !== false;

  return (
    <>
      {on("faq") && faqs.length > 0 && <JsonLd data={faqGraph(faqs)} />}
      {on("hero") && <CinematicHero copy={homePage.hero} heroVideo={settings.heroVideo} />}
      {on("trustStrip") && <TrustStrip logos={logos} />}
      {on("stats") && <Stats stats={stats} copy={homePage.stats} />}
      {on("featured") && <Featured properties={featuredProperties} copy={homePage.featured} />}
      {on("offerings") && <Offerings services={services} copy={homePage.offerings} />}
      {on("story") && <Story copy={homePage.story} />}
      {on("farmlandBand") && <FarmlandBand copy={homePage.farmlandBand} />}
      {on("whyJosh") && <WhyJosh items={promiseItems} copy={homePage.whyJosh} />}
      {on("process") && <Process steps={processSteps} copy={homePage.process} />}
      {on("testimonials") && <Testimonials items={testimonials} />}
      {on("faq") && <Faq items={faqs} copy={homePage.faqSection} />}
      {on("finalCta") && (
        <FinalCta
          copy={homePage.finalCta}
          phone={settings.phone}
          phoneHref={settings.phoneHref}
          whatsapp={settings.whatsapp}
          reraNumber={settings.rera.number}
        />
      )}
    </>
  );
}
