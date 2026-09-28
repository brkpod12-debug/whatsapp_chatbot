import "server-only";
import { deskClient } from "./supabase";

/** The pipeline the firm actually runs, in order. Drives the stage filter and the detail page. */
export const STAGES = [
  "new",
  "qualifying",
  "call_booked",
  "viewing",
  "title",
  "offer",
  "closed",
  "lost",
] as const;

export type LeadListRow = {
  id: string;
  conversationId: string | null;
  name: string;
  waId: string;
  intent: string | null;
  assetClass: string | null;
  locality: string | null;
  budgetBand: string | null;
  timelineMonths: number | null;
  score: number;
  temperature: string;
  stage: string;
  tags: string[];
  source: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
  updatedAt: string;
};

export type LeadFilters = {
  temperature?: string;
  stage?: string;
  assetClass?: string;
  tag?: string;
  q?: string;
};

type Row = {
  id: string;
  conversation_id: string | null;
  intent: string | null;
  asset_class: string | null;
  locality: string | null;
  budget_band: string | null;
  timeline_months: number | null;
  score: number | null;
  temperature: string | null;
  stage: string | null;
  tags: string[] | null;
  source: string | null;
  next_action: string | null;
  next_action_due: string | null;
  updated_at: string;
  customers: { display_name: string | null; full_name: string | null; wa_id: string } | null;
};

const SELECT = `id, conversation_id, intent, asset_class, locality, budget_band, timeline_months,
   score, temperature, stage, tags, source, next_action, next_action_due, updated_at,
   customers ( display_name, full_name, wa_id )`;

function toRow(row: Row): LeadListRow {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    name: row.customers?.full_name ?? row.customers?.display_name ?? row.customers?.wa_id ?? "Unknown",
    waId: row.customers?.wa_id ?? "",
    intent: row.intent,
    assetClass: row.asset_class,
    locality: row.locality,
    budgetBand: row.budget_band,
    timelineMonths: row.timeline_months,
    score: row.score ?? 0,
    temperature: row.temperature ?? "COLD",
    stage: row.stage ?? "new",
    tags: row.tags ?? [],
    source: row.source,
    nextAction: row.next_action,
    nextActionDue: row.next_action_due,
    updatedAt: row.updated_at,
  };
}

export async function listLeads(filters: LeadFilters = {}, limit = 200): Promise<LeadListRow[]> {
  const supabase = await deskClient();

  let query = supabase
    .from("leads")
    .select(SELECT)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.temperature) query = query.eq("temperature", filters.temperature);
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.assetClass) query = query.eq("asset_class", filters.assetClass);
  // Postgres array containment: the lead carries this tag.
  if (filters.tag) query = query.contains("tags", [filters.tag]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as unknown as Row[]).map(toRow);

  // Name and number are on the embedded customer, which PostgREST cannot filter
  // the parent by. At a couple of hundred rows a substring pass is instant.
  const q = filters.q?.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.waId.includes(q) ||
      (r.locality ?? "").toLowerCase().includes(q)
  );
}
