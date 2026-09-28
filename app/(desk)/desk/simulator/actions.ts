"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { signBody } from "@/lib/whatsapp/verify";
import { simulatorEnabled } from "@/lib/desk/simulator";

export type SimulateState = { ok: boolean; message: string; waMessageId?: string };

/**
 * The Meta Cloud API account does not exist yet, and will not for as long as
 * approval takes. This posts a correctly shaped, correctly signed webhook at
 * the real endpoint over real HTTP, so signature verification, deduplication,
 * persistence, the debounce and the agent all run exactly as they will in
 * production. Nothing here is a mock of the pipeline; only the sender is fake.
 */
export async function simulateInbound(
  _prev: SimulateState,
  form: FormData
): Promise<SimulateState> {
  if (!simulatorEnabled()) {
    return { ok: false, message: "Simulator is disabled in this environment." };
  }

  const text = String(form.get("text") ?? "").trim();
  if (!text) return { ok: false, message: "Type a message first." };

  const waId = String(form.get("waId") ?? "").trim() || "919000000001";
  const name = String(form.get("name") ?? "").trim() || "Simulator";
  // Blank generates a fresh id. Pasting a previous one back re-sends the exact
  // same message, which is how the duplicate-delivery guarantee gets tested.
  const waMessageId = String(form.get("waMessageId") ?? "").trim() || `wamid.sim.${randomUUID()}`;

  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    return {
      ok: false,
      message: "Set WHATSAPP_APP_SECRET in .env.local (any random string until Meta issues the real one).",
    };
  }

  const raw = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "sim-waba",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              contacts: [{ wa_id: waId, profile: { name } }],
              messages: [
                {
                  id: waMessageId,
                  from: waId,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  const head = await headers();
  const host = head.get("host");
  const proto = head.get("x-forwarded-proto") ?? "http";

  const res = await fetch(`${proto}://${host}/api/whatsapp/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": signBody(raw, secret),
    },
    body: raw,
  });

  if (!res.ok) {
    return { ok: false, message: `Webhook returned ${res.status}: ${await res.text()}` };
  }

  revalidatePath("/desk/simulator");

  return {
    ok: true,
    message: "Delivered. The reply lands after the 4s debounce.",
    waMessageId,
  };
}
