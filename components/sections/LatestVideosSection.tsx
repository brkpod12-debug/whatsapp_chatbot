import { VideoFacade } from "@/components/VideoFacade";
import { JsonLd } from "@/lib/schema";
import {
  CHANNEL_URL, VIDEOS, embedPageUrl, thumbUrl, videoDescription, videoObject, watchUrl,
} from "@/lib/videos";

export function LatestVideosSection() {
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Latest property tour videos, Josh Properties, Hyderabad",
    itemListElement: VIDEOS.map((v, i) => ({ "@type": "ListItem", position: i + 1, item: videoObject(v) })),
  };

  return (
    <section id="latest-videos" aria-labelledby="latest-videos-heading" className="bg-stone">
      <JsonLd data={list} />
      <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2
              id="latest-videos-heading"
              className="max-w-[26ch] text-balance font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink lg:text-6xl"
            >
              Latest Property Tours: 2 BHK Flats in KPHB, Pragathi Nagar &amp; Miyapur
            </h2>
            <p className="mt-6 max-w-[56ch] text-slate">
              Real videos, real flats, shot on location in Hyderabad. Updated weekly from our YouTube channel.
            </p>
          </div>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener"
            className="border border-ink/20 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink transition-colors hover:border-champagne hover:text-champagne"
          >
            Subscribe on YouTube
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((v) => (
            <figure key={v.videoId} itemScope itemType="https://schema.org/VideoObject" className="border border-ink/15 bg-paper">
              <VideoFacade
                videoId={v.videoId}
                title={v.title}
                alt={`Video tour of a flat for sale in ${v.locality}, Hyderabad`}
              />
              <figcaption className="space-y-2 p-5">
                <meta itemProp="name" content={v.title} />
                <meta itemProp="description" content={videoDescription(v)} />
                <meta itemProp="thumbnailUrl" content={thumbUrl(v.videoId)} />
                <meta itemProp="uploadDate" content={v.uploadDate} />
                <meta itemProp="embedUrl" content={embedPageUrl(v.videoId)} />
                <meta itemProp="contentUrl" content={watchUrl(v.videoId)} />
                <h3 className="text-sm font-medium leading-snug text-ink">{v.title}</h3>
                <p className="text-xs text-slate">{v.locality}, Hyderabad</p>
                <a
                  href={watchUrl(v.videoId)}
                  target="_blank"
                  rel="noopener"
                  className="inline-block text-xs text-champagne underline-offset-4 hover:underline"
                >
                  Watch on YouTube
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
