import { type NextRequest } from "next/server";
import { syncProperties } from "@/lib/desk/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Two Sanity fetches and an upsert of the whole register. Seconds, not minutes.
export const maxDuration = 60;

/**
 * Nightly reconcile. The Sanity webhook is the fast path; this is the one that
 * guarantees a missed webhook never leaves a sold plot marketable overnight.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without the secret
 * set, the endpoint refuses rather than running open to the internet.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Forbidden", { status: 403 });
  }

  const result = await syncProperties();
  return Response.json(result, { status: result.errors.length > 0 ? 500 : 200 });
}
