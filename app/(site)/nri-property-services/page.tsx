import type { Metadata } from "next";
import { InfoPage } from "@/components/sections/InfoPage";
import { buildMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/sanity/queries";
import { CHANNEL_URL, VIDEOS, watchUrl } from "@/lib/videos";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  if (!settings) return {};
  return buildMetadata(settings, "/nri-property-services", {
    title: "NRI Property Services in Hyderabad: Title Verification and Video Tours",
    description:
      "Buying Hyderabad property from abroad: independent title audit, drone-surveyed farmland, video tours of every flat and one concierge from first call to registration.",
  });
}

export default async function NriPage() {
  const settings = await getSiteSettings();
  if (!settings) throw new Error("siteSettings document is missing — check Sanity Studio");

  return (
    <InfoPage
      settings={settings}
      path="/nri-property-services"
      crumb="NRI property services"
      eyebrow="For clients abroad"
      h1="NRI property services in Hyderabad: verification and video tours"
      lead="Buying in Hyderabad from another country means trusting someone else's eyes. Our job is to make that trust unnecessary: the title audit, the survey and the walkthrough all reach you in writing and on video."
      sections={[
        {
          heading: "Title verified before you travel",
          paragraphs: [
            "Every property on our register is title-audited by independent counsel before it is shown. You receive the audit as a dossier, so you can read the chain of title from wherever you are. We discuss price only after that dossier is in your hands.",
            "Anything we describe is subject to verification of title and records before payment is discussed. If you want your own lawyer to review the dossier, we welcome it.",
          ],
        },
        {
          heading: "See the property without flying in",
          paragraphs: [
            "We film our flats on location and publish the walkthroughs on our YouTube channel, so you can see the rooms, the ventilation and the building before you book a viewing. Farmland is surveyed by drone, and the boundaries are confirmed on the ground.",
            "When you do visit, viewings are by appointment and arranged around your travel dates.",
          ],
        },
        {
          heading: "One concierge, one point of contact",
          paragraphs: [
            "A single concierge handles your transaction from the first call to registration, normally within four to six weeks of that call. Details are shared on WhatsApp or by call, whichever suits your time zone, and numbers are always discussed on a call, never over chat.",
            "Questions about power of attorney, tax or eligibility as a non-resident are matters for qualified counsel. We will not advise on them, but we will coordinate with your counsel so that nothing is left waiting on us.",
          ],
        },
      ]}
    >
      <div className="mb-14">
        <h2 className="text-balance font-display text-3xl leading-[1.1] tracking-[-0.02em] text-ink lg:text-4xl">
          Latest property video tours
        </h2>
        <ul className="mt-5 space-y-3 text-[17px] leading-relaxed">
          {VIDEOS.map((v) => (
            <li key={v.videoId}>
              <a className="text-champagne underline underline-offset-4" href={watchUrl(v.videoId)} target="_blank" rel="noopener">
                {v.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-ink/70">
          More on the{" "}
          <a className="text-champagne underline underline-offset-4" href={CHANNEL_URL} target="_blank" rel="noopener">
            Josh Properties YouTube channel
          </a>
          .
        </p>
      </div>
    </InfoPage>
  );
}
