"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Click-to-load Google Map.
 *
 * The plain `<iframe loading="lazy">` still pulled ~470 KB of Maps JavaScript
 * on the contact page, which on a phone connection was the whole of that
 * page's LCP. The map now loads on the first tap, and until then the panel is
 * a still frame with the address on it.
 */
export function OfficeMap({ address, name }: { address: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;

  if (loaded) {
    return (
      <iframe
        title={`${name}, ${address}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0 grayscale-[0.35]"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-mist px-6 text-center transition-colors duration-300 hover:bg-paper-dark"
      aria-label={`Load the map for ${name}, ${address}`}
    >
      <MapPin size={20} strokeWidth={1.5} className="text-champagne" />
      <span className="max-w-[32ch] text-[14px] leading-relaxed text-ink/70">{address}</span>
      <span className="stamp text-champagne underline-offset-4 group-hover:underline">
        Show the map
      </span>
    </button>
  );
}
