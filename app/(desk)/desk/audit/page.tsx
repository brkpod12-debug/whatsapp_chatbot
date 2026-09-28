import Link from "next/link";
import { deskClient } from "@/lib/desk/supabase";

export const dynamic = "force-dynamic";

/**
 * The page that answers "what is it saying to my customers?". Every guardrail
 * block shows the draft that was stopped, which is a more convincing answer
 * than any assurance.
 */
const EVENTS = [
  "guardrail_block",
  "escalation",
  "takeover",
  "gave_back_to_ai",
  "score_change",
  "stage_change",
  "ai_reply",
  "sync",
  "turn_error",
] as const;

const TONE: Record<string, string> = {
  guardrail_block: "text-wax",
  turn_error: "text-wax",
  escalation: "text-champagne",
  takeover: "text-champagne",
};

function summarise(event: string, detail: Record<string, unknown> | null): string {
  if (!detail) return "";
  switch (event) {
    case "guardrail_block":
      return `${String(detail.rule ?? "")}: ${String(detail.evidence ?? "")}`;
    case "escalation":
      return [detail.reason, detail.note].filter(Boolean).join(" · ");
    case "score_change": {
      const from = detail.from as { score?: number; temperature?: string } | undefined;
      const to = detail.to as { score?: number; temperature?: string } | undefined;
      return `${from?.score ?? "?"} ${from?.temperature ?? ""} to ${to?.score ?? "?"} ${to?.temperature ?? ""}`;
    }
    case "stage_change":
      return `${String(detail.from ?? "?")} to ${String(detail.to ?? "?")}`;
    case "ai_reply":
      return Array.isArray(detail.toolsUsed) && detail.toolsUsed.length > 0
        ? `tools: ${(detail.toolsUsed as string[]).join(", ")}`
        : "no tools";
    case "sync":
      return `${String(detail.upserted ?? 0)} upserted, ${String(detail.withdrawn ?? 0)} withdrawn`;
    default:
      return "";
  }
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const supabase = await deskClient();

  let query = supabase
    .from("audit_log")
    .select("id, conversation_id, event, actor, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (event) query = query.eq("event", event);

  const { data: rows, error } = await query;

  return (
    <div className="px-6 py-10">
      <h1 className="font-display text-4xl">Audit</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        Every guardrail block, escalation, takeover and score change. A block means the desk tried to
        say something it is not allowed to say, and did not send it.
      </p>

      <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-y border-line py-3">
        <Link href="/desk/audit" className={`stamp ${event ? "text-slate hover:text-ink" : "text-ink"}`}>
          All
        </Link>
        {EVENTS.map((e) => (
          <Link
            key={e}
            href={`/desk/audit?event=${e}`}
            className={`stamp ${event === e ? "text-ink" : "text-slate hover:text-ink"}`}
          >
            {e.replace(/_/g, " ")}
          </Link>
        ))}
      </nav>

      {error ? <p className="mt-6 text-sm text-wax">{error.message}</p> : null}

      <ul className="mt-6 divide-y divide-line border-t border-line">
        {(rows ?? []).map((row) => {
          const detail = row.detail as Record<string, unknown> | null;
          const blocked = row.event === "guardrail_block" ? (detail?.draft as string | undefined) : undefined;

          return (
            <li key={row.id as string} className="py-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className={`stamp w-32 shrink-0 ${TONE[row.event as string] ?? "text-slate"}`}>
                  {(row.event as string).replace(/_/g, " ")}
                </span>
                <span className="flex-1 text-sm">{summarise(row.event as string, detail)}</span>
                <span className="stamp text-slate">{(row.actor as string | null) ?? "system"}</span>
                <span className="stamp text-slate">
                  {new Date(row.created_at as string).toLocaleString()}
                </span>
                {row.conversation_id ? (
                  <Link
                    href={`/desk/conversations/${row.conversation_id as string}`}
                    className="stamp text-champagne hover:text-ink"
                  >
                    thread
                  </Link>
                ) : null}
              </div>

              {blocked ? (
                <p className="mt-2 border-l-2 border-wax bg-stone px-3 py-2 text-sm text-slate">
                  {blocked}
                </p>
              ) : null}
            </li>
          );
        })}

        {(rows ?? []).length === 0 && !error ? (
          <li className="py-6 text-sm text-slate">Nothing logged yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
