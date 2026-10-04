import type { Metadata } from "next";
import { InfoPage } from "@/components/sections/InfoPage";
import { buildMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/sanity/queries";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  if (!settings) return {};
  return buildMetadata(settings, "/about", {
    title: "About Josh Properties: RERA-Registered Real Estate Advisory in Hyderabad",
    description:
      "Josh Properties is a private real estate advisory in Banjara Hills, Hyderabad, operating since 2017 under RERA P02400005461. How we verify title before any price is discussed.",
  });
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  if (!settings) throw new Error("siteSettings document is missing — check Sanity Studio");

  return (
    <InfoPage
      settings={settings}
      path="/about"
      crumb="About"
      eyebrow="About the firm"
      h1="About Josh Properties, a RERA-registered real estate advisory in Hyderabad"
      lead={`Josh Properties has advised on villas, apartments and farmland in Hyderabad and Telangana since 2017. RERA registration ${settings.rera.number}.`}
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            "Josh Properties is a private real estate advisory based at Road No. 12, Banjara Hills, Hyderabad. We have operated since 2017 under RERA registration " +
              settings.rera.number +
              ". We curate villas, apartments and title-verified farmland across Hyderabad and the surrounding districts of Telangana.",
            "We hold a deliberately small register rather than a large listing book. Apartments currently sit in the north-west corridor of the city, around Pragathi Nagar and Nizampet. Farmland sits in the western and south-western belts. We only quote localities that are on the live register, and if a locality is not on it, we record your requirement and follow up instead of improvising an answer.",
          ],
        },
        {
          heading: "Why the method starts with title",
          paragraphs: [
            "The firm began after a family friend bought a villa with a clouded title and lost it to a dispute. That single mistake became the method: every property is title-audited by independent counsel before it is shown, and it is shown with the audit in hand, before any price is discussed.",
            "For farmland, the audit extends to the ground. Boundaries are surveyed, and we use drone surveys to confirm the extent of a holding before a client travels to see it.",
          ],
        },
        {
          heading: "How every client is looked after",
          paragraphs: [
            "Each client works with one concierge from the first call to registration. The process runs in five stages: a first call on day zero, a private viewing between day three and day seven, title and survey in week two, an offer and dossier in week three, and booking and registration between weeks four and six.",
            "Pricing is itemised, including registration, stamp duty, survey and fencing where they apply, so the figure on the table is the figure you pay. Listed prices stand as published. Where a listing is marked negotiable, the concierge discusses numbers on a call, and every deal closes in person.",
          ],
        },
        {
          heading: "What we will not do",
          paragraphs: [
            "We do not forecast prices, returns or appreciation. We can describe the holding, the location and the process, and we leave forecasts to people who can be held to them. We do not give legal, tax or eligibility advice; those questions go to counsel. Anything we describe is subject to verification of title and records before payment is discussed, and that verification is the dossier.",
            "Details you share with us are used only to prepare your dossier and to arrange a call or viewing. They are not shared with other buyers.",
          ],
        },
        {
          heading: "Visit or call",
          paragraphs: [
            "Our office is at Road No. 12, Banjara Hills, Hyderabad, Telangana 500034, open Monday to Saturday, 10:00 to 19:00 IST. Visits are by appointment, so there are no walk-ins. Outside those hours the concierge returns calls the next working morning.",
          ],
        },
      ]}
    />
  );
}
