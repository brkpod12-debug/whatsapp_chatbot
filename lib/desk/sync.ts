import "server-only";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import { serviceClient } from "./supabase";
import { parseArea, parseBhk, parseLocality, parsePrice, parseStatus } from "./parse";

/**
 * Sanity is canonical for property facts; Supabase holds a mirror so the agent
 * can filter in SQL and the guardrail can check a quoted price against
 * something local. Nothing is ever hand-keyed into the mirror.
 *
 * Two owner-editable columns live only here and must survive every sync:
 * `bot_visible` (hide a holding from the bot without unpublishing it from the
 * site) and `internal_note` (the real floor price, seller motivation - never
 * sent to a customer). The upsert below simply never names them.
 */

type SanityImage = Parameters<typeof urlFor>[0];

type PropertyDoc = {
  _id: string;
  slug?: string;
  folio?: string;
  title: string;
  category: string;
  location?: string;
  price?: string;
  area?: string;
  beds?: string;
  status?: string;
  short?: string;
  image?: SanityImage;
  published?: boolean;
};

type FarmlandDoc = {
  _id: string;
  slug?: string;
  name: string;
  area?: string;
  price?: string;
  status?: string;
  acres?: string;
  order?: number;
  image?: SanityImage;
};

// The site's own projections in `sanity/queries.ts` deliberately omit `_id`;
// the mirror is keyed on it, so the sync asks for its own shape.
const PROPERTY_QUERY = `*[_type == "property" && published != false]{
  _id, "slug": slug.current, folio, title, category, location, price, area, beds, status, short, image, published
}`;

const FARMLAND_QUERY = `*[_type == "farmlandOption"]{
  _id, "slug": slug.current, name, area, price, status, acres, order, image
}`;

function heroUrl(image: SanityImage | undefined): string | null {
  if (!image) return null;
  try {
    return urlFor(image).width(1200).url();
  } catch {
    return null;
  }
}

function fromProperty(doc: PropertyDoc): Record<string, unknown> {
  const price = parsePrice(doc.price);
  const area = parseArea(doc.area);

  return {
    sanity_id: doc._id,
    sanity_type: "property",
    folio: doc.folio ?? null,
    slug: doc.slug ?? null,
    name: doc.title,
    asset_class: doc.category,
    locality: parseLocality(doc.location),
    price_inr: price.inr,
    price_max_inr: price.maxInr,
    price_display: doc.price ?? null,
    negotiable: price.negotiable,
    area_display: doc.area ?? null,
    area_value: area.value,
    area_unit: area.unit,
    uds_sqyds: area.udsSqyds,
    bhk: parseBhk(doc.beds),
    status: parseStatus(doc.status),
    holding_note: null,
    public_summary: doc.short ?? null,
    url: doc.slug ? `/properties/${doc.slug}` : null,
    hero_image_url: heroUrl(doc.image),
    synced_at: new Date().toISOString(),
  };
}

function fromFarmland(doc: FarmlandDoc): Record<string, unknown> {
  const price = parsePrice(doc.price);
  const area = parseArea(doc.area);

  return {
    sanity_id: doc._id,
    sanity_type: "farmlandOption",
    // Farmland options carry no folio in Sanity, so the display order stands in.
    folio: doc.order != null ? `FL-${doc.order}` : null,
    slug: doc.slug ?? null,
    name: doc.name,
    asset_class: "farmland",
    locality: null,
    price_inr: price.inr,
    price_max_inr: price.maxInr,
    price_display: doc.price ?? null,
    negotiable: price.negotiable,
    area_display: doc.area ?? null,
    area_value: area.value,
    area_unit: area.unit,
    uds_sqyds: area.udsSqyds,
    bhk: null,
    status: parseStatus(doc.status),
    holding_note: doc.acres ?? null,
    public_summary: null,
    url: "/farmlands",
    hero_image_url: heroUrl(doc.image),
    synced_at: new Date().toISOString(),
  };
}

export type SyncResult = { upserted: number; withdrawn: number; errors: string[] };

export async function syncProperties(): Promise<SyncResult> {
  const db = serviceClient();
  const errors: string[] = [];

  const [properties, farmland] = await Promise.all([
    client.fetch<PropertyDoc[]>(PROPERTY_QUERY),
    client.fetch<FarmlandDoc[]>(FARMLAND_QUERY),
  ]);

  const rows = [...properties.map(fromProperty), ...farmland.map(fromFarmland)];

  if (rows.length > 0) {
    const { error } = await db.from("properties").upsert(rows, { onConflict: "sanity_id" });
    if (error) errors.push(`upsert: ${error.message}`);
  }

  // A holding deleted or unpublished in Sanity must stop being marketable. It
  // cannot simply be deleted: `leads.property_of_interest` points at it. Marking
  // it withdrawn takes it out of every bot query while keeping the history, and
  // leaves the owner's `bot_visible` flag alone.
  const liveIds = rows.map((r) => r.sanity_id as string);
  let withdrawn = 0;

  if (liveIds.length > 0) {
    const { data, error } = await db
      .from("properties")
      .update({ status: "withdrawn", synced_at: new Date().toISOString() })
      .not("sanity_id", "in", `(${liveIds.map((id) => `"${id}"`).join(",")})`)
      .neq("status", "withdrawn")
      .select("id");

    if (error) errors.push(`withdraw: ${error.message}`);
    withdrawn = data?.length ?? 0;
  }

  await db.from("audit_log").insert({
    event: "sync",
    actor: "system",
    detail: { upserted: rows.length, withdrawn, errors },
  });

  return { upserted: rows.length, withdrawn, errors };
}
