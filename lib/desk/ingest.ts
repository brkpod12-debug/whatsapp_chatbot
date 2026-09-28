import "server-only";
import { serviceClient } from "./supabase";
import {
  countryHint,
  extractContent,
  type WaChangeValue,
  type WaMessage,
  type WaStatus,
} from "@/lib/whatsapp/payload";

/**
 * The webhook's only job before it returns 200: get the message on disk,
 * exactly once. Everything slower than that (transcription, the agent, scoring)
 * happens afterwards in `after()`.
 *
 * Runs with the service-role key because there is no signed-in user on this
 * path. That bypasses RLS, which is why it lives behind `server-only` and is
 * called from nowhere but the webhook.
 */

/** Postgres unique_violation. Meta redelivers webhooks; this is how we notice. */
const UNIQUE_VIOLATION = "23505";

async function upsertCustomer(
  db: ReturnType<typeof serviceClient>,
  waId: string,
  displayName: string | null,
  referral: WaMessage["referral"]
): Promise<string | null> {
  const { countryHint: hint, isNri } = countryHint(waId);

  const row: Record<string, unknown> = {
    wa_id: waId,
    last_seen_at: new Date().toISOString(),
    country_hint: hint,
    is_nri: isNri,
  };
  // Absent keys are not written, so a customer who once gave a profile name
  // does not lose it when a later message arrives without one.
  if (displayName) row.display_name = displayName;
  if (referral?.source_type) row.source = referral.source_type;

  const { data, error } = await db
    .from("customers")
    .upsert(row, { onConflict: "wa_id" })
    .select("id")
    .single();

  if (error) {
    console.error("[ingest:customer]", error.message);
    return null;
  }
  return data.id as string;
}

async function openConversation(
  db: ReturnType<typeof serviceClient>,
  customerId: string,
  referral: WaMessage["referral"]
): Promise<string | null> {
  const { data: existing } = await db
    .from("conversations")
    .select("id")
    .eq("customer_id", customerId)
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await db
    .from("conversations")
    .insert({ customer_id: customerId, referral: referral ?? null })
    .select("id")
    .single();

  if (error) {
    console.error("[ingest:conversation]", error.message);
    return null;
  }
  return data.id as string;
}

export type IngestResult = {
  /** Conversations that gained a genuinely new inbound message and owe a turn. */
  conversationIds: string[];
  duplicates: number;
};

export async function ingestMessages(value: WaChangeValue): Promise<IngestResult> {
  const messages = value.messages ?? [];
  if (messages.length === 0) return { conversationIds: [], duplicates: 0 };

  const db = serviceClient();
  const names = new Map(
    (value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null] as const)
  );

  const conversationIds = new Set<string>();
  let duplicates = 0;

  for (const message of messages) {
    const customerId = await upsertCustomer(
      db,
      message.from,
      names.get(message.from) ?? null,
      message.referral
    );
    if (!customerId) continue;

    const conversationId = await openConversation(db, customerId, message.referral);
    if (!conversationId) continue;

    const { msgType, body, mediaId } = extractContent(message);

    const { error } = await db.from("messages").insert({
      conversation_id: conversationId,
      wa_message_id: message.id,
      direction: "inbound",
      sender: "customer",
      msg_type: msgType,
      body,
      // The opaque Graph media id. It is exchanged for a real, short-lived URL
      // only when something needs the bytes (voice-note transcription).
      media_url: mediaId,
      created_at: message.timestamp
        ? new Date(Number(message.timestamp) * 1000).toISOString()
        : new Date().toISOString(),
    });

    if (error) {
      // The unique index on wa_message_id is the entire idempotency story: a
      // redelivered webhook lands here and is dropped without a second row and
      // without a second AI reply.
      if (error.code === UNIQUE_VIOLATION) {
        duplicates += 1;
        continue;
      }
      console.error("[ingest:message]", error.message);
      continue;
    }

    await db
      .from("conversations")
      .update({ last_inbound_at: new Date().toISOString(), unread_for_owner: true })
      .eq("id", conversationId);

    conversationIds.add(conversationId);
  }

  return { conversationIds: [...conversationIds], duplicates };
}

/** Delivery receipts. This is what drives sent/delivered/read/failed in the inbox. */
export async function ingestStatuses(value: WaChangeValue): Promise<number> {
  const statuses: WaStatus[] = value.statuses ?? [];
  if (statuses.length === 0) return 0;

  const db = serviceClient();
  let updated = 0;

  for (const status of statuses) {
    const { error } = await db
      .from("messages")
      .update({
        status: status.status,
        error_detail: status.errors?.length ? status.errors : null,
      })
      .eq("wa_message_id", status.id);

    if (error) console.error("[ingest:status]", error.message);
    else updated += 1;
  }

  return updated;
}
