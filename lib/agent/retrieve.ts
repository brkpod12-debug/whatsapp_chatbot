import "server-only";
import { serviceClient } from "@/lib/desk/supabase";

/**
 * Company memory retrieval. No embeddings: the firm holds on the order of
 * fifteen knowledge entries, and at that size keyword overlap beats a vector
 * index on every axis that matters, including being debuggable.
 *
 * ponytail: fetches the active set and ranks in memory. Push ranking into SQL
 * (the gin/trgm indexes in 0001 are already there for it) past a few hundred
 * entries, not before.
 */

export type KnowledgeEntry = {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  priority: number;
  pinned: boolean;
  scope: string;
  scopeValue: string | null;
};

const MAX_RETRIEVED = 8;
/** Entries at or above this are company facts that go in every prompt. */
const ALWAYS_INJECT = 900;

type Row = {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[] | null;
  priority: number | null;
  pinned: boolean | null;
  scope: string | null;
  scope_value: string | null;
};

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "can", "i", "you", "we", "in", "on", "at", "of",
  "for", "to", "and", "or", "it", "this", "that", "with", "what", "how", "any", "have", "has",
]);

export function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u0900-\u097F\u0C00-\u0C7F]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function score(entry: Row, tokens: string[], scope: { assetClass?: string | null; locality?: string | null }): number {
  let s = (entry.priority ?? 100) / 100;
  if (entry.pinned) s += 5;

  // Scope is a hard relevance signal: a farmland-only note is noise in an
  // apartment conversation.
  if (entry.scope === "asset_class" && entry.scope_value) {
    if (entry.scope_value === scope.assetClass) s += 6;
    else return -1;
  }
  if (entry.scope === "locality" && entry.scope_value) {
    if (entry.scope_value.toLowerCase() === scope.locality?.toLowerCase()) s += 6;
    else return -1;
  }

  const keywords = (entry.keywords ?? []).map((k) => k.toLowerCase());
  const haystack = `${entry.title} ${entry.content}`.toLowerCase();

  for (const token of tokens) {
    if (keywords.some((k) => k.includes(token))) s += 4;
    else if (haystack.includes(token)) s += 1;
  }

  return s;
}

export async function retrieveKnowledge(
  query: string,
  scope: { assetClass?: string | null; locality?: string | null } = {}
): Promise<{ pinned: KnowledgeEntry[]; matched: KnowledgeEntry[] }> {
  const db = serviceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await db
    .from("knowledge_entries")
    .select("id, category, title, content, keywords, priority, pinned, scope, scope_value")
    .eq("active", true)
    // Anything time-bound ("2 plots left, Phase 1") stops being quoted the day
    // it expires. Stale confidence is worse than no confidence.
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order("priority", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[retrieve]", error.message);
    return { pinned: [], matched: [] };
  }

  const rows = (data ?? []) as Row[];
  const toEntry = (r: Row): KnowledgeEntry => ({
    id: r.id,
    category: r.category,
    title: r.title,
    content: r.content,
    keywords: r.keywords ?? [],
    priority: r.priority ?? 100,
    pinned: Boolean(r.pinned),
    scope: r.scope ?? "global",
    scopeValue: r.scope_value,
  });

  const pinned = rows.filter((r) => (r.priority ?? 100) >= ALWAYS_INJECT).map(toEntry);
  const pinnedIds = new Set(pinned.map((p) => p.id));

  const tokens = tokenise(query);
  const matched = rows
    .filter((r) => !pinnedIds.has(r.id))
    .map((r) => ({ row: r, s: score(r, tokens, scope) }))
    .filter((x) => x.s > 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX_RETRIEVED)
    .map((x) => toEntry(x.row));

  return { pinned, matched };
}

export type MirrorProperty = {
  id: string;
  folio: string | null;
  name: string;
  assetClass: string;
  locality: string | null;
  priceDisplay: string | null;
  priceInr: number | null;
  areaDisplay: string | null;
  bhk: number | null;
  status: string;
  holdingNote: string | null;
  publicSummary: string | null;
  url: string | null;
};

/**
 * `internal_note` is absent from this SELECT on purpose. It is excluded at the
 * query layer, not by asking the model nicely, because a prompt instruction is
 * not a security boundary.
 */
const PUBLIC_COLUMNS =
  "id, folio, name, asset_class, locality, price_display, price_inr, area_display, bhk, status, holding_note, public_summary, url";

const UNMARKETABLE = ["sold", "withdrawn", "reserved"];

export async function searchProperties(filters: {
  assetClass?: string | null;
  locality?: string | null;
  budgetMax?: number | null;
  bhk?: number | null;
  limit?: number;
}): Promise<MirrorProperty[]> {
  const db = serviceClient();

  let query = db
    .from("properties")
    .select(PUBLIC_COLUMNS)
    .eq("bot_visible", true)
    .not("status", "in", `(${UNMARKETABLE.join(",")})`)
    .order("price_inr", { ascending: true, nullsFirst: false })
    .limit(filters.limit ?? 4);

  if (filters.assetClass) query = query.eq("asset_class", filters.assetClass);
  if (filters.locality) query = query.ilike("locality", `%${filters.locality}%`);
  if (filters.bhk) query = query.eq("bhk", filters.bhk);
  // A listing with no parsed price stays in the results: the desk still wants
  // to show it, and the price simply is not quoted.
  if (filters.budgetMax) query = query.or(`price_inr.lte.${filters.budgetMax},price_inr.is.null`);

  const { data, error } = await query;
  if (error) {
    console.error("[searchProperties]", error.message);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id as string,
    folio: p.folio as string | null,
    name: p.name as string,
    assetClass: p.asset_class as string,
    locality: p.locality as string | null,
    priceDisplay: p.price_display as string | null,
    priceInr: p.price_inr as number | null,
    areaDisplay: p.area_display as string | null,
    bhk: p.bhk as number | null,
    status: p.status as string,
    holdingNote: p.holding_note as string | null,
    publicSummary: p.public_summary as string | null,
    url: p.url as string | null,
  }));
}

/** Owner-only notes, fetched separately so the guardrail can check for leaks. */
export async function internalNotes(): Promise<string[]> {
  const db = serviceClient();
  const { data } = await db.from("properties").select("internal_note").not("internal_note", "is", null);
  return (data ?? []).map((r) => r.internal_note as string).filter(Boolean);
}
