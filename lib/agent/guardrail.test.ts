import { describe, expect, it } from "vitest";
import { checkDraft, extractRupees, type GuardrailContext } from "./guardrail";

const ctx = (quotableText: string, internalNotes: string[] = []): GuardrailContext => ({
  quotableText,
  internalNotes,
});

const CONTEXT = ctx("Chevella River Plate, 6 acres, ₹3.6 Cr. The Pragathi Nagar, ₹49-52 Lakhs.");

describe("extractRupees", () => {
  it("reads crore and lakh figures", () => {
    expect(extractRupees("₹3.6 Cr")).toEqual(new Set([36_000_000]));
    expect(extractRupees("65 Lakhs")).toEqual(new Set([6_500_000]));
  });

  it("counts both ends of a range as quoted", () => {
    expect(extractRupees("49-52 Lakhs")).toEqual(new Set([4_900_000, 5_200_000]));
  });

  it("reads a figure written out in full", () => {
    expect(extractRupees("Rs 13500000")).toEqual(new Set([13_500_000]));
    expect(extractRupees("₹1,35,00,000")).toEqual(new Set([13_500_000]));
  });

  it("ignores numbers that are not money", () => {
    expect(extractRupees("6 acres, 2 BHK, 1185 sq.ft, Phase 1")).toEqual(new Set());
  });
});

describe("checkDraft", () => {
  it("passes a plain in-brand reply", () => {
    const draft = "Chevella River Plate is 6 acres at ₹3.6 Cr. May I have your name for the dossier?";
    expect(checkDraft(draft, CONTEXT)).toEqual({ ok: true });
  });

  it("blocks a price that is not in the context", () => {
    const v = checkDraft("It is available at ₹2.9 Cr.", CONTEXT);
    expect(v).toMatchObject({ ok: false, rule: "invented_price" });
  });

  it("allows the high end of a quoted range", () => {
    expect(checkDraft("Pragathi Nagar starts at 49 Lakhs and goes to 52 Lakhs.", CONTEXT).ok).toBe(true);
  });

  it.each([
    ["the title is clear on this plot", "title_assertion"],
    ["Yes, legally you may purchase it.", "legal_advice"],
    ["This will appreciate strongly.", "forecast"],
    ["I can arrange a discount for you.", "negotiation"],
    ["I am a human, not a bot.", "claims_human"],
    ["Amazing choice! Hurry!!", "off_brand"],
    ["Great choice.", "off_brand"],
    ["Ready to move in 🔥", "off_brand"],
  ])("blocks %s", (draft, rule) => {
    expect(checkDraft(draft, CONTEXT)).toMatchObject({ ok: false, rule });
  });

  it("blocks a paraphrase that carries an internal note verbatim", () => {
    const notes = ["owner will take 3.2 if paid in 30 days"];
    const v = checkDraft("Between us, owner will take 3.2 if paid in 30 days.", ctx("", notes));
    expect(v).toMatchObject({ ok: false, rule: "internal_leak" });
  });

  it("does not trip on a note fragment too short to be distinctive", () => {
    expect(checkDraft("Yes, it is available.", ctx("", ["yes"])).ok).toBe(true);
  });

  it("lets the listing be described as negotiable without offering to negotiate", () => {
    // 'Negotiable' is a listing fact from Sanity; 'negotiable if' is a bargain.
    expect(checkDraft("The price is quoted as negotiable.", CONTEXT).ok).toBe(true);
    expect(checkDraft("It is negotiable if you decide today.", CONTEXT).ok).toBe(false);
  });

  it("reports the matched text so /audit can show what was stopped", () => {
    const v = checkDraft("prices will rise here", CONTEXT);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.evidence).toMatch(/prices will rise/i);
  });
});
