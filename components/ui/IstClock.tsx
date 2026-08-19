"use client";

import { useCallback, useSyncExternalStore } from "react";

const FORMATS = {
  minute: { hour: "2-digit", minute: "2-digit" },
  second: { hour: "2-digit", minute: "2-digit", second: "2-digit" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

type Precision = keyof typeof FORMATS;

const PLACEHOLDER: Record<Precision, string> = {
  minute: "--:--",
  second: "--:--:--",
};

// Built once per precision: constructing Intl formatters is comparatively slow
// and getSnapshot runs on every render.
const formatters = new Map<Precision, Intl.DateTimeFormat>();

function formatterFor(precision: Precision) {
  let fmt = formatters.get(precision);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", {
      ...FORMATS[precision],
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
    formatters.set(precision, fmt);
  }
  return fmt;
}

/**
 * Live Hyderabad wall clock for registry metadata lines.
 *
 * Reads the clock through useSyncExternalStore rather than setState-in-effect:
 * the snapshot is a string, so React's Object.is check treats an unchanged
 * minute as no change and skips the re-render. The server snapshot is an inert
 * placeholder, so SSR and first paint agree and nothing shifts (tabular nums).
 */
export function IstClock({
  precision = "minute",
  className,
}: {
  precision?: Precision;
  className?: string;
}) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const id = window.setInterval(onChange, precision === "second" ? 1000 : 15_000);
      return () => window.clearInterval(id);
    },
    [precision]
  );

  const time = useSyncExternalStore(
    subscribe,
    () => formatterFor(precision).format(new Date()),
    () => PLACEHOLDER[precision]
  );

  return (
    <span className={className}>
      <span className="text-tabular">{time}</span> IST
    </span>
  );
}
