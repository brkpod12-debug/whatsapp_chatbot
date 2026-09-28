import { describe, expect, it } from "vitest";
import { parseKnowledgeFile } from "./knowledge-md";

describe("parseKnowledgeFile", () => {
  it("reads a heading and its body", () => {
    const [entry] = parseKnowledgeFile("faq", "## How to start\n\nBook a call.\n");
    expect(entry).toMatchObject({
      category: "faq",
      title: "How to start",
      content: "Book a call.",
      priority: 100,
      pinned: false,
      scope: "global",
    });
  });

  it("reads directives and strips them from the body", () => {
    const [entry] = parseKnowledgeFile(
      "faq",
      "## Title check\nkeywords: Title, Counsel\npriority: 500\nscope: asset_class=farmland\nexpires: 2026-12-31\n\nCounsel runs the audit.\n"
    );
    expect(entry).toMatchObject({
      keywords: ["title", "counsel"],
      priority: 500,
      scope: "asset_class",
      scopeValue: "farmland",
      expiresAt: "2026-12-31",
      content: "Counsel runs the audit.",
    });
  });

  it("pins anything at priority 900 or above without being told twice", () => {
    const [entry] = parseKnowledgeFile("company", "## Who we are\npriority: 950\n\nA firm.\n");
    expect(entry.pinned).toBe(true);
  });

  it("splits several sections and leaves h3 inside the body", () => {
    const entries = parseKnowledgeFile(
      "faq",
      "## One\n\nBody one.\n\n### A sub-heading\n\nStill one.\n\n## Two\n\nBody two.\n"
    );
    expect(entries).toHaveLength(2);
    expect(entries[0].content).toContain("### A sub-heading");
    expect(entries[1].title).toBe("Two");
  });

  it("stops treating lines as directives once prose starts", () => {
    // 'priority: high' inside prose must not be read as a directive.
    const [entry] = parseKnowledgeFile(
      "faq",
      "## Note\n\nThe survey is the priority: high accuracy matters.\n"
    );
    expect(entry.priority).toBe(100);
    expect(entry.content).toContain("priority: high");
  });

  it("drops a heading with no body rather than seeding an empty answer", () => {
    expect(parseKnowledgeFile("faq", "## Empty\n\n## Real\n\nBody.\n")).toHaveLength(1);
  });

  it("returns nothing for a file with no headings", () => {
    expect(parseKnowledgeFile("faq", "Just some prose.\n")).toEqual([]);
  });

  it("handles CRLF files, which is what Windows editors write", () => {
    const [entry] = parseKnowledgeFile("faq", "## Title\r\nkeywords: a, b\r\n\r\nBody.\r\n");
    expect(entry).toMatchObject({ title: "Title", keywords: ["a", "b"], content: "Body." });
  });
});
