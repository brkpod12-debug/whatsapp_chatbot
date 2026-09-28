import type { LeadListRow } from "./leads";

/**
 * CSV for the owner's spreadsheet. Split out of `leads.ts` because that module
 * is `server-only` and the escaping rules here are the part worth testing.
 */
export function toCsv(rows: LeadListRow[]): string {
  const headers = [
    "name", "whatsapp", "intent", "asset_class", "locality", "budget_band",
    "timeline_months", "score", "temperature", "stage", "tags", "source",
    "next_action", "next_action_due", "updated_at",
  ];

  // A field containing a comma, quote or newline has to be quoted, with inner
  // quotes doubled. Anything less and one Telugu address breaks the whole file.
  const escape = (value: unknown): string => {
    const s = value == null ? "" : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.name, r.waId, r.intent, r.assetClass, r.locality, r.budgetBand,
        r.timelineMonths, r.score, r.temperature, r.stage, r.tags.join(" "),
        r.source, r.nextAction, r.nextActionDue, r.updatedAt,
      ]
        .map(escape)
        .join(",")
    );
  }

  return lines.join("\r\n");
}
