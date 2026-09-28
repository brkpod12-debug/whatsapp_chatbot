/**
 * Sanity stores prices, areas and beds as display strings written for humans:
 * "₹49-52 Lakhs (Negotiable)", "1,185 sq.ft · UDS 34 sq.yds", "2 BHK". The bot
 * needs numbers to filter on, and the guardrail needs to know which rupee
 * figures a listing is actually allowed to quote.
 *
 * These parsers are the only place that conversion happens. Every real string
 * in the live dataset is covered by parse.test.ts.
 */

const LAKH = 100_000;
const CRORE = 10_000_000;

/** Hyphen, en-dash and em-dash all appear in the data. */
const DASH = "[-\\u2013\\u2014]";

export type ParsedPrice = {
  /** The only figure, or the low end of a range. Search filters on this. */
  inr: number | null;
  /** Null unless the listing quotes a range. */
  maxInr: number | null;
  negotiable: boolean;
};

export function parsePrice(input: string | null | undefined): ParsedPrice {
  const s = (input ?? "").replace(/,/g, "");
  // "(Fixed)" is explicit in the data and must not read as negotiable.
  const negotiable = /negotiable/i.test(s);

  const m = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\s*(?:${DASH}\\s*(\\d+(?:\\.\\d+)?))?\\s*(lakhs?|lacs?|l|crores?|cr)\\b`,
    "i"
  ).exec(s);
  if (!m) return { inr: null, maxInr: null, negotiable };

  const unit = /^(c|cr)/i.test(m[3]) ? CRORE : LAKH;
  const low = Math.round(Number(m[1]) * unit);
  const high = m[2] ? Math.round(Number(m[2]) * unit) : null;

  return { inr: low, maxInr: high, negotiable };
}

export type AreaUnit = "sqft" | "acres" | "sqyds";

export type ParsedArea = {
  /** Low end when the string quotes a range ("2-3 acres" -> 2). */
  value: number | null;
  unit: AreaUnit | null;
  /** Undivided share, carried in the same string after a middot. */
  udsSqyds: number | null;
};

function unitOf(raw: string): AreaUnit | null {
  const u = raw.toLowerCase().replace(/[\s.]/g, "");
  if (u.startsWith("sqft")) return "sqft";
  if (u.startsWith("acre")) return "acres";
  if (u.startsWith("sqyd")) return "sqyds";
  return null;
}

export function parseArea(input: string | null | undefined): ParsedArea {
  const out: ParsedArea = { value: null, unit: null, udsSqyds: null };
  if (!input) return out;

  // "1,185 sq.ft · UDS 34 sq.yds" packs both facts into one field.
  for (const part of input.split("·")) {
    const s = part.replace(/,/g, "").trim();
    const m = new RegExp(
      `(\\d+(?:\\.\\d+)?)(?:\\s*${DASH}\\s*\\d+(?:\\.\\d+)?)?\\s*(sq\\.?\\s?ft|sq\\.?\\s?yds?|acres?)`,
      "i"
    ).exec(s);
    if (!m) continue;

    const unit = unitOf(m[2]);
    const value = Number(m[1]);
    if (/uds/i.test(s) && unit === "sqyds") {
      out.udsSqyds = value;
    } else if (out.value === null) {
      out.value = value;
      out.unit = unit;
    }
  }
  return out;
}

/** "2 BHK" -> 2. */
export function parseBhk(input: string | null | undefined): number | null {
  const m = /(\d+)\s*BHK/i.exec(input ?? "");
  return m ? Number(m[1]) : null;
}

/** Sanity's Title Case status labels to the mirror's snake_case enum. */
export function parseStatus(input: string | null | undefined): string {
  return (input ?? "available").trim().toLowerCase().replace(/\s+/g, "_");
}

/** "Pragathi Nagar, Hyderabad" -> "Pragathi Nagar". */
export function parseLocality(input: string | null | undefined): string | null {
  const first = (input ?? "").split(",")[0]?.trim();
  return first || null;
}
