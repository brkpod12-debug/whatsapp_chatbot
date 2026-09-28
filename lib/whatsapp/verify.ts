import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Meta signs every webhook POST with an HMAC-SHA256 of the *raw* body under the
 * app secret, sent as `X-Hub-Signature-256: sha256=<hex>`. Anyone who learns the
 * webhook URL can otherwise inject fake customers and fake messages straight
 * into the CRM, so this runs before the body is parsed.
 *
 * The body must be the exact bytes Meta sent. `await request.text()` before any
 * `JSON.parse`; re-serialising a parsed object changes key order and whitespace
 * and the digest will never match.
 */
export function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string | undefined = process.env.WHATSAPP_APP_SECRET
): boolean {
  if (!secret) return false;
  if (!header?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const got = Buffer.from(header.slice(7), "hex");

  // timingSafeEqual throws on a length mismatch, and `===` on hex strings leaks
  // the position of the first wrong byte to a patient attacker.
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** Only used by the dev simulator, which has to sign its own payloads. */
export function signBody(rawBody: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}
