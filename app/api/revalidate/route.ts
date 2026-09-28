import { revalidateTag } from "next/cache";
import { after, type NextRequest, NextResponse } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

export function getTagsForType(type: string): string[] {
  const knownTypes = [
    "property", "farmlandOption", "testimonial", "faq", "stat", "service",
    "processStep", "partnerLogo", "promiseItem", "siteSettings", "homePage",
    "propertyPage", "categoryPage", "contactPage",
  ];
  return knownTypes.includes(type) ? [type] : [];
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER_NAME);
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  if (!secret || !signature || !(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as { _type?: string };
  if (!payload._type) {
    return NextResponse.json({ message: "No _type in payload" }, { status: 400 });
  }

  const tags = getTagsForType(payload._type);
  tags.forEach((tag) => {
    revalidateTag(tag, { expire: 0 });
  });

  // The bot answers from the Supabase mirror, not from Sanity, so a publish has
  // to refresh both or the desk will quote a price the site has already changed.
  // Runs after the response: Sanity only needs the acknowledgement.
  if (payload._type === "property" || payload._type === "farmlandOption") {
    after(async () => {
      // Imported here rather than at module scope: the Sanity client validates
      // its env at import time, and a revalidation for a non-property document
      // has no business loading it.
      const { syncProperties } = await import("@/lib/desk/sync");
      const result = await syncProperties();
      if (result.errors.length > 0) console.error("[revalidate:sync]", result.errors);
    });
  }

  return NextResponse.json({ revalidated: true, tags, now: Date.now() });
}
