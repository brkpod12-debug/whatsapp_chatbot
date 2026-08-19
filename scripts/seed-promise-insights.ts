/**
 * Seeds the "Why this matters" insight on each promiseItem.
 *
 * Additive and idempotent: it only patches the `insight` field on the five
 * existing documents, matched by their stable _id, and skips any document that
 * already has one so hand-edits in Studio are never overwritten.
 *
 *   npx tsx scripts/seed-promise-insights.ts --dry
 *   npx tsx scripts/seed-promise-insights.ts
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

const client = createClient({
  projectId: must("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  dataset: must("NEXT_PUBLIC_SANITY_DATASET"),
  apiVersion: must("NEXT_PUBLIC_SANITY_API_VERSION"),
  token: must("SANITY_API_TOKEN"),
  useCdn: false,
});

const INSIGHTS: Record<string, string> = {
  "promiseItem-0":
    "The first property we ever listed had a 27-year title chain. We still hold the audit.",
  "promiseItem-1":
    "We have flown every farm in our book at least twice. The second flight always shows what the brochure did not.",
  "promiseItem-2":
    "No all-in prices. If a number changes, it changes with a letter, not at the registrar's desk.",
  "promiseItem-3":
    "The same concierge you spoke to on day one is the one in the sub-registrar's office on day forty.",
  "promiseItem-4":
    "The dossier is yours, even if you walk away. We will not follow up with a CRM drip.",
};

async function main() {
  const dry = process.argv.includes("--dry");

  const existing: { _id: string; title: string; insight?: string | null }[] = await client.fetch(
    `*[_type == "promiseItem"] | order(order asc){_id, title, insight}`
  );

  const plan = existing.map((doc) => {
    const next = INSIGHTS[doc._id];
    if (!next) return { ...doc, action: "skip: no copy for this id" as const };
    if (doc.insight?.trim()) return { ...doc, action: "skip: already set" as const };
    return { ...doc, action: "patch" as const, next };
  });

  for (const p of plan) {
    console.log(`\n${p._id}  [${p.action}]\n  ${p.title}`);
    if (p.action === "patch") console.log(`  -> ${p.next}`);
  }

  const toPatch = plan.filter((p) => p.action === "patch");
  if (dry) {
    console.log(`\nDry run. ${toPatch.length} document(s) would be patched. Nothing written.`);
    return;
  }
  if (!toPatch.length) {
    console.log("\nNothing to do.");
    return;
  }

  const tx = toPatch.reduce(
    (t, p) => t.patch(p._id, (patch) => patch.set({ insight: p.next })),
    client.transaction()
  );
  await tx.commit();
  console.log(`\nPatched ${toPatch.length} document(s).`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
