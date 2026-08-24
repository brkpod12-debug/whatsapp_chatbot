/**
 * Adds the five Nizampet resale flats and removes the launch placeholder
 * listings, leaving only real stock: Pragathi Nagar and Nizampet.
 *
 * Idempotent: the Nizampet docs are createOrReplace'd on stable _ids and the
 * placeholder delete is a no-op once they are gone.
 *
 *   npx tsx scripts/seed-nizampet.ts --dry
 *   npx tsx scripts/seed-nizampet.ts
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

loadEnvLocal();

const dry = process.argv.includes("--dry");

const client = createClient({
  projectId: must("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  dataset: must("NEXT_PUBLIC_SANITY_DATASET"),
  apiVersion: must("NEXT_PUBLIC_SANITY_API_VERSION"),
  token: must("SANITY_API_TOKEN"),
  useCdn: false,
});

/** The nine seeded-at-launch placeholders. Real stock is Pragathi Nagar + Nizampet. */
const PLACEHOLDERS = [
  "property-jubilee-house",
  "property-kokapet-retreat",
  "property-medchal-farmhouse",
  "property-skyline-penthouse",
  "property-park-residences",
  "property-boulevard-duplex",
  "property-shadkaralle-green-belt",
  "property-moinabad-plots",
  "property-chevella-river-plate",
];

type Flat = {
  key: string;
  folio: string;
  title: string;
  beds: string;
  price: string;
  approval: string;
  furnishing: string;
  facing: string;
  age: string;
  uds: number;
  sft: number;
  featured?: boolean;
};

const FLATS: Flat[] = [
  {
    key: "nizampet-resale-i",
    folio: "021",
    title: "Nizampet Resale I",
    beds: "2 BHK",
    price: "₹66 Lakhs (Negotiable)",
    approval: "GP Approved & Gramapanchyath (BRS paid)",
    furnishing: "Furnished with false ceiling",
    facing: "East",
    age: "9 years",
    uds: 32,
    sft: 1150,
    featured: true,
  },
  {
    key: "nizampet-resale-ii",
    folio: "022",
    title: "Nizampet Resale II",
    beds: "3 BHK",
    price: "₹67 Lakhs (Negotiable)",
    approval: "GP Approved & Gramapanchyath",
    furnishing: "Fully furnished with false ceiling",
    facing: "West",
    age: "10 years",
    uds: 40,
    sft: 1500,
    featured: true,
  },
  {
    key: "nizampet-resale-iii",
    folio: "023",
    title: "Nizampet Resale III",
    beds: "2 BHK",
    price: "₹55 Lakhs (Negotiable)",
    approval: "GP Approved & Gramapanchyath",
    furnishing: "Fully furnished with false ceiling",
    facing: "East",
    age: "10+ years",
    uds: 26,
    sft: 1100,
  },
  {
    key: "nizampet-resale-iv",
    folio: "024",
    title: "Nizampet Resale IV",
    beds: "2 BHK",
    price: "₹53 Lakhs (Negotiable)",
    approval: "GP Approved & Gramapanchyath",
    furnishing: "Fully furnished with false ceiling",
    facing: "North",
    age: "10+ years",
    uds: 32,
    sft: 1000,
  },
  {
    key: "nizampet-resale-v",
    folio: "025",
    title: "Nizampet Resale V",
    beds: "2 BHK",
    price: "₹70 Lakhs (Negotiable)",
    approval: "GP Approved & Gramapanchyath",
    furnishing: "Fully furnished with false ceiling",
    facing: "West",
    age: "6 years",
    uds: 30,
    sft: 1100,
  },
];

const sft = (n: number) => n.toLocaleString("en-IN");

function doc(f: Flat) {
  const furnished = f.furnishing.toLowerCase().startsWith("fully") ? "fully furnished" : "furnished";
  return {
    _id: `property.${f.key}`,
    _type: "property",
    title: f.title,
    slug: { _type: "slug", current: f.key },
    folio: f.folio,
    category: "apartment",
    location: "Nizampet, Hyderabad",
    price: f.price,
    area: `${sft(f.sft)} sq.ft · UDS ${f.uds} sq.yds`,
    beds: f.beds,
    status: "Available",
    featured: f.featured ?? false,
    tall: false,
    published: true,
    short: `A ${furnished} ${f.beds} resale flat in Nizampet, ${f.age} old, ${f.facing.toLowerCase()} facing with full ventilation, car and bike parking, round-the-clock watchman and CCTV security.`,
    narrative: [
      `A ${furnished} ${f.beds} resale flat in Nizampet with ${sft(f.sft)} sq.ft of built-up area and UDS of ${f.uds} sq.yds. ${f.facing} facing with full ventilation, ${f.age} old.`,
      `${f.approval}. Car and bike parking, watchman and CCTV security 24/7, Manjeera water facility with bore, and 100% vastu.`,
    ],
    specs: [
      { label: "Approval", value: f.approval },
      { label: "Condition", value: "Resale flat" },
      { label: "Furnishing", value: f.furnishing },
      { label: "Ventilation", value: "Full ventilation" },
      { label: "Facing", value: f.facing },
      { label: "Age", value: f.age },
      { label: "UDS", value: `${f.uds} sq.yds` },
      { label: "Built-up area", value: `${sft(f.sft)} sq.ft` },
      { label: "Parking", value: "Car + 1 bike parking" },
      { label: "Security", value: "Watchman & CCTV 24/7" },
      { label: "Water", value: "Manjeera water facility & bore" },
      { label: "Vastu", value: "100% vastu" },
    ].map((s, i) => ({ _key: `${f.key}-spec-${i}`, _type: "specValue", ...s })),
  };
}

async function main() {
  const referenced: { _id: string }[] = await client.fetch(`*[references($ids)]{_id}`, {
    ids: PLACEHOLDERS,
  });
  if (referenced.length) {
    throw new Error(`Placeholders are still referenced by: ${referenced.map((r) => r._id).join(", ")}`);
  }

  if (dry) {
    for (const f of FLATS) console.log(JSON.stringify(doc(f), null, 1));
    console.log(`\nWould delete ${PLACEHOLDERS.length}:`, PLACEHOLDERS.join(", "));
    process.exit(0);
  }

  let tx = client.transaction();
  for (const f of FLATS) tx = tx.createOrReplace(doc(f));
  for (const id of PLACEHOLDERS) tx = tx.delete(id);
  await tx.commit();
  console.log(`Nizampet: ${FLATS.length} listings written, ${PLACEHOLDERS.length} placeholders deleted.`);

  const left: { folio: string; title: string }[] = await client.fetch(
    `*[_type == "property"] | order(folio asc){folio, title, location}`
  );
  console.log(`Register now holds ${left.length}:`);
  for (const p of left) console.log(` ${p.folio}  ${p.title}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
