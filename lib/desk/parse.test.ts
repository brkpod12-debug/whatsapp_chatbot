import { describe, expect, it } from "vitest";
import {
  parseArea,
  parseBhk,
  parseLocality,
  parsePrice,
  parseStatus,
} from "./parse";

// Every string below is copied from the live `production` dataset, not made up.

describe("parsePrice", () => {
  it("reads a plain lakh price", () => {
    expect(parsePrice("₹65 Lakhs (Negotiable)")).toEqual({
      inr: 6_500_000,
      maxInr: null,
      negotiable: true,
    });
  });

  it("reads a lakh range, keeping both ends quotable", () => {
    expect(parsePrice("₹49-52 Lakhs (Negotiable)")).toEqual({
      inr: 4_900_000,
      maxInr: 5_200_000,
      negotiable: true,
    });
  });

  it("does not read (Fixed) as negotiable", () => {
    expect(parsePrice("₹56 Lakhs (Fixed)")).toEqual({
      inr: 5_600_000,
      maxInr: null,
      negotiable: false,
    });
  });

  it("reads crores, including decimals", () => {
    expect(parsePrice("₹3.6 Cr").inr).toBe(36_000_000);
    expect(parsePrice("₹1.6 Cr").inr).toBe(16_000_000);
    expect(parsePrice("₹2.2 Cr").inr).toBe(22_000_000);
    expect(parsePrice("₹4.4 Cr").inr).toBe(44_000_000);
  });

  it("strips thousands separators", () => {
    expect(parsePrice("₹1,20,00,000").inr).toBe(null); // no unit word, not a guess
    expect(parsePrice("₹1,250 Lakhs").inr).toBe(125_000_000);
  });

  it("handles an en-dash range", () => {
    expect(parsePrice("₹1–3 Cr")).toEqual({
      inr: 10_000_000,
      maxInr: 30_000_000,
      negotiable: false,
    });
  });

  it("returns nulls rather than guessing", () => {
    expect(parsePrice("Price on application")).toEqual({
      inr: null,
      maxInr: null,
      negotiable: false,
    });
    expect(parsePrice(null).inr).toBe(null);
  });
});

describe("parseArea", () => {
  it("splits area and UDS out of one combined string", () => {
    expect(parseArea("1,185 sq.ft · UDS 34 sq.yds")).toEqual({
      value: 1185,
      unit: "sqft",
      udsSqyds: 34,
    });
    expect(parseArea("1,015 sq.ft · UDS 26 sq.yds")).toEqual({
      value: 1015,
      unit: "sqft",
      udsSqyds: 26,
    });
  });

  it("reads a bare area with no UDS", () => {
    expect(parseArea("1,200 sq.ft")).toEqual({
      value: 1200,
      unit: "sqft",
      udsSqyds: null,
    });
  });

  it("reads acres", () => {
    expect(parseArea("6 acres")).toEqual({ value: 6, unit: "acres", udsSqyds: null });
    expect(parseArea("10 acres")).toEqual({ value: 10, unit: "acres", udsSqyds: null });
  });

  it("takes the low end of an acreage range", () => {
    expect(parseArea("2–3 acres")).toEqual({
      value: 2,
      unit: "acres",
      udsSqyds: null,
    });
  });

  it("returns nulls for unparseable text", () => {
    expect(parseArea("Ask the desk")).toEqual({
      value: null,
      unit: null,
      udsSqyds: null,
    });
  });
});

describe("parseBhk", () => {
  it("reads the bed count", () => {
    expect(parseBhk("2 BHK")).toBe(2);
    expect(parseBhk("3 BHK")).toBe(3);
    expect(parseBhk(undefined)).toBe(null);
  });
});

describe("parseStatus", () => {
  it("maps every Sanity label to the mirror enum", () => {
    expect(parseStatus("Available")).toBe("available");
    expect(parseStatus("Under Offer")).toBe("under_offer");
    expect(parseStatus("Coming Soon")).toBe("coming_soon");
    expect(parseStatus("Limited")).toBe("limited");
    expect(parseStatus("Reserved")).toBe("reserved");
    expect(parseStatus("Sold")).toBe("sold");
  });
});

describe("parseLocality", () => {
  it("keeps the locality, drops the city", () => {
    expect(parseLocality("Pragathi Nagar, Hyderabad")).toBe("Pragathi Nagar");
    expect(parseLocality("Nizampet, Hyderabad")).toBe("Nizampet");
    expect(parseLocality("")).toBe(null);
  });
});
