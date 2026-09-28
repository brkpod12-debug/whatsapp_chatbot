/**
 * Lead scoring. Deterministic, and never decided by the model.
 *
 * The LLM extracts facts; this function turns facts into a number. That split
 * is the whole point: a score the model invents is unauditable and drifts with
 * the weather, and this one can be explained to the owner line by line.
 */

export type Temperature = "HOT" | "WARM" | "COLD";

export type ScorableLead = {
  callBookedAt?: string | null;
  viewingRequested?: boolean | null;
  dossierRequested?: boolean | null;
  propertyOfInterest?: string | null;
  budgetBand?: string | null;
  timelineMonths?: number | null;
  assetClass?: string | null;
  tags?: string[] | null;
};

export type Signal = { label: string; points: number };

export type ScoreResult = {
  score: number;
  temperature: Temperature;
  /** Which signals fired, for the score breakdown in the right rail. */
  signals: Signal[];
};

export type Thresholds = { hot: number; warm: number };

export const DEFAULT_THRESHOLDS: Thresholds = { hot: 75, warm: 45 };

/** The bands the firm's book actually covers. Above it, escalate rather than score. */
const SERVED_BANDS = new Set(["under_1cr", "1_3cr", "3_6cr"]);

export function calculateLeadScore(
  lead: ScorableLead,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): ScoreResult {
  const tags = lead.tags ?? [];
  const signals: Signal[] = [];

  const add = (label: string, points: number, fired: boolean) => {
    if (fired) signals.push({ label, points });
  };

  add("Call booked", 30, Boolean(lead.callBookedAt));
  add("Viewing requested", 25, Boolean(lead.viewingRequested));
  add("Dossier requested", 20, Boolean(lead.dossierRequested));
  add("Named a holding", 15, Boolean(lead.propertyOfInterest));
  add("Budget in our band", 15, SERVED_BANDS.has(lead.budgetBand ?? ""));
  add("Moving within 3 months", 15, (lead.timelineMonths ?? 99) <= 3);
  add("Asset class known", 10, Boolean(lead.assetClass));
  add("NRI", 10, tags.includes("NRI"));
  add("Returning customer", 10, tags.includes("REPEAT"));
  add("Price fishing", -20, tags.includes("PRICE_FISHING"));
  add("Outside our areas", -20, tags.includes("OUT_OF_AREA"));

  const raw = signals.reduce((sum, s) => sum + s.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  const temperature: Temperature =
    score >= thresholds.hot ? "HOT" : score >= thresholds.warm ? "WARM" : "COLD";

  return { score, temperature, signals };
}

/**
 * Sellers and brokers are not cold buyers. For a firm holding seven properties,
 * a landowner with 20 acres in Shankarpally may be the most valuable message of
 * the week, and scoring them on buyer signals would bury them.
 */
export function bypassesScoring(tags: string[] | null | undefined): boolean {
  const t = tags ?? [];
  return t.includes("SELLER") || t.includes("BROKER");
}
