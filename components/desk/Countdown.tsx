"use client";

import { useSyncExternalStore } from "react";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const TICK_MS = 30_000;

/**
 * The wall clock is external mutable state, so it is read through
 * `useSyncExternalStore` rather than during render. The snapshot is bucketed to
 * the tick interval, which keeps it referentially stable between ticks - React
 * re-reads getSnapshot on every render and loops forever if the value keeps
 * changing.
 */
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}

const getSnapshot = () => Math.floor(Date.now() / TICK_MS);

/**
 * Time left in Meta's 24-hour customer-service window. Once it hits zero the
 * composer can only send an approved template, so the owner needs to see it
 * shrinking rather than discover it at send time.
 */
export function Countdown({ lastInboundAt }: { lastInboundAt: string | null }) {
  // Null on the server: the clock is not knowable at prerender time, and a
  // guessed value would hydrate into a different one.
  const bucket = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (!lastInboundAt) return <span className="stamp text-slate">no inbound</span>;
  if (bucket === null) return <span className="stamp text-slate">&nbsp;</span>;

  const left = new Date(lastInboundAt).getTime() + WINDOW_MS - bucket * TICK_MS;

  if (left <= 0) return <span className="stamp text-wax">window closed</span>;

  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const urgent = left < 2 * 3_600_000;

  return (
    <span className={`stamp ${urgent ? "text-wax" : "text-slate"}`}>
      {hours}h {minutes}m left
    </span>
  );
}
