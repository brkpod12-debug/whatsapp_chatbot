import "server-only";
import { serviceClient } from "./supabase";
import { sendTemplate } from "@/lib/whatsapp/send";

/**
 * Handing a conversation to the concierge. Two things happen and they are
 * independent: the AI stops replying to that thread, and a human is told.
 */

/** One alert per lead per six hours. An owner's phone buzzing eleven times for
 *  one conversation is how a system like this gets switched off in week two. */
const DEBOUNCE_MS = 6 * 60 * 60 * 1000;

export type EscalationReason =
  | "customer_asked_for_human"
  | "seller"
  | "broker"
  | "legal_or_complaint"
  | "high_value"
  | "agent_stuck"
  | "became_hot";

export type EscalationResult = { notified: boolean; reason: string };

export async function escalate(
  conversationId: string,
  reason: EscalationReason,
  options: { stopAi?: boolean; note?: string } = {}
): Promise<EscalationResult> {
  const db = serviceClient();

  if (options.stopAi !== false) {
    await db.from("conversations").update({ ai_enabled: false }).eq("id", conversationId);
  }
  // Whatever happens with the notification, the desk sees it in the inbox.
  await db.from("conversations").update({ unread_for_owner: true }).eq("id", conversationId);

  const { data: lead } = await db
    .from("leads")
    .select("id, owner_notified_at, score, temperature, asset_class, locality, budget_band, tags")
    .eq("conversation_id", conversationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastNotified = lead?.owner_notified_at as string | null;
  const debounced =
    Boolean(lastNotified) && Date.now() - new Date(lastNotified!).getTime() < DEBOUNCE_MS;

  await db.from("audit_log").insert({
    conversation_id: conversationId,
    event: "escalation",
    actor: "ai",
    detail: { reason, note: options.note ?? null, notified: !debounced },
  });

  if (debounced) return { notified: false, reason: "debounced" };

  const conciergeWaId = process.env.CONCIERGE_WA_ID;
  if (!conciergeWaId) return { notified: false, reason: "CONCIERGE_WA_ID not set" };

  const { data: customer } = await db
    .from("conversations")
    .select("customers ( full_name, display_name, wa_id )")
    .eq("id", conversationId)
    .maybeSingle();

  const person = customer?.customers as unknown as
    | { full_name: string | null; display_name: string | null; wa_id: string }
    | null;

  try {
    // Business-initiated, so it must be an approved template. Parameters follow
    // the order the template body declares.
    await sendTemplate(conciergeWaId, "hot_lead_alert", "en", [
      {
        type: "body",
        parameters: [
          { type: "text", text: person?.full_name ?? person?.display_name ?? "Unknown" },
          { type: "text", text: person?.wa_id ?? "—" },
          {
            type: "text",
            text:
              [lead?.asset_class, lead?.locality, lead?.budget_band].filter(Boolean).join(" · ") ||
              "not yet qualified",
          },
          { type: "text", text: `${lead?.score ?? 0} ${lead?.temperature ?? "COLD"} · ${reason}` },
        ],
      },
    ]);
  } catch (error) {
    console.error("[escalate:notify]", error);
    return { notified: false, reason: "send failed" };
  }

  if (lead?.id) {
    await db
      .from("leads")
      .update({ owner_notified_at: new Date().toISOString() })
      .eq("id", lead.id as string);
  }

  // ponytail: WhatsApp only. Email needs a provider account and an SDK; the
  // alert plus the inbox badge covers the owner today. Add one if the concierge
  // ever misses an alert because their phone was off.
  return { notified: true, reason };
}
