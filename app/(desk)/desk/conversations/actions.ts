"use server";

import { revalidatePath } from "next/cache";
import { deskClient } from "@/lib/desk/supabase";
import { sendText, sendTemplate } from "@/lib/whatsapp/send";
import { windowOpen } from "@/lib/agent/turn";

export type ComposerState = { ok: boolean; message: string };

/**
 * Every action here writes through `deskClient()`, never the service key: the
 * caller is a signed-in human and RLS should be the thing that decides, not a
 * key that bypasses it. An expired session fails the auth check below and
 * writes nothing.
 */
async function requireUser() {
  const supabase = await deskClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

export async function sendHumanMessage(
  _prev: ComposerState,
  form: FormData
): Promise<ComposerState> {
  const conversationId = String(form.get("conversationId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!conversationId || !body) return { ok: false, message: "Nothing to send." };

  const { supabase } = await requireUser();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, last_inbound_at, customers ( wa_id )")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) return { ok: false, message: "Conversation not found." };

  const waId = (conversation.customers as unknown as { wa_id: string } | null)?.wa_id;
  if (!waId) return { ok: false, message: "No WhatsApp number on this customer." };

  // Meta rejects free-form text outside the 24-hour customer-service window.
  // Refusing here, with the reason, beats a silent failure at the Graph API.
  if (!windowOpen(conversation.last_inbound_at as string | null)) {
    return {
      ok: false,
      message: "The 24-hour window has closed. Only an approved template can be sent.",
    };
  }

  try {
    const sent = await sendText(waId, body);

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      wa_message_id: sent.id,
      direction: "outbound",
      sender: "human",
      msg_type: "text",
      body,
      status: sent.simulated ? "simulated" : "sent",
    });

    await supabase
      .from("conversations")
      .update({ last_outbound_at: new Date().toISOString(), unread_for_owner: false })
      .eq("id", conversationId);

    revalidatePath(`/desk/conversations/${conversationId}`);
    return { ok: true, message: sent.simulated ? "Saved (simulated send)." : "Sent." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Send failed." };
  }
}

export async function sendHumanTemplate(
  _prev: ComposerState,
  form: FormData
): Promise<ComposerState> {
  const conversationId = String(form.get("conversationId") ?? "");
  const template = String(form.get("template") ?? "").trim();
  if (!conversationId || !template) return { ok: false, message: "Pick a template." };

  const { supabase } = await requireUser();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, customers ( wa_id )")
    .eq("id", conversationId)
    .maybeSingle();

  const waId = (conversation?.customers as unknown as { wa_id: string } | null)?.wa_id;
  if (!waId) return { ok: false, message: "No WhatsApp number on this customer." };

  try {
    const sent = await sendTemplate(waId, template);

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      wa_message_id: sent.id,
      direction: "outbound",
      sender: "human",
      msg_type: "template",
      template_name: template,
      status: sent.simulated ? "simulated" : "sent",
    });

    await supabase
      .from("conversations")
      .update({ last_outbound_at: new Date().toISOString(), unread_for_owner: false })
      .eq("id", conversationId);

    revalidatePath(`/desk/conversations/${conversationId}`);
    return { ok: true, message: `Template "${template}" sent.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Send failed." };
  }
}

/**
 * The takeover toggle. Turning the AI off is the escalation path Meta's policy
 * requires, so it takes effect on the very next turn: `processTurn` re-reads
 * `ai_enabled` after its debounce, which means a takeover mid-burst still wins.
 */
export async function setAiEnabled(conversationId: string, enabled: boolean): Promise<void> {
  const { supabase, user } = await requireUser();

  await supabase.from("conversations").update({ ai_enabled: enabled }).eq("id", conversationId);

  await supabase.from("audit_log").insert({
    conversation_id: conversationId,
    event: enabled ? "gave_back_to_ai" : "takeover",
    actor: user.email ?? user.id,
    detail: { ai_enabled: enabled },
  });

  revalidatePath(`/desk/conversations/${conversationId}`);
  revalidatePath("/desk/conversations");
}

export async function markThreadRead(conversationId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase
    .from("conversations")
    .update({ unread_for_owner: false })
    .eq("id", conversationId);
  revalidatePath("/desk/conversations");
}
