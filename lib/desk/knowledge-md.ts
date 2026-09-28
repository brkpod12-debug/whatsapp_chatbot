/**
 * Parses an authoring file in `knowledge/` into rows for `knowledge_entries`.
 *
 * Deliberately a tiny format rather than front-matter plus a YAML dependency:
 * a heading, a few `key: value` directive lines, then prose. The person editing
 * these is the concierge, not an engineer.
 */

export type ParsedEntry = {
  category: string;
  title: string;
  content: string;
  keywords: string[];
  priority: number;
  pinned: boolean;
  scope: string;
  scopeValue: string | null;
  expiresAt: string | null;
};

const DIRECTIVE = /^(keywords|priority|scope|expires|pinned)\s*:\s*(.*)$/i;

export function parseKnowledgeFile(category: string, markdown: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  // Split on level-two headings only. A `###` inside a body stays in the body.
  const sections = markdown.split(/^##\s+/m).slice(1);

  for (const section of sections) {
    const lines = section.split(/\r?\n/);
    const title = (lines.shift() ?? "").trim();
    if (!title) continue;

    let keywords: string[] = [];
    let priority = 100;
    let pinned = false;
    let scope = "global";
    let scopeValue: string | null = null;
    let expiresAt: string | null = null;

    // Directives run until the first line that is not one. Blank lines between
    // directives are allowed; a prose line ends the block.
    while (lines.length > 0) {
      const line = lines[0].trim();
      if (line === "") {
        lines.shift();
        continue;
      }

      const match = DIRECTIVE.exec(line);
      if (!match) break;
      lines.shift();

      const [, key, raw] = match;
      const value = raw.trim();

      switch (key.toLowerCase()) {
        case "keywords":
          keywords = value
            .split(",")
            .map((k) => k.trim().toLowerCase())
            .filter(Boolean);
          break;
        case "priority": {
          const n = Number(value);
          if (Number.isFinite(n)) priority = n;
          break;
        }
        case "pinned":
          pinned = /^(true|yes|1)$/i.test(value);
          break;
        case "scope": {
          const [kind, ...rest] = value.split("=");
          scope = kind.trim() || "global";
          scopeValue = rest.join("=").trim() || null;
          break;
        }
        case "expires":
          expiresAt = value || null;
          break;
      }
    }

    const content = lines.join("\n").trim();
    if (!content) continue;

    entries.push({
      category,
      title,
      content,
      keywords,
      priority,
      // Anything the prompt always carries is pinned by definition.
      pinned: pinned || priority >= 900,
      scope,
      scopeValue,
      expiresAt,
    });
  }

  return entries;
}
