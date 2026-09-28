import "server-only";
import { deskClient } from "./supabase";

/**
 * Queries behind the inbox. All of these run through `deskClient()`, so RLS
 * decides what a signed-in user sees and an anonymous request sees nothing.
 */

export type Temperature = "HOT" | "WARM" | "COLD";

export type ConversationSummary = {
  id: string;
  status: string;
  aiEnabled: boolean;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  unread: boolean;
  name: string;
  waId: string;
  preview: string | null;
  previewSender: string | null;
  temperature: Temperature | null;
  score: number | null;
  interest: string | null;
};

type Row = {
  id: string;
  status: string;
  ai_enabled: boolean;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  unread_for_owner: boolean;
  customers: { display_name: string | null; full_name: string | null; wa_id: string } | null;
  messages: { body: string | null; msg_type: string; sender: string }[] | null;
  leads: { temperature: string | null; score: number | null; asset_class: string | null; locality: string | null }[] | null;
};

function toSummary(row: Row): ConversationSummary {
  const lead = row.leads?.[0];
  const last = row.messages?.[0];
  return {
    id: row.id,
    status: row.status,
    aiEnabled: row.ai_enabled,
    lastInboundAt: row.last_inbound_at,
    lastOutboundAt: row.last_outbound_at,
    unread: row.unread_for_owner,
    name: row.customers?.full_name ?? row.customers?.display_name ?? row.customers?.wa_id ?? "Unknown",
    waId: row.customers?.wa_id ?? "",
    preview: last ? (last.body ?? `[${last.msg_type}]`) : null,
    previewSender: last?.sender ?? null,
    temperature: (lead?.temperature as Temperature | null) ?? null,
    score: lead?.score ?? null,
    interest: [lead?.asset_class, lead?.locality].filter(Boolean).join(" · ") || null,
  };
}

export type InboxFilter = "all" | "needs_reply" | "hot" | "warm" | "cold" | "human";

export async function listConversations(filter: InboxFilter = "all"): Promise<ConversationSummary[]> {
  const supabase = await deskClient();

  // PostgREST can order and limit an embedded resource, so the newest message
  // per thread arrives in the same round trip. No view, no N+1.
  let query = supabase
    .from("conversations")
    .select(
      `id, status, ai_enabled, last_inbound_at, last_outbound_at, unread_for_owner,
       customers ( display_name, full_name, wa_id ),
       messages ( body, msg_type, sender ),
       leads ( temperature, score, asset_class, locality )`
    )
    .neq("status", "closed")
    .order("last_inbound_at", { ascending: false, nullsFirst: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .limit(100);

  if (filter === "needs_reply") query = query.eq("unread_for_owner", true);
  if (filter === "human") query = query.eq("ai_enabled", false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Row[];
  const summaries = rows.map(toSummary);

  // Temperature lives on the embedded lead, which PostgREST cannot filter the
  // parent by, so these three narrow in memory. At 100 rows that is free.
  if (filter === "hot" || filter === "warm" || filter === "cold") {
    return summaries.filter((s) => s.temperature === filter.toUpperCase());
  }
  return summaries;
}

export type ThreadMessage = {
  id: string;
  direction: string;
  sender: string;
  msgType: string;
  body: string | null;
  transcript: string | null;
  status: string | null;
  createdAt: string;
};

export type Thread = {
  conversation: ConversationSummary;
  messages: ThreadMessage[];
  lead: {
    id: string;
    intent: string | null;
    assetClass: string | null;
    locality: string | null;
    budgetBand: string | null;
    timelineMonths: number | null;
    purpose: string | null;
    score: number | null;
    temperature: string | null;
    stage: string | null;
    tags: string[];
    nextAction: string | null;
    nextActionDue: string | null;
  } | null;
};

export async function getThread(conversationId: string): Promise<Thread | null> {
  const supabase = await deskClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      `id, status, ai_enabled, last_inbound_at, last_outbound_at, unread_for_owner,
       customers ( display_name, full_name, wa_id ),
       messages ( body, msg_type, sender ),
       leads ( temperature, score, asset_class, locality )`
    )
    .eq("id", conversationId)
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .maybeSingle();

  if (!conversation) return null;

  const [{ data: messages }, { data: leads }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, direction, sender, msg_type, body, transcript, status, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500),
    supabase
      .from("leads")
      .select(
        "id, intent, asset_class, locality, budget_band, timeline_months, purpose, score, temperature, stage, tags, next_action, next_action_due"
      )
      .eq("conversation_id", conversationId)
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  const lead = leads?.[0];

  return {
    conversation: toSummary(conversation as unknown as Row),
    messages: (messages ?? []).map((m) => ({
      id: m.id as string,
      direction: m.direction as string,
      sender: m.sender as string,
      msgType: m.msg_type as string,
      body: m.body as string | null,
      transcript: m.transcript as string | null,
      status: m.status as string | null,
      createdAt: m.created_at as string,
    })),
    lead: lead
      ? {
          id: lead.id as string,
          intent: lead.intent as string | null,
          assetClass: lead.asset_class as string | null,
          locality: lead.locality as string | null,
          budgetBand: lead.budget_band as string | null,
          timelineMonths: lead.timeline_months as number | null,
          purpose: lead.purpose as string | null,
          score: lead.score as number | null,
          temperature: lead.temperature as string | null,
          stage: lead.stage as string | null,
          tags: (lead.tags as string[] | null) ?? [],
          nextAction: lead.next_action as string | null,
          nextActionDue: lead.next_action_due as string | null,
        }
      : null,
  };
}
