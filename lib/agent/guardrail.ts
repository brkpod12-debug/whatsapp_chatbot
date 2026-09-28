/**
 * Post-generation check on every outbound draft. Prompt instructions are a
 * request; this is the enforcement. A model that has been told nine times not
 * to quote a price it does not have will still do it on the tenth turn, and in
 * real estate that single sentence is the whole liability.
 *
 * Pure and dependency-free so it can be tested exhaustively, and so it can be
 * run against a draft without touching the database.
 */

export type GuardrailRule =
  | "invented_price"
  | "title_assertion"
  | "legal_advice"
  | "forecast"
  | "negotiation"
  | "claims_human"
  | "internal_leak"
  | "off_brand";

export type GuardrailVerdict =
  | { ok: true }
  | { ok: false; rule: GuardrailRule; evidence: string };

const LAKH = 100_000;
const CRORE = 10_000_000;

/**
 * Every rupee figure in a piece of text, normalised to whole rupees.
 *
 * Only counts a number that is actually money: either prefixed with a rupee
 * marker, or suffixed with a lakh/crore unit. "6 acres" and "2 BHK" are not
 * prices and must not be, or the guardrail blocks every honest reply.
 */
export function extractRupees(text: string): Set<number> {
  const found = new Set<number>();
  const cleaned = text.replace(/,/g, "");

  // 1.35 Cr | 65 lakhs | 49-52 lakhs (both ends count as quoted)
  const unitised = /(\d+(?:\.\d+)?)(?:\s*[-\u2013\u2014]\s*(\d+(?:\.\d+)?))?\s*(lakhs?|lacs?|crores?|cr)\b/gi;
  for (const m of cleaned.matchAll(unitised)) {
    const unit = /^(c|cr)/i.test(m[3]) ? CRORE : LAKH;
    found.add(Math.round(Number(m[1]) * unit));
    if (m[2]) found.add(Math.round(Number(m[2]) * unit));
  }

  // ₹13500000 or Rs 13500000, written out in full.
  const plain = /(?:₹|\bRs\.?\s*)(\d{4,})/gi;
  for (const m of cleaned.matchAll(plain)) found.add(Number(m[1]));

  return found;
}

const PATTERNS: { rule: GuardrailRule; re: RegExp }[] = [
  // Only counsel, in the dossier, may speak to title.
  { rule: "title_assertion", re: /\b(title is clear|clear title|clean title|no dispute|dispute[- ]free|litigation[- ]free)\b/i },
  // Eligibility, tax and FEMA are legal questions and go to a human.
  { rule: "legal_advice", re: /\b(you can buy agricultur|eligible to (buy|purchase)|as per (the )?law|legally,? you|you are allowed to purchase|no legal (issue|problem))\b/i },
  { rule: "forecast", re: /\b(will appreciate|guaranteed returns?|prices? will (go up|rise|increase)|good investment|sure(-| )shot|double your)\b/i },
  // "Negotiable" may appear as a listing fact; offering to negotiate may not.
  { rule: "negotiation", re: /\b(discount|we can reduce|reduce the price|best price for you|price is flexible|special price|negotiable if)\b/i },
  { rule: "claims_human", re: /\b(i am (a )?human|i'?m (a )?human|not a bot|speaking to (me|josh) personally|this is josh speaking)\b/i },
  { rule: "off_brand", re: /(\p{Extended_Pictographic}|!{2,}|\b(amazing|hurry|don'?t miss|limited time|great choice|fantastic|excellent choice)\b)/iu },
];

export type GuardrailContext = {
  /** Every rupee figure the draft is permitted to repeat: the retrieved context. */
  quotableText: string;
  /** Owner-only notes that must never reach a customer. */
  internalNotes: string[];
};

export function checkDraft(draft: string, context: GuardrailContext): GuardrailVerdict {
  for (const { rule, re } of PATTERNS) {
    const match = re.exec(draft);
    if (match) return { ok: false, rule, evidence: match[0] };
  }

  // A leak is judged on a distinctive prefix rather than the whole note: the
  // model paraphrases, and an exact-match test would catch almost nothing.
  for (const note of context.internalNotes) {
    const probe = note.trim().slice(0, 30);
    if (probe.length >= 12 && draft.includes(probe)) {
      return { ok: false, rule: "internal_leak", evidence: probe };
    }
  }

  const allowed = extractRupees(context.quotableText);
  for (const value of extractRupees(draft)) {
    if (!allowed.has(value)) {
      return { ok: false, rule: "invented_price", evidence: `₹${value.toLocaleString("en-IN")}` };
    }
  }

  return { ok: true };
}

/** What the model is told after a block, so the retry fixes the actual problem. */
export const RETRY_INSTRUCTION: Record<GuardrailRule, string> = {
  invented_price:
    "Your last draft quoted a rupee figure that is not in the PROPERTIES or KNOWLEDGE blocks. Rewrite it without any price you were not given.",
  title_assertion:
    "Your last draft asserted that a title is clear. Rewrite it: independent counsel runs the chain-of-title audit and the buyer receives it in the dossier.",
  legal_advice:
    "Your last draft gave legal or eligibility advice. Rewrite it: that is a question for the concierge, not for you.",
  forecast:
    "Your last draft forecast prices, returns or appreciation. Rewrite it with no forward-looking claim.",
  negotiation:
    "Your last draft negotiated or implied a discount. Rewrite it: the concierge discusses numbers on the call.",
  claims_human:
    "Your last draft implied you are human. Rewrite it: you are the Josh Properties desk assistant and can connect the concierge.",
  internal_leak:
    "Your last draft repeated an internal note. Rewrite it using only what a customer may be told.",
  off_brand:
    "Your last draft used emoji, exclamation marks or sales language. Rewrite it plainly and calmly.",
};

/** Sent when even the retries fail. Says nothing, promises nothing, escalates. */
export const SAFE_FALLBACK =
  "Let me have the concierge come back to you on that directly.";
