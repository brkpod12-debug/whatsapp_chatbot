"use client";

import { useEffect, useRef, useState } from "react";
import { autoplayEmbedUrl, thumbUrl } from "@/lib/videos";

/**
 * Thumbnail first, muted looping iframe once the card nears the viewport (or
 * on click). A raw autoplaying iframe in the first screen would cost LCP.
 */
export function VideoFacade({
  videoId,
  title,
  alt,
}: {
  videoId: string;
  title: string;
  alt: string;
}) {
  const [active, setActive] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = holder.current;
    if (!node || active) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [active]);

  return (
    <div ref={holder} className="relative aspect-video w-full overflow-hidden bg-carbon">
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={autoplayEmbedUrl(videoId)}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          aria-label={`Play video: ${title}`}
          onClick={() => setActive(true)}
          className="absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- third-party thumbnail, not worth an image-loader entry */}
          <img src={thumbUrl(videoId)} alt={alt} loading="lazy" className="h-full w-full object-cover" />
          <span aria-hidden className="absolute inset-0 grid place-items-center bg-carbon/30">
            <svg width="68" height="48" viewBox="0 0 68 48" fill="none">
              <path d="M.9 8.1C1.5 4.5 4.4 1.8 8 1.2 12.1.6 20.4 0 34 0s21.9.6 26 1.2c3.6.6 6.5 3.3 7.1 6.9.6 4.1.9 10.6.9 17.9s-.3 13.8-.9 17.9c-.6 3.6-3.5 6.3-7.1 6.9C55.9 47.4 47.6 48 34 48s-21.9-.6-26-1.2c-3.6-.6-6.5-3.3-7.1-6.9C.3 35.8 0 29.3 0 22s.3-13.8.9-17.9Z" fill="#f00" />
              <path d="m27 14 16 8-16 8V14Z" fill="#fff" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
