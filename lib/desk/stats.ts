import "server-only";
import { deskClient } from "./supabase";

/**
 * Every number on the desk comes from here, and every one of them is a real
 * query. Nothing on the dashboard is a placeholder.
 *
 * ponytail: rows are fetched for the window and grouped in JS rather than in
 * SQL. At tens of enquiries a day that is a few hundred rows and simpler than
 * maintaining a set of RPC functions. Push the grouping into Postgres views if
 * a day ever returns more than a few thousand messages.
 */

/** IST is a fixed UTC+5:30, no DST, so "today" is arithmetic rather than a library. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function istDayStart(date: Date = new Date()): Date {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

export function istHour(iso: string): number {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).getUTCHours();
}

export function istDayKey(iso: string): string {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export type Today = {
  messages: number;
  inbound: number;
  aiReplies: number;
  humanReplies: number;
  uniqueCustomers: number;
  newLeads: number;
  qualifiedLeads: number;
  hot: number;
  warm: number;
  cold: number;
  viewings: number;
  needsReply: number;
  /** Threads with under two hours left in the 24-hour window. */
  windowClosing: number;
};

export type Series = { label: string; value: number }[];

export type DeskStats = {
  today: Today;
  messagesByHour: Series;
  leadsBySource: Series;
  leadsByAssetClass: Series;
  enquiriesByDay: Series;
  callsBookedByDay: Series;
  guardrailBlocks: number;
};

function countBy<T>(rows: T[], key: (row: T) => string | null): Series {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    days.push(istDayKey(new Date(Date.now() - i * 86_400_000).toISOString()));
  }
  return days;
}

