"use client";

import { useEffect } from "react";
import Script from "next/script";
import { GA_ID, track } from "@/lib/analytics";

/**
 * GA4 plus one delegated listener that turns the site's three real conversion
 * actions into events. Delegation rather than per-component handlers, because
 * phone and WhatsApp links appear in the navbar, footer, floating CTA, both
 * forms and every property page: one listener catches all of them and cannot
 * fall out of sync when a new link is added.
 *
 * Set NEXT_PUBLIC_GA_ID (e.g. G-XXXXXXXXXX) to switch it on. With no ID the
 * component renders nothing and the listener still no-ops.
 */
export function Analytics() {
  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("tel:")) {
        track("phone_call_click", { link_url: href, link_text: link.textContent?.trim() || "" });
      } else if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
        track("whatsapp_click", { link_url: href.split("?")[0] });
      } else if (href.startsWith("mailto:")) {
        track("email_click", { link_url: href });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
