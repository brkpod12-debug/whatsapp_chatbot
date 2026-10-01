import { after, type NextRequest } from "next/server";
import { changeValues, type WaWebhookBody } from "@/lib/whatsapp/payload";
import { verifySignature } from "@/lib/whatsapp/verify";
import { ingestMessages, ingestStatuses } from "@/lib/desk/ingest";
import { processTurn } from "@/lib/agent/turn";

// node:crypto for the signature check, and this must never be prerendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The 200 goes back in milliseconds; this budget is for the `after()` work.
// A turn costs a 4s debounce plus up to three tool rounds and two guardrail
// retries, so roughly 25s at the worst. Vercel's Fluid default is 300s, which
// is a lot of billed compute for one hung Groq call: this caps the blast radius
// rather than raising a ceiling.
export const maxDuration = 60;

/**
 * Meta's subscription handshake. Called once when the webhook URL is saved in
 * the Meta dashboard, and again whenever the callback URL is edited.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    verifyToken &&
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === verifyToken
  ) {
    // Meta wants the challenge back as bare text, not JSON.
    return new Response(params.get("hub.challenge") ?? "", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * Inbound messages and delivery receipts.
 *
 * Contract with Meta: acknowledge within 5 seconds or it retries, and it
 * redelivers freely, so everything here is idempotent. Persist, 200, then do
 * the slow work in `after()`.
 */
export async function POST(request: NextRequest) {
  // Must be the exact bytes Meta signed. Parsing first and re-serialising
  // changes key order and breaks the digest.
  const raw = await request.text();

  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    // Also the response when WHATSAPP_APP_SECRET is unset: no secret means no
    // way to tell Meta from anyone who guessed the URL, so nothing is trusted.
    return new Response("Invalid signature", { status: 401 });
  }

  let body: WaWebhookBody;
  try {
    body = JSON.parse(raw) as WaWebhookBody;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  try {
    const pending: string[] = [];

    for (const value of changeValues(body)) {
      await ingestStatuses(value);
      const { conversationIds } = await ingestMessages(value);
      pending.push(...conversationIds);
    }

    // Returns immediately; these run after the 200 is on the wire.
    if (pending.length > 0) {
      after(async () => {
        await Promise.all([...new Set(pending)].map((id) => processTurn(id)));
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    // A 500 makes Meta retry, which is what we want: the message is not stored
    // and losing it is worse than processing it twice (the unique index on
    // wa_message_id makes the retry harmless).
    console.error("[webhook]", error);
    return new Response("Ingest failed", { status: 500 });
  }
}
