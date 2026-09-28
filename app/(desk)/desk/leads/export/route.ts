import { type NextRequest } from "next/server";
import { deskClient } from "@/lib/desk/supabase";
import { listLeads, type LeadFilters } from "@/lib/desk/leads";
import { toCsv } from "@/lib/desk/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exports exactly what the table in front of the owner is showing, filters and
 * all. A CSV of "everything" is a different, less useful file.
 */
export async function GET(request: NextRequest) {
  const supabase = await deskClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // `proxy.ts` already gates /desk, but a downloadable export is worth a second
  // check: it leaves the app as a file.
  if (!user) return new Response("Unauthorized", { status: 401 });

  const params = request.nextUrl.searchParams;
  const filters: LeadFilters = {
    temperature: params.get("temperature") ?? undefined,
    stage: params.get("stage") ?? undefined,
    assetClass: params.get("assetClass") ?? undefined,
    tag: params.get("tag") ?? undefined,
    q: params.get("q") ?? undefined,
  };

  const leads = await listLeads(filters, 5000);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(toCsv(leads), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="josh-properties-leads-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
