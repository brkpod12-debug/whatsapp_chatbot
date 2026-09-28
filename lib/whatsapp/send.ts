import "server-only";

const API_VERSION = "v21.0";

export type SendResult = { id: string; simulated: boolean };

/** Meta is configured only once the Cloud API app exists. Until then every send is simulated. */
export function isLive(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export class WhatsAppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: unknown
  ) {
    super(message);
    this.name = "WhatsAppError";
  }
}

async function graph(payload: Record<string, unknown>): Promise<SendResult> {
  if (!isLive()) {
    // The simulator, the inbox and the agent all run this path before the Meta
    // account exists. A fake id keeps the `messages` row shape identical, so
    // nothing downstream has to know whether the send was real.
    console.info("[whatsapp:simulated]", JSON.stringify(payload));
    return { id: `sim.${crypto.randomUUID()}`, simulated: true };
  }

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    }
  );

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = (json as { error?: { message?: string } })?.error;
    throw new WhatsAppError(detail?.message ?? `Graph API ${res.status}`, res.status, json);
  }

  const id = (json as { messages?: { id: string }[] })?.messages?.[0]?.id;
  return { id: id ?? `unknown.${Date.now()}`, simulated: false };
}

/**
 * Free-form text. Only legal inside the 24-hour customer-service window: after
 * that Meta rejects it and `sendTemplate` is the only route. Callers check the
 * window; this helper does not, so a deliberate out-of-window send still fails
 * loudly rather than silently doing nothing.
 */
export function sendText(waId: string, body: string): Promise<SendResult> {
  return graph({ to: waId, type: "text", text: { preview_url: false, body } });
}

/** Business-initiated, or any send after the window shuts. Must be Meta-approved. */
export function sendTemplate(
  waId: string,
  name: string,
  language = "en",
  components?: unknown[]
): Promise<SendResult> {
  return graph({
    to: waId,
    type: "template",
    template: { name, language: { code: language }, ...(components ? { components } : {}) },
  });
}

/** Blue ticks. Best-effort: a failed read receipt must never fail a turn. */
export async function markRead(waMessageId: string): Promise<void> {
  if (!isLive()) return;
  try {
    await graph({ status: "read", message_id: waMessageId });
  } catch (error) {
    console.warn("[whatsapp:markRead]", error);
  }
}
