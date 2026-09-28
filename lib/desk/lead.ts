import "server-only";
import { serviceClient } from "./supabase";
import { bypassesScoring, calculateLeadScore, type ScorableLead, type Thresholds, DEFAULT_THRESHOLDS } from "./score";

/**
 * The CRM write path. Everything the agent learns lands here, and the score is
 * recomputed from the stored row afterwards - never from whatever the model
 * thought the score should be.
 */

export type LeadRow = {
  id: string;
  customer_id: string;
  conversation_id: string | null;
  intent: string | null;
  asset_class: string | null;
  locality: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_band: string | null;
  timeline_months: number | null;
  purpose: string | null;
  property_of_interest: string | null;
  dossier_requested: boolean;
  dossier_sent_at: string | null;
  call_booked_at: string | null;
  viewing_requested: boolean;
  score: number;
  temperature: string;
  tags: string[];
  stage: string;
  owner_notified_at: string | null;
  source: string | null;
};

export async function thresholds(): Promise<Thresholds> {
  const db = serviceClient();
  const { data } = await db
    .from("agent_settings")
    .select("hot_threshold, warm_threshold")
    .eq("id", 1)
    .maybeSingle();

  return {
    hot: (data?.hot_threshold as number) ?? DEFAULT_THRESHOLDS.hot,
    warm: (data?.warm_threshold as number) ?? DEFAULT_THRESHOLDS.warm,
  };
}

/** One lead per conversation. Created lazily, on the first fact worth keeping. */
export async function ensureLead(conversationId: string, customerId: string): Promise<LeadRow | null> {
  const db = serviceClient();

  const { data: existing } = await db
    .from("leads")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as LeadRow;

  const { data: conversation } = await db
    .from("conversations")
    .select("referral")
    .eq("id", conversationId)
    .maybeSingle();

  const referral = conversation?.referral as { source_type?: string; headline?: string } | null;

  const { data, error } = await db
    .from("leads")
    .insert({
      customer_id: customerId,
      conversation_id: conversationId,
      source: referral?.source_type ?? "whatsapp",
      campaign: referral?.headline ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[lead:create]", error.message);
    return null;
  }
  return data as LeadRow;
}

function toScorable(row: LeadRow): ScorableLead {
  return {
    callBookedAt: row.call_booked_at,
    viewingRequested: row.viewing_requested,
    dossierRequested: row.dossier_requested,
    propertyOfInterest: row.property_of_interest,
    budgetBand: row.budget_band,
    timelineMonths: row.timeline_months,
    assetClass: row.asset_class,
    tags: row.tags,
  };
}

export type LeadPatch = Partial<
  Pick<
    LeadRow,
    | "intent" | "asset_class" | "locality" | "budget_min" | "budget_max" | "budget_band"
    | "timeline_months" | "purpose" | "property_of_interest" | "dossier_requested"
    | "call_booked_at" | "viewing_requested" | "stage"
  >
> & { addTags?: string[] };

export type LeadUpdate = {
  lead: LeadRow;
  score: number;
  temperature: string;
  becameHot: boolean;
};

/**
 * Applies extracted fields, then rescores. Null and undefined are both treated
 * as "not learned", so a later turn that fails to restate the budget never
 * erases the budget an earlier turn captured.
 */
export async function applyLeadFields(
  leadId: string,
  patch: LeadPatch
): Promise<LeadUpdate | null> {
  const db = serviceClient();

  const { data: current } = await db.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!current) return null;
  const before = current as LeadRow;

  const write: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (key === "addTags" || value === null || value === undefined) continue;
    write[key] = value;
  }

  const tags = new Set(before.tags ?? []);
  for (const tag of patch.addTags ?? []) tags.add(tag);
  write.tags = [...tags];

  const merged: LeadRow = { ...before, ...(write as Partial<LeadRow>), tags: [...tags] };

  // Sellers and brokers go to their own pipeline; a buyer score would misread them.
  if (!bypassesScoring(merged.tags)) {
    const { score, temperature } = calculateLeadScore(toScorable(merged), await thresholds());
    write.score = score;
    write.temperature = temperature;
  }

  const { data: updated, error } = await db
    .from("leads")
    .update(write)
    .eq("id", leadId)
    .select("*")
    .single();

  if (error) {
    console.error("[lead:update]", error.message);
    return null;
  }

  const after = updated as LeadRow;

  await rememberAboutCustomer(after);

  if (after.temperature !== before.temperature) {
    await db.from("audit_log").insert({
      conversation_id: after.conversation_id,
      event: "score_change",
      actor: "system",
      detail: {
        from: { score: before.score, temperature: before.temperature },
        to: { score: after.score, temperature: after.temperature },
      },
    });
  }

  return {
    lead: after,
    score: after.score,
    temperature: after.temperature,
    becameHot: after.temperature === "HOT" && before.temperature !== "HOT",
  };
}

/**
 * Facts worth carrying across conversations. A customer who said "Shankarpally,
 * around 2 Cr" in March should not be asked again in September; that single
 * thing is most of what makes the desk feel like it knows them.
 *
 * Keyed one row per fact, so a later correction overwrites rather than stacks.
 */
async function rememberAboutCustomer(lead: LeadRow): Promise<void> {
  const facts: [string, string | null][] = [
    ["asset_class", lead.asset_class],
    ["locality", lead.locality],
    ["budget_band", lead.budget_band],
    ["purpose", lead.purpose],
    ["timeline_months", lead.timeline_months == null ? null : String(lead.timeline_months)],
  ];

  const rows = facts
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      customer_id: lead.customer_id,
      key,
      value: value as string,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return;

  const db = serviceClient();
  const { error } = await db
    .from("customer_memory")
    .upsert(rows, { onConflict: "customer_id,key" });

  if (error) console.error("[lead:memory]", error.message);
}