function densify(rows: { created_at: string }[], days: string[]): Series {
  const counts = new Map(days.map((d) => [d, 0]));
  for (const row of rows) {
    const key = istDayKey(row.created_at);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  // Every day in the window appears, including the zeroes. A sparkline with
  // gaps silently lies about a quiet week.
  return days.map((d) => ({ label: d, value: counts.get(d) ?? 0 }));
}

export async function getDeskStats(): Promise<DeskStats> {
  const supabase = await deskClient();

  const dayStart = istDayStart().toISOString();
  const monthStart = new Date(Date.now() - 29 * 86_400_000).toISOString();
  const closingCutoff = new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString();

  const [
    messagesToday,
    leadsToday,
    allOpenLeads,
    viewingsToday,
    conversations,
    leadsMonth,
    viewingsMonth,
    blocks,
  ] = await Promise.all([
    supabase
      .from("messages")
      .select("id, direction, sender, created_at, conversation_id")
      .gte("created_at", dayStart)
      .limit(5000),
    supabase.from("leads").select("id, stage, temperature, source, asset_class").gte("created_at", dayStart),
    supabase.from("leads").select("id, temperature, source, asset_class").neq("stage", "lost"),
    supabase.from("viewings").select("id").gte("created_at", dayStart),
    supabase
      .from("conversations")
      .select("id, unread_for_owner, last_inbound_at, ai_enabled")
      .neq("status", "closed")
      .limit(1000),
    supabase.from("leads").select("created_at").gte("created_at", monthStart),
    supabase.from("viewings").select("created_at, kind").gte("created_at", monthStart),
    supabase.from("audit_log").select("id").eq("event", "guardrail_block").gte("created_at", dayStart),
  ]);

  const messages = messagesToday.data ?? [];
  const inbound = messages.filter((m) => m.direction === "inbound");
  const leads = leadsToday.data ?? [];
  const open = allOpenLeads.data ?? [];
  const threads = conversations.data ?? [];

  const days = lastNDays(30);

  return {
    today: {
      messages: messages.length,
      inbound: inbound.length,
      aiReplies: messages.filter((m) => m.sender === "ai").length,
      humanReplies: messages.filter((m) => m.sender === "human").length,
      uniqueCustomers: new Set(inbound.map((m) => m.conversation_id as string)).size,
      newLeads: leads.length,
      qualifiedLeads: leads.filter((l) => l.stage !== "new").length,
      hot: open.filter((l) => l.temperature === "HOT").length,
      warm: open.filter((l) => l.temperature === "WARM").length,
      cold: open.filter((l) => l.temperature === "COLD").length,
      viewings: (viewingsToday.data ?? []).length,
      // The customer spoke last and no human has picked it up.
      needsReply: threads.filter((c) => c.unread_for_owner).length,
      windowClosing: threads.filter(
        (c) => c.last_inbound_at && (c.last_inbound_at as string) < closingCutoff
      ).length,
    },
    messagesByHour: Array.from({ length: 24 }, (_, hour) => ({
      label: String(hour).padStart(2, "0"),
      value: messages.filter((m) => istHour(m.created_at as string) === hour).length,
    })),
    leadsBySource: countBy(open, (l) => (l.source as string | null) ?? "unknown"),
    leadsByAssetClass: countBy(open, (l) => l.asset_class as string | null),
    enquiriesByDay: densify((leadsMonth.data ?? []) as { created_at: string }[], days),
    callsBookedByDay: densify(
      ((viewingsMonth.data ?? []) as { created_at: string; kind: string }[]).filter(
        (v) => v.kind === "call"
      ),
      days
    ),
    guardrailBlocks: (blocks.data ?? []).length,
  };
}

export type NeedsAttention = {
  id: string;
  name: string;
  preview: string | null;
  lastInboundAt: string | null;
  temperature: string | null;
};

/** The "what needs me right now" list. Ordered oldest first: that is the one aging. */
export async function getNeedsAttention(limit = 8): Promise<NeedsAttention[]> {
  const supabase = await deskClient();

  const { data } = await supabase
    .from("conversations")
    .select(
      `id, last_inbound_at,
       customers ( display_name, full_name, wa_id ),
       messages ( body, msg_type ),
       leads ( temperature )`
    )
    .eq("unread_for_owner", true)
    .neq("status", "closed")
    .order("last_inbound_at", { ascending: true, nullsFirst: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .limit(limit);

  type Row = {
    id: string;
    last_inbound_at: string | null;
    customers: { display_name: string | null; full_name: string | null; wa_id: string } | null;
    messages: { body: string | null; msg_type: string }[] | null;
    leads: { temperature: string | null }[] | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    name: row.customers?.full_name ?? row.customers?.display_name ?? row.customers?.wa_id ?? "Unknown",
    preview: row.messages?.[0]
      ? (row.messages[0].body ?? `[${row.messages[0].msg_type}]`)
      : null,
    lastInboundAt: row.last_inbound_at,
    temperature: row.leads?.[0]?.temperature ?? null,
  }));
}

export type UpcomingViewing = {
  id: string;
  kind: string;
  scheduledAt: string | null;
  status: string;
  name: string | null;
  property: string | null;
};

export async function getUpcomingViewings(limit = 8): Promise<UpcomingViewing[]> {
  const supabase = await deskClient();

  const { data } = await supabase
    .from("viewings")
    .select(
      `id, kind, scheduled_at, status,
       properties ( name ),
       leads ( customers ( full_name, display_name, wa_id ) )`
    )
    .gte("scheduled_at", new Date().toISOString())
    .lte("scheduled_at", new Date(Date.now() + 7 * 86_400_000).toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  type Row = {
    id: string;
    kind: string;
    scheduled_at: string | null;
    status: string;
    properties: { name: string } | null;
    leads: { customers: { full_name: string | null; display_name: string | null; wa_id: string } | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const person = row.leads?.customers;
    return {
      id: row.id,
      kind: row.kind,
      scheduledAt: row.scheduled_at,
      status: row.status,
      name: person?.full_name ?? person?.display_name ?? person?.wa_id ?? null,
      property: row.properties?.name ?? null,
    };
  });
}
