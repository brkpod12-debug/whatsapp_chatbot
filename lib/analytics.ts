/**
 * GA4, if and only if `NEXT_PUBLIC_GA_ID` is set. Every helper no-ops when
 * gtag is absent, so nothing here breaks a local build or a preview deploy.
 */

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function track(event: string, params: GtagParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
