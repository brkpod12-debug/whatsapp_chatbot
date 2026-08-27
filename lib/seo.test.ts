import { describe, expect, it } from "vitest";
import { clampDescription, locality } from "./seo";


describe("clampDescription", () => {
  it("leaves short text alone and collapses whitespace", () => {
    expect(clampDescription("Flats in  Nizampet.\nHyderabad.")).toBe(
      "Flats in Nizampet. Hyderabad."
    );
  });

  it("cuts on a word boundary and never exceeds the limit", () => {
    const long = "word ".repeat(80);
    const out = clampDescription(long, 60);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe("locality", () => {
  it("drops a trailing city so titles do not read 'Nizampet, Hyderabad, Hyderabad'", () => {
    expect(locality("Nizampet, Hyderabad", "Hyderabad")).toBe("Nizampet");
    expect(locality("Pragathi Nagar, hyderabad ", "Hyderabad")).toBe("Pragathi Nagar");
  });

  it("keeps a location that does not end in the city", () => {
    expect(locality("Shankarpally", "Hyderabad")).toBe("Shankarpally");
    expect(locality("Hyderabad Central", "Hyderabad")).toBe("Hyderabad Central");
  });
});
