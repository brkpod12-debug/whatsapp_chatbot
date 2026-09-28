import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";
import type { LeadListRow } from "./leads";

const row = (partial: Partial<LeadListRow> = {}): LeadListRow => ({
  id: "1",
  conversationId: "c1",
  name: "Rahul M",
  waId: "919000000001",
  intent: "buy",
  assetClass: "farmland",
  locality: "Shankarpally",
  budgetBand: "1_3cr",
  timelineMonths: 2,
  score: 90,
  temperature: "HOT",
  stage: "call_booked",
  tags: ["NRI"],
  source: "whatsapp",
  nextAction: null,
  nextActionDue: null,
  updatedAt: "2026-09-17T10:00:00Z",
  ...partial,
});

describe("toCsv", () => {
  it("writes a header and one line per lead", () => {
    const lines = toCsv([row(), row({ id: "2" })]).split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith("name,whatsapp,")).toBe(true);
    expect(lines[1]).toContain("Rahul M");
  });

  it("quotes a field containing a comma", () => {
    expect(toCsv([row({ locality: "Shankarpally, Ranga Reddy" })])).toContain(
      '"Shankarpally, Ranga Reddy"'
    );
  });

  it("doubles an embedded quote rather than breaking the row", () => {
    expect(toCsv([row({ name: 'Rahul "Raj" M' })])).toContain('"Rahul ""Raj"" M"');
  });

  it("quotes a field containing a newline", () => {
    expect(toCsv([row({ nextAction: "call back\nafter 6pm" })])).toContain(
      '"call back\nafter 6pm"'
    );
  });

  it("writes an empty cell for a null, not the word null", () => {
    const csv = toCsv([row({ locality: null, nextAction: null })]);
    expect(csv).not.toContain("null");
  });

  it("flattens tags to a space-separated cell", () => {
    expect(toCsv([row({ tags: ["NRI", "REPEAT"] })])).toContain("NRI REPEAT");
  });

  it("returns just the header for no leads", () => {
    expect(toCsv([]).split("\r\n")).toHaveLength(1);
  });
});
