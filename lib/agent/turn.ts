import "server-only";
import { serviceClient } from "@/lib/desk/supabase";
import { markRead, sendText } from "@/lib/whatsapp/send";
import { generateReply } from "./agent";

/**
 * One inbound turn, start to finish. Called from `after()` in the webhook, so
 * the 200 has already gone back to Meta and nothing here is on the clock.
 *
 * Every early return is a deliberate "the AI should stay quiet": a human has
 * taken over, the kill switch is down, the customer is blocked, or a newer
 * message means a later invocation owns this turn.
 */

/** How long to wait for the rest of a burst before treating it as one turn. */
const DEBOUNCE_MS = 4000;

export type TurnOutcome =
  | "replied"
  | "superseded"
  | "ai_disabled"
  | "kill_switch"
  | "blocked"
  | "window_closed"
  | "nothing_to_say"
  | "error";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Meta refuses free-form text more than 24h after the customer last spoke. */
export function windowOpen(lastInboundAt: string | null): boolean {
  if (!lastInboundAt) return false;
  return Date.now() - new Date(lastInboundAt).getTime() < 24 * 60 * 60 * 1000;
}

async function newestInboundId(
  db: ReturnType<typeof serviceClient>,
  conversationId: string
): Promise<string | null> {
  const { data } = await db
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function processTurn(conversationId: string): Promise<TurnOutcome> {
  const db = serviceClient();

  try {
    // Indian WhatsApp users send "hi" / "need land" / "near shankarpally" /
    // "budget 2cr" as four messages in six seconds. Without this the bot fires
    // four replies and looks broken. Wait out the burst, then let only the last
    // invocation continue: the earlier ones see a newer message and bow out.
    //
    // ponytail: a 4s sleep inside after() with a last-writer-wins check. No
    // queue, no Redis. Move to a real queue only if turns start overlapping at
    // volume, which at tens of enquiries a day they will not.
    const before = await newestInboundId(db, conversationId);
    await sleep(DEBOUNCE_MS);
    const afterWait = await newestInboundId(db, conversationId);
    if (before !== afterWait) return "superseded";

    const { data: settings } = await db
      .from("agent_settings")
      .select("ai_globally_enabled")
      .eq("id", 1)
      .maybeSingle();
    if (settings && settings.ai_globally_enabled === false) return "kill_switch";

    const { data: conversation } = await db
      .from("conversations")
      .select("id, ai_enabled, last_inbound_at, customer_id, customers(blocked, wa_id)")
      .eq("id", conversationId)
      .single();
    if (!conversation) return "error";

    // The takeover toggle in the inbox. A human is typing; stay out of the way.
    if (conversation.ai_enabled === false) return "ai_disabled";

    const customer = conversation.customers as unknown as { blocked: boolean; wa_id: string } | null;
    if (!customer || customer.blocked) return "blocked";
    if (!windowOpen(conversation.last_inbound_at as string | null)) return "window_closed";

    // Blue ticks. The customer sees the desk has the message while the reply is
    // still being written. Best-effort by design: it swallows its own failures.
    const { data: unread } = await db
      .from("messages")
      .select("wa_message_id")
      .eq("conversation_id", conversationId)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (unread?.wa_message_id) await markRead(unread.wa_message_id as string);

    const reply = await generateReply(conversationId);
    if (!reply) return "nothing_to_say";

    const sent = await sendText(customer.wa_id, reply.body);

    await db.from("messages").insert({
      conversation_id: conversationId,
      wa_message_id: sent.id,
      direction: "outbound",
      sender: "ai",
      msg_type: "text",
      body: reply.body,
      status: sent.simulated ? "simulated" : "sent",
    });

    await db
      .from("conversations")
      .update({ last_outbound_at: new Date().toISOString() })
      .eq("id", conversationId);

    await db.from("audit_log").insert({
      conversation_id: conversationId,
      event: "ai_reply",
      actor: "ai",
      detail: reply.audit ?? null,
    });

    return "replied";
  } catch (error) {
    console.error("[turn]", conversationId, error);
    await db.from("audit_log").insert({
      conversation_id: conversationId,
      event: "turn_error",
      actor: "system",
      detail: { message: error instanceof Error ? error.message : String(error) },
    });
    return "error";
  }
}
