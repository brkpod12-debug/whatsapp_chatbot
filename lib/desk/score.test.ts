import { describe, expect, it } from "vitest";
import { bypassesScoring, calculateLeadScore, DEFAULT_THRESHOLDS } from "./score";

describe("calculateLeadScore", () => {
  it("scores an empty lead cold at zero", () => {
    const r = calculateLeadScore({});
    expect(r).toMatchObject({ score: 0, temperature: "COLD" });
    expect(r.signals).toEqual([]);
  });

  it("scores the spec's worked example hot", () => {
    // Viewing + dossier + named holding + in-band budget + soon.
    const r = calculateLeadScore({
      viewingRequested: true,
      dossierRequested: true,
      propertyOfInterest: "uuid",
      budgetBand: "3_6cr",
      timelineMonths: 1,
      assetClass: "farmland",
    });
    expect(r.score).toBe(100);
    expect(r.temperature).toBe("HOT");
  });

  it("puts a brochure-only enquiry in warm", () => {
    const r = calculateLeadScore({ dossierRequested: true, assetClass: "apartment", budgetBand: "1_3cr" });
    expect(r.score).toBe(45);
    expect(r.temperature).toBe("WARM");
  });

  it("leaves a general enquiry cold", () => {
    expect(calculateLeadScore({ assetClass: "villa" }).temperature).toBe("COLD");
  });

  it("does not credit a budget band the firm does not serve", () => {
    expect(calculateLeadScore({ budgetBand: "6cr_plus" }).score).toBe(0);
    expect(calculateLeadScore({ budgetBand: "unsure" }).score).toBe(0);
  });

  it("clamps into 0-100 in both directions", () => {
    const floored = calculateLeadScore({ assetClass: "villa", tags: ["PRICE_FISHING", "OUT_OF_AREA"] });
    expect(floored.score).toBe(0);

    const capped = calculateLeadScore({
      callBookedAt: "2026-09-18T05:30:00Z",
      viewingRequested: true,
      dossierRequested: true,
      propertyOfInterest: "uuid",
      budgetBand: "1_3cr",
      timelineMonths: 1,
      assetClass: "apartment",
      tags: ["NRI", "REPEAT"],
    });
    expect(capped.score).toBe(100);
  });

  it("explains itself through the signals it returns", () => {
    const r = calculateLeadScore({ viewingRequested: true, assetClass: "farmland" });
    expect(r.signals).toEqual([
      { label: "Viewing requested", points: 25 },
      { label: "Asset class known", points: 10 },
    ]);
  });

  it("honours thresholds the owner has moved", () => {
    const lead = { dossierRequested: true, assetClass: "villa" }; // 30 points
    expect(calculateLeadScore(lead, DEFAULT_THRESHOLDS).temperature).toBe("COLD");
    expect(calculateLeadScore(lead, { hot: 60, warm: 25 }).temperature).toBe("WARM");
  });

  it("treats a 3 month timeline as soon and a 4 month one as not", () => {
    expect(calculateLeadScore({ timelineMonths: 3 }).score).toBe(15);
    expect(calculateLeadScore({ timelineMonths: 4 }).score).toBe(0);
  });
});

describe("bypassesScoring", () => {
  it("routes sellers and brokers out of the buyer pipeline", () => {
    expect(bypassesScoring(["SELLER"])).toBe(true);
    expect(bypassesScoring(["BROKER"])).toBe(true);
  });

  it("leaves ordinary buyers in it", () => {
    expect(bypassesScoring(["NRI"])).toBe(false);
    expect(bypassesScoring(null)).toBe(false);
  });
});
